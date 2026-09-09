import { pgTable, text, serial, boolean, timestamp, json, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  tokenHash: text("token_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("devices_token_hash_unique").on(table.tokenHash),
]);

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull().default(0),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  isEmergency: boolean("is_emergency").default(false),
  isTrusted: boolean("is_trusted").default(false),
});

export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull().default(0),
  phoneNumber: text("phone_number").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  duration: text("duration"),
  analysis: json("analysis").$type<{
    risk: number;
    summary: string;
    keywords: string[];
    mood: {
      emoji: string;
      stressLevel: number;
      description: string;
    };
  }>(),
  isSuspicious: boolean("is_suspicious").default(false),
  virusScanResult: text("virus_scan_result").default("clean"),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull().default(0),
  // Call screening settings
  enableCallScreening: boolean("enable_call_screening").default(true),
  enableSmsAlerts: boolean("enable_sms_alerts").default(true),
  alertPhoneNumber: text("alert_phone_number"),
  aiSensitivity: text("ai_sensitivity").default("medium"),
  disableInDisaster: boolean("disable_in_disaster").default(true),
  enableAntivirusScan: boolean("enable_antivirus_scan").default(true),
  enableCallerWarning: boolean("enable_caller_warning").default(true),
  callerWarningMessage: text("caller_warning_message"),
  treatSmsAsSuspicious: boolean("treat_sms_as_suspicious").default(true),
  
  // Reporting settings
  enableReporting: boolean("enable_reporting").default(true),
  reportingFrequency: text("reporting_frequency").default("weekly"),
  reportRecipientEmails: text("report_recipient_emails"),
  
  // Accessibility settings
  highContrastMode: boolean("high_contrast_mode").default(false),
  largeTextMode: boolean("large_text_mode").default(false),
  textSizeMultiplier: text("text_size_multiplier").default("1"),
  
  // Emergency services settings
  homeCountryCode: text("home_country_code").default("US"),
  enableEmergencyAlerts: boolean("enable_emergency_alerts").default(true),
});

export const userConsent = pgTable("user_consent", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull().default(0),
  acceptedTerms: boolean("accepted_terms").default(false),
  acceptedPrivacyPolicy: boolean("accepted_privacy_policy").default(false),
  acceptedDataCollection: boolean("accepted_data_collection").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const callCenters = pgTable("call_centers", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull().default(0),
  name: text("name").notNull(),
  companyName: text("company_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  category: text("category").notNull(), // e.g., "banking", "telecom", "government", "healthcare"
  description: text("description"),
  isVerified: boolean("is_verified").default(true),
  addedOn: timestamp("added_on").defaultNow(),
  updatedOn: timestamp("updated_on").defaultNow(),
});

// Emergency services for countries worldwide
export const emergencyServices = pgTable("emergency_services", {
  id: serial("id").primaryKey(),
  countryCode: text("country_code").notNull(), // ISO 3166-1 alpha-2 code (e.g., "US", "TR", "AU")
  countryName: text("country_name").notNull(),
  primaryNumber: text("primary_number").notNull(), // Main emergency number (911, 112, etc.)
  policeNumber: text("police_number"),
  fireNumber: text("fire_number"),
  ambulanceNumber: text("ambulance_number"),
  notes: text("notes"), // Additional info like "112 works on mobile"
});

export const insertContactSchema = createInsertSchema(contacts).omit({ deviceId: true }).extend({
  name: z.string(),
  phoneNumber: z.string(),
  isEmergency: z.boolean().default(false),
  isTrusted: z.boolean().default(false),
});

export const insertCallSchema = createInsertSchema(calls).omit({ deviceId: true }).extend({
  phoneNumber: z.string(),
  duration: z.string().nullable(),
  analysis: z.object({
    risk: z.number(),
    summary: z.string(),
    keywords: z.array(z.string()),
    mood: z.object({
      emoji: z.string(),
      stressLevel: z.number(),
      description: z.string()
    })
  }).nullable(),
  isSuspicious: z.boolean().default(false),
  virusScanResult: z.string().default("clean"),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ deviceId: true }).extend({
  // Call screening settings
  enableCallScreening: z.boolean().default(true),
  enableSmsAlerts: z.boolean().default(true),
  alertPhoneNumber: z.string().nullable(),
  aiSensitivity: z.string().default("medium"),
  disableInDisaster: z.boolean().default(true),
  enableAntivirusScan: z.boolean().default(true),
  enableCallerWarning: z.boolean().default(true),
  callerWarningMessage: z.string().default("This call will be recorded and analyzed for security purposes. Press 1 to continue or 2 to end the call."),
  treatSmsAsSuspicious: z.boolean().default(true),
  
  // Reporting settings
  enableReporting: z.boolean().default(true),
  reportingFrequency: z.enum(["weekly", "monthly", "both"]).default("weekly"),
  reportRecipientEmails: z.string().nullable(),
  
  // Accessibility settings
  highContrastMode: z.boolean().default(false),
  largeTextMode: z.boolean().default(false),
  textSizeMultiplier: z.enum(["1", "1.25", "1.5", "1.75", "2"]).default("1"),
  
  // Emergency services settings
  homeCountryCode: z.string().default("US"),
  enableEmergencyAlerts: z.boolean().default(true),
});

export const insertUserConsentSchema = createInsertSchema(userConsent).omit({ deviceId: true }).extend({
  acceptedTerms: z.boolean().default(false),
  acceptedPrivacyPolicy: z.boolean().default(false),
  acceptedDataCollection: z.boolean().default(false),
});

export const insertCallCenterSchema = createInsertSchema(callCenters).omit({ deviceId: true }).extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  phoneNumber: z.string().min(6, "Phone number must be at least 6 characters"),
  category: z.enum(["banking", "telecom", "government", "healthcare", "utility", "insurance", "other"]),
  description: z.string().nullable().optional(),
  isVerified: z.boolean().default(true),
});

export const insertEmergencyServiceSchema = createInsertSchema(emergencyServices).extend({
  countryCode: z.string().min(2).max(3),
  countryName: z.string().min(2),
  primaryNumber: z.string().min(2),
  policeNumber: z.string().nullable().optional(),
  fireNumber: z.string().nullable().optional(),
  ambulanceNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// Security questions - pre-registered by family members to verify callers
export const securityQuestions = pgTable("security_questions", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull().default(0),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  hint: text("hint"),
  isActive: boolean("is_active").default(true),
});

export const insertSecurityQuestionSchema = createInsertSchema(securityQuestions).omit({ deviceId: true }).extend({
  question: z.string().min(5, "Question must be at least 5 characters"),
  answer: z.string().min(1, "Answer is required"),
  hint: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export type SecurityQuestion = typeof securityQuestions.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type InsertSecurityQuestion = z.infer<typeof insertSecurityQuestionSchema>;

export type Contact = typeof contacts.$inferSelect;
export type Call = typeof calls.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type UserConsent = typeof userConsent.$inferSelect;
export type CallCenter = typeof callCenters.$inferSelect;
export type EmergencyService = typeof emergencyServices.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertCall = z.infer<typeof insertCallSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type InsertUserConsent = z.infer<typeof insertUserConsentSchema>;
export type InsertCallCenter = z.infer<typeof insertCallCenterSchema>;
export type InsertEmergencyService = z.infer<typeof insertEmergencyServiceSchema>;