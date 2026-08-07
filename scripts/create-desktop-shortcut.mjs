#!/usr/bin/env node
/**
 * Create a Desktop launcher for Paraphrase (Windows or macOS).
 */
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const desktop = path.join(os.homedir(), 'Desktop')

function findMacApp() {
  const dist = path.join(root, 'dist')
  if (!fs.existsSync(dist)) return null
  const candidates = []
  for (const name of fs.readdirSync(dist)) {
    const base = path.join(dist, name)
    const appInBase = path.join(base, 'Paraphrase.app')
    if (fs.existsSync(appInBase)) candidates.push(appInBase)
    try {
      if (!fs.statSync(base).isDirectory()) continue
      for (const nested of fs.readdirSync(base)) {
        if (nested.endsWith('.app')) {
          candidates.push(path.join(base, nested))
        }
      }
    } catch {
      // ignore
    }
  }
  return candidates[0] ?? null
}

if (process.platform === 'win32') {
  const ps1 = path.join(root, 'scripts', 'create-desktop-shortcut.ps1')
  const r = spawnSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1],
    { stdio: 'inherit' }
  )
  process.exit(r.status ?? 1)
}

if (process.platform === 'darwin') {
  fs.mkdirSync(desktop, { recursive: true })
  const commandPath = path.join(desktop, 'Paraphrase.command')
  const startSh = path.join(root, 'start-app.sh')
  const macApp = findMacApp()

  let body
  if (macApp) {
    body = `#!/bin/bash
open "${macApp}"
`
  } else {
    body = `#!/bin/bash
cd "${root}"
exec bash "${startSh}"
`
  }

  fs.writeFileSync(commandPath, body, { mode: 0o755 })
  try {
    fs.chmodSync(commandPath, 0o755)
    if (fs.existsSync(startSh)) fs.chmodSync(startSh, 0o755)
  } catch {
    // ignore
  }

  console.log(`Shortcut created: ${commandPath}`)
  if (macApp) {
    console.log(`Target: ${macApp}`)
  } else {
    console.log('No packaged .app found yet — shortcut runs start-app.sh (npm start).')
    console.log('After packaging on a Mac (npm run build:mac), re-run: npm run shortcut')
  }
  console.log('First open may need right-click → Open (Gatekeeper).')
  process.exit(0)
}

console.error(`desktop shortcut is not supported on ${process.platform}`)
process.exit(1)
