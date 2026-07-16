import psycopg2
import os

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/MTCbuildup')

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

print("Updating Priority enum values in WorkOrder table...")

# Update semua data lama ke nilai baru
updates = [
    ("URGENT", "HIGH"),
    ("DARURAT", "HIGH"),
    ("HIGH", "MEDIUM"),
    ("PROSES_BERHENTI", "MEDIUM"),
    ("MEDIUM", "LOW"),
    ("LOW", "LOW"),
    ("PROSES_BERJALAN", "LOW"),
]

for old_val, new_val in updates:
    cur.execute(
        'UPDATE "WorkOrder" SET "priority" = %s WHERE "priority" = %s',
        (new_val, old_val)
    )
    print(f"  Updated {old_val} -> {new_val}")

conn.commit()
print("\nDone! Now run: npx prisma db push --accept-data-loss")
cur.close()
conn.close()
