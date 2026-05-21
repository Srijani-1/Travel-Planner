import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Render gives postgres:// but psycopg2 needs postgresql://
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

migrations = [
    # Trip table additions
    """ALTER TABLE trips ADD COLUMN IF NOT EXISTS people_count INTEGER DEFAULT 1""",
    """ALTER TABLE trips ADD COLUMN IF NOT EXISTS rating_min INTEGER DEFAULT 3""",

    # Upvote deduplication tables
    """
    CREATE TABLE IF NOT EXISTS post_upvotes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_post_upvote UNIQUE (post_id, user_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS review_upvotes (
        id SERIAL PRIMARY KEY,
        review_id INTEGER NOT NULL REFERENCES place_reviews(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_review_upvote UNIQUE (review_id, user_id)
    )
    """,

    # Community groups — add created_by index for faster owner lookups
    """CREATE INDEX IF NOT EXISTS ix_community_groups_created_by ON community_groups(created_by)""",

    # Group memberships — add unique constraint to prevent duplicate memberships
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'uq_group_membership'
        ) THEN
            ALTER TABLE group_memberships
            ADD CONSTRAINT uq_group_membership UNIQUE (group_id, user_id);
        END IF;
    END $$
    """,
]

print("Running migrations...")
for i, sql in enumerate(migrations, 1):
    try:
        cur.execute(sql)
        conn.commit()
        print(f"  ✓ Migration {i} applied")
    except Exception as e:
        conn.rollback()
        print(f"  ✗ Migration {i} failed: {e}")

cur.close()
conn.close()
print("Done.")
