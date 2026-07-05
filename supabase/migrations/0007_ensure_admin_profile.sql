-- Root-cause fix for silently-failing admin Settings saves.
--
-- src/app/(admin)/layout.tsx has a hardcoded bypass for this exact user ID
-- that skips the `profiles.role = 'admin'` check at the Next.js layout
-- level (page access only). That bypass was added because this user's
-- profile row was missing or not marked admin — but every RLS policy on
-- products / daily_harvest_logs / store_settings / gallery_shots /
-- storage.objects checks `profiles.role = 'admin'` directly at the
-- Postgres level, with no equivalent bypass. The admin Settings page
-- writes through the anon-key browser client, so every INSERT/UPDATE was
-- silently matching zero rows under RLS — Supabase's update()/upsert()
-- report that as success (no error), which is why saves looked like they
-- worked but never reached the storefront.
--
-- This grants the account real admin rights in the database so RLS
-- actually authorizes the writes, instead of only the page route being
-- bypassed. Once this is applied, the layout.tsx bypass hatch is
-- redundant and should be removed.
-- Guarded with an EXISTS check against auth.users (not a bare VALUES
-- insert) so this migration is a safe no-op in any environment — CI, a
-- teammate's local Supabase, a fresh project — where this specific auth
-- user doesn't exist, instead of failing on the profiles->auth.users FK.
INSERT INTO public.profiles (id, role)
SELECT id, 'admin' FROM auth.users WHERE id = 'e56ec4da-be33-46b8-bf3f-1d25881637fb'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
