import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';

export const startSession = async () => {
    try {
        const { user } = await getCurrentUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('sessions')
            .insert([{ user_id: user.id, device_connected: true }])
            .select()
            .single();

        if (error) throw error;
        return { session: data, error: null };
    } catch (error) {
        
        return { session: null, error };
    }
};

export const endSession = async (sessionId, stats, csvUrl) => {
    try {
        const { data, error } = await supabase
            .from('sessions')
            .update({
                end_time: new Date().toISOString(),
                avg_focus: stats.avgFocus,
                max_focus: stats.maxFocus,
                csv_url: csvUrl
            })
            .eq('id', sessionId)
            .select()
            .single();

        if (error) throw error;
        return { session: data, error: null };
    } catch (error) {
        
        return { session: null, error };
    }
};

export const calculateAvgMax = (eegDataArray) => {
    if (!eegDataArray || eegDataArray.length === 0) return { avgFocus: 0, maxFocus: 0 };

    const sum = eegDataArray.reduce((acc, current) => acc + current.focus_level, 0);
    const max = Math.max(...eegDataArray.map(d => d.focus_level));

    return {
        avgFocus: parseFloat((sum / eegDataArray.length).toFixed(2)),
        maxFocus: max
    };
};

export const fetchSessionEEGData = async (sessionId) => {
    try {
        const { data, error } = await supabase
            .from('eeg_data')
            .select('timestamp, raw_value, focus_level')
            .eq('session_id', sessionId)
            .order('timestamp', { ascending: true });

        if (error) throw error;
        return { eegData: data, error: null };
    } catch (error) {
        
        return { eegData: null, error };
    }
};

export const generateAndUploadCSV = async (sessionId) => {
    try {
        const { eegData, error: fetchError } = await fetchSessionEEGData(sessionId);
        if (fetchError) throw fetchError;
        if (!eegData || eegData.length === 0) throw new Error("No EEG data available");

        const header = "timestamp,raw_value,focus_level\n";
        const csvContent = header + eegData.map(row => `${row.timestamp},${row.raw_value},${row.focus_level}`).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const fileName = `session-${sessionId}.csv`;

        const { user } = await getCurrentUser();
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('eeg-sessions')
            .upload(filePath, blob, { contentType: 'text/csv', upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('eeg-sessions')
            .getPublicUrl(filePath);

        return { url: publicUrl, error: null };
    } catch (error) {
        
        return { url: null, error };
    }
};

export const subscribeToSessions = (userId, handleSessionUpdate) => {
    return supabase
        .channel('user-sessions')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'sessions', filter: `user_id=eq.${userId}` },
            (payload) => handleSessionUpdate(payload)
        )
        .subscribe();
};
