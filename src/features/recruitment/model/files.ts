// Application files (FR-REC-01): PDF or DOCX, at most 5 MB. The server checks again and scans them.
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = ['.pdf', '.docx'] as const;
export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(',');

/** The error code for a file that can't be attached, or `null` when it's fine. */
export function checkApplicationFile(file: Pick<File, 'name' | 'size'>): 'File.TypeNotAllowed' | 'File.TooLarge' | null {
  const name = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) return 'File.TypeNotAllowed';
  if (file.size > MAX_FILE_BYTES) return 'File.TooLarge';
  return null;
}
