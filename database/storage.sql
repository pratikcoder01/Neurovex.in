INSERT INTO storage.buckets (id, name, public) 
VALUES ('eeg-sessions', 'eeg-sessions', true)
ON CONFLICT (id) DO NOTHING;



CREATE POLICY "Authenticated users upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'eeg-sessions' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Only owner can read their files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'eeg-sessions' 
        AND auth.uid() = owner
    );
