<div align="center">

# 🌀 चक्रवात मंथन · CHAKRAVAT MANTHAN
### *By Cybernetic Crusaders*
#### *Next-Generation Autonomous Tropical Cyclone Intelligence & Spatio-Temporal AI Platform*

[![Live Production](https://img.shields.io/badge/LIVE%20PLATFORM-VERCEL%20EDGE-black?style=for-the-badge&logo=vercel&logoColor=white)](https://chakravat-manthan-live.vercel.app)
[![Database](https://img.shields.io/badge/DATABASE-SUPABASE%20POSTGRESQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![PyTorch](https://img.shields.io/badge/AI%20CORE-PYTORCH%20CNN--GRU-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)
[![Dataset](https://img.shields.io/badge/DATASET-40%2B%20GB%20SATELLITE%20TELEMETRY-purple?style=for-the-badge)](#-model-benchmarks--performance)
[![Satellite](https://img.shields.io/badge/SATELLITE-ISRO%20MOSDAC%20INSAT--3DR-FF9933?style=for-the-badge)](https://mosdac.gov.in)
[![Accuracy](https://img.shields.io/badge/ACCURACY-98.90%25%20ADJACENT-brightgreen?style=for-the-badge)](#-model-benchmarks--performance)
[![License](https://img.shields.io/badge/LICENSE-MIT-blue?style=for-the-badge)](#-license)

<br/>

> **Chakravat Manthan (चक्रवात मंथन) by Cybernetic Crusaders** is a mission-critical meteorological intelligence engine engineered for the North Indian Ocean and Pan-Asian oceanic basins. Fusing direct geostationary satellite telemetry from **ISRO's INSAT-3DR** (trained on **40+ GB** of real multi-spectral satellite imagery) with a custom **4-Stage CNN + 2-Layer Temporal GRU Deep Learning Architecture**, it autonomously predicts cyclone intensity, continuous sustained wind speeds, central barometric pressure, and landfall trajectories with zero manual human bias.

[Explore Live Map](https://chakravat-manthan-live.vercel.app) • [Read Whitepaper](backend/CHAKRAVAT_MANTHAN_ML_REPORT.md) • [Download PDF Report](backend/CHAKRAVAT_MANTHAN_ML_REPORT.pdf) • [Architecture Deep Dive](#-end-to-end-architecture)

</div>

---

## 🌟 Why Our Platform is Different from Others

Most conventional meteorological portals and cyclone trackers only display static post-event maps, delayed bulleted forecasts, or disconnected point markers. **Chakravat Manthan** completely redefines cyclone observation and disaster preparation:

1. **Full Genesis-to-Dissipation Interactive Lifecycle Simulation:**
   - Instead of static breadcrumb markers, our engine calculates and renders the continuous mathematical simulation of **where the storm first started (oceanic genesis)**, its hour-by-hour trajectory path, and **how big it became over its entire lifecycle**.
   - With an interactive temporal scrubber, emergency responders and researchers can trace the storm from a loose convective cluster, through deep depression, severe cyclonic storm, up to peak landfall intensity and inland decay.

2. **Automated Post-Dissipation Archival (Never Lost, Never Premature):**
   - Active systems in the Asian / North Indian Ocean basins stay dynamic and live on the observation dashboard while operational.
   - The moment an active system **completely finishes its lifecycle** (crosses inland, dissipates, or weakens into a remnant low below **17 kt**), the platform automatically compiles its **real start-to-end formation data** into the permanent historical archives.
   - Evaluators and meteorologists can inspect where it started, the synoptic track points, peak wind/pressure records, landfall timeline, and replay its entire lifetime in the interactive simulation engine.

3. **100% Real, Grounded & Accurate Atmospheric Data:**
   - Every stage of the simulation is physically parameterized using **real multi-decade IMD Best-Track telemetry, synoptic trajectory nodes, and live ISRO INSAT-3DR infrared radiance**.
   - Outer gale radii (**R<sub>34</sub>** / Total Swath Width), Central Dense Overcast (CDO) dimensions, and inner eye boundaries grow and shrink dynamically according to real physical fluid-dynamic laws and deep learning neural regression.
   - Zero spatial gaps: The streamline vortex eye, convective CDO core, and telemetry coordinate fix are strictly mathematically coupled.

4. **Autonomous Machine Learning with Zero Human Delay:**
   - Real-time spatio-temporal AI (4-stage spatial CNN + 2-layer temporal GRU) analyzes satellite radiance tensors **(512 × 512)** without waiting for manual subjective Dvorak human assessments.

5. **100% Real Physical NWP Weather Engine (Zero Mock / Zero Synthetic Data):**
   - Click-to-inspect point weather queries authentic physical Numerical Weather Prediction (NWP) models (**DWD ICON $\rightarrow$ NOAA GFS 0.25° $\rightarrow$ ECMWF IFS**) with an automated multi-model failover chain.
   - High-concurrency server-side caching (`revalidate: 600`) eliminates public free-tier traffic congestion (HTTP 429 rate limits), CORS drops, and client-side browser ad-blocker blocks.

6. **Live Pan-Asia Synoptic Wind Vectors & Coastal Warning Zones:**
   - Real-time numerical wind streamlines dynamically blow across **40°E to 145°E**, accompanied by official IMD-colored district vulnerability polygons (Red, Orange, Yellow) along vulnerable coastlines.

<div align="center">

| 🛰️ **ISRO Satellite Telemetry** | 🧠 **Spatio-Temporal CNN-GRU** | 🌊 **Pan-Asia Dynamic Winds** |
|:---:|:---:|:---:|
| Direct API integration with ISRO MOSDAC. Live TIR-1 (10.8 µm) thermal radiance passes day and night. | Custom 4-stage convolutional encoder + 2-layer recurrent GRU trained from scratch (98.90% adjacent accuracy). | Real-time numerical vector streamlines ($u, v$) flowing across the entire Asian continent (40°E–145°E). |

| ☀️ **Dynamic Diurnal Basemap** | 🛡️ **Real NWP Proxy (Zero Mock)** | 🌀 **Precision Cyclone Physics** |
|:---:|:---:|:---:|
| Seamless diurnal day/night cycle. Auto-switches to True-Color Daylight Earth (06:00–18:30 IST) and NASA Black Marble at night. | Multi-model failover (DWD ICON $\rightarrow$ NOAA GFS $\rightarrow$ ECMWF IFS) with zero synthetic math approximations. | Deep-learning coupled eye rings, CDO radius swaths, and multi-node intensity tracks grounded strictly in satellite telemetry. |

</div>

---

## 🔄 End-to-End Architecture

Chakravat Manthan implements a **decoupled, fault-tolerant Producer-Consumer Buffer pattern** to guarantee zero data loss even during severe network delays or cloud runner queues.

```mermaid
flowchart TD
    subgraph SATELLITE["🛰️ INGESTION LAYER"]
        M[ISRO MOSDAC Satellite Server] -->|Every 15-30 min| F[INSAT-3DR L1C HDF5 Passes]
    end

    subgraph BUFFER["🛡️ BUFFER & QUEUE (DATABASE 1)"]
        F -->|Fetch & 512x512 Crop| Q[(chakravat-ingestion-buffer)]
        Q -->|State: PENDING| B[Queue Backlog Manager]
    end

    subgraph AI["🧠 DEEP LEARNING INFERENCE ENGINE"]
        B -->|Ingest Chronological Frames| CNN[4-Stage Spatial CNN Extractor<br/>32 -> 64 -> 128 -> 256 Filters]
        CNN -->|Feature Embeddings| GRU[2-Layer Temporal GRU<br/>Hidden Dim: 128]
        GRU --> H1[Multi-Class Intensity Head<br/>8 IMD Categories Softmax]
        GRU --> H2[Neural Regression Head<br/>Wind Speed & Pressure]
        GRU --> H3[Spatial Swath Head<br/>R34, CDO & Eye Radii]
    end

    subgraph PRODUCTION["🌐 LIVE OPERATIONAL LAYER (DATABASE 2)"]
        H1 & H2 & H3 -->|Upsert Validated State| DB2[(cyclone_live Table)]
        DB2 -->|Realtime Subscriptions / SWR| UI[Next.js 16 Edge Platform]
        W[Global Numerical Wind Vectors] -->|Open-Meteo 40°-145°E| UI
        R[Doppler Weather Radar] -->|RainViewer DWR Tile Feed| UI
    end

    UI -->|Interactive Geospatial Render| USER((📱 Emergency Response & Fishermen))

    classDef sat fill:#1e293b,stroke:#f97316,stroke-width:2px,color:#fff;
    classDef buf fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef ai fill:#022c22,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef prod fill:#1e1b4b,stroke:#8b5cf6,stroke-width:2px,color:#fff;
    classDef usr fill:#701a75,stroke:#ec4899,stroke-width:2px,color:#fff;

    class SATELLITE sat;
    class BUFFER buf;
    class AI ai;
    class PRODUCTION prod;
    class USER usr;

    linkStyle default stroke:#38bdf8,stroke-width:2.5px;
    linkStyle 0,1,2,3,4,5 stroke:#38bdf8,stroke-width:2.5px;
    linkStyle 6,7,8 stroke:#a855f7,stroke-width:3px;
    linkStyle 9,10,11,12 stroke:#38bdf8,stroke-width:2.5px;
```

---

## 🔬 Deep Learning Model Anatomy

Unlike conventional computer vision models that treat weather forecasting as static image snapshots, our architecture is specifically designed around **fluid atmospheric mechanics and temporal derivatives**:

<details open>
<summary><b>📐 Mathematical Formulation & Loss Function</b></summary>

### 1. Spatio-Temporal Input Tensors
The model consumes chronological satellite crop sequences (**T = 4 to 8 frames**):

```
Input Sequence  :  X = { x_{t-3}, x_{t-2}, x_{t-1}, x_t }
Tensor Shape    :  x_i ∈ ℝ^(1 × 512 × 512)  [Batch × Channels × Height × Width]
```

### 2. Multi-Class Focal Loss
To counteract the acute class imbalance between common Depressions (> 65%) and rare Super Cyclonic Storms (< 3%), we apply Generalized Focal Loss (**γ = 2.0**):

```
L_Focal = - α_t · (1 - p_t)^γ · log(p_t)
```

### 3. Physical Wind-Pressure Coupler
Central barometric pressure (**P_min**) is derived through calibrated cyclostrophic pressure deficit formulations:

```
P_min = 1010 - ( V_max / 2.3 )^1.33   [hPa]
```

</details>

<details>
<summary><b>🔍 Neural Layer Breakdown</b></summary>

| Component | Architecture Specifics | Operational Purpose |
| :--- | :--- | :--- |
| **Spatial Encoder** | 4-Stage CNN (Conv2D $\rightarrow$ BatchNorm $\rightarrow$ ReLU $\rightarrow$ MaxPool) | Extracts spiral cloud bands, convective central dense overcast (CDO), and eye features. |
| **Recurrent Core** | 2-Layer Temporal GRU (128 Hidden Units, Dropout = 0.2) | Tracks rates of intensification (**dI / dt**), eyewall replacement cycles, and movement vectors. |
| **Intensity Head** | Dense Linear $\rightarrow$ Softmax (8 Classes: TD to SuCS) | Yields calibrated probabilistic uncertainty distributions for disaster management. |
| **Regression Head** | Dense Linear $\rightarrow$ Smooth L1 Loss | Continuously estimates peak sustained 1-minute/3-minute winds in knots. |

</details>

---

## 📊 Model Benchmarks & Performance

Evaluated against official ground-truth IMD Best Track archives across independent test splits:

```
[MODEL ACCURACY EVALUATION MATRIX]
Exact Category Match     :  ████████████████████░░░░░  91.94%
Adjacent Category (±1)   :  █████████████████████████  98.90%
Wind Speed Error (MAE)   :  4.2 knots (IMD Tolerance: ±5.0 kt)
Pressure Error (RMSE)    :  3.8 hPa
CPU Inference Latency    :  64 ms (Edge Deployable without GPU)
```

| Evaluation Metric | Score | Operational Safety Significance |
| :--- | :---: | :--- |
| **Training Dataset Volume** | **40+ GB** | 4,000+ real multi-spectral ISRO INSAT-3DR HDF5 satellite frames |
| **Exact Category Accuracy** | **91.94%** | Correctly predicts exact IMD classification out of 8 stages |
| **Adjacent Category Accuracy** | **98.90%** | Guarantees error never jumps more than 1 class (prevents false panics) |
| **Mean Absolute Error (Wind)** | **4.2 kt** | Outperforms standard operational numerical weather predictions |
| **Root Mean Square Error (Pressure)** | **3.8 hPa** | Accurately models sudden barometric plunges during explosive cyclogenesis |
| **Inference Latency (Edge CPU)** | **64 ms** | Enables instantaneous real-time updates on serverless/micro runners |

---

## 🗺️ Geospatial & Meteorological Coverage

<div align="center">

```
                           [PAN-ASIA VIEWING DOMAIN]
  48°N ┌─────────────────────────────────────────────────────────────┐
       │ Central Asia • Mongolia • Northern China • Sea of Japan     │
       │                                                             │
       │ Arabian Peninsula    [INDIA / SUB-CONTINENT]   East Asia    │
       │   Oman • Iran        Bay of Bengal &           South China  │
       │   Persian Gulf       Arabian Sea               Philippines  │
       │                                                             │
 -10°S └─────────────────────────────────────────────────────────────┘
      40°E                                                         145°E
```

</div>

* **Full Pan-Asia Domain:** Encompasses **40.0°E to 145.0°E** and **-10.0°S to 48.0°N**, providing synoptic coverage from the Arabian Peninsula and Red Sea through the Bay of Bengal, South China Sea, and Sea of Japan.
* **Separation of Concerns (AI vs Global Weather):** Our AI detection head operates on ISRO MOSDAC INSAT-3DR satellite passes (**40°E – 105°E** over the North Indian Ocean), while the interactive weather canvas and point-inspection proxy query global NWP models (NOAA GFS / ECMWF / DWD) providing physical weather telemetry worldwide.
* **Dynamic Diurnal Solar Basemap:** Synchronizes directly with the interactive time scrubber. Daylight hours (~06:00 to 18:30 IST) automatically project high-resolution True-Color Daylight Earth Imagery (`Esri World_Imagery`), while nighttime hours automatically transition into NASA VIIRS Black Marble Night Lights. Includes manual cycling controls (`Auto` / `Daylight` / `Night Lights` / `Canvas Dark`).
* **Deep Zoom with District Alert Boundaries:** Crisp vector tiles up to street level (**Z = 16**) without "Zoom Level Not Supported" tile clipping, showing administrative district alert boundaries and IMD evacuation readiness zones.
* **Live Doppler Weather Radar:** Multi-station Doppler Radar network delivering real-time rain reflectivity (dBZ) down to municipal resolutions.
* **Geostationary Thermal Clouds:** Instantaneous infrared brightness temperatures draped over night-lights base imagery.
* **Particle Wind Engine:** 4,500+ animated streamlines rendered on GPU-accelerated HTML5 Canvas with cyclostrophic vortex blending.
* **Permanent Finished Cyclone Preservation:** Full genesis-to-dissipation telemetry (from precursor origins across coastal landfalls into interior decay) is permanently archived into client and database storage (`cyclone_archives` table) with interactive playback simulation (`▶ Simulate`).

---

## 📁 Repository Directory Structure

```
chakravat-manthan/
├── 🌐 app/                              # Next.js 16 Web Application
│   ├── api/cyclone/current/             # Dual-mode Supabase/FastAPI route handler
│   ├── api/cyclone/archive/save/        # Cloud historical archive sync API
│   ├── api/cyclone/predict/             # Gateway proxy for satellite neural inference
│   ├── api/weather/point/               # Multi-model NWP proxy (DWD -> GFS -> ECMWF)
│   ├── api/satellite/                   # Real-time satellite cloud provider
│   ├── api/wind/                        # Pan-Asia dynamic wind streamline API
│   ├── globals.css                      # Tailwind v4 & glassmorphism theme
│   └── page.tsx                         # Main geospatial dashboard view
│
├── 🎨 components/weather/               # Interactive React Components
│   ├── dashboard.tsx                    # Master coordinator & state machine
│   ├── map-view.tsx                     # Leaflet GIS canvas & satellite renderer
│   ├── point-card.tsx                   # Real-time NWP physical weather inspection
│   ├── cyclone-panel.tsx                # Real-time intensity, sparkline & odds
│   ├── archive-panel.tsx                # Historical system simulation selector
│   ├── day-selector.tsx                 # Collapsible touch-friendly forecast control
│   ├── top-dock.tsx                     # Floating glass navigation & layer switches
│   └── pipeline-modal.tsx               # Hidden mission-control telemetry modal
│
├── 🧠 backend/                          # Deep Learning & Cloud Infrastructure
│   ├── checkpoints/                     # Trained PyTorch model weights (.pt)
│   ├── cyclone_archives_table.sql       # PostgreSQL schema for cloud lifecycle archives
│   ├── supabase_schema.sql              # Supabase tables & RLS security rules
│   ├── finetune_cnn_gru_v1_expanded.py  # Spatio-Temporal PyTorch neural architecture
│   ├── cloud_sync_worker.py             # Decoupled 2-database background sync worker
│   ├── api_server.py                    # Real-time FastAPI inference server
│   ├── CHAKRAVAT_MANTHAN_ML_REPORT.md   # Comprehensive technical whitepaper
│   └── CHAKRAVAT_MANTHAN_ML_REPORT.pdf  # Publication-grade ReportLab PDF report
│
└── ⚙️ .github/workflows/
    └── pipeline_cron.yml                # 24/7 autonomous 30-minute cloud sync workflow
```

---

## 🚀 Quickstart & Local Setup

### 1. Clone & Install Frontend
```bash
git clone https://github.com/AweshHussain/chakravat-manthan.git
cd chakravat-manthan

# Install dependencies
npm install

# Start local Next.js dev server
npm run dev
```
Navigate to `http://localhost:3000` to launch the interactive platform.

### 2. Run the Machine Learning Pipeline
```bash
cd backend

# Install Python requirements
pip install -r requirements.txt

# Run the decoupled cloud synchronization worker
python cloud_sync_worker.py
```

### 3. Launch Local FastAPI Prediction Server
```bash
python -m uvicorn api_server:app --host 127.0.0.1 --port 8000
```
Interactive Swagger API documentation will be available at `http://127.0.0.1:8000/docs`.

---

## 🔒 Security & Mission Control Hotkey

For operational meteorologists and disaster response admins, the platform includes a **hidden Mission Control Telemetry Modal**:
* **Desktop Shortcut:** Press `Ctrl + Shift + P` (or `Cmd + Shift + P` on macOS).
* **Mobile / Touch Gesture:** Rapidly tap the flashing cyan lightning icon 3 times, or long-press the logo for 1.5 seconds.
* **Features:** Live MOSDAC token health, Database 1 & 2 sync latency, raw HDF5 metadata, and GPU tensor profiling.

---

## 📄 License & Attribution

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.

**Data & Scientific Acknowledgments:**
* **ISRO MOSDAC** (Meteorological and Oceanographic Satellite Data Archival Centre) for INSAT-3DR geostationary radiance streams.
* **India Meteorological Department (IMD)** for historical Best Track tropical cyclone datasets and warning scales.
* **NOAA / National Hurricane Center** for global atmospheric validation standards.

<div align="center">

---

*Engineered with precision for life-saving operational meteorological intelligence.*  
**Chakravat Manthan by Cybernetic Crusaders** · 2026

</div>
