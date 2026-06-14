// Supabase Edge Function: generate-ai-analysis
// File: supabase/functions/generate-ai-analysis/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS Preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? "";

    if (!geminiApiKey) {
      throw new Error("Missing GEMINI_API_KEY environment secret.");
    }

    // 1. Initialize Supabase client with Service Role Key to bypass RLS for updating data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Parse request body
    const { measurementId } = await req.json();
    if (!measurementId) {
      return new Response(JSON.stringify({ error: "measurementId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Fetch measurement record
    const { data: measurement, error: mError } = await supabase
      .from("measurements")
      .select("*")
      .eq("id", measurementId)
      .single();

    if (mError || !measurement) {
      return new Response(JSON.stringify({ error: "Measurement not found: " + (mError?.message || "") }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Fetch patient profile details
    const { data: patient, error: pError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", measurement.patient_id)
      .single();

    if (pError || !patient) {
      return new Response(JSON.stringify({ error: "Patient profile not found: " + (pError?.message || "") }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Construct Prompt for Google Gemini
    const prompt = `Anda adalah seorang dokter pendamping klinis ahli yang sangat peduli, ramah, dan berempati tinggi. Analisis data pengukuran kesehatan pasien berikut secara saksama:
Nama Pasien: ${patient.full_name || "Pasien"}
Umur: ${patient.age || "-"} tahun
Jenis Kelamin: ${patient.gender || "-"}
Riwayat Medis Pasien: ${patient.medical_history || "-"}
Catatan Tambahan Klinik: ${patient.notes || "-"}

Hasil Pengukuran Sensor Terbaru:
- Saturasi Oksigen (SpO2): ${measurement.spo2}%
- Detak Nadi / Jantung (Heart Rate): ${measurement.heart_rate} bpm

Tolong berikan penilaian klinis instan. Output Anda HARUS berupa format JSON terstruktur persis seperti berikut (jangan ada teks pembuka/penutup markdown lain, langsung JSON):
{
  "ai_status": "normal" | "warning" | "critical",
  "ai_result": "Teks analisis medis lengkap dalam Bahasa Indonesia..."
}

Aturan Penilaian Status (ai_status):
- "normal": Jika SpO2 >= 95% dan Heart Rate antara 60-100 bpm.
- "warning": Jika SpO2 antara 92-94% atau Heart Rate antara 50-59 bpm atau 101-109 bpm.
- "critical": Jika SpO2 < 92% atau Heart Rate < 50 bpm atau >= 110 bpm.

Aturan Teks Analisis Medis (ai_result):
1. Harus padat, informatif (2-3 paragraf), memberikan saran tindakan medis mandiri yang spesifik serta edukatif berdasarkan riwayat penyakit pasien.
2. Jika statusnya adalah "critical" (kritis), gaya bahasa dan kata-kata yang Anda pilih HARUS sangat menenangkan, ramah, dan berempati tinggi. Hindari kata-kata yang dapat memicu kepanikan atau rasa takut. Berikan panduan pertolongan pertama (seperti mengatur napas, beristirahat dalam posisi tegak/nyaman) secara menyejukkan hati sebelum merekomendasikan pemeriksaan ke fasilitas medis.
3. Di akhir paragraf teks analisis medis (ai_result), Anda WAJIB menambahkan kalimat penutup persis seperti ini (berikan spasi/baris baru sebelum kalimat ini):
"Analisis ini adalah hasil generate AI dan hanya berdasarkan data yang ada, keakuratan data berdasar pada keakuratan sensor, untuk analisis yang lebih akurat silakan untuk mendatangi dokter terdekat."`;

    // 6. Call Google Gemini API (gemini-2.5-flash)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              ai_status: {
                type: "string",
                enum: ["normal", "warning", "critical"],
              },
              ai_result: {
                type: "string",
              },
            },
            required: ["ai_status", "ai_result"],
          },
        },
      }),
    });

    if (!geminiResponse.ok) {
      const gErrorText = await geminiResponse.text();
      throw new Error(`Google Gemini API Error: ${gErrorText}`);
    }

    const geminiData = await geminiResponse.json();
    const resultText = geminiData.candidates[0].content.parts[0].text;

    // 7. Parse the JSON response from Gemini
    const aiResponseObj = JSON.parse(resultText.trim());
    const aiStatus = aiResponseObj.ai_status || "normal";
    const aiResult = aiResponseObj.ai_result || "Gagal memformulasikan analisis AI.";

    // 8. Update database record in Supabase
    const { error: updateError } = await supabase
      .from("measurements")
      .update({
        ai_status: aiStatus,
        ai_result: aiResult,
      })
      .eq("id", measurementId);

    if (updateError) {
      throw new Error("Gagal mengupdate measurements: " + updateError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ai_status: aiStatus,
        ai_result: aiResult,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
