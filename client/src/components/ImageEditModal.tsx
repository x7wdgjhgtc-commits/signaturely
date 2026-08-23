import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// A lightweight image editor: crop (drag a rectangle), then resize (max output width).
// Emits a PNG or JPEG data URI on save.
export function ImageEditModal({
  open,
  src,
  onClose,
  onSave,
  aspect,
  maxOutputWidth = 1200,
}: {
  open: boolean;
  src: string;
  onClose: () => void;
  onSave: (dataUri: string) => void;
  /** Optional locked aspect ratio e.g. 1 for square, 3 for banner */
  aspect?: number;
  maxOutputWidth?: number;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  // Crop rect in image-natural coordinates.
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [outputWidth, setOutputWidth] = useState(maxOutputWidth);
  const [drag, setDrag] = useState<null | {
    kind: "move" | "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    orig: { x: number; y: number; w: number; h: number };
    scale: number;
  }>(null);
  // When aspect is provided we start with it locked but let the user unlock.
  const [lockAspect, setLockAspect] = useState<boolean>(!!aspect);
  useEffect(() => setLockAspect(!!aspect), [aspect, open]);

  // Initialize crop to a centered rectangle when the image loads or opens.
  useEffect(() => {
    if (!open) {
      setLoaded(false);
      return;
    }
  }, [open, src]);

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNatural({ w, h });
    // Initial crop: full image, or matched to aspect if provided.
    if (aspect) {
      const targetH = w / aspect;
      if (targetH <= h) {
        setCrop({ x: 0, y: (h - targetH) / 2, w, h: targetH });
      } else {
        const targetW = h * aspect;
        setCrop({ x: (w - targetW) / 2, y: 0, w: targetW, h });
      }
    } else {
      setCrop({ x: 0, y: 0, w, h });
    }
    setOutputWidth(Math.min(maxOutputWidth, w));
    setLoaded(true);
  };

  // Scale factor from image-natural px to on-screen px.
  const displayedScale = () => {
    const img = imgRef.current;
    if (!img) return 1;
    return img.clientWidth / img.naturalWidth || 1;
  };

  const startDrag = (kind: NonNullable<typeof drag>["kind"], e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({
      kind,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...crop },
      scale: displayedScale(),
    });
  };

  const moveDrag = (e: React.PointerEvent) => {
    if (!drag) return;
    const dx = (e.clientX - drag.startX) / drag.scale;
    const dy = (e.clientY - drag.startY) / drag.scale;
    const o = drag.orig;
    let x = o.x, y = o.y, w = o.w, h = o.h;
    const clamp = () => {
      w = Math.max(20, Math.min(w, natural.w));
      h = Math.max(20, Math.min(h, natural.h));
      x = Math.max(0, Math.min(x, natural.w - w));
      y = Math.max(0, Math.min(y, natural.h - h));
    };
    const activeAspect = aspect && lockAspect ? aspect : null;
    if (drag.kind === "move") {
      x = o.x + dx;
      y = o.y + dy;
    } else {
      // Resize corners; if aspect is locked, drive size from horizontal delta.
      if (drag.kind === "se") {
        w = o.w + dx;
        h = activeAspect ? w / activeAspect : o.h + dy;
      } else if (drag.kind === "sw") {
        w = o.w - dx;
        h = activeAspect ? w / activeAspect : o.h + dy;
        x = o.x + (o.w - w);
      } else if (drag.kind === "ne") {
        w = o.w + dx;
        h = activeAspect ? w / activeAspect : o.h - dy;
        y = o.y + (o.h - h);
      } else if (drag.kind === "nw") {
        w = o.w - dx;
        h = activeAspect ? w / activeAspect : o.h - dy;
        x = o.x + (o.w - w);
        y = o.y + (o.h - h);
      }
    }
    clamp();
    setCrop({ x, y, w, h });
  };

  const endDrag = (e: React.PointerEvent) => {
    if (drag) (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDrag(null);
  };

  const save = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    const outW = Math.min(outputWidth, crop.w);
    const outH = outW * (crop.h / crop.w);
    canvas.width = Math.round(outW);
    canvas.height = Math.round(outH);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
    // Prefer JPEG for photos, PNG for logos with transparency — detect by alpha sample.
    const px = ctx.getImageData(0, 0, 1, 1).data;
    const hasAlpha = px[3] < 255;
    const dataUri = canvas.toDataURL(hasAlpha ? "image/png" : "image/jpeg", 0.9);
    onSave(dataUri);
    onClose();
  };

  // Overlay geometry in on-screen pixels.
  const scale = displayedScale();
  const rect = {
    left: crop.x * scale,
    top: crop.y * scale,
    width: crop.w * scale,
    height: crop.h * scale,
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crop & resize image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            ref={stageRef}
            className="relative bg-checkerboard rounded-lg overflow-hidden select-none"
            style={{ maxHeight: 480 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt=""
              onLoad={onImgLoad}
              className="block w-full h-auto max-h-[480px] object-contain mx-auto"
              draggable={false}
            />
            {loaded && (
              <div
                className="absolute pointer-events-none"
                style={{ inset: 0 }}
              >
                {/* Dim outside crop */}
                <div
                  className="absolute bg-black/50"
                  style={{ left: 0, top: 0, right: 0, height: rect.top }}
                />
                <div
                  className="absolute bg-black/50"
                  style={{ left: 0, top: rect.top + rect.height, right: 0, bottom: 0 }}
                />
                <div
                  className="absolute bg-black/50"
                  style={{ left: 0, top: rect.top, width: rect.left, height: rect.height }}
                />
                <div
                  className="absolute bg-black/50"
                  style={{ left: rect.left + rect.width, top: rect.top, right: 0, height: rect.height }}
                />
                {/* Crop box */}
                <div
                  className="absolute border-2 border-white shadow-lg pointer-events-auto cursor-move"
                  style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
                  onPointerDown={(e) => startDrag("move", e)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                >
                  {/* Corner handles */}
                  {(["nw", "ne", "sw", "se"] as const).map((k) => (
                    <div
                      key={k}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        startDrag(k, e);
                      }}
                      onPointerMove={moveDrag}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                      className="absolute w-4 h-4 bg-white border-2 border-primary rounded-sm"
                      style={{
                        left: k.endsWith("w") ? -8 : "auto",
                        right: k.endsWith("e") ? -8 : "auto",
                        top: k.startsWith("n") ? -8 : "auto",
                        bottom: k.startsWith("s") ? -8 : "auto",
                        cursor: k === "nw" || k === "se" ? "nwse-resize" : "nesw-resize",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          {loaded && (
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Crop {Math.round(crop.w)} × {Math.round(crop.h)}px
                </span>
                <span>
                  Source {natural.w} × {natural.h}px
                </span>
              </div>
              {aspect && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLockAspect(true)}
                    className={`text-xs px-3 py-1 rounded-full border transition ${
                      lockAspect
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-input text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Locked {aspect === 1 ? "1:1" : aspect === 3 ? "3:1" : `${aspect}:1`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLockAspect(false)}
                    className={`text-xs px-3 py-1 rounded-full border transition ${
                      !lockAspect
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-input text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Free crop
                  </button>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-muted-foreground">Output width</label>
                  <span className="text-xs font-mono">{Math.round(outputWidth)}px</span>
                </div>
                <Slider
                  min={80}
                  max={Math.min(maxOutputWidth, Math.round(crop.w))}
                  step={10}
                  value={[Math.min(outputWidth, Math.round(crop.w))]}
                  onValueChange={(v) => setOutputWidth(v[0])}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Smaller output = smaller embedded file. Recommended: 400–800px.
                </p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!loaded}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
