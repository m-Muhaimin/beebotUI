import bcrypt from 'bcryptjs';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import type { Express, RequestHandler } from "express";
import { storage } from './storage';
import { signupSchema, loginSchema, type User } from '@shared/schema';
import { z } from 'zod';

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use database session store if DATABASE_URL is available
  // Temporarily disabled due to connectivity issues
  if (false && process.env.DATABASE_URL) {
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
    
    return session({
      secret: process.env.SESSION_SECRET || 'fallback-secret-key-for-development',
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      rolling: true, // Refresh session expiration on activity
      cookie: {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        maxAge: sessionTtl,
      },
    });
  } else {
    // Use memory store for development/testing
    return session({
      secret: process.env.SESSION_SECRET || 'fallback-secret-key-for-development',
      resave: false,
      saveUninitialized: true, // Allow session creation for memory store
      rolling: true, // Refresh session expiration on activity
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: sessionTtl,
      },
    });
  }
}

// Authentication middleware
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Authentication utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    userId: string;
    user: User;
  }
}