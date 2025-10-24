# Development Stories
## Indian Budget Management System

**Version:** 1.0
**Date:** October 24, 2025
**Prepared by:** BMAD Method - Scrum Master Agent

---

## Story Index

### Sprint 1: Foundation (Week 1-2)
- Story 1.1: Project Setup and Configuration
- Story 1.2: Database Schema Implementation
- Story 1.3: Authentication System with Google OAuth
- Story 1.4: User Profile Management and RBAC

### Sprint 2: Organizational Structure (Week 3)
- Story 2.1: Ministry Management Module
- Story 2.2: Department Management Module
- Story 2.3: Admin Dashboard for Org Structure

### Sprint 3: Scheme Management (Week 4)
- Story 3.1: Scheme Creation and Management
- Story 3.2: Scheme Details and Metadata

### Sprint 4: Budget Proposals (Week 5)
- Story 4.1: Budget Proposal Creation Form
- Story 4.2: Budget Line Items Management
- Story 4.3: Budget Proposal List and Filtering

### Sprint 5: Approval Workflow (Week 6)
- Story 5.1: Approval Workflow Engine
- Story 5.2: Approval Actions and Comments
- Story 5.3: Notifications System

### Sprint 6: Budget Allocation (Week 7)
- Story 6.1: Budget Sanctioning and Allocation
- Story 6.2: Quarterly Allocation Management

### Sprint 7: Expenditure Tracking (Week 8)
- Story 7.1: Expenditure Recording Module
- Story 7.2: Expenditure Approval Workflow
- Story 7.3: Variance Analysis

### Sprint 8: Dashboard and Analytics (Week 9)
- Story 8.1: Main Dashboard with KPIs
- Story 8.2: Budget Utilization Charts
- Story 8.3: Expenditure Trends and Analytics

### Sprint 9: Reporting (Week 10)
- Story 9.1: Report Builder Interface
- Story 9.2: Standard Reports Implementation
- Story 9.3: Export Functionality (PDF, Excel, CSV)

### Sprint 10: Polish and Deployment (Week 11-12)
- Story 10.1: UI/UX Refinement and Responsive Design
- Story 10.2: End-to-End Testing
- Story 10.3: Production Deployment and Monitoring

---

## SPRINT 1: FOUNDATION

### Story 1.1: Project Setup and Configuration

**As a** Developer
**I want to** set up the Next.js project with all necessary dependencies
**So that** I have a solid foundation to build the application

**Acceptance Criteria:**
- [ ] Next.js 14 project initialized with TypeScript
- [ ] Tailwind CSS configured
- [ ] Supabase client library installed and configured
- [ ] Environment variables template created (.env.example)
- [ ] Project structure matches architecture document
- [ ] Basic layout components (Header, Sidebar, Footer) created
- [ ] Global styles configured
- [ ] Development server runs without errors

**Technical Details:**
```bash
# Initialize project
npx create-next-app@latest budget-management-system --typescript --tailwind --app

# Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install zustand date-fns clsx tailwind-merge
npm install -D @types/node

# Install UI libraries
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-tabs
npm install lucide-react recharts
```

