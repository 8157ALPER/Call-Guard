import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "../storage";
import { 
  insertContactSchema, 
  insertCallSchema, 
  insertSettingsSchema, 
  insertUserConsentSchema,
  insertCallCenterSchema,
  insertSecurityQuestionSchema
} from "@workspace/db";
import { analyzeCall } from "../lib/lib/openai";
import { sendAlert, handleIncomingCall, handleKeyPress, isSmsContentSuspicious } from "../lib/lib/twilio";
import { generateReport, generateAndSendReport, scheduleReports } from "../lib/lib/reporting";

export async function registerRoutes(app: Express): Promise<Server> {
  const deviceId = (res: Response) => {
    const id = res.locals.guardianDeviceId;
    if (typeof id !== "number") throw new Error("Call Guardian device context is missing.");
    return id;
  };

  const requireConsent = async (res: Response) => {
    if (await storage.hasAcceptedAllConsent(deviceId(res))) return true;
    res.status(403).json({ message: "Consent is required before using protection data." });
    return false;
  };

  // Contacts
  app.get("/api/contacts", async (_req, res) => {
    if (!(await requireConsent(res))) return;
    const contacts = await storage.getContacts(deviceId(res));
    res.json(contacts);
  });

  app.post("/api/contacts", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const result = insertContactSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid contact data" });
      return;
    }
    const contact = await storage.createContact(result.data, deviceId(res));
    res.json(contact);
  });

  app.patch("/api/contacts/:id", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const id = parseInt(req.params.id);
    const result = insertContactSchema.partial().safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid contact data" });
      return;
    }
    const contact = await storage.updateContact(id, result.data, deviceId(res));
    res.json(contact);
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const id = parseInt(req.params.id);
    await storage.deleteContact(id, deviceId(res));
    res.status(204).end();
  });

  // Calls
  app.get("/api/calls", async (_req, res) => {
    if (!(await requireConsent(res))) return;
    const calls = await storage.getCalls(deviceId(res));
    res.json(calls);
  });

  app.post("/api/calls/analyze", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const { transcript, phoneNumber } = req.body;
    if (!transcript || !phoneNumber) {
      res.status(400).json({ message: "Missing transcript or phone number" });
      return;
    }

    try {
      console.log("Starting call analysis");
      const analysis = await analyzeCall(transcript);
      console.log("Call analysis completed");

      const call = await storage.createCall({
        phoneNumber,
        duration: "00:00", // Would come from actual call data
        analysis,
        isSuspicious: analysis.risk > 0.7,
        virusScanResult: "pending"
      }, deviceId(res));

      const settings = await storage.getSettings(deviceId(res));
      if (settings.enableSmsAlerts && analysis.risk > 0.7 && settings.alertPhoneNumber) {
        await sendAlert(
          settings.alertPhoneNumber,
          `Suspicious call detected from ${phoneNumber}. Risk level: ${Math.round(analysis.risk * 100)}%`
        );
      }

      res.json(call);
    } catch {
      console.error("Call analysis failed");
      res.status(500).json({ message: "Failed to analyze call" });
    }
  });

  // Settings
  app.get("/api/settings", async (_req, res) => {
    if (!(await requireConsent(res))) return;
    const settings = await storage.getSettings(deviceId(res));
    res.json(settings);
  });

  app.patch("/api/settings", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const result = insertSettingsSchema.partial().safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid settings data" });
      return;
    }
    const settings = await storage.updateSettings(result.data, deviceId(res));
    res.json(settings);
  });
  
  // Virus Scanning
  app.post("/api/calls/:id/scan", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const id = parseInt(req.params.id);
    try {
      const scannedCall = await storage.scanCall(id, deviceId(res));
      res.json(scannedCall);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  });
  
  // User Consent
  app.get("/api/consent", async (_req, res) => {
    const consent = await storage.getUserConsent(deviceId(res));
    res.json(consent);
  });
  
  app.patch("/api/consent", async (req, res) => {
    console.log("Received consent update:", req.body);
    const result = insertUserConsentSchema.partial().safeParse(req.body);
    if (!result.success) {
      console.error("Consent validation failed:", result.error);
      res.status(400).json({ message: "Invalid consent data", errors: result.error });
      return;
    }
    try {
      const consent = await storage.updateUserConsent(result.data, deviceId(res));
      console.log("Updated consent:", consent);
      res.json(consent);
    } catch (error) {
      console.error("Error updating consent:", error);
      res.status(500).json({ message: "Server error updating consent" });
    }
  });
  
  app.get("/api/consent/status", async (_req, res) => {
    const hasConsent = await storage.hasAcceptedAllConsent(deviceId(res));
    console.log("Checking consent status:", hasConsent);
    res.json({ hasConsent });
  });
  
  // Twilio Call Handling
  app.post("/api/calls/incoming", async (req, res) => {
    const { From } = req.body;
    const phoneNumber = From || "unknown";
    
    // Check if we're in disaster mode
    const settings = await storage.getSettings();
    if (settings.disableInDisaster) {
      // In disaster mode, bypass all screening
      res.set('Content-Type', 'text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Dial>${process.env.TWILIO_PHONE_NUMBER}</Dial>
      </Response>`);
      return;
    }
    
    try {
      // Check if the phone number is from a trusted call center
      const isTrustedCallCenter = await storage.isPhoneNumberInCallCenterList(phoneNumber);
      
      if (isTrustedCallCenter) {
        console.log(`Trusted call center detected: ${phoneNumber}`);
        // For trusted call centers, bypass screening and connect directly
        res.set('Content-Type', 'text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>This is a verified call from a trusted organization.</Say>
          <Dial>${process.env.TWILIO_PHONE_NUMBER}</Dial>
        </Response>`);
        return;
      }
      
      // For all other numbers, proceed with regular call screening
      const twimlResponse = await handleIncomingCall(phoneNumber);
      res.set('Content-Type', 'text/xml');
      res.send(twimlResponse);
    } catch (error: any) {
      console.error("Error handling incoming call:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/calls/handle-keypress", async (req, res) => {
    const { Digits } = req.body;
    
    try {
      const twimlResponse = await handleKeyPress(Digits);
      res.set('Content-Type', 'text/xml');
      res.send(twimlResponse);
    } catch (error: any) {
      console.error("Error handling keypress:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // SMS Handling
  app.post("/api/sms/incoming", async (req, res) => {
    const { From, Body } = req.body;
    
    // Check settings
    const settings = await storage.getSettings();
    
    // Check if the SMS sender is a trusted call center
    const isTrustedCallCenter = await storage.isPhoneNumberInCallCenterList(From);
    
    if (isTrustedCallCenter) {
      console.log(`SMS from trusted call center: ${From}`);
      // For trusted call centers, mark as safe
      await storage.createCall({
        phoneNumber: From,
        duration: null,
        analysis: {
          risk: 0.1, // Very low risk for trusted centers
          summary: "SMS from verified organization",
          keywords: ["sms", "trusted"],
          mood: {
            emoji: "✅",
            stressLevel: 1,
            description: "Verified message"
          }
        },
        isSuspicious: false,
        virusScanResult: "clean"
      });
      
      // Respond with empty TwiML
      res.set('Content-Type', 'text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
      return;
    }
    
    // For other senders, process SMS content
    const isSuspicious = settings.treatSmsAsSuspicious || isSmsContentSuspicious(Body);
    
    if (isSuspicious && settings.enableSmsAlerts && settings.alertPhoneNumber) {
      // Send alert about suspicious SMS
      await sendAlert(
        settings.alertPhoneNumber,
        `Suspicious SMS detected from ${From}. Content: ${Body.substring(0, 50)}...`
      );
      
      // Store the SMS as a call record for tracking purposes
      await storage.createCall({
        phoneNumber: From,
        duration: null,
        analysis: {
          risk: 0.8, // High risk for suspicious SMS
          summary: "Suspicious SMS detected",
          keywords: ["sms", "suspicious"],
          mood: {
            emoji: "⚠️",
            stressLevel: 7,
            description: "Potentially harmful message"
          }
        },
        isSuspicious: true,
        virusScanResult: "pending"
      });
      
      // Respond with empty TwiML to acknowledge but not respond to the SMS
      res.set('Content-Type', 'text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
    } else {
      // For non-suspicious SMS, just log it
      await storage.createCall({
        phoneNumber: From,
        duration: null,
        analysis: {
          risk: 0.2, // Low risk
          summary: "Standard SMS",
          keywords: ["sms"],
          mood: {
            emoji: "📱",
            stressLevel: 2,
            description: "Normal message"
          }
        },
        isSuspicious: false,
        virusScanResult: "clean"
      });
      
      // Respond with empty TwiML
      res.set('Content-Type', 'text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
    }
  });

  // Reporting API Endpoints
  app.get("/api/reports/:period", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const period = req.params.period as 'weekly' | 'monthly';
    
    if (period !== 'weekly' && period !== 'monthly') {
      res.status(400).json({ message: "Invalid period. Use 'weekly' or 'monthly'" });
      return;
    }
    
    try {
      const report = await generateReport(period, deviceId(res));
      res.json(report);
    } catch (error: any) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/reports/:period/send", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const period = req.params.period as 'weekly' | 'monthly';
    
    if (period !== 'weekly' && period !== 'monthly') {
      res.status(400).json({ message: "Invalid period. Use 'weekly' or 'monthly'" });
      return;
    }
    
    try {
      const success = await generateAndSendReport(period, deviceId(res));
      if (success) {
        res.json({ message: `${period} report sent successfully` });
      } else {
        res.status(400).json({ message: "Failed to send report. Check recipient email settings." });
      }
    } catch (error: any) {
      console.error("Error sending report:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Call Centers
  app.get("/api/call-centers", async (_req, res) => {
    if (!(await requireConsent(res))) return;
    const callCenters = await storage.getCallCenters(deviceId(res));
    res.json(callCenters);
  });

  app.get("/api/call-centers/:id", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const id = parseInt(req.params.id);
    try {
      const callCenter = await storage.getCallCenter(id, deviceId(res));
      if (!callCenter) {
        res.status(404).json({ message: "Call center not found" });
        return;
      }
      res.json(callCenter);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/call-centers", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const result = insertCallCenterSchema.safeParse({
      ...req.body,
      companyName: req.body.companyName ?? req.body.name,
    });
    if (!result.success) {
      res.status(400).json({
        message: "Invalid call center data",
        errors: result.error.format() 
      });
      return;
    }
    
    try {
      // Check if a call center with this phone number already exists
      const existing = await storage.getCallCenterByPhoneNumber(result.data.phoneNumber, deviceId(res));
      if (existing) {
        res.status(409).json({
          message: "A call center with this phone number already exists" 
        });
        return;
      }
      
      const callCenter = await storage.createCallCenter(result.data, deviceId(res));
      res.status(201).json(callCenter);
    } catch (error: any) {
      console.error("Error creating call center:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/call-centers/:id", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const id = parseInt(req.params.id);
    const result = insertCallCenterSchema.partial().safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({
        message: "Invalid call center data",
        errors: result.error.format() 
      });
      return;
    }
    
    try {
      // If phone number is being updated, check if it conflicts with another call center
      if (result.data.phoneNumber) {
        const existingWithPhoneNumber = await storage.getCallCenterByPhoneNumber(result.data.phoneNumber, deviceId(res));
        if (existingWithPhoneNumber && existingWithPhoneNumber.id !== id) {
          res.status(409).json({
            message: "Another call center with this phone number already exists" 
          });
          return;
        }
      }
      
      const callCenter = await storage.updateCallCenter(id, result.data, deviceId(res));
      res.json(callCenter);
    } catch (error: any) {
      if (error.message === "Call center not found") {
        res.status(404).json({ message: error.message });
      } else {
        console.error("Error updating call center:", error);
        res.status(500).json({ message: error.message });
      }
    }
  });

  app.delete("/api/call-centers/:id", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const id = parseInt(req.params.id);
    try {
      await storage.deleteCallCenter(id, deviceId(res));
      res.status(204).end();
    } catch (error: any) {
      console.error("Error deleting call center:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/verify-phone-number/:phoneNumber", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const { phoneNumber } = req.params;
    
    if (!phoneNumber) {
      res.status(400).json({ message: "Phone number is required" });
      return;
    }
    
    try {
      const isVerified = await storage.isPhoneNumberInCallCenterList(phoneNumber, deviceId(res));
      res.json({ isVerified });
    } catch (error: any) {
      console.error("Error verifying phone number:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Emergency Services
  app.get("/api/emergency-services", async (_req, res) => {
    try {
      const services = await storage.getEmergencyServices();
      res.json(services);
    } catch (error: any) {
      console.error("Error fetching emergency services:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/emergency-services/:countryCode", async (req, res) => {
    const { countryCode } = req.params;
    
    try {
      const service = await storage.getEmergencyServiceByCountry(countryCode);
      if (!service) {
        res.status(404).json({ message: "Emergency service not found for this country" });
        return;
      }
      res.json(service);
    } catch (error: any) {
      console.error("Error fetching emergency service:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/emergency-services/seed", async (_req, res) => {
    try {
      await storage.seedEmergencyServices();
      res.json({ message: "Emergency services data seeded successfully" });
    } catch (error: any) {
      console.error("Error seeding emergency services:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Alert authorities about fraud (SMS to emergency contacts and authorities)
  app.post("/api/emergency-services/alert-fraud", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const { countryCode, description, phoneNumber } = req.body;
    
    try {
      const settings = await storage.getSettings(deviceId(res));
      
      if (!settings.enableEmergencyAlerts) {
        res.status(400).json({ message: "Emergency alerts are disabled in settings" });
        return;
      }
      
      // Get emergency service for the country
      const emergencyService = await storage.getEmergencyServiceByCountry(countryCode || settings.homeCountryCode || "US");
      
      // Get emergency contacts
      const contacts = await storage.getContacts(deviceId(res));
      const emergencyContacts = contacts.filter(c => c.isEmergency);
      
      // Send SMS alerts to emergency contacts
      const alertMessage = `🚨 FRAUD ALERT from Call Guardian!\n\nSuspicious activity detected.\nPhone: ${phoneNumber}\nDetails: ${description}\n\nLocal emergency: ${emergencyService?.primaryNumber || "911"}`;
      
      for (const contact of emergencyContacts) {
        if (contact.phoneNumber) {
          try {
            await sendAlert(contact.phoneNumber, alertMessage);
          } catch (smsError) {
            console.warn(`Failed to send alert to ${contact.name}:`, smsError);
          }
        }
      }
      
      // Also send to alert phone number if configured
      if (settings.alertPhoneNumber) {
        try {
          await sendAlert(settings.alertPhoneNumber, alertMessage);
        } catch (smsError) {
          console.warn("Failed to send alert to primary alert number:", smsError);
        }
      }
      
      res.json({ 
        message: "Fraud alert sent to emergency contacts",
        emergencyNumber: emergencyService?.primaryNumber,
        contactsNotified: emergencyContacts.length + (settings.alertPhoneNumber ? 1 : 0)
      });
    } catch (error: any) {
      console.error("Error sending fraud alert:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Security Questions
  app.get("/api/security-questions", async (_req, res) => {
    if (!(await requireConsent(res))) return;
    const questions = await storage.getSecurityQuestions(deviceId(res));
    // Never return the answers to the frontend listing
    res.json(questions.map(q => ({ id: q.id, question: q.question, hint: q.hint, isActive: q.isActive })));
  });

  app.post("/api/security-questions", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const result = insertSecurityQuestionSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid security question data", errors: result.error });
      return;
    }
    try {
      const q = await storage.createSecurityQuestion(result.data, deviceId(res));
      res.json({ id: q.id, question: q.question, hint: q.hint, isActive: q.isActive });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/security-questions/:id", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const id = parseInt(req.params.id);
    const result = insertSecurityQuestionSchema.partial().safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid security question data" });
      return;
    }
    try {
      const q = await storage.updateSecurityQuestion(id, result.data, deviceId(res));
      res.json({ id: q.id, question: q.question, hint: q.hint, isActive: q.isActive });
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  });

  app.delete("/api/security-questions/:id", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const id = parseInt(req.params.id);
    await storage.deleteSecurityQuestion(id, deviceId(res));
    res.status(204).end();
  });

  // Verify a security answer (used internally / by Twilio webhook)
  app.post("/api/security-questions/:id/verify", async (req, res) => {
    if (!(await requireConsent(res))) return;
    const id = parseInt(req.params.id);
    const { answer } = req.body;
    if (!answer) {
      res.status(400).json({ message: "Answer is required" });
      return;
    }
    const correct = await storage.verifySecurityAnswer(id, answer, deviceId(res));
    res.json({ correct });
  });

  // Seed emergency services on startup
  storage.seedEmergencyServices();
  
  // Start the scheduled reporting service
  scheduleReports();
  
  const httpServer = createServer(app);
  return httpServer;
}