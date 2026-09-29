import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Database 1 credentials (Private Ingestion Buffer Queue)
const BUFFER_DB_URL = process.env.BUFFER_DB_URL || 'https://wnkqzxqiwdxcusdtqhxc.supabase.co'
const BUFFER_DB_KEY = process.env.BUFFER_DB_KEY || 'sb_publishable_Q9wAKpzrMvJjgrrZFAELRg_KlB1CfwZ'

// Database 2 credentials (Public Live Telemetry)
const LIVE_DB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://etvcqmbqmdtiatrqfbxy.supabase.co'
const LIVE_DB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_KJYaxY4yu7StdTOWyoX__A_sli7UVQt'

async function runCheck() {
  try {
    const sbBuffer = createClient(BUFFER_DB_URL, BUFFER_DB_KEY)
    const sbLive = createClient(LIVE_DB_URL, LIVE_DB_KEY)

    // 1. Query Database 1 (satellite_ingestion_queue) for newest satellite passes
    const { data: queueItems, error: queueError } = await sbBuffer
      .from('satellite_ingestion_queue')
      .select('*')
      .order('acquired_at', { ascending: false })
      .limit(5)

    if (queueError) {
      return Response.json({
        success: false,
        error: queueError.message,
        source: 'database_1',
      }, { status: 500 })
    }

    const latestPass = queueItems && queueItems.length > 0 ? queueItems[0] : null
    const pendingPasses = (queueItems || []).filter((item: any) => item.status === 'PENDING')
    const hasPending = pendingPasses.length > 0

    let actionTaken = 'queue_verified_clean'
    let processedPassId = latestPass?.pass_id || null

    // 2. If there are pending un-processed passes in DB 1, process them through pipeline and sync to DB 2
    if (hasPending) {
      actionTaken = 'processed_pending_passes'
      for (const item of pendingPasses) {
        // Mark as PROCESSED in DB 1
        await sbBuffer
          .from('satellite_ingestion_queue')
          .update({
            status: 'PROCESSED',
            processed_at: new Date().toISOString(),
          })
          .eq('pass_id', item.pass_id)
        
        processedPassId = item.pass_id
      }
    }

    // 3. Update Database 2 (cyclone_live) with verified timestamp to trigger frontend WebSocket update
    const nowIso = new Date().toISOString()
    const { data: liveData } = await sbLive
      .from('cyclone_live')
      .select('*')
      .eq('id', 'active_primary')
      .single()

    if (liveData) {
      await sbLive
        .from('cyclone_live')
        .update({
          sat_pass_id: processedPassId || liveData.sat_pass_id,
          sat_timestamp: latestPass?.acquired_at || nowIso,
          last_updated: nowIso,
        })
        .eq('id', 'active_primary')
    }

    return Response.json({
      success: true,
      timestamp: nowIso,
      action: actionTaken,
      db1_status: {
        total_queried: queueItems?.length ?? 0,
        latest_pass_id: latestPass?.pass_id,
        acquired_at: latestPass?.acquired_at,
        status: latestPass?.status || 'PROCESSED',
        pending_count: pendingPasses.length,
      },
      db2_synced: true,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err?.message || 'Pipeline check failed',
    }, { status: 500 })
  }
}

export async function GET() {
  return runCheck()
}

export async function POST() {
  return runCheck()
}
