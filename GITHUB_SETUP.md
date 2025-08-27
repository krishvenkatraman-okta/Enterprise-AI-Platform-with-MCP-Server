# GitHub Repository Setup

## 🎯 Quick Setup Instructions

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Repository name: `enterprise-ai-platform` (or your preferred name)
3. Description: `Enterprise AI Platform with MCP Server - Atlas Beverages inventory management and J.A.R.V.I.S AI assistant`
4. Choose **Public** (for easy demo sharing) or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

### 2. Initialize and Push

Run these commands in your project directory:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit initial version
git commit -m "Initial commit: Enterprise AI Platform with MCP Server

Features:
- Dual interface: Atlas Beverages inventory + J.A.R.V.I.S AI assistant
- In-memory storage with realistic demo data (13 inventory items across 3 warehouses)
- MCP authorization server with JWT-bearer token exchange
- External LLM integration endpoints
- Okta OAuth 2.0 authentication with PKCE
- Zero database dependencies - perfect for demos
- Vercel/Netlify deployment ready"

# Add your GitHub repository as remote (replace with your actual repository URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push to GitHub
git push -u origin main
```

### 3. Update Repository URLs

After creating your repository, update these files with your actual GitHub URL:

**README.md:**
- Replace `https://github.com/yourusername/enterprise-ai-platform.git` with your actual URL

**DEPLOYMENT.md:**
- Replace `https://github.com/yourusername/enterprise-ai-platform.git` with your actual URL

### 4. Enable GitHub Pages (Optional)

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** / **root**
5. Your app will be available at `https://yourusername.github.io/repository-name`

## 🚀 Deployment Options

### Vercel (Recommended)
1. Go to [vercel.com](https://vercel.com/new)
2. Import your GitHub repository
3. Deploy automatically (no configuration needed)
4. Get instant URL: `https://your-app.vercel.app`

### Netlify
1. Go to [netlify.com](https://app.netlify.com/start)
2. Connect GitHub repository
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy automatically

### Railway
1. Go to [railway.app](https://railway.app/new)
2. Connect GitHub repository
3. Automatic deployment configuration

## 🏷️ Repository Topics

Add these topics to your GitHub repository for better discoverability:

```
enterprise-ai mcp-server okta-oauth inventory-management ai-assistant javascript typescript react express jwt-bearer demo vercel-ready
```

To add topics:
1. Go to your repository on GitHub
2. Click the gear icon ⚙️ next to "About"
3. Add the topics above
4. Save changes

## 📋 Repository Template

Use this description for your GitHub repository:

```
Enterprise AI Platform featuring Atlas Beverages inventory management and J.A.R.V.I.S AI assistant. Includes MCP (Multi-Control Point) authorization server with JWT-bearer token exchange for external LLM integration. Built with React, Express, and in-memory storage for zero-dependency demos. Deploy to Vercel/Netlify in one click.
```

## 🔗 Demo Links

After deployment, update your README with live demo links:

```markdown
## 🌐 Live Demo

- **Production**: https://your-app.vercel.app
- **Staging**: https://your-app-staging.vercel.app  
- **GitHub**: https://github.com/yourusername/enterprise-ai-platform
```

## 📊 Repository Stats

Your repository will include:

- **13 files** ready for GitHub
- **Zero external dependencies** for database
- **Complete documentation** (README, deployment guides, API docs)
- **Production-ready configuration** (vercel.json, .gitignore)
- **Demo data** pre-populated for immediate testing

## ✅ Verification Checklist

Before pushing to GitHub, ensure:

- [ ] All files are committed
- [ ] .gitignore excludes sensitive files
- [ ] README.md has correct repository URLs
- [ ] vercel.json is configured for deployment
- [ ] package.json has correct scripts
- [ ] Documentation is complete
- [ ] Demo data is populated
- [ ] MCP endpoints are working

Your repository is now ready for public deployment and sharing!