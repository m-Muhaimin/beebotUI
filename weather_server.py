#!/usr/bin/env python3
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
<<<<<<< HEAD
        return "\\n---\\n".join(alerts)
=======
        return "\n---\n".join(alerts)
>>>>>>> 715dfa8 (Feature: Deep Search | Web Search)

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

<<<<<<< HEAD
        return "\\n---\\n".join(forecasts)
=======
        return "\n---\n".join(forecasts)
>>>>>>> 715dfa8 (Feature: Deep Search | Web Search)

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
