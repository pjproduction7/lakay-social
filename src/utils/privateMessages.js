export function mergePrivateMessage(prev, mapped) {
  if (!mapped) return prev;
  const exists = prev.some((m) => m.id === mapped.id);
  if (exists) {
    return prev.map((m) => (m.id === mapped.id ? { ...m, ...mapped } : m));
  }
  return [...prev, mapped];
}
