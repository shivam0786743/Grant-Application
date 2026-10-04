import crypto from 'crypto';

/**
 * Computes a SHA-256 hash of document text content.
 * Normalizes line breaks and trailing whitespace so formatting differences don't trigger false stale states.
 */
export function computeContentHash(content: string): string {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}
