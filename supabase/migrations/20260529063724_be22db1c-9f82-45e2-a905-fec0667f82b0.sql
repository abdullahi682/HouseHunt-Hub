DROP POLICY IF EXISTS "Owners can update own properties" ON public.properties;

CREATE POLICY "Owners can update own properties"
ON public.properties
FOR UPDATE
USING (
  auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    auth.uid() = owner_id
    AND status = 'pending'::listing_status
  )
);