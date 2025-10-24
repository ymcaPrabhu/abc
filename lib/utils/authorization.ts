import { UserProfile, UserRole } from '@/types'

/**
 * Check if user has one of the specified roles
 */
export function hasRole(profile: UserProfile | null, roles: UserRole[]): boolean {
  if (!profile) return false
  return roles.includes(profile.role)
}

/**
 * Check if user is an admin
 */
export function isAdmin(profile: UserProfile | null): boolean {
  return hasRole(profile, ['Finance Ministry Admin'])
}

/**
 * Check if user can manage ministry
 */
export function canManageMinistry(profile: UserProfile | null, ministryId?: string): boolean {
  if (!profile) return false
  if (profile.role === 'Finance Ministry Admin') return true
  if (profile.role === 'Ministry Secretary' && ministryId && profile.ministry_id === ministryId) {
    return true
  }
  return false
}

/**
 * Check if user can manage department
 */
export function canManageDepartment(profile: UserProfile | null, departmentId?: string, ministryId?: string): boolean {
  if (!profile) return false
  if (profile.role === 'Finance Ministry Admin') return true
  if (profile.role === 'Ministry Secretary' && ministryId && profile.ministry_id === ministryId) {
    return true
  }
  if (profile.role === 'Department Head' && departmentId && profile.department_id === departmentId) {
    return true
  }
  return false
}

/**
 * Check if user can create budget proposal
 */
export function canCreateBudgetProposal(profile: UserProfile | null): boolean {
  return hasRole(profile, [
    'Finance Ministry Admin',
    'Ministry Secretary',
    'Department Head',
    'Section Officer'
  ])
}

/**
 * Check if user can approve budget at a certain level
 */
export function canApproveBudget(profile: UserProfile | null, level: 'department' | 'ministry' | 'central'): boolean {
  if (!profile) return false

  const approvalRoles: Record<string, UserRole[]> = {
    department: ['Department Head', 'Ministry Secretary', 'Finance Ministry Admin'],
    ministry: ['Ministry Secretary', 'Finance Ministry Admin'],
    central: ['Finance Ministry Admin'],
  }

  return hasRole(profile, approvalRoles[level] || [])
}

/**
 * Check if user can record expenditure
 */
export function canRecordExpenditure(profile: UserProfile | null): boolean {
  return hasRole(profile, [
    'Finance Ministry Admin',
    'Department Head',
    'Section Officer'
  ])
}

/**
 * Check if user can view all data
 */
export function canViewAllData(profile: UserProfile | null): boolean {
  return hasRole(profile, [
    'Finance Ministry Admin',
    'Budget Division Officer',
    'Auditor'
  ])
}

/**
 * Get user's scope (what they can access)
 */
export function getUserScope(profile: UserProfile | null): {
  canAccessAllMinistries: boolean
  ministryId: string | null
  departmentId: string | null
} {
  if (!profile) {
    return {
      canAccessAllMinistries: false,
      ministryId: null,
      departmentId: null
    }
  }

  const canAccessAll = canViewAllData(profile)

  return {
    canAccessAllMinistries: canAccessAll,
    ministryId: profile.ministry_id,
    departmentId: profile.department_id
  }
}

/**
 * Check if user can edit a budget proposal
 */
export function canEditBudgetProposal(
  profile: UserProfile | null,
  proposal: { created_by: string | null; status: string; ministry_id: string; department_id: string | null }
): boolean {
  if (!profile) return false

  // Creator can edit draft proposals
  if (proposal.created_by === profile.id && proposal.status === 'Draft') {
    return true
  }

  // Admins can edit any proposal
  if (profile.role === 'Finance Ministry Admin') return true

  // Ministry Secretary can edit proposals in their ministry
  if (profile.role === 'Ministry Secretary' && profile.ministry_id === proposal.ministry_id) {
    return true
  }

  // Department Head can edit proposals in their department
  if (profile.role === 'Department Head' && profile.department_id === proposal.department_id) {
    return true
  }

  return false
}
