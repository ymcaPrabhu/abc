# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A comprehensive Budget Management System for the Government of India, built using the BMAD (Breakthrough Method for Agile AI-Driven Development) methodology. This system enables coordinating and developing India's budget through digital processes, supporting budget proposal creation, multi-level approval workflows, expenditure tracking, and real-time analytics. Built with Next.js 14, Supabase (PostgreSQL), and Google OAuth authentication.

**Current Status:** Foundation and core modules implemented. System is in active development following the PRD in `docs/PRD.md`.

## Tech Stack

- **Frontend Framework**: Next.js 14 with App Router
- **Authentication**: Supabase Auth with Google OAuth
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide React icons
- **Charts**: Recharts
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
5. Run database migrations in Supabase (see `supabase/migrations/`)
6. See `SUPABASE_SETUP.md` for detailed setup instructions

## Architecture

### Directory Structure

- `app/` - Next.js App Router pages and layouts
  - `page.tsx` - Landing page (redirects to dashboard or shows login)
  - `layout.tsx` - Root layout with AuthProvider wrapper
  - `auth/callback/` - OAuth callback route handler
  - `dashboard/` - Main application area (protected)
    - `page.tsx` - Dashboard home with KPIs and stats
    - `layout.tsx` - Dashboard layout with sidebar navigation
    - `admin/` - System administration (ministries, departments, users)
    - `schemes/` - Scheme management pages
    - `budgets/` - Budget proposal pages
    - `expenditures/` - Expenditure tracking (to be built)
    - `approvals/` - Approval workflow UI (to be built)
    - `reports/` - Reporting and analytics (to be built)
- `components/` - React components
  - `layout/` - Sidebar, DashboardHeader, Header
  - `auth/` - LoginPage, user menu components
  - `TaskList.tsx`, `TaskForm.tsx`, `Header.tsx` - Legacy task organizer components (to be removed)
- `contexts/` - React contexts
  - `AuthContext.tsx` - Authentication state and user profile management
- `lib/` - Utilities and configurations
  - `supabase.ts` - Supabase client initialization
  - `utils/` - Utility functions
    - `formatters.ts` - Currency (INR), date, financial year formatters
    - `authorization.ts` - Permission checking helpers
    - `cn.ts` - Class name utility (tailwind-merge)
- `types/` - TypeScript type definitions
  - `index.ts` - All types for budget system + legacy Task type
- `supabase/migrations/` - Database migration files
  - `001_initial_schema.sql` - Complete schema with all tables
  - `002_rls_policies.sql` - Row-Level Security policies
- `docs/` - BMAD methodology documentation
  - `PRD.md` - Product Requirements Document
  - `ARCHITECTURE.md` - System architecture and design
  - `DEVELOPMENT_STORIES.md` - Development stories breakdown

### Implementation Status

**Implemented:**
- ✅ Database schema (12 tables with RLS policies)
- ✅ Authentication with Google OAuth
- ✅ User profile management and roles
- ✅ Authorization utilities
- ✅ Currency and date formatters (Indian format)
- ✅ Dashboard layout with sidebar navigation
- ✅ Dashboard home page with KPIs
- ✅ Admin module structure
- ✅ Ministries management (list, create)
- ✅ Schemes list page
- ✅ Budget proposals list page

**In Progress / To Be Built:**
- ⏳ Ministries edit page
- ⏳ Departments management (full CRUD)
- ⏳ User management and role assignment UI
- ⏳ Schemes create/edit forms
- ⏳ Budget proposal creation form with line items
- ⏳ Budget proposal detail/view page
- ⏳ Approval workflow engine and UI
- ⏳ Budget allocation management
- ⏳ Expenditure recording and tracking
- ⏳ Dashboard charts and analytics
- ⏳ Reporting module with exports
- ⏳ Approvals page

### Database Schema

The complete schema is in `supabase/migrations/001_initial_schema.sql`. Key tables:

**User Management:**
- `user_profiles` - User info, roles, ministry/department assignments

**Organizational Structure:**
- `ministries` - Government ministries
- `departments` - Departments within ministries
- `schemes` - Government schemes/programs

**Budget Management:**
- `budget_proposals` - Budget requests with status tracking
- `budget_line_items` - Detailed line items for proposals
- `budget_allocations` - Sanctioned budgets with quarterly breakdowns

**Expenditure:**
- `expenditures` - Actual spending records
- `documents` - Supporting documents for various entities

