import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { BrandConfig, Staff } from "@shared/schema";
import { renderSignatureHtml, renderSignaturePlain } from "@/lib/renderSignature";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Code2, Check } from "lucide-react";

interface Props {
  brand: BrandConfig;
  staff: Staff;
  showCopy?: boolean;
  /**
   * Plan the signature is being rendered under — drives free-plan
   * watermarking. Optional so preview-only surfaces don't have to pass it.
   */
  plan?: string;
  /** When provided, adds drag handles on images to resize live. */
  onResizeLogo?: (px: number) => void;
  onResizeBanner?: (px: number) => void;
  onResizePhoto?: (px: number) => void;
}

type HandleKind = "logo" | "banner" | "photo";

interface Handle {
  kind: HandleKind;
  // Position (in the resize-layer's local coords) of the image's bottom-right corner.
  x: number;
  y: number;
}

export function SignaturePreview({
  brand,
  staff,
  showCopy = true,
  plan,
  onResizeLogo,
  onResizeBanner,
  onResizePhoto,
}: Props) {
  const outerRef = useRef<HTMLDivElement>(null); // scroll/padded container
  const layerRef = useRef<HTMLDivElement>(null); // absolute positioning parent (same rect as outer)
  const previewRef = useRef<HTMLDivElement>(null); // HTML content
  const scaleWrapRef = useRef<HTMLDivElement>(null); // fixed-height wrapper that gets scale-adjusted
  const [copied, setCopied] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [scale, setScale] = useState(1);
  const { toast } = useToast();

  // Natural (unscaled) width of the signature content. Matches min-width below.
  const NATURAL_WIDTH = 560;

  const html = useMemo(() => renderSignatureHtml({ brand, staff, plan }), [brand, staff, plan]);
  const plain = useMemo(() => renderSignaturePlain({ brand, staff, plan }), [brand, staff, plan]);

  const [handles, setHandles] = useState<Handle[]>([]);

  // Locate resize targets and cache the current handle positions in the
  // layer's *natural* (unscaled) coordinate system. Handles live inside the
  // scaled layer, so their `left`/`top` values must be in pre-transform coords
  // — dividing by the active scale converts screen-space rects back.
  const measure = (currentScale: number) => {
    const preview = previewRef.current;
    const layer = layerRef.current;
    if (!preview || !layer) return;

    const s = currentScale || 1;
    const layerRect = layer.getBoundingClientRect();

    const imgs = Array.from(preview.querySelectorAll("img"));
    const next: Handle[] = [];
    imgs.forEach((img) => {
      if (!img.complete || img.naturalWidth === 0) return;
      const src = img.getAttribute("src") || "";
      let kind: HandleKind | null = null;
      if (brand.bannerUrl && src === brand.bannerUrl && onResizeBanner) kind = "banner";
      else if (brand.logoUrl && src === brand.logoUrl && onResizeLogo) kind = "logo";
      else if (
        onResizePhoto &&
        img.clientWidth >= 40 &&
        !src.startsWith("data:image/svg+xml") &&
        src !== brand.logoUrl &&
        src !== brand.bannerUrl
      )
        kind = "photo";
      if (!kind) return;
      const r = img.getBoundingClientRect();
      // Screen-space delta from layer's top-left → natural coords via /s.
      next.push({
        kind,
        x: (r.right - layerRect.left) / s,
        y: (r.bottom - layerRect.top) / s,
      });
    });
    setHandles(next);
  };

  // Fit the signature inside its container by scaling it down when the viewport
  // is narrower than the natural (email-client) width. Never scale up.
  // Returns the scale that was applied so callers can measure with it.
  const fit = (): number => {
    const outer = outerRef.current;
    const layer = layerRef.current;
    const wrap = scaleWrapRef.current;
    if (!outer || !layer || !wrap) return scale;
    // Available width = scaleWrap's own content-box width (it's the tightest
    // constraint; outer has padding so scaleWrap.clientWidth < outer.clientWidth).
    // Subtract a 12px safety margin so resize handles (which stick 10px out of
    // their anchor image via -ml-2.5) don't get clipped by the wrap edge.
    const available = Math.max(0, wrap.clientWidth - 12);
    const naturalW = Math.max(layer.scrollWidth, NATURAL_WIDTH);
    const s = Math.min(1, available / naturalW);
    setScale(s);
    // Set the wrapper's height so it consumes the visually-scaled height, plus
    // a small overflow allowance for handles that sit just past image bottom.
    const naturalH = layer.offsetHeight;
    wrap.style.height = `${Math.ceil(naturalH * s) + 6}px`;
    return s;
  };

  // Re-measure and refit whenever the html changes or size props update.
  useLayoutEffect(() => {
    const run = () => {
      const s = fit();
      measure(s);
    };
    run();
    const preview = previewRef.current;
    if (!preview) return;
    const imgs = Array.from(preview.querySelectorAll("img"));
    imgs.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", run);
      img.addEventListener("error", run);
    });
    // Retry a few times because in-app WebViews sometimes report 0 layout
    // dimensions on the first paint.
    const timers = [100, 300, 700, 1500].map((ms) => window.setTimeout(run, ms));
    return () => {
      imgs.forEach((img) => {
        img.removeEventListener("load", run);
        img.removeEventListener("error", run);
      });
      timers.forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, brand.logoWidth, brand.bannerWidth, brand.photoSize]);

  // Re-fit + re-measure on any size change of the container.
  useEffect(() => {
    if (!outerRef.current) return;
    const ro = new ResizeObserver(() => {
      const s = fit();
      measure(s);
    });
    ro.observe(outerRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drag handler using window-level listeners for reliability.
  const startDrag = (kind: HandleKind, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Read the CURRENT stored size for that kind so drag deltas are correct.
    const startVal =
      kind === "logo"
        ? brand.logoWidth
        : kind === "banner"
        ? brand.bannerWidth
        : brand.photoSize;
    const startX = e.clientX;
    // Drag deltas are in screen pixels — divide by the current display scale so
    // one pixel of finger movement equals one pixel of natural-size change.
    const activeScale = scale || 1;

    const min = kind === "photo" ? 48 : kind === "logo" ? 40 : 120;
    const max = kind === "photo" ? 140 : kind === "logo" ? 400 : 720;

    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / activeScale;
      const next = Math.round(Math.min(max, Math.max(min, startVal + dx)));
      if (kind === "logo") onResizeLogo?.(next);
      else if (kind === "banner") onResizeBanner?.(next);
      else if (kind === "photo") onResizePhoto?.(next);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  async function copy() {
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([plain], { type: "text/plain" }),
          }),
        ]);
      } else if (previewRef.current) {
        const range = document.createRange();
        range.selectNodeContents(previewRef.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        document.execCommand("copy");
        sel?.removeAllRanges();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast({
        title: "Signature copied",
        description: "Paste into Outlook, Gmail or Apple Mail signature settings.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Try the HTML button and paste manually.",
        variant: "destructive",
      });
    }
  }

  async function copyHtml() {
    await navigator.clipboard.writeText(html);
    toast({ title: "HTML copied", description: "Paste as source in your email client." });
  }

  const showHandles = !!(onResizeLogo || onResizeBanner || onResizePhoto);

  return (
    <div className="space-y-3">
      <div
        ref={outerRef}
        className="relative border border-border rounded-lg bg-white p-4 sm:p-6 overflow-hidden max-w-full"
      >
        {/* Scale wrapper: takes on the *visual* scaled height so the page
            layout below never gets pushed by the natural (unscaled) content.
            The natural-size layer inside is transformed with scale + top-left
            origin. Resize handles live inside the layer and inherit the
            transform for free. */}
        {/* NOTE: overflow-visible so resize handles that anchor at the image
            edge stay visible (they extend ~10px past their anchor). Vertical
            overflow is bounded by the height we set in fit(). */}
        <div ref={scaleWrapRef} className="relative w-full">
          <div
            ref={layerRef}
            className="relative"
            style={{
              minWidth: NATURAL_WIDTH,
              width: "max-content",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div
              ref={previewRef}
              dangerouslySetInnerHTML={{ __html: html }}
              data-testid="signature-preview"
            />
            {showHandles &&
              handles.map((h, i) => (
                <div
                  key={`${h.kind}-${i}`}
                  onPointerDown={(e) => startDrag(h.kind, e)}
                  title={`Drag to resize ${h.kind}`}
                  className="absolute z-10 w-5 h-5 -ml-2.5 -mt-2.5 rounded-sm bg-primary border-2 border-white shadow-md cursor-nwse-resize hover:scale-125 active:scale-125 transition-transform touch-none"
                  style={{ left: h.x, top: h.y }}
                />
              ))}
          </div>
        </div>
      </div>

      {showHandles && (
        <p className="text-[11px] text-muted-foreground -mt-1">
          Tip: drag the blue square at the corner of any image to resize it.
        </p>
      )}

      {showCopy && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={copy}
            data-testid="button-copy-signature"
            className="gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy signature"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowHtml((v) => !v)}
            data-testid="button-toggle-html"
            className="gap-2"
          >
            <Code2 className="w-4 h-4" /> {showHtml ? "Hide HTML" : "View HTML"}
          </Button>
          {showHtml && (
            <Button
              variant="ghost"
              onClick={copyHtml}
              data-testid="button-copy-html"
              size="sm"
            >
              Copy HTML source
            </Button>
          )}
        </div>
      )}

      {showHtml && (
        <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64 font-mono border border-border">
          {html}
        </pre>
      )}
    </div>
  );
}
