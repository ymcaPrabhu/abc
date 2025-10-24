# System Architecture Document
## Indian Budget Management System

**Version:** 1.0
**Date:** October 24, 2025
**Prepared by:** BMAD Method - Architect Agent

---

## 1. Architecture Overview

### 1.1 Architecture Style
The Indian Budget Management System follows a **modern three-tier architecture** with:
- **Presentation Layer:** Next.js 14 with React Server Components and Client Components
- **Application Layer:** Next.js API Routes + Supabase Edge Functions
- **Data Layer:** Supabase (PostgreSQL) with Row-Level Security

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Browser   │  │   Mobile   │  │   Tablet   │            │
│  │  (Desktop) │  │  Browser   │  │  Browser   │            │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘            │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │ HTTPS
┌──────────────────────────┼──────────────────────────────────┐
│                  PRESENTATION LAYER (Next.js 14)             │
│  ┌────────────────────────┴───────────────────────┐         │
│  │         Vercel Edge Network (CDN)              │         │
│  └────────────────────┬───────────────────────────┘         │
│  ┌────────────────────┴───────────────────────────┐         │
│  │  Next.js App Router (React Server Components)  │         │
│  ├─────────────────────────────────────────────────┤         │
│  │  Pages & Layouts:                               │         │
│  │  • /dashboard - Main dashboard                  │         │
│  │  • /budgets - Budget management                 │         │
│  │  • /schemes - Scheme management                 │         │
│  │  • /expenditure - Expenditure tracking          │         │
│  │  • /reports - Report generation                 │         │
│  │  • /admin - System administration               │         │
│  └─────────────────────────────────────────────────┘         │
│  ┌─────────────────────────────────────────────────┐         │
│  │  Client Components (Interactive):               │         │
│  │  • Forms, Tables, Charts, Modals                │         │
│  │  • State Management (React Context + Zustand)   │         │
│  └────────────────────┬───────────────────────────┘         │
└─────────────────────────┼──────────────────────────────────┘
                          │
