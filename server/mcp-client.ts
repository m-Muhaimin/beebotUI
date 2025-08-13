import { EventEmitter } from "events";
import { spawn, ChildProcess } from "child_process";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import EventSource from "eventsource";

interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

interface StreamChunk {
  content?: string;
  finished?: boolean;
  error?: string;
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export class MCPChatClient extends EventEmitter {
  private apiKey: string;
  private apiUrl: string;
  private model: string;
  private weatherServer: ChildProcess | null = null;
  private searchServer: ChildProcess | null = null;
  private jinaApiKey: string | null = null;
  private availableTools: MCPTool[] = [];
  private pendingRequests: Map<
    string,
    { resolve: Function; reject: Function }
  > = new Map();

  constructor(
    apiKey: string,
    apiUrl = "https://api.deepseek.com",
    model = "deepseek-chat",
  ) {
    super();
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.model = model;
    this.jinaApiKey = process.env.JINA_API_KEY || null;

    this.initializeWeatherServer();
    this.initializeSearchServer();
    this.initializeJinaTools();
  }

  private async initializeWeatherServer() {
    try {
      // Create the weather server file
      const weatherServerCode = `#!/usr/bin/env python3
import json
import sys
import asyncio
import httpx
from typing import Any, Dict

# Weather tools implementation
class WeatherTools:
    NWS_API_BASE = "https://api.weather.gov"
    USER_AGENT = "weather-app/1.0"
    
    async def make_nws_request(self, url: str) -> Dict[str, Any] | None:
        """Make a request to the NWS API with proper error handling."""
        headers = {
            "User-Agent": self.USER_AGENT,
            "Accept": "application/geo+json"
        }
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, timeout=30.0)
                response.raise_for_status()
                return response.json()
            except Exception:
                return None

    def format_alert(self, feature: dict) -> str:
        """Format an alert feature into a readable string."""
        props = feature["properties"]
        return f"""
Event: {props.get('event', 'Unknown')}
Area: {props.get('areaDesc', 'Unknown')}
Severity: {props.get('severity', 'Unknown')}
Description: {props.get('description', 'No description available')}
Instructions: {props.get('instruction', 'No specific instructions provided')}
"""

    async def get_alerts(self, state: str) -> str:
        """Get weather alerts for a US state."""
        url = f"{self.NWS_API_BASE}/alerts/active/area/{state}"
        data = await self.make_nws_request(url)

        if not data or "features" not in data:
            return "Unable to fetch alerts or no alerts found."

        if not data["features"]:
            return "No active alerts for this state."

        alerts = [self.format_alert(feature) for feature in data["features"]]
        return "\\n---\\n".join(alerts)

    async def get_forecast(self, latitude: float, longitude: float) -> str:
        """Get weather forecast for a location."""
        points_url = f"{self.NWS_API_BASE}/points/{latitude},{longitude}"
        points_data = await self.make_nws_request(points_url)

        if not points_data:
            return "Unable to fetch forecast data for this location."

        forecast_url = points_data["properties"]["forecast"]
        forecast_data = await self.make_nws_request(forecast_url)

        if not forecast_data:
            return "Unable to fetch detailed forecast."

        periods = forecast_data["properties"]["periods"]
        forecasts = []
        for period in periods[:5]:
            forecast = f"""
{period['name']}:
Temperature: {period['temperature']}°{period['temperatureUnit']}
Wind: {period['windSpeed']} {period['windDirection']}
Forecast: {period['detailedForecast']}
"""
            forecasts.append(forecast)

        return "\\n---\\n".join(forecasts)

    async def get_weather_by_city(self, city: str) -> str:
        """Get weather forecast for a city by name."""
        city_coords = {
            "new york": (40.7831, -73.9712),
            "san francisco": (37.7749, -122.4194),
            "los angeles": (34.0522, -118.2437),
            "chicago": (41.8781, -87.6298),
            "houston": (29.7604, -95.3698),
            "miami": (25.7617, -80.1918),
            "seattle": (47.6062, -122.3321),
            "denver": (39.7392, -104.9903),
            "atlanta": (33.7490, -84.3880),
            "boston": (42.3601, -71.0589),
            "dhaka": (23.8103, 90.4125),
            "washington": (38.9072, -77.0369),
            "philadelphia": (39.9526, -75.1652),
            "phoenix": (33.4484, -112.0740),
            "las vegas": (36.1699, -115.1398)
        }
        
        city_lower = city.lower().strip()
        
        if city_lower in city_coords:
            lat, lon = city_coords[city_lower]
            return await self.get_forecast(lat, lon)
        else:
            return f"Sorry, I don't have coordinates for '{city}'. Available cities: {', '.join(city_coords.keys())}"

# MCP Server implementation
class MCPServer:
    def __init__(self):
        self.weather = WeatherTools()
        self.tools = {
            "get_forecast": {
                "name": "get_forecast",
                "description": "Get weather forecast for a location using latitude and longitude coordinates",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "latitude": {"type": "number", "description": "Latitude of the location"},
                        "longitude": {"type": "number", "description": "Longitude of the location"}
                    },
                    "required": ["latitude", "longitude"]
                }
            },
            "get_weather_by_city": {
                "name": "get_weather_by_city",
                "description": "Get weather forecast for a city by name (supports major US cities and Dhaka)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "city": {"type": "string", "description": "Name of the city (e.g., 'New York', 'San Francisco', 'Dhaka')"}
                    },
                    "required": ["city"]
                }
            },
            "get_alerts": {
                "name": "get_alerts",
                "description": "Get weather alerts for a US state",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "state": {"type": "string", "description": "Two-letter US state code (e.g., 'CA', 'NY')"}
                    },
                    "required": ["state"]
                }
            }
        }

    async def handle_request(self, request):
        method = request.get("method")
        params = request.get("params", {})
        
        if method == "tools/list":
            return {"tools": list(self.tools.values())}
        
        elif method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})
            
            if tool_name == "get_forecast":
                result = await self.weather.get_forecast(arguments["latitude"], arguments["longitude"])
            elif tool_name == "get_weather_by_city":
                result = await self.weather.get_weather_by_city(arguments["city"])
            elif tool_name == "get_alerts":
                result = await self.weather.get_alerts(arguments["state"])
            else:
                return {"error": {"code": -32601, "message": f"Unknown tool: {tool_name}"}}
            
            return {"content": [{"type": "text", "text": result}]}
        
        else:
            return {"error": {"code": -32601, "message": f"Unknown method: {method}"}}

async def main():
    server = MCPServer()
    
    while True:
        try:
            line = input()
            if not line.strip():
                continue
                
            request = json.loads(line)
            result = await server.handle_request(request)
            
            response = {
                "jsonrpc": "2.0",
                "id": request.get("id"),
                "result": result
            }
            
            print(json.dumps(response))
            sys.stdout.flush()
            
        except EOFError:
            break
        except Exception as e:
            error_response = {
                "jsonrpc": "2.0",
                "id": request.get("id") if 'request' in locals() else None,
                "error": {"code": -32000, "message": str(e)}
            }
            print(json.dumps(error_response))
            sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(main())
`;

      // Write the weather server file
      await fs.writeFile("weather_server.py", weatherServerCode);

      // Start the weather server process
      this.weatherServer = spawn("python3", ["weather_server.py"], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Set up communication handlers
      this.setupServerCommunication();

      // Initialize tools list with delay
      setTimeout(() => this.listTools(), 1000);

      console.log("Weather MCP server initialized successfully");
    } catch (error) {
      console.error("Failed to initialize weather server:", error);
    }
  }

  private async initializeSearchServer() {
    try {
      // Wait a bit for the Python packages to be available
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Start the search server process
      this.searchServer = spawn("python3", ["search_server.py"], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Set up communication handlers for search server
      this.setupSearchServerCommunication();

      // Initialize search tools list
      setTimeout(() => this.listTools(), 3000);

      console.log("Search MCP server initialized successfully");
    } catch (error) {
      console.error("Failed to initialize search server:", error);
    }
  }

  private async initializeJinaTools() {
    try {
      // Add Jina AI tools directly to available tools
      const jinaTools: MCPTool[] = [
        {
          name: "read_url",
          description: "Extract clean, structured content from web pages as markdown using Jina Reader API",
          inputSchema: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "The URL to read and extract content from"
              }
            },
            required: ["url"]
          }
        },
        {
          name: "capture_screenshot_url",
          description: "Capture high-quality screenshots of web pages using Jina Reader API",
          inputSchema: {
            type: "object",
            properties: {
              url: {
                type: "string", 
                description: "The URL to capture a screenshot of"
              }
            },
            required: ["url"]
          }
        },
        {
          name: "search_web_jina",
          description: "Search the web for current information and news using Jina Reader API",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query to find information on the web"
              },
              num_results: {
                type: "integer",
                description: "Number of results to return (1-10)",
                minimum: 1,
                maximum: 10,
                default: 5
              }
            },
            required: ["query"]
          }
        },
        {
          name: "search_arxiv",
          description: "Search academic papers and preprints on arXiv repository using Jina Reader API",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query for academic papers"
              },
              num_results: {
                type: "integer", 
                description: "Number of results to return (1-10)",
                minimum: 1,
                maximum: 10,
                default: 5
              }
            },
            required: ["query"]
          }
        }
      ];

      // Add Jina tools to available tools
      this.availableTools.push(...jinaTools);

      console.log("Jina AI tools initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Jina tools:", error);
    }
  }

  private setupServerCommunication() {
    if (!this.weatherServer) return;

    this.weatherServer.stdout?.on("data", (data) => {
      const lines = data
        .toString()
        .split("\n")
        .filter((line: string) => line.trim());

      for (const line of lines) {
        try {
          const message = JSON.parse(line);

          if (message.id && this.pendingRequests.has(message.id)) {
            const { resolve, reject } = this.pendingRequests.get(message.id)!;
            this.pendingRequests.delete(message.id);

            if (message.error) {
              reject(new Error(message.error.message || "MCP Error"));
            } else {
              resolve(message.result);
            }
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }
    });

    this.weatherServer.stderr?.on("data", (data) => {
      console.error("Weather server error:", data.toString());
    });
  }

  private setupSearchServerCommunication() {
    if (!this.searchServer) return;

    this.searchServer.stdout?.on("data", (data) => {
      const lines = data
        .toString()
        .split("\n")
        .filter((line: string) => line.trim());

      for (const line of lines) {
        try {
          const message = JSON.parse(line);

          if (message.id && this.pendingRequests.has(message.id)) {
            const { resolve, reject } = this.pendingRequests.get(message.id)!;
            this.pendingRequests.delete(message.id);

            if (message.error) {
              reject(new Error(message.error.message || "MCP Error"));
            } else {
              resolve(message.result);
            }
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }
    });

    this.searchServer.stderr?.on("data", (data) => {
      console.error("Search server error:", data.toString());
    });
  }

  private async sendMCPRequest(
    method: string,
    params: any = {},
    serverType: "weather" | "search" = "weather",
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const server =
        serverType === "weather" ? this.weatherServer : this.searchServer;

      if (!server?.stdin) {
        reject(new Error(`${serverType} server not available`));
        return;
      }

      const id = randomUUID();
      const request = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, { resolve, reject });

      try {
        server.stdin.write(JSON.stringify(request) + "\n");
      } catch (error) {
        this.pendingRequests.delete(id);
        reject(error);
      }

      // Set timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`${serverType} server request timeout`));
        }
      }, 45000); // Longer timeout for search operations
    });
  }

  private async listTools(): Promise<void> {
    try {
      // Get tools from both servers
      const [weatherResponse, searchResponse] = await Promise.allSettled([
        this.sendMCPRequest("tools/list", {}, "weather"),
        this.sendMCPRequest("tools/list", {}, "search"),
      ]);

      this.availableTools = [];

      if (weatherResponse.status === "fulfilled") {
        this.availableTools.push(...(weatherResponse.value.tools || []));
      }

      if (searchResponse.status === "fulfilled") {
        this.availableTools.push(...(searchResponse.value.tools || []));
      }
    } catch (error) {
      console.error("Failed to list MCP tools:", error);
      this.availableTools = [];
    }
  }

  private async callTool(name: string, arguments_: any): Promise<string> {
    try {
      // Handle Jina AI tools
      const jinaTools = ["read_url", "capture_screenshot_url", "search_web_jina", "search_arxiv"];
      if (jinaTools.includes(name)) {
        return await this.callJinaTool(name, arguments_);
      }

      // Determine which server to use based on tool name  
      const isSearchTool = ["web_search", "deep_research"].includes(name);
      const serverType = isSearchTool ? "search" : "weather";

      const response = await this.sendMCPRequest(
        "tools/call",
        {
          name,
          arguments: arguments_,
        },
        serverType,
      );

      if (response.content && response.content[0]) {
        return response.content[0].text || JSON.stringify(response.content[0]);
      }

      return JSON.stringify(response);
    } catch (error) {
      return `Error calling tool ${name}: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async callJinaTool(name: string, arguments_: any): Promise<string> {
    try {
      const baseUrl = "https://r.jina.ai";
      const searchUrl = "https://s.jina.ai";
      
      let url: string;
      let options: any = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BeeBot/1.0'
        }
      };

      // Add Jina API key if available
      if (this.jinaApiKey) {
        options.headers['Authorization'] = `Bearer ${this.jinaApiKey}`;
      }

      switch (name) {
        case "read_url":
          url = `${baseUrl}/${encodeURIComponent(arguments_.url)}`;
          break;

        case "capture_screenshot_url":
          url = `${baseUrl}/${encodeURIComponent(arguments_.url)}`;
          options.headers['X-With-Images-Screenshot'] = 'true';
          break;

        case "search_web_jina":
          url = `${searchUrl}/${encodeURIComponent(arguments_.query)}`;
          if (arguments_.num_results) {
            url += `?count=${arguments_.num_results}`;
          }
          break;

        case "search_arxiv":
          url = `${searchUrl}/${encodeURIComponent(arguments_.query)}`;
          url += `?site=arxiv.org`;
          if (arguments_.num_results) {
            url += `&count=${arguments_.num_results}`;
          }
          break;

        default:
          throw new Error(`Unknown Jina tool: ${name}`);
      }

      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`Jina API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.text();
      return result;

    } catch (error) {
      return `Error calling Jina tool ${name}: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  async *chatStream(
    messages: ChatMessage[],
    selectedTool?: string | null,
  ): AsyncGenerator<StreamChunk> {
    try {
      // Handle manual tool selection with immediate execution

      if (selectedTool && selectedTool !== "reasoning") {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === "user") {
          // Directly call the selected tool with the user's query

          if (selectedTool === "web-search") {
            yield {
              content: `Searching the web on "${lastMessage.content}"...\n\n`,
            };

            // Run actual search
            const toolResult = await this.callTool("web_search", {
              query: lastMessage.content,
            });
            yield { content: toolResult };
            yield { finished: true };
            return;
          } else if (selectedTool === "deep-research") {
            yield {
              content: `🔬 Conducting deep research on "${lastMessage.content}"...\n\n`,
            };
            const toolResult = await this.callTool("deep_research", {
              topic: lastMessage.content,
            });
            yield { content: toolResult };
            yield { finished: true };
            return;
          }
        }
      }

      // Filter tools based on manual selection (for reasoning mode or fallback)
      let toolsToUse = this.availableTools;

      if (selectedTool) {
        switch (selectedTool) {
          case "web-search":
            toolsToUse = this.availableTools.filter(
              (tool) => tool.name === "web_search",
            );
            break;
          case "deep-research":
            toolsToUse = this.availableTools.filter(
              (tool) => tool.name === "deep_research",
            );
            break;
          case "reasoning":
            // For reasoning mode, disable all tools to force pure reasoning
            toolsToUse = [];
            break;
          default:
            // If selectedTool is not recognized, use all tools (fallback to auto mode)
            toolsToUse = this.availableTools;
        }
      }

      // Convert tools to OpenAI format
      const tools = toolsToUse.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));

      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          stream: true,
          tools: tools.length > 0 ? tools : undefined,
          tool_choice: tools.length > 0 ? "auto" : "none",
          max_tokens: 2000, // Limit response length to prevent rambling
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let toolCalls: ToolCall[] = [];
      let pendingToolResults: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;

              if (delta?.content) {
                yield { content: delta.content };
              }

              if (delta?.tool_calls) {
                for (const toolCall of delta.tool_calls) {
                  const index = toolCall.index || 0;
                  if (!toolCalls[index]) {
                    toolCalls[index] = {
                      id: toolCall.id || `call_${Date.now()}_${index}`,
                      type: "function",
                      function: {
                        name: toolCall.function?.name || "",
                        arguments: toolCall.function?.arguments || "",
                      },
                    };
                  } else {
                    if (toolCall.function?.name) {
                      toolCalls[index].function.name += toolCall.function.name;
                    }
                    if (toolCall.function?.arguments) {
                      toolCalls[index].function.arguments +=
                        toolCall.function.arguments;
                    }
                  }
                }
              }

              if (parsed.choices?.[0]?.finish_reason === "tool_calls") {
                // Process tool calls
                for (const toolCall of toolCalls) {
                  const toolName = toolCall.function.name;
                  let toolArgs;

                  try {
                    toolArgs = JSON.parse(toolCall.function.arguments);
                  } catch (e) {
                    yield {
                      content: `\n\nError parsing tool arguments for ${toolName}: ${toolCall.function.arguments}`,
                    };
                    continue;
                  }

                  if (toolName === "get_forecast") {
                    yield {
                      content: `\n\n🌤️ Getting weather forecast for coordinates ${toolArgs.latitude}, ${toolArgs.longitude}...\n\n`,
                    };
                  } else if (toolName === "get_weather_by_city") {
                    yield {
                      content: `\n\n🌤️ Getting weather forecast for ${toolArgs.city}...\n\n`,
                    };
                  } else if (toolName === "get_alerts") {
                    yield {
                      content: `\n\n⚠️ Getting weather alerts for ${toolArgs.state}...\n\n`,
                    };
                  } else if (toolName === "web_search") {
                    yield {
                      content: `\n\n🔍 Searching the web for "${toolArgs.query}"...\n\n`,
                    };
                  } else if (toolName === "deep_research") {
                    yield {
                      content: `\n\n🔬 Conducting deep research on "${toolArgs.query}"...\n\n`,
                    };
                  } else if (toolName === "read_url") {
                    yield {
                      content: `\n\n📄 Reading content from ${toolArgs.url}...\n\n`,
                    };
                  } else if (toolName === "capture_screenshot_url") {
                    yield {
                      content: `\n\n📸 Capturing screenshot of ${toolArgs.url}...\n\n`,
                    };
                  } else if (toolName === "search_web_jina") {
                    yield {
                      content: `\n\n🌐 Searching the web for "${toolArgs.query}" using Jina AI...\n\n`,
                    };
                  } else if (toolName === "search_arxiv") {
                    yield {
                      content: `\n\n🔬 Searching arXiv papers for "${toolArgs.query}"...\n\n`,
                    };
                  }

                  const toolResult = await this.callTool(toolName, toolArgs);

                  if (
                    toolName === "web_search" ||
                    toolName === "deep_research"
                  ) {
                    yield { content: `${toolResult}\n\n` };
                    pendingToolResults.push(toolResult);
                  } else {
                    yield { content: toolResult };
                  }
                }

                // For search tools, we already streamed the results - no need for follow-up
                if (pendingToolResults.length > 0) {
                  // Search results were already streamed, just end here
                  yield { finished: true };
                  return;
                }
              }

              if (
                parsed.choices?.[0]?.finish_reason === "stop" ||
                parsed.choices?.[0]?.finish_reason === "tool_calls"
              ) {
                yield { finished: true };
                return;
              }
            } catch (e) {
              // Ignore JSON parsing errors for streaming data
            }
          }
        }
      }

      // Only yield finished if we haven't already returned
      yield { finished: true };
    } catch (error) {
      yield {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async chat(
    messages: ChatMessage[],
    selectedTool?: string | null,
  ): Promise<string> {
    const chunks: string[] = [];

    for await (const chunk of this.chatStream(messages, selectedTool)) {
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

    return chunks.join("");
  }

  // Generate a title for a conversation based on the first message
  async generateTitle(firstMessage: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that creates short, descriptive titles for conversations. Generate a brief title (max 6 words) that captures the essence of the user's message. Return only the title, no extra text.",
            },
            {
              role: "user",
              content: firstMessage,
            },
          ],
          max_tokens: 20,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const title = data.choices?.[0]?.message?.content?.trim() || "";

      return (
        title.replace(/["']/g, "") ||
        firstMessage.split(" ").slice(0, 6).join(" ")
      );
    } catch (error) {
      // Fallback to first few words if AI title generation fails
      return firstMessage.split(" ").slice(0, 6).join(" ");
    }
  }

  cleanup() {
    if (this.weatherServer) {
      this.weatherServer.kill();
      this.weatherServer = null;
    }
    if (this.searchServer) {
      this.searchServer.kill();
      this.searchServer = null;
    }
  }
}