**Files to Create:**
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/utils.ts`
- `app/layout.tsx`
- `app/page.tsx`
- `components/layout/Header.tsx`
- `components/layout/Sidebar.tsx`
- `.env.example`

**Definition of Done:**
- Project builds successfully
- Development server runs on localhost:3000
- All dependencies installed
- Code follows TypeScript best practices

---

### Story 1.2: Database Schema Implementation

**As a** Developer
**I want to** implement the complete database schema in Supabase
**So that** the application has a robust data foundation

**Acceptance Criteria:**
- [ ] All tables created as per architecture document
- [ ] All enums defined
- [ ] Foreign key relationships established
- [ ] Indexes created on frequently queried columns
- [ ] Timestamps and default values configured
- [ ] Database migrations documented

**Technical Details:**

**SQL Migration File: `supabase/migrations/001_initial_schema.sql`**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE user_role_enum AS ENUM (
  'Finance Ministry Admin',
  'Budget Division Officer',
  'Ministry Secretary',
  'Department Head',
  'Section Officer',
  'Auditor'
);

CREATE TYPE scheme_type_enum AS ENUM (
  'Central Sector',
  'Centrally Sponsored',
  'Core Scheme',
  'Sub Scheme'
);

CREATE TYPE proposal_type_enum AS ENUM (
  'Budget Estimate',
  'Revised Estimate',
  'Supplementary Grant'
);

CREATE TYPE budget_type_enum AS ENUM (
  'Revenue',
  'Capital'
);

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

CREATE TYPE entity_type_enum AS ENUM (
  'Budget Proposal',
  'Expenditure',
  'Reallocation',
  'Scheme'
);

CREATE TYPE audit_action_enum AS ENUM (
  'INSERT',
  'UPDATE',
  'DELETE'
);

-- Create tables
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role_enum NOT NULL DEFAULT 'Section Officer',
  ministry_id UUID,
  department_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ministries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  minister_name TEXT,
  secretary_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

CREATE TABLE schemes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  ministry_id UUID NOT NULL REFERENCES ministries(id),
  department_id UUID REFERENCES departments(id),
  scheme_type scheme_type_enum NOT NULL,
  description TEXT,
  objectives TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

CREATE TABLE budget_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_number TEXT NOT NULL UNIQUE,
  financial_year TEXT NOT NULL,
  scheme_id UUID NOT NULL REFERENCES schemes(id),
  ministry_id UUID NOT NULL REFERENCES ministries(id),
  department_id UUID REFERENCES departments(id),
  proposal_type proposal_type_enum NOT NULL,
  status proposal_status_enum DEFAULT 'Draft',
  total_amount NUMERIC(15, 2) DEFAULT 0,
  revenue_amount NUMERIC(15, 2) DEFAULT 0,
  capital_amount NUMERIC(15, 2) DEFAULT 0,
  justification TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

CREATE TABLE budget_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES budget_proposals(id) ON DELETE CASCADE,
  head_of_account TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(15, 2) NOT NULL,
  budget_type budget_type_enum NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE budget_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES budget_proposals(id),
  scheme_id UUID NOT NULL REFERENCES schemes(id),
  financial_year TEXT NOT NULL,
  sanctioned_amount NUMERIC(15, 2) NOT NULL,
  q1_allocation NUMERIC(15, 2),
  q2_allocation NUMERIC(15, 2),
  q3_allocation NUMERIC(15, 2),
  q4_allocation NUMERIC(15, 2),
  status allocation_status_enum DEFAULT 'Active',
  sanctioned_at TIMESTAMPTZ DEFAULT NOW(),
  sanctioned_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenditures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  allocation_id UUID REFERENCES budget_allocations(id),
  scheme_id UUID NOT NULL REFERENCES schemes(id),
  financial_year TEXT NOT NULL,
  month INTEGER CHECK (month >= 1 AND month <= 12),
  amount NUMERIC(15, 2) NOT NULL,
  expenditure_type budget_type_enum NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  voucher_number TEXT,
  approved_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

CREATE TABLE approval_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type entity_type_enum NOT NULL,
  entity_id UUID NOT NULL,
  current_stage INTEGER DEFAULT 1,
  total_stages INTEGER NOT NULL,
  status proposal_status_enum DEFAULT 'Submitted',
  submitted_by UUID REFERENCES user_profiles(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE approval_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  approver_role user_role_enum NOT NULL,
  approver_id UUID REFERENCES user_profiles(id),
  status approval_status_enum DEFAULT 'Pending',
  comments TEXT,
  action_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type entity_type_enum NOT NULL,
  entity_id UUID NOT NULL,
  document_name TEXT NOT NULL,
  document_type TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES user_profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action audit_action_enum NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES user_profiles(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_profiles_ministry ON user_profiles(ministry_id);
CREATE INDEX idx_user_profiles_department ON user_profiles(department_id);
CREATE INDEX idx_departments_ministry ON departments(ministry_id);
CREATE INDEX idx_schemes_ministry ON schemes(ministry_id);
CREATE INDEX idx_schemes_department ON schemes(department_id);
CREATE INDEX idx_budget_proposals_scheme ON budget_proposals(scheme_id);
CREATE INDEX idx_budget_proposals_fy ON budget_proposals(financial_year);
CREATE INDEX idx_budget_proposals_status ON budget_proposals(status);
CREATE INDEX idx_budget_allocations_scheme ON budget_allocations(scheme_id);
CREATE INDEX idx_budget_allocations_fy ON budget_allocations(financial_year);
CREATE INDEX idx_expenditures_scheme ON expenditures(scheme_id);
CREATE INDEX idx_expenditures_fy ON expenditures(financial_year);
CREATE INDEX idx_approval_workflows_entity ON approval_workflows(entity_type, entity_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ministries_updated_at BEFORE UPDATE ON ministries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schemes_updated_at BEFORE UPDATE ON schemes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_proposals_updated_at BEFORE UPDATE ON budget_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_allocations_updated_at BEFORE UPDATE ON budget_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Files to Create:**
- `supabase/migrations/001_initial_schema.sql`
- `docs/DATABASE_SETUP.md` (setup instructions)

**Definition of Done:**
- All tables exist in Supabase
- Relationships verified
- Indexes created
- Triggers working

---

### Story 1.3: Authentication System with Google OAuth

**As a** User
**I want to** sign in with my Google account
**So that** I can securely access the budget management system

**Acceptance Criteria:**
- [ ] Google OAuth configured in Supabase
- [ ] Login page with "Sign in with Google" button
- [ ] Successful authentication creates/updates user_profile
- [ ] Auth context provides user session across app
- [ ] Protected routes redirect unauthenticated users
- [ ] Logout functionality works correctly

**Technical Details:**

**File: `lib/supabase/client.ts`**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**File: `contexts/AuthContext.tsx`**
```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setProfile(data)
    }
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, session, loading, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

