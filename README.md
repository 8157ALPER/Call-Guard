# Call Guardian

An AI-powered call screening application designed to protect elderly users from phone fraud, featuring real-time conversation analysis and multi-channel alerting technologies.

## Features

- 🛡️ **Real-time Call Screening**: Uses OpenAI GPT-4o to analyze conversations for potential fraud
- 👥 **Contact Management**: Maintain trusted and emergency contacts
- 📱 **SMS Alerts**: Immediate notifications via Twilio for suspicious calls
- 😊 **Mood Tracking**: Emoji-based visualization of emotional stress levels during calls
- ⚙️ **Customizable Settings**: Adjust AI sensitivity and alert preferences

## Tech Stack

- Frontend: React.js with shadcn/ui components
- Backend: Node.js with Express
- AI: OpenAI GPT-4o
- Communications: Twilio SMS
- State Management: TanStack Query
- Styling: Tailwind CSS

## Environment Variables

The following environment variables are required:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables
4. Start the development server:
   ```bash
   npm run dev
   ```

## Features Guide

### Call Screening
- Navigate to the "Call Screen" tab
- Use the test interface to analyze conversation transcripts
- View real-time analysis including:
  - Risk assessment
  - Emotional stress tracking
  - Suspicious keyword detection

### Contact Management
- Add trusted and emergency contacts
- Mark contacts as trusted to bypass screening
- Flag emergency contacts for special handling

### Settings Configuration
- Enable/disable call screening
- Configure SMS alerts
- Adjust AI sensitivity levels
- Set alert phone numbers

## Security Considerations

- API keys and sensitive data are stored in environment variables
- All API requests include proper error handling and validation
- Real-time monitoring and logging for suspicious activities

## Deployment Notes

Important deployment considerations:
- The application runs on port 5000 by default
- Both API and client are served from the same port
- No additional proxy configuration is needed
- Environment variables must be set in the Replit Secrets panel
- The application uses in-memory storage by default

## Testing

Run the test suite:
```bash
npm test
```

The test suite covers:
- Contact management operations
- Call analysis with mood tracking
- SMS alert system functionality
- Error handling and edge cases

## Monitoring and Logging

The application includes comprehensive logging for:
- API requests and responses
- Call analysis operations
- Alert system activities
- Error tracking and debugging

## Support

For issues or questions about:
- API integrations: Contact OpenAI or Twilio support
- Application functionality: Open an issue in the repository

## Future Enhancements

Planned improvements:
- Integration with persistent database storage
- Advanced fraud pattern recognition
- Real-time voice analysis
- Enhanced notification system