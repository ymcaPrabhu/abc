# Quick Setup Guide - Google OAuth & Supabase

Follow these steps in order. This should take about 15 minutes total.

---

## STEP 1: Google Cloud Console Setup (5 minutes)

### 1.1 Create OAuth Credentials

**Go to:** https://console.cloud.google.com/

**Actions:**

1. **Select or Create Project**
   - Click the project dropdown at the top
   - Click "NEW PROJECT"
   - Name: `Task Organizer` (or any name)
   - Click "CREATE"
   - Wait a few seconds, then select the new project

2. **Configure OAuth Consent Screen**
   - In the left sidebar: Click "APIs & Services" → "OAuth consent screen"
   - Choose "External" (unless you have Google Workspace)
   - Click "CREATE"

   Fill in the form:
   - App name: `Task Organizer`
   - User support email: `pnarayan1@gmail.com`
   - Developer contact email: `pnarayan1@gmail.com`
   - Click "SAVE AND CONTINUE"

   On the Scopes page:
   - Click "SAVE AND CONTINUE" (no changes needed)

   On the Test users page:
   - Click "ADD USERS"
   - Add email addresses of team members who will use the app
   - Add: `pnarayan1@gmail.com` (and any other team members)
   - Click "SAVE AND CONTINUE"

   Review page:
   - Click "BACK TO DASHBOARD"

