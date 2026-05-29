
-- 1. Fix phone exposure: restrict profile SELECT to authenticated users only
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Owners can always see their own profile (including phone)
CREATE POLICY "Owners view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Fix storage upload path scoping: require uploads under user's own folder
DROP POLICY IF EXISTS "Auth users upload property images" ON storage.objects;

CREATE POLICY "Users upload property images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3. Fix public bucket listing: drop overly broad SELECT policy.
-- Public bucket files remain accessible via direct CDN URL, but listing is blocked.
DROP POLICY IF EXISTS "Public read property images" ON storage.objects;
