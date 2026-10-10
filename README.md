# Commercial Building Electrical Power System Visualization
## Educational 3D & Analytical Interactive Power System Design

**Course:** EEA108D Power System Design — Capstone Project  
**Group:** Group 1 — Commercial Building Electrical Power System  
**Institution:** School of EECE, Mapua University  
**Authors:** John Ray O. Dalida, Kent Aldrich Cusi, Reynhard Heinrich Pasion  
**Revision:** Revision 0 (10 October 2026)  
**Checksums:** `4af2946ec053642f25383ae517897351` / `57014c8b6aba06a59aaea27147967012`

---

## 1. Project Overview & Scope

This application is an educational, interactive engineering visualization of the electrical supply and distribution subsystem of a **12,000 m² six-storey commercial building** (Floors 1–2 retail: 4,000 m²; Floors 3–6 office: 8,000 m²) in Metro Manila, Philippines.

The boundary encompasses:
1. **Utility Service Entrance:** 13.8 kV, 3-phase, 60 Hz radial service with primary revenue CT/VT metering and 17.5 kV / 25 kA vacuum switchgear (`HV-01`).
2. **Step-Down Substation:** **Alternative 1 (Selected Design)**: 1 × 1,250 kVA, Dyn11, 13.8 kV / 400 V, 6.0% Z transformer with 1.025 no-load tap boost; evaluated against **Alternative 2**: 2 × 800 kVA transformers with normally open interlocked bus tie.
3. **Main Low-Voltage Distribution Board (`MDB-A`):** 2,500 A copper busbar, main air circuit breaker (`Q0`: 2,500 AF / 2,200 AT, 50 kA), and 10 parallel sets of 300 mm² copper conductors with 200% neutral sizing.
4. **Radial Distribution Feeder Network:** Individual derated radial copper feeders to all six floor panels (`P-F1` to `P-F6`), essential distribution panel (`EDB`), and mechanical distribution panel (`MDP`).
5. **Dedicated Fire Protection Circuit:** 37 kW electric fire pump motor connected **directly ahead of the main building breaker `Q0`** via a listed 200 A controller/ATS (`FP-ATS`), preserving life-safety pumping continuity.
6. **Automatic Power Factor Correction (`C1 / APFC`):** 400 kVAr net output at 400 V, 16 × 25 kVAr steps with **7% series detuned iron-core reactors** (tuning frequency 226.8 Hz / harmonic order 3.78) to prevent resonance with 5th and 7th harmonics.
7. **Standby Emergency System:** 400 kVA / 320 kW diesel generator set (`GEN-1`) supplying essential loads only via open-transition 4-pole transfer switches (`ATS-E` and `FP-ATS`). **Strictly isolated operation with no utility paralleling.**

---

## 2. Design Assumptions & Engineering Disclaimers

In strict conformance with the capstone report's methodology:
- **Numerical Labels:**
  - `Assumed`: Designer inputs from the design brief (frozen before computation).
  - `Calculated`: Mathematical derivations from the stated inputs.
  - `Simulation Result`: Solved outputs from the independent Python backward/forward load-flow solver and nodal admittance matrix fault checker.
  - `Selected Design`: Equipment ratings chosen from standard manufacturer procurement classes.
- **Academic Status:** This is an academic engineering design. Protection settings are preliminary starting points; manufacturer time-current curves (TCC), approved submittals, and site utility impedance confirmation are commissioning closure items. No professional seal or construction approval is represented.
- **Honest Payback Disclosure:** The website explicitly states that the APFC bank yields **no positive energy-only electricity bill savings** at Year 0 (-PHP 16,377.69/year) because 5 W/kVAr internal reactor losses exceed upstream cable I²R savings under the assumed tariff (PHP 12/kWh). It is justified strictly as a **capacity release (+96.95 kVA now / +139.36 kVA at Year 10), voltage boost, and Philippine Distribution Code compliance investment**.
- **Budget Disclosure:** Both Alternative 1 (PHP 28.98M) and Alternative 2 (PHP 33.95M) exceed the owner's soft planning target (PHP 25.00M). This overrun is disclosed openly.

---

## 3. Technology Stack

