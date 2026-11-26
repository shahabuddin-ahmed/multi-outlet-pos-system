import { ApiError } from '@/lib/api';

// For a write sent with a retry key (a sale, a stock change). It is "settled" when we know it was done
// or refused; otherwise the very same request must be sent again, never a new one.

const REQUEST_TIMEOUT = 408;
// Refused before the work was looked at: login, permission or too many requests
const REFUSED_AT_THE_DOOR = [401, 403, 429];

// Whether a failure settles the matter. wasUnanswered: an earlier send of this request got no answer.
export function isSettled(error: unknown, wasUnanswered: boolean): boolean {
  // No answer, a server error or an answer that cannot be read: it may have been done
  if (!(error instanceof ApiError) || error.status < 400 || error.status >= 500 || error.status === REQUEST_TIMEOUT) {
    return false;
  }
  // A refusal at the door says nothing about what happened to the earlier send
  return !(wasUnanswered && REFUSED_AT_THE_DOOR.includes(error.status));
}
