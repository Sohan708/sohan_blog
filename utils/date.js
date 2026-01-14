export function formatDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(date);
}

export function toIso(date) {
  return date ? new Date(date).toISOString() : '';
}

