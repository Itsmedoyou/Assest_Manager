import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Loader2 } from "lucide-react";
import type { Document } from "@shared/schema";

interface PDFPreviewDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (doc: Document) => void;
  onError?: (message: string) => void;
}

export function PDFPreviewDialog({ document, open, onOpenChange, onDownload, onError }: PDFPreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !document) {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
        setBlobUrl(null);
      }
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let errorHandled = false;

    const loadPDF = async () => {
      setIsLoading(true);
      
      try {
        const response = await fetch(`/api/documents/${document.id}/preview`, {
          credentials: "include",
          signal: controller.signal,
        });
        
        if (controller.signal.aborted) {
          return;
        }
        
        if (!response.ok) {
          if (!errorHandled) {
            errorHandled = true;
            setIsLoading(false);
            onError?.("Unable to load the PDF preview. The file may be unavailable.");
            onOpenChange(false);
          }
          return;
        }
        
        const blob = await response.blob();
        
        if (controller.signal.aborted) {
          return;
        }
        
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
        setIsLoading(false);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        if (!errorHandled) {
          errorHandled = true;
          setIsLoading(false);
          onError?.("Unable to load the PDF preview. The file may be unavailable.");
          onOpenChange(false);
        }
      }
    };

    loadPDF();

    return () => {
      controller.abort();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [open, document?.id, onOpenChange, onError]);

  if (!document) return null;

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="truncate flex-1" data-testid="text-preview-title">
              {document.originalFilename}
            </DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(document)}
                className="gap-2"
                data-testid="button-preview-download"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenChange(false)}
                data-testid="button-preview-close"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p>Loading preview...</p>
            </div>
          ) : blobUrl ? (
            <iframe
              src={blobUrl}
              className="w-full h-full border-0"
              title={`Preview of ${document.originalFilename}`}
              data-testid="iframe-pdf-preview"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
