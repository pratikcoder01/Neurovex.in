-- Profiles Table
CREATE TABLE profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    email text,
    role text default 'user',
    purpose text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sessions Table
CREATE TABLE sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade not null,
    start_time timestamp with time zone default timezone('utc'::text, now()) not null,
    end_time timestamp with time zone,
    avg_focus numeric,
    max_focus numeric,
    device_connected boolean default false,
    csv_url text
);

-- EEG Data Table
CREATE TABLE eeg_data (
    id bigint generated always as identity primary key,
    session_id uuid references sessions(id) on delete cascade not null,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
    raw_value numeric not null,
    focus_level numeric not null
);
