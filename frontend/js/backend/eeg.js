import { supabase } from './supabase.js';

export const addEEGData = async (sessionId, rawValue, focusLevel) => {
    try {
        const { data, error } = await supabase
            .from('eeg_data')
            .insert([{
                session_id: sessionId,
                raw_value: rawValue,
                focus_level: focusLevel
            }])
            .select();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        
        return { data: null, error };
    }
};

export const subscribeToLiveEEG = (sessionId, handleEEGUpdate) => {
    return supabase
        .channel(`eeg-session-${sessionId}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'eeg_data', filter: `session_id=eq.${sessionId}` },
            (payload) => handleEEGUpdate(payload.new)
        )
        .subscribe();
};
