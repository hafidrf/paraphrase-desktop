# Paraphrase Desktop

App desktop Windows kecil: tempel teks **Indonesia** → dapat **Inggris profesional** untuk FAQ, Discord, HR, QA, dan progress update.

Menggunakan **Gemini Flash** (free tier) via Google AI Studio.

## Setup

### 1. API key

1. Buka [Google AI Studio](https://aistudio.google.com/app/api-keys)
2. Buat / copy **Gemini API key** (Free tier)
3. Pilih salah satu:
   - **Via app:** buka **Settings** → paste key → **Save**
   - **Via file:** copy `.env.example` → `.env`, isi:
     ```
     MAIN_VITE_GEMINI_API_KEY=your_key_here
     ```

**Jangan** commit `.env` atau paste key ke Git/Discord/chat.

### 2. Jalankan (development)

```powershell
cd c:\aupros\paraphrase-desktop
npm install
npm run dev
```

### 2b. Icon di Desktop (tanpa terminal)

Sudah dibuat shortcut **Paraphrase** di Desktop. Double-click untuk buka app.

Kalau shortcut hilang atau setelah update app:

```powershell
cd c:\aupros\paraphrase-desktop
npm run setup
```

(`setup` = build app + buat ulang shortcut Desktop)

Executable ada di: `dist\win-unpacked\Paraphrase.exe`

### 3. Build installer Windows (opsional)

```powershell
npm run build:win
```

Output installer ada di folder `dist/`.

## Cara pakai

1. Tempel teks Indonesia di panel kiri
2. Klik **Paraphrase** atau tekan **Ctrl+Enter**
3. Salin hasil dari panel kanan dengan **Copy**

## Fitur v1

- Dua panel: input ID / output EN
- Paraphrase, Copy, Clear
- Shortcut Ctrl+Enter
- API key disimpan lokal (Settings atau `.env`)
- System prompt: profesional, hangat, istilah teknis tetap

## Stack

- Electron + React + TypeScript (electron-vite)
- Gemini API `gemini-2.5-flash`
