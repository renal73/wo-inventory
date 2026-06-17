# Rencana Implementasi Pembaruan README.md

Rencana ini dibuat untuk memperbarui `README.md` dengan instruksi lengkap agar aplikasi inventaris (Anvita System) dapat dijalankan di perangkat lain, cara konfigurasi koneksi database PostgreSQL, serta cara menjalankan migrasi dan seeding data uji (test data).

## Deskripsi Rencana
Memperbarui file `README.md` menggunakan Bahasa Indonesia yang profesional dan jelas. Panduan akan mencakup langkah-langkah dari awal (instalasi Node.js & PostgreSQL) hingga aplikasi siap digunakan.

## Proposed Changes

### Dokumentasi

#### [MODIFY] [README.md](file:///c:/Users/ahmad/Desktop/New%20folder/testinven/README.md)
Mengubah konten `README.md` untuk menyertakan bagian-bagian berikut:
1. **Prasyarat Sistem (Prerequisites)**: Node.js (v18/v20+), PostgreSQL Server, dan Package Manager (npm).
2. **Langkah Instalasi Perangkat Baru**:
   - Menyalin folder proyek ke perangkat tujuan.
   - Menjalankan `npm install` untuk mengunduh modul dependensi.
3. **Konfigurasi Koneksi Database**:
   - Pembuatan database baru di PostgreSQL.
   - Konfigurasi variabel lingkungan `.env` dengan format URL database PostgreSQL.
4. **Migrasi Database & Seeding Data Uji (Test Data)**:
   - Menjalankan migrasi skema database menggunakan Prisma (`npx prisma migrate dev`).
   - Melakukan seeding data uji awal dari file `db.json` ke dalam PostgreSQL (`npx tsx prisma/seed.ts`).
5. **Menjalankan Aplikasi**:
   - Menjalankan server pengembangan dengan `npm run dev`.
   - Informasi kredensial default untuk login (`admin` / `admin123` dan `user` / `user123`).
6. **Langkah Produksi (Build & Start)**: `npm run build` dan `npm run start`.

## Verification Plan

### Manual Verification
- Melakukan peninjauan struktur dan kejelasan bahasa dalam file `README.md` yang baru agar mudah dipahami oleh pengguna lain saat melakukan deployment atau setup awal di mesin baru.
