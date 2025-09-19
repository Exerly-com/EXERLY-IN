# EXERLY.in — Global Trade OS (Blue/White/Black + Dark/Light)

Next.js App Router + Tailwind. Minimal eBay-like theme (blue/white/black). Dark/Light toggle. Supabase integration (optional).

## Quick Start
```bash
npm i
cp .env.example .env.local
npm run dev
```

## Deploy (Vercel)
- Import the GitHub repo into Vercel.
- Add env vars from `.env.local`.
- Set domain EXERLY.in to Vercel.

## Data Architecture
- **Supabase Postgres**: `profiles`, `listings`, `leads`
- **Supabase Storage**: `kyc` (private), `products` (public)
- **Admin Allowlist**: `ADMIN_EMAILS` for `/admin`

### Tables
```sql
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_email text unique,
  company text,
  country text,
  about text,
  kyc_status text default 'pending',
  created_at timestamptz default now()
);

create table listings (
  id bigserial primary key,
  owner_email text,
  title text,
  description text,
  price numeric,
  currency text,
  image_url text,
  created_at timestamptz default now()
);

create table leads (
  id bigserial primary key,
  name text,
  email text,
  message text,
  created_at timestamptz default now()
);
```

### Storage Buckets
- `kyc` (private) → `docs/`
- `products` (public) → `products/`

> Add Row Level Security and policies before production.

## Pages
- `/` Home (hero + features)
- `/product` Product sections
- `/ai-tools` + 4 tools
- `/about`, `/contact`
- `/dashboard` → profile, KYC, listings
- `/admin` → review KYC (allowlist)

## Theme
- Primary blue `#2563eb`
- Light (white bg, black text) / Dark (black bg, white text)
- Links & buttons invert on hover with blue accent
