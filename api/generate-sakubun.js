export default async function handler(req, res) {
    // Header CORS agar tidak diblokir browser
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { allowedKanji, topic } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key Gemini belum dipasang di Vercel.' });
    }

    const promptMessage = `Tolong buatkan sebuah karangan PANJANG (sekitar 300-500 karakter / 3-4 paragraf) dalam bahasa Jepang tentang "${topic || 'Kegiatan Sehari-hari'}" untuk latihan membaca (Dokai).

Aturan Ketat Penulisan:
1. PENGGUNAAN KANJI: GUNAKAN KANJI HANYA dari daftar Kanji berikut ini: [${allowedKanji ? allowedKanji.join(", ") : ""}].
   - Jika ada kata yang membutuhkan Kanji di luar daftar ini, WAJIB ditulis menggunakan Hiragana atau Katakana saja.
2. TANPA FURIGANA: JANGAN GUNAKAN FURIGANA SAMA SEKALI (Jangan tampilkan Hiragana di atas atau di samping Kanji).
3. BATASAN BUNPOU: Gunakan pola tata bahasa (Bunpou) dan struktur kalimat HANYA dari materi Minna no Nihongo Bab 1 sampai Bab 25.
4. HASIL AKHIR:
   - Tampilkan teks karangan bahasa Jepang (tanpa furigana).
   - Di bagian paling bawah, berikan terjemahan lengkap karangan tersebut dalam bahasa Indonesia sebagai kunci jawaban.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptMessage }]
                }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            return res.status(200).json({ result: data.candidates[0].content.parts[0].text });
        } else {
            return res.status(500).json({ error: data.error?.message || 'Respon AI kosong atau terjadi kesalahan.' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Gagal menghubungi server Gemini.' });
    }
}
