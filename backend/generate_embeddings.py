"""One-time script to generate Vertex AI embeddings for all KB entries."""
import sys
import os
import subprocess
import psycopg2
import requests

# Get token from gcloud
token = sys.argv[1] if len(sys.argv) > 1 else ""
if not token:
    print("Usage: python generate_embeddings.py <access_token>")
    sys.exit(1)

VERTEX_URL = (
    "https://me-central1-aiplatform.googleapis.com/v1/"
    "projects/qaaw-492106/locations/me-central1/"
    "publishers/google/models/text-embedding-004:predict"
)

conn = psycopg2.connect(
    host="34.18.37.125", port=5432, dbname="qaa_dev",
    user="postgres", password="QaaDb@2026Sec", sslmode="require",
)
cur = conn.cursor()

cur.execute("SELECT id, question_en, question_ar, answer_en FROM kb_entries WHERE embedding IS NULL")
rows = cur.fetchall()
print(f"Generating embeddings for {len(rows)} entries...")

if not rows:
    print("No entries need embeddings.")
    conn.close()
    sys.exit(0)

# Combine question + answer for richer embeddings
texts = [f"{r[1]} {r[2]} {r[3][:200]}" for r in rows]
ids = [r[0] for r in rows]

resp = requests.post(
    VERTEX_URL,
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    json={"instances": [{"content": t} for t in texts], "parameters": {"outputDimensionality": 768}},
    timeout=30,
)

if resp.status_code != 200:
    print(f"ERROR: {resp.status_code} {resp.text[:500]}")
    sys.exit(1)

data = resp.json()
embeddings = [pred["embeddings"]["values"] for pred in data["predictions"]]
print(f"Got {len(embeddings)} embeddings, dim={len(embeddings[0])}")

for entry_id, emb in zip(ids, embeddings):
    cur.execute("UPDATE kb_entries SET embedding = %s WHERE id = %s", (str(emb), entry_id))

conn.commit()
print("All embeddings stored in DB")
conn.close()
