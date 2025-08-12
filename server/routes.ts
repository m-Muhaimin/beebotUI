import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { MCPChatClient } from "./mcp-client";
import { insertConversationSchema, insertMessageSchema, signupSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import { getSession, isAuthenticated, hashPassword, verifyPassword } from "./auth";

// Initialize MCP client with environment variable
const mcpClient = new MCPChatClient(
  process.env.DEEPSEEK_API_KEY!
);

// For demo purposes, we'll use a hardcoded user ID
const DEMO_USER_ID = "demo-user";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(getSession());

  // Authentication routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Generate username from email
      const username = validatedData.email.split('@')[0];
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        username,
        password: hashedPassword,
      });

      // Create session
      if (req.session) {
        req.session.userId = user.id;
        req.session.user = user;
        
        // Force session save to ensure persistence
        await new Promise<void>((resolve, reject) => {
          req.session!.save((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await verifyPassword(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Create session
      if (req.session) {
        req.session.userId = user.id;
        req.session.user = user;
        
        // Force session save to ensure persistence
        await new Promise<void>((resolve, reject) => {
          req.session!.save((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ message: 'Logged out successfully' });
      });
    } else {
      res.json({ message: 'Logged out successfully' });
    }
  });

  app.get('/api/auth/me', isAuthenticated, (req, res) => {
    if (req.session && req.session.user) {
      const { password, ...userWithoutPassword } = req.session.user;
      res.json({ user: userWithoutPassword });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

  // Protected routes - require authentication
  // Get all conversations for a user
  app.get('/api/conversations', async (req, res) => {
    try {
      let userId = req.session?.userId;
      if (!userId) {
        userId = DEMO_USER_ID;
      }
      const conversations = await storage.getConversationsByUserId(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  // Get bookmarked conversations for a user (must come before /:id route)
  app.get('/api/conversations/bookmarked', async (req, res) => {
    try {
      let userId = req.session?.userId;
      if (!userId) {
        userId = DEMO_USER_ID;
      }
      const conversations = await storage.getBookmarkedConversationsByUserId(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch bookmarked conversations' });
    }
  });

  // Get a specific conversation with messages
  app.get('/api/conversations/:id', async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      const messages = await storage.getMessagesByConversationId(req.params.id);
      res.json({ conversation, messages });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  });

  // Create a new conversation
  app.post('/api/conversations', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const validatedData = insertConversationSchema.parse({
        ...req.body,
        userId
      });
      
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  });

  // Delete a conversation
  app.delete('/api/conversations/:id', isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteConversation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  });

  // Toggle bookmark status for a conversation
  app.post('/api/conversations/:id/bookmark', async (req, res) => {
    try {
      const conversation = await storage.toggleBookmark(req.params.id);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      res.json({ conversation, success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to toggle bookmark' });
    }
  });



  // Create new conversation with initial message (simple, fast response)
  app.post('/api/chat/new', async (req, res) => {
    try {
      const { message, selectedTool } = req.body;
      // Use demo user temporarily for testing
      let userId = req.session?.userId;
      if (!userId) {
        userId = DEMO_USER_ID;
      }
      
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      // Generate title for the conversation (quick operation)
      const title = await mcpClient.generateTitle(message);
      
      // Create new conversation
      const conversation = await storage.createConversation({
        userId,
        title
      });

      // Save user message
      await storage.createMessage({
        conversationId: conversation.id,
        role: 'user',
        content: message,
        metadata: null
      });

      // Return conversation ID immediately - no streaming here
      res.json({ 
        conversationId: conversation.id,
        success: true 
      });
    } catch (error) {
      console.error('Error in /api/chat/new:', error);
      res.status(500).json({ error: 'Failed to create new chat' });
    }
  });

  // Chat endpoint for streaming responses
  app.post('/api/chat/:conversationId', async (req, res) => {
    try {
      const { message, skipSaveMessage = false, selectedTool } = req.body;
      const conversationId = req.params.conversationId;
      
      // Validate conversation exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Save user message (unless we're continuing from an already saved message)
      if (!skipSaveMessage && message && message.trim()) {
        await storage.createMessage({
          conversationId,
          role: 'user',
          content: message,
          metadata: null
        });
      }

      // Get conversation history for context
      const messages = await storage.getMessagesByConversationId(conversationId);
      const chatMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      let assistantResponse = '';

      try {
        // Stream response from MCP client with tool selection
        for await (const chunk of mcpClient.chatStream(chatMessages, selectedTool)) {
          if (chunk.error) {
            res.write(`data: ${JSON.stringify({ error: chunk.error })}\n\n`);
            break;
          }
          
          if (chunk.content) {
            assistantResponse += chunk.content;
            res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
          }
          
          if (chunk.finished) {
            res.write(`data: ${JSON.stringify({ finished: true })}\n\n`);
            break;
          }
        }

        // Save assistant response
        if (assistantResponse) {
          await storage.createMessage({
            conversationId,
            role: 'assistant',
            content: assistantResponse,
            metadata: null
          });

          // Update conversation timestamp
          await storage.updateConversation(conversationId, { updatedAt: new Date() });
        }

      } catch (error) {
        res.write(`data: ${JSON.stringify({ error: 'Failed to get AI response' })}\n\n`);
      }

      res.end();
    } catch (error) {
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  });



  const httpServer = createServer(app);

  return httpServer;
}
