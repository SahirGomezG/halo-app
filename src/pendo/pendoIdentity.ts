/**
 * Pendo identify payload — the single source of truth for the visitor and
 * account IDs + metadata Halo sends to Pendo.
 *
 * Used by PendoBridge (identify on every auth-state change) AND by the signup
 * wizard's completion handler. The wizard identifies the brand-new visitor
 * itself, synchronously, before tracking `signup_completed`: PendoBridge's
 * identify effect only runs after React commits the new auth state, so an
 * event fired in the same tick as `signInFromVisitor()` would otherwise be
 * attributed to the anonymous pre-signup visitor with no account.
 */

import type { Visitor, Workspace } from '../auth/types'

export function buildPendoIdentity(visitor: Visitor, workspace: Workspace) {
  return {
    visitor: {
      id: visitor.email,
      email: visitor.email,
      full_name: `${visitor.firstName} ${visitor.lastName}`,
      firstName: visitor.firstName,
      lastName: visitor.lastName,
      username: visitor.username,
      jobTitle: visitor.jobTitle,
      role: visitor.role,
      yearsExperience: visitor.yearsExperience,
      location: visitor.location,
      primaryUseCase: visitor.primaryUseCase,
      teamSize: visitor.teamSize,
      topGoals: visitor.topGoals,
      createdAt: visitor.createdAt,
    },
    account: {
      id: workspace.companyName,
      name: workspace.companyName,
      companyName: workspace.companyName,
      companySize: workspace.companySize,
      industry: workspace.industry,
      planTier: workspace.planTier,
      createdAt: workspace.createdAt,
    },
  }
}
