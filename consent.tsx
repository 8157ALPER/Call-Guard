import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Shield, Info, AlertTriangle } from "lucide-react";

export default function Consent() {
  const [, setLocation] = useLocation();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);
  const [acceptedDataCollection, setAcceptedDataCollection] = useState(false);

  // Define interfaces for our data structures
  interface UserConsent {
    acceptedTerms: boolean;
    acceptedPrivacyPolicy: boolean;
    acceptedDataCollection: boolean;
    id: number;
    timestamp: string;
  }
  
  interface ConsentStatus {
    hasConsent: boolean;
  }

  // Get current consent status
  const { data: consentData } = useQuery<UserConsent>({
    queryKey: ["/api/consent"],
    retry: false,
  });

  // Set initial states from server data if available
  useEffect(() => {
    if (consentData) {
      setAcceptedTerms(consentData.acceptedTerms);
      setAcceptedPrivacyPolicy(consentData.acceptedPrivacyPolicy);
      setAcceptedDataCollection(consentData.acceptedDataCollection);
    }
  }, [consentData]);

  // Check if all consent has been given
  const { data: consentStatus, isSuccess } = useQuery<ConsentStatus>({
    queryKey: ["/api/consent/status"],
    retry: false,
  });

  // Redirect to home page if user has already given all consent
  useEffect(() => {
    if (isSuccess && consentStatus?.hasConsent) {
      setLocation("/");
    }
  }, [isSuccess, consentStatus, setLocation]);

  // Update consent preferences
  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      console.log("Sending consent data to server:", data);
      return apiRequest("PATCH", "/api/consent", data);
    },
    onSuccess: (data) => {
      console.log("Consent update successful:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/consent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consent/status"] });
      
      // Directly update window location instead of using setLocation
      window.location.href = "/?bypass=true";
    },
    onError: (error) => {
      console.error("Consent update error:", error);
      // On error, also provide a bypass link
      alert("There was an error saving your consent. Click OK to continue with limited access.");
      window.location.href = "/?bypass=true";
    }
  });

  const allConsentsAccepted = acceptedTerms && acceptedPrivacyPolicy && acceptedDataCollection;

  const handleSubmit = () => {
    if (allConsentsAccepted) {
      console.log("Submitting consent with:", {
        acceptedTerms,
        acceptedPrivacyPolicy,
        acceptedDataCollection,
      });
      updateMutation.mutate({
        acceptedTerms,
        acceptedPrivacyPolicy,
        acceptedDataCollection,
      });
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <Card className="w-full border-2 overflow-hidden shadow-xl">
        <CardHeader className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Shield className="h-20 w-20 drop-shadow-lg" />
            </div>
            <CardTitle className="text-4xl md:text-5xl font-bold tracking-wide">
              Welcome to Call Guardian
            </CardTitle>
            <CardDescription className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
              Your protection starts here. Please review and accept our terms to continue.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <Alert className="mb-8 border-2 border-blue-200 bg-blue-50">
            <Info className="h-6 w-6 text-blue-600" />
            <AlertTitle className="text-xl font-semibold text-blue-800">Important Notice</AlertTitle>
            <AlertDescription className="text-lg text-blue-700 mt-2">
              Call Guardian analyzes your calls to protect you from fraud. We need your permission to access and analyze your call data to keep you safe.
            </AlertDescription>
          </Alert>

          <div className="space-y-8">
            <div>
              <div className="flex items-start space-x-4 mb-4">
                <Checkbox 
                  id="terms" 
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-2 h-6 w-6"
                />
                <Label 
                  htmlFor="terms" 
                  className="text-xl font-semibold leading-relaxed cursor-pointer text-gray-800"
                >
                  I agree to the Terms of Service
                </Label>
              </div>
              <ScrollArea className="h-28 rounded-md border p-4">
                <div className="text-sm text-muted-foreground">
                  <p>By using Call Guardian, you agree to:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Allow the application to analyze your incoming and outgoing calls</li>
                    <li>Permit notifications to be sent to your emergency contacts when suspicious calls are detected</li>
                    <li>Use this service at your own risk - we cannot guarantee 100% accuracy in fraud detection</li>
                    <li>Not hold the service responsible for any missed fraudulent calls or false positives</li>
                  </ul>
                </div>
              </ScrollArea>
            </div>

            <Separator />

            <div>
              <div className="flex items-start space-x-3 mb-2">
                <Checkbox 
                  id="privacy" 
                  checked={acceptedPrivacyPolicy}
                  onCheckedChange={(checked) => setAcceptedPrivacyPolicy(checked === true)}
                  className="mt-1 h-5 w-5"
                />
                <Label 
                  htmlFor="privacy" 
                  className="text-lg font-medium leading-none cursor-pointer"
                >
                  I accept the Privacy Policy
                </Label>
              </div>
              <ScrollArea className="h-28 rounded-md border p-4">
                <div className="text-sm text-muted-foreground">
                  <p>Our privacy commitments:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Your call data is only processed for fraud detection purposes</li>
                    <li>We use advanced encryption to protect all your personal information</li>
                    <li>We never sell your data to third parties</li>
                    <li>Call transcripts are only retained for as long as necessary for fraud analysis</li>
                    <li>You can request deletion of your data at any time through the settings page</li>
                  </ul>
                </div>
              </ScrollArea>
            </div>

            <Separator />

            <div>
              <div className="flex items-start space-x-3 mb-2">
                <Checkbox 
                  id="data" 
                  checked={acceptedDataCollection}
                  onCheckedChange={(checked) => setAcceptedDataCollection(checked === true)}
                  className="mt-1 h-5 w-5"
                />
                <Label 
                  htmlFor="data" 
                  className="text-lg font-medium leading-none cursor-pointer"
                >
                  I consent to data collection for call analysis
                </Label>
              </div>
              <div className="rounded-md border p-4">
                <div className="flex items-start space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">
                    This is required for the app to function. Call Guardian needs to analyze call content to protect you.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  We use artificial intelligence to detect potential fraud in your calls. This means that call transcripts are 
                  analyzed by our AI system. Your explicit consent is required by law for this processing.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col p-8 gap-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-center w-full gap-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              size="lg"
              className="text-xl py-6 px-8 rounded-xl font-semibold border-2 hover:scale-105 transition-all duration-200"
            >
              ← Back
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={!allConsentsAccepted || updateMutation.isPending}
              size="lg"
              className="text-xl py-6 px-8 rounded-xl font-semibold hover:scale-105 transition-all duration-200 shadow-lg"
            >
              {updateMutation.isPending ? "Saving..." : "✓ Accept & Continue"}
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-base text-gray-600">Having trouble? <a href="/?bypass=true" className="text-primary hover:underline font-semibold">
              Click here for emergency access
            </a></p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}