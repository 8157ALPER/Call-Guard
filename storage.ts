import { 
  type Contact, 
  type Call, 
  type Settings,
  type UserConsent,
  type CallCenter,
  type EmergencyService,
  type SecurityQuestion,
  type Device,
  type InsertContact,
  type InsertCall,
  type InsertSettings,
  type InsertUserConsent,
  type InsertCallCenter,
  type InsertEmergencyService,
  type InsertSecurityQuestion
} from "@workspace/db";
import { db } from "./db";
import { callCenters, calls, contacts, settings, userConsent, emergencyServices, securityQuestions, devices } from "@workspace/db";

// Default data for when database is not available
const defaultSettings: Settings = {
  id: 1,
  deviceId: 0,
  enableCallScreening: true,
  enableSmsAlerts: true,
  alertPhoneNumber: null,
  aiSensitivity: "medium",
  disableInDisaster: true,
  enableAntivirusScan: true,
  enableCallerWarning: true,
  callerWarningMessage: "This call will be recorded and analyzed for security purposes. Press 1 to continue or 2 to end the call.",
  treatSmsAsSuspicious: true,
  enableReporting: true,
  reportingFrequency: "weekly",
  reportRecipientEmails: null,
  highContrastMode: false,
  largeTextMode: false,
  textSizeMultiplier: "1",
  homeCountryCode: "US",
  enableEmergencyAlerts: true,
};

const defaultUserConsent: UserConsent = {
  id: 1,
  deviceId: 0,
  acceptedTerms: false,
  acceptedPrivacyPolicy: false,
  acceptedDataCollection: false,
  timestamp: new Date(),
};
import { and, eq } from "drizzle-orm";

export interface IStorage {
  createDevice(tokenHash: string): Promise<Device>;
  getDeviceByTokenHash(tokenHash: string): Promise<Device | undefined>;
  touchDevice(id: number): Promise<void>;

