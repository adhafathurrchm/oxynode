// OxyNode Common JS - Asynchronous Mock & Supabase Database Integrations

// Helper: Get Path Prefix for relative linking (handles root vs subfolder admin/patient)
function getPathPrefix() {
  const path = window.location.pathname;
  if (path.includes('/admin/') || path.includes('/patient/')) {
    return '../';
  }
  return './';
}

// Helper: Check if we are in mock mode
function useMock() {
  return typeof SUPABASE_CONFIG === 'undefined' || SUPABASE_CONFIG.useMock;
}

// -------------------------------------------------------------
// SUPABASE CLIENT INITIALIZATION
// -------------------------------------------------------------
let supabaseClient = null;
if (!useMock()) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log("OxyNode: Terhubung ke Supabase asli.");
  } catch (err) {
    console.error("Gagal menginisialisasi SDK Supabase. Menggunakan mode Mock Database.", err);
    SUPABASE_CONFIG.useMock = true; // Fallback ke mock jika inisialisasi error
  }
} else {
  console.log("OxyNode: Menggunakan mode Mock Database (localStorage).");
}

// -------------------------------------------------------------
// 1. DATABASE SYSTEM (ASYNC MOCK & SUPABASE CLIENT)
// -------------------------------------------------------------

const DEFAULT_USERS = [
  {
    id: "user-admin-1",
    email: "admin@oxynode.com",
    password: "admin", // Simple plaintext password for mockup
    role: "admin",
    full_name: "Dr. Hendra Wijaya",
    age: 45,
    gender: "Laki-laki",
    weight_kg: 72,
    height_cm: 175,
    whatsapp_number: "6281234567890",
    medical_history: "-",
    notes: "Kepala Klinik OxyNode"
  },
  {
    id: "user-patient-1",
    email: "budi@gmail.com",
    password: "pasien",
    role: "patient",
    full_name: "Budi Santoso",
    age: 58,
    gender: "Laki-laki",
    weight_kg: 68,
    height_cm: 165,
    whatsapp_number: "6289876543210",
    medical_history: "Hipertensi, kolesterol tinggi",
    notes: "Pasien rawat jalan rutin"
  },
  {
    id: "user-patient-2",
    email: "ani@gmail.com",
    password: "pasien",
    role: "patient",
    full_name: "Ani Wijaya",
    age: 32,
    gender: "Perempuan",
    weight_kg: 54,
    height_cm: 158,
    whatsapp_number: "628555444333",
    medical_history: "Asma ringan",
    notes: "Pantau berkala saat cuaca dingin"
  },
  {
    id: "user-patient-3",
    email: "dedi@gmail.com",
    password: "pasien",
    role: "patient",
    full_name: "Dedi Kurniawan",
    age: 65,
    gender: "Laki-laki",
    weight_kg: 80,
    height_cm: 170,
    whatsapp_number: "628111222333",
    medical_history: "Diabetes Melitus tipe 2",
    notes: "Perlu perhatian lebih pada luka kaki"
  }
];

