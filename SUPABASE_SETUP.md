# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in or create an account
2. Click "New Project"
3. Fill in your project details:
   - Name: task-organizer (or any name you prefer)
   - Database Password: (save this securely)
   - Region: Choose closest to your users
4. Click "Create new project"

## 2. Enable Google Authentication

1. Go to "Authentication" in your Supabase dashboard
2. Click on "Providers"
3. Find "Google" in the list and click to enable it
4. You'll need to provide:
   - **Client ID** - From Google Cloud Console
   - **Client Secret** - From Google Cloud Console
5. Click "Save"

**Note**: See the "Google OAuth Setup" section below for instructions on getting your Client ID and Secret.

## 3. Create Database Tables and Policies

Once your project is created:

1. Go to the "SQL Editor" in your Supabase dashboard
2. Click "New query"
3. Copy and paste the following SQL:

```sql
-- Create custom user profiles table with roles
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'Section Officer' CHECK (role IN ('Assistive', 'Section Officer', 'Under Secretary', 'Professional Creator')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create the tasks table with user ownership
CREATE TABLE public.tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view all tasks (team dashboard)
CREATE POLICY "Authenticated users can view all tasks" ON public.tasks
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can create tasks
CREATE POLICY "Authenticated users can create tasks" ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tasks
CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own tasks
CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'Section Officer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tasks updated_at
CREATE TRIGGER on_task_updated
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for user_profiles updated_at
CREATE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

4. Click "Run" to execute the SQL

## 4. Get Your API Keys

1. Go to "Project Settings" (gear icon in sidebar)
2. Click on "API" in the settings menu
3. You'll see:
   - **Project URL** - This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key - This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 5. Configure Local Environment

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 6. Test Locally

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your task organizer!

---

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Click on the project name at the top

### Step 2: Configure OAuth Consent Screen

1. In the sidebar, go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type (unless you have Google Workspace)
3. Click "Create"
4. Fill in the required information:
   - **App name**: Task Organizer
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click "Save and Continue"
6. On the "Scopes" page, click "Save and Continue"
7. On the "Test users" page, add your team members' email addresses
8. Click "Save and Continue"

### Step 3: Create OAuth Credentials

1. In the sidebar, go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Fill in the details:
   - **Name**: Task Organizer Web Client
   - **Authorized JavaScript origins**:
     - For local: `http://localhost:3000`
     - For production: Your Vercel domain (e.g., `https://your-app.vercel.app`)
   - **Authorized redirect URIs**:
     - `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
     - Replace `[YOUR-PROJECT-REF]` with your Supabase project reference (found in your Supabase project URL)
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

### Step 4: Add Credentials to Supabase

1. Go back to your Supabase dashboard
2. Navigate to "Authentication" → "Providers"
3. Find "Google" and enable it
4. Paste your **Client ID** and **Client Secret**
5. Click "Save"

---

## User Roles

The application supports four roles:

1. **Assistive**: Basic access, can create and manage own tasks
2. **Section Officer**: Standard access (default role for new users)
3. **Under Secretary**: Can view all team tasks
4. **Professional Creator**: Advanced creator role

By default, new users are assigned the "Section Officer" role. You can update user roles manually in the Supabase dashboard:
1. Go to "Table Editor" → "user_profiles"
2. Find the user and edit their role

---

## Security Notes

- All tasks are visible to all authenticated team members (team dashboard)
- Users can only create, update, and delete their own tasks
- Row Level Security (RLS) is enabled on all tables
- Authentication is required to access the application
