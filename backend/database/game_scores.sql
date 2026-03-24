-- game_scores.sql
-- Table definition for handling global neuro game leaderboards

CREATE TABLE public.game_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_type VARCHAR(50) NOT NULL,
    score NUMERIC NOT NULL,
    metrics JSONB DEFAULT '{}'::jsonb, -- Store avg focus, alpha control details etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimize queries
CREATE INDEX idx_game_scores_game_type_score ON public.game_scores(game_type, score DESC);
CREATE INDEX idx_game_scores_user_id ON public.game_scores(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Security Policies

-- Anyone can view leaderboards
CREATE POLICY "Scores are publicly readable"
ON public.game_scores FOR SELECT
TO authenticated, anon
USING (true);

-- Only authenticated users can insert their own scores
CREATE POLICY "Users can insert their own scores"
ON public.game_scores FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users cannot edit or delete scores once submitted (Immutable ledger)
CREATE POLICY "Scores are immutable"
ON public.game_scores FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Scores cannot be deleted"
ON public.game_scores FOR DELETE
TO authenticated
USING (false);
