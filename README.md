# weca (WICA - World Anomaly Intelligence & Classification Platform)

An advanced web application for discovering, documenting, verifying, and analyzing global environmental, historical, and geological anomalies. Powered by Next.js 16, Supabase, Tailwind CSS, and AI Vision analysis (Google Gemini & Anthropic).

## 🚀 Key Features

- **Anomaly Intelligence Feed**: Explore curated, verified, and community-reported anomalies worldwide.
- **Multimodal AI Verification**: Automated image classification, confidence scoring, and visual verification using Google Gemini Vision & Anthropic SDKs.
- **Interactive Anomaly Map**: Geospatial visualization of anomaly sightings, cluster zones, and regional reports.
- **Scoring Engine & Tiers**: Dynamic rarity tier classification (Common to Eldritch/Mythic) with algorithmic authenticity scoring.
- **Versus / Comparison Engine**: Side-by-side analysis of contradictory anomaly reports and visual evidence.
- **Community Challenges & Leaderboards**: Bounty challenges, verification quotas, and community researcher reputation tiers.
- **Pro Tier & Research Accounts**: Deep analytics, raw sensor exports, high-resolution imagery, and specialized tooling.
- **Full Supabase Integration**: Realtime database, authentication, row-level security (RLS), and media storage.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Styling**: Tailwind CSS 4 & Vanilla CSS custom tokens
- **Database & Auth**: Supabase (PostgreSQL, Realtime, Storage)
- **AI / Vision**: `@google/genai`, `@google/generative-ai`, `@anthropic-ai/sdk`
- **Icons & UI**: Lucide React, Canvas Confetti

## 📦 Getting Started

### 1. Prerequisites

- Node.js 20+
- npm, yarn, or pnpm
- A Supabase project
- A Google Gemini API key (optional for local mock mode, required for live AI vision)

### 2. Clone & Install

```bash
git clone https://github.com/adityakumar01127-ops/weca.git
cd weca
npm install
```

### 3. Environment Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Configure your variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Database Setup

Execute the SQL script located in `supabase/schema.sql` in your Supabase SQL editor to create the required tables, triggers, and RLS policies.

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```text
wica/
├── app/                  # Next.js App Router pages & API routes
│   ├── anomalies/        # Anomaly listing & detail pages
│   ├── challenges/       # Community anomaly investigations
│   ├── directory/        # Researcher & anomaly directory
│   ├── map/              # Global geospatial anomaly map
│   ├── pro/              # Pro membership features
│   ├── versus/           # Head-to-head comparison engine
│   └── ...
├── components/           # Reusable React components
│   ├── auth/             # Login & registration modals
│   ├── feed/             # Feed cards & photo viewer
│   ├── navigation/       # Navbar & footer
│   └── ui/               # Design system primitives
├── context/              # React Context providers (Auth, etc.)
├── lib/                  # Utilities, Supabase client, Gemini API helper
├── public/               # Static assets, icons, sample images
└── supabase/             # Database schema migrations & SQL
```

## 📜 License

MIT License.
