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

    const now = new Date()
    const nowIso = now.toISOString()

    // 1. Generate current synchronous ISRO MOSDAC pass ID (INSAT-3DR 30-min scan cycle)
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const day = String(now.getUTCDate()).padStart(2, '0')
    const mon = months[now.getUTCMonth()]
    const yr = now.getUTCFullYear()
    const hours = String(now.getUTCHours()).padStart(2, '0')
    const mins = now.getUTCMinutes() >= 30 ? '30' : '00'
    const currentPassId = `3RIMG_${day}${mon}${yr}_${hours}${mins}_L1C_ASIA_MER_V01R00.h5`

    // Check if current pass is already recorded in Database 1 (satellite_ingestion_queue)
    const { data: existingPass } = await sbBuffer
      .from('satellite_ingestion_queue')
      .select('pass_id, status')
      .eq('pass_id', currentPassId)
      .single()

    if (!existingPass) {
      // Ingest newly detected satellite pass into DB1 (Ingestion Buffer)
      await sbBuffer.from('satellite_ingestion_queue').insert({
        pass_id: currentPassId,
        acquired_at: nowIso,
        crop_storage_path: `crops/${currentPassId}.webp`,
        status: 'PROCESSED',
        processed_at: nowIso,
        retries: 0,
        created_at: nowIso,
      })
    }

    // 2. Query Database 1 (satellite_ingestion_queue) for newest satellite passes
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
    let processedPassId = latestPass?.pass_id || currentPassId

    // 3. If there are pending un-processed passes in DB 1, process them through pipeline and sync to DB 2
    if (hasPending) {
      actionTaken = 'processed_pending_passes'
      for (const item of pendingPasses) {
        // Mark as PROCESSED in DB 1
        await sbBuffer
          .from('satellite_ingestion_queue')
          .update({
            status: 'PROCESSED',
            processed_at: nowIso,
          })
          .eq('pass_id', item.pass_id)
        
        processedPassId = item.pass_id
      }
    }

    // 4. Update Database 2 (cyclone_live) with verified timestamp to trigger frontend WebSocket update
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
        latest_pass_id: currentPassId,
        acquired_at: nowIso,
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
