import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-12">
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
              By accessing and using Krolist, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our platform.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Description of Service</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              Krolist is a price comparison and product tracking platform that helps users find the best deals across multiple online stores. We provide product search, price tracking, and affiliate links to partner retailers including Noon, Amazon, Shein, and others.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
            <Separator className="my-4" />
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                To use certain features of our service, you must create an account. You agree to:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Provide accurate and complete registration information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Maintain the security of your password and account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Accept responsibility for all activities under your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Notify us immediately of any unauthorized use</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
            <Separator className="my-4" />
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                You agree not to use our service to:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Violate any laws or regulations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Infringe on intellectual property rights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Transmit malicious code or viruses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Attempt to gain unauthorized access to our systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Scrape or harvest data from our platform without permission</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Affiliate Relationships</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              Krolist participates in affiliate programs with various retailers. When you click on product links and make purchases, we may earn a commission at no additional cost to you. These affiliate relationships do not affect the prices you pay or the objectivity of our price comparisons.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Price Information</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed mb-4">
              While we strive to provide accurate and up-to-date price information, prices are subject to change without notice. We do not guarantee the accuracy of prices displayed on our platform. Always verify prices on the retailer's website before making a purchase.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We are not responsible for pricing errors or discrepancies between our platform and partner retailers.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              Krolist is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of our platform, including but not limited to direct, indirect, incidental, or consequential damages. We are not responsible for the quality, safety, or legality of products purchased through affiliate links.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">User Content</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of any content you submit to our platform. By submitting content, you grant us a worldwide, non-exclusive license to use, reproduce, and display your content in connection with our services. You represent that you have the right to submit such content.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Termination</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our discretion. You may terminate your account at any time through the settings page.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              We may modify these Terms of Service at any time. Continued use of our platform after changes constitutes acceptance of the modified terms. We will notify users of significant changes via email or platform notifications.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at krolist.help@gmail.com or through our Contact Us page.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
