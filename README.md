# ClimaApp

Weather forecast app with interactive map, 3-day predictions, and user location support.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** FastAPI + SuperTokens + PostgreSQL (existing)
- **Weather data:** Open-Meteo API (free, no key required)

## Quick Start

### Development

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`. Backend must be available at `http://localhost:8000`.

### Docker

```bash
docker-compose up --build -d
```

Set your environment values in `.env` before building:

```env
VITE_API_URL=http://localhost:8000
VITE_PUBLIC_URL=http://localhost:5173
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |
| `VITE_PUBLIC_URL` | Public URL for OG images and meta tags | `http://localhost:5173` |

Variables are injected at build time. Change `.env` before building for each environment.

## Project Structure

```
frontend/
├── public/
│   ├── favicon.svg
│   └── og_image.webp
├── src/
│   ├── components/     # Shared components (LocationPicker, etc.)
│   ├── i18n/
│   │   ├── index.ts  # i18next config
│   │   └── locales/  # en.json, es.json
│   ├── lib/           # SuperTokens init
│   ├── pages/         # Login, Register, Dashboard
│   ├── services/      # API client, location service
│   ├── App.tsx
│   ├── index.css      # Tailwind + CSS custom properties (theme)
│   └── main.tsx
├── index.html
├── tailwind.config.js
├── vite.config.ts
├── Dockerfile
└── docker-compose.yml
```

## Features

- Email/password authentication via SuperTokens
- Browser geolocation + Nominatim reverse geocoding
- Interactive OpenStreetMap (click to select location)
- 3-day weather forecast (+3h, +1d, +3d) from Open-Meteo
- 24-hour temperature history chart (Recharts)
- i18n: English and Spanish with language toggle
- Responsive: mobile-first layout, desktop split-view
- Centralized theme system via CSS custom properties

## i18n

Translations are in `src/i18n/locales/`. Language is auto-detected from browser and cached in `localStorage`. Use the language toggle button to switch manually.

## Theme

All design tokens are in `src/index.css` under `:root`. To iterate the theme, edit the CSS custom properties there — colors, shadows, radii, and transitions propagate automatically through Tailwind.

```css
--color-brand-500: #3644f0;  /* change here → updates entire app */
```

Dark mode can be added by adding a `:dark {}` block that overrides the same variables.
