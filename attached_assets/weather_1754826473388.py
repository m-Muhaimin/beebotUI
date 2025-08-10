<<<<<<< HEAD
from typing import Any
import httpx
from mcp.server.fastmcp import FastMCP
import re
import aiohttp


# Initialize FastMCP server
mcp = FastMCP("weather")

# Constants
NWS_API_BASE = "https://api.weather.gov"
USER_AGENT = "weather-app/1.0"

# Replace with your real geocoding API details
GEOCODE_API_URL = "https://api.openweathermap.org/geo/1.0/direct"
GEOCODE_API_KEY = "YOUR_API_KEY"


async def geocode_location(location: str):
    """Convert a location name into lat/lon using your geocoding API."""
    params = {
        "q": location,
        "limit": 1,
        "appid": GEOCODE_API_KEY
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(GEOCODE_API_URL, params=params) as resp:
            data = await resp.json()
            if data:
                return data[0]["lat"], data[0]["lon"]
            return None, None


async def handle_weather_query(query: str, mcp_client):
    """Parse location, geocode, and call MCP weather tools."""
    location_match = re.search(r"\b([A-Za-z\s]+)\b", query)
    if not location_match:
        return ("To check the current weather or alerts, please tell me your city/region.")

    location = location_match.group(1).strip()
    lat, lon = await geocode_location(location)

    if not lat or not lon:
        return f"Sorry, I couldn't find coordinates for '{location}'. Please try again."

    # Example: call your MCP server's forecast tool
    forecast_result = await mcp_client.call_tool("get_forecast", {"lat": lat, "lon": lon})
    return forecast_result["result"]


async def make_nws_request(url: str) -> dict[str, Any] | None:
    """Make a request to the NWS API with proper error handling."""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/geo+json"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except Exception:
            return None

def format_alert(feature: dict) -> str:
    """Format an alert feature into a readable string."""
    props = feature["properties"]
    return f"""
Event: {props.get('event', 'Unknown')}
Area: {props.get('areaDesc', 'Unknown')}
Severity: {props.get('severity', 'Unknown')}
Description: {props.get('description', 'No description available')}
Instructions: {props.get('instruction', 'No specific instructions provided')}
"""

@mcp.tool()
async def get_alerts(state: str) -> str:
    """Get weather alerts for a US state.

    Args:
        state: Two-letter US state code (e.g. CA, NY)
    """
    url = f"{NWS_API_BASE}/alerts/active/area/{state}"
    data = await make_nws_request(url)

    if not data or "features" not in data:
        return "Unable to fetch alerts or no alerts found."

    if not data["features"]:
        return "No active alerts for this state."

    alerts = [format_alert(feature) for feature in data["features"]]
    return "\n---\n".join(alerts)

@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Get weather forecast for a location.

    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
    """
    # First get the forecast grid endpoint
    points_url = f"{NWS_API_BASE}/points/{latitude},{longitude}"
    points_data = await make_nws_request(points_url)

    if not points_data:
        return "Unable to fetch forecast data for this location."

    # Get the forecast URL from the points response
    forecast_url = points_data["properties"]["forecast"]
    forecast_data = await make_nws_request(forecast_url)

    if not forecast_data:
        return "Unable to fetch detailed forecast."

    # Format the periods into a readable forecast
    periods = forecast_data["properties"]["periods"]
    forecasts = []
    for period in periods[:5]:  # Only show next 5 periods
        forecast = f"""
{period['name']}:
Temperature: {period['temperature']}°{period['temperatureUnit']}
Wind: {period['windSpeed']} {period['windDirection']}
Forecast: {period['detailedForecast']}
"""
        forecasts.append(forecast)

    return "\n---\n".join(forecasts)

import re

@mcp.tool()
async def query_router(query: str) -> str:
    """Route the query to the correct weather tool."""

    # Check for alert queries with state code (CA, NY, etc.)
    alert_match = re.search(r'\b(alerts?|warnings?)\b.*\b([A-Z]{2})\b', query, re.I)
    if alert_match:
        state = alert_match.group(2).upper()
        return await get_alerts(state)

    # Check for forecast with lat, lon coordinates
    coords_match = re.search(r'forecast.*?(-?\d+\.\d+)[ ,]+(-?\d+\.\d+)', query, re.I)
    if coords_match:
        lat = float(coords_match.group(1))
        lon = float(coords_match.group(2))
        return await get_forecast(lat, lon)

    # Basic city name matching for demo
    if "new york" in query.lower():
        return await get_forecast(40.7831, -73.9712)
    if "san francisco" in query.lower():
        return await get_forecast(37.7749, -122.4194)

    return "Sorry, I couldn't understand your request. Please specify a state code for alerts or coordinates for forecast."


if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport='stdio')


=======
from typing import Any
import httpx
from mcp.server.fastmcp import FastMCP
import re
import aiohttp


# Initialize FastMCP server
mcp = FastMCP("weather")

# Constants
NWS_API_BASE = "https://api.weather.gov"
USER_AGENT = "weather-app/1.0"

# Replace with your real geocoding API details
GEOCODE_API_URL = "https://api.openweathermap.org/geo/1.0/direct"
GEOCODE_API_KEY = "YOUR_API_KEY"


async def geocode_location(location: str):
    """Convert a location name into lat/lon using your geocoding API."""
    params = {
        "q": location,
        "limit": 1,
        "appid": GEOCODE_API_KEY
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(GEOCODE_API_URL, params=params) as resp:
            data = await resp.json()
            if data:
                return data[0]["lat"], data[0]["lon"]
            return None, None


async def handle_weather_query(query: str, mcp_client):
    """Parse location, geocode, and call MCP weather tools."""
    location_match = re.search(r"\b([A-Za-z\s]+)\b", query)
    if not location_match:
        return ("To check the current weather or alerts, please tell me your city/region.")

    location = location_match.group(1).strip()
    lat, lon = await geocode_location(location)

    if not lat or not lon:
        return f"Sorry, I couldn't find coordinates for '{location}'. Please try again."

    # Example: call your MCP server's forecast tool
    forecast_result = await mcp_client.call_tool("get_forecast", {"lat": lat, "lon": lon})
    return forecast_result["result"]


async def make_nws_request(url: str) -> dict[str, Any] | None:
    """Make a request to the NWS API with proper error handling."""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/geo+json"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except Exception:
            return None

def format_alert(feature: dict) -> str:
    """Format an alert feature into a readable string."""
    props = feature["properties"]
    return f"""
Event: {props.get('event', 'Unknown')}
Area: {props.get('areaDesc', 'Unknown')}
Severity: {props.get('severity', 'Unknown')}
Description: {props.get('description', 'No description available')}
Instructions: {props.get('instruction', 'No specific instructions provided')}
"""

@mcp.tool()
async def get_alerts(state: str) -> str:
    """Get weather alerts for a US state.

    Args:
        state: Two-letter US state code (e.g. CA, NY)
    """
    url = f"{NWS_API_BASE}/alerts/active/area/{state}"
    data = await make_nws_request(url)

    if not data or "features" not in data:
        return "Unable to fetch alerts or no alerts found."

    if not data["features"]:
        return "No active alerts for this state."

    alerts = [format_alert(feature) for feature in data["features"]]
    return "\n---\n".join(alerts)

@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Get weather forecast for a location.

    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
    """
    # First get the forecast grid endpoint
    points_url = f"{NWS_API_BASE}/points/{latitude},{longitude}"
    points_data = await make_nws_request(points_url)

    if not points_data:
        return "Unable to fetch forecast data for this location."

    # Get the forecast URL from the points response
    forecast_url = points_data["properties"]["forecast"]
    forecast_data = await make_nws_request(forecast_url)

    if not forecast_data:
        return "Unable to fetch detailed forecast."

    # Format the periods into a readable forecast
    periods = forecast_data["properties"]["periods"]
    forecasts = []
    for period in periods[:5]:  # Only show next 5 periods
        forecast = f"""
{period['name']}:
Temperature: {period['temperature']}°{period['temperatureUnit']}
Wind: {period['windSpeed']} {period['windDirection']}
Forecast: {period['detailedForecast']}
"""
        forecasts.append(forecast)

    return "\n---\n".join(forecasts)

import re

@mcp.tool()
async def query_router(query: str) -> str:
    """Route the query to the correct weather tool."""

    # Check for alert queries with state code (CA, NY, etc.)
    alert_match = re.search(r'\b(alerts?|warnings?)\b.*\b([A-Z]{2})\b', query, re.I)
    if alert_match:
        state = alert_match.group(2).upper()
        return await get_alerts(state)

    # Check for forecast with lat, lon coordinates
    coords_match = re.search(r'forecast.*?(-?\d+\.\d+)[ ,]+(-?\d+\.\d+)', query, re.I)
    if coords_match:
        lat = float(coords_match.group(1))
        lon = float(coords_match.group(2))
        return await get_forecast(lat, lon)

    # Basic city name matching for demo
    if "new york" in query.lower():
        return await get_forecast(40.7831, -73.9712)
    if "san francisco" in query.lower():
        return await get_forecast(37.7749, -122.4194)

    return "Sorry, I couldn't understand your request. Please specify a state code for alerts or coordinates for forecast."


if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport='stdio')


>>>>>>> 715dfa8 (Feature: Deep Search | Web Search)
