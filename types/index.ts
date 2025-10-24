// User Types
export type UserRole =
  | 'Finance Ministry Admin'
  | 'Budget Division Officer'
  | 'Ministry Secretary'
  | 'Department Head'
  | 'Section Officer'
  | 'Auditor';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  ministry_id: string | null;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Organizational Structure Types
export interface Ministry {
  id: string;
  name: string;
  code: string;
  minister_name: string | null;
  secretary_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  ministry_id: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  ministry?: Ministry;
}

// Scheme Types
export type SchemeType =
  | 'Central Sector'
  | 'Centrally Sponsored'
  | 'Core Scheme'
  | 'Sub Scheme';

export interface Scheme {
  id: string;
  name: string;
  code: string;
  ministry_id: string;
  department_id: string | null;
  scheme_type: SchemeType;
  description: string | null;
  objectives: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  ministry?: Ministry;
  department?: Department;
}

// Budget Types
export type ProposalType =
  | 'Budget Estimate'
  | 'Revised Estimate'
  | 'Supplementary Grant';

export type ProposalStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Revision Requested';

export type BudgetType = 'Revenue' | 'Capital';

export interface BudgetProposal {
  id: string;
  proposal_number: string;
  financial_year: string;
  scheme_id: string;
  ministry_id: string;
  department_id: string | null;
  proposal_type: ProposalType;
  status: ProposalStatus;
  total_amount: number;
  revenue_amount: number;
  capital_amount: number;
  justification: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  scheme?: Scheme;
  ministry?: Ministry;
  department?: Department;
  line_items?: BudgetLineItem[];
  approver?: UserProfile;
  creator?: UserProfile;
}

export interface BudgetLineItem {
  id: string;
  proposal_id: string;
  head_of_account: string;
  description: string | null;
  amount: number;
  budget_type: BudgetType;
  created_at: string;
}

// Allocation Types
export type AllocationStatus = 'Active' | 'Frozen' | 'Exhausted';

export interface BudgetAllocation {
  id: string;
  proposal_id: string;
  scheme_id: string;
  financial_year: string;
  sanctioned_amount: number;
  q1_allocation: number | null;
  q2_allocation: number | null;
  q3_allocation: number | null;
  q4_allocation: number | null;
  status: AllocationStatus;
  sanctioned_at: string;
  sanctioned_by: string | null;
  created_at: string;
  updated_at: string;
  scheme?: Scheme;
  proposal?: BudgetProposal;
}

// Expenditure Types
export interface Expenditure {
  id: string;
  allocation_id: string | null;
  scheme_id: string;
  financial_year: string;
  month: number;
  amount: number;
  expenditure_type: BudgetType;
  description: string | null;
  transaction_date: string;
  voucher_number: string | null;
  approved_by: string | null;
  created_at: string;
  created_by: string | null;
  scheme?: Scheme;
  allocation?: BudgetAllocation;
  approver?: UserProfile;
  creator?: UserProfile;
}

// Approval Workflow Types
export type EntityType =
  | 'Budget Proposal'
  | 'Expenditure'
  | 'Reallocation'
  | 'Scheme';

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Delegated';

export interface ApprovalWorkflow {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  current_stage: number;
  total_stages: number;
  status: ProposalStatus;
  submitted_by: string | null;
  submitted_at: string;
  completed_at: string | null;
  created_at: string;
  stages?: ApprovalStage[];
  submitter?: UserProfile;
}

export interface ApprovalStage {
  id: string;
  workflow_id: string;
  stage_number: number;
  stage_name: string;
  approver_role: UserRole;
  approver_id: string | null;
  status: ApprovalStatus;
  comments: string | null;
  action_date: string | null;
  created_at: string;
  approver?: UserProfile;
}

// Document Types
export interface Document {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  document_name: string;
  document_type: string | null;
  file_path: string;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
  uploader?: UserProfile;
}

// Audit Log Types
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: AuditAction;
  old_data: any;
  new_data: any;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: UserProfile;
}

// Dashboard & Analytics Types
export interface DashboardStats {
  total_budget: number;
  total_expenditure: number;
  budget_utilization: number;
  pending_approvals: number;
  active_schemes: number;
  total_ministries: number;
}

export interface BudgetUtilization {
  scheme_name: string;
  allocated: number;
  spent: number;
  utilization_percentage: number;
}

export interface ExpenditureTrend {
  month: string;
  amount: number;
  budget: number;
}

export interface MinistryBudget {
  ministry_name: string;
  allocated: number;
  spent: number;
  schemes_count: number;
}

// Form Types
export interface BudgetProposalFormData {
  financial_year: string;
  scheme_id: string;
  proposal_type: ProposalType;
  justification: string;
  line_items: {
    head_of_account: string;
    description: string;
    amount: number;
    budget_type: BudgetType;
  }[];
}

export interface SchemeFormData {
  name: string;
  code: string;
  ministry_id: string;
  department_id: string | null;
  scheme_type: SchemeType;
  description: string;
  objectives: string;
  start_date: string;
  end_date: string;
}

export interface ExpenditureFormData {
  scheme_id: string;
  financial_year: string;
  month: number;
  amount: number;
  expenditure_type: BudgetType;
  description: string;
  transaction_date: string;
  voucher_number: string;
}

// Filter Types
export interface BudgetFilter {
  financial_year?: string;
  ministry_id?: string;
  department_id?: string;
  status?: ProposalStatus;
  proposal_type?: ProposalType;
}

export interface SchemeFilter {
  ministry_id?: string;
  department_id?: string;
  scheme_type?: SchemeType;
  is_active?: boolean;
}

export interface ExpenditureFilter {
  financial_year?: string;
  scheme_id?: string;
  ministry_id?: string;
  department_id?: string;
  month?: number;
}

// Task Type (for legacy task organizer components)
export interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  user_profile?: {
    id: string;
    email: string;
    full_name: string | null;
    role: UserRole;
  };
}
