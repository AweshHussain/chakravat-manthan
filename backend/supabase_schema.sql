-- Chakravat Manthan Cyclone Tracking Database Schema
-- Provides high-performance spatial telemetry, tracks, and district warnings

-- 1. Active Cyclone Live Telemetry
CREATE TABLE IF NOT EXISTS public.cyclone_live (
    id TEXT PRIMARY KEY DEFAULT 'active_primary',
    name TEXT NOT NULL DEFAULT 'Myanmar Cyclone',
    stage_code TEXT NOT NULL DEFAULT 'LPA',
    category_name TEXT NOT NULL DEFAULT 'Low Pressure Area (Dissipated)',
    confidence_pct NUMERIC NOT NULL DEFAULT 95.0,
    wind_kt NUMERIC NOT NULL DEFAULT 12.0,
    wind_kmh NUMERIC NOT NULL DEFAULT 22.2,
    pressure_hpa NUMERIC NOT NULL DEFAULT 1004.0,
    lat NUMERIC NOT NULL DEFAULT 23.7,
    lon NUMERIC NOT NULL DEFAULT 91.2,
    movement_speed_kmh NUMERIC NOT NULL DEFAULT 12.0,
    movement_dir TEXT NOT NULL DEFAULT 'NNW',
    outer_radius_km NUMERIC NOT NULL DEFAULT 80.0,
    cdo_radius_km NUMERIC NOT NULL DEFAULT 25.0,
    eye_radius_km NUMERIC NOT NULL DEFAULT 0.0,
    sat_pass_id TEXT DEFAULT '3RIMG_02OCT2026_0600_L1C_ASIA_MER_V01R00.h5',
    sat_timestamp TIMESTAMPTZ DEFAULT NOW(),
    stage_probabilities JSONB DEFAULT '{"D": 8.5, "DD": 1.2, "CS": 0.2, "SCS": 0.1, "VSCS": 0.0, "ESCS": 0.0, "SuCS": 0.0}',
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Cyclone Observation & Forecast Tracks
CREATE TABLE IF NOT EXISTS public.cyclone_tracks (
    id SERIAL PRIMARY KEY,
    cyclone_id TEXT NOT NULL DEFAULT 'active_primary',
    t_timestamp BIGINT NOT NULL,
    lat NUMERIC NOT NULL,
    lon NUMERIC NOT NULL,
    wind_kt NUMERIC NOT NULL,
    pressure_hpa NUMERIC NOT NULL,
    is_forecast BOOLEAN NOT NULL DEFAULT FALSE,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Coastal District Alert Zones
CREATE TABLE IF NOT EXISTS public.district_alerts (
    id SERIAL PRIMARY KEY,
    district_name TEXT NOT NULL UNIQUE,
    state_name TEXT NOT NULL,
    alert_level TEXT NOT NULL CHECK (alert_level IN ('red', 'orange', 'yellow', 'green')),
    wind_expected_kt TEXT NOT NULL,
    warning_message TEXT NOT NULL,
    center_lat NUMERIC NOT NULL,
    center_lon NUMERIC NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Real Active State (Myanmar Cyclone baseline)
INSERT INTO public.cyclone_live (
    id, name, stage_code, category_name, confidence_pct, wind_kt, wind_kmh, pressure_hpa,
    lat, lon, movement_speed_kmh, movement_dir, outer_radius_km, cdo_radius_km, eye_radius_km,
    sat_pass_id, sat_timestamp, stage_probabilities, last_updated
) VALUES (
    'active_primary', 'Myanmar Cyclone', 'LPA', 'Low Pressure Area (Dissipated)', 95.0, 12.0, 22.2, 1004.0,
    23.7, 91.2, 12.0, 'NNW', 80.0, 25.0, 0.0,
    '3RIMG_02OCT2026_0600_L1C_ASIA_MER_V01R00.h5', NOW(),
    '{"D": 8.5, "DD": 1.2, "CS": 0.2, "SCS": 0.1, "VSCS": 0.0, "ESCS": 0.0, "SuCS": 0.0}',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    wind_kt = EXCLUDED.wind_kt,
    pressure_hpa = EXCLUDED.pressure_hpa,
    lat = EXCLUDED.lat,
    lon = EXCLUDED.lon,
    last_updated = NOW();

-- Enable Public Read Access for anonymous frontend callers
ALTER TABLE public.cyclone_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cyclone_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.district_alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read cyclone_live') THEN
        CREATE POLICY "Public read cyclone_live" ON public.cyclone_live FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read cyclone_tracks') THEN
        CREATE POLICY "Public read cyclone_tracks" ON public.cyclone_tracks FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read district_alerts') THEN
        CREATE POLICY "Public read district_alerts" ON public.district_alerts FOR SELECT USING (true);
    END IF;
END $$;
