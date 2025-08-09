import { storage } from '@/react-app/lib/appwrite';

export function isStorageUri(url?: string): boolean {
  return Boolean(url && url.startsWith('storage://'));
}

export function parseStorageUri(url: string): { bucketId: string; fileId: string } {
  const raw = url.replace('storage://', '');
  const [bucketId, fileId] = raw.split('/');
  if (!bucketId || !fileId) {
    throw new Error('Invalid storage URI');
  }
  return { bucketId, fileId };
}

export function resolveViewUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (!isStorageUri(url)) return url;
  const { bucketId, fileId } = parseStorageUri(url);
  const built = storage.getFileView(bucketId, fileId);
  return typeof built === 'string' ? built : (built as any).toString?.() ?? String(built);
}

export function resolveDownloadUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (!isStorageUri(url)) return url;
  const { bucketId, fileId } = parseStorageUri(url);
  const built = storage.getFileDownload(bucketId, fileId);
  return typeof built === 'string' ? built : (built as any).toString?.() ?? String(built);
}