  // Contacts
  getContacts(deviceId?: number): Promise<Contact[]>;
  getContact(id: number, deviceId?: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact, deviceId?: number): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>, deviceId?: number): Promise<Contact>;
  deleteContact(id: number, deviceId?: number): Promise<void>;
  
  // Calls
  getCalls(deviceId?: number): Promise<Call[]>;
  getCall(id: number, deviceId?: number): Promise<Call | undefined>;
  createCall(call: InsertCall, deviceId?: number): Promise<Call>;
  scanCall(id: number, deviceId?: number): Promise<Call>;
  
  // Settings
  getSettings(deviceId?: number): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>, deviceId?: number): Promise<Settings>;
  
  // User Consent
  getUserConsent(deviceId?: number): Promise<UserConsent>;
  updateUserConsent(consent: Partial<InsertUserConsent>, deviceId?: number): Promise<UserConsent>;
  hasAcceptedAllConsent(deviceId?: number): Promise<boolean>;
  
  // Call Centers
  getCallCenters(deviceId?: number): Promise<CallCenter[]>;
  getCallCenter(id: number, deviceId?: number): Promise<CallCenter | undefined>;
  getCallCenterByPhoneNumber(phoneNumber: string, deviceId?: number): Promise<CallCenter | undefined>;
  createCallCenter(callCenter: InsertCallCenter, deviceId?: number): Promise<CallCenter>;
  updateCallCenter(id: number, callCenter: Partial<InsertCallCenter>, deviceId?: number): Promise<CallCenter>;
  deleteCallCenter(id: number, deviceId?: number): Promise<void>;
  isPhoneNumberInCallCenterList(phoneNumber: string, deviceId?: number): Promise<boolean>;
  
  // Emergency Services
  getEmergencyServices(): Promise<EmergencyService[]>;
  getEmergencyServiceByCountry(countryCode: string): Promise<EmergencyService | undefined>;
  createEmergencyService(service: InsertEmergencyService): Promise<EmergencyService>;
  seedEmergencyServices(): Promise<void>;
  
  // Security Questions
  getSecurityQuestions(deviceId?: number): Promise<SecurityQuestion[]>;
  getActiveSecurityQuestions(deviceId?: number): Promise<SecurityQuestion[]>;
  getSecurityQuestion(id: number, deviceId?: number): Promise<SecurityQuestion | undefined>;
  createSecurityQuestion(question: InsertSecurityQuestion, deviceId?: number): Promise<SecurityQuestion>;
  updateSecurityQuestion(id: number, question: Partial<InsertSecurityQuestion>, deviceId?: number): Promise<SecurityQuestion>;
  deleteSecurityQuestion(id: number, deviceId?: number): Promise<void>;
  verifySecurityAnswer(questionId: number, answer: string, deviceId?: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async createDevice(tokenHash: string): Promise<Device> {
    const [device] = await db.insert(devices).values({ tokenHash, lastSeenAt: new Date() }).returning();
    return device;
  }

  async getDeviceByTokenHash(tokenHash: string): Promise<Device | undefined> {
    const [device] = await db.select().from(devices).where(eq(devices.tokenHash, tokenHash));
    return device;
  }

  async touchDevice(id: number): Promise<void> {
    await db.update(devices).set({ lastSeenAt: new Date() }).where(eq(devices.id, id));
  }

  // CONTACTS
  async getContacts(deviceId = 0): Promise<Contact[]> {
    return db.select().from(contacts).where(eq(contacts.deviceId, deviceId));
  }

  async getContact(id: number, deviceId = 0): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(and(eq(contacts.id, id), eq(contacts.deviceId, deviceId)));
    return contact;
  }

  async createContact(contact: InsertContact, deviceId = 0): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values({ ...contact, deviceId }).returning();
    return newContact;
  }

  async updateContact(id: number, contact: Partial<InsertContact>, deviceId = 0): Promise<Contact> {
    const [updated] = await db
      .update(contacts)
      .set(contact)
      .where(and(eq(contacts.id, id), eq(contacts.deviceId, deviceId)))
      .returning();
    
    if (!updated) throw new Error("Contact not found");
    return updated;
  }

  async deleteContact(id: number, deviceId = 0): Promise<void> {
    await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.deviceId, deviceId)));
  }

  // CALLS
  async getCalls(deviceId = 0): Promise<Call[]> {
    return db.select().from(calls).where(eq(calls.deviceId, deviceId));
  }

  async getCall(id: number, deviceId = 0): Promise<Call | undefined> {
    const [call] = await db.select().from(calls).where(and(eq(calls.id, id), eq(calls.deviceId, deviceId)));
    return call;
  }

  async createCall(call: InsertCall, deviceId = 0): Promise<Call> {
    const [newCall] = await db.insert(calls).values({
      ...call,
      deviceId,
      timestamp: new Date(),
      virusScanResult: call.virusScanResult || "clean"
    }).returning();
    
    return newCall;
  }
  
  async scanCall(id: number, deviceId = 0): Promise<Call> {
    const [call] = await db.select().from(calls).where(and(eq(calls.id, id), eq(calls.deviceId, deviceId)));
    if (!call) throw new Error("Call not found");
    
    // Simulated virus scan using keyword detection in the transcript
    if (call.analysis && call.analysis.keywords) {
      const suspiciousKeywords = ['virus', 'malware', 'hack', 'password', 'account', 'bank', 'credit card'];
      const hasVirus = call.analysis.keywords.some((keyword: string) => 
        suspiciousKeywords.some(suspicious => keyword.toLowerCase().includes(suspicious))
      );
      
      const [updatedCall] = await db
        .update(calls)
        .set({ virusScanResult: hasVirus ? "infected" : "clean" })
        .where(and(eq(calls.id, id), eq(calls.deviceId, deviceId)))
        .returning();
      
      return updatedCall;
    }
    
    return call;
  }

  // SETTINGS
  async getSettings(deviceId = 0): Promise<Settings> {
    try {
      const allSettings = await db.select().from(settings).where(eq(settings.deviceId, deviceId));
      // Return the first settings object or create one if none exists
      if (allSettings.length === 0) {
        try {
          const [newSettings] = await db.insert(settings).values({
            deviceId,
            enableCallScreening: true,
            enableSmsAlerts: true,
            aiSensitivity: "medium",
            disableInDisaster: true,
            enableAntivirusScan: true,
            enableCallerWarning: true,
            callerWarningMessage: "This call will be recorded and analyzed for security purposes. Press 1 to continue or 2 to end the call.",
            treatSmsAsSuspicious: true,
            enableReporting: true,
            reportingFrequency: "weekly",
            highContrastMode: false,
            largeTextMode: false,
            textSizeMultiplier: "1"
          }).returning();
          return newSettings;
        } catch (error) {
          console.warn("Could not create settings, using defaults", error);
          return defaultSettings;
        }
      }
      return allSettings[0];
    } catch (error) {
      console.warn("Error accessing settings, using defaults", error);
      return defaultSettings;
    }
  }

  async updateSettings(settingsData: Partial<InsertSettings>, deviceId = 0): Promise<Settings> {
    // First, ensure we have settings to update
    const existingSettings = await this.getSettings(deviceId);
    
    try {
      const [updated] = await db
        .update(settings)
        .set(settingsData)
        .where(and(eq(settings.id, existingSettings.id), eq(settings.deviceId, deviceId)))
        .returning();
      
      return updated;
    } catch (error) {
      console.warn("Could not update settings, returning settings with updates applied", error);
      // Return a merged version of the settings
      return { ...existingSettings, ...settingsData, id: existingSettings.id };
    }
  }
  
  // USER CONSENT
  async getUserConsent(deviceId = 0): Promise<UserConsent> {
    try {
      const allConsents = await db.select().from(userConsent).where(eq(userConsent.deviceId, deviceId));
      // Return the first consent object or create one if none exists
      if (allConsents.length === 0) {
        try {
          const [newConsent] = await db.insert(userConsent).values({
            deviceId,
            acceptedTerms: false,
            acceptedPrivacyPolicy: false,
            acceptedDataCollection: false,
            timestamp: new Date()
          }).returning();
          return newConsent;
        } catch (error) {
          console.warn("Could not create user consent, using defaults", error);
          return defaultUserConsent;
        }
      }
      return allConsents[0];
    } catch (error) {
      console.warn("Error accessing user consent, using defaults", error);
      return defaultUserConsent;
    }
  }
  
  async updateUserConsent(consent: Partial<InsertUserConsent>, deviceId = 0): Promise<UserConsent> {
    // First, ensure we have consent to update
    const existingConsent = await this.getUserConsent(deviceId);
    
    try {
      const [updated] = await db
        .update(userConsent)
        .set({
          ...consent,
          timestamp: new Date()
        })
        .where(and(eq(userConsent.id, existingConsent.id), eq(userConsent.deviceId, deviceId)))
        .returning();
      
      return updated;
    } catch (error) {
      console.warn("Could not update user consent, returning consent with updates applied", error);
      // Return a merged version of the consent
      return { 
        ...existingConsent, 
        ...consent, 
        id: existingConsent.id,
        timestamp: new Date()
      };
    }
  }
  
  async hasAcceptedAllConsent(deviceId = 0): Promise<boolean> {
    const consent = await this.getUserConsent(deviceId);
    return !!(
      consent.acceptedTerms &&
      consent.acceptedPrivacyPolicy &&
      consent.acceptedDataCollection
    );
  }

  // CALL CENTERS
  async getCallCenters(deviceId = 0): Promise<CallCenter[]> {
    try {
      return await db.select().from(callCenters).where(eq(callCenters.deviceId, deviceId));
    } catch (error) {
      console.warn("Error accessing call centers, returning empty list", error);
      return [];
    }
  }

  async getCallCenter(id: number, deviceId = 0): Promise<CallCenter | undefined> {
    try {
      const [callCenter] = await db.select().from(callCenters).where(and(eq(callCenters.id, id), eq(callCenters.deviceId, deviceId)));
      return callCenter;
    } catch (error) {
      console.warn(`Error accessing call center with id ${id}`, error);
      return undefined;
    }
  }

  async getCallCenterByPhoneNumber(phoneNumber: string, deviceId = 0): Promise<CallCenter | undefined> {
    try {
      const [callCenter] = await db.select().from(callCenters).where(and(eq(callCenters.phoneNumber, phoneNumber), eq(callCenters.deviceId, deviceId)));
      return callCenter;
    } catch (error) {
      console.warn(`Error accessing call center with phone number ${phoneNumber}`, error);
      return undefined;
    }
  }

  async createCallCenter(callCenter: InsertCallCenter, deviceId = 0): Promise<CallCenter> {
    try {
      const [newCallCenter] = await db.insert(callCenters).values({
        ...callCenter,
        deviceId,
        addedOn: new Date(),
        updatedOn: new Date()
      }).returning();
      
      return newCallCenter;
    } catch (error) {
      console.warn("Could not create call center", error);
      // Create a fallback call center object with an id
      return {
        id: Math.floor(Math.random() * 1000) + 1,
        deviceId,
        name: callCenter.name,
        companyName: callCenter.companyName,
        phoneNumber: callCenter.phoneNumber,
        category: callCenter.category,
        description: callCenter.description || null,
        isVerified: callCenter.isVerified || false,
        addedOn: new Date(),
        updatedOn: new Date()
      };
    }
  }

  async updateCallCenter(id: number, callCenter: Partial<InsertCallCenter>, deviceId = 0): Promise<CallCenter> {
    try {
      const existingCenter = await this.getCallCenter(id, deviceId);
      if (!existingCenter) {
        throw new Error("Call center not found");
      }
      
      const [updated] = await db
        .update(callCenters)
        .set({
          ...callCenter,
          updatedOn: new Date()
        })
        .where(and(eq(callCenters.id, id), eq(callCenters.deviceId, deviceId)))
        .returning();
      
      return updated;
    } catch (error) {
      console.warn(`Could not update call center with id ${id}`, error);
      
      // If we found the call center but couldn't update it in the database
      const existingCenter = await this.getCallCenter(id, deviceId);
      if (existingCenter) {
        return { 
          ...existingCenter, 
          ...callCenter, 
          id: existingCenter.id,
          updatedOn: new Date()
        };
      }
      
      throw error;
    }
  }

  async deleteCallCenter(id: number, deviceId = 0): Promise<void> {
    try {
      await db.delete(callCenters).where(and(eq(callCenters.id, id), eq(callCenters.deviceId, deviceId)));
    } catch (error) {
      console.warn(`Error deleting call center with id ${id}`, error);
      // Just log the error but don't throw, as delete operations should be idempotent
    }
  }

  async isPhoneNumberInCallCenterList(phoneNumber: string, deviceId = 0): Promise<boolean> {
    try {
      const callCenter = await this.getCallCenterByPhoneNumber(phoneNumber, deviceId);
      return !!callCenter && (!!callCenter.isVerified);
    } catch (error) {
      console.warn(`Error checking if phone number ${phoneNumber} is in call center list`, error);
      return false;
    }
  }

  // EMERGENCY SERVICES
  async getEmergencyServices(): Promise<EmergencyService[]> {
    try {
      return await db.select().from(emergencyServices);
    } catch (error) {
      console.warn("Error accessing emergency services", error);
      return [];
    }
  }

  async getEmergencyServiceByCountry(countryCode: string): Promise<EmergencyService | undefined> {
    try {
      const [service] = await db.select().from(emergencyServices).where(eq(emergencyServices.countryCode, countryCode.toUpperCase()));
      return service;
    } catch (error) {
      console.warn(`Error accessing emergency service for country ${countryCode}`, error);
      return undefined;
    }
  }

  async createEmergencyService(service: InsertEmergencyService): Promise<EmergencyService> {
    try {
      const [newService] = await db.insert(emergencyServices).values(service).returning();
      return newService;
    } catch (error) {
      console.warn("Could not create emergency service", error);
      throw error;
    }
  }

  // SECURITY QUESTIONS
  async getSecurityQuestions(deviceId = 0): Promise<SecurityQuestion[]> {
    try {
      return await db.select().from(securityQuestions).where(eq(securityQuestions.deviceId, deviceId));
    } catch (error) {
      console.warn("Error accessing security questions", error);
      return [];
    }
  }

  async getActiveSecurityQuestions(deviceId = 0): Promise<SecurityQuestion[]> {
    try {
      return await db.select().from(securityQuestions).where(and(eq(securityQuestions.isActive, true), eq(securityQuestions.deviceId, deviceId)));
    } catch (error) {
      console.warn("Error accessing active security questions", error);
      return [];
    }
  }

  async getSecurityQuestion(id: number, deviceId = 0): Promise<SecurityQuestion | undefined> {
    try {
      const [q] = await db.select().from(securityQuestions).where(and(eq(securityQuestions.id, id), eq(securityQuestions.deviceId, deviceId)));
      return q;
    } catch (error) {
      console.warn(`Error accessing security question ${id}`, error);
      return undefined;
    }
  }

  async createSecurityQuestion(question: InsertSecurityQuestion, deviceId = 0): Promise<SecurityQuestion> {
    const [newQ] = await db.insert(securityQuestions).values({ ...question, deviceId }).returning();
    return newQ;
  }

  async updateSecurityQuestion(id: number, question: Partial<InsertSecurityQuestion>, deviceId = 0): Promise<SecurityQuestion> {
    const [updated] = await db
      .update(securityQuestions)
      .set(question)
      .where(and(eq(securityQuestions.id, id), eq(securityQuestions.deviceId, deviceId)))
      .returning();
    if (!updated) throw new Error("Security question not found");
    return updated;
  }

  async deleteSecurityQuestion(id: number, deviceId = 0): Promise<void> {
    await db.delete(securityQuestions).where(and(eq(securityQuestions.id, id), eq(securityQuestions.deviceId, deviceId)));
  }

  async verifySecurityAnswer(questionId: number, answer: string, deviceId = 0): Promise<boolean> {
    try {
      const q = await this.getSecurityQuestion(questionId, deviceId);
      if (!q) return false;
      return q.answer.toLowerCase().trim() === answer.toLowerCase().trim();
    } catch (error) {
      console.warn("Error verifying security answer", error);
      return false;
    }
  }

  async seedEmergencyServices(): Promise<void> {
    try {
      const existing = await this.getEmergencyServices();
      if (existing.length > 0) {
        return;
      }

      const globalEmergencyData: InsertEmergencyService[] = [
        { countryCode: "US", countryName: "United States", primaryNumber: "911", policeNumber: "911", fireNumber: "911", ambulanceNumber: "911", notes: "Unified emergency number" },
        { countryCode: "CA", countryName: "Canada", primaryNumber: "911", policeNumber: "911", fireNumber: "911", ambulanceNumber: "911", notes: "Unified emergency number" },
        { countryCode: "MX", countryName: "Mexico", primaryNumber: "911", policeNumber: "911", fireNumber: "911", ambulanceNumber: "911", notes: "Unified emergency number" },
        { countryCode: "GB", countryName: "United Kingdom", primaryNumber: "999", policeNumber: "999", fireNumber: "999", ambulanceNumber: "999", notes: "112 also works" },
        { countryCode: "IE", countryName: "Ireland", primaryNumber: "112", policeNumber: "999", fireNumber: "999", ambulanceNumber: "999", notes: "Both 112 and 999 work" },
        { countryCode: "AU", countryName: "Australia", primaryNumber: "000", policeNumber: "000", fireNumber: "000", ambulanceNumber: "000", notes: "112 works on mobile" },
        { countryCode: "NZ", countryName: "New Zealand", primaryNumber: "111", policeNumber: "111", fireNumber: "111", ambulanceNumber: "111", notes: "112 and 911 redirect to 111" },
        { countryCode: "TR", countryName: "Turkey", primaryNumber: "112", policeNumber: "155", fireNumber: "110", ambulanceNumber: "112", notes: "112 is unified emergency" },
        { countryCode: "DE", countryName: "Germany", primaryNumber: "112", policeNumber: "110", fireNumber: "112", ambulanceNumber: "112", notes: "EU standard 112" },
        { countryCode: "FR", countryName: "France", primaryNumber: "112", policeNumber: "17", fireNumber: "18", ambulanceNumber: "15", notes: "112 connects to all services" },
        { countryCode: "ES", countryName: "Spain", primaryNumber: "112", policeNumber: "091", fireNumber: "080", ambulanceNumber: "061", notes: "EU standard 112" },
        { countryCode: "IT", countryName: "Italy", primaryNumber: "112", policeNumber: "113", fireNumber: "115", ambulanceNumber: "118", notes: "112 connects to all services" },
        { countryCode: "NL", countryName: "Netherlands", primaryNumber: "112", policeNumber: "112", fireNumber: "112", ambulanceNumber: "112", notes: "EU standard 112" },
        { countryCode: "BE", countryName: "Belgium", primaryNumber: "112", policeNumber: "101", fireNumber: "100", ambulanceNumber: "100", notes: "EU standard 112" },
        { countryCode: "AT", countryName: "Austria", primaryNumber: "112", policeNumber: "133", fireNumber: "122", ambulanceNumber: "144", notes: "EU standard 112" },
        { countryCode: "CH", countryName: "Switzerland", primaryNumber: "112", policeNumber: "117", fireNumber: "118", ambulanceNumber: "144", notes: "112 also works" },
        { countryCode: "SE", countryName: "Sweden", primaryNumber: "112", policeNumber: "112", fireNumber: "112", ambulanceNumber: "112", notes: "EU standard 112" },
        { countryCode: "NO", countryName: "Norway", primaryNumber: "112", policeNumber: "112", fireNumber: "110", ambulanceNumber: "113", notes: "EU standard 112" },
        { countryCode: "DK", countryName: "Denmark", primaryNumber: "112", policeNumber: "112", fireNumber: "112", ambulanceNumber: "112", notes: "EU standard 112" },
        { countryCode: "FI", countryName: "Finland", primaryNumber: "112", policeNumber: "112", fireNumber: "112", ambulanceNumber: "112", notes: "EU standard 112" },
        { countryCode: "PL", countryName: "Poland", primaryNumber: "112", policeNumber: "997", fireNumber: "998", ambulanceNumber: "999", notes: "112 connects to all services" },
        { countryCode: "CZ", countryName: "Czech Republic", primaryNumber: "112", policeNumber: "158", fireNumber: "150", ambulanceNumber: "155", notes: "EU standard 112" },
        { countryCode: "GR", countryName: "Greece", primaryNumber: "112", policeNumber: "100", fireNumber: "199", ambulanceNumber: "166", notes: "EU standard 112" },
        { countryCode: "PT", countryName: "Portugal", primaryNumber: "112", policeNumber: "112", fireNumber: "112", ambulanceNumber: "112", notes: "EU standard 112" },
        { countryCode: "RU", countryName: "Russia", primaryNumber: "112", policeNumber: "102", fireNumber: "101", ambulanceNumber: "103", notes: "112 is unified" },
        { countryCode: "UA", countryName: "Ukraine", primaryNumber: "112", policeNumber: "102", fireNumber: "101", ambulanceNumber: "103", notes: "112 is unified" },
        { countryCode: "IN", countryName: "India", primaryNumber: "112", policeNumber: "100", fireNumber: "101", ambulanceNumber: "102", notes: "112 is unified mobile" },
        { countryCode: "CN", countryName: "China", primaryNumber: "110", policeNumber: "110", fireNumber: "119", ambulanceNumber: "120", notes: "122 for traffic" },
        { countryCode: "JP", countryName: "Japan", primaryNumber: "110", policeNumber: "110", fireNumber: "119", ambulanceNumber: "119", notes: "Police 110, Fire/Ambulance 119" },
        { countryCode: "KR", countryName: "South Korea", primaryNumber: "112", policeNumber: "112", fireNumber: "119", ambulanceNumber: "119", notes: "Police 112, Fire/Ambulance 119" },
        { countryCode: "TW", countryName: "Taiwan", primaryNumber: "110", policeNumber: "110", fireNumber: "119", ambulanceNumber: "119", notes: "112 redirects" },
        { countryCode: "HK", countryName: "Hong Kong", primaryNumber: "999", policeNumber: "999", fireNumber: "999", ambulanceNumber: "999", notes: "112 redirects to 999" },
        { countryCode: "SG", countryName: "Singapore", primaryNumber: "999", policeNumber: "999", fireNumber: "995", ambulanceNumber: "995", notes: "112 and 911 redirect" },
        { countryCode: "MY", countryName: "Malaysia", primaryNumber: "999", policeNumber: "999", fireNumber: "994", ambulanceNumber: "999", notes: "112 works on mobile" },
        { countryCode: "TH", countryName: "Thailand", primaryNumber: "191", policeNumber: "191", fireNumber: "199", ambulanceNumber: "1669", notes: "112 works on mobile" },
        { countryCode: "PH", countryName: "Philippines", primaryNumber: "911", policeNumber: "117", fireNumber: "160", ambulanceNumber: "161", notes: "911 and 112 work on mobile" },
        { countryCode: "ID", countryName: "Indonesia", primaryNumber: "110", policeNumber: "110", fireNumber: "113", ambulanceNumber: "118", notes: "112 works on mobile" },
        { countryCode: "VN", countryName: "Vietnam", primaryNumber: "113", policeNumber: "113", fireNumber: "114", ambulanceNumber: "115", notes: "112 works on mobile" },
        { countryCode: "AE", countryName: "United Arab Emirates", primaryNumber: "999", policeNumber: "999", fireNumber: "997", ambulanceNumber: "998", notes: "112 works on mobile" },
        { countryCode: "SA", countryName: "Saudi Arabia", primaryNumber: "999", policeNumber: "999", fireNumber: "998", ambulanceNumber: "997", notes: "General emergency 999" },
        { countryCode: "EG", countryName: "Egypt", primaryNumber: "122", policeNumber: "122", fireNumber: "180", ambulanceNumber: "123", notes: "112 works on mobile" },
        { countryCode: "ZA", countryName: "South Africa", primaryNumber: "10111", policeNumber: "10111", fireNumber: "10177", ambulanceNumber: "10177", notes: "112 works on mobile" },
        { countryCode: "NG", countryName: "Nigeria", primaryNumber: "199", policeNumber: "199", fireNumber: "199", ambulanceNumber: "199", notes: "112 works on mobile" },
        { countryCode: "KE", countryName: "Kenya", primaryNumber: "999", policeNumber: "999", fireNumber: "999", ambulanceNumber: "999", notes: "112 and 911 work on mobile" },
        { countryCode: "BR", countryName: "Brazil", primaryNumber: "190", policeNumber: "190", fireNumber: "193", ambulanceNumber: "192", notes: "Separate services" },
        { countryCode: "AR", countryName: "Argentina", primaryNumber: "911", policeNumber: "911", fireNumber: "100", ambulanceNumber: "107", notes: "Unified 911" },
        { countryCode: "CL", countryName: "Chile", primaryNumber: "133", policeNumber: "133", fireNumber: "132", ambulanceNumber: "131", notes: "Separate numbers" },
        { countryCode: "CO", countryName: "Colombia", primaryNumber: "123", policeNumber: "123", fireNumber: "119", ambulanceNumber: "125", notes: "Unified 123" },
        { countryCode: "PE", countryName: "Peru", primaryNumber: "911", policeNumber: "105", fireNumber: "116", ambulanceNumber: "117", notes: "Unified 911" },
        { countryCode: "IL", countryName: "Israel", primaryNumber: "100", policeNumber: "100", fireNumber: "102", ambulanceNumber: "101", notes: "112 works on mobile" },
        { countryCode: "JM", countryName: "Jamaica", primaryNumber: "119", policeNumber: "119", fireNumber: "110", ambulanceNumber: "110", notes: "Emergency 119" },
        { countryCode: "NP", countryName: "Nepal", primaryNumber: "100", policeNumber: "100", fireNumber: "101", ambulanceNumber: "102", notes: "112 works on mobile" },
      ];

      for (const service of globalEmergencyData) {
        await this.createEmergencyService(service);
      }
      
      console.log("Emergency services data seeded successfully");
    } catch (error) {
      console.warn("Error seeding emergency services", error);
    }
  }
}

export const storage = new DatabaseStorage();
