/**
 * PendoBridge — Phase 6 Pendo Install & Wiring.
 *
 * Initializes Pendo anonymously on mount, then calls pendo.identify()
 * whenever the auth state changes to provide visitor and account metadata.
 * On sign-out, re-initializes with an anonymous visitor so Pendo continues
 * tracking page-level analytics without a signed-in identity.
 *
 * Provider position in src/App.tsx is fixed per FND-07 — this file's body
 * is the only thing Phase 6 touches. App.tsx is not edited.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { useAuth } from '../auth/useAuth'
import { buildPendoIdentity } from './pendoIdentity'

export function PendoBridge({ children }: { children: ReactNode }) {
  const { currentVisitor, currentWorkspace, isAuthenticated } = useAuth()
  const initializedRef = useRef(false)

  // Initialize Pendo anonymously on first mount
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    pendo.initialize({
      visitor: { id: '' },
    })
  }, [])

  // Identify with real visitor/account data when auth state changes
  useEffect(() => {
    if (!initializedRef.current) return

    if (isAuthenticated && currentVisitor && currentWorkspace) {
      pendo.identify(buildPendoIdentity(currentVisitor, currentWorkspace))
    }
  }, [isAuthenticated, currentVisitor, currentWorkspace])

  return <>{children}</>
}
