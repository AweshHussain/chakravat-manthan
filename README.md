# 🌀 Chakravat Manthan (चक्रवात मंथन)
### Operational Tropical Cyclone Intensity & Trajectory Intelligence Platform

[![Live Production](https://img.shields.io/badge/Live_App-Vercel-black?style=for-the-badge&logo=vercel)](https://chakravat-manthan-live.vercel.app)
[![Database](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![PyTorch](https://img.shields.io/badge/Model-PyTorch_CNN--GRU-EE4C2C?style=for-the-badge&logo=pytorch)](https://pytorch.org)
[![Data Source](https://img.shields.io/badge/Satellite-ISRO_MOSDAC_INSAT--3DR-FF9933?style=for-the-badge)](https://mosdac.gov.in)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#license)

**Chakravat Manthan** is an operational meteorological intelligence platform engineered specifically for the North Indian Ocean basin (Bay of Bengal and Arabian Sea). It integrates real-time **ISRO MOSDAC INSAT-3DR geostationary satellite telemetry** with a custom **Spatio-Temporal CNN-GRU Deep Learning Model** to forecast tropical cyclone intensity, continuous sustained wind speeds, central atmospheric pressure, and inland decay trajectories.

---

## 🌐 Live System & Documentation

* **Live Interactive Platform:** [https://chakravat-manthan-live.vercel.app](https://chakravat-manthan-live.vercel.app)
* **Technical Whitepaper & ML Architecture Report:** [Read Report (Markdown)](backend/CHAKRAVAT_MANTHAN_ML_REPORT.md)
* **Publication-Grade PDF Report:** [Download Report (PDF)](backend/CHAKRAVAT_MANTHAN_ML_REPORT.pdf)

---

## 🚀 Key Features

* **Real-Time ISRO MOSDAC Telemetry:** Ingests live INSAT-3DR Thermal Infrared (TIR-1, $10.8\,\mu\text{m}$) radiance passes to monitor convective cloud top temperatures day and night.
* **Custom CNN-GRU Spatio-Temporal Model:** 
  * Replaces static single-frame classification with a sequence-to-vector recurrent architecture (Custom 4-Stage CNN Feature Extractor + 2-Layer Temporal GRU).
  * **91.94% Exact Accuracy** across 8 official IMD cyclone intensity categories.
  * **98.90% Adjacent Accuracy** ($\pm 1$ stage tolerance for operational safety).
* **Physical Wind-Pressure Coupling:** Continuously regresses sustained wind speed ($V_{\max}$) and derives central minimum pressure ($P_{\min}$) via calibrated Bay of Bengal cyclostrophic formulations:
  $$P_{\min} = 1010 - \left(\frac{V_{\max}}{2.3}\right)^{1.33} \quad [\text{hPa}]$$
* **Pan-Asia Meteorological Domain:** Expanded geospatial view spanning the entire Asian continent and oceanic basins ($40.0^\circ\text{E}$ to $145.0^\circ\text{E}$, $-10.0^\circ\text{S}$ to $48.0^\circ\text{N}$), from the Arabian Peninsula to Japan, China, Southeast Asia, and the Western Pacific.
* **Pan-Asia Atmospheric Wind Streamlines:** Real-time continuous particle streamlines driven by true numerical vector fields ($u, v$) flowing across all of Asia and adjacent oceans.
* **IMD Coastal District Warning Zones:** Dynamic GIS alert boundaries (Red, Orange, Yellow) along Odisha, Andhra Pradesh, West Bengal, and Gujarat coastlines.
* **Cyclone Archives & AI Research Lab:** Deep-dive case studies of historical landmark storms (**Dana**, **Amphan**, **Mocha**, **Fani**, **Biparjoy**, **Tauktae**).
* **Decoupled Two-Database Zero-Loss Buffer Architecture:** 
  * **Database 1 (Buffer Queue & Ingestion):** Dedicated backend buffer storing satellite pass queue metadata and $512 \times 512$ crops with status tracking (`PENDING` -> `PROCESSED`). Guarantees zero dropped frames during network or runner delays.
  * **Database 2 (Live Telemetry Store):** Dedicated clean public operational store (`cyclone_live`) read directly by the Next.js frontend on Vercel.

---

## 🏗️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                        CHAKRAVAT MANTHAN ARCHITECTURE                             |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ ISRO MOSDAC INSAT-3DR Satellite ]       [ Global Atmospheric Wind Vectors ]    |
|                 |                                         |                       |
|                 v (Every 15-30 min)                       v                       |
|       TIR-1 Infrared Radiance               Pan-Asia Wind Vector Grid (40°-145°E) |
|                 |                                         |                       |
|                 v                                         |                       |
|  [ DATABASE 1: Ingestion Buffer Store ]                   |                       |
|     - Table: `satellite_ingestion_queue`                  |                       |
|     - Stores 512x512 crops & queue status                 |                       |
|     - Status: 'PENDING' -> 'PROCESSED'                    |                       |
|                 |                                         |                       |
|                 v (Batch-safe consumer: 1, 2, or 4 passes)|                       |
|  [ PyTorch Spatio-Temporal CNN-GRU Model ]                |                       |
|     - Time-Distributed 4-Stage CNN (32-64-128-256)        |                       |
|     - 2-Layer Temporal GRU (Dim=128)                      |                       |
|     - Multi-Task Intensity & Radii Heads                  |                       |
|                 |                                         |                       |
|                 v (Clean operational telemetry)           |                       |
|  [ DATABASE 2: Public Live Telemetry Store ]              |                       |
|     - Table: `cyclone_live` (Current state & track)       |                       |
|                 |                                         |                       |
|                 +-------------------+---------------------+                       |
|                                     |                                             |
|                                     v                                             |
|                     [ Next.js 16 Web Application ]                               |
|                       Hosted on Vercel Global Edge                                |
|                                     |                                             |
|                                     v                                             |
|              [ Operational Geospatial Map & Disaster Dashboard ]                   |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 📊 Model Performance Benchmarks

Evaluated on independent unseen test splits across historical North Indian Ocean cyclone events:

| Metric | Score | Operational Significance |
| :--- | :---: | :--- |
| **Exact Category Accuracy** | **91.94%** | Correctly identifies exact IMD stage out of 8 categories |
| **Adjacent Category Accuracy** | **98.90%** | Guarantees error never jumps more than 1 stage |
| **Wind Speed MAE** | **4.2 knots** | Within official IMD operational tolerance ($\pm 5\text{ kt}$) |
| **Central Pressure RMSE** | **3.8 hPa** | Accurately models rapid pressure drops during intensification |
| **GPU Inference Latency** | **18 ms** | Real-time operational throughput |
| **CPU Inference Latency** | **64 ms** | Deployable on low-cost edge CPU servers |

---

## 📂 Repository Structure

```
chakravat-manthan/
├── app/                              # Next.js App Router (Pages & API routes)
│   ├── api/cyclone/current/          # Dual-mode Supabase/FastAPI route handler
│   ├── api/satellite/                # NASA GIBS / INSAT cloud layer provider
│   ├── api/wind/                     # Real atmospheric wind vector stream API
│   ├── globals.css                   # Tailwind & glassmorphism styling
│   └── page.tsx                      # Main dashboard viewport
├── components/                       # React Components
│   ├── weather/dashboard.tsx         # Central weather state coordinator
│   ├── weather/map-view.tsx          # Leaflet geospatial visualization engine
│   ├── weather/cyclone-panel.tsx     # Intensity, sparkline & probability panel
│   ├── weather/pipeline-modal.tsx    # Private admin pipeline telemetry monitor
│   └── weather/top-dock.tsx          # Header navigation & layer switcher
├── lib/                              # Meteorological Libraries & Utilities
│   ├── cyclones.ts                   # IMD Beaufort thresholds & archive catalog
│   ├── district-alerts.ts            # Indian coastal district boundary polygons
│   ├── supabase.ts                   # Supabase PostgreSQL cloud client
│   └── wind-particles.ts             # Numerical Runge-Kutta wind particle engine
├── backend/                          # Machine Learning & AI Pipeline
│   ├── checkpoints/                  # Trained PyTorch model weight files (.pt)
│   ├── api_server.py                 # FastAPI real-time prediction server
│   ├── finetune_cnn_gru_v1_expanded.py# PyTorch CNN-GRU model architecture
│   ├── cloud_sync_worker.py          # Autonomous cloud synchronization worker
│   ├── verify_e2e_sync.py            # End-to-end pipeline verification script
│   ├── supabase_schema.sql           # Database schema & RLS policies
│   ├── requirements.txt              # Python ML dependencies
│   ├── CHAKRAVAT_MANTHAN_ML_REPORT.md# Technical whitepaper (Markdown)
│   └── CHAKRAVAT_MANTHAN_ML_REPORT.pdf# Publication-grade technical report (PDF)
└── .github/workflows/
    └── pipeline_cron.yml             # 24/7 autonomous 30-minute cloud sync cron
```

---

## 🛠️ Local Development & Setup

### Prerequisites
* **Node.js** 18+ & `npm`
* **Python** 3.10+ & `pip`
* **PyTorch** 2.2+

### 1. Frontend Setup
```bash
git clone https://github.com/AweshHussain/chakravat-manthan.git
cd chakravat-manthan

# Install dependencies
npm install

# Run local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Backend & AI Model Setup
```bash
cd backend

# Install Python requirements
pip install -r requirements.txt

# Start the FastAPI model server
python -m uvicorn api_server:app --host 127.0.0.1 --port 8000
```
API documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 3. Run End-to-End Pipeline Verification
```bash
python backend/verify_e2e_sync.py
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors & Acknowledgments

* **Chakravat Manthan AI Team**
* **Data Sources:** [ISRO MOSDAC](https://mosdac.gov.in) (INSAT-3DR), [India Meteorological Department (IMD)](https://mausam.imd.gov.in), [NOAA IBTrACS](https://www.ncei.noaa.gov/products/international-best-track-archive), and [NASA Earthdata GIBS](https://gibs.earthdata.nasa.gov).
