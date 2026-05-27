// Thin typed wrapper for Drive v3, scoped to the user's appDataFolder.
// Every call goes through withFreshToken so 401s + near-expiry tokens are
// transparent to consumers.
//
// Only the methods we need: list, get metadata, download content, create
// (multipart), update content (media), update metadata, delete.

import { withFreshToken } from '../auth/google';

const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

export type DriveFile = {
  id: string;
  name: string;
  modifiedTime: string;     // RFC3339
  appProperties?: Record<string, string>;
  // We capture the response ETag so the caller can do If-Match on next update.
  etag: string | null;
};

async function checkOk(res: Response): Promise<void> {
  if (res.ok) return;
  const body = await res.text().catch(() => '');
  throw new Error(`HTTP ${res.status} ${res.statusText} — ${body.slice(0, 200)}`);
}

function toDriveFile(j: { id: string; name: string; modifiedTime: string; appProperties?: Record<string, string> }, etag: string | null): DriveFile {
  return { id: j.id, name: j.name, modifiedTime: j.modifiedTime, appProperties: j.appProperties, etag };
}

export async function listAppDataFiles(): Promise<DriveFile[]> {
  return withFreshToken(async (token) => {
    const out: DriveFile[] = [];
    let pageToken: string | undefined;
    do {
      const params = new URLSearchParams({
        spaces: 'appDataFolder',
        pageSize: '1000',
        fields: 'nextPageToken, files(id,name,modifiedTime,appProperties)',
      });
      if (pageToken) params.set('pageToken', pageToken);
      const res = await fetch(`${FILES_URL}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await checkOk(res);
      const j = await res.json() as { nextPageToken?: string; files?: Array<{ id: string; name: string; modifiedTime: string; appProperties?: Record<string, string> }> };
      for (const f of j.files ?? []) out.push(toDriveFile(f, null));
      pageToken = j.nextPageToken;
    } while (pageToken);
    return out;
  });
}

export async function findFileByName(name: string): Promise<DriveFile | null> {
  return withFreshToken(async (token) => {
    const params = new URLSearchParams({
      spaces: 'appDataFolder',
      q: `name = '${name.replace(/'/g, "\\'")}'`,
      pageSize: '1',
      fields: 'files(id,name,modifiedTime,appProperties)',
    });
    const res = await fetch(`${FILES_URL}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await checkOk(res);
    const j = await res.json() as { files?: Array<{ id: string; name: string; modifiedTime: string; appProperties?: Record<string, string> }> };
    const f = j.files?.[0];
    return f ? toDriveFile(f, null) : null;
  });
}

export async function getFileMeta(fileId: string): Promise<DriveFile> {
  return withFreshToken(async (token) => {
    const params = new URLSearchParams({ fields: 'id,name,modifiedTime,appProperties' });
    const res = await fetch(`${FILES_URL}/${fileId}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await checkOk(res);
    const etag = res.headers.get('ETag');
    const j = await res.json();
    return toDriveFile(j, etag);
  });
}

export async function downloadFile(fileId: string): Promise<{ etag: string | null; body: string }> {
  return withFreshToken(async (token) => {
    const res = await fetch(`${FILES_URL}/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await checkOk(res);
    const etag = res.headers.get('ETag');
    const body = await res.text();
    return { etag, body };
  });
}

// Create a JSON file inside appDataFolder. Returns the new file's metadata.
export async function createJsonFile(name: string, contentJson: unknown, appProperties?: Record<string, string>): Promise<DriveFile> {
  return withFreshToken(async (token) => {
    const boundary = '-------SANDBOX' + Math.random().toString(36).slice(2, 12);
    const meta = { name, parents: ['appDataFolder'], appProperties };
    const body =
      `--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(meta) + '\r\n' +
      `--${boundary}\r\n` +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(contentJson) + '\r\n' +
      `--${boundary}--`;
    const params = new URLSearchParams({
      uploadType: 'multipart',
      fields: 'id,name,modifiedTime,appProperties',
    });
    const res = await fetch(`${UPLOAD_URL}?${params}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });
    await checkOk(res);
    const etag = res.headers.get('ETag');
    const j = await res.json();
    return toDriveFile(j, etag);
  });
}

// Replace a file's body. Optionally update appProperties at the same time via
// the metadata-only PATCH (called separately if needed).
export async function updateJsonFile(fileId: string, contentJson: unknown, ifMatch?: string | null): Promise<DriveFile> {
  return withFreshToken(async (token) => {
    const params = new URLSearchParams({
      uploadType: 'media',
      fields: 'id,name,modifiedTime,appProperties',
    });
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (ifMatch) headers['If-Match'] = ifMatch;
    const res = await fetch(`${UPLOAD_URL}/${fileId}?${params}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(contentJson),
    });
    if (res.status === 412) throw new PreconditionFailedError(fileId);
    await checkOk(res);
    const etag = res.headers.get('ETag');
    const j = await res.json();
    return toDriveFile(j, etag);
  });
}

export async function updateAppProperties(fileId: string, appProperties: Record<string, string>): Promise<void> {
  return withFreshToken(async (token) => {
    const res = await fetch(`${FILES_URL}/${fileId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ appProperties }),
    });
    await checkOk(res);
  });
}

export async function deleteFile(fileId: string): Promise<void> {
  return withFreshToken(async (token) => {
    const res = await fetch(`${FILES_URL}/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return; // already gone — fine
    await checkOk(res);
  });
}

export class PreconditionFailedError extends Error {
  constructor(public fileId: string) {
    super(`Drive precondition failed for file ${fileId}`);
    this.name = 'PreconditionFailedError';
  }
}
