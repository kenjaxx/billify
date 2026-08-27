// lib/file-signature.ts
// Validates that a file's actual binary content matches its claimed
// MIME type, by checking magic bytes/signatures rather than trusting
// the client-supplied `mimeType` field. A malicious client could label
// any file as `image/png` — this catches that before the bytes are
// forwarded to a third-party API (Gemini) or trusted anywhere else.

export type AllowedMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'

function bytesStartWith(buffer: Buffer, signature: number[], offset = 0): boolean {
  if (buffer.length < offset + signature.length) return false
  for (let i = 0; i < signature.length; i++) {
    if (buffer[offset + i] !== signature[i]) return false
  }
  return true
}

/**
 * Inspects the first bytes of a file buffer and returns the MIME type
 * implied by its actual signature, or null if it doesn't match any
 * type we accept.
 */
export function detectFileType(buffer: Buffer): AllowedMimeType | null {
  // JPEG: FF D8 FF
  if (bytesStartWith(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg'

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytesStartWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'

  // WEBP: "RIFF" .... "WEBP" (the "WEBP" marker sits at byte offset 8)
  if (bytesStartWith(buffer, [0x52, 0x49, 0x46, 0x46]) && bytesStartWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'image/webp'
  }

  // PDF: "%PDF"
  if (bytesStartWith(buffer, [0x25, 0x50, 0x44, 0x46])) return 'application/pdf'

  return null
}

/**
 * Returns true only if the buffer's real signature matches the
 * claimed MIME type. Use this before trusting a client-supplied
 * mimeType for any file whose bytes you're about to forward or store.
 */
export function fileMatchesClaimedType(buffer: Buffer, claimedMimeType: string): boolean {
  const actual = detectFileType(buffer)
  return actual !== null && actual === claimedMimeType
}