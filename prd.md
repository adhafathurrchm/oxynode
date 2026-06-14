# OxyNode — Product Requirements Document

**Versi:** 1.0  
**Tanggal:** Juni 2026  
**Deskripsi:** Sistem monitoring SpO2 dan detak jantung berbasis ESP32 + MAX30102 dengan analisis AI dan manajemen pasien.

---

## 1. Overview Produk

OxyNode adalah web application sederhana untuk monitoring kesehatan real-time menggunakan alat ESP32 dengan sensor MAX30102. Satu alat digunakan bersama (bergantian), dioperasikan oleh admin yang memilih pasien sebelum pengukuran dimulai. Hasil monitoring dapat dianalisis menggunakan Google Gemini AI dan dikirim via WhatsApp menggunakan Fonnte WhatsApp Gateway API.

**Database:** Supabase (PostgreSQL)  
**Tech Stack:** HTML, Tailwind CSS, Vanilla JavaScript  
**Prinsip Desain:** Minimalis, clean, mudah di-maintain, kode sesedikit mungkin

---

## 2. Design & Frontend

### 2.1 Design System

**Palet Warna**

| Token | Nilai | Kegunaan |
|---|---|---|
| `primary` | `#0EA5E9` (sky-500) | Aksi utama, tombol, link aktif |
| `primary-dark` | `#0284C7` (sky-600) | Hover state |
| `surface` | `#FFFFFF` | Background kartu / panel |
| `background` | `#F8FAFC` (slate-50) | Background halaman |
| `border` | `#E2E8F0` (slate-200) | Garis pembatas |
| `text-primary` | `#0F172A` (slate-900) | Teks utama |
| `text-muted` | `#64748B` (slate-500) | Label, keterangan |
| `success` | `#10B981` (emerald-500) | Status normal / baik |
| `warning` | `#F59E0B` (amber-500) | Status perlu perhatian |
| `danger` | `#EF4444` (red-500) | Status buruk / kritis |

**Tipografi**

- Font: `Inter` (via Google Fonts)
- Heading besar: `text-2xl font-semibold`
- Heading section: `text-lg font-medium`
- Body: `text-sm text-slate-700`
- Label/caption: `text-xs text-slate-500`

**Border Radius & Shadow**

- Kartu: `rounded-xl shadow-sm border border-slate-200`
- Tombol: `rounded-lg`
- Input: `rounded-lg border border-slate-300`
- Badge: `rounded-full`

**Spacing**

- Layout utama: `p-6` untuk konten, `gap-4` antar elemen
- Sidebar: lebar `240px` (fixed), konten `flex-1`

---

### 2.2 Layout Umum

```
┌─────────────────────────────────────────────┐
│  Sidebar (240px)  │  Main Content Area      │
│  ─────────────── │  ─────────────────────  │
│  Logo OxyNode     │  Top Bar (nama user)    │
│                   │  ─────────────────────  │
│  Nav Menu         │                         │
│  · Dashboard      │  <Page Content>         │
│  · Data           │                         │
│  · Profil Pasien  │                         │
│  [admin only]     │                         │
│  · Kelola Data    │                         │
│  · Kelola User    │                         │
│                   │                         │
│  [logout]         │                         │
└─────────────────────────────────────────────┘
```

- Sidebar menggunakan warna `white` dengan border kanan `border-r border-slate-200`
- Nav item aktif: `bg-sky-50 text-sky-600 font-medium rounded-lg`
- Nav item normal: `text-slate-600 hover:bg-slate-100 rounded-lg`
- Top bar menampilkan nama dan role user (admin / pasien), tombol logout

---

### 2.3 Komponen UI Reusable

**Kartu Metrik (Stat Card)**
```
┌──────────────────────┐
│  Ikon   Label        │
│         Nilai Besar  │
│         Keterangan   │
└──────────────────────┘
```
- Background `white`, border `border-slate-200`, shadow `shadow-sm`
- Nilai: `text-3xl font-bold`
- Status badge di pojok kanan atas: `Normal` / `Rendah` / `Kritis`

**Tombol**
- Primary: `bg-sky-500 hover:bg-sky-600 text-white rounded-lg px-4 py-2 text-sm font-medium`
- Secondary: `border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm`
- Danger: `bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2 text-sm`

