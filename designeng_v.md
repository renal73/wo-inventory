# Design Document — Anvita System
## Arsitektur, Tech Stack, & Panduan Desain

**Versi**: 1.1.0  
**Tanggal**: Juni 2026  
**Changelog**: Penambahan Modul Mesin, Sistem Autentikasi, Manajemen User, dan improvement desain.

---

## 1. Arsitektur Sistem

### 1.1 Arsitektur Monolitik (Unified)

Anvita System menggunakan arsitektur **monolitik** dimana frontend dan backend tergabung dalam satu proyek Next.js:

```mermaid
flowchart TB
    subgraph CLIENT["Browser / Client"]
        UI["React Components<br/>(CSR - Client Side Rendering)"]
    end

    subgraph NEXTJS["Next.js 16 (Port 3000)"]
        MIDDLEWARE["Auth Middleware<br/>(JWT Validation)"]
        PAGES["App Router Pages<br/>/, /inventory, /transactions, /machines, /admin, /login"]
        API["API Route Handlers<br/>/api/*"]
    end

    subgraph DATA["Data Layer"]
        PRISMA["Prisma ORM<br/>(v6.9.0)"]
        DB[("PostgreSQL<br/>anvita_db")]
    end

    UI -->|"HTTP fetch /api/*"| MIDDLEWARE
    MIDDLEWARE --> API
    NEXTJS --> PAGES
    API --> PRISMA
    PRISMA --> DB
    UI <-->|"HTML/CSS/JS"| PAGES

    style CLIENT fill:#f0f9ff,stroke:#3b82f6
    style NEXTJS fill:#f0fdf4,stroke:#22c55e
    style DATA fill:#fefce8,stroke:#eab308
```

### 1.2 Alur Autentikasi

```mermaid
flowchart TD
    A["User buka halaman"] --> B{"Cookie sesi valid?"}
    B -->|Tidak| C["/login — Halaman Login"]
    C --> D["User input username + password"]
    D --> E["POST /api/auth/login"]
    E --> F{"Kredensial valid?"}
    F -->|Tidak| G["Error: Username/password salah"]
    G --> D
    F -->|Ya| H["Generate JWT, set HTTP-only cookie"]
    H --> I["Redirect ke Dashboard /"]
    B -->|Ya| J["Decode JWT → ambil role"]
    J --> K{"Halaman butuh Admin?"}
    K -->|Ya, User bukan Admin| L["Redirect /403"]
    K -->|Tidak| M["Render halaman normal"]
```

### 1.3 Network Topology

```mermaid
flowchart LR
    A["👤 User Internal<br/>(LAN)"] -->|"http://10.x.x.x:3000"| B
    C["👤 User Eksternal"] -->|"tunnel URL"| B
    B["Next.js + Auth Middleware<br/>0.0.0.0:3000"]
    B --> D[("PostgreSQL<br/>localhost:5432")]
```

---

## 2. Tech Stack

### 2.1 Frontend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Next.js** | 16.2.6 | Framework React fullstack (App Router) |
| **React** | 19.2.4 | UI library |
| **TypeScript** | 5.x | Type safety |
| **TailwindCSS** | 4.x | Utility-first CSS framework |
| **Framer Motion** | 12.x | Animasi & transisi |
| **Recharts** | 3.x | Grafik & chart (BarChart, PieChart) |
| **Lucide React** | 1.x | Icon library |
| **Canvas Confetti** | 1.x | Efek visual celebratory |

### 2.2 Backend (Next.js API Routes)

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Next.js Route Handlers** | 16.x | REST API endpoints |
| **Prisma ORM** | 6.9.0 | Database ORM & migration |
| **Jose** | latest | JWT signing & verification (HTTP-only cookie) |
| **Bcrypt** | latest | Password hashing (cost factor 12) |
| **csv-parse** | latest | Parsing file CSV untuk import |

### 2.3 Database

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **PostgreSQL** | 15+ | Relational database utama |

### 2.4 Font

| Font | Sumber | Fungsi |
|------|--------|--------|
| **Geist Sans** | Google Fonts (next/font) | Body text, UI labels |
| **Geist Mono** | Google Fonts (next/font) | Part IDs, kode mesin, data teknis |

---

## 3. Struktur Folder — Diperbarui

