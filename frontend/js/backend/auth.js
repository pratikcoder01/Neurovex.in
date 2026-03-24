import { supabase } from './supabase.js';

export const signUp = async (email, password, fullName, purpose) => {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
            const { error: profileError } = await supabase.from('profiles').insert([
                { id: data.user.id, full_name: fullName, email, purpose }
            ]);
            if (profileError) throw profileError;
        }
        return { data, error: null };
    } catch (error) {
        
        return { data: null, error };
    }
};

export const signIn = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        
        return { data: null, error };
    }
};

export const signInWithGoogle = async () => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        
        return { data: null, error };
    }
};

export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { error: null };
    } catch (error) {
        
        return { error };
    }
};

export const getCurrentUser = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (user) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (profileError) throw profileError;
            return { user: { ...user, profile }, error: null };
        }
        return { user: null, error: null };
    } catch (error) {
        
        return { user: null, error };
    }
};
