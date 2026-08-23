import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageEditModal } from "@/components/ImageEditModal";

/**
 * Small image field with a URL input, file upload, and a crop/resize modal on
 * save. Emits a URL string (either the original http URL or an embedded
 * data-URI once the user uploads/crops something). Shared between the admin
 * staff dialog, the company editor, and the public join page.
 */
export function ImageUploader({
  value,
  onChange,
  placeholder,
  aspect,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Optional locked aspect ratio passed through to the crop modal */
  aspect?: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [editSrc, setEditSrc] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 8_000_000) {
      alert("Please pick an image under 8MB.");
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = String(reader.result || "");
      setEditSrc(dataUri);
      setLoading(false);
    };
    reader.onerror = () => setLoading(false);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "https://…/image.png"}
          disabled={value.startsWith("data:")}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          {loading ? "Loading…" : "Upload"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/svg+xml"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />
      </div>
      {value && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <img
            src={value}
            alt=""
            className="h-10 w-auto max-w-[120px] object-contain border border-border rounded bg-background p-1"
          />
          <span className="truncate flex-1">
            {value.startsWith("data:") ? "Uploaded image (embedded)" : value}
          </span>
          <button
            type="button"
            onClick={() => setEditSrc(value)}
            className="text-primary hover:underline mr-2"
          >
            Crop / resize
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-destructive hover:underline"
          >
            Remove
          </button>
        </div>
      )}
      {editSrc && (
        <ImageEditModal
          open={!!editSrc}
          src={editSrc}
          aspect={aspect}
          onClose={() => setEditSrc(null)}
          onSave={(dataUri) => onChange(dataUri)}
        />
      )}
    </div>
  );
}
