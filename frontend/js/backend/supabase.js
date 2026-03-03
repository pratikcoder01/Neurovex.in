import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const getEnv = (key) => {
    try {
        // Vite / Vercel Production
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            return import.meta.env[key];
        }
    } catch (e) { }
    return 'mock_key';
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
