#!/usr/bin/env python3
"""
Chakravat Manthan - Google Cloud Run Serverless Handler.
Listens for HTTP POST/GET requests from Google Cloud Scheduler.
When triggered:
  1. Authenticates with ISRO MOSDAC
  2. Identifies the latest INSAT-3DR pass
  3. Executes model prediction & spatial radii
  4. Upserts real-time telemetry to Supabase
"""
import os
import sys
import logging
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
import uvicorn

# Import sync worker logic
from cloud_sync_worker import run_pipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("chakravat.gcr")

app = FastAPI(title="Chakravat Manthan GCR Sync Service")

@app.get("/")
def root():
    return {
        "service": "Chakravat Manthan Google Cloud Run Worker",
        "status": "ready",
        "cloud_scheduler_endpoint": "/sync"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.all("/sync")
def trigger_sync():
    """Triggered every 30 minutes by Google Cloud Scheduler."""
    logger.info("Cloud Scheduler trigger received. Executing pipeline sync...")
    try:
        run_pipeline()
        return {
            "status": "success",
            "message": "MOSDAC pass ingested and Supabase updated successfully.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Pipeline sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
