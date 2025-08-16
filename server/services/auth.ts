import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { oktaService } from "./okta";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    oktaUserId: string;
  };
  session?: {
    id: string;
    sessionId: string;
    application: string;
    idToken: string;
    expiresAt: Date;
  };
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const sessionId = req.headers['x-session-id'] as string;

    if (!authHeader || !sessionId) {
      return res.status(401).json({ error: 'No authentication token or session provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token is not expired
    if (oktaService.isTokenExpired(token)) {
      return res.status(401).json({ error: 'Token has expired' });
    }

    // Get session from database
    const session = await storage.getAuthSession(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Check session expiry
    if (new Date() > session.expiresAt) {
      await storage.deleteAuthSession(sessionId);
      return res.status(401).json({ error: 'Session has expired' });
    }

    // Get user
    const user = await storage.getUser(session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user and session to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      oktaUserId: user.oktaUserId!,
    };

    req.session = {
      id: session.id,
      sessionId: session.sessionId,
      application: session.application,
      idToken: session.idToken,
      expiresAt: session.expiresAt,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

export async function requireInventoryAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.session || req.session.application !== 'inventory') {
    return res.status(403).json({ error: 'Inventory access required' });
  }
  next();
}

export async function requireJarvisAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.session || req.session.application !== 'jarvis') {
    return res.status(403).json({ error: 'Jarvis access required' });
  }
  next();
}
