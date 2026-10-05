/**
 * safeErrorMessage - prevents raw internal error detail (SQLite error
 * text, file-system paths, stack traces, driver/library internals) from
 * being sent to API clients in production, while keeping full diagnostic
 * detail available in non-production environments and ALWAYS logging the
 * real error server-side regardless of environment.
 *
 * This is intentionally narrow: it only governs the catch-all "something
 * unexpected blew up" 400/500 response paths that previously did
 * `error: error.message` directly. It must never be used to replace
 * deliberate, hand-written business-rule/validation messages that services
 * already construct and return via `result.error` (those are safe,
 * application-authored strings, not raw system error text) - call sites
 * that already read `result.error` from a service's return value are
 * unaffected by this helper.
 *
 * @param {Error} error - the caught error object
 * @param {string} [genericMessage] - safe fallback shown to the client in production
 * @returns {string} a message safe to send to an API client
 */
export function safeErrorMessage(
  error,
  genericMessage = 'An unexpected error occurred. Please try again or contact support.'
) {
  // Always log the full, unsanitized detail server-side for operators/SRE.
  if (error) {
    console.error('[unhandled error]', error.message || error);
  }

  if (process.env.NODE_ENV === 'production') {
    return genericMessage;
  }

  return (error && error.message) || genericMessage;
}

export default safeErrorMessage;
