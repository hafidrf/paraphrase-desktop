# Paraphrase & Translate Desktop

Rewrite text between **Indonesian** and **English** in one step: translate **and** standardize style.

- **ID → EN:** faithful translation polished to **TOEFL ITP** academic English  
- **EN → ID:** faithful translation polished to clear formal Indonesian  

Paraphrase is not a separate mode — it means standardizing your wording into the target language register.

---

## Prerequisites

- **Windows 10/11** or **macOS** (Apple Silicon or Intel)
- **Node.js 20+** (LTS recommended)
- Network access for Gemini / DeepSeek / Groq API keys

> **macOS note:** Cross-platform setup currently lives on the `hafid_dev` branch until it has been smoke-tested on a real Mac. Use that branch for the Mac steps below.

---

## Setup

### Windows

```powershell
git clone -b hafid_dev https://github.com/hafidrf/paraphrase-desktop.git
cd paraphrase-desktop
npm install
npm run setup
```

That generates the icon, builds an unpacked app under `dist/win-unpacked/`, and creates a Desktop shortcut (`Paraphrase.lnk`).

Dev mode: `npm run dev`

### macOS

1. Install **Node.js 20+** (Homebrew example):

```bash
brew install node@20
```

2. Clone `hafid_dev`, install, and run from source:

```bash
git clone -b hafid_dev https://github.com/hafidrf/paraphrase-desktop.git
cd paraphrase-desktop
npm install
npm run icon
npm run build
chmod +x start-app.sh
npm start
```

Or use the all-in-one setup (packs with electron-builder for the current OS, then creates a Desktop launcher):

```bash
npm run setup
```

3. Optional Desktop shortcut:

```bash
npm run shortcut
```

- Creates `Paraphrase.command` on the Desktop  
- If a packaged `Paraphrase.app` exists under `dist/`, the shortcut opens that app  
- Otherwise it runs `start-app.sh` (`npm start`)  
- First open may need right-click → **Open** (Gatekeeper)

4. Packaged `.app` / `.dmg` (must be built **on a Mac**):

```bash
npm run build:mac
```

Artifacts land under `dist/`. Unsigned builds are fine for personal use; Gatekeeper may still warn on first open.

---

## How to use

1. Choose **ID → EN** or **EN → ID**
2. Paste source text
3. Click **Rewrite** (or **Ctrl+Enter** / **Cmd+Enter**)
4. **Copy** the result

Configure your LLM provider and API key in the app settings.

---

## Data location

API keys and history stay local (Electron `userData`):

- **Windows:** `%APPDATA%/paraphrase-desktop/` (or the Electron product userData folder)
- **macOS:** `~/Library/Application Support/paraphrase-desktop/` (or the Electron product userData folder)

Do not commit API keys or `.env` files.

---

## Stack

Electron + React + TypeScript · Gemini / DeepSeek / Groq
