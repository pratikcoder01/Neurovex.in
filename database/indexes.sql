CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_eeg_data_session_id ON eeg_data(session_id);
CREATE INDEX idx_eeg_data_timestamp ON eeg_data(timestamp DESC);
