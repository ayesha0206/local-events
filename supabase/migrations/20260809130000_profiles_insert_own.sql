-- Allow a signed-in user to create their own profile row
-- (fallback if auth → profile trigger did not run).

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);