```
nginvanv/
├── prisma/
│   └── schema.prisma              # Database schema (8 models)
├── src/
│   ├── middleware.ts               # [BARU] Auth middleware (JWT check semua route)
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/               # [BARU]
│   │   │   │   ├── login/route.ts  # POST — login
│   │   │   │   ├── logout/route.ts # POST — logout
│   │   │   │   └── me/route.ts     # GET — current user
│   │   │   ├── users/              # [BARU] Admin only
│   │   │   │   ├── route.ts        # GET, POST
│   │   │   │   └── [id]/route.ts   # PUT, DELETE
│   │   │   ├── machines/           # [BARU]
│   │   │   │   ├── route.ts        # GET, POST
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts    # GET, PUT, DELETE
│   │   │   │       └── parts/
│   │   │   │           ├── route.ts           # GET, POST
│   │   │   │           └── [partId]/route.ts  # PUT, DELETE
│   │   │   ├── categories/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── purposes/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── parts/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── history/route.ts
│   │   │   │   └── export/csv/route.ts
│   │   │   ├── transactions/
│   │   │   │   ├── inbound/route.ts
│   │   │   │   └── outbound/route.ts
│   │   │   ├── dashboard/
│   │   │   │   ├── stats/route.ts
│   │   │   │   ├── chart/route.ts
│   │   │   │   ├── top-outbound/route.ts
│   │   │   │   ├── low-stock/route.ts
│   │   │   │   ├── recent-activity/route.ts
│   │   │   │   └── machine-alerts/route.ts    # [BARU]
│   │   │   ├── import-csv/route.ts
│   │   │   ├── seed/route.ts
│   │   │   └── health/route.ts
│   │   ├── login/page.tsx          # [BARU] Halaman login
│   │   ├── machines/               # [BARU]
│   │   │   ├── page.tsx            # Daftar mesin
│   │   │   └── [id]/page.tsx       # Detail mesin + tab Elec/Mech
│   │   ├── admin/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── favicon.ico
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Shell.tsx           # App shell (sidebar + header + main)
│   │   │   ├── Sidebar.tsx         # Sidebar navigasi (collapsible, role-aware)
│   │   │   └── Header.tsx          # Top header bar (+ user info + logout)
│   │   ├── auth/                   # [BARU]
│   │   │   └── AuthGuard.tsx       # Wrapper komponen untuk proteksi client-side
│   │   ├── machines/               # [BARU]
│   │   │   ├── MachineCard.tsx     # Kartu mesin di halaman list
│   │   │   ├── MachinePartTable.tsx# Tabel part (Elec/Mech) + stok real-time
│   │   │   └── AssignPartModal.tsx # Modal assign part ke mesin (Admin)
│   │   └── ui/
│   │       ├── MagicCard.tsx
│   │       ├── NumberTicker.tsx
│   │       ├── AnimatedList.tsx
│   │       ├── QrCode.tsx
│   │       ├── RoleBadge.tsx       # [BARU] Badge "Admin" / "User"
│   │       └── StatusBadge.tsx     # [BARU] Badge status mesin (Aktif/Maintenance/Tidak Aktif)
│   └── lib/
│       ├── api.ts                  # Frontend API client (fetch wrapper + auth header)
│       ├── auth.ts                 # [BARU] JWT helpers, session utilities
│       └── prisma.ts               # Prisma client singleton
├── .env                            # DATABASE_URL, JWT_SECRET
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 4. Design System

### 4.1 Palet Warna

```
┌─────────────────────────────────────────────────────┐
│  PRIMARY (Corporate Blue)                           │
│  ████████  #2563eb (primary)                        │
│  ████████  #3b82f6 (ring/focus)                     │
│  ████████  #60a5fa (chart bar 1)                    │
│  ████████  #93c5fd (chart bar 2)                    │
│                                                     │
│  SEMANTIC COLORS                                    │
│  ████████  #f97316  Orange  — Barang Keluar         │
│  ████████  #ef4444  Rose    — Destructive/Low Stock │
│  ████████  #22c55e  Emerald — Success / Stok Cukup  │
│  ████████  #eab308  Amber   — Warning / Menipis     │
│  ████████  #8b5cf6  Violet  — Mesin / Machine       │
│                                                     │
│  ROLE COLORS                                        │
│  ████████  #2563eb  Blue   — Badge Admin            │
│  ████████  #64748b  Slate  — Badge User             │
│                                                     │
│  NEUTRALS (Slate)                                   │
│  ████████  #0f172a  slate-900 — Heading text        │
│  ████████  #334155  slate-700 — Body text           │
│  ████████  #64748b  slate-500 — Muted text          │
│  ████████  #94a3b8  slate-400 — Placeholder         │
│  ████████  #e2e8f0  slate-200 — Border              │
│  ████████  #f1f5f9  slate-100 — Card accent bg      │
│  ████████  #f8fafc  slate-50  — Page background     │
│  ████████  #ffffff            — Card background     │
└─────────────────────────────────────────────────────┘
```

### 4.2 Tipografi

| Elemen | Font | Weight | Size | Contoh |
|--------|------|--------|------|--------|
| **Heading besar** | Geist Sans | 800 | text-xl | "Selamat Datang..." |
| **Heading kartu** | Geist Sans | 700 | text-sm | "Daftar Mesin" |
| **Metrik angka** | Geist Sans | 800 | text-3xl | "1,250" |
| **Label uppercase** | Geist Sans | 600 | text-[10px] | "TOTAL MESIN" |
| **Body text** | Geist Sans | 500 | text-xs | "SKU terdaftar" |
| **Part ID / Machine Code** | Geist Mono | 700 | text-xs | "EL-001", "MCH-003" |
| **Badge Role** | Geist Sans | 700 | text-[10px] | "Admin", "User" |
| **Badge Status** | Geist Sans | 700 | text-[10px] | "Aktif", "Maintenance" |

### 4.3 Spacing & Radius

| Token | Nilai | Penggunaan |
|-------|-------|-----------|
| **Radius besar** | 16px (`rounded-2xl`) | Card, modal |
| **Radius medium** | 12px (`rounded-xl`) | Inner card, panel |
| **Radius kecil** | 8px (`rounded-lg`) | Button, input, badge |
| **Radius full** | 9999px (`rounded-full`) | Badge pill, avatar |
| **Card padding** | 20px (`p-5`) | Konten utama kartu |
| **Section gap** | 24px (`gap-6`) | Antar section |
| **Inner gap** | 16px (`gap-4`) | Antar elemen dalam section |

### 4.4 Komponen UI Kustom

#### MagicCard
Card dengan efek gradient hover mengikuti posisi kursor. Menggunakan Framer Motion untuk mouse position tracking.

#### NumberTicker
Animasi penghitung angka dari 0 ke target value. Mendukung custom formatter (Rupiah). Menggunakan `requestAnimationFrame`.

#### AnimatedList
List container yang menampilkan children satu per satu dengan delay stagger. Fade-in + slide-up.

#### QrCode
SVG-based QR Code generator. Menerima `value` dan `size`. Digunakan untuk label rak gudang.

#### RoleBadge *(BARU)*
Badge pill yang menampilkan role user. Admin: latar biru, tulisan putih. User: latar slate-100, tulisan slate-600.

#### StatusBadge *(BARU)*
Badge pill status mesin:
- **Aktif**: latar emerald-100, teks emerald-700, dot hijau
- **Maintenance**: latar amber-100, teks amber-700, dot kuning berkedip
- **Tidak Aktif**: latar slate-100, teks slate-500, dot abu

#### MachineCard *(BARU)*
Card mesin di halaman list. Menampilkan kode mesin (Geist Mono), nama, area, status badge, ringkasan jumlah part, dan indikator alert merah jika ada part kritis.

---

## 5. Layout & Navigasi

### 5.1 Shell Layout

```
┌──────────────────────────────────────────────┐
│ ┌──────┐ ┌─────────────────────────────────┐ │
│ │      │ │ HEADER (Search + Breadcrumb +   │ │
│ │      │ │         User info + Logout)     │ │
│ │ SIDE │ ├─────────────────────────────────┤ │
│ │ BAR  │ │                                 │ │
│ │      │ │         MAIN CONTENT            │ │
│ │ 260px│ │                                 │ │
│ │  or  │ │   (page.tsx rendering area)     │ │
│ │ 76px │ │                                 │ │
│ │      │ │                                 │ │
│ └──────┘ └─────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 5.2 Sidebar (Collapsible, Role-Aware)