**File: `app/auth/callback/route.ts`**
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

**File: `components/auth/LoginPage.tsx`**
```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export function LoginPage() {
  const { signInWithGoogle, loading } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Indian Budget Management System
          </h1>
          <p className="text-gray-600">
            Coordinating and developing India's budget
          </p>
        </div>

        <Button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          Sign in with Google
        </Button>

        <p className="text-xs text-gray-500 text-center mt-6">
          Authorized government personnel only
        </p>
      </div>
    </div>
  )
}
```

**Files to Create:**
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `contexts/AuthContext.tsx`
- `app/auth/callback/route.ts`
- `components/auth/LoginPage.tsx`
- `components/auth/ProtectedRoute.tsx`

**Definition of Done:**
- Users can sign in with Google
- User profile automatically created
- Authentication persists across refreshes
- Protected routes work correctly

---

### Story 1.4: User Profile Management and RBAC

**As a** System Administrator
**I want to** manage user roles and permissions
**So that** users have appropriate access based on their role

**Acceptance Criteria:**
- [ ] User profile page displays user info and role
- [ ] Admin can view all users
- [ ] Admin can assign roles to users
- [ ] Admin can assign users to ministries/departments
- [ ] Row-Level Security (RLS) policies implemented
- [ ] Authorization helper functions created

**Technical Details:**

**SQL Migration: `supabase/migrations/002_rls_policies.sql`**

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Finance Ministry Admin can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'Finance Ministry Admin'
    )
  );

CREATE POLICY "Only admins can update user roles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'Finance Ministry Admin'
    )
  );

-- Ministries Policies
CREATE POLICY "All authenticated users can view ministries"
  ON ministries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only Finance Ministry Admin can manage ministries"
  ON ministries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'Finance Ministry Admin'
    )
  );

-- Departments Policies
CREATE POLICY "All authenticated users can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Ministry Secretaries can manage their departments"
  ON departments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND (role = 'Finance Ministry Admin' OR
             (role = 'Ministry Secretary' AND ministry_id = departments.ministry_id))
    )
  );

-- Schemes Policies
CREATE POLICY "All authenticated users can view schemes"
  ON schemes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Department Heads can manage their schemes"
  ON schemes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND (up.role = 'Finance Ministry Admin' OR
             (up.role = 'Ministry Secretary' AND up.ministry_id = schemes.ministry_id) OR
             (up.role = 'Department Head' AND up.department_id = schemes.department_id))
    )
  );

-- Budget Proposals Policies
CREATE POLICY "Users can view proposals in their scope"
  ON budget_proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND (up.role IN ('Finance Ministry Admin', 'Budget Division Officer', 'Auditor') OR
             up.ministry_id = budget_proposals.ministry_id)
    )
  );

CREATE POLICY "Users can create proposals for their schemes"
  ON budget_proposals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN schemes s ON s.id = budget_proposals.scheme_id
      WHERE up.id = auth.uid()
        AND (up.department_id = s.department_id OR up.ministry_id = s.ministry_id)
    )
  );

-- Add more policies for other tables...
```

**File: `lib/utils/authorization.ts`**
```typescript
import { UserProfile } from '@/types'

export const hasRole = (profile: UserProfile | null, roles: string[]): boolean => {
  if (!profile) return false
  return roles.includes(profile.role)
}

export const canManageMinistry = (profile: UserProfile | null, ministryId: string): boolean => {
  if (!profile) return false
  if (profile.role === 'Finance Ministry Admin') return true
  if (profile.role === 'Ministry Secretary' && profile.ministry_id === ministryId) return true
  return false
}

export const canManageDepartment = (profile: UserProfile | null, departmentId: string): boolean => {
  if (!profile) return false
  if (profile.role === 'Finance Ministry Admin') return true
  if (profile.role === 'Department Head' && profile.department_id === departmentId) return true
  return false
}

export const canApproveBudget = (profile: UserProfile | null, budgetLevel: string): boolean => {
  if (!profile) return false
  const approvalRoles = {
    department: ['Department Head', 'Ministry Secretary', 'Finance Ministry Admin'],
    ministry: ['Ministry Secretary', 'Finance Ministry Admin'],
    central: ['Finance Ministry Admin'],
  }
  return approvalRoles[budgetLevel]?.includes(profile.role) ?? false
}
```

**Definition of Done:**
- RLS policies enforced on all tables
- Admin can manage users and roles
- Authorization helpers working
- Users can only see data within their scope

---

*Continue with remaining stories...*

**Total Stories:** 40+
**Estimated Duration:** 12 weeks

---

**Development Stories Status:** Complete
**Next Step:** Begin Implementation (Sprint 1)
