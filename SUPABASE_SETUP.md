# Supabase Setup Guide
## Indian Budget Management System

Follow these steps to set up the complete database and authentication for the Indian Budget Management System.

---

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Configure:
   - **Name**: Indian Budget Management System
   - **Database Password**: (Save securely)
   - **Region**: Mumbai or Singapore (closest to India)
4. Click **"Create new project"** (takes 2-3 minutes)

---

## Step 2: Run Database Migrations

1. Open **SQL Editor** in Supabase dashboard
2. Click **"New Query"**
3. Copy entire contents of `supabase/migrations/001_initial_schema.sql`
4. Click **"Run"**
5. Create another query, copy `supabase/migrations/002_rls_policies.sql`
6. Click **"Run"**

✅ All tables, enums, and RLS policies are now created!

---

## Step 3: Setup Google OAuth

### 3.1 Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select project
3. Navigate to **"APIs & Services"** → **"OAuth consent screen"**
4. Select **"External"**, fill in app details
5. Go to **"Credentials"** → **"Create Credentials"** → **"OAuth client ID"**
6. Choose **"Web application"**
7. Add **Authorized redirect URI**:
   ```
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
   ```
   (Replace `YOUR-PROJECT-REF` from Supabase Settings → General → Reference ID)
8. Save **Client ID** and **Client Secret**

### 3.2 Configure in Supabase

1. In Supabase: **Authentication** → **Providers**
2. Enable **Google**
3. Enter Client ID and Secret
4. Click **"Save"**

---

## Step 4: Get API Credentials

1. In Supabase: **Settings** → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Step 5: Seed Sample Data (Recommended)

Run this SQL to create sample ministries and schemes:

```sql
-- Ministries
INSERT INTO ministries (name, code, minister_name) VALUES
('Ministry of Finance', 'FIN', 'Finance Minister'),
('Ministry of Education', 'EDU', 'Education Minister'),
('Ministry of Health', 'HEALTH', 'Health Minister');

-- Departments
INSERT INTO departments (name, code, ministry_id)
SELECT 'Department of Economic Affairs', 'DEA', id FROM ministries WHERE code = 'FIN';

-- Schemes
INSERT INTO schemes (name, code, ministry_id, scheme_type, description)
SELECT 'Samagra Shiksha', 'SS-2025', id, 'Centrally Sponsored', 'School education'
FROM ministries WHERE code = 'EDU';
```

---

## Step 6: First Login & Admin Setup

1. Run: `npm run dev`
2. Go to `http://localhost:3000`
3. **Sign in with Google**
4. In Supabase: **Table Editor** → **user_profiles**
5. Find your user, change `role` to **"Finance Ministry Admin"**
6. Refresh app - you now have full admin access!

---

## User Roles

| Role | Permissions |
|------|-------------|
| **Finance Ministry Admin** | Full system access, approves all budgets |
| **Budget Division Officer** | Cross-ministry view, analysis |
| **Ministry Secretary** | Manage ministry budgets and departments |
| **Department Head** | Manage department budgets and schemes |
| **Section Officer** | Create proposals, record expenditures |
| **Auditor** | Read-only access for compliance |

---

## Verification Checklist

- [ ] All tables exist in Table Editor
- [ ] RLS policies are active (check any table → Policies)
- [ ] Google OAuth works (can sign in)
- [ ] User profile auto-created
- [ ] Sample data loaded (see ministries in Table Editor)
- [ ] Admin role assigned

---

## Troubleshooting

**Google OAuth fails:**
- Verify redirect URI matches exactly
- Check Client ID/Secret are correct
- Ensure Google provider is enabled in Supabase

**Tables missing:**
- Re-run migration SQL in SQL Editor
- Check for errors in query results

**Can't see data:**
- Check RLS policies are enabled
- Verify you're authenticated
- Ensure correct role assignment

---

**Setup Complete!** Start using the Budget Management System.