- **Expanded**: 260px — ikon + label teks
- **Collapsed**: 76px — ikon saja + tooltip hover
- Toggle: tombol bulat kecil di border kanan
- Animasi: Spring transition (Framer Motion)

**Menu Items:**

| Ikon | Label | Path | Akses |
|------|-------|------|-------|
| LayoutDashboard | Dashboard | `/` | Semua |
| ArrowLeftRight | Transaksi In/Out | `/transactions` | Semua |
| Package | Data Barang | `/inventory` | Semua |
| Cog | Mesin | `/machines` | **[BARU]** Semua |
| Settings | Panel Admin | `/admin` | **Admin only** (tersembunyi untuk User) |

**Bagian bawah sidebar:**
- Avatar + nama user yang login
- Badge role (Admin / User)
- Tombol Keluar (logout)

**Active state**: Background pill biru dengan animasi `layoutId` (shared layout animation Framer Motion)

### 5.3 Header — Diperbarui

- **Kiri**: Breadcrumb otomatis berdasarkan path aktif
- **Tengah**: Global search bar
- **Kanan**: Nama user + badge role + tombol logout

### 5.4 Halaman Login (`/login`)

Layout terpusat (centered), tanpa sidebar:

```
┌─────────────────────────────────────┐
│                                     │
│        🔧 Anvita System             │
│   Sistem Inventaris Engineering     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Username                     │  │
│  │  [_________________________]  │  │
│  │                               │  │
│  │  Password                     │  │
│  │  [_________________________]  │  │
│  │                               │  │
│  │  [═══════ Masuk ═══════════]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  PT Anvita Pharma Indonesia         │
└─────────────────────────────────────┘
```

