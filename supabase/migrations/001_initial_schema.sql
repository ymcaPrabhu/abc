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

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
