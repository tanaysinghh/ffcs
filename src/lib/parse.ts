export function parseSlotInput(raw: string): string[] {
  const tokens = raw
    .toUpperCase()
    .split(/[\s,+]+/)
    .filter(Boolean);
  return [...new Set(tokens)];
}
