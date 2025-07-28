# Chinese Learning Platform - AI-Powered Pronunciation Training

A comprehensive AI-powered platform designed specifically for Vietnamese speakers learning Chinese, focusing on pronunciation analysis and real-time feedback.

## Overview

This platform addresses one of the most challenging aspects of learning Chinese for Vietnamese speakers: accurate pronunciation and tone recognition. By leveraging advanced AI technology, we provide instant, detailed feedback on pronunciation attempts, helping learners improve their Chinese speaking skills efficiently.

## Core Features

### Pronunciation Analysis System
Real-time AI-powered analysis of Chinese pronunciation with detailed feedback on tone accuracy, consonant/vowel pronunciation, and rhythm patterns. The system is specifically trained to understand common pronunciation challenges faced by Vietnamese learners.

### Interactive Conversation Practice
Intelligent chatbot powered by Google Gemini AI that engages learners in natural Chinese conversations, providing corrections and suggestions in real-time while adapting to the learner's proficiency level.

### Smart Tutoring Assistant
Advanced Q&A system that provides intelligent responses to grammar and vocabulary questions, utilizing RAG (Retrieval-Augmented Generation) technology for accurate and contextual learning support.

## Technical Architecture

### Backend Framework
Built on NestJS, a progressive Node.js framework using TypeScript, providing enterprise-grade scalability, maintainability, and robust dependency injection.

### Database Infrastructure
PostgreSQL database hosted on Railway, ensuring reliable data persistence with automatic SSL encryption, backup capabilities, and seamless scaling.

### File Storage Solution
Decentralized file storage using IPFS (InterPlanetary File System) through Pinata, providing secure, immutable, and globally distributed storage for audio files.

### AI Integration
Google Gemini 2.0 Flash model integration for advanced natural language processing, offering superior Chinese language understanding and multimodal capabilities.

### Architecture Pattern
Feature-first modular design following domain-driven development principles, ensuring clean code separation, testability, and future extensibility.

## Development Status

### Phase 1: Core Infrastructure - COMPLETED
- Enterprise-grade NestJS application setup
- Comprehensive database entity design and relationships
- Complete IPFS file storage integration
- AI analysis services implementation
- Modular architecture framework

### Phase 2: Business Logic Implementation - IN PROGRESS
- Service layer completion
- REST API development
- Database migration scripts
- Integration testing suite

### Phase 3: Advanced Features - PLANNED
- Real-time WebSocket features
- Advanced analytics dashboard
- Mobile application support
- Performance optimization

## Installation and Setup

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager
- PostgreSQL database access
- API keys for external services

### Installation Steps

```bash
# Clone the repository
git clone https://github.com/meiiie/hoc_tieng.git
cd hoc_tieng/api

# Install dependencies
cd chinese-learning-backend
npm install

# Environment configuration
cp .env.example .env
# Configure your environment variables in .env file

# Build the application
npm run build

# Start development server
npm run start:dev
```

### Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Application Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# IPFS Storage Configuration
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY_URL=your_gateway.mypinata.cloud
PINATA_SECRET=your_pinata_secret

# AI Service Configuration
GEMINI_API_KEY=your_gemini_api_key
```

## Project Structure

```
api/
├── chinese-learning-backend/          # Main NestJS application
│   ├── src/
│   │   ├── modules/                   # Feature-based modules
│   │   │   ├── pronunciation/         # Pronunciation analysis module
│   │   │   └── user/                  # User management module
│   │   ├── shared/                    # Global services and utilities
│   │   │   └── services/              # External service integrations
│   │   ├── config/                    # Application configuration
│   │   ├── app.module.ts              # Main application module
│   │   └── main.ts                    # Application entry point
│   ├── test/                          # Test suites
│   ├── dist/                          # Compiled output
│   └── package.json                   # Dependencies and scripts
├── ARCHITECTURE.md                    # Detailed technical documentation
├── README.md                          # Project overview and setup guide
├── .env.example                       # Environment variables template
└── .gitignore                         # Git ignore rules
```

## API Documentation

### Authentication
The API uses JWT-based authentication for secure access to protected endpoints.

### Core Endpoints

#### Pronunciation Analysis
- `POST /pronunciation/analyze` - Upload and analyze audio pronunciation
- `GET /pronunciation/attempts` - Retrieve user's pronunciation attempts
- `GET /pronunciation/attempts/:id` - Get specific pronunciation attempt details

#### User Management
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `GET /users/profile` - User profile information

### Request/Response Format
All API responses follow a consistent JSON structure with appropriate HTTP status codes and error handling.

## Database Schema

### User Entity
Comprehensive user management with Chinese proficiency levels (HSK1-HSK6), learning preferences, and progress tracking statistics.

### Pronunciation Attempt Entity
Detailed storage of pronunciation attempts including audio file references, AI analysis results, scoring metrics, and processing status tracking.

### Relationship Design
Optimized database relationships with proper foreign key constraints and performance indexes for efficient querying.

## Development Guidelines

### Code Quality Standards
- TypeScript strict mode for enhanced type safety
- ESLint configuration for consistent code styling
- Prettier integration for automated code formatting
- Comprehensive unit and integration testing

### Version Control
- Git workflow with feature branches
- Pull request reviews for code quality assurance
- Semantic versioning for release management
- Automated CI/CD pipeline integration

### Performance Considerations
- Database query optimization with strategic indexing
- Pagination implementation for large datasets
- Asynchronous processing for compute-intensive operations
- Connection pooling for database efficiency

## Contributing

This educational project focuses on Chinese language learning solutions for Vietnamese speakers. Contributions should align with the project's educational objectives and maintain code quality standards.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Implement changes with appropriate tests
4. Submit a pull request with detailed description

## Documentation

- **Architecture Documentation**: `ARCHITECTURE.md` - Comprehensive technical architecture and progress tracking
- **API Reference**: Coming soon - Detailed REST API documentation
- **Development Guide**: Coming soon - Developer onboarding and contribution guidelines

## License

This is a private educational project. All rights reserved.

## Support

For technical support or questions regarding the project implementation, please refer to the architecture documentation or create an issue in the project repository.

---

**Project Status**: Active Development  
**Last Updated**: July 28, 2025  
**Version**: 1.0.0-beta
