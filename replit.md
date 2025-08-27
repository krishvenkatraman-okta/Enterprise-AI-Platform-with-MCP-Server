# Overview

This is an Enterprise AI Platform featuring two main interfaces: Atlas Beverages (inventory management) and J.A.R.V.I.S (AI assistant). The platform is a single application with dual interfaces using a shared authentication system with Okta, enabling secure cross-interface access. Users can manage warehouse inventory through Atlas and interact with an AI assistant through J.A.R.V.I.S that can access inventory data via JAG token authorization.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React SPA**: Single-page application using React 18 with TypeScript
- **UI Framework**: Radix UI components with shadcn/ui design system and Tailwind CSS
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Express.js Server**: RESTful API server with TypeScript
- **Storage Layer**: In-memory storage with realistic demo data (no database dependencies)
- **Authentication**: Okta OAuth 2.0 with PKCE flow and token exchange for cross-application access
- **Session Management**: In-memory sessions with automatic cleanup
- **API Design**: RESTful endpoints with proper HTTP status codes and error handling

## Data Storage Solutions
- **In-Memory Storage**: Session-based data persistence for demo purposes
- **Demo Data**: Pre-populated with 3 warehouses and 13 inventory items
- **Key Data Types**:
  - Users (with Okta integration)
  - Warehouses and inventory items
  - Authentication sessions
  - Token exchange audit logs
- **Reset Behavior**: Data resets to defaults on server restart (perfect for demos)

## Authentication and Authorization
- **OAuth Provider**: Okta with separate client applications for inventory and jarvis
- **Token Types**: ID tokens for authentication, access tokens for API calls
- **Session Strategy**: Server-side sessions stored in database with expiration
- **Cross-Interface Access**: OAuth token exchange (RFC 8693) enables J.A.R.V.I.S to access inventory data using JAG tokens
- **Security**: PKCE flow, session validation middleware, token expiration checks

## External Dependencies
- **Okta**: Identity provider and OAuth authorization server (configurable via environment)
- **Google Fonts**: Typography assets
- **Replit**: Development environment integration

## Demo-Ready Features
- **Zero Database Setup**: Works immediately without external dependencies
- **GitHub/Vercel Friendly**: No infrastructure requirements for deployment
- **Realistic Demo Data**: 3 warehouses with beverage inventory across California, Texas, and Nevada
- **Session Persistence**: Data persists during app session, resets to defaults on restart

The architecture supports a secure dual-interface environment where users authenticate once and can access both interfaces, with J.A.R.V.I.S able to securely query inventory data through JAG token authorization within the same application. Perfect for demos, POCs, and showcasing enterprise AI integration patterns.