- **Framework:** React 18 + TypeScript + Vite
- **3D Graphics Engine:** Babylon.js 7.54 (`@babylonjs/core`) with WebGPU support and automatic WebGL2 fallback
- **Styling:** Tailwind CSS with an engineering dark navy / charcoal palette and KaTeX / JetBrains Mono typography
- **Data Decoupling:** Model inputs and solver outputs are stored in standalone JSON and CSV datasets in `src/data/`, maintaining electrical model independence from rendering.

---

## 4. Setup and Run Instructions

### Prerequisites
- Node.js (v18.0 or newer; tested on Node.js v25.9.0)
- npm (v9.0 or newer)

### Installation
From the project directory (`commercial-building-pwr-viz`):
```bash
npm install
```

### Development Mode (Live Hot Reloading)
```bash
npm run dev
```
Open your browser at `http://localhost:3000` (or the terminal-reported port).

### Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 5. Main Experience & Interactive Views

### 1. System Overview
- Executive summary of the 1,250 kVA recommended system, ratings, key path, and major caveats.
- Multi-stage power flow breakdown: Utility → Transformation → Main LV Board → APFC → Radial Feeders.
- Highlights the dedicated fire-pump takeoff ahead of `Q0` and isolated generator operation.

### 2. 3D Building & Electrical Distribution View
- Abstract 6-storey commercial building with cutaway translucent shell, floor slabs, and plant rooms.
- Procedural, manufacturer-neutral 3D equipment models:
  - Utility intake & 17.5 kV / 25 kA switchgear (`HV-01`)
  - Revenue CT/VT meter (`METER`)
  - 1,250 kVA oil transformer with cooling fins, conservator tank, and bushings (`T1`)
  - 2,500 A Main Distribution Board (`MDB-A`) and main breaker (`Q0`)
  - 400 kVAr APFC bank with capacitor cells and series detuned reactors (`C1`)
  - 400 kVA standby diesel generator with acoustic canopy and exhaust stack (`GEN-1`)
  - Essential 4-pole ATS (`ATS-E`) and listed fire-pump controller (`FP-ATS`)
  - 37 kW fire pump motor (`FP-MOTOR`) and booster water pumps in basement
  - Floor distribution panels (`P-F1` to `P-F6`) with retail vs. office occupancy
  - Rooftop VRF outdoor condensing units and elevator traction machine penthouse
  - Multi-tier cable riser ladder and color-coded feeder routes
- **Controls & Interactions:**
  - Orbit, Pan, and Zoom with camera presets: Home/Iso, Substation Plant, Riser, Retail (L1-2), Office (L3-6), Rooftop, Basement.
  - Building shell mode: Cutaway, Normal, Hidden, with smooth Opacity slider.
  - Exploded assembly slider (0% to 100%) that vertically separates floors and fans out plant room equipment to reveal internal bus connections.
  - Category visibility toggles: HV 13.8 kV, Transformer, Main LV, Floor Panels, APFC, Generator & Fire, Loads.
  - Click-to-inspect: Clicking any equipment in 3D opens the Inspector Panel with tag, rating, report section, formula, and "Why This Matters" educational notes.
  - Accessible Non-3D View: A toggleable full tabular equipment schedule for screen-readers and low-bandwidth environments.

### 3. Single-Line Diagram (SLD)
- Zoomable, pannable interactive SVG diagram with IEEE/IEC standard symbols.
- Switchable modes: Alternative 1 Final (E-02/E-04/E-05), Alternative 2 Split-Bus (E-08), and Preliminary (E-01).
- Overlays for preliminary protection settings (51, 50, 87T, REF, long-time, short-time, ground-fault) and solved bus voltages.
- Synchronized bidirectionally with the 3D model: clicking an SLD node highlights the 3D equipment.

### 4. Load & Commercial Demand
- 10-row load schedule table with connected kW, efficiency, PF, demand factors, and coincidence factors.
- 24-hour commercial daily load profile chart (Figure 1 & Table 7) displaying load factor (0.5875), loss factor (0.4394), and HVAC peak share (43.60%).
- 10-year growth projection table (Table 10 & 21) at 3% annual growth.
- Interactive compound growth calculator (labeled "Website Calculation").

