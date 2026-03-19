import { API_BASE_URL } from './config'

/**
 * 管理 API 客户端 — 调用 new-api 的 /api/* 端点
 * 用于用户管理、API Key 管理、用量统计等
 *
 * 认证方式说明：
 * - /api/* 端点通过 session cookie 认证（浏览器自动携带）
 * - New-Api-User header 是 New-API 要求的 CSRF 防护 header，必须手动附加
 * - /v1/* 端点通过 Authorization: Bearer <apiToken> 认证（在 stream.js 中处理）
 */

function getUserId() {
  try {
    const auth = JSON.parse(localStorage.getItem('auth-storage') || '{}')
    return auth?.state?.user?.id || ''
  } catch {
    return ''
  }
}

export async function apiRequest(endpoint, options = {}) {
  const { method = 'GET', body, headers: customHeaders = {} } = options

  const headers = {
    'Content-Type': 'application/json',
    'New-Api-User': String(getUserId()),
    ...customHeaders,
  }

  const config = {
    method,
    headers,
  }

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (response.status === 401) {
    // 未授权，清除登录状态
    localStorage.removeItem('auth-storage')
    window.location.hash = '#/login'
    throw new Error('登录已过期，请重新登录')
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.message || data?.error?.message || `请求失败 (${response.status})`)
  }

  return data
}

// 便捷方法
export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
}