---

## 6. Wireframe Halaman

### 6.1 Dashboard — Diperbarui

```
┌─────────────────────────────────────────────────┐
│  [Banner: Selamat datang, {nama}]  [3 item kritis]│
├──────┬──────┬──────┬──────┬────────────────────  ┤
│ SKU  │ Aset │Keluar│Alert │ Mesin Aktif  [BARU]  │
│ KPI  │ KPI  │ KPI  │ KPI  │    KPI                │
├──────┴──────┴──────┴──────┴───────────────────── ┤
│                           │                       │
│  [Bar Chart Tren]         │  [Donut Chart]        │
│  Masuk vs Keluar          │  Top 4 Outbound       │
│                           │                       │
├───────────────────────────┼───────────────────────┤
│  [Low Stock Grid]         │  [Activity Feed]      │
│  4 item kritis            │  5 aktivitas terbaru  │
├───────────────────────────┴───────────────────────┤
│  [BARU] Widget Machine Alerts                     │
│  Mesin dengan part kritis → MCH-001, MCH-003...  │
└───────────────────────────────────────────────────┘
```

### 6.2 Data Barang — Diperbarui

```
┌─────────────────────────────────────────────────────┐
│  [🔍 Search]  [Stok Menipis] [Di Mesin] [CSV-Admin] │
│  Kategori: [▾]   Lokasi Rak: [▾]                    │
├─────────────────────────────────────────────────────┤
│ Part ID │ Nama        │ Kategori │ Stok │ Rak │ Harga │ Mesin │ Aksi       │
│ EL-001  │ Motor AC... │ Elektrik │  8   │ A-01│ 8.5M  │ 🔵×2  │ QR|📜|✏|🗑│
│ ME-002  │ V-Belt...   │ Mekanik  │  3 🔴│ B-02│ 85K   │ 🔵×1  │ QR|📜|✏|🗑│
├─────────────────────────────────────────────────────┤
│  [< 1/2 >]   Aksi Edit & Hapus hanya tampil Admin  │
└─────────────────────────────────────────────────────┘
```

### 6.3 Mesin — Daftar (`/machines`) *(BARU)*

```
┌────────────────────────────────────────────────────┐
│  Daftar Mesin Produksi        [+ Tambah — Admin]   │
│  [🔍 Search Mesin]  Area:[▾]  Status:[▾]           │
├────────────┬────────────┬────────────┬─────────────┤
│ ┌────────┐ │ ┌────────┐ │ ┌────────┐ │ ┌─────────┐ │
│ │MCH-001 │ │ │MCH-002 │ │ │MCH-003 │ │ │MCH-004  │ │
│ │Mesin   │ │ │Mixing  │ │ │Kompresor│ │ │Conveyor │ │
│ │Tablet  │ │ │Tank    │ │ │Udara   │ │ │Packing  │ │
│ │⚡12 🔧8│ │ │⚡6  🔧3│ │ │⚡4  🔧9│ │ │⚡8  🔧5 │ │
│ │🟢 Aktif│ │ │🟡 Maint│ │ │🔴KRITIS│ │ │🟢 Aktif │ │
│ └────────┘ │ └────────┘ │ └────────┘ │ └─────────┘ │
└────────────┴────────────┴────────────┴─────────────┘
```

### 6.4 Mesin — Detail (`/machines/[id]`) *(BARU)*

