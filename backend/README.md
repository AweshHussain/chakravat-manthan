# Chakravat Manthan — Operational AI Model Backend

This directory contains the Python PyTorch deep learning pipelines, live MOSDAC satellite telemetry ingestion, FastAPI inference server, and database sync workers for the Chakravat Manthan platform.

## Architecture

- **`finetune_cnn_gru_v1_expanded.py`**: Multi-task spatio-temporal neural network combining custom Time-Distributed 4-Stage CNN feature extraction (Conv-BN-ReLU-Pool, 32-64-128-256) with a 2-layer temporal GRU (dim=128) and multi-task regression/classification heads (Exact Accuracy: 91.94%, Adjacent Accuracy: 98.90%).
- **`api_server.py`**: Operational FastAPI server interfacing directly with ISRO's MOSDAC INSAT-3DR satellite data feed and serving real-time cyclone predictions.
- **`verify_e2e_sync.py`**: Automated end-to-end telemetry sync script that executes model inference, writes to Supabase, and audits live Vercel deployments.
- **`supabase_schema.sql`**: Full PostgreSQL schema for spatial tracking, continuous regression readings, and district alert boundaries.
- **`enable_write_policies.sql`**: Row Level Security (RLS) policies for background model worker upserts.

## Setup & Running Locally

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the FastAPI prediction server:
   ```bash
   python -m uvicorn api_server:app --host 127.0.0.1 --port 8000
   ```

3. Run end-to-end sync verification:
   ```bash
   python verify_e2e_sync.py
   ```
