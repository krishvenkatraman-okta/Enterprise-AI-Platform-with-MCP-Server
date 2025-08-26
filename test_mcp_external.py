#!/usr/bin/env python3
"""
Test script for MCP External LLM API
This demonstrates how external LLM systems can directly access inventory data
"""

import requests
import base64
import json
import sys

# MCP Server Configuration
MCP_BASE_URL = "http://localhost:5000"
CLIENT_ID = "mcp_inventory_server_001"
CLIENT_SECRET = "mcp_server_secret_2024_inventory_access"

def create_basic_auth():
    """Create Basic auth header for MCP client credentials"""
    credentials = f"{CLIENT_ID}:{CLIENT_SECRET}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    return f"Basic {encoded_credentials}"

def query_inventory(query_type, filters=None):
    """Query inventory through MCP external endpoint"""
    url = f"{MCP_BASE_URL}/mcp/external/inventory"
    
    payload = {
        "query": {
            "type": query_type
        }
    }
    
    if filters:
        payload["query"]["filters"] = filters
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": create_basic_auth()
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error querying inventory: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return None

def main():
    print("🤖 MCP External LLM API Test")
    print("=" * 50)
    
    # Test 1: Get California warehouse inventory
    print("\n1. Testing California warehouse query...")
    california_data = query_inventory("warehouse", {"state": "California"})
    if california_data:
        print("✅ California warehouse query successful")
        warehouse = california_data["data"]["warehouse"]
        print(f"   Warehouse: {warehouse['name']} ({warehouse['location']})")
        print(f"   Total Items: {california_data['data']['totalItems']}")
        print(f"   Low Stock Items: {len(california_data['data']['lowStockItems'])}")
    else:
        print("❌ California warehouse query failed")
    
    # Test 2: Get all inventory
    print("\n2. Testing all inventory query...")
    all_inventory = query_inventory("all_inventory")
    if all_inventory:
        print("✅ All inventory query successful")
        warehouses = all_inventory["data"]
        print(f"   Total Warehouses: {len(warehouses)}")
        for warehouse_data in warehouses:
            warehouse = warehouse_data["warehouse"]
            print(f"   - {warehouse['name']} ({warehouse['state']}): {warehouse_data['totalItems']} items")
    else:
        print("❌ All inventory query failed")
    
    # Test 3: Get low stock items
    print("\n3. Testing low stock query...")
    low_stock = query_inventory("low_stock")
    if low_stock:
        print("✅ Low stock query successful")
        low_stock_warehouses = low_stock["data"]
        if low_stock_warehouses:
            print(f"   Warehouses with low stock: {len(low_stock_warehouses)}")
            for warehouse_data in low_stock_warehouses:
                print(f"   - {warehouse_data['warehouse']}: {len(warehouse_data['lowStockItems'])} low stock items")
        else:
            print("   No low stock items found")
    else:
        print("❌ Low stock query failed")
    
    # Test 4: Configuration endpoint
    print("\n4. Testing configuration endpoint...")
    try:
        config_response = requests.get(f"{MCP_BASE_URL}/mcp/config")
        config_response.raise_for_status()
        config = config_response.json()
        print("✅ Configuration query successful")
        print(f"   Server: {config['serverName']}")
        print(f"   External Endpoint: {config['endpoints']['externalInventory']}")
        print(f"   Supported Queries: {', '.join(config['supportedQueries'])}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Configuration query failed: {e}")

if __name__ == "__main__":
    main()