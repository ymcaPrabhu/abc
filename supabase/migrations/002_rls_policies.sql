-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
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

CREATE POLICY "Finance Ministry Admin can update profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'Finance Ministry Admin'
    )
  );

CREATE POLICY "Users can update their own profile (except role)"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );

-- Ministries Policies
CREATE POLICY "All authenticated users can view ministries"
  ON ministries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Finance Ministry Admin can manage ministries"
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

CREATE POLICY "Authorized users can manage departments"
  ON departments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND (role = 'Finance Ministry Admin' OR
             (role = 'Ministry Secretary' AND ministry_id = departments.ministry_id))
    )
  );

CREATE POLICY "Authorized users can update departments"
  ON departments FOR UPDATE
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

CREATE POLICY "Authorized users can create schemes"
  ON schemes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND (up.role = 'Finance Ministry Admin' OR
             (up.role = 'Ministry Secretary' AND up.ministry_id = schemes.ministry_id) OR
             (up.role = 'Department Head' AND up.department_id = schemes.department_id))
    )
  );

CREATE POLICY "Authorized users can update schemes"
  ON schemes FOR UPDATE
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
             up.ministry_id = budget_proposals.ministry_id OR
             up.department_id = budget_proposals.department_id)
    )
  );

CREATE POLICY "Authorized users can create proposals"
  ON budget_proposals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN schemes s ON s.id = budget_proposals.scheme_id
      WHERE up.id = auth.uid()
        AND (up.role IN ('Finance Ministry Admin', 'Ministry Secretary', 'Department Head', 'Section Officer'))
        AND (up.ministry_id = s.ministry_id OR up.department_id = s.department_id)
    )
  );

CREATE POLICY "Users can update their own draft proposals"
  ON budget_proposals FOR UPDATE
  USING (
    (created_by = auth.uid() AND status = 'Draft') OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('Finance Ministry Admin', 'Ministry Secretary', 'Department Head')
    )
  );

-- Budget Line Items Policies
CREATE POLICY "Users can view line items for proposals they can see"
  ON budget_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM budget_proposals bp
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE bp.id = budget_line_items.proposal_id
        AND (up.role IN ('Finance Ministry Admin', 'Budget Division Officer', 'Auditor') OR
             up.ministry_id = bp.ministry_id OR
             up.department_id = bp.department_id)
    )
  );

CREATE POLICY "Users can manage line items for their proposals"
  ON budget_line_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM budget_proposals bp
      WHERE bp.id = budget_line_items.proposal_id
        AND bp.created_by = auth.uid()
        AND bp.status = 'Draft'
    )
  );

-- Budget Allocations Policies
CREATE POLICY "All authenticated users can view allocations"
  ON budget_allocations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only Finance Ministry Admin can manage allocations"
  ON budget_allocations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'Finance Ministry Admin'
    )
  );

-- Expenditures Policies
CREATE POLICY "Users can view expenditures in their scope"
  ON expenditures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN schemes s ON s.id = expenditures.scheme_id
      WHERE up.id = auth.uid()
        AND (up.role IN ('Finance Ministry Admin', 'Budget Division Officer', 'Auditor') OR
             up.ministry_id = s.ministry_id OR
             up.department_id = s.department_id)
    )
  );

CREATE POLICY "Authorized users can record expenditures"
  ON expenditures FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN schemes s ON s.id = expenditures.scheme_id
      WHERE up.id = auth.uid()
        AND (up.role IN ('Finance Ministry Admin', 'Department Head', 'Section Officer'))
        AND (up.ministry_id = s.ministry_id OR up.department_id = s.department_id)
    )
  );

-- Approval Workflows Policies
CREATE POLICY "Users can view workflows for entities they can access"
  ON approval_workflows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create workflows for their submissions"
  ON approval_workflows FOR INSERT
  WITH CHECK (submitted_by = auth.uid());

-- Approval Stages Policies
CREATE POLICY "Users can view approval stages"
  ON approval_stages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Approvers can update their assigned stages"
  ON approval_stages FOR UPDATE
  USING (
    approver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = approver_role
    )
  );

-- Documents Policies
CREATE POLICY "Users can view documents for entities they can access"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upload documents"
  ON documents FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Audit Logs Policies
CREATE POLICY "Auditors and admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('Finance Ministry Admin', 'Auditor', 'Budget Division Officer')
    )
  );

CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());
