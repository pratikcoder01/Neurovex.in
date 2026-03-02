// EEG Data Management - Modular v12 SDK
import { db, storage } from './firebase.js';
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    getDoc, 
    query, 
    where, 
    orderBy, 
    limit,
    writeBatch,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { 
    ref, 
    uploadString, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

class EEGManager {
    constructor() {
        this.currentSession = null;
        this.eegDataBuffer = [];
        this.batchSize = 100;
        this.batchTimeout = null;
        this.isConnected = false;
    }

    // Start new EEG session
    async startSession(userId, deviceConnected = false) {
        try {
            const sessionData = {
                userId: userId,
                startTime: serverTimestamp(),
                endTime: null,
                avgFocus: 0,
                maxFocus: 0,
                csvFileUrl: null,
                deviceConnected: deviceConnected
            };

            const sessionRef = await addDoc(collection(db, 'sessions'), sessionData);
            this.currentSession = sessionRef.id;
            this.isConnected = deviceConnected;
            
            return { success: true, sessionId: sessionRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // End current EEG session
    async endSession() {
        if (!this.currentSession) return { success: false, error: 'No active session' };

        try {
            // Flush any remaining data
            await this.flushEEGData();

            // Calculate session statistics
            const stats = this.calculateSessionStats();
            
            // Update session document
            const sessionRef = doc(db, 'sessions', this.currentSession);
            await updateDoc(sessionRef, {
                endTime: serverTimestamp(),
                avgFocus: stats.avgFocus,
                maxFocus: stats.maxFocus
            });

            // Generate and upload CSV
            const csvUrl = await this.generateAndUploadCSV();
            if (csvUrl) {
                await updateDoc(sessionRef, { csvFileUrl: csvUrl });
            }

            // Update user's total sessions
            await this.updateUserSessionCount();

            const sessionId = this.currentSession;
            this.currentSession = null;
            this.eegDataBuffer = [];
            this.isConnected = false;

            return { success: true, sessionId, csvUrl };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Add EEG data point
    async addEEGData(rawValue, focusLevel) {
        if (!this.currentSession || !this.isConnected) return;

        const eegPoint = {
            timestamp: serverTimestamp(),
            rawValue: rawValue,
            focusLevel: focusLevel
        };

        this.eegDataBuffer.push(eegPoint);

        // Batch write when buffer is full or after timeout
        if (this.eegDataBuffer.length >= this.batchSize) {
            await this.flushEEGData();
        } else {
            this.scheduleBatchFlush();
        }
    }

    // Schedule batch flush with timeout
    scheduleBatchFlush() {
        if (this.batchTimeout) clearTimeout(this.batchTimeout);
        
        this.batchTimeout = setTimeout(async () => {
            await this.flushEEGData();
        }, 5000); // Flush every 5 seconds
    }

    // Flush EEG data buffer to Firestore
    async flushEEGData() {
        if (this.eegDataBuffer.length === 0 || !this.currentSession) return;

        try {
            const batch = writeBatch(db);
            const eegCollectionRef = collection(db, 'sessions', this.currentSession, 'eeg_data');

            this.eegDataBuffer.forEach((eegPoint) => {
                const docRef = doc(eegCollectionRef);
                batch.set(docRef, eegPoint);
            });

            await batch.commit();
            this.eegDataBuffer = [];
            
            if (this.batchTimeout) {
                clearTimeout(this.batchTimeout);
                this.batchTimeout = null;
            }
        } catch (error) {
            console.error('Error flushing EEG data:', error);
        }
    }

    // Calculate session statistics
    calculateSessionStats() {
        if (this.eegDataBuffer.length === 0) {
            return { avgFocus: 0, maxFocus: 0 };
        }

        const focusLevels = this.eegDataBuffer.map(point => point.focusLevel);
        const avgFocus = focusLevels.reduce((sum, level) => sum + level, 0) / focusLevels.length;
        const maxFocus = Math.max(...focusLevels);

        return { avgFocus, maxFocus };
    }

    // Generate CSV from session data
    async generateAndUploadCSV() {
        try {
            // Get all EEG data for this session
            const eegCollectionRef = collection(db, 'sessions', this.currentSession, 'eeg_data');
            const q = query(eegCollectionRef, orderBy('timestamp'));
            const querySnapshot = await getDocs(q);

            // Generate CSV content
            let csvContent = 'Timestamp,Raw Value,Focus Level\n';
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                csvContent += `${data.timestamp.toDate().toISOString()},${data.rawValue},${data.focusLevel}\n`;
            });

            // Upload to Firebase Storage
            const storageRef = ref(storage, `csv_exports/${this.currentSession}.csv`);
            await uploadString(storageRef, csvContent);
            
            // Get download URL
            const downloadURL = await getDownloadURL(storageRef);
            
            return downloadURL;
        } catch (error) {
            console.error('Error generating CSV:', error);
            return null;
        }
    }

    // Update user's total session count
    async updateUserSessionCount() {
        if (!this.currentSession) return;

        try {
            const sessionRef = doc(db, 'sessions', this.currentSession);
            const sessionDoc = await getDoc(sessionRef);
            
            if (sessionDoc.exists()) {
                const userId = sessionDoc.data().userId;
                const userRef = doc(db, 'users', userId);
                const userDoc = await getDoc(userRef);
                
                if (userDoc.exists()) {
                    const currentCount = userDoc.data().totalSessions || 0;
                    await updateDoc(userRef, { totalSessions: currentCount + 1 });
                }
            }
        } catch (error) {
            console.error('Error updating session count:', error);
        }
    }

    // Get user's session history
    async getSessionHistory(userId, limitCount = 10) {
        try {
            const sessionsRef = collection(db, 'sessions');
            const q = query(
                sessionsRef, 
                where('userId', '==', userId),
                orderBy('startTime', 'desc'),
                limit(limitCount)
            );
            
            const querySnapshot = await getDocs(q);
            const sessions = [];
            
            querySnapshot.forEach((doc) => {
                const sessionData = doc.data();
                sessions.push({
                    id: doc.id,
                    ...sessionData,
                    startTime: sessionData.startTime?.toDate(),
                    endTime: sessionData.endTime?.toDate()
                });
            });
            
            return { success: true, sessions };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get session details with EEG data
    async getSessionDetails(sessionId) {
        try {
            const sessionRef = doc(db, 'sessions', sessionId);
            const sessionDoc = await getDoc(sessionRef);
            
            if (!sessionDoc.exists()) {
                return { success: false, error: 'Session not found' };
            }

            const sessionData = sessionDoc.data();
            
            // Get EEG data for this session
            const eegCollectionRef = collection(db, 'sessions', sessionId, 'eeg_data');
            const eegQuery = query(eegCollectionRef, orderBy('timestamp'), limit(1000));
            const eegSnapshot = await getDocs(eegQuery);
            
            const eegData = [];
            eegSnapshot.forEach((doc) => {
                const data = doc.data();
                eegData.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate()
                });
            });

            return {
                success: true,
                session: {
                    id: sessionId,
                    ...sessionData,
                    startTime: sessionData.startTime?.toDate(),
                    endTime: sessionData.endTime?.toDate()
                },
                eegData
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Set connection status
    setConnectionStatus(connected) {
        this.isConnected = connected;
    }

    // Get current session info
    getCurrentSession() {
        return this.currentSession;
    }

    // Check if session is active
    isSessionActive() {
        return this.currentSession !== null && this.isConnected;
    }
}

// Export singleton instance
export const eegManager = new EEGManager();
