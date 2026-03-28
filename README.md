# PROJECT BODY REBIRTH
### Next.js 14 · Supabase · PWA · TypeScript

> *"Would a disciplined person, alone at 6am, find this fast, clear, and motivating?"*

---

## QUICK START

```bash
# 1. Clone / unzip the project
cd project-body-rebirth

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# → Fill in your Supabase URL and anon key (or skip for demo mode)

# 4. Run dev server
npm run dev

# 5. Open http://localhost:3000
# → Click "Continue in demo mode" to try without Supabase
```

---

## SUPABASE SETUP (for real data, multi-device sync)

### 1. Create Project
1. [supabase.com](https://supabase.com) → New Project
2. Note your **Project URL** and **Anon Key** → Settings → API

### 2. Run Database Schema
1. Supabase Dashboard → SQL Editor → New query
2. Paste contents of `supabase/schema.sql` → Run
3. ✅ Tables + RLS policies created

### 3. Create Storage Bucket
1. Dashboard → Storage → New bucket
2. Name: `progress-images` | Public: **OFF**
3. Add 3 policies (see comments in `schema.sql`):
   - INSERT for own folder
   - SELECT for own files
   - DELETE for own files

### 4. Add Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 5. Deploy to Vercel
```bash
npx vercel --prod
# Add the same env vars in Vercel project settings
```
That's it. PWA installs automatically on iOS/Android after first visit.

---

## ARCHITECTURE

```
pbr-next/
│
├── app/                        # Next.js 14 App Router pages
│   ├── page.tsx                # Dashboard — "The War Room"
│   ├── ritual/page.tsx         # Face Rebirth ritual + guided session
│   ├── mirror/page.tsx         # Progress photos — "The Mirror"
│   └── layout.tsx              # Root layout: fonts, providers, nav
│
├── components/
│   ├── layout/
│   │   ├── AuthGate.tsx        # Shows login or app based on session
│   │   ├── AuthScreen.tsx      # Sign in / sign up / demo mode UI
│   │   └── BottomNav.tsx       # Mobile-first sticky bottom navigation
│   ├── modules/
│   │   ├── ModuleCard.tsx      # Dashboard card per module (auto-adapts)
│   │   ├── IdentityAnchors.tsx # Before/after photo comparison
│   │   ├── WeightTracker.tsx   # Weight display + sparkline + log input
│   │   ├── HabitCalendar.tsx   # Monthly dot grid + streak counter
│   │   ├── GuidedSession.tsx   # Full-screen timer overlay (module-agnostic)
│   │   └── SessionComplete.tsx # Completion celebration screen
│   └── ui/
│       ├── Card.tsx            # Base card container
│       ├── SectionLabel.tsx    # Uppercase section headers
│       ├── Sparkline.tsx       # Canvas weight trend chart
│       ├── TimerRing.tsx       # SVG circular countdown
│       └── ToastLayer.tsx      # Global toast notifications
│
├── hooks/
│   ├── useAuth.ts              # Auth state (Supabase + demo mode)
│   ├── useData.ts              # Data CRUD — abstracts Supabase vs demo
│   └── useSession.ts           # Timer engine (module-agnostic)
│
├── lib/
│   ├── modules.ts              # ⭐ MODULE REGISTRY — add new modules here
│   ├── supabase.ts             # Supabase client factory (browser + server)
│   ├── store.ts                # React context state store
│   └── demo.ts                 # localStorage data layer for demo mode
│
├── types/
│   └── index.ts                # All shared TypeScript types
│
└── supabase/
    └── schema.sql              # Database tables + RLS policies
```

---

## ⭐ ADDING A NEW MODULE (e.g. Communication Rebirth)

This is the key design goal — **adding a module touches only 3 files**.

### Step 1 — Register the module (`lib/modules.ts`)
```typescript
export const COMMS_MODULE: RebirthModule = {
  id: 'comms',
  name: 'Communication Rebirth',
  tagline: 'Speak with precision daily',
  accent: 'accent',
  accentHex: '#4A9EBF',
  icon: '◎',
  route: '/comms',
  comingSoon: false,           // ← change to false when ready
  exercises: [
    {
      id: 1,
      name: 'Mirror Talk',
      sets: 3,
      duration_sec: 60,
      rest_sec: 10,
      sides: null,
      timestamp_sec: 0,
      timestamp_label: '0:00',
      description: 'Maintain eye contact with yourself. Speak clearly and slowly.',
    },
    // ... add more exercises
  ],
}

// Then add it to the registry:
export const ALL_MODULES: RebirthModule[] = [
  FACE_MODULE,
  COMMS_MODULE,  // ← add here
]
```

### Step 2 — Add module ID to types (`types/index.ts`)
```typescript
export type ModuleId = 'face' | 'comms'  // ← add 'comms'
```

### Step 3 — Create the ritual page (`app/comms/page.tsx`)
```typescript
// Copy app/ritual/page.tsx → app/comms/page.tsx
// Change: const MOD = FACE_MODULE  →  const MOD = COMMS_MODULE
// Change: const YT_VIDEO_ID = '...'  →  your video ID
// Done.
```

**That's it.** The module now:
- ✅ Appears on the dashboard with its own streak count
- ✅ Shows in bottom navigation
- ✅ Has habit tracking (uses module_id in DB — no schema changes needed)
- ✅ Works in demo mode automatically

---

## PWA INSTALL

After deploying to Vercel (or any HTTPS host):

**iOS Safari:**
Share button → "Add to Home Screen" → Add

**Android Chrome:**
Menu → "Add to Home Screen" → Install

The app runs in standalone mode — no browser chrome.
Service worker caches the app shell for offline access.

---

## TECH STACK

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 App Router | Server components, image optimization, routing |
| Styling | Tailwind CSS (custom tokens) | Utility-first with full design system control |
| Animation | Framer Motion | Spring physics, layout animations |
| Auth | Supabase Auth | Email/password + session management |
| Database | Supabase (Postgres) | RLS-protected, real-time capable |
| Storage | Supabase Storage | Private buckets + signed URL delivery |
| PWA | next-pwa | Service worker + manifest auto-generation |
| State | React Context + useReducer | No extra dependencies, fully typed |
| Types | TypeScript strict | Everything is typed |

---

## DESIGN TOKENS

All design decisions live in `tailwind.config.ts`:

```typescript
colors: {
  bg: { DEFAULT: '#0A0A0B', 2: '#111113', 3: '#181819' },
  accent: { DEFAULT: '#E8A045', dim: 'rgba(232,160,69,0.12)' },
  ink: { DEFAULT: '#F0EDE8', sub: 'rgba(...,0.50)', muted: 'rgba(...,0.28)' },
}
fontFamily: {
  display: 'Barlow Condensed',  // Headlines — big, confident
  body: 'Barlow',               // Body copy — clean, readable
}
```

To add a module accent color:
```typescript
// In tailwind.config.ts → theme.extend.colors:
comms: '#4A9EBF',
```

---

## DATABASE SCHEMA

```sql
weight_logs      id, user_id, weight_kg, logged_at
habit_logs       id, user_id, date, module_id, completed
progress_images  id, user_id, storage_path, note, is_worst_phase, module_id, created_at
```

All tables: RLS enabled. Users only see/write their own rows.
Images: private Supabase Storage bucket, served via 1-hour signed URLs.

---

## EXERCISES PARSED FROM VIDEO
**"How To Fix Asymmetry 5 Minutes Every Day"**
https://youtu.be/tX3eueEFCM8

| # | Exercise | Sets | Duration | Timestamp |
|---|----------|------|----------|-----------|
| 1 | Towel Jaw Resistance | 3 × 2 sides | 10s each | 1:35 |
| 2 | Full Tongue Mew | 1 set | 3 min continuous | 1:58 |
| 3 | Scalp Tension Release | 3 sets | 15s each | 2:40 |
| 4 | Cheek Hollow Hold | 3 × 2 sides | 10s each | 3:10 |
