-- Enable Row Level Security (RLS) on every table in the public schema.
--
-- The application talks to Postgres exclusively through Prisma using the
-- database owner role. Table owners bypass RLS (no FORCE ROW LEVEL SECURITY is
-- set), so the app keeps full read/write access without any policy. Enabling
-- RLS with zero policies makes the Supabase Data API (PostgREST/pg_graphql)
-- deny `anon` and `authenticated` by default, closing the tables to the public
-- REST/GraphQL endpoints while leaving Prisma untouched.
--
-- `_prisma_migrations` is created automatically by Prisma; enabling RLS on it
-- clears the ERROR-level `rls_disabled_in_public` Supabase security advisor.
-- All statements are idempotent (re-enabling RLS is a no-op), so applying this
-- migration against a database that was already hardened by hand is safe.

-- EnableRLS
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;

-- EnableRLS
ALTER TABLE "Subscriber" ENABLE ROW LEVEL SECURITY;

-- EnableRLS
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;

-- EnableRLS
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
