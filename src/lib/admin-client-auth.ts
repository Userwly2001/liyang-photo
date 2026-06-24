type AdminRouter = {
  replace: (href: string) => void
}

export function getStoredAdminToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_token')
}

export function clearStoredAdminToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('admin_token')
}

export function redirectToAdminLogin(router: AdminRouter) {
  clearStoredAdminToken()
  router.replace('/admin/login')
}

export async function verifyStoredAdminToken(router: AdminRouter) {
  const token = getStoredAdminToken()

  if (!token) {
    redirectToAdminLogin(router)
    return null
  }

  const res = await fetch('/api/admin/session', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (res.status === 401) {
    redirectToAdminLogin(router)
    return null
  }

  if (!res.ok) {
    throw new Error('Session check failed')
  }

  return token
}
