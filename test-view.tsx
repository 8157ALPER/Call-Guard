import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Phone, User, Settings as SettingsIcon, AlertTriangle, CheckCircle } from "lucide-react";
import { CallHistory } from "@/components/calls/call-history";
import { ContactList } from "@/components/contacts/contact-list";
import { ContactForm } from "@/components/contacts/contact-form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Call, Settings } from "@/lib/schema";

// This is a test page that combines all main application features for testing
export default function TestView() {
  const { data: calls = [] } = useQuery<Call[]>({
    queryKey: ["/api/calls"],
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const suspiciousCalls = calls.filter((call) => call.isSuspicious).length;
  
  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold">Call Guardian</CardTitle>
              <CardDescription className="text-white/90 text-lg">
                Full Application Test View
              </CardDescription>
            </div>
            <Shield size={42} className="text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white/20 p-4 rounded-lg text-center">
              <h3 className="font-semibold mb-1">Total Calls</h3>
              <p className="text-3xl font-bold">{calls.length}</p>
            </div>
            <div className="bg-white/20 p-4 rounded-lg text-center">
              <h3 className="font-semibold mb-1">Suspicious</h3>
              <p className="text-3xl font-bold">{suspiciousCalls}</p>
            </div>
            <div className="bg-white/20 p-4 rounded-lg text-center">
              <h3 className="font-semibold mb-1">Protection Status</h3>
              <p className="text-xl font-bold flex justify-center items-center gap-2">
                <CheckCircle size={24} className="text-green-300" />
                Active
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call History Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone size={20} />
              Call History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CallHistory />
          </CardContent>
        </Card>

        {/* Contacts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContactList />
          </CardContent>
          <CardFooter>
            <div className="w-full">
              <h3 className="text-lg font-medium mb-3">Add New Contact</h3>
              <ContactForm />
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon size={20} />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Call Screening</Label>
                <p className="text-sm text-muted-foreground">
                  Screen incoming calls for potential fraud
                </p>
              </div>
              <Switch checked={settings?.enableCallScreening} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">SMS Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Send alerts when suspicious calls are detected
                </p>
              </div>
              <Switch checked={settings?.enableSmsAlerts} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Disaster Mode</Label>
                <div className="flex items-center">
                  <p className="text-sm text-muted-foreground mr-2">
                    Disable screening during emergency situations
                  </p>
                  <Badge variant="destructive" className="uppercase text-xs">Important</Badge>
                </div>
              </div>
              <Switch checked={settings?.disableInDisaster} />
            </div>
            
            <div className="pt-4">
              <Label className="text-base mb-2 block">Alert Phone Number</Label>
              <Input 
                value={settings?.alertPhoneNumber || ""} 
                placeholder="+1 (555) 123-4567" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                Phone number that will receive alerts about suspicious calls
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle size={20} className="text-amber-500" />
            This is a test view
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700">
            This page combines all main features for testing purposes. In the real application, 
            these features are separated across the Home, Contacts, and Settings pages.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}