import { getCurrentUser, signOut } from './auth.js';
import { startSession, endSession, generateAndUploadCSV, calculateAvgMax, fetchSessionEEGData, subscribeToSessions } from './sessions.js';
import { addEEGData, subscribeToLiveEEG } from './eeg.js';

let currentSessionId = null;
let currentUser = null;
let realtimeSubscription = null;

export const initializeDashboard = async (onEEGUpdateCallback, onSessionListUpdateCallback) => {
    const { user, error } = await getCurrentUser();

    if (error || !user) {

        return { initialized: false, user: null };
    }

    currentUser = user;
    subscribeToSessions(currentUser.id, onSessionListUpdateCallback);

    return { initialized: true, user: currentUser };
};

export const beginTracking = async () => {
    const { session, error } = await startSession();
    if (error) {
        // Mock fallback for local UI testing
        currentSessionId = 'demo-' + Date.now();
        return { id: currentSessionId };
    }

    currentSessionId = session.id;
    return session;
};

export const recordFocusStream = async (rawSignal, focusMetric) => {
    if (!currentSessionId) return;
    await addEEGData(currentSessionId, rawSignal, focusMetric);
};

export const attachLiveEEGListener = (callback) => {
    if (!currentSessionId) return;
    realtimeSubscription = subscribeToLiveEEG(currentSessionId, callback);
};

export const finalizeTracking = async () => {
    if (!currentSessionId) return;

    if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
        realtimeSubscription = null;
    }

    const { eegData } = await fetchSessionEEGData(currentSessionId);
    const stats = calculateAvgMax(eegData || []);
    const { url: csvUrl } = await generateAndUploadCSV(currentSessionId);

    const { session, error } = await endSession(currentSessionId, stats, csvUrl);

    if (!error) {

    }

    const closedSessionId = currentSessionId;
    currentSessionId = null;

    return { session, csvUrl };
};

export const processSignOut = async () => {
    await signOut();
    window.location.reload();
};