┌─────────────────────────┼──────────────────────────────────┐
│              APPLICATION LAYER                               │
│  ┌────────────────────────────────────────────────┐         │
│  │  Next.js API Routes (/app/api/*)               │         │
│  │  • /api/budgets - Budget CRUD operations       │         │
│  │  • /api/schemes - Scheme management            │         │
│  │  • /api/expenditure - Expenditure tracking     │         │
│  │  • /api/approvals - Workflow management        │         │
│  │  • /api/reports - Report generation            │         │
│  └────────────────────┬───────────────────────────┘         │
│  ┌────────────────────┴───────────────────────────┐         │
│  │  Business Logic Layer:                          │         │
│  │  • Validation & Authorization                   │         │
│  │  • Workflow Engine                              │         │
│  │  • Calculation Engine                           │         │
│  │  • Report Generator                             │         │
│  └────────────────────┬───────────────────────────┘         │
└─────────────────────────┼──────────────────────────────────┘
                          │
┌─────────────────────────┼──────────────────────────────────┐
│                    DATA LAYER (Supabase)                     │
│  ┌────────────────────────────────────────────────┐         │
│  │  Supabase Client (TypeScript SDK)              │         │
│  └────────────────────┬───────────────────────────┘         │
│  ┌────────────────────┴───────────────────────────┐         │
│  │  PostgreSQL Database                            │         │
│  │  • Row-Level Security (RLS)                     │         │
│  │  • Database Functions & Triggers                │         │
│  │  • Views for complex queries                    │         │
│  └─────────────────────────────────────────────────┘         │
│  ┌─────────────────────────────────────────────────┐         │
│  │  Supabase Auth                                   │         │
│  │  • Google OAuth 2.0                              │         │
│  │  • Session Management                            │         │
│  │  • JWT Token Validation                          │         │
│  └─────────────────────────────────────────────────┘         │
│  ┌─────────────────────────────────────────────────┐         │
│  │  Supabase Storage                                │         │
│  │  • Document storage (PDFs, Excel)                │         │
│  │  • Budget memoranda attachments                  │         │
│  └─────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema Design

### 2.1 Entity Relationship Diagram

```
┌─────────────────┐
│  auth.users     │  (Supabase managed)
│─────────────────│
│ id (uuid) PK    │
│ email           │
│ created_at      │
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────────────┐
│  user_profiles          │
│─────────────────────────│
│ id (uuid) PK FK         │◄────────┐
│ email (text)            │         │
│ full_name (text)        │         │
│ role (user_role_enum)   │         │
│ ministry_id (uuid) FK   │─────┐   │
│ department_id (uuid) FK │──┐  │   │
│ is_active (boolean)     │  │  │   │
│ created_at (timestamptz)│  │  │   │
│ updated_at (timestamptz)│  │  │   │
└─────────────────────────┘  │  │   │
                             │  │   │
         ┌───────────────────┘  │   │
         │                      │   │
         ▼                      │   │
┌─────────────────────────┐    │   │
│  departments            │    │   │
│─────────────────────────│    │   │
│ id (uuid) PK            │    │   │
│ name (text)             │    │   │
│ code (text) UNIQUE      │    │   │
│ ministry_id (uuid) FK   │────┤   │
│ description (text)      │    │   │
│ is_active (boolean)     │    │   │
│ created_at (timestamptz)│    │   │
│ updated_at (timestamptz)│    │   │
│ created_by (uuid) FK    │────┘   │
└─────────────────────────┘        │
                                   │
         ┌─────────────────────────┘
         ▼
┌─────────────────────────┐
│  ministries             │
│─────────────────────────│
│ id (uuid) PK            │
│ name (text)             │
│ code (text) UNIQUE      │
│ minister_name (text)    │
│ secretary_name (text)   │
│ is_active (boolean)     │
│ created_at (timestamptz)│
│ updated_at (timestamptz)│
│ created_by (uuid) FK    │────┐
└────────┬────────────────┘    │
         │                     │
         │ 1:N                 │
         ▼                     │
┌─────────────────────────┐    │
│  schemes                │    │
│─────────────────────────│    │
│ id (uuid) PK            │    │
│ name (text)             │    │
│ code (text) UNIQUE      │    │
│ ministry_id (uuid) FK   │────┤
│ department_id (uuid) FK │    │
│ scheme_type (enum)      │    │
│ description (text)      │    │
│ objectives (text)       │    │
│ start_date (date)       │    │
│ end_date (date)         │    │
│ is_active (boolean)     │    │
│ created_at (timestamptz)│    │
│ updated_at (timestamptz)│    │
│ created_by (uuid) FK    │────┤
└────────┬────────────────┘    │
         │                     │
         │ 1:N                 │
         ▼                     │
┌─────────────────────────┐    │
│  budget_proposals       │    │
│─────────────────────────│    │
│ id (uuid) PK            │    │
│ proposal_number (text)  │    │
│ financial_year (text)   │    │
│ scheme_id (uuid) FK     │────┤
│ ministry_id (uuid) FK   │    │
│ department_id (uuid) FK │    │
│ proposal_type (enum)    │    │ (Budget Estimate/Revised Estimate/Supplementary)
│ status (enum)           │    │ (Draft/Submitted/Under Review/Approved/Rejected)
│ total_amount (numeric)  │    │
│ revenue_amount (numeric)│    │
│ capital_amount (numeric)│    │
│ justification (text)    │    │
│ submitted_at (timestamptz)   │
│ approved_at (timestamptz)    │
│ approved_by (uuid) FK   │────┤
│ created_at (timestamptz)│    │
│ updated_at (timestamptz)│    │
│ created_by (uuid) FK    │────┤
└────────┬────────────────┘    │
         │                     │
         │ 1:N                 │
         ▼                     │
┌─────────────────────────┐    │
│  budget_line_items      │    │
│─────────────────────────│    │
│ id (uuid) PK            │    │
│ proposal_id (uuid) FK   │────┤
│ head_of_account (text)  │    │
│ description (text)      │    │
│ amount (numeric)        │    │
│ budget_type (enum)      │    │ (Revenue/Capital)
│ created_at (timestamptz)│    │
└─────────────────────────┘    │
                               │
┌─────────────────────────┐    │
│  budget_allocations     │    │
│─────────────────────────│    │
│ id (uuid) PK            │    │
│ proposal_id (uuid) FK   │────┤
│ scheme_id (uuid) FK     │    │
│ financial_year (text)   │    │
│ sanctioned_amount (numeric)  │
│ q1_allocation (numeric) │    │
│ q2_allocation (numeric) │    │
│ q3_allocation (numeric) │    │
│ q4_allocation (numeric) │    │
│ status (enum)           │    │
│ sanctioned_at (timestamptz)  │
│ sanctioned_by (uuid) FK │────┤
│ created_at (timestamptz)│    │
│ updated_at (timestamptz)│    │
└────────┬────────────────┘    │
         │                     │
         │ 1:N                 │
         ▼                     │
┌─────────────────────────┐    │
│  expenditures           │    │
│─────────────────────────│    │
│ id (uuid) PK            │    │
│ allocation_id (uuid) FK │────┤
│ scheme_id (uuid) FK     │    │
│ financial_year (text)   │    │
│ month (integer)         │    │
│ amount (numeric)        │    │
│ expenditure_type (enum) │    │
│ description (text)      │    │
│ transaction_date (date) │    │
│ voucher_number (text)   │    │
│ approved_by (uuid) FK   │────┤
│ created_at (timestamptz)│    │
│ created_by (uuid) FK    │────┤
└─────────────────────────┘    │
                               │
┌─────────────────────────┐    │
│  approval_workflows     │    │
│─────────────────────────│    │
│ id (uuid) PK            │    │
│ entity_type (enum)      │    │ (Budget/Expenditure/Reallocation)
│ entity_id (uuid)        │    │
│ current_stage (integer) │    │
│ total_stages (integer)  │    │
│ status (enum)           │    │
│ submitted_by (uuid) FK  │────┤
│ submitted_at (timestamptz)   │
│ completed_at (timestamptz)   │
│ created_at (timestamptz)│    │
└────────┬────────────────┘    │
         │                     │
         │ 1:N                 │
         ▼                     │
┌─────────────────────────┐    │
│  approval_stages        │    │
│─────────────────────────│    │
│ id (uuid) PK            │    │
│ workflow_id (uuid) FK   │────┤
│ stage_number (integer)  │    │
│ stage_name (text)       │    │
│ approver_role (enum)    │    │
│ approver_id (uuid) FK   │────┤
│ status (enum)           │    │ (Pending/Approved/Rejected/Delegated)
│ comments (text)         │    │
│ action_date (timestamptz)    │
│ created_at (timestamptz)│    │
└─────────────────────────┘    │
                               │
┌─────────────────────────┐    │
│  documents              │    │
│─────────────────────────│    │
│ id (uuid) PK            │    │
│ entity_type (enum)      │    │
│ entity_id (uuid)        │    │
│ document_name (text)    │    │
│ document_type (text)    │    │
│ file_path (text)        │    │
│ file_size (bigint)      │    │
│ uploaded_by (uuid) FK   │────┤
│ uploaded_at (timestamptz)    │
└─────────────────────────┘    │
                               │
┌─────────────────────────┐    │
│  audit_logs             │    │
│─────────────────────────│    │
│ id (uuid) PK            │    │
│ table_name (text)       │    │
│ record_id (uuid)        │    │
│ action (enum)           │    │ (INSERT/UPDATE/DELETE)
│ old_data (jsonb)        │    │
│ new_data (jsonb)        │    │
│ user_id (uuid) FK       │────┘
│ ip_address (inet)       │
│ user_agent (text)       │
│ created_at (timestamptz)│
└─────────────────────────┘
```

### 2.2 Enums and Types

```sql
-- User Roles
CREATE TYPE user_role_enum AS ENUM (
  'Finance Ministry Admin',
  'Budget Division Officer',
  'Ministry Secretary',
  'Department Head',
  'Section Officer',
  'Auditor'
);

-- Scheme Types
CREATE TYPE scheme_type_enum AS ENUM (
  'Central Sector',
  'Centrally Sponsored',
  'Core Scheme',
  'Sub Scheme'
);

-- Proposal Types
CREATE TYPE proposal_type_enum AS ENUM (
  'Budget Estimate',
  'Revised Estimate',
  'Supplementary Grant'
);

-- Budget Types
CREATE TYPE budget_type_enum AS ENUM (
  'Revenue',
  'Capital'
);

-- Status Enums
CREATE TYPE proposal_status_enum AS ENUM (
  'Draft',
  'Submitted',
  'Under Review',
  'Approved',
  'Rejected',
  'Revision Requested'
);

CREATE TYPE allocation_status_enum AS ENUM (
  'Active',
  'Frozen',
  'Exhausted'
);

CREATE TYPE approval_status_enum AS ENUM (
  'Pending',
  'Approved',
  'Rejected',
  'Delegated'
);

-- Entity Types for polymorphic associations
CREATE TYPE entity_type_enum AS ENUM (
  'Budget Proposal',
  'Expenditure',
  'Reallocation',
  'Scheme'
);

-- Audit Action Types
CREATE TYPE audit_action_enum AS ENUM (
  'INSERT',
  'UPDATE',
  'DELETE'
);
```

---

## 3. Security Architecture

### 3.1 Authentication Flow

```
User → Google OAuth → Supabase Auth → JWT Token → Application
                                          ↓
                                    Auto-create user_profile
                                          ↓
                                    Assign default role
```

### 3.2 Row-Level Security (RLS) Policies

**Principle:** Users can only access data within their authorization scope.

#### user_profiles
- Users can read their own profile
- Finance Ministry Admin can read all profiles
- Only admins can update roles

#### ministries
- All authenticated users can read all ministries
- Only Finance Ministry Admin can create/update/delete

#### departments
- All authenticated users can read all departments
- Ministry Secretaries can create/update departments in their ministry
- Finance Ministry Admin has full access

#### schemes
- All authenticated users can read all schemes
- Department Heads can create/update schemes in their department
- Ministry Secretaries can manage all schemes in their ministry

#### budget_proposals
- Users can read proposals in their ministry/department (based on role)
- Users can create proposals for their assigned schemes
- Users can only update their own draft proposals
- Approvers can update status during workflow

#### budget_allocations
- All authenticated users can read allocations
- Only Finance Ministry Admin can create/update allocations

#### expenditures
- Users can read expenditures for their ministry/department
- Section Officers can create expenditures for their schemes
- Department Heads can approve expenditures

#### audit_logs
- Read-only for all users
- Auditors have full read access across all logs

### 3.3 Authorization Matrix

| Role | Ministries | Departments | Schemes | Budgets | Allocations | Expenditures |
|------|-----------|-------------|---------|---------|-------------|--------------|
| Finance Ministry Admin | Full | Full | Full | Full | Full | Full |
| Budget Division Officer | Read | Read | Read | Read/Update | Read | Read |
| Ministry Secretary | Read | Full (own) | Full (own) | Full (own) | Read | Read (own) |
| Department Head | Read | Read (own) | Full (own) | Full (own) | Read | Full (own) |
| Section Officer | Read | Read | Read (assigned) | Create (own) | Read | Create (own) |
| Auditor | Read | Read | Read | Read | Read | Read |

---

## 4. Component Architecture

### 4.1 Frontend Component Structure

```
app/
├── layout.tsx                 # Root layout with providers
├── page.tsx                   # Landing/Login page
├── dashboard/
│   ├── layout.tsx             # Dashboard layout with navigation
│   └── page.tsx               # Main dashboard
├── budgets/
│   ├── page.tsx               # Budget proposals list
│   ├── new/
│   │   └── page.tsx           # Create new budget proposal
│   ├── [id]/
│   │   ├── page.tsx           # View budget proposal
│   │   └── edit/
│   │       └── page.tsx       # Edit budget proposal
├── schemes/
│   ├── page.tsx               # Schemes list
│   ├── new/
│   │   └── page.tsx           # Create new scheme
│   └── [id]/
│       └── page.tsx           # View/edit scheme
├── expenditures/
│   ├── page.tsx               # Expenditure tracking
│   └── new/
│       └── page.tsx           # Record new expenditure
├── approvals/
│   ├── page.tsx               # Pending approvals
│   └── [id]/
│       └── page.tsx           # Approval detail
├── reports/
│   ├── page.tsx               # Reports dashboard
│   ├── budget-statement/
│   ├── expenditure-summary/
│   ├── variance-analysis/
│   └── audit-trail/
├── admin/
│   ├── users/
│   ├── ministries/
│   ├── departments/
│   └── settings/
└── api/
    ├── budgets/
    ├── schemes/
    ├── expenditures/
    ├── approvals/
    └── reports/

components/
├── auth/
│   ├── LoginButton.tsx
│   ├── UserMenu.tsx
│   └── ProtectedRoute.tsx
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
├── dashboard/
│   ├── StatsCard.tsx
│   ├── BudgetUtilizationChart.tsx
│   ├── ExpenditureTrendChart.tsx
│   └── RecentActivityFeed.tsx
├── budgets/
│   ├── BudgetProposalForm.tsx
│   ├── BudgetLineItemsTable.tsx
│   ├── BudgetStatusBadge.tsx
│   └── BudgetComparisonChart.tsx
├── schemes/
│   ├── SchemeForm.tsx
│   ├── SchemeCard.tsx
│   └── SchemeList.tsx
├── expenditures/
│   ├── ExpenditureForm.tsx
│   ├── ExpenditureTable.tsx
│   └── VarianceIndicator.tsx
├── approvals/
│   ├── ApprovalWorkflow.tsx
│   ├── ApprovalStageCard.tsx
│   └── ApprovalComments.tsx
├── reports/
│   ├── ReportBuilder.tsx
│   ├── ReportPreview.tsx
│   └── ExportButtons.tsx
├── admin/
│   ├── UserManagement.tsx
│   ├── RoleAssignment.tsx
│   └── SystemSettings.tsx
└── common/
    ├── DataTable.tsx
    ├── SearchFilter.tsx
    ├── DateRangePicker.tsx
    ├── FileUpload.tsx
    ├── Modal.tsx
    ├── Tabs.tsx
    └── LoadingSpinner.tsx

lib/
├── supabase/
│   ├── client.ts              # Supabase client
│   ├── server.ts              # Server-side Supabase client
│   └── middleware.ts          # Auth middleware
├── utils/
│   ├── formatters.ts          # Number, date, currency formatters
│   ├── validators.ts          # Form validation helpers
│   └── calculations.ts        # Budget calculation utilities
├── hooks/
│   ├── useAuth.ts
│   ├── useBudgets.ts
│   ├── useSchemes.ts
│   └── useExpenditures.ts
└── types/
    └── index.ts               # TypeScript type definitions

contexts/
├── AuthContext.tsx
└── ThemeContext.tsx
```

---

## 5. API Design

### 5.1 RESTful API Endpoints

#### Authentication
- `POST /api/auth/login` - Initiate Google OAuth
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/session` - Get current session

#### Budgets
- `GET /api/budgets` - List budget proposals (with filters)
- `GET /api/budgets/:id` - Get budget proposal details
- `POST /api/budgets` - Create budget proposal
- `PUT /api/budgets/:id` - Update budget proposal
- `DELETE /api/budgets/:id` - Delete budget proposal
- `POST /api/budgets/:id/submit` - Submit for approval
- `POST /api/budgets/:id/approve` - Approve budget
- `POST /api/budgets/:id/reject` - Reject budget

#### Schemes
- `GET /api/schemes` - List schemes
- `GET /api/schemes/:id` - Get scheme details
- `POST /api/schemes` - Create scheme
- `PUT /api/schemes/:id` - Update scheme
- `DELETE /api/schemes/:id` - Delete scheme

#### Expenditures
- `GET /api/expenditures` - List expenditures
- `GET /api/expenditures/:id` - Get expenditure details
- `POST /api/expenditures` - Record expenditure
- `PUT /api/expenditures/:id` - Update expenditure
- `POST /api/expenditures/:id/approve` - Approve expenditure

#### Approvals
- `GET /api/approvals/pending` - Get pending approvals
- `POST /api/approvals/:id/action` - Take action on approval

#### Reports
- `POST /api/reports/budget-statement` - Generate budget statement
- `POST /api/reports/expenditure-summary` - Generate expenditure summary
- `POST /api/reports/variance-analysis` - Generate variance report
- `GET /api/reports/export/:reportId` - Export report

#### Admin
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/ministries` - List ministries
- `POST /api/admin/ministries` - Create ministry
- `GET /api/admin/departments` - List departments
- `POST /api/admin/departments` - Create department

---

## 6. State Management Strategy

### 6.1 Global State (React Context)
- **AuthContext:** User session, profile, role, permissions
- **ThemeContext:** UI theme preferences

### 6.2 Server State (Supabase Real-time)
- Budget proposals
- Schemes
- Expenditures
- Approval workflows

### 6.3 Local State (useState)
- Form inputs
- Modal visibility
- Filters and sorting

### 6.4 Complex State (Zustand - if needed)
- Multi-step form wizard state
- Advanced filter combinations
- Report builder state

---

## 7. Performance Optimization

### 7.1 Database Optimization
- **Indexes:** On foreign keys, frequently queried columns (ministry_id, department_id, financial_year, status)
- **Materialized Views:** For complex analytical queries
- **Database Functions:** For calculations (budget utilization %, variance)
- **Partitioning:** Partition large tables by financial_year

### 7.2 Frontend Optimization
- **Code Splitting:** Dynamic imports for routes
- **Image Optimization:** Next.js Image component
- **Lazy Loading:** React.lazy for heavy components (charts, reports)
- **Memoization:** useMemo for expensive calculations, React.memo for components
- **Pagination:** Virtual scrolling for large lists

### 7.3 Caching Strategy
- **Edge Caching:** Static pages cached at CDN level
- **API Response Caching:** Cache GET responses with SWR/React Query
- **Database Query Caching:** PostgreSQL query result caching

---

## 8. Deployment Architecture

### 8.1 Production Environment

```
GitHub Repository
       ↓
   Git Push
       ↓
Vercel CI/CD Pipeline
       ↓
   Build & Deploy
       ↓
┌──────────────────────────┐
│   Vercel Edge Network    │
│   (Global CDN)           │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│   Next.js Application    │
│   (Serverless Functions) │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│   Supabase Cloud         │
│   • PostgreSQL DB        │
│   • Auth Service         │
│   • Storage Service      │
└──────────────────────────┘
```

### 8.2 Environment Variables

**Production (.env.production)**
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://budget.gov.in
NODE_ENV=production
```

**Development (.env.local)**
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 9. Error Handling & Logging

### 9.1 Error Handling Strategy
- **API Errors:** Consistent error response format
- **Database Errors:** Graceful handling with user-friendly messages
- **Auth Errors:** Redirect to login with error message
- **Validation Errors:** Client-side and server-side validation

### 9.2 Logging
- **Application Logs:** Vercel logging
- **Database Logs:** Supabase dashboard
- **Error Tracking:** Sentry integration (optional)
- **Audit Logs:** Database table for all critical operations

---

## 10. Testing Strategy

### 10.1 Unit Tests
- Utility functions (calculations, formatters, validators)
- React components (using React Testing Library)

### 10.2 Integration Tests
- API routes (using Supertest)
- Database operations (using Supabase test client)

### 10.3 E2E Tests
- Critical user workflows (using Playwright or Cypress)
- Budget creation and approval flow
- Expenditure recording flow

---

## 11. Security Measures

### 11.1 Application Security
- HTTPS only
- CORS configuration
- Rate limiting on API routes
- Input sanitization
- SQL injection prevention (parameterized queries)
- XSS protection
- CSRF tokens

### 11.2 Data Security
- Encryption at rest (Supabase default)
- Encryption in transit (TLS 1.3)
- Row-level security (RLS)
- Sensitive data masking in logs

### 11.3 Compliance
- Data retention policies
- GDPR compliance (if applicable)
- Audit trail for all transactions

---

## 12. Scalability Considerations

### 12.1 Horizontal Scaling
- Serverless architecture (auto-scaling)
- Database connection pooling
- CDN for static assets

### 12.2 Vertical Scaling
- Supabase Pro plan for larger database
- Optimized database queries
- Efficient indexing strategy

### 12.3 Data Archival
- Archive old financial year data
- Maintain 3 years of active data
- Move older data to cold storage

---

## 13. Monitoring & Observability

### 13.1 Metrics to Track
- Response time (p50, p95, p99)
- Error rate
- Database query performance
- User session duration
- API endpoint usage

### 13.2 Alerts
- High error rate (>1%)
- Slow response time (>2s)
- Database connection pool exhaustion
- Failed authentication attempts spike

### 13.3 Dashboards
- Real-time application health dashboard
- Database performance metrics
- User activity analytics

---

## 14. Disaster Recovery

### 14.1 Backup Strategy
- Automated daily database backups (Supabase)
- Point-in-time recovery capability
- Document storage backups

### 14.2 Recovery Plan
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 1 hour
- Failover procedures documented

---

**Architecture Status:** Approved
**Next Step:** Development Stories Breakdown
