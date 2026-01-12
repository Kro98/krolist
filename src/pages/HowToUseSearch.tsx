import { Card } from "@/components/ui/card";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import searchStep1 from "@/assets/how-to-search-step1.jpg";
import searchStep2 from "@/assets/how-to-search-step2.jpg";
import searchStep3 from "@/assets/how-to-search-step3.jpg";
import searchLimitsBadge from "@/assets/search-limits-badge.jpg";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export default function HowToUseSearch() {
  const navigate = useNavigate();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const ImageWithZoom = ({ src, alt }: { src: string; alt: string }) => (
    <Dialog open={zoomedImage === src} onOpenChange={(open) => !open && setZoomedImage(null)}>
      <DialogTrigger asChild>
        <img
          src={src}
          alt={alt}
          className="w-full rounded-lg border border-border cursor-pointer transition-transform duration-300 hover:scale-105 md:hover:scale-110"
          onClick={() => setZoomedImage(src)}
        />
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full p-2" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>{alt}</DialogTitle>
        </VisuallyHidden>
        <img src={src} alt={alt} className="w-full rounded-lg" />
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-14 md:py-16">
          <Button variant="ghost" size="sm" onClick={() => navigate("/search-products")} className="mb-5 gap-2 h-11 px-4">
            <ArrowLeft className="h-5 w-5" />
            Back to Search
          </Button>
          <div className="flex items-center justify-center sm:justify-start gap-4 mb-5">
            <HelpCircle className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">How to Use Product Search</h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground text-center sm:text-left">
            Learn how to find and track the best deals on your favorite products
          </p>
        </div>
      </div>

      {/* Tutorial Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-10 md:py-12">
        <div className="space-y-8 md:space-y-10">
          {/* Section 1 */}
          <Card className="p-6 md:p-10">
            <h2 className="text-2xl md:text-3xl font-semibold mb-5">Step 1: Enter Your Search Query</h2>
            <div className="space-y-4">
              <ImageWithZoom src={searchStep1} alt="Search box example" />
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  In the search box, write all the details you need about the product you are looking for, and click
                  search.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 2 */}
          <Card className="p-6 md:p-10">
            <h2 className="text-2xl md:text-3xl font-semibold mb-5">Step 2: Review Search Results</h2>
            <div className="space-y-4">
              <ImageWithZoom src={searchStep2} alt="Search results example" />
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  The search feature is still under progress; as of now... the Amazon card will take you to amazon.com
                  when you click open, using an affiliate link. It will display the results in their website, you then
                  can copy the link of the product from Amazon, and manually add it to Krolist using the + button.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 3 */}
          <Card className="p-6 md:p-10">
            <h2 className="text-2xl md:text-3xl font-semibold mb-5">Step 3: Track Products</h2>
            <div className="space-y-4">
              <ImageWithZoom src={searchStep3} alt="Track products example" />
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  NOTE: This function is still in early stage, add the details manually for now. Clicking the plus sign gives you the option to go to the search page and add items from there, or manually add the items using a link from the shops list in the side menu. Please consider using the affiliate link as it is a great way to support this project.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 4 */}
          <Card className="p-6 md:p-10">
            <h2 className="text-2xl md:text-3xl font-semibold mb-5">Search Limits & Tips</h2>
            <div className="space-y-4">
              <ImageWithZoom src={searchLimitsBadge} alt="Search limits and shops example" />
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  as of now the search function is limited but we are working to optimize it , we will update you in the
                  very near future, in the mean time clicking on the shops from the side menu and using the codes is
                  fully functional and a great way to support the project .
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
