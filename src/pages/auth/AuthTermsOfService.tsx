import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AuthTermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/auth')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Last updated: October 13, 2025
          </p>
        </div>
      </div>

      {/* Terms of Service Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using our price comparison platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Description of Service</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              Our platform provides price comparison services, allowing users to track and compare prices across multiple online retailers. We aggregate product information and pricing data to help users make informed purchasing decisions.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
            <Separator className="my-4" />
            <div className="space-y-2 text-muted-foreground">
              <p className="leading-relaxed">
                To access certain features of our service, you must create an account. You are responsible for:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Maintaining the confidentiality of your account credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>All activities that occur under your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Notifying us immediately of any unauthorized use</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
            <Separator className="my-4" />
            <div className="space-y-2 text-muted-foreground">
              <p className="leading-relaxed mb-2">You agree not to:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Use the service for any illegal purposes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Attempt to gain unauthorized access to our systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Interfere with or disrupt the service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Use automated systems to scrape or collect data</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Affiliate Relationships</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              We participate in affiliate programs with various retailers. When you click on product links and make purchases, we may earn a commission at no additional cost to you. This helps us maintain and improve our service.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Price Information</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              While we strive to provide accurate and up-to-date pricing information, prices may change without notice. We are not responsible for pricing errors or discrepancies. Always verify the final price on the retailer's website before making a purchase.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              Our service is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to direct, indirect, incidental, or consequential damages.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">User Content</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of any content you submit to our platform. By submitting content, you grant us a license to use, display, and distribute that content in connection with our service.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Termination</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason at our discretion. You may also terminate your account at any time through your account settings.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              We may modify these terms at any time. We will notify users of significant changes by posting the updated terms on this page. Your continued use of the service after such changes constitutes acceptance of the new terms.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at krolist.help@gmail.com
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
