# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A collaborative team task management application built with Next.js 14, Supabase, and Google OAuth. Team members can sign in with Google, create tasks, and view all team tasks on a shared dashboard. The app supports role-based access control with four user roles.

## Tech Stack

- **Frontend Framework**: Next.js 14 with App Router
- **Authentication**: Supabase Auth with Google OAuth
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## Environment Setup

1. Set up Google OAuth credentials in Google Cloud Console
2. Copy `.env.example` to `.env.local`
3. Add Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Configure Google OAuth in Supabase dashboard
5. See `SUPABASE_SETUP.md` for detailed setup instructions

## Architecture

### Directory Structure

- `app/` - Next.js App Router pages and layouts
  - `page.tsx` - Main page with authentication check and team dashboard
  - `layout.tsx` - Root layout with AuthProvider wrapper
  - `auth/callback/` - OAuth callback route handler
  - `globals.css` - Global Tailwind styles
- `components/` - React components
  - `TaskForm.tsx` - Form for adding new tasks
  - `TaskList.tsx` - Team task list showing all tasks with user info
  - `LoginPage.tsx` - Google OAuth login interface
  - `Header.tsx` - Navigation header with user info and logout
  - `Providers.tsx` - Client-side provider wrapper
- `contexts/` - React contexts
  - `AuthContext.tsx` - Authentication state and methods
- `lib/` - Utilities and configurations
  - `supabase.ts` - Supabase client initialization
- `types/` - TypeScript type definitions
  - `index.ts` - Shared types (Task, UserProfile, UserRole)

### Database Schema

**user_profiles** - User information and roles
```sql
user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'Section Officer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**tasks** - Task data with user ownership
```sql
tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Row Level Security (RLS) Policies:**
- All authenticated users can view all tasks (team dashboard)
- Users can only create tasks assigned to themselves
- Users can only update/delete their own tasks
- Users can read their own profile

**User Roles:** Assistive, Section Officer (default), Under Secretary, Professional Creator

### Key Patterns

- **Authentication Flow**: Google OAuth → Supabase Auth → Auto-create user profile
- **Client Components**: All interactive components use `"use client"` directive
- **State Management**: React Context (AuthContext) for auth, useState for local state
- **Data Fetching**: Supabase client calls with joins to fetch user profiles
- **Authorization**: RLS policies enforce task ownership, UI conditionally shows actions
- **Task Ownership**: Each task has user_id, only owners can toggle/delete
- **Team Dashboard**: All authenticated users see all tasks with creator info
- **Styling**: Tailwind utility classes with responsive design

## Deployment

See `DEPLOYMENT.md` for Vercel deployment instructions. Environment variables must be set in Vercel dashboard before deployment.
