-- Create hitlist table
CREATE TABLE IF NOT EXISTS public.hitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, restaurant_id)
);

-- Enable RLS
ALTER TABLE public.hitlist ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own hitlist"
    ON public.hitlist
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own hitlist"
    ON public.hitlist
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own hitlist"
    ON public.hitlist
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_hitlist_user_id ON public.hitlist(user_id);
CREATE INDEX idx_hitlist_restaurant_id ON public.hitlist(restaurant_id);
