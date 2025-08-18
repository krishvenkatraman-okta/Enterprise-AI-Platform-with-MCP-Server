# Enterprise AI Platform

A sophisticated dual-interface enterprise application featuring Atlas Beverages inventory management and J.A.R.V.I.S AI assistant with advanced OAuth token exchange architecture.

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** + **shadcn/ui** components
- **Wouter** for lightweight routing
- **TanStack Query** for server state management

### Backend
- **Express.js** server with TypeScript
- **Drizzle ORM** with PostgreSQL
- **Okta OAuth 2.0** with PKCE flow
- **JWT token exchange** (RFC 8693) for cross-app access

### Database
- **PostgreSQL** via Neon serverless
- **Drizzle** schema management
- Database-stored sessions with cleanup

## 🚀 Features

### Atlas Beverages (Inventory Management)
- Multi-warehouse inventory tracking
- Real-time stock level monitoring
- Low stock alerts and reorder notifications
- Comprehensive item management

### J.A.R.V.I.S (AI Assistant)
- Natural language inventory queries
- Cross-application data access via JAG tokens
- Real-time warehouse status reports
- Secure authentication token management

### Advanced Authentication
- **OAuth 2.0** with Okta integration
- **PKCE flow** for enhanced security
- **Token Exchange** (RFC 8693) for cross-app access
- Progressive token disclosure in UI
- Session-based authentication with database storage

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Okta developer account

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd enterprise-ai-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file with:
   ```env
   # Database
   DATABASE_URL=your_postgresql_url
   PGHOST=your_host
   PGPORT=5432
   PGUSER=your_user
   PGPASSWORD=your_password
   PGDATABASE=your_database

   # Okta Configuration
   OKTA_DOMAIN=your-okta-domain.okta.com
   OKTA_CLIENT_ID=your_client_id
   OKTA_CLIENT_SECRET=your_client_secret
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── lib/            # Utilities and configurations
│   │   └── hooks/          # Custom React hooks
├── server/                 # Express backend
│   ├── routes.ts           # API routes
│   ├── services/           # Business logic
│   └── storage.ts          # Data access layer
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle database schema
└── vercel.json             # Deployment configuration
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect to GitHub**
   - Push your code to a GitHub repository

2. **Import to Vercel**
   - Connect your GitHub repo to Vercel
   - The `vercel.json` configuration is already included

3. **Set Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Include database connection and Okta configuration

4. **Update Okta Configuration**
   - Add your Vercel domain to Okta redirect URIs
   - Update audience URLs from localhost to production domain

### Other Platforms
The application is compatible with:
- **Railway**
- **Render** 
- **Heroku**
- **AWS/GCP/Azure**

## 🔐 Authentication Flow

### Standard Login
1. User initiates OAuth login with Okta
2. PKCE flow ensures secure authentication
3. ID token received and session created
4. User gains access to Atlas Beverages

### Cross-App Access (JAG Token)
1. User requests inventory data through J.A.R.V.I.S
2. System exchanges ID token for JAG token (RFC 8693)
3. JAG token provides cross-application authorization
4. Secure access to inventory data granted

## 🎨 UI Components

### Token Management
- Progressive token disclosure
- Real-time token status indicators
- Secure token reveal/copy functionality
- Visual authentication flow tracking

### Inventory Interface
- Real-time warehouse data display
- Interactive inventory cards
- Stock level indicators with alerts
- Responsive design for all devices

## 🔍 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - Initiate OAuth login
- `POST /api/auth/callback` - Handle OAuth callback
- `POST /api/auth/token-exchange` - Exchange tokens
- `POST /api/auth/logout` - End session
- `GET /api/auth/sessions` - Get session info

### Inventory Endpoints
- `GET /api/warehouses` - List all warehouses
- `GET /api/inventory/:warehouseId` - Get warehouse inventory
- `GET /api/jarvis/inventory` - J.A.R.V.I.S inventory access

## 🛡️ Security Features

- **PKCE OAuth Flow** - Enhanced authorization security
- **Token Exchange** - Secure cross-app communication
- **Session Management** - Database-stored sessions
- **Input Validation** - Zod schema validation
- **CORS Protection** - Configured for production
- **Environment Isolation** - Separate dev/prod configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [Issues](../../issues) page
- Review the authentication flow documentation
- Verify environment variable configuration
- Ensure Okta domain and client settings are correct

## 🧪 Testing

The application includes comprehensive authentication flows and can be tested with:
- Multiple warehouse scenarios
- Cross-app token exchange flows
- Session management and timeout handling
- OAuth error scenarios and recovery

---

**Built with** React, Express, PostgreSQL, Okta, and modern web technologies for enterprise-grade security and scalability.