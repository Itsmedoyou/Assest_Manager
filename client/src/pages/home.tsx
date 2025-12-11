import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Document, DocumentCategory } from "@shared/schema";
import { documentCategories } from "@shared/schema";
import { UploadZone } from "@/components/UploadZone";
import { DocumentTable } from "@/components/DocumentTable";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { PDFPreviewDialog } from "@/components/PDFPreviewDialog";
import { FileText, Shield, LogOut, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const categoryLabels: Record<DocumentCategory | "all", string> = {
  all: "All Categories",
  prescription: "Prescriptions",
  test_result: "Test Results",
  referral: "Referrals",
  other: "Other",
};

export default function Home() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [documentToPreview, setDocumentToPreview] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | "all">("all");

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = searchQuery === "" || 
        doc.originalFilename.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchQuery, categoryFilter]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document deleted",
        description: "The document has been removed successfully.",
      });
      setDocumentToDelete(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete the document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDownload = (doc: Document) => {
    const link = document.createElement("a");
    link.href = `/api/documents/${doc.id}/download`;
    link.download = doc.originalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (doc: Document) => {
    setDocumentToPreview(doc);
  };

  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc);
  };

  const handleConfirmDelete = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete.id);
    }
  };

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    toast({
      title: "Document uploaded",
      description: "Your PDF has been uploaded successfully.",
    });
  };

  const handleUploadError = (message: string) => {
    toast({
      title: "Upload failed",
      description: message,
      variant: "destructive",
    });
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || "User";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="pb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-semibold text-foreground" data-testid="text-page-title">
                My Medical Documents
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={getUserDisplayName()} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-user-name">
                  {getUserDisplayName()}
                </span>
              </div>
              <Button variant="ghost" size="sm" asChild data-testid="button-logout">
                <a href="/api/logout">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </a>
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-base">
            Securely manage your prescriptions, test results, and referral notes
          </p>
        </header>

        <section className="mb-12">
          <UploadZone 
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </section>

        <section className="py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground" data-testid="text-documents-header">
                Your Documents
              </h2>
              {!isLoading && (
                <span className="text-sm text-muted-foreground" data-testid="text-document-count">
                  ({filteredDocuments.length}{filteredDocuments.length !== documents.length ? ` of ${documents.length}` : ""})
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value as DocumentCategory | "all")}
              >
                <SelectTrigger className="w-40" data-testid="select-filter-category">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="option-filter-all">
                    {categoryLabels.all}
                  </SelectItem>
                  {documentCategories.map((cat) => (
                    <SelectItem key={cat} value={cat} data-testid={`option-filter-${cat}`}>
                      {categoryLabels[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-md">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <DocumentTable
              documents={filteredDocuments}
              onDownload={handleDownload}
              onDelete={handleDeleteClick}
              onPreview={handlePreview}
            />
          )}
        </section>

        <footer className="pt-16 pb-8 border-t">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Secure patient portal - Your data is encrypted</span>
          </div>
        </footer>
      </div>

      <DeleteConfirmationDialog
        open={!!documentToDelete}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
        documentName={documentToDelete?.originalFilename || ""}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />

      <PDFPreviewDialog
        document={documentToPreview}
        open={!!documentToPreview}
        onOpenChange={(open) => !open && setDocumentToPreview(null)}
        onDownload={handleDownload}
        onError={(message) => toast({ title: "Preview Error", description: message, variant: "destructive" })}
      />
    </div>
  );
}
