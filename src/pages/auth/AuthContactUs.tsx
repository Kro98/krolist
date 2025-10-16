import { Card } from "@/components/ui/card";
import { Mail, Facebook, Twitter, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AuthContactUs() {
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
            <Mail className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">Contact Us</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            We'd love to hear from you. Get in touch with us!
          </p>
        </div>
      </div>

      {/* Contact Options */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-1 max-w-2xl mx-auto">
          {/* Email Card */}
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Email</h2>
              <p className="text-muted-foreground">
                Send us an email and we'll get back to you as soon as possible.
              </p>
              <a 
                href="mailto:krolist.help@gmail.com"
                className="text-primary hover:underline text-lg font-medium"
              >
                krolist.help@gmail.com
              </a>
            </div>
          </Card>

          {/* Social Media Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Twitter Card */}
            <Card className="p-8 opacity-60">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Twitter className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">Twitter</h2>
                <Button 
                  variant="secondary" 
                  disabled
                  className="w-full"
                >
                  Coming Soon
                </Button>
              </div>
            </Card>

            {/* Facebook Card */}
            <Card className="p-8 opacity-60">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Facebook className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">Facebook</h2>
                <Button 
                  variant="secondary" 
                  disabled
                  className="w-full"
                >
                  Coming Soon
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
