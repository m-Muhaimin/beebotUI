import { EventEmitter } from 'events';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface StreamChunk {
  content?: string;
  finished?: boolean;
  error?: string;
}

export class MCPChatClient extends EventEmitter {
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  constructor(apiKey: string, apiUrl = 'https://api.deepseek.com', model = 'deepseek-chat') {
    super();
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.model = model;
  }

  async *chatStream(messages: ChatMessage[]): AsyncGenerator<StreamChunk> {
    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          yield { finished: true };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              yield { finished: true };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              
              if (delta?.content) {
                yield { content: delta.content };
              }

              if (parsed.choices?.[0]?.finish_reason === 'stop') {
                yield { finished: true };
                return;
              }
            } catch (e) {
              // Skip malformed JSON
              continue;
            }
          }
        }
      }
    } catch (error) {
      yield { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const chunks: string[] = [];
    
    for await (const chunk of this.chatStream(messages)) {
      if (chunk.error) {
        throw new Error(chunk.error);
      }
      if (chunk.content) {
        chunks.push(chunk.content);
      }
      if (chunk.finished) {
        break;
      }
    }
    
    return chunks.join('');
  }

  // Generate a title for a conversation based on the first message
  async generateTitle(firstMessage: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant that creates short, descriptive titles for conversations. Generate a brief title (max 6 words) that captures the essence of the user\'s message. Return only the title, no extra text.'
      },
      {
        role: 'user',
        content: firstMessage
      }
    ];

    try {
      const title = await this.chat(messages);
      return title.trim().replace(/["']/g, '');
    } catch (error) {
      // Fallback to first few words if AI title generation fails
      return firstMessage.split(' ').slice(0, 6).join(' ');
    }
  }
}