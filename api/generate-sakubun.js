export default async function handler(req, res) {
    // Pengaturan keamanan CORS agar bisa dipanggil dari web Shakuyaku Anda
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { allowedKanji, topic } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key belum dipasang di Vercel.' });
    }

    const promptMessage = `Tolong buatkan sebuah karangan PANJANG (sekitar 300-500 karakter / 3-4 paragraf) dalam bahasa Jepang tentang "${topic}" untuk latihan membaca (Dokai).

Aturan Ketat Penulisan:
1. PENGGUNAAN KANJI: GUNAKAN KANJI HANYA dari daftar Kanji berikut ini: [${allowedKanji.join(", ")}].
   - Jika ada kata yang membutuhkan Kanji di luar daftar ini, WAJIB ditulis menggunakan Hiragana atau Katakana saja.
2. TANPA FURIGANA: JANGAN GUNAKAN FURIGANA SAMA SEKALI (Jangan tampilkan Hiragana di atas atau di samping Kanji).
3. BATASAN BUNPOU: Gunakan pola tata bahasa (Bunpou) dan struktur kalimat HANYA dari materi Minna no Nihongo Bab 1 sampai Bab 25 (seperti: ~てから, ~てもいいです, ~なければなりません, ~ことができる, ~まえに, bentuk lampau/non-lampau, dll). Jangan gunakan Bunpou N3/N2 atau Minna no Nihongo Bab 26 ke atas.
4. HASIL AKHIR:
   - Tampilkan teks karangan bahasa Jepang (tanpa furigana).
   - Di bagian paling bawah, berikan terjemahan lengkap karangan tersebut dalam bahasa Indonesia sebagai kunci jawaban.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptMessage }] }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const textResult = data.candidates[0].content.parts[0].text;
            res.status(200).json({ result: textResult });
        } else {
            res.status(500).json({ error: "Respon AI kosong atau terjadi kesalahan." });
        }
    } catch (error) {
        res.status(500).json({ error: "Gagal terhubung ke Gemini API." });
    }
}
