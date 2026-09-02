import { useQuery, useMutation } from "@tanstack/react-query";
import { CallHistory } from "@/components/calls/call-history";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, Phone, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { Settings, EmergencyService } from "@shared/schema";

export default function Home() {
  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const { data: emergencyServices } = useQuery<EmergencyService[]>({
    queryKey: ["/api/emergency-services"],
  });

  const { toast } = useToast();
  const [transcript, setTranscript] = useState("");
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [currentEmergency, setCurrentEmergency] = useState<EmergencyService | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (data: { transcript: string }) => {
      const res = await apiRequest("POST", "/api/calls/analyze", {
        transcript: data.transcript,
        phoneNumber: "+1234567890" // Test phone number
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calls"] });
      toast({
        title: "Call analyzed",
        description: "The test call has been analyzed successfully.",
      });
      setTranscript("");
    },
  });

  const alertFraudMutation = useMutation({
    mutationFn: async (data: { countryCode: string; description: string; phoneNumber: string }) => {
      const res = await apiRequest("POST", "/api/emergency-services/alert-fraud", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Alert Sent",
        description: `Emergency contacts notified. Local emergency: ${data.emergencyNumber}`,
      });
    },
    onError: () => {
      toast({
        title: "Alert Failed",
        description: "Could not send fraud alert. Please call emergency services directly.",
        variant: "destructive",
      });
    },
  });

  const handleEmergencyClick = () => {
    const homeCountry = settings?.homeCountryCode || "US";
    setSelectedCountry(homeCountry);
    const service = emergencyServices?.find(s => s.countryCode === homeCountry);
    setCurrentEmergency(service || null);
    setEmergencyDialogOpen(true);
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    const service = emergencyServices?.find(s => s.countryCode === countryCode);
    setCurrentEmergency(service || null);
  };

  const handleCallEmergency = () => {
    if (currentEmergency?.primaryNumber) {
      window.location.href = `tel:${currentEmergency.primaryNumber}`;
    }
  };

  const handleReportFraud = () => {
    alertFraudMutation.mutate({
      countryCode: selectedCountry,
      description: "Fraud detected during call",
      phoneNumber: "Unknown"
    });
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border">
        <div className="flex justify-center">
          <Shield className="h-16 w-16 text-primary drop-shadow-sm" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-wide">
          Welcome to Call Guardian
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Your trusted protection against phone fraud and unwanted calls
        </p>
      </div>

      {/* Emergency Services Button */}
      <Card className="overflow-hidden border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="h-7 w-7" />
                Emergency Services
              </h2>
              <p className="text-red-600">
                Instant access to local emergency numbers worldwide
              </p>
            </div>
            <Button 
              onClick={handleEmergencyClick}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white text-xl py-6 px-8 rounded-xl font-bold shadow-lg hover:scale-105 transition-all duration-200"
              data-testid="button-emergency"
            >
              <Phone className="h-6 w-6 mr-2" />
              Emergency Call
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Dialog */}
      <Dialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="h-7 w-7" />
              Emergency Services
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Select your current location to see local emergency numbers. If abroad, select the country you're in.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Current Location
              </label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger className="w-full" data-testid="select-country">
                  <SelectValue placeholder="Select your current country" />
                </SelectTrigger>
                <SelectContent>
                  {emergencyServices?.map((service) => (
                    <SelectItem key={service.countryCode} value={service.countryCode}>
                      {service.countryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentEmergency && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 space-y-4">
                <h3 className="text-lg font-semibold text-red-700">
                  {currentEmergency.countryName} Emergency Numbers
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-red-100">
                    <div className="text-xs text-gray-500 uppercase">Primary</div>
                    <div className="text-2xl font-bold text-red-700">{currentEmergency.primaryNumber}</div>
                  </div>
                  {currentEmergency.policeNumber && (
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="text-xs text-gray-500 uppercase">Police</div>
                      <div className="text-xl font-bold text-blue-700">{currentEmergency.policeNumber}</div>
                    </div>
                  )}
                  {currentEmergency.fireNumber && (
                    <div className="bg-white rounded-lg p-3 border border-orange-100">
                      <div className="text-xs text-gray-500 uppercase">Fire</div>
                      <div className="text-xl font-bold text-orange-700">{currentEmergency.fireNumber}</div>
                    </div>
                  )}
                  {currentEmergency.ambulanceNumber && (
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <div className="text-xs text-gray-500 uppercase">Ambulance</div>
                      <div className="text-xl font-bold text-green-700">{currentEmergency.ambulanceNumber}</div>
                    </div>
                  )}
                </div>
                {currentEmergency.notes && (
                  <p className="text-sm text-gray-600 italic">Note: {currentEmergency.notes}</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleCallEmergency}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white text-lg py-4 font-bold w-full"
                disabled={!currentEmergency}
                data-testid="button-call-emergency"
              >
                <Phone className="h-5 w-5 mr-2" />
                Call {currentEmergency?.primaryNumber || "Emergency"}
              </Button>
              
              <Button 
                onClick={handleReportFraud}
                size="lg"
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 text-lg py-4 font-medium w-full"
                disabled={alertFraudMutation.isPending}
                data-testid="button-report-fraud"
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                {alertFraudMutation.isPending ? "Sending Alert..." : "Report Fraud to Contacts"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Protection Status */}
      <Card className="overflow-hidden border-2">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-800">Protection Status</h2>
              <p className="text-gray-600">Your call screening is currently active and protecting you</p>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              {settings?.enableCallScreening ? (
                <>
                  <Shield className="h-10 w-10 text-green-600" />
                  <div>
                    <div className="text-xl font-semibold text-green-700">Protection Active</div>
                    <div className="text-sm text-green-600">All calls are being monitored</div>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-10 w-10 text-amber-600" />
                  <div>
                    <div className="text-xl font-semibold text-amber-700">Protection Disabled</div>
                    <div className="text-sm text-amber-600">Enable in settings to stay protected</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Analysis */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <CardTitle className="text-2xl flex items-center gap-3">
            <Shield className="h-7 w-7" />
            Test Call Analysis
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Try our AI protection system by entering a sample conversation
          </p>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <Textarea
            placeholder="Enter a conversation transcript to test the AI analysis...

Example: 'Hello, this is John from your bank. We've detected suspicious activity on your account. Please provide your account number and PIN to verify your identity.'"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={6}
            className="min-h-[150px] text-lg p-4 border-2 focus:border-primary/50 transition-colors"
          />
          <Button 
            onClick={() => analyzeMutation.mutate({ transcript })}
            disabled={!transcript || analyzeMutation.isPending}
            size="lg"
            className="w-full text-lg py-6 rounded-xl font-semibold hover:scale-105 transition-all duration-200"
          >
            {analyzeMutation.isPending ? "Analyzing..." : "🔍 Analyze Conversation"}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Calls */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <CardTitle className="text-2xl flex items-center gap-3">
            📞 Recent Call Activity
          </CardTitle>
          <p className="text-gray-600 mt-2">
            View your protected calls and analysis results
          </p>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          <CallHistory />
        </CardContent>
      </Card>
    </div>
  );
}