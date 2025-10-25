/**
 * Approval Workflow Utility Functions
 * Manages multi-stage approval workflows for budget proposals and other entities
 */

import { supabase } from "@/lib/supabase";
import { UserProfile, EntityType, UserRole } from "@/types";

interface WorkflowStage {
  stage_number: number;
  stage_name: string;
  approver_role: UserRole;
}

/**
 * Define approval stages based on entity type
 */
const getWorkflowStages = (entityType: EntityType): WorkflowStage[] => {
  switch (entityType) {
    case "Budget Proposal":
      return [
        {
          stage_number: 1,
          stage_name: "Department Review",
          approver_role: "Department Head",
        },
        {
          stage_number: 2,
          stage_name: "Ministry Review",
          approver_role: "Ministry Secretary",
        },
        {
          stage_number: 3,
          stage_name: "Finance Ministry Approval",
          approver_role: "Finance Ministry Admin",
        },
      ];
    case "Expenditure":
      return [
        {
          stage_number: 1,
          stage_name: "Department Approval",
          approver_role: "Department Head",
        },
        {
          stage_number: 2,
          stage_name: "Ministry Approval",
          approver_role: "Ministry Secretary",
        },
      ];
    default:
      return [];
  }
};

/**
 * Create a new approval workflow
 */
