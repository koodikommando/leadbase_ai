/**
 * Extracts a readable error message from an unknown error value.
 * Use this instead of error.message which throws on non-Error objects.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred'
}

/**
 * Extracts the domain from a URL string.
 * Returns null if the URL is invalid or empty.
 */
export function getDomain(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return null
  }
}