**Badge Status**
- Normal: `bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 text-xs`
- Perlu Perhatian: `bg-amber-100 text-amber-700`
- Kritis: `bg-red-100 text-red-700`

**Input / Select**
- `border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none w-full`

**Tabel Data**
- Header: `bg-slate-50 text-xs font-medium text-slate-500 uppercase`
- Row hover: `hover:bg-slate-50`
- Border: `divide-y divide-slate-200`

**Modal**
- Overlay: `fixed inset-0 bg-black/40`
- Panel: `bg-white rounded-2xl shadow-xl p-6 max-w-md w-full`

---

## 3. Requirements

### 3.1 Functional Requirements

**Autentikasi**
- Login menggunakan email dan password via Supabase Auth
- Role: `admin` dan `patient`
- Session persisten (Supabase auto-handle)
- Redirect otomatis sesuai role setelah login

**Pengukuran**
- Admin memilih nama pasien di dashboard sebelum pengukuran dimulai
- Status "Siap Ukur" aktif untuk pasien yang dipilih
- ESP32 mengirim data ke Supabase REST API ketika jari ditempelkan ke sensor
- Data masuk otomatis tercatat atas nama pasien aktif
- Hanya satu pasien aktif dalam satu waktu

**Data Monitoring**
- Setiap record menyimpan: `patient_id`, `spo2` (%), `heart_rate` (bpm), `timestamp`
- Admin dapat melihat seluruh data semua pasien
- Pasien hanya dapat melihat data miliknya sendiri

**Analisis AI (Google Gemini)**
- Tombol "Generate Analisis AI" tersedia di dashboard
- AI menerima konteks: data terbaru SpO2 + detak jantung + profil pasien (nama, umur, kondisi)
- Output AI: penilaian status (baik/perlu perhatian/buruk), penjelasan, dan saran tindakan
- Hasil AI disimpan ke database bersama data pengukuran terkait

**Pengiriman WhatsApp (Fonnte)**
- Tersedia di halaman Data
- Mengirim ringkasan: data pengukuran + hasil analisis AI
- Menggunakan nomor WhatsApp dari profil pasien dan token sistem global
- Format pesan: teks sederhana yang mudah dibaca

**Manajemen Profil (Pasien)**
- Data profil: nama, umur, nomor WhatsApp, jenis kelamin, berat badan, tinggi badan, riwayat kondisi medis
- Pasien dapat mengedit profil sendiri
- Admin dapat melihat dan mengedit profil semua pasien

**Kelola Data (Admin)**
- Lihat seluruh riwayat pengukuran
- Filter berdasarkan nama pasien dan rentang tanggal
- Hapus data pengukuran

**Kelola User (Admin)**
- CRUD akun pasien (tambah, lihat, edit, hapus)
- Field: nama, email, password (saat buat), nomor WhatsApp, umur, jenis kelamin

### 3.2 Non-Functional Requirements

- Waktu load halaman < 2 detik
- Tidak menggunakan framework JavaScript (Vanilla JS only)
- Tidak menggunakan build tool / bundler
- Setiap halaman = 1 file HTML dengan Tailwind via CDN
- Supabase diakses langsung dari browser menggunakan Supabase JS CDN
- Kode setiap file < 500 baris (preferably)
- Responsive minimal untuk desktop (lebar ≥ 1024px)

---

## 4. Core Features

### F-01 · Login Page

**Deskripsi:** Pintu masuk satu-satunya ke sistem.

**Elemen UI:**
- Logo OxyNode + tagline di atas form
- Form: field Email, field Password, tombol "Masuk"
- Link lupa password (opsional, bisa diabaikan v1)

**Logika:**
- Supabase `signInWithPassword(email, password)`
- Jika role = `admin` → redirect ke `/admin/dashboard.html`
- Jika role = `patient` → redirect ke `/patient/dashboard.html`

---

### F-02 · Dashboard (Admin)

**Deskripsi:** Pusat kontrol admin. Tempat memilih pasien dan memantau hasil pengukuran terbaru.

**Elemen UI:**

