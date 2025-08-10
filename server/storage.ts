import { type User, type InsertUser, type Conversation, type InsertConversation, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
      username: "Judha Mayapetiya",
      password: "sample123"
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
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

export const storage = new MemStorage();