### 5. Power Factor Correction (APFC)
- Interactive power triangles (Figure 7) displaying before/after apparent power, displacement PF, and reactive power.
- 7% series detuned reactor engineering: resonant frequency calculation (226.78 Hz), capacitor voltage rise, and 480 V element sizing.
- Bare-capacitor parallel resonance order screen (Table 23) demonstrating why plain shunt capacitors risk 7th harmonic amplification.
- Displacement PF vs. True PF under 15% THDi.
- Honest economic payback analysis (Table 24): reveals negative energy-only payback at Year 0 (-PHP 16,378/yr) and 116.7-year payback at Year 10.

### 6. Voltage & Equipment Loading
- Figure 4 (E-10): Solved voltage profile under Year 10 Low-Utility supply (0.975 pu), highlighting that farthest bus F6 (388.92 V) maintains 384.92 V at equipment terminals (&gt; 380 V min limit: OK).
- Table 16: Multi-scenario bus voltages (Present uncorrected, Present corrected, Year 10 corrected, Year 10 low source).
- Table 17 & 35: Cable route lengths, impedances, percentage voltage drops (all ≤ 3%), and thermal loading percentages.
- Table 36: Hand calculation vs. Python solver comparison explaining the 0.12% difference (iterative constant-PQ / V² cap vs. fixed 400 V hand current).

### 7. Short-Circuit & Protection Design
- Table 19: Maximum three-phase fault duty by bus (PCC, HV, T, MDB, F1-F6, EDB, MDP, FIRE) comparing utility contribution, motor bounding (5.02 kA), total duty, and equipment classes (50 kA LV, 25 kA HV).
- Figure 5: Positive-sequence impedance network diagram referred to 400 V base.
- Table 20: Protection coordination schedule for all breakers and relays.
- Engineering verification checks: Transformer inrush screen (800 A &gt; 627.6 A), Zone Selective Interlocking (ZSI) grading margins, and F6 earth-loop sensitivity screen (10,243 A &gt;&gt; 80 A pickup).

### 8. Design Alternatives & Economics
- Side-by-side comparison (Table 26) between Alternative 1 (1 × 1,250 kVA) and Alternative 2 (2 × 800 kVA split-bus with normally open tie).
- Alternative 2 N-1 overload hazard: Explains that full Year 10 load causes 131.11% overload on one 800 kVA transformer, requiring **mandatory 45% load shedding** before closing tie QT.
- Common-mode vulnerability: Neither alternative provides utility grid redundancy; both share the single 13.8 kV radial feeder.
- Full Bill of Materials (Tables 27–29) and life-cycle present value analysis (Table 30).
- Weighted decision matrix: Alternative 1 scores 4.05/5 versus Alternative 2's 3.85/5.

### 9. Assumptions, Standards & Report Files
- Tabulated design brief (Table 3 & 6) and regulatory standards hierarchy (PEC 2017, Philippine Distribution Code, IEEE Color Books, IEC 60909, IEC 60076, IEC 60364).
- Table 32: Required closure actions before procurement and commissioning.
- Direct PDF report viewer/download link (`/Commercial_Building_Power_System_Design_Report.pdf`).
- Simulation package datasets (`.json` and `.csv`) with raw viewers.

---

## 6. Color Legend & Conventions

| Meaning | Color | Hex Code |
| :--- | :--- | :--- |
| **Medium Voltage / Fire Pump** | Crimson / Red | `#ef4444` / `#dc2626` |
| **Normal 400 V LV Power Flow** | Cyan / Sky Blue | `#38bdf8` / `#0ea5e9` |
| **Emergency Standby / ATS** | Amber / Orange | `#f59e0b` / `#d97706` |
| **Detuned APFC (p = 7%)** | Emerald Green | `#10b981` |
| **Inspected / Selected Item** | Purple / Violet | `#a855f7` |
| **Neutral Conductor (200%)** | Slate Gray | `#94a3b8` |
| **Protective Earth (PE)** | Lime Green | `#84cc16` |
| **Limit Warning / Caveat** | Yellow | `#eab308` |
