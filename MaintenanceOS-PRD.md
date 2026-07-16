# Product Requirements Document
## MaintenanceOS — Sistem Manajemen Perbaikan & Preventif Maintenance

**Version:** 1.0.0  
**Author:** Engineering & Product Team  
**Status:** Draft  
**Last Updated:** Juni 2026  
**Inspired by:** Sequel.co Design Philosophy

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Goals & Success Metrics](#goals--success-metrics)
4. [User Personas](#user-personas)
5. [Feature Requirements](#feature-requirements)
6. [Technical Architecture](#technical-architecture)
7. [Data Model](#data-model)
8. [API Specification](#api-specification)
9. [UI/UX Design System](#uiux-design-system)
10. [Non-Functional Requirements](#non-functional-requirements)
11. [Milestones & Timeline](#milestones--timeline)
12. [Risks & Mitigations](#risks--mitigations)

---

## 1. Executive Summary

**MaintenanceOS** adalah platform web manajemen pemeliharaan industri yang dirancang khusus untuk departemen Maintenance. Sistem ini menyatukan alur kerja permintaan perbaikan (*corrective maintenance*), jadwal pemeliharaan preventif (*preventive maintenance*), dan monitoring analitik berbasis klasifikasi kerusakan dalam satu antarmuka yang elegan dan intuitif.

Platform dibangun di atas **Next.js 14** dengan **PostgreSQL** sebagai database utama, mengedepankan real-time visibility untuk Admin, kemudahan pelaporan oleh User, dan efisiensi eksekusi oleh Teknisi.

---

## 2. Problem Statement

### Kondisi Saat Ini (AS-IS)
- Permintaan perbaikan dilakukan secara manual via WhatsApp, telepon, atau kertas form
- Tidak ada visibilitas terhadap status pekerjaan yang sedang berjalan
- Data kerusakan tidak terekam secara sistematis → tidak ada basis analitik
- Teknisi tidak memiliki *single source of truth* untuk prioritas pekerjaan
- Admin kesulitan melacak beban kerja tim dan SLA penyelesaian

### Kondisi yang Diinginkan (TO-BE)
- Semua permintaan perbaikan tercatat digital dengan nomor tiket unik
- Admin melihat dashboard real-time: pekerjaan pending, ongoing, selesai
- Teknisi menerima notifikasi assignment dan update status langsung
- Data historis terkumpul untuk analisis tren kerusakan per klasifikasi
- Laporan preventive maintenance terjadwal dan terdokumentasi otomatis

---

## 3. Goals & Success Metrics

### Primary Goals
| Goal | KPI | Target |
|------|-----|--------|
| Digitalisasi permintaan perbaikan | % tiket dari sistem vs manual | ≥ 90% dalam 3 bulan |
| Visibilitas real-time | MTTR (Mean Time to Resolution) | Turun 25% dalam 6 bulan |
| Analitik kerusakan | Laporan bulanan otomatis tersedia | 100% mulai bulan ke-2 |
| Adopsi pengguna | DAU (Daily Active Users) | ≥ 80% dari target pengguna aktif |

### Secondary Goals
- Mengurangi pekerjaan administratif manual Admin sebesar 60%
- Meningkatkan kepuasan User terhadap transparansi proses perbaikan

---

## 4. User Personas

### 4.1 USER — Pemohon Perbaikan
**Profil:** Operator, staf produksi, atau karyawan departemen lain  
**Goals:**
- Melaporkan kerusakan dengan cepat tanpa pelatihan teknis
- Mengetahui status permintaan yang sudah dikirim
- Mendapat konfirmasi bahwa permintaannya telah diterima

**Pain Points:**
- Tidak tahu apakah laporan sudah diterima atau belum
- Harus menghubungi Admin berulang kali untuk update status
- Form kertas sering hilang atau lambat diproses

**Key Features:**
- Form permintaan perbaikan yang simpel (max 5 field)
- Notifikasi status tiket via dashboard
- Riwayat permintaan yang pernah dibuat

---

### 4.2 TEKNISI — Pelaksana Perbaikan
**Profil:** Teknisi Maintenance Elektrik / Mekanik  
**Goals:**
- Mengetahui pekerjaan apa yang harus dikerjakan hari ini
- Update progress pekerjaan langsung dari lapangan
- Mencatat catatan teknis dan dokumentasi perbaikan

**Pain Points:**
- Sering menerima instruksi kerja via pesan yang tidak terstruktur
- Tidak ada tempat formal untuk mencatat apa yang sudah dikerjakan
- Kadang ada duplikasi pekerjaan dengan teknisi lain

**Key Features:**
- Workload board personal
- Status update: Mulai Kerja → Sedang Dikerjakan → Selesai
- Input catatan teknis dan foto hasil perbaikan

---

### 4.3 ADMIN — Koordinator & Controller
**Profil:** Supervisor atau Kepala Regu Maintenance  
**Goals:**
- Mengontrol semua tiket masuk dan mendistribusikan ke teknisi yang tepat
- Memonitor progress pekerjaan secara real-time
- Menganalisis tren kerusakan untuk perencanaan preventif

**Pain Points:**
- Tidak ada sistem terpusat untuk melihat semua pekerjaan yang aktif
- Sulit mengukur performa tim secara objektif
- Laporan bulanan membutuhkan waktu lama untuk dikompilasi manual

**Key Features:**
- Admin control center dengan Kanban Board
- Assignment teknisi per tiket
- Analytics dashboard dengan grafik klasifikasi trouble
- Export laporan ke PDF/Excel
- Manajemen jadwal preventive maintenance

---

## 5. Feature Requirements

### 5.1 Modul Permintaan Perbaikan (Work Order / WO)

#### F-WO-01: Submit Work Order (User)
- User dapat mengisi form dengan field:
  - **Lokasi/Area:** dropdown atau teks bebas
  - **Deskripsi Kerusakan:** textarea wajib diisi
  - **Klasifikasi:** Electric / Mechanic / Lain-lain
  - **Prioritas:** Low / Medium / High / Critical
  - **Upload Foto:** opsional, maks 3 foto, maks 5MB/foto
- Sistem generate nomor WO otomatis: `WO-YYYYMM-XXXX`
- User mendapat konfirmasi visual + nomor tiket setelah submit

#### F-WO-02: Work Order Status Flow
```
SUBMITTED → ASSIGNED → IN_PROGRESS → PENDING_CHECK → COMPLETED → CLOSED
                                    ↕
                              ON_HOLD (bila perlu suku cadang)
```

#### F-WO-03: Assignment oleh Admin
- Admin melihat semua WO berstatus SUBMITTED
- Admin dapat assign ke satu atau lebih teknisi
- Admin dapat mengubah prioritas dan klasifikasi
- Admin dapat menambahkan catatan instruksi teknis

#### F-WO-04: Update Progress oleh Teknisi
- Teknisi dapat mengubah status WO yang di-assign kepadanya
- Teknisi dapat menambahkan catatan kerja, foto, dan waktu mulai/selesai
- Teknisi dapat menandai kebutuhan suku cadang (trigger status ON_HOLD)

#### F-WO-05: Verifikasi & Penutupan
- Admin atau User Pemohon dapat memverifikasi pekerjaan selesai
- WO ditutup dengan timestamp dan ringkasan pekerjaan
- Rating kepuasan opsional dari User (1–5 bintang)

---

### 5.2 Modul Preventive Maintenance (PM)

#### F-PM-01: Template PM
- Admin dapat membuat template jadwal PM dengan field:
  - Nama peralatan / aset
  - Deskripsi pekerjaan standar
  - Klasifikasi (Electric/Mechanic/Lain-lain)
  - Frekuensi: Harian / Mingguan / Bulanan / Triwulan / Tahunan
  - Estimasi durasi
  - PIC Teknisi default

#### F-PM-02: Jadwal PM Otomatis
- Sistem men-generate tiket PM secara otomatis berdasarkan frekuensi
- Tiket PM muncul di Workload Board teknisi H-3 sebelum jadwal
- Reminder notifikasi pada hari-H

#### F-PM-03: Checklist PM
- Setiap tiket PM memiliki checklist item yang dapat dicentang
- Teknisi mengisi checklist + catatan kondisi aset
- Admin dapat review dan close tiket PM

---

### 5.3 Modul Admin Control Center

#### F-AC-01: Kanban Board
- View: Submitted | Assigned | In Progress | On Hold | Completed
- Drag-and-drop card antar kolom (opsional v2)
- Filter: Klasifikasi, Prioritas, Teknisi, Tanggal, Area
- Search global by nomor WO, deskripsi, atau nama pemohon

#### F-AC-02: Dashboard Analytics
- **Grafik 1:** Bar chart — Volume WO per bulan (12 bulan terakhir)
- **Grafik 2:** Donut/Pie chart — Distribusi klasifikasi trouble (Electric / Mechanic / Lain-lain)
- **Grafik 3:** Line chart — Tren MTTR (Mean Time to Resolution) bulanan
- **Grafik 4:** Bar chart horizontal — Top 10 area dengan trouble terbanyak
- **Grafik 5:** Stacked bar — Volume WO vs PM completion rate per bulan
- KPI Cards: Total WO Aktif | Overdue | MTTR rata-rata | Completion Rate

#### F-AC-03: Workload Teknisi
- View beban kerja per teknisi (jumlah WO aktif)
- Availability status teknisi

#### F-AC-04: Export & Reporting
- Export data WO ke Excel (.xlsx)
- Generate laporan PDF bulanan otomatis
- Filter rentang tanggal, klasifikasi, teknisi, area

---

### 5.4 Modul Manajemen User & Role

#### F-UR-01: Tiga Role Sistem
| Role | Hak Akses |
|------|-----------|
| `USER` | Submit WO, lihat status WO milik sendiri |
| `TECHNICIAN` | Lihat WO yang di-assign, update status, input catatan |
| `ADMIN` | Full access: assign, analytics, PM, user management |

#### F-UR-02: Autentikasi
- Login dengan email + password
- JWT-based session dengan refresh token
- Remember me (30 hari) dan session timeout (8 jam tanpa aktivitas)
- Reset password via email

---

## 6. Technical Architecture

### Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State Management | Zustand + React Query (TanStack Query) |
| Backend | Next.js API Routes (Route Handlers) |
| Database | PostgreSQL 15 |
| ORM | Prisma 5 |
| Auth | NextAuth.js v5 (Auth.js) |
| File Storage | Supabase Storage atau AWS S3 |
| Real-time | Server-Sent Events (SSE) atau Supabase Realtime |
| Charts | Recharts |
| Email | Resend + React Email |
| Deployment | Vercel (Frontend) + Railway/Supabase (Database) |

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────┐
│                   Next.js 14 App                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  App Router  │  │ API Routes   │  │ Middleware  │ │
│  │  (Pages/UI) │  │  (/api/...)  │  │  (Auth)    │ │
│  └──────┬──────┘  └──────┬───────┘  └────────────┘ │
│         │                │                           │
│  ┌──────▼──────────────────────────────────────┐    │
│  │              Prisma ORM                      │    │
│  └──────────────────────┬───────────────────────┘   │
└─────────────────────────│───────────────────────────┘
                          │
              ┌───────────▼────────────┐
              │    PostgreSQL 15        │
              │  (Managed via Railway)  │
              └────────────────────────┘
```

---

## 7. Data Model

### Tabel Utama

#### users
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
name          VARCHAR(100) NOT NULL
email         VARCHAR(255) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
role          ENUM('USER', 'TECHNICIAN', 'ADMIN') NOT NULL
department    VARCHAR(100)
avatar_url    TEXT
is_active     BOOLEAN DEFAULT true
created_at    TIMESTAMPTZ DEFAULT now()
updated_at    TIMESTAMPTZ DEFAULT now()
```

#### work_orders
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
wo_number       VARCHAR(20) UNIQUE NOT NULL  -- WO-202406-0001
title           VARCHAR(200) NOT NULL
description     TEXT NOT NULL
location        VARCHAR(200) NOT NULL
classification  ENUM('ELECTRIC', 'MECHANIC', 'OTHER') NOT NULL
priority        ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM'
status          ENUM('SUBMITTED','ASSIGNED','IN_PROGRESS','ON_HOLD','PENDING_CHECK','COMPLETED','CLOSED') DEFAULT 'SUBMITTED'
requested_by    UUID REFERENCES users(id)
assigned_to     UUID[] -- array of technician IDs
admin_notes     TEXT
estimated_duration INTEGER -- in minutes
actual_duration    INTEGER -- in minutes
started_at      TIMESTAMPTZ
completed_at    TIMESTAMPTZ
closed_at       TIMESTAMPTZ
rating          SMALLINT CHECK (rating BETWEEN 1 AND 5)
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### wo_updates (Activity Log)
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
wo_id       UUID REFERENCES work_orders(id) ON DELETE CASCADE
user_id     UUID REFERENCES users(id)
action      VARCHAR(100) NOT NULL  -- 'STATUS_CHANGED', 'NOTE_ADDED', etc.
old_status  VARCHAR(50)
new_status  VARCHAR(50)
note        TEXT
attachments TEXT[] -- URLs
created_at  TIMESTAMPTZ DEFAULT now()
```

#### pm_templates
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
name              VARCHAR(200) NOT NULL
equipment_name    VARCHAR(200) NOT NULL
description       TEXT
classification    ENUM('ELECTRIC', 'MECHANIC', 'OTHER') NOT NULL
frequency         ENUM('DAILY','WEEKLY','MONTHLY','QUARTERLY','YEARLY') NOT NULL
estimated_duration INTEGER -- minutes
default_technician UUID REFERENCES users(id)
checklist_items   JSONB  -- [{id, label, required}]
is_active         BOOLEAN DEFAULT true
created_by        UUID REFERENCES users(id)
created_at        TIMESTAMPTZ DEFAULT now()
```

#### pm_schedules
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
template_id     UUID REFERENCES pm_templates(id)
scheduled_date  DATE NOT NULL
assigned_to     UUID REFERENCES users(id)
status          ENUM('PENDING','IN_PROGRESS','COMPLETED','SKIPPED') DEFAULT 'PENDING'
checklist_data  JSONB  -- [{id, label, checked, note}]
technician_notes TEXT
attachments     TEXT[]
completed_at    TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
```

---

## 8. API Specification

### Base URL: `/api/v1`

#### Work Orders
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/work-orders` | All | List WO dengan pagination & filter |
| POST | `/work-orders` | USER+ | Buat WO baru |
| GET | `/work-orders/:id` | All | Detail WO |
| PATCH | `/work-orders/:id` | All | Update WO (role-based fields) |
| DELETE | `/work-orders/:id` | ADMIN | Hapus WO (soft delete) |
| POST | `/work-orders/:id/assign` | ADMIN | Assign teknisi |
| POST | `/work-orders/:id/status` | TECH+ | Update status |
| GET | `/work-orders/:id/timeline` | All | Activity timeline |

#### Analytics
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/analytics/overview` | ADMIN | KPI cards data |
| GET | `/analytics/classification` | ADMIN | Distribusi trouble per klasifikasi |
| GET | `/analytics/monthly` | ADMIN | Volume WO per bulan |
| GET | `/analytics/mttr` | ADMIN | Tren MTTR |
| GET | `/analytics/top-areas` | ADMIN | Area dengan trouble terbanyak |
| GET | `/analytics/technician-load` | ADMIN | Beban kerja teknisi |

#### Preventive Maintenance
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/pm/templates` | ADMIN | List template PM |
| POST | `/pm/templates` | ADMIN | Buat template baru |
| GET | `/pm/schedules` | TECH+ | List jadwal PM |
| PATCH | `/pm/schedules/:id` | TECH+ | Update progress PM |

---

## 9. UI/UX Design System

### Design Philosophy
Terinspirasi dari **Sequel.co** dan antarmuka SaaS modern — mengutamakan kejelasan data, hierarki informasi yang kuat, dan estetika yang terasa *premium* namun tetap fungsional.

### Color Palette
```css
/* Dark Mode (Default) */
--background:     #0A0D14   /* Deep space black */
--surface:        #111520   /* Card background */
--surface-raised: #181D2E   /* Elevated elements */
--border:         #1E2535   /* Subtle dividers */
--accent-primary: #3B82F6   /* Electric blue */
--accent-cyan:    #06B6D4   /* Cyan highlight */
--accent-success: #10B981   /* Green completion */
--accent-warning: #F59E0B   /* Amber warning */
--accent-danger:  #EF4444   /* Red critical */
--text-primary:   #F1F5F9   /* Near white */
--text-secondary: #94A3B8   /* Slate 400 */
--text-muted:     #475569   /* Slate 600 */

/* Classification Colors */
--electric:       #3B82F6   /* Blue — Electric */
--mechanic:       #F97316   /* Orange — Mechanic */
--other:          #8B5CF6   /* Purple — Lain-lain */

/* Priority Colors */
--critical:       #EF4444
--high:           #F97316
--medium:         #F59E0B
--low:            #10B981
```

### Typography
```
Display Font:    "Geist" — modern, geometric, tegas
Body Font:       "Inter Variable" — readable di semua ukuran
Monospace:       "JetBrains Mono" — nomor WO, kode teknis
```

### Component Library
- Base: **shadcn/ui** (Radix UI primitives)
- Charts: **Recharts** dengan custom theme
- Tables: **TanStack Table** dengan virtual scrolling
- Forms: **React Hook Form** + **Zod** validation
- Animations: **Framer Motion** untuk page transitions

### Page Layout
```
┌────────────────────────────────────────────────────┐
│  Sidebar (64px collapsed / 240px expanded)         │
│  ┌──────────────────────────────────────────────┐  │
│  │  Top Bar: Search | Notifications | Avatar   │  │
│  ├──────────────────────────────────────────────┤  │
│  │                                              │  │
│  │         Main Content Area                   │  │
│  │         (fluid, max-w 1440px)               │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### Key Screen Flows

#### User Flow: Submit WO
```
Dashboard → Klik "Buat Permintaan" → Form (slide-in panel)
→ Isi field → Submit → Success toast + nomor WO → 
Redirect ke halaman "Permintaan Saya"
```

#### Admin Flow: Process WO
```
Dashboard → WO baru muncul di Kanban → Klik WO →
Detail panel → Assign teknisi → Ubah prioritas →
WO bergerak ke kolom "Assigned" → Notifikasi ke teknisi
```

#### Teknisi Flow: Update WO
```
Dashboard → "Workload Saya" → Klik WO yang di-assign →
Mulai Kerja (status → In Progress + catat waktu) →
Isi catatan teknis → Upload foto → Selesai →
Status → Pending Check → Notifikasi ke Admin
```

---

## 10. Non-Functional Requirements

### Performance
- First Contentful Paint (FCP) < 1.5 detik
- Time to Interactive (TTI) < 3 detik
- Dashboard analytics render < 2 detik (data di-cache 5 menit)
- API response time < 500ms untuk operasi standar
- Mendukung 100 concurrent users tanpa degradasi performa

### Security
- Semua endpoint dilindungi autentikasi JWT
- Role-based access control (RBAC) diimplementasi di middleware
- Password di-hash dengan bcrypt (salt rounds: 12)
- Input sanitization dan SQL injection prevention via Prisma
- HTTPS enforced, CORS dikonfigurasi strict
- File upload: validasi tipe, ukuran, dan scan nama file

### Reliability
- Uptime target: 99.5%
- Database backup otomatis harian
- Error boundary di semua critical component
- Graceful error handling dengan pesan yang informatif

### Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation penuh
- Screen reader support (ARIA labels)
- Color contrast ratio ≥ 4.5:1

### Localization
- Bahasa utama: Bahasa Indonesia
- Format tanggal: DD/MM/YYYY (lokal Indonesia)
- Format waktu: 24-hour (07:00, 14:30)
- Timezone: Asia/Jakarta (WIB, UTC+7)

---

## 11. Milestones & Timeline

### Phase 1 — Foundation (Minggu 1–3)
- [ ] Setup proyek Next.js 14 + TypeScript + Tailwind
- [ ] Konfigurasi PostgreSQL + Prisma schema
- [ ] Implementasi autentikasi (NextAuth.js)
- [ ] Layout dasar: Sidebar, Top Bar, routing
- [ ] Design system: color tokens, typography, base components

### Phase 2 — Core Features (Minggu 4–7)
- [ ] Modul Work Order: Submit, List, Detail, Status Update
- [ ] Admin Kanban Board dengan filter
- [ ] Assignment teknisi
- [ ] Workload board teknisi
- [ ] Notifikasi in-app dasar

### Phase 3 — Analytics & PM (Minggu 8–10)
- [ ] Dashboard analytics dengan 5 grafik
- [ ] Modul Preventive Maintenance (template + jadwal)
- [ ] Export Excel & PDF
- [ ] Email notification (Resend)

### Phase 4 — Polish & Launch (Minggu 11–12)
- [ ] Optimasi performa (caching, lazy loading)
- [ ] Testing (unit test + integration test)
- [ ] UAT dengan user representatif
- [ ] Deployment ke production
- [ ] Dokumentasi user guide

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Adopsi user rendah | Medium | High | Onboarding sederhana, mobile-friendly, training singkat |
| Data historis tidak tersedia di awal | High | Medium | Fitur import data awal dari Excel |
| Koneksi internet tidak stabil di pabrik | Medium | High | Progressive Web App (PWA) dengan offline draft |
| Resistensi perubahan dari teknisi | Medium | Medium | UI semudah WhatsApp, minimal click |
| Skalabilitas database saat data besar | Low | Medium | Index yang optimal, query optimization, partitioning |

---

## Appendix A — Glossary

| Term | Definisi |
|------|----------|
| WO | Work Order — tiket permintaan perbaikan |
| PM | Preventive Maintenance — pemeliharaan terjadwal |
| MTTR | Mean Time to Resolution — rata-rata waktu penyelesaian |
| Klasifikasi | Kategori kerusakan: Electric, Mechanic, Lain-lain |
| Admin | Supervisor/Kepala Regu yang mengontrol sistem |
| Teknisi | Pelaksana pekerjaan perbaikan di lapangan |
| SLA | Service Level Agreement — target waktu penyelesaian |

---

## Appendix B — Nomor WO Format

```
WO - YYYYMM - XXXX
│     │  │    └── Nomor urut 4 digit, reset per bulan
│     │  └─────── Bulan (2 digit)
│     └────────── Tahun (4 digit)
└──────────────── Prefix tetap
Contoh: WO-202406-0142
```

---

*Dokumen ini merupakan acuan hidup (living document) yang akan diperbarui seiring perkembangan proyek.*

---

**MaintenanceOS v1.0 — Departemen Maintenance**  
*"Dari laporan ke solusi, tanpa hambatan."*
