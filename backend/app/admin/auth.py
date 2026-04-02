import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from fastapi import Request, HTTPException, Depends
from app.core.config import settings
from app.core.database import get_db


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(user_id: str, email: str, role: str, agent_id: str = None, name: str = None) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "agent_id": agent_id,
        "name": name or email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


def get_current_user(request: Request) -> dict:
    token = request.cookies.get("qaa_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return decode_token(token)


def get_current_user_or_none(request: Request):
    try:
        return get_current_user(request)
    except HTTPException:
        return None


def require_role(*roles):
    def checker(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(403, "Insufficient permissions")
        return user
    return checker


def authenticate_user(email: str, password: str) -> dict | None:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT u.id, u.email, u.display_name, u.user_type,
                   u.metadata->>'password_hash' AS pw_hash,
                   a.id AS agent_id, a.department::text
            FROM users u
            LEFT JOIN agents a ON a.user_id = u.id
            WHERE u.email = %s AND u.user_type IN ('agent', 'supervisor', 'admin')
        """, (email,))
        row = cur.fetchone()

    if not row or not row[4] or not verify_password(password, row[4]):
        return None

    return {
        "user_id": str(row[0]),
        "email": row[1],
        "name": row[2],
        "role": row[3],
        "agent_id": str(row[5]) if row[5] else None,
        "department": row[6],
    }
