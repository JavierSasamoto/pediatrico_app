/*
# Storage policies for comprobantes bucket

Allows authenticated users to upload payment receipt screenshots to the `comprobantes` storage bucket, and anyone to read them (public bucket).
*/

DROP POLICY IF EXISTS "Allow authenticated uploads to comprobantes" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to comprobantes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comprobantes');

DROP POLICY IF EXISTS "Allow public read of comprobantes" ON storage.objects;
CREATE POLICY "Allow public read of comprobantes"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'comprobantes');
