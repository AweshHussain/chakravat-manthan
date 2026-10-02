-- Chakravat Manthan: Permanent Cyclone Historical Archives Table
-- Run this in your Supabase SQL Editor or PostgreSQL database to create the table

CREATE TABLE IF NOT EXISTS public.cyclone_archives (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    year INT NOT NULL,
    basin TEXT NOT NULL DEFAULT 'Bay of Bengal',
    peak_wind_kt NUMERIC NOT NULL,
    min_pressure_hpa NUMERIC NOT NULL,
    landfall TEXT NOT NULL,
    duration_hours NUMERIC NOT NULL,
    start_date TEXT NOT NULL,
    track_points JSONB NOT NULL DEFAULT '[]',
    saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) and allow public read
ALTER TABLE public.cyclone_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to cyclone archives"
    ON public.cyclone_archives
    FOR SELECT
    USING (true);

CREATE POLICY "Allow service and authenticated insert/update"
    ON public.cyclone_archives
    FOR ALL
    USING (true)
    WITH CHECK (true);
