# Arte de Cozinha — Museum Flipbook Kiosk

Interactive page-turn catalogue for the Museu de Braga. Runs as a
fullscreen PWA on a **Surface Go 4** (1920 × 1280, Windows 11 Pro)
with no internet connection required after the first load.

---

## Contents

1. [How it works](#1-how-it-works)
2. [Project structure](#2-project-structure)
3. [Development setup](#3-development-setup)
4. [Managing content](#4-managing-content)
5. [Building the release](#5-building-the-release)
6. [Deploying to the tablet](#6-deploying-to-the-tablet)
7. [Windows kiosk setup](#7-windows-kiosk-setup)
8. [Employee access](#8-employee-access)
9. [Day-to-day operations](#9-day-to-day-operations)
10. [Theming and customisation](#10-theming-and-customisation)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. How it works

```
Surface Go 4 boots
│
├── Caddy service (SYSTEM) starts automatically
│     Reads:  C:\Kiosk\ArteDeCozinha\Caddyfile
│     Serves: C:\Kiosk\ArteDeCozinha\dist\  →  http://localhost:8080
│
└── Windows auto-logs into the "Kiosk" account
      Edge opens fullscreen at http://localhost:8080
      Visitor sees: Arte de Cozinha flipbook, nothing else
```

**Stack**

| Concern | Tool |
|---|---|
| Page-flip engine | [StPageFlip](https://github.com/Nodlik/StPageFlip) (`page-flip` npm) |
| Build tooling | [Vite 8](https://vitejs.dev/) — dev only; output is plain static files |
| Web server | [Caddy 2](https://caddyserver.com/) on `localhost:8080` |
| Offline | Service Worker + Cache API — fully offline after first load |

---

## 2. Project structure

```
COOKBOOK/
├── public/
│   ├── assets/
│   │   ├── audio/          flip.mp3  (optional page-turn sound)
│   │   ├── background.jpg  leather cover — used as app background
│   │   ├── icons/          icon-192.png, icon-512.png, icon-maskable-512.png
│   │   └── pages/          001.jpg … 275.jpg  (one file per physical page)
│   ├── manifest.webmanifest
│   ├── pages.json          ← edit this to control page order and titles
│   └── sw.js               service worker (offline cache)
├── src/
│   ├── lib/
│   │   └── utils.js        debounce helper
│   ├── scripts/
│   │   ├── app.js          boot orchestrator
│   │   ├── attract.js      idle / attract screen (90 s timeout, auto-flip)
│   │   ├── audio.js        optional page-flip sound
│   │   ├── controls.js     prev/next zones, keyboard, fullscreen button
│   │   └── flipbook.js     StPageFlip wrapper + canvas transparency patch
│   ├── styles/
│   │   ├── tokens.css      design tokens — edit here for theming
│   │   ├── layout.css      full-viewport shell, background, scrim
│   │   ├── controls.css    nav zones, page indicator, icon buttons
│   │   ├── attract.css     idle overlay styles and animations
│   │   └── main.css        imports all partials + StPageFlip overrides
│   └── main.js             Vite entry point
├── Caddyfile               web server config
├── index.html
├── vite.config.js
├── package.json
├── START.bat               launch Caddy for testing (double-click)
├── INSTALL-SERVICE.bat     register Caddy as a Windows service (run as Admin)
└── PACK.bat                build + assemble the release\ folder
```

---

## 3. Development setup

**Requirements (dev machine only — not needed on the tablet)**
- Node.js 18 or later — https://nodejs.org
- A modern browser for testing

```powershell
cd COOKBOOK
npm install
npm run dev          # Vite dev server → http://localhost:5173
```

The dev server hot-reloads on source changes. The flipbook uses
`public/pages.json` and `public/assets/pages/` directly.

---

## 4. Managing content

### 4.1 Page images

Place JPEG files in `public/assets/pages/` named sequentially:
`001.jpg`, `002.jpg`, …, `275.jpg`.

- **One file = one physical page.** StPageFlip pairs consecutive
  pages into two-page spreads automatically.
- **Recommended size:** 960 × 1280 px portrait (3:4), 150–200 dpi.
- **Format:** JPEG. PNG works but the files are much larger.

### 4.2 pages.json

`public/pages.json` controls the page list and the title shown on
the attract (idle) screen:

```json
{
  "title": "Arte de Cozinha",
  "pages": [
    { "src": "/assets/pages/001.jpg", "title": "Frontispício" },
    { "src": "/assets/pages/002.jpg", "title": "" },
    { "src": "/assets/pages/003.jpg", "title": "Cap. I — Das Aves" }
  ]
}
```

- **`title`** (top-level) — shown on the attract overlay and sets
  the browser tab title.
- **`title`** (per page) — reserved for future use; use `""` for
  pages without a chapter heading.

### 4.3 Background image

`public/assets/background.jpg` is the leather cover texture shown
behind the book and on the attract screen. Replace it with any JPEG
— 1920 × 1280 px recommended.

### 4.4 Page-flip sound (optional)

Place a short (< 0.5 s) mono MP3 at `public/assets/audio/flip.mp3`.
If the file is absent, the app runs silently — no errors.

Free sources: [freesound.org](https://freesound.org) → search "page flip".

### 4.5 PWA icons

Three PNGs in `public/assets/icons/`:

| File | Size | Purpose |
|---|---|---|
| `icon-192.png` | 192 × 192 | Browser / Android |
| `icon-512.png` | 512 × 512 | Splash screen |
| `icon-maskable-512.png` | 512 × 512 | Adaptive icon (keep logo inside inner 80%) |

---

## 5. Building the release

Run **`PACK.bat`** (double-click, no Admin needed) on the dev machine:

```
PACK.bat
```

What it does:
1. `npm install` — ensures dependencies are current
2. `npm run build` — Vite produces an optimised bundle in `dist\`
3. Copies `dist\`, `Caddyfile`, `START.bat`, and `INSTALL-SERVICE.bat`
   into a new `release\` folder

The `release\` folder is the complete deployment package.

**Bundle output (for reference)**

| File | Size (gzip) | Cache policy |
|---|---|---|
| `_app/index-[hash].js` | ~2.6 KB | Immutable (content-hashed) |
| `_app/vendor-pageflip-[hash].js` | ~10.4 KB | Immutable (never changes) |
| `_app/index-[hash].css` | ~2.3 KB | Immutable |
| `sw.js` | < 2 KB | No-cache (always revalidated) |

---

## 6. Deploying to the tablet

### 6.1 Copy the release folder

Copy the entire `release\` folder to the tablet. The recommended
installation path is:

```
C:\Kiosk\ArteDeCozinha\
├── dist\
├── Caddyfile
├── START.bat
└── INSTALL-SERVICE.bat
```

You can use a USB drive, network share, or OneDrive.

### 6.2 Install Caddy (one-time, on the tablet)

Log in as an administrator account on the tablet and run:

```powershell
winget install Caddy.Caddy
```

Verify: open a new PowerShell and type `caddy version`.

### 6.3 Test the server before installing the service

Double-click **`START.bat`** (no Admin needed). It will:
- Set the `KIOSK_DIR` environment variable to the folder it's in
- Launch Caddy, serving `dist\` on `http://localhost:8080`

Open Edge and go to `http://localhost:8080`. Confirm the flipbook
loads and pages turn correctly. Close the window (or Ctrl+C in the
console) to stop the server.

### 6.4 Install Caddy as a Windows service (one-time)

Right-click **`INSTALL-SERVICE.bat`** → **Run as administrator**.

The script:
1. Locates `caddy.exe` in PATH
2. Sets `KIOSK_DIR` as a permanent machine-wide environment variable
   (used by `Caddyfile` to locate the `dist\` folder)
3. Removes any previous `MuseumKiosk` service
4. Creates and starts the `MuseumKiosk` Windows service set to
   **Automatic** start — it will run at every boot, before anyone
   logs in, as the SYSTEM account

Verify the service is running:

```powershell
sc query MuseumKiosk
# STATE should show: RUNNING
```

---

## 7. Windows kiosk setup

All steps below are done on the tablet while logged in as an
**administrator account** (see Section 8 for how to create one).

### 7.1 Create the employee admin account (do this first)

1. **Settings → Accounts → Other users → Add account**
2. "I don't have this person's sign-in information" →
   "Add a user without a Microsoft account"
3. Name: `MuseumAdmin`, set a strong password, share only with staff
4. After creating: click the account → **Change account type →
   Administrator**

> ⚠️ Do this before configuring kiosk mode. Without an admin
> account you will be locked out of the tablet.

### 7.2 Configure Assigned Access (single-app kiosk)

1. **Settings → Accounts → Other users → Set up a kiosk**
2. Click **Get started**
3. Create a new account — name it `Kiosk` (no password needed)
4. Choose app: **Microsoft Edge**
5. Choose mode: **"As a digital sign"** (most locked-down)
   - No address bar, no tabs, no navigation UI, no right-click
6. Set the URL: `http://localhost:8080`
7. Set idle reset time: **0** (the PWA handles its own 90 s attract screen)

Windows will automatically configure `Kiosk` to log in without a
password whenever the tablet restarts.

### 7.3 Lock the display orientation

```
Settings → System → Display → Display orientation → Landscape
```

This prevents the tablet from rotating into portrait if tilted.

### 7.4 Disable sleep while plugged in

```
Settings → System → Power → Screen and sleep
  → "When plugged in, turn off my screen after" → Never
  → "When plugged in, put my device to sleep after" → Never
```

The attract screen provides the "unattended" visual without needing
the OS to blank the display.

### 7.5 First-run: warm the service worker cache

After kiosk mode is set up, log in once as `MuseumAdmin`, open
Edge, and go to `http://localhost:8080`. The service worker will
install and precache all 275 page images in the background. Once
complete, the flipbook works fully offline.

You can verify from DevTools (F12 while on `MuseumAdmin`):
**Application → Service Workers** — status should show **Activated**.

---

## 8. Employee access

### How to access the tablet during kiosk mode

| You have | Action |
|---|---|
| Type Cover attached | `Ctrl + Alt + Del` → **Switch User** → sign in as `MuseumAdmin` |
| Touch only | Hold the **Power button** → **Restart** → tap `MuseumAdmin` at the login screen |

After signing in as `MuseumAdmin`, the tablet behaves as a normal
Windows 11 desktop. Caddy keeps serving in the background (it runs
as SYSTEM, independent of which user is logged in).

When finished, **sign out** (`Start → Profile → Sign out`) and the
tablet returns to the kiosk automatically.

### Securing the tablet physically

- Use a **kiosk stand or wall mount** that covers the USB-C and
  power ports
- The Surface Go 4 has a **Kensington lock slot** on the left edge
- Store the Type Cover in a locked cabinet if you don't want visitors
  detaching it

---

## 9. Day-to-day operations

### Adding or replacing page images

1. Log in as `MuseumAdmin`
2. Copy new JPEGs to `C:\Kiosk\ArteDeCozinha\dist\assets\pages\`
   (using the same `001.jpg`, `002.jpg` … naming)
3. Update `C:\Kiosk\ArteDeCozinha\dist\pages.json` to match
4. Open Edge on `MuseumAdmin` → go to `http://localhost:8080` →
   press `Ctrl + Shift + R` (hard refresh) to update the cache
5. Sign out — the kiosk resumes with the new content

### Rebuilding from source (for larger changes)

1. Make changes on the dev machine
2. Run `PACK.bat` → copy new `release\` to the tablet
3. Stop the service: `net stop MuseumKiosk`
4. Replace `C:\Kiosk\ArteDeCozinha\dist\` with `release\dist\`
5. Start the service: `net start MuseumKiosk`
6. Open Edge → `http://localhost:8080` → `Ctrl + Shift + R`

### Service management (run as Administrator)

```powershell
net start MuseumKiosk    # start the server
net stop  MuseumKiosk    # stop the server
sc query  MuseumKiosk    # check status (should show RUNNING)
sc delete MuseumKiosk    # remove the service (then re-run INSTALL-SERVICE.bat)
```

### Changing the idle / attract timeout

In `src/attract.js`, line 1:

```js
const IDLE_MS = 90_000;   // milliseconds before attract screen appears
const FLIP_MS =  6_000;   // milliseconds between auto page-turns
```

Change the values, rebuild (`PACK.bat`), and redeploy.

---

## 10. Theming and customisation

All visual design tokens live in `src/styles/tokens.css`. The most
useful ones:

```css
/* Palette */
--clr-bg:            #16120e;   /* overall dark background   */
--clr-gold:          #c9a96e;   /* accent — buttons, labels  */
--clr-text-primary:  #ece5d8;   /* body copy                 */
--clr-text-secondary:#8c7e6a;   /* captions                  */

/* Typography — Windows 11 system fonts, no download needed */
--font-display: 'Palatino Linotype', 'Book Antiqua', Georgia, serif;
--font-body:    Georgia, 'Times New Roman', serif;
--font-ui:      'Segoe UI', system-ui, sans-serif;
```

### Using custom web fonts offline

1. Download `.woff2` subsets from
   [google-webfonts-helper](https://gwfh.mranftl.com/)
2. Place them in `public/assets/fonts/`
3. Add `@font-face` declarations at the top of `src/styles/tokens.css`
4. Update `--font-display` / `--font-body` to reference the new family

### Flip animation options

In `src/scripts/flipbook.js`, the StPageFlip constructor options most
likely to need tuning:

| Option | Default | Notes |
|---|---|---|
| `width` / `height` | 768 / 1024 | Single-page aspect ratio (must match your JPEGs) |
| `flippingTime` | 650 ms | Animation duration. 400–800 ms works well. |
| `swipeDistance` | 40 px | Minimum swipe distance to trigger a flip. |
| `maxShadowOpacity` | 0.45 | Shadow depth during flip. 0 = flat, 1 = deep. |

---

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Blank page, no book visible | `pages.json` not found or malformed | Open Edge on `MuseumAdmin` → F12 → Console tab. Usually a 404 or JSON parse error. |
| Book loads but white bands above/below | Canvas patch not applied | Hard-refresh (`Ctrl+Shift+R`). If still present, check that the correct `dist\` was deployed. |
| Pages show white spinners indefinitely | Images not found | Verify `dist\assets\pages\` contains all JPEG files and `pages.json` paths match exactly. |
| Flipbook works but audio is silent | `flip.mp3` missing, or AudioContext not resumed | The first touch on the attract screen resumes audio. If still silent, check `dist\assets\audio\flip.mp3` exists. |
| Attract screen never appears | `IDLE_MS` too high, or a background process is sending pointer events | Temporarily set `IDLE_MS = 5000` in `attract.js`, rebuild, test. |
| Caddy service not running after reboot | Service failed to start | `MuseumAdmin` → open PowerShell as Admin → `sc query MuseumKiosk` (check state) → `net start MuseumKiosk`. If it fails, re-run `INSTALL-SERVICE.bat`. |
| Caddy starts but page won't load | `KIOSK_DIR` env var not set | Re-run `INSTALL-SERVICE.bat` as Admin to re-register `KIOSK_DIR`, then restart the service. |
| Kiosk session crashes / Edge restarts | Edge kiosk watchdog | Expected — Windows Assigned Access automatically relaunches Edge. Persistent crashes usually mean a JS error; test on `MuseumAdmin` first. |
| Touch not registering in the book | Touch calibration drift | `MuseumAdmin` → run `C:\Windows\System32\tabcal.exe` → follow on-screen steps. |
| Can't log in as MuseumAdmin | Forgot password | Restart → hold Shift at login → Troubleshoot → Reset this PC (last resort). Always keep the password written in a secure location. |

---

*Built by Zephyr Studio for Museu de Braga.*
