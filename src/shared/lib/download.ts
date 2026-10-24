/** Saves `content` as a file named `fileName` (a calendar event, recovery codes, a PDF from the API). */
export function saveFile(fileName: string, content: Blob | string, type = 'text/plain') {
  const blob = typeof content === 'string' ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: fileName }).click();
  // Revoked later: some browsers start the download after the click handler returns
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Opens `content` in a new tab, for files the browser can show (PDF, images). */
export function openFile(content: Blob) {
  const url = URL.createObjectURL(content);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
