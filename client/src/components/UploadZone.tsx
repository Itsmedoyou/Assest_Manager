import { useCallback, useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { documentCategories, type DocumentCategory } from "@shared/schema";

interface UploadZoneProps {
  onUploadSuccess: () => void;
  onUploadError: (message: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPE = "application/pdf";

const categoryLabels: Record<DocumentCategory, string> = {
  prescription: "Prescription",
  test_result: "Test Result",
  referral: "Referral Note",
  other: "Other",
};

export function UploadZone({ onUploadSuccess, onUploadError }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>("other");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, category }: { file: File; category: DocumentCategory }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setSelectedFile(null);
      setSelectedCategory("other");
      onUploadSuccess();
    },
    onError: (error: Error) => {
      onUploadError(error.message);
    },
  });

  const validateFile = (file: File): string | null => {
    if (file.type !== ACCEPTED_FILE_TYPE) {
      return "Only PDF files are allowed";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 10MB";
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      onUploadError(error);
      return;
    }
    setSelectedFile(file);
  }, [onUploadError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate({ file: selectedFile, category: selectedCategory });
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setSelectedCategory("other");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleInputChange}
        className="hidden"
        data-testid="input-file-upload"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!selectedFile ? handleBrowseClick : undefined}
        className={cn(
          "relative min-h-64 border-2 border-dashed rounded-md p-8 transition-colors",
          "flex flex-col items-center justify-center text-center",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
          uploadMutation.isPending && "pointer-events-none opacity-60",
          !selectedFile && "cursor-pointer"
        )}
        data-testid="dropzone-upload"
      >
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Uploading your document...</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="p-4 bg-primary/10 rounded-md">
              <FileText className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-1 text-center">
              <p className="font-medium text-foreground" data-testid="text-selected-filename">
                {selectedFile.name}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-selected-filesize">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            
            <div className="w-full space-y-2" onClick={(e) => e.stopPropagation()}>
              <Label htmlFor="category-select" className="text-sm font-medium">
                Document Category
              </Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value as DocumentCategory)}
              >
                <SelectTrigger id="category-select" data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {documentCategories.map((cat) => (
                    <SelectItem key={cat} value={cat} data-testid={`option-category-${cat}`}>
                      {categoryLabels[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                className="gap-2"
                data-testid="button-confirm-upload"
              >
                <Upload className="w-4 h-4" />
                Upload PDF
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearFile();
                }}
                data-testid="button-clear-file"
                aria-label="Clear selected file"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 bg-muted rounded-md mb-4">
              <Upload className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">
              Drag & drop PDF files here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PDF files only, max 10MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
