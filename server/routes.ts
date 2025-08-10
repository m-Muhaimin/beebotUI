import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { MCPChatClient } from "./mcp-client";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

// Initialize MCP client with environment variable or fallback
const mcpClient = new MCPChatClient(
  process.env.DEEPSEEK_API_KEY || "sk-1414609620f448b6966346842d3b64db"
);

// For demo purposes, we'll use a hardcoded user ID
const DEMO_USER_ID = "demo-user";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all conversations for a user
  app.get('/api/conversations', async (req, res) => {
    try {
      const conversations = await storage.getConversationsByUserId(DEMO_USER_ID);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch conversations' });
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
  app.post('/api/conversations', async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse({
        ...req.body,
        userId: DEMO_USER_ID
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
  app.delete('/api/conversations/:id', async (req, res) => {
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

  // Chat endpoint for streaming responses
  app.post('/api/chat/:conversationId', async (req, res) => {
    try {
      const { message } = req.body;
      const conversationId = req.params.conversationId;
      
      // Validate conversation exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Save user message
      await storage.createMessage({
        conversationId,
        role: 'user',
        content: message,
        metadata: null
      });

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
        // Stream response from MCP client
        for await (const chunk of mcpClient.chatStream(chatMessages)) {
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

  // Create new chat (creates conversation and sends first message)
  app.post('/api/chat/new', async (req, res) => {
    try {
      const { message } = req.body;
      
      // Generate title for the conversation
      const title = await mcpClient.generateTitle(message);
      
      // Create new conversation
      const conversation = await storage.createConversation({
        userId: DEMO_USER_ID,
        title
      });

      // Save user message
      await storage.createMessage({
        conversationId: conversation.id,
        role: 'user',
        content: message,
        metadata: null
      });

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // Send conversation ID first
      res.write(`data: ${JSON.stringify({ conversationId: conversation.id })}\n\n`);

      let assistantResponse = '';

      try {
        // Stream response from MCP client
        for await (const chunk of mcpClient.chatStream([{ role: 'user', content: message }])) {
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
            conversationId: conversation.id,
            role: 'assistant',
            content: assistantResponse,
            metadata: null
          });
        }

      } catch (error) {
        res.write(`data: ${JSON.stringify({ error: 'Failed to get AI response' })}\n\n`);
      }

      res.end();
    } catch (error) {
      res.status(500).json({ error: 'Failed to create new chat' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
