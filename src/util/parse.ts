export function normalizePlainText(input: string): string {
  return input.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function parseLineList(input: string | undefined, fallback: string[]): string[] {
  if (!input) {
    return fallback;
  }

  const parsed = input
    .split('\n')
    .map((line) => normalizePlainText(line))
    .filter(Boolean);

  return parsed.length > 0 ? parsed : fallback.map(normalizePlainText);
}

export function sanitizeTagValue(input: string): string {
  return input.replace(/\s+/g, ' ').trim().slice(0, 60);
}

export function hasMinimumMeaningfulLength(input: string, minChars = 40): boolean {
  return input.replace(/\s+/g, ' ').trim().length >= minChars;
}