3. **Create OAuth Client ID**
   - In the left sidebar: Click "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" at the top
   - Select "OAuth client ID"

   Fill in the form:
   - Application type: "Web application"
   - Name: `Task Organizer Web Client`

   **Authorized JavaScript origins:**
   - Click "ADD URI"
   - Add: `http://localhost:3000` (for local testing)
   - Click "ADD URI" again
   - Add: `https://your-app-name.vercel.app` (you'll update this later with your real Vercel URL)

   **Authorized redirect URIs:**
   - Click "ADD URI"
   - Add: `http://localhost:3000/auth/callback` (for local testing)
   - Click "ADD URI" again
   - Add: `https://XXXXX.supabase.co/auth/v1/callback`
     ⚠️ IMPORTANT: You need to get the XXXXX part from Supabase (see Step 2.1 below)
     For now, just leave this blank or put a placeholder - you'll come back to add it

   - Click "CREATE"

4. **SAVE YOUR CREDENTIALS** ✅

   A popup will show your credentials:
   ```
   Client ID: xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
   Client Secret: GOCSPX-xxxxxxxxxxxxxxxxxxxxx
   ```

   **ACTION REQUIRED:**
   - Copy both of these and save them in a text file
   - You'll need them in Step 2.3 below

---

## STEP 2: Supabase Setup (8 minutes)

### 2.1 Get Your Supabase Project Reference

**Go to:** https://supabase.com/dashboard

1. Select your project (or create a new one if you haven't yet)
2. Look at the URL in your browser. It will look like:
   ```
   https://supabase.com/dashboard/project/abcdefghijklmnop
   ```
   The part after `/project/` is your **Project Reference ID**

3. **SAVE THIS** - you need it for: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

4. **GO BACK TO GOOGLE CLOUD CONSOLE:**
   - Go to "APIs & Services" → "Credentials"
   - Click on your "Task Organizer Web Client"
   - Under "Authorized redirect URIs", click "ADD URI"
   - Add: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
     (Replace [YOUR-PROJECT-REF] with the ID you just got)
   - Click "SAVE"

### 2.2 Get Your Supabase API Keys

**In Supabase Dashboard:**

1. Click the gear icon (⚙️) in the sidebar → "Project Settings"
2. Click "API" in the left menu
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long)

4. **SAVE THESE** - you need them for the .env.local file

### 2.3 Enable Google Authentication in Supabase

**In Supabase Dashboard:**

1. Click "Authentication" in the left sidebar
2. Click "Providers"
3. Scroll down and find "Google"
4. Click to expand it
5. Toggle "Enable Sign in with Google" to ON
6. Fill in:
   - **Client ID**: Paste the Client ID from Google Cloud Console (Step 1.4)
   - **Client Secret**: Paste the Client Secret from Google Cloud Console (Step 1.4)
7. Click "Save"

### 2.4 Create Database Tables

**In Supabase Dashboard:**

1. Click "SQL Editor" in the left sidebar
2. Click "New query"
3. **Copy the ENTIRE SQL from SUPABASE_SETUP.md** (it's the big SQL block in section "3. Create Database Tables and Policies")
4. Paste it into the SQL editor
5. Click "RUN" (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

---

## STEP 3: Configure Your Local Environment (2 minutes)

**In your project directory:**

1. Open terminal/command prompt in your project folder
2. Run:
   ```bash
   cp .env.example .env.local
   ```

3. Open `.env.local` in a text editor
4. Replace the values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   (Use the values from Step 2.2)

5. Save the file

---

## STEP 4: Test Locally

**In terminal:**

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser

You should see:
- A login page with "Sign in with Google" button
- Click it → Google OAuth popup
- Sign in with your Google account
- You should be redirected back to the app
- You should see the main dashboard with your user info in the header

✅ If you see this, everything is working!

---

## STEP 5: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

**In terminal:**

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
# Enter: pnarayan1@gmail.com
# Check your email for the verification link

# Deploy
vercel

# Answer the prompts:
# Set up and deploy? Y
# Which scope? (select your account)
# Link to existing project? N
# What's your project's name? task-organizer (or press Enter)
# In which directory is your code located? ./ (press Enter)
# Want to override the settings? N

# When it asks for environment variables:
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL and press Enter
# Select all environments (production, preview, development)

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your Supabase anon key and press Enter
# Select all environments (production, preview, development)

# Deploy to production
vercel --prod
```

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com
2. Sign in with pnarayan1@gmail.com
3. Click "Add New..." → "Project"
4. Import your git repository
5. Configure:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: ./
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
6. Click "Environment Variables"
7. Add:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: (paste your Supabase URL)
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: (paste your Supabase anon key)
8. Click "Deploy"

---

## STEP 6: Update Google Cloud Console with Production URL

After deployment, Vercel will give you a URL like:
`https://task-organizer-xyz123.vercel.app`

**Go back to Google Cloud Console:**

1. Go to "APIs & Services" → "Credentials"
2. Click on your "Task Organizer Web Client"
3. Under "Authorized JavaScript origins":
   - Click "ADD URI"
   - Add: `https://task-organizer-xyz123.vercel.app` (your real Vercel URL)
4. Under "Authorized redirect URIs":
   - Click "ADD URI"
   - Add: `https://task-organizer-xyz123.vercel.app/auth/callback`
5. Click "SAVE"

---

## CHECKLIST ✅

Use this to make sure you've done everything:

- [ ] Created Google Cloud project
- [ ] Configured OAuth consent screen
- [ ] Created OAuth Client ID and Secret
- [ ] Saved Client ID and Secret
- [ ] Got Supabase Project Reference ID
- [ ] Added Supabase callback URL to Google Cloud Console
- [ ] Got Supabase URL and anon key
- [ ] Enabled Google auth in Supabase
- [ ] Added Client ID and Secret to Supabase
- [ ] Ran SQL to create database tables
- [ ] Created .env.local file
- [ ] Added Supabase credentials to .env.local
- [ ] Tested locally (npm run dev)
- [ ] Deployed to Vercel
- [ ] Added environment variables to Vercel
- [ ] Updated Google Cloud Console with Vercel URL

---

## Troubleshooting

**"Redirect URI mismatch" error:**
- Make sure the redirect URI in Google Cloud Console exactly matches:
  `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

**Can't sign in:**
- Check that Google auth is enabled in Supabase
- Check that Client ID and Secret are correct in Supabase
- Check that your email is added to test users in Google Cloud Console

**Database errors:**
- Make sure you ran the entire SQL script from SUPABASE_SETUP.md
- Check for any SQL errors in the Supabase SQL Editor

**Need help?**
- All detailed instructions are in SUPABASE_SETUP.md
- Check the error messages - they usually tell you what's wrong
