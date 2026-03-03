import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const getEnv = (key) => {
    try {
        // Vite / Vercel Production
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            return import.meta.env[key];
        }
    } catch (e) { }

    // Provide syntactically valid mock strings to prevent Supabase crash
    if (key === 'VITE_SUPABASE_URL') return 'https://mock.supabase.co';
    return 'mock_anon_key_for_local_testing';
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
