import { Call } from "@workspace/db";
import { storage } from "../../storage";

export interface Report {
  period: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  totalCalls: number;
  suspiciousCalls: number;
  suspiciousPercentage: number;
  averageRiskLevel: number;
  topKeywords: { keyword: string; count: number }[];
  emotionalAnalysis: {
    highStressPercentage: number;
    mediumStressPercentage: number;
    lowStressPercentage: number;
    averageStressLevel: number;
  };
  virusScanSummary: {
    clean: number;
    suspicious: number;
    infected: number;
    percentage: number;
  };
  generatedAt: string;
}

/**
 * Generates a statistical report for the specified time period
 */
export async function generateReport(period: 'weekly' | 'monthly', deviceId = 0): Promise<Report> {
  const now = new Date();
  let startDate = new Date();
  
  if (period === 'weekly') {
    // Set to 7 days ago
    startDate.setDate(now.getDate() - 7);
  } else {
    // Set to 30 days ago
    startDate.setDate(now.getDate() - 30);
  }
  
  // Get all calls from storage
  const allCalls = await storage.getCalls(deviceId);
  
  // Filter calls within the time range
  const callsInPeriod = allCalls.filter(call => {
    // Skip calls without timestamp
    if (!call.timestamp) return false;
    
    const callDate = new Date(call.timestamp);
    return callDate >= startDate && callDate <= now;
  });
  
  // Count suspicious calls
  const suspiciousCalls = callsInPeriod.filter(call => call.isSuspicious).length;
  
  // Calculate risk and stress metrics
  let totalRisk = 0;
  let totalStress = 0;
  const keywordCounts: Record<string, number> = {};
  let highStress = 0;
  let mediumStress = 0;
  let lowStress = 0;
  
  // Virus scan counts
  let cleanScans = 0;
  let suspiciousScans = 0;
  let infectedScans = 0;
  
  callsInPeriod.forEach(call => {
    if (call.analysis) {
      // Add risk level
      totalRisk += call.analysis.risk;
      
      // Add stress level
      totalStress += call.analysis.mood.stressLevel;
      
      // Categorize stress level
      if (call.analysis.mood.stressLevel > 7) {
        highStress++;
      } else if (call.analysis.mood.stressLevel > 3) {
        mediumStress++;
      } else {
        lowStress++;
      }
      
      // Count keywords
      call.analysis.keywords.forEach(keyword => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });
    }
    
    // Count virus scan results
    if (call.virusScanResult === 'clean') {
      cleanScans++;
    } else if (call.virusScanResult === 'suspicious') {
      suspiciousScans++;
    } else if (call.virusScanResult === 'infected') {
      infectedScans++;
    }
  });
  
  // Calculate top keywords
  const topKeywords = Object.entries(keywordCounts)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  const totalCalls = callsInPeriod.length;
  
  // Create the report
  const report: Report = {
    period,
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    totalCalls,
    suspiciousCalls,
    suspiciousPercentage: totalCalls > 0 ? (suspiciousCalls / totalCalls) * 100 : 0,
    averageRiskLevel: totalCalls > 0 ? totalRisk / totalCalls : 0,
    topKeywords,
    emotionalAnalysis: {
      highStressPercentage: totalCalls > 0 ? (highStress / totalCalls) * 100 : 0,
      mediumStressPercentage: totalCalls > 0 ? (mediumStress / totalCalls) * 100 : 0,
      lowStressPercentage: totalCalls > 0 ? (lowStress / totalCalls) * 100 : 0,
      averageStressLevel: totalCalls > 0 ? totalStress / totalCalls : 0
    },
    virusScanSummary: {
      clean: cleanScans,
      suspicious: suspiciousScans,
      infected: infectedScans,
      percentage: totalCalls > 0 ? 
        ((suspiciousScans + infectedScans) / totalCalls) * 100 : 0
    },
    generatedAt: now.toISOString()
  };
  
  return report;
}

/**
 * Sends the report to designated recipients
 */
export async function sendReportToRecipients(report: Report, recipients: string[]): Promise<boolean> {
  try {
    // In a real implementation, this would integrate with an email service
    // For now, we'll log that we would send the email
    console.log(`[Report] Would send ${report.period} report to ${recipients.length} recipient(s)`);
    
    // Here you could implement actual email sending logic using a service like SendGrid, 
    // AWS SES, or Twilio SendGrid
    
    return true;
  } catch (error) {
    console.error('Failed to send report:', error);
    return false;
  }
}

/**
 * Schedule reports based on settings
 */
export function scheduleReports(): void {
  // Check reporting settings and schedule accordingly
  setInterval(async () => {
    const settings = await storage.getSettings();
    
    if (!settings.enableReporting) return;
    
    // Check if we have any recipients
    if (!settings.reportRecipientEmails) return;
    
    const recipients = settings.reportRecipientEmails.split(',').map(email => email.trim());
    if (recipients.length === 0) return;
    
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
    const dayOfMonth = now.getDate();
    
    // Weekly report on every Sunday
    if (settings.reportingFrequency === 'weekly' || settings.reportingFrequency === 'both') {
      if (dayOfWeek === 0) { // Sunday
        const weeklyReport = await generateReport('weekly');
        await sendReportToRecipients(weeklyReport, recipients);
      }
    }
    
    // Monthly report on the 1st of each month
    if (settings.reportingFrequency === 'monthly' || settings.reportingFrequency === 'both') {
      if (dayOfMonth === 1) {
        const monthlyReport = await generateReport('monthly');
        await sendReportToRecipients(monthlyReport, recipients);
      }
    }
  }, 1000 * 60 * 60 * 24); // Check once per day
}

/**
 * Manually generate and send a report immediately
 */
export async function generateAndSendReport(period: 'weekly' | 'monthly', deviceId = 0): Promise<boolean> {
  try {
    const settings = await storage.getSettings(deviceId);
    
    if (!settings.reportRecipientEmails) {
      return false;
    }
    
    const recipients = settings.reportRecipientEmails.split(',').map(email => email.trim());
    if (recipients.length === 0) return false;
    
    const report = await generateReport(period, deviceId);
    return await sendReportToRecipients(report, recipients);
  } catch (error) {
    console.error('Failed to generate and send report:', error);
    return false;
  }
}