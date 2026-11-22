/**
 * Turns an API error into a message for the user. The API answers with
 * `{ code, message, payload }`; `payload` holds the detail (a string, or a
 * list of `{ field, message }` for validation errors).
 */
export function getErrorMessage(
  err: any,
  fallback = 'Terjadi kesalahan, silakan coba lagi.'
): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;

  // httpRequest rejects with the axios response; plain axios rejects with the error.
  const body = err.data ?? err.response?.data;
  const payload = body?.payload;

  if (typeof payload === 'string' && payload) return payload;
  if (Array.isArray(payload) && payload.length > 0) {
    return payload
      .map((item: any) =>
        item?.field ? `${item.field}: ${item.message}` : String(item)
      )
      .join(', ');
  }
  if (typeof body?.message === 'string' && body.message) return body.message;
  if (typeof err.message === 'string' && err.message) return err.message;
  return fallback;
}
