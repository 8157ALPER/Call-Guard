import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { insertSettingsSchema, insertSecurityQuestionSchema, type Settings, type InsertSettings, type EmergencyService, type InsertSecurityQuestion } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAccessibility } from "@/lib/accessibilityContext";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Eye, Contrast, Settings as SettingsIcon, Globe, AlertCircle, ShieldQuestion, Trash2, Plus, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type SecurityQuestionDisplay = { id: number; question: string; hint: string | null; isActive: boolean };

export default function Settings() {
  const { toast } = useToast();
  const { data: settings } = useQuery<Settings>({ queryKey: ["/api/settings"] });
  const { data: securityQuestions = [] } = useQuery<SecurityQuestionDisplay[]>({ queryKey: ["/api/security-questions"] });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newHint, setNewHint] = useState("");

  const addQuestionMutation = useMutation({
    mutationFn: async (data: InsertSecurityQuestion) => {
      const res = await apiRequest("POST", "/api/security-questions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security-questions"] });
      setNewQuestion("");
      setNewAnswer("");
      setNewHint("");
      setShowAddForm(false);
      toast({ title: "Security question added", description: "Family members can now use this to verify callers." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not add security question.", variant: "destructive" });
    }
  });

  const toggleQuestionMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/security-questions/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security-questions"] });
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/security-questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security-questions"] });
      toast({ title: "Question removed" });
    }
  });
  const { data: emergencyServices } = useQuery<EmergencyService[]>({ queryKey: ["/api/emergency-services"] });
  const { 
    highContrast, setHighContrast,
    largeText, setLargeText,
    textSizeMultiplier, setTextSizeMultiplier
  } = useAccessibility();

  const form = useForm<InsertSettings>({
    resolver: zodResolver(insertSettingsSchema),
    defaultValues: {
      enableCallScreening: settings?.enableCallScreening ?? true,
      enableSmsAlerts: settings?.enableSmsAlerts ?? true,
      alertPhoneNumber: settings?.alertPhoneNumber ?? "",
      aiSensitivity: settings?.aiSensitivity ?? "medium",
      disableInDisaster: settings?.disableInDisaster ?? true,
      enableAntivirusScan: settings?.enableAntivirusScan ?? true,
      enableCallerWarning: settings?.enableCallerWarning ?? true,
      callerWarningMessage: settings?.callerWarningMessage ?? "This call will be recorded and analyzed for security purposes. Press 1 to continue or 2 to end the call.",
      treatSmsAsSuspicious: settings?.treatSmsAsSuspicious ?? true,
      enableReporting: settings?.enableReporting ?? true,
      reportingFrequency: (settings?.reportingFrequency as "weekly" | "monthly" | "both") ?? "weekly",
      reportRecipientEmails: settings?.reportRecipientEmails ?? "",
      homeCountryCode: settings?.homeCountryCode ?? "US",
      enableEmergencyAlerts: settings?.enableEmergencyAlerts ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: InsertSettings) => {
      const res = await apiRequest("PATCH", "/api/settings", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your changes have been saved successfully.",
      });
    },
  });

  // API calls for generating and sending reports
  const generateReportMutation = useMutation<Response, Error, 'weekly' | 'monthly'>({
    mutationFn: async (period) => {
      return await apiRequest("GET", `/api/reports/${period}`);
    },
    onSuccess: () => {
      toast({
        title: "Report Generated",
        description: "The report has been generated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  });

  const sendReportMutation = useMutation<Response, Error, 'weekly' | 'monthly'>({
    mutationFn: async (period) => {
      return await apiRequest("POST", `/api/reports/${period}/send`);
    },
    onSuccess: () => {
      toast({
        title: "Report Sent",
        description: "The report has been sent to the configured recipients.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send report. Please check recipient email settings.",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="text-center space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border">
        <div className="flex justify-center">
          <SettingsIcon className="h-16 w-16 text-primary drop-shadow-sm" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-wide">
          Settings
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Customize your Call Guardian experience and protection settings
        </p>
      </div>

      <Card className="border-2 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <CardTitle className="text-2xl flex items-center gap-3">
            🛡️ Call Protection Settings
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Configure how Call Guardian protects you from unwanted calls
          </p>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            >
              <FormField
                control={form.control}
                name="enableCallScreening"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Enable Call Screening</FormLabel>
                      <FormDescription>
                        Automatically screen calls from unknown numbers
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableSmsAlerts"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Enable SMS Alerts</FormLabel>
                      <FormDescription>
                        Receive SMS notifications for suspicious calls
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alertPhoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Phone Number</FormLabel>
                    <FormDescription>
                      Phone number to receive SMS alerts
                    </FormDescription>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="tel" placeholder="+1234567890" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aiSensitivity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Sensitivity</FormLabel>
                    <FormDescription>
                      Adjust how sensitive the AI is to potential threats
                    </FormDescription>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sensitivity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="disableInDisaster"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Disable During Disasters</FormLabel>
                      <FormDescription>
                        Automatically disable call screening during natural disasters or emergencies
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="enableAntivirusScan"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Enable Antivirus Scan</FormLabel>
                      <FormDescription>
                        Scan calls for potentially harmful content and malicious patterns
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="enableCallerWarning"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Enable Caller Warning</FormLabel>
                      <FormDescription>
                        Warn incoming callers that their call will be recorded and analyzed
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="callerWarningMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caller Warning Message</FormLabel>
                    <FormDescription>
                      The message to play to incoming callers before connecting
                    </FormDescription>
                    <FormControl>
                      <Input {...field} placeholder="This call will be recorded and analyzed for security purposes. Press 1 to continue or 2 to end the call." />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="treatSmsAsSuspicious"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Treat SMS as Suspicious</FormLabel>
                      <FormDescription>
                        Automatically treat all SMS and messaging communications as suspicious by default
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableReporting"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Enable Statistical Reports</FormLabel>
                      <FormDescription>
                        Generate weekly and monthly statistical reports for authorized entities
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reportingFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Frequency</FormLabel>
                    <FormDescription>
                      Choose how often to generate statistical reports
                    </FormDescription>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="both">Both Weekly & Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reportRecipientEmails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Recipients</FormLabel>
                    <FormDescription>
                      Email addresses of authorized entities to receive reports (comma-separated)
                    </FormDescription>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="law@example.com, finance@example.com" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full text-xl py-6 rounded-xl font-semibold hover:scale-105 transition-all duration-200 shadow-lg"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Saving..." : "💾 Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-2 overflow-hidden border-red-100">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
          <CardTitle className="text-2xl flex items-center gap-3 text-red-700">
            <AlertCircle className="h-7 w-7" />
            Emergency Services Settings
          </CardTitle>
          <p className="text-red-600 mt-2">
            Configure your home country and emergency alert preferences
          </p>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            >
              <FormField
                control={form.control}
                name="homeCountryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Home Country
                    </FormLabel>
                    <FormDescription>
                      Your home country for emergency services. When traveling, you can select a different location from the emergency dialog.
                    </FormDescription>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "US"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-home-country">
                          <SelectValue placeholder="Select your home country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {emergencyServices?.map((service) => (
                          <SelectItem key={service.countryCode} value={service.countryCode}>
                            {service.countryName} ({service.primaryNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableEmergencyAlerts"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Enable Emergency Alerts</FormLabel>
                      <FormDescription>
                        Allow the app to send fraud alerts to your emergency contacts via SMS
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full text-xl py-6 rounded-xl font-semibold bg-red-600 hover:bg-red-700 hover:scale-105 transition-all duration-200 shadow-lg"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Saving..." : "💾 Save Emergency Settings"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="border-2 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <CardTitle className="text-2xl flex items-center gap-3">
            ♿ Accessibility Settings
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Adjust display settings to make the app easier to use
          </p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Contrast className="h-5 w-5" />
                    High Contrast Mode
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Enable higher contrast colors for better visibility
                  </p>
                </div>
                <Switch
                  checked={highContrast}
                  onCheckedChange={setHighContrast}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Large Text Mode
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Use larger text throughout the application
                  </p>
                </div>
                <Switch
                  checked={largeText}
                  onCheckedChange={setLargeText}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Text Size</h3>
                <p className="text-sm text-muted-foreground">
                  Adjust the size of text throughout the application
                </p>
              </div>
              <div className="flex flex-col space-y-4">
                <Slider
                  value={[parseFloat(textSizeMultiplier)]}
                  min={0.8}
                  max={2}
                  step={0.1}
                  onValueChange={(value) => setTextSizeMultiplier(value[0].toString())}
                  className="w-full"
                />
                <div className="flex justify-between">
                  <span className="text-xs">Smaller</span>
                  <span className="text-xs font-medium">
                    {Math.round(parseFloat(textSizeMultiplier) * 100)}%
                  </span>
                  <span className="text-xs">Larger</span>
                </div>
              </div>
              <div className="pt-4">
                <p className="text-sm bg-muted p-2 rounded-md">
                  These settings are saved automatically and apply immediately.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-2 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <CardTitle className="text-2xl flex items-center gap-3">
            📊 Report Management
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Generate and send statistical reports to authorized recipients
          </p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Generate Reports</h3>
              <p className="text-sm text-muted-foreground">
                Manually generate reports for specific time periods
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => generateReportMutation.mutate('weekly')}
                disabled={generateReportMutation.isPending}
              >
                Generate Weekly Report
              </Button>
              <Button 
                onClick={() => generateReportMutation.mutate('monthly')}
                disabled={generateReportMutation.isPending}
              >
                Generate Monthly Report
              </Button>
            </div>
            
            <div className="space-y-2 pt-4">
              <h3 className="text-lg font-medium">Send Reports</h3>
              <p className="text-sm text-muted-foreground">
                Send generated reports to configured recipients
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => sendReportMutation.mutate('weekly')}
                disabled={sendReportMutation.isPending || !form.getValues("reportRecipientEmails")}
                variant="outline"
              >
                Send Weekly Report
              </Button>
              <Button 
                onClick={() => sendReportMutation.mutate('monthly')}
                disabled={sendReportMutation.isPending || !form.getValues("reportRecipientEmails")}
                variant="outline"
              >
                Send Monthly Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Questions Card */}
      <Card className="border-2 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b">
          <CardTitle className="text-2xl flex items-center gap-3">
            <ShieldQuestion className="h-7 w-7 text-purple-600" />
            Security Questions
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Family members register secret questions here. When an unknown caller phones, they must answer one correctly before the call connects — protecting against AI-powered scam calls that imitate loved ones.
          </p>
        </CardHeader>
        <CardContent className="p-8 space-y-6">

          {/* How it works banner */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex gap-3">
            <ShieldQuestion className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
            <div className="text-sm text-purple-800 space-y-1">
              <p className="font-semibold">How it works</p>
              <p>When an unknown number calls, your phone system will ask them one of these questions. Only genuine family members will know the answer. Wrong answer → call is flagged as suspicious.</p>
            </div>
          </div>

          {/* List of existing questions */}
          {securityQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ShieldQuestion className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg">No security questions yet</p>
              <p className="text-sm">Add your first question below to start protecting against scam calls</p>
            </div>
          ) : (
            <div className="space-y-3">
              {securityQuestions.map((q) => (
                <div key={q.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${q.isActive ? "border-purple-200 bg-purple-50" : "border-gray-200 bg-gray-50 opacity-60"}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">{q.question}</p>
                    {q.hint && (
                      <p className="text-sm text-gray-500 mt-1">💡 Hint: {q.hint}</p>
                    )}
                    <Badge variant={q.isActive ? "default" : "secondary"} className="mt-2 text-xs">
                      {q.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleQuestionMutation.mutate({ id: q.id, isActive: !q.isActive })}
                      disabled={toggleQuestionMutation.isPending}
                      title={q.isActive ? "Deactivate" : "Activate"}
                    >
                      {q.isActive ? <XCircle className="h-4 w-4 text-orange-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteQuestionMutation.mutate(q.id)}
                      disabled={deleteQuestionMutation.isPending}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Add new question form */}
          {showAddForm ? (
            <div className="space-y-4 bg-gray-50 rounded-xl p-5 border-2 border-dashed border-purple-300">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Plus className="h-4 w-4" /> New Security Question
              </h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Question <span className="text-red-500">*</span></label>
                <Textarea
                  placeholder='e.g. "What is the name of the dog we had when you were a child?"'
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Answer <span className="text-red-500">*</span></label>
                <Input
                  placeholder="e.g. Buddy"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  type="text"
                />
                <p className="text-xs text-gray-500">Answer comparison is case-insensitive and ignores extra spaces</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Hint (optional)</label>
                <Input
                  placeholder="e.g. Think about our family pet in the 1980s"
                  value={newHint}
                  onChange={(e) => setNewHint(e.target.value)}
                />
                <p className="text-xs text-gray-500">A gentle reminder shown to the caller if they struggle — keep it vague so scammers can't guess</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    if (!newQuestion.trim() || !newAnswer.trim()) {
                      toast({ title: "Please fill in the question and answer", variant: "destructive" });
                      return;
                    }
                    addQuestionMutation.mutate({
                      question: newQuestion.trim(),
                      answer: newAnswer.trim(),
                      hint: newHint.trim() || null,
                      isActive: true,
                    });
                  }}
                  disabled={addQuestionMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {addQuestionMutation.isPending ? "Saving..." : "Save Question"}
                </Button>
                <Button variant="outline" onClick={() => { setShowAddForm(false); setNewQuestion(""); setNewAnswer(""); setNewHint(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-2 border-dashed border-purple-300 text-purple-700 hover:bg-purple-50 py-6 text-lg"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Security Question
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
