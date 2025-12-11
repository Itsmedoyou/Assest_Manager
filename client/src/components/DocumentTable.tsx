import type { Document, DocumentCategory } from "@shared/schema";
import { FileText, Download, Trash2, FileX, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DocumentTableProps {
  documents: Document[];
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onPreview?: (doc: Document) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

function formatExactDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const categoryLabels: Record<DocumentCategory, string> = {
  prescription: "Prescription",
  test_result: "Test Result",
  referral: "Referral",
  other: "Other",
};

const categoryVariants: Record<DocumentCategory, "default" | "secondary" | "outline"> = {
  prescription: "default",
  test_result: "secondary",
  referral: "outline",
  other: "outline",
};

export function DocumentTable({ documents, onDownload, onDelete, onPreview }: DocumentTableProps) {
  if (documents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-4 bg-muted rounded-full mb-4">
            <FileX className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No documents found
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Upload your medical documents like prescriptions, test results, or referral notes 
            using the upload area above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Filename</TableHead>
                <TableHead className="w-32">Category</TableHead>
                <TableHead className="w-28">Size</TableHead>
                <TableHead className="w-40">Uploaded</TableHead>
                <TableHead className="w-56 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} data-testid={`row-document-${doc.id}`}>
                  <TableCell>
                    <div className="p-2 bg-primary/10 rounded">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span 
                      className="font-medium text-foreground truncate block max-w-xs"
                      title={doc.originalFilename}
                      data-testid={`text-filename-${doc.id}`}
                    >
                      {doc.originalFilename}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={categoryVariants[doc.category as DocumentCategory] || "outline"}
                      data-testid={`badge-category-${doc.id}`}
                    >
                      {categoryLabels[doc.category as DocumentCategory] || doc.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground" data-testid={`text-filesize-${doc.id}`}>
                      {formatFileSize(doc.filesize)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span 
                          className="text-sm text-muted-foreground cursor-default"
                          data-testid={`text-date-${doc.id}`}
                        >
                          {formatDate(doc.createdAt)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {formatExactDate(doc.createdAt)}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {onPreview && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onPreview(doc)}
                          data-testid={`button-preview-${doc.id}`}
                          aria-label="Preview document"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(doc)}
                        className="gap-2"
                        data-testid={`button-download-${doc.id}`}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(doc)}
                        className="gap-2 text-destructive hover:text-destructive"
                        data-testid={`button-delete-${doc.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="md:hidden space-y-3">
        {documents.map((doc) => (
          <Card key={doc.id} data-testid={`card-document-${doc.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p 
                    className="font-medium text-foreground truncate"
                    title={doc.originalFilename}
                    data-testid={`text-filename-mobile-${doc.id}`}
                  >
                    {doc.originalFilename}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge 
                      variant={categoryVariants[doc.category as DocumentCategory] || "outline"}
                      data-testid={`badge-category-mobile-${doc.id}`}
                    >
                      {categoryLabels[doc.category as DocumentCategory] || doc.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                    <span data-testid={`text-filesize-mobile-${doc.id}`}>
                      {formatFileSize(doc.filesize)}
                    </span>
                    <span>-</span>
                    <span data-testid={`text-date-mobile-${doc.id}`}>
                      {formatDate(doc.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                {onPreview && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPreview(doc)}
                    data-testid={`button-preview-mobile-${doc.id}`}
                    aria-label="Preview document"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(doc)}
                  className="flex-1"
                  data-testid={`button-download-mobile-${doc.id}`}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(doc)}
                  className="flex-1 text-destructive hover:text-destructive"
                  data-testid={`button-delete-mobile-${doc.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
