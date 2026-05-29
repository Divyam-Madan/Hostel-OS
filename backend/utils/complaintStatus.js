export const COMPLAINT_STATUS_ALIASES = Object.freeze({
  pending: ['pending', 'open'],
  in_progress: ['in_progress', 'in-progress'],
  resolved: ['resolved', 'closed'],
});

export const COMPLAINT_DB_STATUSES = Object.freeze(['pending', 'in_progress', 'resolved']);

export function toCanonicalComplaintStatus(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;

  for (const key of COMPLAINT_DB_STATUSES) {
    if (COMPLAINT_STATUS_ALIASES[key].includes(normalized)) return key;
  }
  return null;
}

export function toFrontendComplaintStatus(value) {
  const canonical = toCanonicalComplaintStatus(value);
  if (canonical === 'in_progress') return 'in-progress';
  if (canonical) return canonical;
  return value;
}