Bagian atas — Pilih Pasien & Siapkan Pengukuran:
```
┌──────────────────────────────────────────────┐
│  Pilih Pasien:  [Dropdown nama pasien  ▼]    │
│                 [Siapkan Pengukuran]          │
│  Status: ● Siap mengukur untuk: Budi Santoso │
└──────────────────────────────────────────────┘
```

Stat Cards (2 kartu):
- SpO2 terakhir (%) + badge status
- Detak Jantung terakhir (bpm) + badge status

Chart Section (2 chart berdampingan):
- Line chart SpO2 — 10 data terakhir
- Line chart Detak Jantung — 10 data terakhir
- Library: Chart.js via CDN

Tombol Analisis:
- `[✦ Generate Analisis AI]` (primary)
- Setelah generate: tampilkan hasil di panel card di bawah chart
- Panel hasil: status badge, paragraf penjelasan, poin saran

**Logika:**
- Saat "Siapkan Pengukuran" diklik → simpan `active_patient_id` di Supabase (tabel `settings` atau `active_session`)
- ESP32 mengambil `active_patient_id` sebelum submit data
- Polling chart setiap 5 detik (atau gunakan Supabase Realtime)

---

### F-03 · Dashboard (Pasien)

**Deskripsi:** Tampilan baca-saja untuk pasien, menampilkan data diri sendiri.

**Elemen UI:**
- Stat Cards: SpO2 terakhir, Detak Jantung terakhir
- Chart: SpO2 dan Detak Jantung (data milik sendiri)
- Panel Hasil AI terakhir (jika ada)
- **Tidak ada** dropdown pilih pasien dan tombol "Siapkan Pengukuran"

---

### F-04 · Halaman Data

**Deskripsi:** Tabel riwayat pengukuran dan fitur kirim WhatsApp.

**Elemen UI (Admin):**
- Filter: dropdown pasien + date range input + tombol "Filter"
- Tabel kolom: Tanggal & Waktu, Nama Pasien, SpO2, Detak Jantung, Status, Hasil AI, Aksi
- Kolom Aksi: tombol "Kirim WA" per baris
- Pagination sederhana (prev / next)

**Elemen UI (Pasien):**
- Tabel yang sama tapi hanya data milik sendiri, tanpa kolom Nama Pasien
- Tombol "Kirim WA" tetap tersedia

**Kirim WhatsApp:**
- Klik "Kirim WA" → konfirmasi modal → kirim via Fonnte API menggunakan token sistem global
- Format pesan:
  ```
  [OxyNode] Laporan Pemeriksaan
  Nama   : Budi Santoso
  Waktu  : 12 Jun 2026, 10:30
  SpO2   : 98%
  Nadi   : 75 bpm
  Status : Normal

  Analisis AI:
  Hasil pengukuran Anda berada dalam batas normal...
  Saran: ...
  ```

---

### F-05 · Profil Pasien

**Deskripsi:** Halaman edit data diri pasien, data ini juga dipakai sebagai konteks analisis AI.

**Field Form:**
- Nama Lengkap
- Umur
- Jenis Kelamin (dropdown: Laki-laki / Perempuan)
- Berat Badan (kg)
- Tinggi Badan (cm)
- Nomor WhatsApp (format: 628xxx)
- Riwayat Kondisi Medis (textarea, contoh: hipertensi, diabetes, asma)
- Catatan Tambahan (textarea, opsional)

**Aksi:**
- Tombol "Simpan Perubahan"
- Notifikasi sukses/gagal inline

**Konteks AI:** Saat generate analisis, sistem menggabungkan profil pasien dengan data pengukuran sebagai prompt ke Gemini.

---

### F-06 · Kelola Data (Admin Only)

**Deskripsi:** Manajemen data pengukuran secara keseluruhan.

**Elemen UI:**
- Filter & tabel sama seperti F-04
- Tambahan kolom Aksi: tombol "Hapus"
- Modal konfirmasi sebelum hapus
- Export CSV (opsional v2)

---

### F-07 · Kelola User (Admin Only)

**Deskripsi:** CRUD akun pasien.

**Tampilan List:**
- Tabel: Nama, Email, Umur, No. WA, Tanggal Daftar, Aksi (Edit / Hapus)
- Tombol "+ Tambah Pasien" di pojok kanan atas

