ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE eeg_data ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can only access their own profile"
    ON profiles FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Sessions Policies
CREATE POLICY "Users can only access their own sessions"
    ON sessions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- EEG Data Policies
CREATE POLICY "Users can only access eeg_data linked to their sessions"
    ON eeg_data FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = eeg_data.session_id
            AND sessions.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = eeg_data.session_id
            AND sessions.user_id = auth.uid()
        )
    );
