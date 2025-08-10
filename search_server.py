#!/usr/bin/env python3

import json
import sys
import asyncio
import os
from typing import Dict, Any, Optional
from exa_py import Exa
from datetime import datetime, timedelta

class MCPServer:
    def __init__(self):
        api_key = os.getenv('EXA_API_KEY')
        if not api_key:
            raise ValueError("EXA_API_KEY environment variable is required")
        self.exa = Exa(api_key=api_key)
        
    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        method = request.get("method")
        
        if method == "initialize":
            return {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {}
                },
                "serverInfo": {
                    "name": "search-server",
                    "version": "1.0.0"
                }
            }
        elif method == "tools/list":
            return {
                "tools": [
                    {
                        "name": "web_search",
                        "description": "Search the web for current information and content",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "Search query"
                                },
                                "num_results": {
                                    "type": "integer",
                                    "description": "Number of results to return (1-10)",
                                    "minimum": 1,
                                    "maximum": 10,
                                    "default": 5
                                }
                            },
                            "required": ["query"]
                        }
                    },
                    {
                        "name": "deep_research",
                        "description": "Perform comprehensive research on a topic with detailed analysis",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "topic": {
                                    "type": "string",
                                    "description": "Research topic or question"
                                },
                                "focus": {
                                    "type": "string",
                                    "description": "Specific aspect to focus on (optional)",
                                    "default": "general overview"
                                }
                            },
                            "required": ["topic"]
                        }
                    }
                ]
            }
        elif method == "tools/call":
            tool_name = request["params"]["name"]
            arguments = request["params"]["arguments"]
            
            if tool_name == "web_search":
                return await self.web_search(arguments)
            elif tool_name == "deep_research":
                return await self.deep_research(arguments)
            else:
                return {"error": {"code": -32601, "message": f"Unknown tool: {tool_name}"}}
        else:
            return {"error": {"code": -32601, "message": f"Unknown method: {method}"}}

    async def web_search(self, args: Dict[str, Any]) -> Dict[str, Any]:
        try:
            query = args["query"]
            num_results = args.get("num_results", 5)
            
            # Perform search with content
            result = self.exa.search_and_contents(
                query=query,
                type="auto",
                num_results=num_results,
                start_published_date=(datetime.now() - timedelta(days=365)).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                end_published_date=datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                livecrawl="preferred",
                summary={
                    "query": "Generate concise summary with key information and takeaways"
                },
                extras={
                    "links": 1,
                    "image_links": 0
                }
            )
            
            # Format results
            formatted_results = []
            for i, item in enumerate(result.results, 1):
                formatted_result = f"**Result {i}: {item.title}**\n"
                formatted_result += f"URL: {item.url}\n"
                if hasattr(item, 'published_date') and item.published_date:
                    formatted_result += f"Published: {item.published_date}\n"
                if hasattr(item, 'summary') and item.summary:
                    formatted_result += f"Summary: {item.summary}\n"
                formatted_result += "---\n"
                formatted_results.append(formatted_result)
            
            content = f"Search Results for: \"{query}\"\n\n" + "\n".join(formatted_results)
            
            return {
                "content": [
                    {
                        "type": "text",
                        "text": content
                    }
                ]
            }
            
        except Exception as e:
            return {
                "content": [
                    {
                        "type": "text",
                        "text": f"Error performing web search: {str(e)}"
                    }
                ],
                "isError": True
            }

    async def deep_research(self, args: Dict[str, Any]) -> Dict[str, Any]:
        try:
            topic = args["topic"]
            focus = args.get("focus", "general overview")
            
            # Create research task
            research_query = f"Research {topic} with focus on {focus}. Provide comprehensive analysis, key findings, recent developments, and authoritative sources."
            
            # Perform comprehensive search
            result = self.exa.search_and_contents(
                query=research_query,
                type="auto",
                num_results=8,
                start_published_date=(datetime.now() - timedelta(days=730)).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                end_published_date=datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                livecrawl="preferred",
                summary={
                    "query": "Generate comprehensive analysis with detailed insights, key findings, recent developments, and important context"
                },
                extras={
                    "links": 1,
                    "image_links": 0
                }
            )
            
            # Format research findings
            content = f"**Deep Research Analysis: {topic}**\n"
            content += f"Focus Area: {focus}\n\n"
            
            # Group results by relevance and recency
            recent_results = []
            comprehensive_results = []
            
            for item in result.results:
                if hasattr(item, 'summary') and item.summary:
                    formatted_item = {
                        'title': item.title,
                        'url': item.url,
                        'summary': item.summary,
                        'published_date': getattr(item, 'published_date', None)
                    }
                    
                    # Categorize by recency (if published date available)
                    if formatted_item['published_date']:
                        try:
                            pub_date = datetime.fromisoformat(formatted_item['published_date'].replace('Z', '+00:00'))
                            if (datetime.now() - pub_date.replace(tzinfo=None)).days < 90:
                                recent_results.append(formatted_item)
                            else:
                                comprehensive_results.append(formatted_item)
                        except:
                            comprehensive_results.append(formatted_item)
                    else:
                        comprehensive_results.append(formatted_item)
            
            # Add recent developments section
            if recent_results:
                content += "## Recent Developments\n\n"
                for item in recent_results[:3]:
                    content += f"**{item['title']}**\n"
                    content += f"Source: {item['url']}\n"
                    if item['published_date']:
                        content += f"Published: {item['published_date']}\n"
                    content += f"{item['summary']}\n\n---\n\n"
            
            # Add comprehensive analysis section
            if comprehensive_results:
                content += "## Comprehensive Analysis\n\n"
                for item in comprehensive_results[:5]:
                    content += f"**{item['title']}**\n"
                    content += f"Source: {item['url']}\n"
                    if item['published_date']:
                        content += f"Published: {item['published_date']}\n"
                    content += f"{item['summary']}\n\n---\n\n"
            
            # Add key sources section
            content += "## Key Sources\n\n"
            all_sources = recent_results + comprehensive_results
            for i, item in enumerate(all_sources[:8], 1):
                content += f"{i}. [{item['title']}]({item['url']})\n"
            
            return {
                "content": [
                    {
                        "type": "text",
                        "text": content
                    }
                ]
            }
            
        except Exception as e:
            return {
                "content": [
                    {
                        "type": "text",
                        "text": f"Error performing deep research: {str(e)}"
                    }
                ],
                "isError": True
            }

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
                "id": None,
                "error": {"code": -32000, "message": str(e)}
            }
            print(json.dumps(error_response))
            sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(main())