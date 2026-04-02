"""Create 3 demo users with Qatari names for testing.

Usage:
  cd backend
  python -m scripts.seed_demo_users
"""
import sys
import os
import uuid
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_db
from app.admin.auth import hash_password

DEMO_USERS = [
    {
        "email": "fatma@qaa.edu.qa",
        "password": "Fatma@2026",
        "name": "Fatma Al-Thani",
        "role": "supervisor",
        "department": "student_affairs",
        "is_supervisor": True,
        "max_concurrent_chats": 8,
    },
    {
        "email": "khalid@qaa.edu.qa",
        "password": "Khalid@2026",
        "name": "Khalid Al-Mansouri",
        "role": "agent",
        "department": "registration",
        "is_supervisor": False,
        "max_concurrent_chats": 5,
    },
    {
        "email": "noura@qaa.edu.qa",
        "password": "Noura@2026",
        "name": "Noura Al-Sulaiti",
        "role": "agent",
        "department": "it_support",
        "is_supervisor": False,
        "max_concurrent_chats": 5,
    },
]


def seed():
    with get_db() as conn:
        cur = conn.cursor()

        for u in DEMO_USERS:
            cur.execute("SELECT id FROM users WHERE email = %s", (u["email"],))
            if cur.fetchone():
                print(f"  {u['email']} already exists, skipping.")
                continue

            user_id = str(uuid.uuid4())
            agent_id = str(uuid.uuid4())
            pw_hash = hash_password(u["password"])

            cur.execute(
                """INSERT INTO users (id, email, display_name, user_type, metadata, is_verified)
                   VALUES (%s, %s, %s, %s, %s, TRUE)""",
                (user_id, u["email"], u["name"], u["role"], json.dumps({"password_hash": pw_hash})),
            )

            cur.execute(
                """INSERT INTO agents (id, user_id, department, status, is_supervisor, max_concurrent_chats)
                   VALUES (%s, %s, %s, 'offline', %s, %s)""",
                (agent_id, user_id, u["department"], u["is_supervisor"], u["max_concurrent_chats"]),
            )

            print(f"  Created {u['name']} ({u['role']}) - {u['email']}")

    print("\nDemo users ready!")


if __name__ == "__main__":
    seed()
