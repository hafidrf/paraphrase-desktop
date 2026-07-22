# Paraphrase Desktop

**Paraphrase** is a small Windows desktop app that rewrites text between **Indonesian** and **professional English**. Paste your draft, run a paraphrase, and copy a polished result — clear, warm, and ready for everyday workplace writing.

It uses **Gemini Flash** (free tier) through [Google AI Studio](https://aistudio.google.com/).

- **Two-way rewrite:** Indonesian → English, or English → Indonesian
- **Professional tone:** natural and colleague-friendly, not stiff or robotic
- **Technical fidelity:** keeps terms, IDs, URLs, paths, and code identifiers intact
- **Local keys:** your API key stays on your machine (Settings or `.env`)

---

## Setup

### 1. API key

1. Open [Google AI Studio](https://aistudio.google.com/app/api-keys)
2. Create or copy a **Gemini API key** (Free tier)
3. Choose one method:
   - **In the app:** open **Settings** → paste the key → **Save**
   - **Via file:** copy `.env.example` to `.env` and set:
     ```
     MAIN_VITE_GEMINI_API_KEY=your_key_here
     ```

**Do not** commit `.env`, or share your key in Git, chat, or public channels.

### 2. Run (development)

```powershell
cd paraphrase-desktop
npm install
npm run dev
```

### 2b. Desktop shortcut (no terminal)

A **Paraphrase** shortcut can be placed on the Desktop. Double-click it to launch the app.

If the shortcut is missing or you have updated the app:

```powershell
cd paraphrase-desktop
npm run setup
```

(`setup` builds the app and recreates the Desktop shortcut.)

The unpacked executable lives at: `dist\win-unpacked\Paraphrase.exe`

### 3. Windows installer (optional)

```powershell
npm run build:win
```

Installers are written to the `dist/` folder.

---

## How to use

1. Paste text into the left panel
2. Choose the rewrite direction if needed
3. Click **Paraphrase**, or press **Ctrl+Enter**
4. Copy the result from the right panel with **Copy**

---

## Features (v1)

- Dual panels: source input / paraphrased output
- Paraphrase, Copy, and Clear
- Keyboard shortcut: **Ctrl+Enter**
- API key stored locally (Settings or `.env`)
- System prompt tuned for professional, warm prose while preserving technical detail

---

## Stack

- Electron + React + TypeScript ([electron-vite](https://electron-vite.org/))
- Gemini API model: `gemini-2.5-flash`
