"use client";

import { createClient } from "@/utils/supabase/client";

// Supabase Storage bucket for user-uploaded media. Must be created as a public
// bucket in the Supabase dashboard (see README).
export const MEDIA_BUCKET = "media";

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export type UploadedMedia = {
  url: string;
  path: string;
  fileType: string;
};

function safeFileName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, "_");
}

/**
 * Uploads a file to Supabase Storage under `folder` and returns its public URL.
 * `folder` should start with the uploader's user id (e.g. `posts/<uid>/images`)
 * so storage policies can restrict writes to the owner.
 */
export async function uploadMedia(file: File, folder: string): Promise<UploadedMedia> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File must be 100 MB or smaller");
  }

  const supabase = createClient();
  const path = `${folder}/${Date.now()}-${safeFileName(file.name)}`;

  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(data.path);

  return { url: publicUrl, path: data.path, fileType: file.type };
}
