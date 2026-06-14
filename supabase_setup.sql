-- =====================================================================
-- OXYNODE DATABASE SETUP SCRIPT FOR SUPABASE (POSTGRESQL)
-- =====================================================================
-- Silakan salin (copy) seluruh isi berkas ini dan tempel (paste) ke 
-- menu SQL Editor di Dasbor Supabase Anda, lalu klik "Run".

-- ---------------------------------------------------------------------
-- 1. DROP EXISTING TABLES & FUNCTIONS (Jika ada, untuk reset bersih)
-- ---------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_admin();
drop table if exists public.active_session;
drop table if exists public.measurements;
drop table if exists public.profiles;

-- ---------------------------------------------------------------------
-- 2. CREATE TABLES
-- ---------------------------------------------------------------------

-- Tabel Profiles
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text not null default 'patient' check (role in ('admin', 'patient')),
  full_name text not null,
  age integer not null default 0,
  gender text not null default 'Laki-laki' check (gender in ('Laki-laki', 'Perempuan')),
  weight_kg numeric(5,2),
  height_cm integer,
  whatsapp_number text,
  medical_history text default '-',
  notes text default '-',
  callmebot_apikey text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabel Measurements
create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) on delete cascade not null,
  spo2 numeric(5,2) not null,
  heart_rate integer not null,
  ai_result text,
  ai_status text check (ai_status in ('normal', 'warning', 'critical')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabel Active Session
create table public.active_session (
  id integer primary key check (id = 1), -- Menjamin hanya ada 1 baris (singlerow)
  active_patient_id uuid references public.profiles(id) on delete set null,
  set_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Inisialisasi baris tunggal active_session
insert into public.active_session (id, active_patient_id) 
values (1, null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 3. SECURITY DEFINER HELPER FUNCTIONS (Mencegah RLS Infinite Recursion)
-- ---------------------------------------------------------------------

-- Fungsi pembantu untuk mendeteksi apakah user aktif adalah admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------------------------

-- Aktifkan RLS di semua tabel
alter table public.profiles enable row level security;
alter table public.measurements enable row level security;
alter table public.active_session enable row level security;

-- Kebijakan untuk tabel `profiles`
create policy "Enable select for users matching ID or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Enable insert for admins only"
  on public.profiles for insert
  with check (public.is_admin());

create policy "Enable update for users matching ID or admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "Enable delete for admins only"
  on public.profiles for delete
  using (public.is_admin());


-- Kebijakan untuk tabel `measurements`
create policy "Enable select for users matching patient_id or admin"
  on public.measurements for select
  using (patient_id = auth.uid() or public.is_admin());

create policy "Enable insert for own data or admin"
  on public.measurements for insert
  with check (patient_id = auth.uid() or public.is_admin());

create policy "Enable update for admins only"
  on public.measurements for update
  using (public.is_admin());

create policy "Enable delete for admins only"
  on public.measurements for delete
  using (public.is_admin());

-- KEBIJAKAN PENTING: Izin masuk data dari sensor ESP32 secara anonim (peran 'anon')
-- ESP32 dapat memasukkan data jika patient_id yang di-insert cocok dengan patient aktif saat ini di active_session.
create policy "Enable insert for anon if patient matches active session"
  on public.measurements for insert
  to anon
  with check (
    patient_id = (select active_patient_id from public.active_session where id = 1 limit 1)
  );


-- Kebijakan untuk tabel `active_session`
-- Siapapun (termasuk anon/ESP32) boleh membaca sesi pengukuran aktif saat ini
create policy "Enable read access for everyone including anon"
  on public.active_session for select
  using (true);

-- Hanya admin yang boleh memperbarui sesi aktif (mengubah pasien aktif)
create policy "Enable write access for admins only"
  on public.active_session for all
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. AUTH USER SINKRONISASI TRIGGER (Autoinsert profiles dari SignUp)
-- ---------------------------------------------------------------------

-- Fungsi trigger untuk membuat profil otomatis setelah registrasi di Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_name text;
  user_role text;
begin
  -- Menentukan nama default
  default_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  -- Menentukan role default
  user_role := coalesce(
    new.raw_user_meta_data->>'role',
    'patient'
  );

  insert into public.profiles (
    id, 
    email,
    role, 
    full_name, 
    age, 
    gender, 
    whatsapp_number, 
    medical_history, 
    notes,
    callmebot_apikey
  )
  values (
    new.id,
    new.email,
    user_role,
    default_name,
    coalesce((new.raw_user_meta_data->>'age')::integer, 0),
    coalesce(new.raw_user_meta_data->>'gender', 'Laki-laki'),
    coalesce(new.raw_user_meta_data->>'whatsapp_number', ''),
    coalesce(new.raw_user_meta_data->>'medical_history', '-'),
    coalesce(new.raw_user_meta_data->>'notes', '-'),
    coalesce(new.raw_user_meta_data->>'callmebot_apikey', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger pemicu
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================================
-- SELESAI
-- =====================================================================
