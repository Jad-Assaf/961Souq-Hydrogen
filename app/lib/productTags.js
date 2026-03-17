const PRE_ORDER_TAGS = new Set([
  'pre order',
  'preorder',
  'pro order',
  'proorder',
]);

function normalizeTag(tag) {
  return String(tag || '')
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function hasPreOrderTag(tags) {
  if (!Array.isArray(tags)) return false;

  return tags.some((tag) => PRE_ORDER_TAGS.has(normalizeTag(tag)));
}
