import { supabase } from '@/lib/supabase';

const BUCKET = 'event-images';

export type LocalCoverImage = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export type UploadEventCoverResult = {
  publicUrl: string | null;
  path: string | null;
  error: string | null;
};

function newFolderId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `cover-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function extensionFor(image: LocalCoverImage): string {
  const fromName = image.fileName?.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName) && fromName !== 'heic') {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }

  const mime = image.mimeType?.toLowerCase() ?? '';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';

  const fromUri = image.uri.split('?')[0]?.split('.').pop()?.toLowerCase();
  if (fromUri === 'png' || fromUri === 'webp' || fromUri === 'gif' || fromUri === 'jpg') {
    return fromUri;
  }
  if (fromUri === 'jpeg') return 'jpg';

  return 'jpg';
}

function contentTypeFor(ext: string, mimeType?: string | null): string {
  if (mimeType && mimeType.startsWith('image/') && !mimeType.includes('heic')) {
    return mimeType;
  }
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

/**
 * Uploads a cover image to the public `event-images` bucket under
 * `{userId}/{folderId}/cover.{ext}` (RLS: first path segment must be auth uid).
 */
export async function uploadEventCoverImage(
  userId: string,
  image: LocalCoverImage
): Promise<UploadEventCoverResult> {
  if (!supabase) {
    return {
      publicUrl: null,
      path: null,
      error: 'Supabase is not configured. Add keys to .env to upload images.',
    };
  }

  if (!userId.trim()) {
    return { publicUrl: null, path: null, error: 'You must be signed in to upload.' };
  }

  if (!image.uri.trim()) {
    return { publicUrl: null, path: null, error: 'Choose a cover image first.' };
  }

  const ext = extensionFor(image);
  const contentType = contentTypeFor(ext, image.mimeType);
  const path = `${userId}/${newFolderId()}/cover.${ext}`;

  let body: ArrayBuffer;
  try {
    const response = await fetch(image.uri);
    if (!response.ok) {
      return {
        publicUrl: null,
        path: null,
        error: 'Could not read the selected image. Try another photo.',
      };
    }
    body = await response.arrayBuffer();
  } catch {
    return {
      publicUrl: null,
      path: null,
      error: 'Could not read the selected image. Try another photo.',
    };
  }

  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType,
    upsert: false,
  });

  if (error) {
    return { publicUrl: null, path: null, error: error.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data.publicUrl) {
    return {
      publicUrl: null,
      path,
      error: 'Upload succeeded but public URL was missing.',
    };
  }

  return { publicUrl: data.publicUrl, path, error: null };
}
