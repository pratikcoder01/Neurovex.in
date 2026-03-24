// leaderboard.js
import { supabase } from '../backend/supabase.js';

export class LeaderboardManager {
    constructor() { }

    async submitScore(userId, gameType, scoreValue, additionalMetrics = {}) {
        try {
            const { data, error } = await supabase
                .from('game_scores')
                .insert([{
                    user_id: userId,
                    game_type: gameType,
                    score: scoreValue,
                    metrics: additionalMetrics
                }]);

            if (error) throw error;
            return true;
        } catch (e) {
            console.error("Score submission failed:", e);
            return false;
        }
    }

    async getTopScores(gameType, limit = 10) {
        try {
            const { data, error } = await supabase
                .from('game_scores')
                .select('score, profiles(full_name)')
                .eq('game_type', gameType)
                .order('score', { ascending: false }) // or true for reaction time
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (e) {
            console.error("Fetch leaderboard failed:", e);
            return [];
        }
    }
}
