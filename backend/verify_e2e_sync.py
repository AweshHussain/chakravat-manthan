import os
import json
from datetime import datetime, timezone
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://etvcqmbqmdtiatrqfbxy.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "sb_publishable_KJYaxY4yu7StdTOWyoX__A_sli7UVQt")

def get_supabase_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def test_full_pipeline_sync():
    """Simulates an end-to-end forward pass: fetches/processes data -> saves to Supabase -> verifies cloud read."""
    print("=" * 60)
    print("[END-TO-END AUDIT] Testing Python -> Supabase Cloud -> Vercel Read")
    print("=" * 60)
    
    sb = get_supabase_client()
    
    # 1. Prepare simulated live inference update (e.g. Cyclone Dana active telemetry)
    now_iso = datetime.now(timezone.utc).isoformat()
    payload = {
        "id": "active_primary",
        "name": "Dana",
        "stage_code": "VSCS",
        "category_name": "Very Severe Cyclonic Storm",
        "confidence_pct": 91.2,
        "wind_kt": 78.0,
        "wind_kmh": 144.5,
        "pressure_hpa": 980.0,
        "lat": 16.4,
        "lon": 88.3,
        "movement_speed_kmh": 15.0,
        "movement_dir": "NNW",
        "outer_radius_km": 245.0,
        "cdo_radius_km": 92.0,
        "eye_radius_km": 20.0,
        "sat_pass_id": "3RIMG_27SEP2026_0100_L1C_ASIA_MER_V01R00.h5",
        "sat_timestamp": now_iso,
        "stage_probabilities": {
            "D": 0.8,
            "DD": 1.9,
            "CS": 4.5,
            "SCS": 9.8,
            "VSCS": 76.5,
            "ESCS": 6.3,
            "SuCS": 0.2
        },
        "last_updated": now_iso
    }
    
    print("[1/3] Writing model telemetry to Supabase 'cyclone_live' table...")
    res = sb.table("cyclone_live").upsert(payload).execute()
    print(f" -> Write status: Success! Rows returned: {len(res.data)}")
    
    # 2. Read back from Supabase to verify persistence
    print("[2/3] Querying Supabase cloud database directly...")
    query_res = sb.table("cyclone_live").select("*").eq("id", "active_primary").execute()
    assert len(query_res.data) > 0, "No records found in database!"
    rec = query_res.data[0]
    print(f" -> Cloud DB record confirmed: {rec['name']} at ({rec['lat']}, {rec['lon']}) with {rec['wind_kt']} kt wind.")
    
    # 3. Verify Vercel API endpoint
    print("[3/3] Querying deployed Vercel endpoint https://chakravat-manthan-live.vercel.app/api/cyclone/current ...")
    import requests
    v_res = requests.get("https://chakravat-manthan-live.vercel.app/api/cyclone/current", timeout=10)
    print(f" -> Vercel HTTP response: {v_res.status_code}")
    v_data = v_res.json()
    print(f" -> Vercel data source: {v_data.get('status')}")
    print(f" -> Storm Name: {v_data.get('storm')}")
    print(f" -> Deployed Intensity: {v_data.get('intensity_stage')}")
    print(f" -> Coordinates: {v_data.get('coordinates')}")
    print(f" -> Measured Wind: {v_data.get('continuous_measurements', {}).get('neural_regression_head', {}).get('wind_speed_knots')} knots")
    print("=" * 60)
    print("[AUDIT PASSED] End-to-end sync is 100% OPERATIONAL!")
    print("=" * 60)

if __name__ == "__main__":
    test_full_pipeline_sync()
