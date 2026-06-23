// Browser type="url" inputs require a scheme (https://) to validate.
// Users commonly paste bare domains (e.g. "www.linkedin.com/in/name") — normalize on blur.
export function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
