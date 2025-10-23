# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in or create an account
2. Click "New Project"
3. Fill in your project details:
   - Name: task-organizer (or any name you prefer)
   - Database Password: (save this securely)
   - Region: Choose closest to your users
4. Click "Create new project"

## 2. Create the Tasks Table

Once your project is created:

1. Go to the "SQL Editor" in your Supabase dashboard
2. Click "New query"
3. Copy and paste the following SQL:

```sql
-- Create the tasks table
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
-- (In production, you'd want to add authentication and user-specific policies)
CREATE POLICY "Allow all operations for tasks" ON tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

4. Click "Run" to execute the SQL

## 3. Get Your API Keys

1. Go to "Project Settings" (gear icon in sidebar)
2. Click on "API" in the settings menu
3. You'll see:
   - **Project URL** - This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key - This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Configure Local Environment

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 5. Test Locally

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your task organizer!

## Note on Security

The current setup uses a permissive Row Level Security policy that allows all operations. For a production app with user authentication, you should:

1. Implement Supabase Auth
2. Add a `user_id` column to the tasks table
3. Update RLS policies to restrict users to only their own tasks
