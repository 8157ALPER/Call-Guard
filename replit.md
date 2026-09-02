# Call Guardian - AI-Powered Call Screening Application

## Overview

Call Guardian is an AI-powered application designed to protect elderly users from phone fraud through real-time conversation analysis and multi-channel alerting. The system uses OpenAI GPT-4o to analyze incoming calls for potential fraud indicators, maintains trusted contact lists, and provides immediate SMS notifications for suspicious activity. The application features mood tracking with emoji-based visualization to monitor emotional stress levels during calls, along with comprehensive accessibility features and customizable settings for AI sensitivity and alert preferences.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React.js with TypeScript for type safety and maintainability
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessible, consistent interface elements
- **Styling**: Tailwind CSS for utility-first styling with custom design tokens
- **State Management**: TanStack Query for server state management, caching, and API synchronization
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds
- **Accessibility**: Comprehensive accessibility features including high contrast mode, large text options, and screen reader support

### Backend Architecture
- **Runtime**: Node.js with Express.js for RESTful API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations and schema management
- **AI Integration**: OpenAI GPT-4o for real-time call transcript analysis and fraud detection
- **Communication**: Twilio for SMS alerting and call handling capabilities
- **Authentication**: Session-based authentication with consent management system
- **Error Handling**: Graceful degradation when external services are unavailable

### Data Storage Design
- **Database Schema**: Structured tables for contacts, calls, settings, user consent, and call centers
- **Contact Management**: Supports trusted contacts and emergency contacts with verification status
- **Call Logging**: Comprehensive call history with AI analysis results, mood tracking, and suspicious activity flags
- **Settings Storage**: User preferences for AI sensitivity, alert configurations, and accessibility options
- **Consent Tracking**: GDPR-compliant consent management with timestamp tracking

### Security and Privacy
- **Data Protection**: User consent management for terms, privacy policy, and data collection
- **API Security**: Environment variable management for sensitive credentials
- **Error Isolation**: Graceful handling of external service failures
- **Session Management**: Secure session handling with PostgreSQL session store

### AI and Analysis Pipeline
- **Fraud Detection**: Real-time analysis of call transcripts using GPT-4o with customizable sensitivity levels
- **Mood Tracking**: Emotional stress level analysis with emoji visualization and numerical scoring
- **Keyword Analysis**: Extraction and tracking of suspicious phrases and fraud indicators
- **Risk Assessment**: Numerical risk scoring with configurable thresholds for automated alerting

### Accessibility Framework
- **High Contrast Mode**: Complete color scheme override for visually impaired users
- **Text Scaling**: Configurable text size multipliers for improved readability
- **Keyboard Navigation**: Full keyboard accessibility support throughout the application
- **Screen Reader Support**: Semantic HTML and ARIA labels for assistive technologies
- **Focus Management**: Clear focus indicators and logical tab ordering

## External Dependencies

### AI Services
- **OpenAI GPT-4o**: Primary AI engine for call analysis, fraud detection, and mood assessment
- **API Key Management**: Secure credential storage and fallback handling

### Communication Services
- **Twilio**: SMS alerting system and incoming call handling
- **Phone Number Management**: Configurable Twilio phone numbers for alerts
- **Call Routing**: Interactive voice response for caller verification

### Database Infrastructure
- **Neon Database**: PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database migration management and schema deployment
- **Connection Fallback**: Mock data handling when database is unavailable

### Development and Deployment
- **Replit Integration**: Development environment optimization with hot reloading
- **Environment Configuration**: Comprehensive environment variable management
- **Build Pipeline**: Optimized production builds with client/server separation

### Testing Framework
- **Vitest**: Unit and integration testing for business logic
- **API Testing**: Comprehensive test coverage for contact management and call analysis
- **Mock Services**: Test doubles for external API dependencies