**Form Tambah / Edit Pasien (Modal):**
- Nama Lengkap
- Email
- Password (hanya saat tambah baru)
- Umur
- Jenis Kelamin
- Nomor WhatsApp
- Berat & Tinggi Badan
- Riwayat Kondisi Medis

**Logika:**
- Tambah: Supabase `auth.admin.createUser()` + insert ke tabel `profiles`
- Edit: update tabel `profiles` (data non-auth)
- Hapus: soft delete atau Supabase `auth.admin.deleteUser()`

---

## 5. Database Schema (Supabase)

### Tabel `profiles`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid (FK → auth.users) | Primary key |
| `role` | text | `admin` / `patient` |
| `full_name` | text | |
| `age` | int | |
| `gender` | text | |
| `weight_kg` | numeric | |
| `height_cm` | numeric | |
| `whatsapp_number` | text | Format 628xxx |
| `medical_history` | text | |
| `notes` | text | |
| `created_at` | timestamptz | |

### Tabel `measurements`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid | Primary key |
| `patient_id` | uuid (FK → profiles) | Pasien yang diukur |
| `spo2` | numeric | Dalam persen |
| `heart_rate` | int | Dalam bpm |
| `ai_result` | text | Output dari Gemini (null jika belum generate) |
| `ai_status` | text | `normal` / `warning` / `critical` |
| `created_at` | timestamptz | Waktu pengukuran |

### Tabel `active_session`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | int | Selalu 1 (single row) |
| `active_patient_id` | uuid (FK → profiles) | Pasien yang sedang aktif |
| `set_at` | timestamptz | Waktu admin set pasien |

---

## 6. User Flow

### 6.1 Flow Admin — Sesi Pengukuran

```
Admin buka website
       │
       ▼
   Login page
 (email + password)
       │ Sukses
       ▼
 Dashboard Admin
       │
       ├─► Pilih nama pasien dari dropdown
       │
       ├─► Klik [Siapkan Pengukuran]
       │       │
       │       └─► Sistem simpan active_patient_id ke tabel active_session
       │           Status berubah: "● Siap mengukur untuk: [Nama Pasien]"
       │
       ├─► Pasien tempelkan jari ke sensor ESP32
       │       │
       │       └─► ESP32 ambil active_patient_id dari Supabase
       │           ESP32 kirim data SpO2 + HR → insert ke tabel measurements
       │
       ├─► Chart & stat card otomatis update (realtime/polling)
       │
       └─► Admin klik [✦ Generate Analisis AI]
               │
               └─► Sistem kirim prompt ke Gemini API
                   (data terbaru + profil pasien)
                   │
                   └─► Hasil AI tampil di dashboard
                       Hasil disimpan ke kolom ai_result + ai_status
```

---

### 6.2 Flow Admin — Kirim WhatsApp

```
Admin buka halaman Data
       │
       ├─► (Opsional) Filter berdasarkan pasien / tanggal
       │
       ├─► Temukan baris data yang ingin dikirim
       │
       ├─► Klik [Kirim WA]
       │       │
       │       └─► Modal konfirmasi muncul
       │           "Kirim laporan ke +628xxx?"
       │
       ├─► Klik [Ya, Kirim]
       │       │
       │       └─► Sistem ambil nomor WA dari profil pasien
       │           Buat string pesan
       │           Kirim POST request ke Fonnte API menggunakan token global
       │
       └─► Notifikasi: "Pesan berhasil dikirim" / "Gagal dikirim"
```

### 6.3 Flow Admin — Kelola User

```
Admin buka Kelola User
       │
       ├─► Lihat daftar pasien terdaftar
       │
       ├─► [Tambah Pasien]
       │       └─► Buka modal form → isi data → Submit
       │           Buat akun via Supabase Admin API
       │           Insert profil ke tabel profiles
       │
       ├─► [Edit] pada baris pasien
       │       └─► Buka modal form (pre-filled) → ubah → Submit
       │           Update tabel profiles
       │
       └─► [Hapus] pada baris pasien
               └─► Modal konfirmasi → hapus user dari auth + profiles
```

---

### 6.4 Flow Pasien — Lihat Data & Kirim WA