const DEFAULT_MEASUREMENTS = [
  {
    id: "m-1",
    patient_id: "user-patient-1",
    spo2: 98,
    heart_rate: 72,
    ai_status: "normal",
    ai_result: "Kondisi SpO2 dan detak jantung Budi Santoso dalam batas normal. Tidak ada tanda-tanda hipoksia atau takikardia. Tetap jaga pola makan rendah garam dan kontrol tensi rutin.",
    created_at: new Date(Date.now() - 3 * 3600000).toISOString()
  },
  {
    id: "m-2",
    patient_id: "user-patient-1",
    spo2: 95,
    heart_rate: 82,
    ai_status: "normal",
    ai_result: "SpO2 95% termasuk batas bawah normal. Detak jantung 82 bpm normal. Disarankan untuk beristirahat sebentar dan minum air putih hangat. Re-evaluasi 15 menit lagi.",
    created_at: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: "m-3",
    patient_id: "user-patient-1",
    spo2: 99,
    heart_rate: 75,
    ai_status: "normal",
    ai_result: "Hasil pengukuran terbaru menunjukkan SpO2 99% (Sangat Baik) dan Detak Jantung 75 bpm (Stabil). Kondisi fisik prima. Lanjutkan aktivitas harian seperti biasa.",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: "m-4",
    patient_id: "user-patient-2",
    spo2: 94,
    heart_rate: 98,
    ai_status: "warning",
    ai_result: "Terdapat indikasi penurunan SpO2 (94%) disertai peningkatan detak jantung (98 bpm). Mengingat riwayat Asma ringan pasien, ada kemungkinan sesak napas ringan mulai terasa. Disarankan menggunakan inhaler jika diperlukan dan menghindari tempat berdebu.",
    created_at: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: "m-5",
    patient_id: "user-patient-2",
    spo2: 97,
    heart_rate: 85,
    ai_status: "normal",
    ai_result: "Kondisi kembali normal dengan SpO2 97% dan detak jantung 85 bpm setelah istirahat. Asma stabil.",
    created_at: new Date(Date.now() - 1 * 3600000).toISOString()
  },
  {
    id: "m-6",
    patient_id: "user-patient-3",
    spo2: 91,
    heart_rate: 110,
    ai_status: "critical",
    ai_result: "PERHATIAN KRITIS: SpO2 Dedi Kurniawan turun ke 91% (Hipoksia Sedang) dengan detak jantung meningkat tajam ke 110 bpm (Takikardia). Kondisi ini sangat riskan bagi pasien berusia 65 tahun dengan diabetes. Pasang bantuan oksigen portable segera dan posisikan pasien duduk tegak. Hubungi dokter pendamping jika kondisi tidak membaik dalam 10 menit.",
    created_at: new Date(Date.now() - 24 * 3600000).toISOString()
  }
];

