import twilio from "twilio";
import { storage } from "../storage";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendAlert(
  to: string,
  message: string
): Promise<void> {
  try {
    await client.messages.create({
      body: message,
      to,
      from: process.env.TWILIO_PHONE_NUMBER
    });
  } catch (error: any) {
    throw new Error("Failed to send SMS alert: " + error.message);
  }
}

export async function handleIncomingCall(phoneNumber: string): Promise<string> {
  try {
    const settings = await storage.getSettings();
    
    if (!settings.enableCallerWarning) {
      return generateTwimlResponse(null);
    }
    
    const warningMessage = settings.callerWarningMessage || 
      "This call will be recorded and analyzed for security purposes. Press 1 to continue or 2 to end the call.";
    
    return generateTwimlResponse(warningMessage);
  } catch (error: any) {
    console.error("Error handling incoming call:", error);
    // Default to allowing the call if there's an error
    return generateTwimlResponse(null);
  }
}

export async function handleKeyPress(digit: string): Promise<string> {
  if (digit === "1") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for confirming. Connecting your call now.</Say>
  <Dial>
    <Number>${process.env.TWILIO_PHONE_NUMBER}</Number>
  </Dial>
</Response>`;
  } else if (digit === "2") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you. Your call will now end.</Say>
  <Hangup />
</Response>`;
  } else {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Invalid selection. Press 1 to continue or 2 to end the call.</Say>
  <Gather numDigits="1" action="/api/calls/handle-keypress" method="POST">
  </Gather>
</Response>`;
  }
}

function generateTwimlResponse(warningMessage: string | null): string {
  if (!warningMessage) {
    // No warning, directly connect the call
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Number>${process.env.TWILIO_PHONE_NUMBER}</Number>
  </Dial>
</Response>`;
  }
  
  // With warning message, require keypress
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${warningMessage}</Say>
  <Gather numDigits="1" action="/api/calls/handle-keypress" method="POST">
  </Gather>
</Response>`;
}

export function isSmsContentSuspicious(content: string): boolean {
  // This would be a more sophisticated analysis in a real app
  const suspiciousKeywords = [
    'urgent', 'verify', 'account', 'password', 'click', 'link',
    'bank', 'credit', 'credentials', 'limited time', 'offer', 'prize'
  ];
  
  const contentLower = content.toLowerCase();
  return suspiciousKeywords.some(keyword => contentLower.includes(keyword.toLowerCase()));
}
