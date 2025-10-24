# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A comprehensive Budget Management System for the Government of India, built using the BMAD (Breakthrough Method for Agile AI-Driven Development) methodology. This system enables coordinating and developing India's budget through digital processes, supporting budget proposal creation, multi-level approval workflows, expenditure tracking, and real-time analytics. Built with Next.js 14, Supabase (PostgreSQL), and Google OAuth authentication.

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
  - `page.tsx` - Main landing/login page or dashboard router
  - `layout.tsx` - Root layout with AuthProvider wrapper
  - `auth/callback/` - OAuth callback route handler
  - `dashboard/` - Main dashboard and budget management pages
  - `budgets/` - Budget proposal pages
  - `schemes/` - Scheme management pages
  - `expenditures/` - Expenditure tracking pages
  - `reports/` - Reporting and analytics pages
  - `admin/` - System administration pages
  - `globals.css` - Global Tailwind styles
- `components/` - React components
  - `auth/` - Login, user menu, protected routes
  - `layout/` - Header, sidebar, navigation
  - `dashboard/` - Dashboard widgets, charts, stats
  - `budgets/` - Budget forms, lists, approval UI
  - `schemes/` - Scheme management components
  - `expenditures/` - Expenditure forms and tracking
  - `reports/` - Report builders, export functionality
  - `common/` - Reusable UI components
- `contexts/` - React contexts
  - `AuthContext.tsx` - Authentication state and user profile
- `lib/` - Utilities and configurations
  - `supabase/` - Supabase client initialization
  - `utils/` - Utility functions (formatters, authorization, etc.)
- `types/` - TypeScript type definitions
  - `index.ts` - All types for budget system
- `supabase/migrations/` - Database migration files
- `docs/` - Project documentation (PRD, Architecture, Development Stories)

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

**User Roles:**
1. **Finance Ministry Admin** - Full system access, final budget approvals, system administration
2. **Budget Division Officer** - Cross-ministry budget compilation and analysis
3. **Ministry Secretary** - Ministry-level budget management and approvals
4. **Department Head** - Department budget planning and scheme management
5. **Section Officer** (default) - Budget proposal creation, expenditure recording
6. **Auditor** - Read-only access for compliance and audit purposes

**Core Tables:**
- `ministries` - Government ministries
- `departments` - Departments within ministries
- `schemes` - Government schemes/programs
- `budget_proposals` - Budget requests with line items
- `budget_allocations` - Sanctioned budgets with quarterly allocation
- `expenditures` - Actual spending records
- `approval_workflows` - Multi-stage approval process
- `audit_logs` - Complete audit trail

### Key Patterns

- **BMAD Methodology**: Project developed using Breakthrough Method for Agile AI-Driven Development
  - Comprehensive PRD in `docs/PRD.md`
  - System architecture in `docs/ARCHITECTURE.md`
  - Development stories in `docs/DEVELOPMENT_STORIES.md`
- **Authentication Flow**: Google OAuth → Supabase Auth → Auto-create user profile with default role
- **Authorization**: Row-Level Security (RLS) policies based on user role and organizational hierarchy
- **Multi-tier Hierarchy**: Ministry → Department → Scheme → Budget Proposal → Line Items
- **Approval Workflows**: Configurable multi-stage approval process (Department → Ministry → Finance Ministry)
- **Budget Cycle**: Proposal → Review → Approval → Allocation → Expenditure → Monitoring
- **Financial Year Based**: All data organized by Indian financial year (April-March)
- **Real-time Analytics**: Dashboard with budget utilization, expenditure trends, variance analysis
- **Currency Formatting**: Indian Rupee formatting in Lakhs and Crores
- **Audit Trail**: Complete audit logging for compliance and transparency
- **Client Components**: Interactive UI components with `"use client"` directive
- **State Management**: React Context (AuthContext) for auth, Zustand for complex state
- **Data Fetching**: Supabase client with joins and RLS-filtered queries
- **Styling**: Tailwind CSS with utility classes and responsive design

## Deployment

See `DEPLOYMENT.md` for Vercel deployment instructions. Environment variables must be set in Vercel dashboard before deployment.
