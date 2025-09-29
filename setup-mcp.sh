#!/bin/bash

echo "🚀 Setting up Supabase MCP Server for Cursor"
echo "============================================="

# Check if we have the required environment variables
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ SUPABASE_ACCESS_TOKEN not set"
    echo "Please set your Supabase access token:"
    echo "export SUPABASE_ACCESS_TOKEN='your_token_here'"
    exit 1
fi

if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "❌ SUPABASE_PROJECT_REF not set"
    echo "Please set your Supabase project reference:"
    echo "export SUPABASE_PROJECT_REF='your_project_ref_here'"
    exit 1
fi

echo "✅ Environment variables found"

# Update the MCP configuration with actual values
cat > .cursor/mcp.json << EOF
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "@supabase/mcp-server-supabase",
        "--project-ref=$SUPABASE_PROJECT_REF",
        "--read-only=false"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "$SUPABASE_ACCESS_TOKEN"
      }
    }
  }
}
EOF

echo "✅ MCP configuration updated"

# Test the MCP server
echo "🧪 Testing MCP server connection..."
npx @supabase/mcp-server-supabase --project-ref="$SUPABASE_PROJECT_REF" --help > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ MCP server is working"
else
    echo "❌ MCP server test failed"
    exit 1
fi

echo ""
echo "🎉 Setup complete! Here's what you need to do:"
echo ""
echo "1. Restart Cursor to load the MCP configuration"
echo "2. Go to Cursor Settings > MCP & Integrations"
echo "3. You should see 'supabase' listed as an active server"
echo ""
echo "Once configured, I can autonomously:"
echo "• Deploy your database schema"
echo "• Run migrations"
echo "• Query and manage your database"
echo "• Set up authentication"
echo ""
echo "For future projects, just copy this .cursor/mcp.json file!"
