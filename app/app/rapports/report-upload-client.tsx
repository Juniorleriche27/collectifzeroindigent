"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  currentFileUrl?: string | null;
  currentFileName?: string | null;
};

const REPORT_BUCKET = "activity-reports";
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export function ReportUploadClient({ currentFileUrl, currentFileName }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>(currentFileUrl ?? "");
  const [uploadedName, setUploadedName] = useState<string>(currentFileName ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > MAX_SIZE_BYTES) {
      setError("Le fichier dépasse 20 Mo.");
      return;
    }

    const allowed = ["application/pdf", "application/vnd.ms-word", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type) && !file.name.endsWith(".pdf")) {
      setError("Seuls les fichiers PDF et Word sont acceptés.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Dynamic import to avoid SSR issues
      const { createBrowserClient } = await import("@supabase/ssr");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      const ext = file.name.split(".").pop() ?? "pdf";
      const timestamp = Date.now();
      const path = `reports/${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

      const { error: uploadError } = await supabase.storage
        .from(REPORT_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

      if (uploadError) throw uploadError;

      void ext; // used in path above
      setUploadedUrl(path);
      setUploadedName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du téléversement.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Hidden inputs for form submission */}
      <input name="file_url" type="hidden" value={uploadedUrl} />
      <input name="file_name" type="hidden" value={uploadedName} />

      {uploadedUrl ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted-surface/60 px-4 py-3">
          <div className="flex-1 truncate text-sm">
            <p className="font-medium text-foreground">{uploadedName || uploadedUrl}</p>
            <p className="truncate text-xs text-muted">{uploadedUrl}</p>
          </div>
          <Button
            onClick={() => { setUploadedUrl(""); setUploadedName(""); }}
            size="sm"
            type="button"
            variant="ghost"
          >
            <X size={14} />
          </Button>
        </div>
      ) : (
        <div
          className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border px-6 py-8 text-center transition-colors hover:border-primary/50"
          onClick={() => inputRef.current?.click()}
        >
          <FileUp className="text-muted" size={32} />
          <div>
            <p className="text-sm font-medium">
              Cliquez ou déposez un fichier PDF / Word
            </p>
            <p className="mt-1 text-xs text-muted">Maximum 20 Mo</p>
          </div>
          {uploading ? (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Loader2 className="animate-spin" size={14} />
              Téléversement en cours…
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      )}

      <Input
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) void handleFile(e.target.files[0]); }}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}
