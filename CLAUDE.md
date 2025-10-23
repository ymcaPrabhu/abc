# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A simple task organizer web application built with Next.js 14 (App Router), Supabase, and Tailwind CSS. Users can create, complete, and delete tasks with real-time database updates.

## Tech Stack

- **Frontend Framework**: Next.js 14 with App Router
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

1. Copy `.env.example` to `.env.local`
2. Add Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. See `SUPABASE_SETUP.md` for detailed Supabase configuration

## Architecture

### Directory Structure

- `app/` - Next.js App Router pages and layouts
  - `page.tsx` - Main page with task management logic and state
  - `layout.tsx` - Root layout wrapper
  - `globals.css` - Global Tailwind styles
- `components/` - React components
  - `TaskForm.tsx` - Form for adding new tasks
  - `TaskList.tsx` - Display list of tasks with toggle/delete
- `lib/` - Utilities and configurations
  - `supabase.ts` - Supabase client initialization

### Database Schema

The Supabase database has a single `tasks` table:

```sql
tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

Row Level Security (RLS) is enabled with a permissive policy for development. For production with auth, add user-specific policies.

### Key Patterns

- **Client Components**: All interactive components use `"use client"` directive
- **State Management**: React useState for local state, Supabase for persistence
- **Data Fetching**: Direct Supabase client calls from components
- **Styling**: Tailwind utility classes with responsive design

## Deployment

See `DEPLOYMENT.md` for Vercel deployment instructions. Environment variables must be set in Vercel dashboard before deployment.
