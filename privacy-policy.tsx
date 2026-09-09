import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Phone, Bell, Users, FileText } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <Shield className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Call Guardian - AI-Powered Call Protection</p>
          <p className="text-sm text-gray-500 mt-2">Last Updated: January 1, 2026</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Introduction
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              Call Guardian ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services designed to protect elderly users from phone fraud.
            </p>
            <p>
              By using Call Guardian, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our application.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h4>Personal Information</h4>
            <ul>
              <li><strong>Contact Information:</strong> Names and phone numbers of trusted contacts and emergency contacts that you voluntarily provide</li>
              <li><strong>Phone Numbers:</strong> Your phone number for SMS alert notifications</li>
              <li><strong>Location Data:</strong> Country information for emergency services routing (only when you use emergency features)</li>
            </ul>
            
            <h4>Call Data</h4>
            <ul>
              <li><strong>Call Metadata:</strong> Information about incoming calls including caller phone numbers, call duration, and timestamps</li>
              <li><strong>Call Transcripts:</strong> Audio-to-text transcriptions of calls for fraud analysis (when call screening is enabled)</li>
              <li><strong>Analysis Results:</strong> AI-generated risk assessments and fraud detection results</li>
            </ul>

            <h4>Usage Data</h4>
            <ul>
              <li><strong>App Settings:</strong> Your preferences for AI sensitivity, alert configurations, and accessibility options</li>
              <li><strong>Consent Records:</strong> Records of your consent to our terms and privacy policy</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>We use the information we collect to:</p>
            <ul>
              <li><strong>Protect You from Fraud:</strong> Analyze incoming calls in real-time using AI to detect potential scams and fraudulent activity</li>
              <li><strong>Send Alerts:</strong> Notify your emergency contacts via SMS when suspicious activity is detected</li>
              <li><strong>Provide Emergency Services:</strong> Connect you with appropriate local emergency services based on your location</li>
              <li><strong>Improve Our Services:</strong> Enhance our fraud detection algorithms and user experience</li>
              <li><strong>Maintain Security:</strong> Protect against unauthorized access and ensure the integrity of our services</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Data Security
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information, including:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Secure database storage with access controls</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal data by authorized personnel only</li>
            </ul>
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Third-Party Services
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>We use the following third-party services to provide our functionality:</p>
            <ul>
              <li><strong>OpenAI:</strong> For AI-powered call analysis and fraud detection. Call transcripts may be processed by OpenAI's servers.</li>
              <li><strong>Twilio:</strong> For SMS notifications and call handling. Phone numbers and message content are processed by Twilio.</li>
            </ul>
            <p>
              These third-party services have their own privacy policies. We encourage you to review their privacy practices.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Your Rights and Choices
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate personal data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Withdraw Consent:</strong> Withdraw your consent at any time through the app settings</li>
              <li><strong>Opt-Out:</strong> Disable specific features like call screening or SMS alerts in settings</li>
            </ul>
            <p>
              To exercise these rights, please use the settings within the app or contact us directly.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Children's Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              Call Guardian is designed primarily for elderly users and their caregivers. We do not knowingly collect personal information from children under 13 years of age. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can delete such information.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Changes to This Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul>
              <li>Through the app's settings and support features</li>
              <li>By reviewing and managing your data preferences in the app</li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center text-gray-500 text-sm pb-8">
          <p>© 2026 Call Guardian. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