export async function createWorkflow(
  entityType: EntityType,
  entityId: string,
  submittedBy: string
): Promise<{ workflowId: string; error?: string }> {
  try {
    const stages = getWorkflowStages(entityType);

    // Create workflow
    const { data: workflow, error: workflowError } = await supabase
      .from("approval_workflows")
      .insert([
        {
          entity_type: entityType,
          entity_id: entityId,
          current_stage: 1,
          total_stages: stages.length,
          status: "Submitted",
          submitted_by: submittedBy,
          submitted_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (workflowError) throw workflowError;

    // Create all stages
    const stagesData = stages.map((stage) => ({
      workflow_id: workflow.id,
      stage_number: stage.stage_number,
      stage_name: stage.stage_name,
      approver_role: stage.approver_role,
      status: stage.stage_number === 1 ? "Pending" : "Pending",
    }));

    const { error: stagesError } = await supabase
      .from("approval_stages")
      .insert(stagesData);

    if (stagesError) throw stagesError;

    return { workflowId: workflow.id };
  } catch (error: any) {
    console.error("Error creating workflow:", error);
    return { workflowId: "", error: error.message };
  }
}

/**
 * Get workflow for an entity
 */
export async function getWorkflow(entityType: EntityType, entityId: string) {
  const { data, error } = await supabase
    .from("approval_workflows")
    .select(
      `
      *,
      stages:approval_stages(
        *,
        approver:user_profiles(id, full_name, email, role)
      )
    `
    )
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching workflow:", error);
    return null;
  }

  return data;
}

/**
 * Approve a workflow stage
 */
export async function approveStage(
  workflowId: string,
  stageNumber: number,
  approverId: string,
  comments?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get workflow details
    const { data: workflow, error: workflowError } = await supabase
      .from("approval_workflows")
      .select("*, stages:approval_stages(*)")
      .eq("id", workflowId)
      .single();

    if (workflowError) throw workflowError;

    // Update the stage
    const { error: stageError } = await supabase
      .from("approval_stages")
      .update({
        status: "Approved",
        approver_id: approverId,
        comments: comments || null,
        action_date: new Date().toISOString(),
      })
      .eq("workflow_id", workflowId)
      .eq("stage_number", stageNumber);

    if (stageError) throw stageError;

    // Check if this is the final stage
    if (stageNumber === workflow.total_stages) {
      // All stages approved - mark workflow as complete
      const { error: updateError } = await supabase
        .from("approval_workflows")
        .update({
          status: "Approved",
          current_stage: stageNumber,
          completed_at: new Date().toISOString(),
        })
        .eq("id", workflowId);

      if (updateError) throw updateError;

      // Update the entity status
      await updateEntityStatus(workflow.entity_type, workflow.entity_id, "Approved", approverId);
    } else {
      // Move to next stage
      const { error: updateError } = await supabase
        .from("approval_workflows")
        .update({
          current_stage: stageNumber + 1,
          status: "Under Review",
        })
        .eq("id", workflowId);

      if (updateError) throw updateError;

      // Update entity status
      await updateEntityStatus(workflow.entity_type, workflow.entity_id, "Under Review");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error approving stage:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Reject a workflow stage
 */
export async function rejectStage(
  workflowId: string,
  stageNumber: number,
  approverId: string,
  comments: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get workflow details
    const { data: workflow, error: workflowError } = await supabase
      .from("approval_workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (workflowError) throw workflowError;

    // Update the stage
    const { error: stageError } = await supabase
      .from("approval_stages")
      .update({
        status: "Rejected",
        approver_id: approverId,
        comments: comments,
        action_date: new Date().toISOString(),
      })
      .eq("workflow_id", workflowId)
      .eq("stage_number", stageNumber);

    if (stageError) throw stageError;

    // Mark workflow as rejected
    const { error: updateError } = await supabase
      .from("approval_workflows")
      .update({
        status: "Rejected",
        completed_at: new Date().toISOString(),
      })
      .eq("id", workflowId);

    if (updateError) throw updateError;

    // Update entity status
    await updateEntityStatus(workflow.entity_type, workflow.entity_id, "Rejected");

    return { success: true };
  } catch (error: any) {
    console.error("Error rejecting stage:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Request revision at a workflow stage
 */
export async function requestRevision(
  workflowId: string,
  stageNumber: number,
  approverId: string,
  comments: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get workflow details
    const { data: workflow, error: workflowError } = await supabase
      .from("approval_workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (workflowError) throw workflowError;

    // Update the stage
    const { error: stageError } = await supabase
      .from("approval_stages")
      .update({
        status: "Rejected",
        approver_id: approverId,
        comments: comments,
        action_date: new Date().toISOString(),
      })
      .eq("workflow_id", workflowId)
      .eq("stage_number", stageNumber);

    if (stageError) throw stageError;

    // Mark workflow as revision requested
    const { error: updateError } = await supabase
      .from("approval_workflows")
      .update({
        status: "Revision Requested",
      })
      .eq("id", workflowId);

    if (updateError) throw updateError;

    // Update entity status
    await updateEntityStatus(workflow.entity_type, workflow.entity_id, "Revision Requested");

    return { success: true };
  } catch (error: any) {
    console.error("Error requesting revision:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update entity status based on workflow
 */
async function updateEntityStatus(
  entityType: EntityType,
  entityId: string,
  status: string,
  approvedBy?: string
) {
  const updateData: any = { status };

  if (status === "Approved" && approvedBy) {
    updateData.approved_by = approvedBy;
    updateData.approved_at = new Date().toISOString();
  }

  switch (entityType) {
    case "Budget Proposal":
      await supabase.from("budget_proposals").update(updateData).eq("id", entityId);
      break;
    case "Expenditure":
      await supabase.from("expenditures").update({ ...updateData, approved_by: approvedBy }).eq("id", entityId);
      break;
  }
}

/**
 * Check if user can approve current stage
 */
export function canApproveStage(
  profile: UserProfile | null,
  currentStageRole: UserRole,
  ministryId?: string,
  departmentId?: string
): boolean {
  if (!profile) return false;

  // Finance Ministry Admin can approve any stage
  if (profile.role === "Finance Ministry Admin") return true;

  // Check role match
  if (profile.role !== currentStageRole) return false;

  // Check ministry/department scope
  if (currentStageRole === "Department Head") {
    return profile.department_id === departmentId;
  }

  if (currentStageRole === "Ministry Secretary") {
    return profile.ministry_id === ministryId;
  }

  return true;
}
