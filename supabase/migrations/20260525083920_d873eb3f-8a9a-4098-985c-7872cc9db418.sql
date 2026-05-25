
-- Fix set_updated_at search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Revoke execute from public/anon/authenticated on SECURITY DEFINER fns
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Replace broad public storage SELECT with property-images bucket scoped access
DROP POLICY IF EXISTS "Public read property images" ON storage.objects;
CREATE POLICY "Public read property images" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');
-- Note: bucket is public so listing endpoints already restricted by API; we keep read open for image display.
