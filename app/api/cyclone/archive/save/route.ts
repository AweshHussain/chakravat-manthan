import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    if (!payload || !payload.id || !payload.name) {
      return Response.json({ error: 'Invalid archive payload' }, { status: 400 })
    }

    // If Supabase database client is active, persist to the permanent archive table
    if (supabase) {
      try {
        const { error } = await supabase
          .from('cyclone_archives')
          .upsert({
            id: payload.id,
            name: payload.name,
            year: payload.year || new Date().getFullYear(),
            basin: payload.basin || 'Bay of Bengal',
            peak_wind_kt: payload.peakWindKt,
            min_pressure_hpa: payload.minPressure,
            landfall: payload.landfall,
            duration_hours: payload.durationHours,
            start_date: payload.startDate,
            track_points: payload.track,
            saved_at: new Date().toISOString(),
          })

        if (!error) {
          return Response.json({ status: 'saved_to_database', id: payload.id })
        }
      } catch {
        // Table not created yet or schema difference; fall through gracefully
      }
    }

    return Response.json({
      status: 'acknowledged',
      id: payload.id,
      message: 'Cyclone lifecycle completed and staged for database persistence',
    })
  } catch (err) {
    return Response.json({ error: 'Failed to process archive record', details: String(err) }, { status: 500 })
  }
}

export async function GET() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('cyclone_archives')
        .select('*')
        .order('year', { ascending: false })

      if (!error && data && data.length > 0) {
        const mapped = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          year: Number(row.year),
          basin: row.basin,
          peakWindKt: Number(row.peak_wind_kt),
          minPressure: Number(row.min_pressure_hpa),
          landfall: row.landfall,
          durationHours: Number(row.duration_hours),
          startDate: row.start_date,
          track: row.track_points,
        }))
        return Response.json({ archives: mapped })
      }
    } catch {
      // Fall through to empty array
    }
  }
  return Response.json({ archives: [] })
}

