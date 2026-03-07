import type { SupabaseClient } from "@supabase/supabase-js";

export const MEMBER_PHOTO_BUCKET = "member-photos";
export const MEMBER_PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const MEMBER_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function getFileExtension(file: File): string {
  const mimeTypeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  if (file.type in mimeTypeMap) {
    return mimeTypeMap[file.type];
  }

  const extension = file.name.split(".").pop()?.trim().toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "jpg";
  if (extension === "png") return "png";
  if (extension === "webp") return "webp";
  return "jpg";
}

export function isStoragePhotoPath(value: string | null | undefined): value is string {
  if (!value) return false;
  return !/^https?:\/\//i.test(value);
}

export function validateMemberPhotoFile(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Formats autorises: JPG, PNG ou WEBP.");
  }

  if (file.size > MEMBER_PHOTO_MAX_SIZE_BYTES) {
    throw new Error("La photo depasse 5 Mo. Reduisez-la avant de reessayer.");
  }
}

async function clearMemberPhotoFolder(supabase: SupabaseClient, memberId: string) {
  const folderPath = `member/${memberId}`;
  const { data, error } = await supabase.storage.from(MEMBER_PHOTO_BUCKET).list(folderPath, {
    limit: 20,
  });

  if (error) {
    throw error;
  }

  const paths = (data ?? [])
    .filter((item) => item.name && item.name !== ".emptyFolderPlaceholder")
    .map((item) => `${folderPath}/${item.name}`);

  if (paths.length === 0) {
    return;
  }

  const { error: removeError } = await supabase.storage.from(MEMBER_PHOTO_BUCKET).remove(paths);
  if (removeError) {
    throw removeError;
  }
}

export async function replaceMemberPhoto(
  supabase: SupabaseClient,
  memberId: string,
  file: File,
): Promise<string> {
  validateMemberPhotoFile(file);
  await clearMemberPhotoFolder(supabase, memberId);

  const extension = getFileExtension(file);
  const objectPath = `member/${memberId}/photo.${extension}`;
  const { error } = await supabase.storage.from(MEMBER_PHOTO_BUCKET).upload(objectPath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return objectPath;
}

export async function removeMemberPhoto(
  supabase: SupabaseClient,
  storedValue: string | null | undefined,
) {
  if (!isStoragePhotoPath(storedValue)) {
    return;
  }

  const { error } = await supabase.storage.from(MEMBER_PHOTO_BUCKET).remove([storedValue]);
  if (error) {
    throw error;
  }
}

export async function resolveMemberPhotoPreviewUrl(
  supabase: SupabaseClient,
  storedValue: string | null | undefined,
): Promise<string | null> {
  if (!storedValue) {
    return null;
  }

  if (!isStoragePhotoPath(storedValue)) {
    return storedValue;
  }

  const { data, error } = await supabase.storage
    .from(MEMBER_PHOTO_BUCKET)
    .createSignedUrl(storedValue, 60 * 60);

  if (error) {
    console.error("Unable to create signed member photo URL", error);
    return null;
  }

  return data.signedUrl;
}
