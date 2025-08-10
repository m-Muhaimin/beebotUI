import { type User, type InsertUser, type Conversation, type InsertConversation, type Message, type InsertMessage, users, conversations, messages } from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversation methods
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<boolean>;
  
  // Message methods
  getMessagesByConversationId(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessagesByConversationId(conversationId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    
    // Initialize with sample data
    setTimeout(() => this.initializeSampleData(), 0);
  }

  private async initializeSampleData() {
    // Create a demo user with the expected ID
    const user: User = {
      id: "demo-user",
      email: null,
      username: "Judha Mayapetiya",
      password: "sample123",
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);

    // Create sample conversations with proper dates
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const conv1 = await this.createConversation({
      userId: user.id,
      title: "What's something you've learned recently?"
    });
    conv1.createdAt = yesterday;
    conv1.updatedAt = yesterday;

    const conv2 = await this.createConversation({
      userId: user.id,
      title: "If you could teleport anywhere right now..."
    });
    conv2.createdAt = yesterday;
    conv2.updatedAt = yesterday;

    const conv3 = await this.createConversation({
      userId: user.id,
      title: "What's one goal you want to achieve?"
    });
    conv3.createdAt = yesterday;
    conv3.updatedAt = yesterday;

    const conv4 = await this.createConversation({
      userId: user.id,
      title: "Ask me anything weird or random"
    });
    conv4.createdAt = weekAgo;
    conv4.updatedAt = weekAgo;

    const conv5 = await this.createConversation({
      userId: user.id,
      title: "How are you feeling today, really?"
    });
    conv5.createdAt = weekAgo;
    conv5.updatedAt = weekAgo;

    const conv6 = await this.createConversation({
      userId: user.id,
      title: "What's one habit you wish you had?"
    });
    conv6.createdAt = weekAgo;
    conv6.updatedAt = weekAgo;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter((conv) => conv.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    
    const updated = { ...conversation, ...updates, updatedAt: new Date() };
    this.conversations.set(id, updated);
    return updated;
  }

  async deleteConversation(id: string): Promise<boolean> {
    const deleted = this.conversations.delete(id);
    if (deleted) {
      await this.deleteMessagesByConversationId(id);
    }
    return deleted;
  }

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => msg.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
      metadata: insertMessage.metadata ?? null,
    };
    this.messages.set(id, message);
    return message;
  }

  async deleteMessagesByConversationId(conversationId: string): Promise<void> {
    const messagesToDelete = Array.from(this.messages.values())
      .filter((msg) => msg.conversationId === conversationId);
    
    for (const message of messagesToDelete) {
      this.messages.delete(message.id);
    }
  }
}

// Database storage implementation using Supabase
export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    const client = postgres(process.env.DATABASE_URL);
    this.db = drizzle(client);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const result = await this.db.select().from(conversations).where(eq(conversations.id, id));
    return result[0];
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    const result = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
    return result;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const result = await this.db.insert(conversations).values(insertConversation).returning();
    return result[0];
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const result = await this.db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return result[0];
  }

  async deleteConversation(id: string): Promise<boolean> {
    // First delete all messages in the conversation
    await this.deleteMessagesByConversationId(id);
    
    // Then delete the conversation
    const result = await this.db.delete(conversations).where(eq(conversations.id, id));
    return result.length > 0;
  }

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    const result = await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
    return result;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await this.db.insert(messages).values(insertMessage).returning();
    return result[0];
  }

  async deleteMessagesByConversationId(conversationId: string): Promise<void> {
    await this.db.delete(messages).where(eq(messages.conversationId, conversationId));
  }
}

// Use DatabaseStorage for production, MemStorage for development/testing
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
