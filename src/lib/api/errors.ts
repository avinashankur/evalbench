export interface ApiError {
  message: string
  statusCode: number
}

export async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const body = await response.json()

    let message = body?.message ?? body?.error ?? body?.detail

    if (message && typeof message === 'object') {
      message = message.message || message.code || JSON.stringify(message)
    }

    return {
      message:
        typeof message === 'string' ? message : `Request failed with status ${response.status}.`,
      statusCode: response.status,
    }
  } catch {
    return {
      message: `Request failed with status ${response.status}.`,
      statusCode: response.status,
    }
  }
}