```
Pasien buka website
       │
       ▼
   Login page
       │ Sukses
       ▼
 Dashboard Pasien
       │
       ├─► Lihat SpO2 & HR terbaru (stat card)
       │
       ├─► Lihat chart riwayat (data milik sendiri)
       │
       ├─► Lihat hasil analisis AI terakhir (jika ada)
       │
       └─► Buka halaman Data
               │
               ├─► Lihat tabel riwayat pengukuran pribadi
               │
               └─► Klik [Kirim WA] → kirim ke nomor WA sendiri
```

---

### 6.5 Flow Pasien — Update Profil

```
Pasien buka Profil Pasien
       │
       ├─► Lihat data profil saat ini (pre-filled)
       │
       ├─► Edit field yang diperlukan
       │   (umur, BB, TB, kondisi medis, no. WA, dll)
       │
       └─► Klik [Simpan Perubahan]
               │
               └─► Update tabel profiles
                   Notifikasi "Profil berhasil disimpan"
```

---

## 7. Struktur File Project

```
oxynode/
│
├── index.html                  ← Login page
│
├── admin/
│   ├── dashboard.html          ← F-02 Dashboard Admin
│   ├── data.html               ← F-04 + F-06 Data & Kelola Data
│   ├── users.html              ← F-07 Kelola User
│   └── profile.html            ← F-05 Profil (view all pasien)
│
├── patient/
│   ├── dashboard.html          ← F-03 Dashboard Pasien
│   ├── data.html               ← F-04 Data Pasien
│   └── profile.html            ← F-05 Profil Pasien
│
└── assets/
    └── (opsional: gambar logo)
```

Setiap file HTML memuat:
- Tailwind CSS via CDN
- Chart.js via CDN (hanya dashboard)
- Supabase JS via CDN
- Script logika inline `<script>` di bagian bawah

---

## 8. Integrasi Eksternal

### ESP32 → Supabase

ESP32 mengirim HTTP POST ke Supabase REST API:
```
POST https://<project>.supabase.co/rest/v1/measurements
Headers:
  apikey: <anon-key>
  Content-Type: application/json
Body:
  { "spo2": 98, "heart_rate": 75 }
```
`patient_id` diambil dari `active_session` oleh Supabase Function / RLS policy / atau oleh ESP32 dengan GET request terlebih dahulu.

### Google Gemini API

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=API_KEY
Body: {
  contents: [{
    parts: [{
      text: "Pasien: [Nama], [Umur] tahun, [kondisi medis].
             Hasil pengukuran: SpO2 [X]%, Detak jantung [Y] bpm.
             Analisis apakah hasil ini normal atau tidak, jelaskan penyebab jika buruk,
             dan berikan saran tindakan. Jawab dalam Bahasa Indonesia."
    }]
  }]
}
```

### Fonnte WhatsApp API

```
POST https://api.fonnte.com/send
Headers:
  Authorization: [fonnte-token]
Body (form-data / x-www-form-urlencoded):
  target: 628xxx
  message: [Pesan Laporan]
```
Token Fonnte global dikonfigurasi di `assets/js/config.js` sehingga pasien tidak perlu menginput token masing-masing.

---

## 9. Catatan Implementasi

- **RLS Supabase:** Aktifkan Row Level Security. Pasien hanya bisa SELECT data dengan `patient_id = auth.uid()`. Admin bisa SELECT semua.
- **API Key Keamanan:** Gemini API key jangan diexpose di frontend untuk production. Untuk v1/prototype bisa diletakkan di config JS terpisah yang tidak di-commit.
- **Fonnte API Key:** Disimpan di `assets/js/config.js` dalam konstanta `FONNTE_CONFIG` oleh Admin. Pasien cukup memiliki nomor WhatsApp aktif.
- **Chart.js:** Gunakan tipe `line` dengan `tension: 0.3` untuk tampilan halus. Maksimum 20 titik data.
- **Polling:** Gunakan `setInterval` setiap 5000ms untuk refresh data dashboard, atau gunakan Supabase Realtime `channel.on('postgres_changes', ...)` untuk update instan.
- **Active Session:** Tabel `active_session` hanya memiliki 1 baris (id = 1), di-upsert setiap kali admin memilih pasien.