/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import {
  MEMBER_PHOTO_ACCEPT,
  MEMBER_PHOTO_MAX_SIZE_BYTES,
} from "@/lib/supabase/member-photo";

type MemberPhotoFieldProps = {
  currentPhotoExists: boolean;
  currentPreviewUrl: string | null;
  currentStatusLabel: string;
  disabled: boolean;
  memberName: string;
};

export function MemberPhotoField({
  currentPhotoExists,
  currentPreviewUrl,
  currentStatusLabel,
  disabled,
  memberName,
}: MemberPhotoFieldProps) {
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [removeCurrentPhoto, setRemoveCurrentPhoto] = useState(false);

  useEffect(() => {
    return () => {
      if (selectedPreviewUrl) {
        URL.revokeObjectURL(selectedPreviewUrl);
      }
    };
  }, [selectedPreviewUrl]);

  const previewUrl = useMemo(() => {
    if (selectedPreviewUrl) {
      return selectedPreviewUrl;
    }
    if (removeCurrentPhoto) {
      return null;
    }
    return currentPreviewUrl;
  }, [currentPreviewUrl, removeCurrentPhoto, selectedPreviewUrl]);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium" htmlFor="card-photo-file">
        Photo de la carte
      </label>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted-surface/40 p-4 md:flex-row">
        <div className="flex h-36 w-32 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-surface">
          {previewUrl ? (
            <img
              alt={`Photo de ${memberName || "membre CZI"}`}
              className="h-full w-full object-cover"
              src={previewUrl}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 px-3 text-center text-xs text-muted">
              <ImagePlus size={22} />
              <span>Aperçu photo</span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <input
            accept={MEMBER_PHOTO_ACCEPT}
            className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white disabled:pointer-events-none disabled:opacity-60"
            disabled={disabled}
            id="card-photo-file"
            name="photo_file"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (selectedPreviewUrl) {
                URL.revokeObjectURL(selectedPreviewUrl);
              }

              if (!file) {
                setSelectedPreviewUrl(null);
                setSelectedFileName("");
                return;
              }

              setRemoveCurrentPhoto(false);
              setSelectedFileName(file.name);
              setSelectedPreviewUrl(URL.createObjectURL(file));
            }}
            type="file"
          />

          <div className="space-y-1 text-xs text-muted">
            <p>Formats autorisés : JPG, PNG, WEBP.</p>
            <p>Taille maximale: {Math.round(MEMBER_PHOTO_MAX_SIZE_BYTES / (1024 * 1024))} Mo.</p>
            <p>Statut actuel: {currentStatusLabel}.</p>
            {selectedFileName ? <p>Fichier sélectionné : {selectedFileName}</p> : null}
          </div>

          {currentPhotoExists ? (
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <input
                checked={removeCurrentPhoto}
                disabled={disabled}
                name="remove_photo"
                onChange={(event) => setRemoveCurrentPhoto(event.target.checked)}
                type="checkbox"
                value="1"
              />
              <Trash2 size={16} />
              Supprimer la photo actuelle
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}
