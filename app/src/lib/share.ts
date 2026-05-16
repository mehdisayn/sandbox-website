// Share-out: navigator.share() when supported, otherwise Blob + object-URL
// download. Plus copy-source-to-clipboard. Mirrors idea.md §4.4.

import { displayFilename } from './artifacts';
import type { Artifact } from './repo/types';

function artifactToFile(a: Artifact): File {
  const filename = displayFilename(a.name, a.fileKind);
  const mime = a.fileKind === 'html' ? 'text/html' : 'text/jsx';
  return new File([a.source], filename, { type: mime });
}

export async function shareArtifact(a: Artifact): Promise<'shared' | 'downloaded'> {
  const file = artifactToFile(a);
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: a.name });
      return 'shared';
    } catch (err) {
      // User aborted — fall through to download isn't right; rethrow.
      if ((err as DOMException).name === 'AbortError') throw err;
    }
  }
  // Fallback: trigger a download.
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

export async function copyArtifactSource(a: Artifact): Promise<void> {
  await navigator.clipboard.writeText(a.source);
}