**Workflow:**
- `approval_workflows` - Multi-stage approval tracking
- `approval_stages` - Individual approval stages

**Compliance:**
- `audit_logs` - Complete audit trail

**User Roles:**
1. **Finance Ministry Admin** - Full system access, final budget approvals, system administration
2. **Budget Division Officer** - Cross-ministry budget compilation and analysis
3. **Ministry Secretary** - Ministry-level budget management and approvals
4. **Department Head** - Department budget planning and scheme management
5. **Section Officer** (default) - Budget proposal creation, expenditure recording
6. **Auditor** - Read-only access for compliance and audit purposes

**Row Level Security (RLS):**
- All tables have RLS policies based on user role and organizational hierarchy
- Users can only see data within their scope (ministry/department)
- Admins and auditors have broader access
- See `supabase/migrations/002_rls_policies.sql` for details

### Key Patterns

- **BMAD Methodology**: Project developed using Breakthrough Method for Agile AI-Driven Development
  - Comprehensive PRD in `docs/PRD.md` (10-12 week implementation)
  - System architecture in `docs/ARCHITECTURE.md`
  - Development stories in `docs/DEVELOPMENT_STORIES.md` (40+ stories across 10 sprints)
- **Authentication Flow**: Google OAuth → Supabase Auth → Auto-create user profile with default role
- **Authorization**: Row-Level Security (RLS) policies + client-side permission checks
- **Multi-tier Hierarchy**: Ministry → Department → Scheme → Budget Proposal → Line Items
- **Approval Workflows**: Configurable multi-stage approval (Department → Ministry → Finance Ministry)
- **Budget Cycle**: Proposal → Review → Approval → Allocation → Expenditure → Monitoring
- **Financial Year Based**: All data organized by Indian financial year (April-March)
- **Currency Formatting**: Indian Rupee formatting in Lakhs (L) and Crores (Cr)
- **Client Components**: Interactive UI with `"use client"` directive
- **State Management**: React Context (AuthContext) for auth state
- **Data Fetching**: Supabase client with joins and RLS-filtered queries
- **Styling**: Tailwind CSS with utility classes

### Code Utilities

**Formatters (`lib/utils/formatters.ts`):**
- `formatINR(amount)` - Format currency (₹10.5 L, ₹125.5 Cr)
- `formatFullINR(amount)` - Full format with commas (₹1,25,50,000)
- `formatDate(date)` - Format dates
- `formatPercent(value)` - Format percentages
- `getCurrentFinancialYear()` - Get current FY (e.g., "2025-26")
- `generateProposalNumber(ministryCode, year, sequence)` - Generate proposal numbers

**Authorization (`lib/utils/authorization.ts`):**
- `hasRole(profile, roles)` - Check if user has role
- `isAdmin(profile)` - Check if user is admin
- `canManageMinistry(profile, ministryId)` - Ministry management permission
- `canManageDepartment(profile, departmentId, ministryId)` - Department management permission
- `canCreateBudgetProposal(profile)` - Budget creation permission
- `canApproveBudget(profile, level)` - Approval permission at different levels
- `canRecordExpenditure(profile)` - Expenditure recording permission
- `canViewAllData(profile)` - Check if user can view all data
- `getUserScope(profile)` - Get user's access scope

## Development Workflow

1. **For new features**: Refer to `docs/DEVELOPMENT_STORIES.md` for detailed requirements
2. **For database changes**: Create new migration files in `supabase/migrations/`
3. **For authorization**: Use utility functions in `lib/utils/authorization.ts`
4. **For formatting**: Use utility functions in `lib/utils/formatters.ts`
5. **For new pages**: Follow the existing pattern in `app/dashboard/`
6. **For components**: Create reusable components in `components/`

## Next Steps

According to the PRD and development stories:

1. Complete admin module (departments, users)
2. Build scheme management CRUD
3. Implement budget proposal creation with line items
4. Build approval workflow system
5. Create budget allocation module
6. Implement expenditure tracking
7. Build dashboard analytics with charts
8. Create reporting module with exports

See `docs/DEVELOPMENT_STORIES.md` for the complete 10-sprint breakdown.

## Deployment

See `DEPLOYMENT.md` for Vercel deployment instructions. Environment variables must be set in Vercel dashboard before deployment.

## Legacy Code

The codebase currently contains some legacy task organizer components (`TaskList.tsx`, `TaskForm.tsx`, `Header.tsx`). These can be removed or kept as reference. The Task type is still in `types/index.ts` for backward compatibility.
