const TOKEN_KEY = 'token'

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // ignore write failures
  }
}

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore remove failures
  }
}

const decodeBase64 = (value) => {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    )
  } catch {
    return null
  }
}

export const decodeToken = (token) => {
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  const decoded = decodeBase64(parts[1])
  if (!decoded) return null

  try {
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export const isTokenValid = (token) => {
  const payload = decodeToken(token)
  if (!payload) return false

  if (payload.exp && typeof payload.exp === 'number') {
    return payload.exp * 1000 > Date.now()
  }

  return true
}

export const getDashboardPath = (token) => {
  if (!token || !isTokenValid(token)) return null

  const payload = decodeToken(token)
  if (!payload) return null

  if (payload.type === 'worker' || payload.role === 'worker') {
    return '/workerDashboard'
  }

  return '/userDashboard'
}
