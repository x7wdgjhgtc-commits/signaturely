import { useMemo, useRef, useState } from "react";
import type { BrandConfig, Staff } from "@shared/schema";
import { renderSignatureHtml, renderSignaturePlain } from "@/lib/renderSignature";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Code2, Check } from "lucide-react";

interface Props {
  brand: BrandConfig;
  staff: Staff;
  showCopy?: boolean;
}

export function SignaturePreview({ brand, staff, showCopy = true }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const { toast } = useToast();

  const html = useMemo(() => renderSignatureHtml({ brand, staff }), [brand, staff]);
  const plain = useMemo(() => renderSignaturePlain({ brand, staff }), [brand, staff]);

  async function copy() {
    try {
      // Preferred: rich clipboard with both HTML and text — pastes styled in Gmail/Outlook.
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([plain], { type: "text/plain" }),
          }),
        ]);
      } else if (previewRef.current) {
        // Fallback: select the rendered signature and execCommand copy
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

  return (
    <div className="space-y-3">
      <div className="border border-border rounded-lg bg-white p-6 overflow-auto max-w-full">
        <div
          ref={previewRef}
          dangerouslySetInnerHTML={{ __html: html }}
          data-testid="signature-preview"
        />
      </div>

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
