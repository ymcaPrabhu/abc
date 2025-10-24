# Where to Set Each Credential - Visual Guide

## Overview: What Goes Where

```
Google Cloud Console
├─ You CREATE here:
│  ├─ Client ID
│  └─ Client Secret
│
└─ You SET here:
   └─ Redirect URIs (Supabase callback URL)

Supabase Dashboard
├─ You GET from here:
│  ├─ Project URL
│  ├─ Anon Key
│  └─ Project Reference ID
│
└─ You SET here:
   └─ Google Client ID & Secret (from Google Cloud)

Your Project (.env.local file)
└─ You SET here:
   ├─ Supabase URL (from Supabase)
   └─ Supabase Key (from Supabase)

Vercel Dashboard
└─ You SET here:
   ├─ Supabase URL (from Supabase)
   └─ Supabase Key (from Supabase)
```

---

## Detailed: Step-by-Step Where to Set Everything

### 1️⃣ GOOGLE CLOUD CONSOLE
**URL:** https://console.cloud.google.com/

#### What to CREATE:
**Location:** APIs & Services → Credentials → Create Credentials → OAuth client ID

You will CREATE and RECEIVE:
```
Client ID: 123456789-abcdefghijk.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxxxxxxxxxxx
```

**💾 SAVE THESE** - You'll paste them into Supabase next

#### What to SET:
**Location:** APIs & Services → Credentials → [Your OAuth Client] → Edit

**Set "Authorized redirect URIs":**
```
http://localhost:3000/auth/callback                          ← For local development
https://YOUR-SUPABASE-REF.supabase.co/auth/v1/callback      ← For production
https://your-app.vercel.app/auth/callback                    ← For production (after deploy)
```

**Set "Authorized JavaScript origins":**
```
http://localhost:3000                    ← For local development
https://your-app.vercel.app             ← For production (after deploy)
```

---

### 2️⃣ SUPABASE DASHBOARD
**URL:** https://supabase.com/dashboard

#### What to GET:
**Location:** Project Settings (⚙️) → API

You will COPY:
```
Project URL: https://abcdefghijk.supabase.co
Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5OTk5OTksImV4cCI6MjAxNTU3NTk5OX0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**💾 SAVE THESE** - You'll paste them into .env.local and Vercel

**Also Note Your Project Reference:**
From the URL: `https://supabase.com/dashboard/project/abcdefghijk`
The part `abcdefghijk` is your Project Reference ID
You need this for the Google Cloud Console redirect URI

#### What to SET:
**Location:** Authentication → Providers → Google

**Toggle ON:** "Enable Sign in with Google"

**Paste Here:**
```
Client ID (required): [Paste from Google Cloud Console]
Client Secret (required): [Paste from Google Cloud Console]
```

Click **SAVE**

---

### 3️⃣ YOUR PROJECT (.env.local file)
**Location:** In your project root directory

**File:** `.env.local` (create it by copying .env.example)

**What to SET:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where these come from:** Supabase Dashboard → Project Settings → API

---

### 4️⃣ VERCEL DASHBOARD
**URL:** https://vercel.com

**Location:** Your Project → Settings → Environment Variables

**What to SET:**

| Name | Value | Where it comes from |
|------|-------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abcdefghijk.supabase.co` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJI...` | Supabase Dashboard → Settings → API |

**Apply to:** Production, Preview, and Development (check all three)

---

## Quick Reference Table

| Credential | Where You GET It | Where You SET It |
|------------|------------------|------------------|
| **Client ID** | Google Cloud Console (when you create OAuth client) | Supabase Dashboard → Auth → Providers → Google |
| **Client Secret** | Google Cloud Console (when you create OAuth client) | Supabase Dashboard → Auth → Providers → Google |
| **Supabase URL** | Supabase Dashboard → Settings → API | .env.local file + Vercel environment variables |
| **Supabase Anon Key** | Supabase Dashboard → Settings → API | .env.local file + Vercel environment variables |
| **Redirect URI** | Supabase Dashboard (your project URL) | Google Cloud Console → Credentials → OAuth client |
| **Project Reference** | Supabase Dashboard URL | Google Cloud Console (for redirect URI) |

---

## The Flow

1. **Create OAuth in Google** → Get Client ID + Secret
2. **Give those to Supabase** → Enable Google auth
3. **Get URL + Key from Supabase** → Put in .env.local
4. **Tell Google where Supabase is** → Add redirect URI
5. **Deploy to Vercel** → Add same URL + Key as environment variables
6. **Tell Google where Vercel is** → Add Vercel URL to authorized origins

---

## What I CANNOT Do (You Must Do This)

❌ I cannot access your Google Cloud Console
❌ I cannot access your Supabase Dashboard
❌ I cannot get your Client ID and Secret
❌ I cannot create your .env.local file with real values
❌ I cannot deploy to your Vercel account

## What I CAN Do (Already Done)

✅ Created all the code and components
✅ Created comprehensive setup documentation
✅ Provided exact locations where to set everything
✅ Created the SQL for database setup
✅ Set up the entire authentication flow in the code

---

## Need Me to Wait for Your Credentials?

If you want, you can:

1. Follow the steps above to get your credentials
2. Give me the credentials, and I can:
   - Help verify they're correct
   - Help troubleshoot if something doesn't work
   - Create the .env.local file with the real values

Just let me know:
- "I have the credentials" - and share them
- "I'm stuck at step X" - and I'll help you through it
- "Can you walk me through step X again" - and I'll explain in more detail