```
┌────────────────────────────────────────────────────┐
│  ← Kembali                                         │
│  MCH-001 — Mesin Tablet Coating         [✏][🗑]   │
│  📍 Produksi Lantai 1   🟢 Aktif                   │
│  "Mesin coating tablet kapasitas 200kg/batch"      │
├────────────────────────────────────────────────────┤
│  [⚡ Electrical Parts (12)]  [🔧 Mechanical Parts (8)]│
├────────────────────────────────────────────────────┤
│ Part ID │ Nama Part         │ Stok  │ Min Rek │ Status │
│ EL-001  │ Motor AC 5.5kW    │  8    │   2     │ ✅     │
│ EL-007  │ Inverter Omron    │  2    │   1     │ ✅     │
│ EL-012  │ Kontaktor 25A     │  1    │   3     │ 🔴     │
│ ...     │ ...               │  ...  │  ...    │ ...    │
├────────────────────────────────────────────────────┤
│  [+ Assign Electrical Part — Admin only]           │
└────────────────────────────────────────────────────┘
```

### 6.5 Panel Admin — Diperbarui

```
┌──────────────────────────────┬──────────────────────┐
│  Kelola Kategori Master      │  Tujuan Penggunaan   │
│  [Input Nama] [+ Tambah]     │  [Input] [+]         │
│  Icons: [Zap][Wrench][Cpu].. │  ☑ PM                │
│  ┌──────────┐ ┌──────────┐  │  ☑ Breakdown         │
│  │⚡Elektrik│ │🔧Mekanik │  │  ☐ Overhaul          │
│  └──────────┘ └──────────┘  │  ☑ Modifikasi        │
├──────────────────────────────┼──────────────────────┤
│  Import Data CSV             │  Manajemen User [NEW]│
│  [📁 Choose File] [Upload]   │  ┌────────────────┐  │
├──────────────────────────────┤  │ reza  Admin  ✏🗑│  │
│  Manajemen Database          │  │ budi  User   ✏🗑│  │
│  [Seed Dummy] [Hapus Semua]  │  │ sari  User   ✏🗑│  │
│                              │  └────────────────┘  │
│                              │  [+ Tambah User]     │
└──────────────────────────────┴──────────────────────┘
```

---

## 7. Flow Diagram

### 7.1 Flow Autentikasi *(BARU)*

```mermaid
flowchart TD
    A["User akses /"] --> B{"Cookie JWT ada & valid?"}
    B -->|Tidak| C["Redirect → /login"]
    C --> D["Input username + password"]
    D --> E["POST /api/auth/login"]
    E --> F{"bcrypt compare OK?"}
    F -->|Tidak| G["Return 401, tampilkan error"]
    G --> D
    F -->|Ya| H["Sign JWT (role, userId, exp 8h)"]
    H --> I["Set-Cookie: session=JWT; HttpOnly; SameSite=Lax"]
    I --> J["Redirect → /"]
    B -->|Ya| K["Decode JWT → inject user ke context"]
    K --> L["Render halaman sesuai role"]
```

### 7.2 Flow Assign Part ke Mesin *(BARU)*

```mermaid
flowchart TD
    A["Admin buka detail mesin"] --> B["Klik 'Assign Part'"]
    B --> C["Modal terbuka: search part"]
    C --> D["Pilih Part ID dari Data Barang"]
    D --> E["Pilih tipe: Electrical / Mechanical"]
    E --> F["Input recommendedMinQty"]
    F --> G["POST /api/machines/[id]/parts"]
    G --> H{"Part sudah di-assign<br/>ke mesin ini?"}
    H -->|Ya| I["409 Conflict: Part sudah terdaftar"]
    H -->|Tidak| J["Buat record MachinePart"]
    J --> K["✅ Sukses, tabel ter-refresh"]
```

### 7.3 Flow Barang Keluar — Diperbarui

```mermaid
flowchart TD
    A["User pilih Part ID"] --> B{"Part ditemukan?"}
    B -->|Ya| C["Tampilkan info part (stok, harga, lokasi)"]
    C --> D["Input jumlah + pilih tujuan"]
    D --> E["(Opsional) Pilih mesin terkait"]
    E --> F{"Stok mencukupi?"}
    F -->|Tidak| G["⛔ Error: Stok tidak cukup"]
    F -->|Ya| H["Kurangi stok part"]
    H --> I["Buat OutboundTransaction (+ machineId jika ada)"]
    I --> J["✅ Sukses"]
    B -->|Tidak| K["Tidak ada hasil"]
```

