"""Create initial admin user and agent record.

Usage:
  cd backend
  python -m scripts.seed_admin

Requires .env with DB credentials and ADMIN_DEFAULT_PASSWORD set.
"""
import sys
import os
import uuid
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_db
from app.admin.auth import hash_password
from app.core.config import settings


def seed():
    email = settings.ADMIN_DEFAULT_EMAIL
    password = settings.ADMIN_DEFAULT_PASSWORD

    if not password:
        print("ERROR: Set ADMIN_DEFAULT_PASSWORD in .env")
        print("Example: ADMIN_DEFAULT_PASSWORD=Admin@2026")
        return

    pw_hash = hash_password(password)
    user_id = uuid.uuid4()
    agent_id = uuid.uuid4()

    with get_db() as conn:
        cur = conn.cursor()

        # Check if admin already exists
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            print(f"Admin {email} already exists. Updating password...")
            cur.execute(
                "UPDATE users SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{password_hash}', %s) WHERE email = %s",
                (json.dumps(pw_hash), email),
            )
            print("Password updated.")
            return

        # Create user
        cur.execute("""
            INSERT INTO users (id, email, display_name, user_type, metadata, is_verified)
            VALUES (%s, %s, 'Admin', 'admin', %s, TRUE)
        """, (str(user_id), email, json.dumps({"password_hash": pw_hash})))

        # Create agent record
        cur.execute("""
            INSERT INTO agents (id, user_id, department, status, is_supervisor, max_concurrent_chats)
            VALUES (%s, %s, 'registration', 'offline', TRUE, 10)
        """, (str(agent_id), str(user_id)))

        print(f"Admin created successfully!")
        print(f"  Email: {email}")
        print(f"  User ID: {user_id}")
        print(f"  Agent ID: {agent_id}")
        print(f"\nLogin at the admin dashboard with these credentials.")


if __name__ == "__main__":
    seed()
