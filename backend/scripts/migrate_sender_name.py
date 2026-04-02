"""Add sender_name column to messages table for agent tracking."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import get_db

def migrate():
    with get_db() as conn:
        cur = conn.cursor()
        # Check if column exists
        cur.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'messages' AND column_name = 'sender_name'
        """)
        if cur.fetchone():
            print("Column sender_name already exists, skipping.")
            return

        cur.execute("ALTER TABLE messages ADD COLUMN sender_name VARCHAR(100)")
        print("Added sender_name column to messages table.")

if __name__ == "__main__":
    migrate()
