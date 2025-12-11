import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Upload, Download, Trash2, Lock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <FileText className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-landing-title">
            Patient Portal
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Securely manage your medical documents. Upload, organize, and access your prescriptions, test results, and referral notes anytime.
          </p>
          <Button size="lg" asChild data-testid="button-sign-in">
            <a href="/api/login">Sign In to Continue</a>
          </Button>
        </header>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-2">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>Easy Upload</CardTitle>
              <CardDescription>
                Drag and drop your PDF documents. We support files up to 10MB.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-2">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>Quick Access</CardTitle>
              <CardDescription>
                Download your documents anytime from any device with internet access.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-2">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>Secure Storage</CardTitle>
              <CardDescription>
                Your medical documents are encrypted and protected with industry standards.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-2">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>Private Access</CardTitle>
              <CardDescription>
                Only you can access your documents. Each user has their own secure space.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-2">
                <Trash2 className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>Full Control</CardTitle>
              <CardDescription>
                Manage your files with ease. Delete documents you no longer need.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2 bg-primary/10 rounded-md w-fit mb-2">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>PDF Support</CardTitle>
              <CardDescription>
                Optimized for medical documents. Upload prescriptions, lab results, and more.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <footer className="text-center pt-8 border-t">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Secure patient portal - Your data is encrypted and protected</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
