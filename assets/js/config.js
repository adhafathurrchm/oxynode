// OxyNode Supabase Configuration
// Isi URL dan Anon Key Supabase Anda di sini untuk menghubungkan ke database asli.

const SUPABASE_CONFIG = {
  // Ganti dengan URL Proyek Supabase Anda, contoh: "https://xyzcompany.supabase.co"
  url: "https://befqeqtfirieyyjbtnzu.supabase.co",
  // Ganti dengan Kunci Anonim (anon public key) Proyek Supabase Anda
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZnFlcXRmaXJpZXl5amJ0bnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzcyNjcsImV4cCI6MjA5Njg1MzI2N30.fWnGYlSdh5WTb4sfyiQCj3dexuTtqonzvbFNrFrmUHY",

  // Set ke false jika ingin menghubungkan ke Supabase asli.
  // Set ke true jika ingin menggunakan Simulasi Database Lokal (localStorage).
  useMock: false
};

const FONNTE_CONFIG = {
  // Token API Fonnte untuk mengirim notifikasi WhatsApp
  token: "dyjWEJN9aeikTVaHXVad"
};

