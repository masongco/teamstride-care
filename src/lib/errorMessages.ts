type UnknownError = { message?: string } | string | null | undefined;

export function isAccessDeniedError(err: UnknownError): boolean {
  const message =
    typeof err === 'string' ? err : (err && 'message' in err ? err.message : '') || '';
  const hay = message.toLowerCase();
  return (
    hay.includes('permission denied') ||
    hay.includes('not authorized') ||
    hay.includes('not authorised') ||
    hay.includes('access denied') ||
    hay.includes('violates row-level security') ||
    hay.includes('rls')
  );
}

export function accessDeniedMessage(resource: string): string {
  return `You don't have access to ${resource}. Please contact your Organisation Administrator.`;
}

export function friendlyErrorMessage(
  err: UnknownError,
  fallback: string,
  resource?: string
): string {
  if (resource && isAccessDeniedError(err)) {
    return accessDeniedMessage(resource);
  }
  const message =
    typeof err === 'string' ? err : (err && 'message' in err ? err.message : '') || '';
  return message || fallback;
}
