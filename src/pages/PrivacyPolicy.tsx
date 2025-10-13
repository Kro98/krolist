import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Last updated: October 13, 2025
          </p>
        </div>
      </div>

      {/* Privacy Policy Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to our price comparison platform. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <Separator className="my-4" />
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Account Information</h3>
                <p className="leading-relaxed">
                  When you create an account, we collect your email address, username, and password. This information is used to provide you with access to our services and personalize your experience.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Usage Data</h3>
                <p className="leading-relaxed">
                  We collect information about how you interact with our platform, including products you search for, prices you track, and stores you visit through our affiliate links.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Device Information</h3>
                <p className="leading-relaxed">
                  We automatically collect certain information about your device, including IP address, browser type, and operating system.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <Separator className="my-4" />
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>To provide and maintain our price comparison services</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>To track price changes and send you alerts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>To improve our platform and user experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>To communicate with you about updates and features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>To earn affiliate commissions when you make purchases through our links</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your personal information. Your data is encrypted in transit and at rest. We use secure authentication methods and regularly update our security practices to ensure the highest level of protection.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our platform uses affiliate links to partner stores including Noon, Amazon, and Shein. When you click these links and make a purchase, we may receive a commission. These third-party services have their own privacy policies, and we encourage you to review them.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We use Supabase for backend services, which complies with GDPR and other data protection regulations.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <Separator className="my-4" />
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Access your personal data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Request correction of inaccurate data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Request deletion of your account and data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Opt-out of marketing communications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Export your data in a portable format</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to improve your browsing experience, remember your preferences, and analyze site traffic. You can control cookie settings through your browser preferences.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us through the settings page or reach out to our support team.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
