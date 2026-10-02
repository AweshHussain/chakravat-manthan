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
        const windKt = Number(data.wind_kt)
        const isGenesisOrFormation = data.lifecycle_status === 'FORMATION' || data.lifecycle_status === 'GENESIS' || data.lifecycle_status === 'DEVELOPING'
        const isDissipated = !isGenesisOrFormation && (
          data.lifecycle_status === 'DISSIPATED' ||
          data.lifecycle_status === 'COMPLETED' ||
          data.stage_code === 'REMNT' ||
          data.stage_code === 'WML' ||
          (windKt < 17 && (data.lifecycle_status === 'DECAYING' || data.lifecycle_status === 'POST_LANDFALL'))
        )
        const dynamicLifecycle = isDissipated
          ? 'DISSIPATED'
          : (data.lifecycle_status || (windKt >= 17 ? 'ACTIVE_OBSERVATION' : 'FORMATION'))

        return Response.json({
          status: 'live_supabase',
          satellite_pass: data.sat_pass_id,
          storm: data.name,
          source: 'ISRO MOSDAC INSAT-3DR L1C Payload',
          lifecycle_status: dynamicLifecycle,
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
      lifecycle_status: 'DISSIPATED',
      storm: 'Myanmar Cyclone (Remnants / Dissipated)',
      intensity_stage: {
        code: 'LPA',
        full_name: 'Low Pressure Area (Dissipated)',
        confidence_pct: 95.0,
      },
      continuous_measurements: {
        neural_regression_head: {
          wind_speed_knots: 12.0,
          wind_speed_kmh: 22.2,
          central_pressure_hpa: 1004.0,
        },
      },
      stage_probabilities: {
        D: 8.5,
        DD: 1.2,
        CS: 0.2,
        SCS: 0.1,
        VSCS: 0.0,
        ESCS: 0.0,
        SuCS: 0.0,
      },
      spatial_radii: {
        outer_radius_km: 80,
        cdo_radius_km: 25,
        eye_radius_km: 0,
      },
      coordinates: {
        lat: 23.7,
        lon: 91.2,
      },
    },
    { status: 200 },
  )
}
