import os
import psycopg2
import psycopg2.extras
from contextlib import contextmanager
from app.core.config import settings

psycopg2.extras.register_uuid()


def get_connection():
    # On Cloud Run, use Unix socket via Cloud SQL Auth Proxy
    if settings.CLOUD_SQL_INSTANCE:
        socket_dir = os.getenv("DB_SOCKET_DIR", "/cloudsql")
        return psycopg2.connect(
            host=f"{socket_dir}/{settings.CLOUD_SQL_INSTANCE}",
            dbname=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
        )
    # Local development: use TCP connection
    return psycopg2.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        sslmode="require",
    )


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
