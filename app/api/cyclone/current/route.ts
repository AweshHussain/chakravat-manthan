import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  // 1. If Supabase is configured (e.g. on Vercel deployment), query the cloud DB
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('cyclone_live')
        .select('*')
        .eq('id', 'active_primary')
        .single()

      if (!error && data) {
        return Response.json({
          status: 'live_supabase',
          satellite_pass: data.sat_pass_id,
          storm: data.name,
          source: 'ISRO MOSDAC INSAT-3DR L1C Payload',
          lifecycle_status: 'ACTIVE_DEVELOPING',
          intensity_stage: {
            code: data.stage_code,
            full_name: data.category_name,
            confidence_pct: Number(data.confidence_pct),
          },
          continuous_measurements: {
            neural_regression_head: {
              wind_speed_knots: Number(data.wind_kt),
              wind_speed_kmh: Number(data.wind_kmh),
              central_pressure_hpa: Number(data.pressure_hpa),
            },
          },
          stage_probabilities: data.stage_probabilities,
          spatial_radii: {
            outer_radius_km: Number(data.outer_radius_km),
            cdo_radius_km: Number(data.cdo_radius_km),
            eye_radius_km: Number(data.eye_radius_km),
          },
          coordinates: {
            lat: Number(data.lat),
            lon: Number(data.lon),
          },
          track_points: data.track_points || null,
          last_updated: data.last_updated,
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          }
        })
      }
    } catch {
      // Fall through to local/fallback gracefully
    }
  }

  // 2. Local development fallback: Query local FastAPI server (http://127.0.0.1:8000)
  try {
    const res = await fetch('http://127.0.0.1:8000/live/mosdac-feed', {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 30 },
    })
    if (res.ok) {
      const data = await res.json()
      return Response.json(data)
    }
  } catch {
    // Local API server offline
  }

  // 3. Graceful baseline fallback if neither is reachable
  return Response.json(
    {
      status: 'baseline',
      lifecycle_status: 'ACTIVE_OBSERVATION',
      storm: 'Cyclone Dana',
      intensity_stage: {
        code: 'VSCS',
        full_name: 'Very Severe Cyclonic Storm',
        confidence_pct: 89.4,
      },
      continuous_measurements: {
        neural_regression_head: {
          wind_speed_knots: 75.0,
          wind_speed_kmh: 139.0,
          central_pressure_hpa: 982.0,
        },
      },
      stage_probabilities: {
        D: 1.2,
        DD: 2.5,
        CS: 5.1,
        SCS: 11.4,
        VSCS: 72.8,
        ESCS: 6.8,
        SuCS: 0.2,
      },
      spatial_radii: {
        outer_radius_km: 240,
        cdo_radius_km: 90,
        eye_radius_km: 18,
      },
      coordinates: {
        lat: 16.2,
        lon: 88.5,
      },
    },
    { status: 200 },
  )
}
