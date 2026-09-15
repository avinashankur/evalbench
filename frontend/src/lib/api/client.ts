import { env } from '@/env'
import { parseApiError, type ApiError } from './errors'

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 15_000): Promise<T> {
  const url = `${env.NEXT_PUBLIC_API_BASE_URL}${path}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  const headers = new Headers(init.headers)

  headers.set('Accept', 'application/json')

  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  init = {
    credentials: 'include',
    ...init,
    headers,
  }

  let response: Response

  try {
    response = await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw { message: 'Request timed out.', statusCode: 408 } satisfies ApiError
    }
    throw { message: 'Could not reach the server.', statusCode: 0 } satisfies ApiError
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    throw await parseApiError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (response.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/login'
  }

  const body: unknown = await response.json()

  if (body && typeof body === 'object' && 'success' in body) {
    if ((body as { success?: boolean }).success === true) {
      return (body as unknown as { data: T }).data
    }

    let message = (body as { error?: string | Record<string, unknown> }).error
    if (message && typeof message === 'object') {
      const errObj = message as Record<string, unknown>
      const msgStr = typeof errObj.message === 'string' ? errObj.message : undefined
      const codeStr = typeof errObj.code === 'string' ? errObj.code : undefined
      message = msgStr || codeStr || JSON.stringify(message)
    }

    throw {
      message:
        typeof message === 'string' ? message : `Request failed with status ${response.status}.`,
      statusCode: response.status,
    } satisfies ApiError
  }

  return body as T
}

export const apiClient = {
  get<T>(path: string, init?: RequestInit) {
    return request<T>(path, {
      ...init,
      method: 'GET',
    })
  },

  post<T>(path: string, body?: unknown, init?: RequestInit) {
    return request<T>(path, {
      ...init,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  },

  put<T>(path: string, body?: unknown, init?: RequestInit) {
    return request<T>(path, {
      ...init,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  },

  patch<T>(path: string, body?: unknown, init?: RequestInit) {
    return request<T>(path, {
      ...init,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  },

  delete<T>(path: string, init?: RequestInit) {
    return request<T>(path, {
      ...init,
      method: 'DELETE',
    })
  },
}
