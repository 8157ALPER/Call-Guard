import { z } from "zod";

export const insertContactSchema = z.object({
  name: z.string(),
  phoneNumber: z.string(),
  isEmergency: z.boolean().default(false),
  isTrusted: z.boolean().default(false),
});

export const insertSettingsSchema = z.object({
  enableCallScreening: z.boolean().default(true),
  enableSmsAlerts: z.boolean().default(true),
  alertPhoneNumber: z.string().nullable().optional(),
  aiSensitivity: z.string().default("medium"),
  disableInDisaster: z.boolean().default(true),
  enableAntivirusScan: z.boolean().default(true),
  enableCallerWarning: z.boolean().default(true),
  callerWarningMessage: z
    .string()
    .default(
      "This call will be recorded and analyzed for security purposes. Press 1 to continue or 2 to end the call.",
    ),
  treatSmsAsSuspicious: z.boolean().default(true),
  enableReporting: z.boolean().default(true),
  reportingFrequency: z.enum(["weekly", "monthly", "both"]).default("weekly"),
  reportRecipientEmails: z.string().nullable().optional(),
  highContrastMode: z.boolean().default(false),
  largeTextMode: z.boolean().default(false),
  textSizeMultiplier: z.string().default("1"),
  homeCountryCode: z.string().default("US"),
  enableEmergencyAlerts: z.boolean().default(true),
});

export const insertSecurityQuestionSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters"),
  answer: z.string().min(1, "Answer is required"),
  hint: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export type Contact = z.infer<typeof insertContactSchema> & { id: number };
export type Call = {
  id: number;
  phoneNumber: string;
  timestamp: Date | string | null;
  duration: string | null;
  analysis: {
    risk: number;
    summary: string;
    keywords: string[];
    mood: {
      emoji: string;
      stressLevel: number;
      description: string;
    };
  } | null;
  isSuspicious: boolean | null;
  virusScanResult: string | null;
};
export type Settings = z.infer<typeof insertSettingsSchema> & { id: number };
export type EmergencyService = {
  id: number;
  countryCode: string;
  countryName: string;
  primaryNumber: string;
  policeNumber: string | null;
  fireNumber: string | null;
  ambulanceNumber: string | null;
  notes: string | null;
};
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type InsertSecurityQuestion = z.infer<
  typeof insertSecurityQuestionSchema
>;