function initMockDatabase() {
  if (!localStorage.getItem('oxynode_users')) {
    localStorage.setItem('oxynode_users', JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem('oxynode_measurements')) {
    localStorage.setItem('oxynode_measurements', JSON.stringify(DEFAULT_MEASUREMENTS));
  }
  if (!localStorage.getItem('oxynode_active_session')) {
    localStorage.setItem('oxynode_active_session', JSON.stringify({
      active_patient_id: null,
      set_at: new Date().toISOString()
    }));
  }
}

initMockDatabase();

// Asynchronous DB API Interface (transparent fallback)
const db = {
  // 1. User/Patient CRUD operations
  getUsers: async () => {
    if (useMock()) {
      return JSON.parse(localStorage.getItem('oxynode_users'));
    }
    const { data, error } = await supabaseClient.from('profiles').select('*');
    if (error) throw error;
    return data;
  },

  createUser: async (email, password, profileData) => {
    if (useMock()) {
      const users = JSON.parse(localStorage.getItem('oxynode_users'));
      const newUser = {
        id: "user-patient-" + Date.now(),
        email,
        password,
        role: "patient",
        ...profileData
      };
      users.push(newUser);
      localStorage.setItem('oxynode_users', JSON.stringify(users));
      return newUser;
    }

    // SUPABASE MODE:
    // Gunakan temp authClient dengan persistSession: false agar login admin tidak terganggu/keluar!
    const tempAuthClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: { persistSession: false }
    });

    const { data, error } = await tempAuthClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "patient",
          full_name: profileData.full_name,
          age: profileData.age,
          gender: profileData.gender,
          weight_kg: profileData.weight_kg,
          height_cm: profileData.height_cm,
          whatsapp_number: profileData.whatsapp_number,
          medical_history: profileData.medical_history,
          notes: profileData.notes
        }
      }
    });

    if (error) throw error;
    return data.user;
  },

  updateUser: async (id, profileData) => {
    if (useMock()) {
      const users = JSON.parse(localStorage.getItem('oxynode_users'));
      const updated = users.map(u => {
        if (u.id === id) {
          return { ...u, ...profileData };
        }
        return u;
      });
      localStorage.setItem('oxynode_users', JSON.stringify(updated));
      return;
    }

    // SUPABASE MODE:
    const { error } = await supabaseClient
      .from('profiles')
      .update(profileData)
      .eq('id', id);

    if (error) throw error;
  },

  deleteUser: async (id) => {
    if (useMock()) {
      const users = JSON.parse(localStorage.getItem('oxynode_users'));
      const updated = users.filter(u => u.id !== id);
      localStorage.setItem('oxynode_users', JSON.stringify(updated));
      return;
    }

    // SUPABASE MODE:
    // Karena profiles.id cascading dari auth.users, kita hapus dari public.profiles RLS.
    // Catatan: Jika ingin menghapus user login dari auth.users sepenuhnya, 
    // admin harus menghapusnya dari dashboard Supabase > Authentication > Users.
    const { error } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 2. Measurements operations
  getMeasurements: async () => {
    if (useMock()) {
      return JSON.parse(localStorage.getItem('oxynode_measurements'));
    }
    const { data, error } = await supabaseClient.from('measurements').select('*');
    if (error) throw error;
    return data;
  },

  createMeasurement: async (measurementData) => {
    if (useMock()) {
      const measurements = JSON.parse(localStorage.getItem('oxynode_measurements'));
      const newMeasure = {
        id: "m-" + Date.now(),
        created_at: new Date().toISOString(),
        ...measurementData
      };
      measurements.push(newMeasure);
      localStorage.setItem('oxynode_measurements', JSON.stringify(measurements));
      return newMeasure;
    }

    // SUPABASE MODE:
    const { data, error } = await supabaseClient
      .from('measurements')
      .insert(measurementData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateMeasurement: async (id, updateData) => {
    if (useMock()) {
      const measurements = JSON.parse(localStorage.getItem('oxynode_measurements'));
      const updated = measurements.map(m => {
        if (m.id === id) {
          return { ...m, ...updateData };
        }
        return m;
      });
      localStorage.setItem('oxynode_measurements', JSON.stringify(updated));
      return;
    }

    // SUPABASE MODE:
    const { error } = await supabaseClient
      .from('measurements')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  deleteMeasurement: async (id) => {
    if (useMock()) {
      const measurements = JSON.parse(localStorage.getItem('oxynode_measurements'));
      const updated = measurements.filter(m => m.id !== id);
      localStorage.setItem('oxynode_measurements', JSON.stringify(updated));
      return;
    }

    // SUPABASE MODE:
    const { error } = await supabaseClient
      .from('measurements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 3. Active Session operations
  getActiveSession: async () => {
    if (useMock()) {
      return JSON.parse(localStorage.getItem('oxynode_active_session'));
    }

    // SUPABASE MODE:
    const { data, error } = await supabaseClient
      .from('active_session')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;
    return data;
  },

  saveActiveSession: async (activePatientId) => {
    if (useMock()) {
      const session = {
        active_patient_id: activePatientId,
        set_at: new Date().toISOString()
      };
      localStorage.setItem('oxynode_active_session', JSON.stringify(session));
      return session;
    }

    // SUPABASE MODE:
    const { error } = await supabaseClient
      .from('active_session')
      .update({
        active_patient_id: activePatientId,
        set_at: new Date().toISOString()
      })
      .eq('id', 1);

    if (error) throw error;
  },

  // 4. AI Analysis via Google Gemini API Edge Function
  generateAiAnalysis: async (measurementId, patientData) => {
    if (useMock()) {
      // Simulate network request delay for high fidelity
      await new Promise(resolve => setTimeout(resolve, 3500));

      const measurements = JSON.parse(localStorage.getItem('oxynode_measurements'));
      const measurement = measurements.find(m => m.id === measurementId);
      if (!measurement) throw new Error("Measurement not found");

      let ai_status = 'normal';
      let ai_result = '';

      const age = patientData.age || '-';
      const history = patientData.medical_history || '-';
      const spo2 = measurement.spo2;
      const hr = measurement.heart_rate;

      if (spo2 >= 95 && hr >= 60 && hr <= 100) {
        ai_status = 'normal';
        ai_result = `Pengukuran terbaru ${patientData.full_name || '-'} (${age} tahun) menunjukkan kondisi prima. Saturasi oksigen sebesar ${spo2}% berada di atas ambang minimum normal, menandakan pasokan oksigen dalam darah sangat baik. Denyut jantung ${hr} bpm berada dalam rentang ritme sinus normal. Mengingat riwayat medis (${history}), kondisi stabil ini harus dipertahankan. Disarankan untuk terus menjaga gaya hidup sehat, minum air putih minimal 2 liter per hari, dan lakukan olahraga ringan secara teratur.`;
      } else if (spo2 >= 92 && spo2 < 95) {
        ai_status = 'warning';
        ai_result = `Saturasi oksigen ${patientData.full_name || '-'} terdeteksi di level ${spo2}%, sedikit di bawah batas ideal (95%). Detak nadi ${hr} bpm terpantau relatif normal. Untuk pasien dengan kondisi (${history}), penurunan oksigen ringan ini bisa mengindikasikan kelelahan fisik atau lingkungan ruangan yang kurang ventilasi. Pasien disarankan untuk duduk tegak, melatih teknik pernapasan dalam (deep breathing), dan menghindari aktivitas berat untuk sementara. Lakukan pengukuran ulang dalam 15 menit ke depan.`;
      } else if (spo2 < 92) {
        ai_status = 'critical';
        ai_result = `Halo ${patientData.full_name || 'Pasien'}. Hasil pengukuran saat ini menunjukkan saturasi oksigen berada di angka ${spo2}% dan denyut jantung ${hr} bpm. Kondisi ini sedikit menurun dari batas optimal, namun tidak perlu panik. Anda disarankan untuk tetap tenang, duduk dalam posisi tegak dan rileks guna membantu memperlancar pernapasan Anda. Silakan longgarkan pakaian dan lakukan teknik pernapasan dalam secara perlahan. Sebagai langkah pencegahan yang aman, kami menyarankan untuk segera menghubungi dokter atau klinik terdekat agar dapat dilakukan pemeriksaan lebih lanjut secara langsung.`;
      } else {
        ai_status = 'warning';
        ai_result = `Saturasi oksigen ${patientData.full_name || '-'} tergolong normal (${spo2}%), namun detak jantung terpantau abnormal pada ${hr} bpm. Kondisi ini bisa disebabkan oleh stres fisik, konsumsi kafein berlebih, atau pengaruh riwayat medis (${history}). Pasien disarankan untuk berbaring rileks, menarik napas dalam secara perlahan, serta membatasi stimulan. Pantau detak jantung berkala dan catat jika ada keluhan pusing atau nyeri dada.`;
      }

      ai_result += "\n\nAnalisis ini adalah hasil generate AI dan hanya berdasarkan data yang ada, keakuratan data berdasar pada keakuratan sensor, untuk analisis yang lebih akurat silakan untuk mendatangi dokter terdekat.";

      // Save back to mock measurements
      const updated = measurements.map(m => {
        if (m.id === measurementId) {
          return { ...m, ai_status, ai_result };
        }
        return m;
      });
      localStorage.setItem('oxynode_measurements', JSON.stringify(updated));

      return { ai_status, ai_result };
    }

    // SUPABASE MODE: Call Edge Function
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const token = sessionData.session?.access_token;

    const response = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/generate-ai-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || SUPABASE_CONFIG.anonKey}`,
        'apikey': SUPABASE_CONFIG.anonKey
      },
      body: JSON.stringify({ measurementId })
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = response.statusText;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error) errMsg = errJson.error;
      } catch (_) {}
      throw new Error(errMsg);
    }

    const result = await response.json();
    return result; // contains { success, ai_status, ai_result }
  }
};

// -------------------------------------------------------------
// 2. AUTHENTICATION SYSTEM
// -------------------------------------------------------------

function getCurrentUser() {
  const userStr = localStorage.getItem('oxynode_current_user');
  return userStr ? JSON.parse(userStr) : null;
}

async function login(email, password) {
  if (useMock()) {
    const users = await db.getUsers();
    const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      localStorage.setItem('oxynode_current_user', JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, message: "Email atau password salah!" };
  }

  // SUPABASE MODE:
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    return { success: false, message: "Email atau password salah! (" + error.message + ")" };
  }

  // Ambil profil rekam medisnya dari tabel profiles
  const { data: profile, error: profError } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profError) {
    // Keluar kembali jika profil tidak ditemukan
    await supabaseClient.auth.signOut();
    return { success: false, message: "Akun Anda terdaftar di Auth, namun profil rekam medis di database belum siap." };
  }

  const userObj = {
    id: data.user.id,
    email: data.user.email,
    role: profile.role,
    full_name: profile.full_name,
    age: profile.age,
    gender: profile.gender,
    weight_kg: profile.weight_kg,
    height_cm: profile.height_cm,
    whatsapp_number: profile.whatsapp_number,
    medical_history: profile.medical_history,
    notes: profile.notes
  };

  localStorage.setItem('oxynode_current_user', JSON.stringify(userObj));
  return { success: true, user: userObj };
}

async function logout() {
  if (!useMock() && supabaseClient) {
    try {
      await supabaseClient.auth.signOut();
    } catch (err) {
      console.error("Gagal melakukan signOut di Supabase.", err);
    }
  }
  localStorage.removeItem('oxynode_current_user');
  window.location.href = getPathPrefix() + 'index.html';
}

// Check Role Access & Redirect
function checkAccess(allowedRole) {
  const currentUser = getCurrentUser();
  const prefix = getPathPrefix();
  
  if (!currentUser) {
    window.location.href = prefix + 'index.html';
    return false;
  }
  
  if (allowedRole && currentUser.role !== allowedRole) {
    if (currentUser.role === 'admin') {
      window.location.href = prefix + 'admin/dashboard.html';
    } else {
      window.location.href = prefix + 'patient/dashboard.html';
    }
    return false;
  }
  return true;
}

// -------------------------------------------------------------
// 3. AUTO LAYOUT INJECTOR (Sidebar & Topbar)
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
  if (isLoginPage) return;

  const path = window.location.pathname;
  let requiredRole = null;
  if (path.includes('/admin/')) requiredRole = 'admin';
  if (path.includes('/patient/')) requiredRole = 'patient';

  if (!checkAccess(requiredRole)) return;

  const prefix = getPathPrefix();
  const currentUser = getCurrentUser();

  let layoutWrapper = document.getElementById('layout-wrapper');
  if (!layoutWrapper) {
    const appContainer = document.body;
    appContainer.className = "bg-slate-50 min-h-screen text-slate-800 flex overflow-hidden";
    
    // Save original child nodes to preserve event listeners
    const originalNodes = Array.from(appContainer.childNodes);
    originalNodes.forEach(node => {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });

    // 1. Create Overlay
    const overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.onclick = toggleSidebar;
    overlay.className = 'fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 hidden lg:hidden';
    appContainer.appendChild(overlay);

    // 2. Create Sidebar
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    sidebar.className = 'fixed lg:sticky top-0 left-0 z-40 w-64 lg:w-64 h-screen bg-white border-r border-slate-200 flex flex-col sidebar-transition -translate-x-full lg:translate-x-0 overflow-y-auto';
    sidebar.innerHTML = `
      <!-- Logo -->
      <div class="p-6 border-b border-slate-100 flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-200">
          <i data-lucide="activity" class="h-6 w-6 heart-pulse"></i>
        </div>
        <div>
          <h1 class="font-bold text-lg text-slate-900 tracking-tight">OxyNode</h1>
          <span class="text-xs text-sky-500 font-semibold uppercase tracking-wider">Pulse & SpO2</span>
        </div>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        ${currentUser.role === 'admin' ? `
          <a href="${prefix}admin/dashboard.html" id="nav-admin-dashboard" class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 text-sm font-medium">
            <i data-lucide="layout-dashboard" class="h-5 w-5"></i>
            <span>Dashboard</span>
          </a>
          <a href="${prefix}admin/data.html" id="nav-admin-data" class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 text-sm font-medium">
            <i data-lucide="database" class="h-5 w-5"></i>
            <span>Riwayat & Monitor</span>
          </a>
          <a href="${prefix}admin/users.html" id="nav-admin-users" class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 text-sm font-medium">
            <i data-lucide="users" class="h-5 w-5"></i>
            <span>Kelola User (Pasien)</span>
          </a>
          <a href="${prefix}admin/profile.html" id="nav-admin-profile" class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 text-sm font-medium">
            <i data-lucide="user-cog" class="h-5 w-5"></i>
            <span>Profil Rekam Medis</span>
          </a>
        ` : `
          <a href="${prefix}patient/dashboard.html" id="nav-patient-dashboard" class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 text-sm font-medium">
            <i data-lucide="line-chart" class="h-5 w-5"></i>
            <span>Dashboard Saya</span>
          </a>
          <a href="${prefix}patient/data.html" id="nav-patient-data" class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 text-sm font-medium">
            <i data-lucide="history" class="h-5 w-5"></i>
            <span>Riwayat Pengukuran</span>
          </a>
          <a href="${prefix}patient/profile.html" id="nav-patient-profile" class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 text-sm font-medium">
            <i data-lucide="user" class="h-5 w-5"></i>
            <span>Profil Saya</span>
          </a>
        `}
      </nav>

      <!-- Footer Sidebar (User Profile Quick View) -->
      <div class="p-4 border-t border-slate-100 bg-slate-50/50">
        <div class="flex items-center gap-3 mb-3">
          <div class="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm">
            ${currentUser.full_name ? currentUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div class="overflow-hidden">
            <h4 class="text-xs font-semibold text-slate-900 truncate">${currentUser.full_name || '-'}</h4>
            <p class="text-[10px] text-slate-500 font-medium capitalize">${currentUser.role === 'admin' ? 'Dokter / Admin' : 'Pasien'}</p>
          </div>
        </div>
        <button onclick="logout()" class="w-full flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-red-600 hover:border-red-200 transition duration-150">
          <i data-lucide="log-out" class="h-3.5 w-3.5"></i>
          <span>Keluar</span>
        </button>
      </div>
    `;
    appContainer.appendChild(sidebar);

    // 3. Create Layout Wrapper
    const layoutWrapperNode = document.createElement('div');
    layoutWrapperNode.id = 'layout-wrapper';
    layoutWrapperNode.className = 'flex-1 flex flex-col h-screen overflow-hidden';

    // Header
    const headerNode = document.createElement('header');
    headerNode.className = 'h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30';
    headerNode.innerHTML = `
      <div class="flex items-center gap-4">
        <button onclick="toggleSidebar()" class="text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition duration-150">
          <i data-lucide="menu" class="h-5 w-5"></i>
        </button>
        <h2 id="page-title" class="font-semibold text-slate-800 text-lg">OxyNode Portal</h2>
      </div>
      <div class="flex items-center gap-4">
        <div class="hidden sm:flex items-center gap-2 text-xs font-medium bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200">
          <div class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>Sistem Online</span>
        </div>
      </div>
    `;
    layoutWrapperNode.appendChild(headerNode);

    // Main
    const mainNode = document.createElement('main');
    mainNode.className = 'flex-1 overflow-y-auto p-6 animate-slide-in';
    
    // Append original nodes back to main
    originalNodes.forEach(node => mainNode.appendChild(node));
    layoutWrapperNode.appendChild(mainNode);

    appContainer.appendChild(layoutWrapperNode);

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  highlightActiveLink();
});

// Sidebar Toggle Functionality
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (!sidebar) return;
  
  const isDesktop = window.innerWidth >= 1024;
  
  if (isDesktop) {
    if (sidebar.classList.contains('lg:w-64')) {
      sidebar.classList.remove('lg:w-64', 'lg:translate-x-0');
      sidebar.classList.add('lg:w-0', '-translate-x-full');
    } else {
      sidebar.classList.remove('lg:w-0', '-translate-x-full');
      sidebar.classList.add('lg:w-64', 'lg:translate-x-0');
    }
  } else {
    if (sidebar.classList.contains('translate-x-0')) {
      sidebar.classList.remove('translate-x-0');
      sidebar.classList.add('-translate-x-full');
      if (overlay) overlay.classList.add('hidden');
    } else {
      sidebar.classList.remove('-translate-x-full');
      sidebar.classList.add('translate-x-0');
      if (overlay) overlay.classList.remove('hidden');
    }
  }
}

function highlightActiveLink() {
  const path = window.location.pathname;
  let activeId = '';
  
  if (path.includes('/admin/dashboard.html')) activeId = 'nav-admin-dashboard';
  else if (path.includes('/admin/data.html')) activeId = 'nav-admin-data';
  else if (path.includes('/admin/users.html')) activeId = 'nav-admin-users';
  else if (path.includes('/admin/profile.html')) activeId = 'nav-admin-profile';
  
  else if (path.includes('/patient/dashboard.html')) activeId = 'nav-patient-dashboard';
  else if (path.includes('/patient/data.html')) activeId = 'nav-patient-data';
  else if (path.includes('/patient/profile.html')) activeId = 'nav-patient-profile';

  const activeLink = document.getElementById(activeId);
  if (activeLink) {
    activeLink.classList.add('active-nav-link');
    activeLink.classList.remove('text-slate-600');
    const pageTitleElem = document.getElementById('page-title');
    if (pageTitleElem) {
      const span = activeLink.querySelector('span');
      if (span) pageTitleElem.innerText = span.innerText;
    }
  }
}

// -------------------------------------------------------------
// 4. UI HELPER UTILITIES (TOASTS & MODALS)
// -------------------------------------------------------------

function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `flex items-center gap-3 p-4 rounded-xl shadow-lg border text-sm pointer-events-auto transition duration-300 transform translate-y-2 opacity-0 w-full`;
  
  let bgClass = 'bg-white border-slate-100 text-slate-800';
  let iconHtml = '';

  switch(type) {
    case 'success':
      bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-800';
      iconHtml = '<i data-lucide="check-circle" class="h-5 w-5 text-emerald-500"></i>';
      break;
    case 'warning':
      bgClass = 'bg-amber-50 border-amber-200 text-amber-800';
      iconHtml = '<i data-lucide="alert-triangle" class="h-5 w-5 text-amber-500"></i>';
      break;
    case 'error':
      bgClass = 'bg-red-50 border-red-200 text-red-800';
      iconHtml = '<i data-lucide="x-circle" class="h-5 w-5 text-red-500"></i>';
      break;
    case 'info':
      bgClass = 'bg-sky-50 border-sky-200 text-sky-800';
      iconHtml = '<i data-lucide="info" class="h-5 w-5 text-sky-500"></i>';
      break;
  }

  toast.innerHTML = `
    <div class="flex-shrink-0">${iconHtml}</div>
    <div class="flex-grow font-medium">${message}</div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 transition p-1">
      <i data-lucide="x" class="h-4 w-4"></i>
    </button>
  `;

  toast.className += ` ${bgClass}`;
  toastContainer.appendChild(toast);
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

function showConfirmModal({ title, message, onConfirm, confirmText = "Ya, Lanjutkan", cancelText = "Batal" }) {
  const modalId = 'global-confirm-modal';
  let modal = document.getElementById(modalId);
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = modalId;
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in';
  
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full border border-slate-100 transform scale-95 opacity-0 transition duration-300">
      <div class="flex items-start gap-4">
        <div class="h-10 w-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
          <i data-lucide="alert-triangle" class="h-5 w-5 text-amber-500"></i>
        </div>
        <div>
          <h3 class="font-semibold text-slate-900 text-lg">${title}</h3>
          <p class="text-sm text-slate-500 mt-2">${message}</p>
        </div>
      </div>
      <div class="flex items-center justify-end gap-3 mt-6">
        <button id="modal-cancel-btn" class="border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition">
          ${cancelText}
        </button>
        <button id="modal-confirm-btn" class="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition">
          ${confirmText}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  const panel = modal.querySelector('.bg-white');
  setTimeout(() => {
    panel.classList.remove('scale-95', 'opacity-0');
  }, 50);

  const closeModal = () => {
    panel.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.remove(), 250);
  };

  modal.querySelector('#modal-cancel-btn').addEventListener('click', closeModal);
  modal.querySelector('#modal-confirm-btn').addEventListener('click', () => {
    onConfirm();
    closeModal();
  });
}
