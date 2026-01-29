const MAX_EMAIL_LENGTH = 254;
const MAX_HANDLE_LENGTH = 50;
const MIN_HANDLE_LENGTH = 1;
const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
const MAX_COMMENT_LENGTH = 2000;
const MAX_REVIEW_LENGTH = 2000;
const MIN_RATING_SCORE = 1;
const MAX_RATING_SCORE = 5;

function isValidEmailFormat(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function assertValidEmail(email: string) {
  if (!email) return;
  if (email.length > MAX_EMAIL_LENGTH) {
    throw new Error("Email is too long");
  }
  if (!isValidEmailFormat(email)) {
    throw new Error("Invalid email format");
  }
}

export function normalizeHandle(rawHandle: string) {
  return rawHandle
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidHandle(handle: string) {
  if (!handle) return false;
  if (handle.length < MIN_HANDLE_LENGTH) return false;
  if (handle.length > MAX_HANDLE_LENGTH) return false;
  return HANDLE_PATTERN.test(handle);
}

export function assertValidHandle(handle: string) {
  if (handle.length < MIN_HANDLE_LENGTH) {
    throw new Error("Handle is too short");
  }
  if (handle.length > MAX_HANDLE_LENGTH) {
    throw new Error("Handle is too long");
  }
  if (!HANDLE_PATTERN.test(handle)) {
    throw new Error("Handle can only contain lowercase letters, numbers, and hyphens");
  }
}

export function assertValidCommentBody(body: string) {
  if (!body.trim()) {
    throw new Error("Comment cannot be empty");
  }
  if (body.length > MAX_COMMENT_LENGTH) {
    throw new Error("Comment is too long");
  }
}

export function assertValidRating(score: number, body?: string) {
  if (!Number.isFinite(score) || score < MIN_RATING_SCORE || score > MAX_RATING_SCORE) {
    throw new Error("Rating must be between 1 and 5");
  }
  if (body && body.length > MAX_REVIEW_LENGTH) {
    throw new Error("Review is too long");
  }
}

export const Validation = {
  MAX_EMAIL_LENGTH,
  MAX_HANDLE_LENGTH,
  MIN_HANDLE_LENGTH,
  HANDLE_PATTERN,
  MAX_COMMENT_LENGTH,
  MAX_REVIEW_LENGTH,
  MIN_RATING_SCORE,
  MAX_RATING_SCORE,
};
