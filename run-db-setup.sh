#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "ERROR: .env file not found"
  exit 1
fi

# Supabase credentials from environment variables
SUPABASE_URL="${VITE_SUPABASE_URL:-${SUPABASE_URL}}"
SUPABASE_KEY="${VITE_SUPABASE_ANON_KEY:-${SUPABASE_ANON_KEY}}"

# Validate required variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "ERROR: Missing required environment variables:"
  echo "- VITE_SUPABASE_URL or SUPABASE_URL"
  echo "- VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY"
  echo ""
  echo "Please set these in your .env file"
  exit 1
fi

# Read SQL script
SQL_SCRIPT=$(cat db-setup.sql)

# Execute SQL script via Supabase REST API
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/execute_sql" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${SQL_SCRIPT}\"}"

echo -e "\n\nSQL script executed. Check for any errors in the response above."