### 7.4 Flow Barang Masuk (tidak berubah signifikan)

```mermaid
flowchart TD
    A["Admin input Part ID"] --> B{"ID sudah ada?"}
    B -->|Ya| C["Auto-fill, field master disabled"]
    B -->|Tidak| D["Form registrasi part baru"]
    D --> E["Isi: nama, kategori, lokasi, deskripsi, min stock"]
    C --> F["Input jumlah, harga beli, vendor"]
    E --> F
    F --> G["Hitung Weighted Average Price"]
    G --> H["Update stok & harga part"]
    H --> I["Buat InboundTransaction (createdBy = userId)"]
    I --> J["✅ Sukses"]
```

### 7.5 Flow Import CSV

```mermaid
flowchart TD
    A["Admin upload file CSV"] --> B["Parse CSV"]
    B --> C{"Ada data?"}
    C -->|Tidak| D["⛔ Error: CSV kosong"]
    C -->|Ya| E["Loop setiap baris"]
    E --> F{"Part ID + Nama ada?"}
    F -->|Tidak| G["Catat error baris"]
    F -->|Ya| H["Cari/buat kategori"]
    H --> I{"Part sudah ada?"}
    I -->|Ya| J["Update data part"]
    I -->|Tidak| K["Create part baru"]
    J --> L["updated++"]
    K --> M["created++"]
    L --> E
    M --> E
    G --> E
    E -->|Selesai| N["✅ Laporan: X dibuat, Y diperbarui, Z gagal"]
```

---

## 8. Responsivitas

| Breakpoint | Layout |
|------------|--------|
| **Desktop** (lg: ≥1024px) | Sidebar + konten full, grid 5 kolom KPI (termasuk mesin), chart 2:1 split, mesin grid 4 kolom |
| **Tablet** (md: ≥768px) | Sidebar collapsed, grid 2-3 kolom KPI, mesin grid 2 kolom, chart stack |
| **Mobile** (sm: <768px) | Sidebar hidden/overlay, grid 1 kolom, mesin grid 1 kolom, table scroll horizontal |

---

## 9. Keamanan

| Aspek | Implementasi |
|-------|-------------|
| **Password** | Hashed dengan bcrypt, cost factor 12 |
| **Session Token** | JWT HS256, expire 8 jam, disimpan HTTP-only cookie |
| **Route Guard** | Next.js middleware `src/middleware.ts` memvalidasi JWT sebelum render |
| **Role Check** | API endpoints mengecek role dari JWT payload sebelum eksekusi |
| **CSRF** | SameSite=Lax pada cookie mencegah CSRF dasar |
| **Error Messages** | Pesan error login tidak membedakan "username salah" vs "password salah" (security best practice) |

---

## 10. Panduan Pengembangan

### 10.1 Setup Lokal

```bash
# 1. Clone & Install
git clone <repo>
cd nginvanv
npm install

# 2. Setup Database
# Pastikan PostgreSQL running di localhost:5432

# 3. Konfigurasi .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/anvita_db"
JWT_SECRET="your-random-secret-min-32-chars"

# 4. Migrate & Generate
npm run db:migrate
npm run db:generate

# 5. Seed admin pertama (wajib sebelum bisa login)
npm run db:seed

# 6. Jalankan
npm run dev
# → http://0.0.0.0:3000
# Default admin: admin / admin123 (ganti setelah login pertama)
```

### 10.2 Konvensi Kode

| Area | Konvensi |
|------|----------|
| **Naming** | PascalCase komponen, camelCase fungsi/variabel |
| **API Client** | Semua panggilan API melalui `src/lib/api.ts` (otomatis attach cookie) |
| **Auth** | Gunakan `getCurrentUser()` dari `src/lib/auth.ts` di server components & route handlers |
| **Role Check** | `requireAdmin(user)` helper function untuk admin-only endpoints |
| **Prisma** | Singleton di `src/lib/prisma.ts` |
| **Error Handling** | Semua route handler di-wrap `try/catch`, return `NextResponse.json` |
| **Status Code** | 200=OK, 201=Created, 400=Bad Request, 401=Unauthorized, 403=Forbidden, 404=NotFound, 409=Conflict, 500=Error |

### 10.3 Script NPM

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Jalankan development server (0.0.0.0:3000) |
| `npm run build` | Build production |
| `npm run start` | Jalankan production build |
| `npm run db:migrate` | Jalankan database migration |
| `npm run db:studio` | Buka Prisma Studio |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed data awal (admin user + dummy data) |
