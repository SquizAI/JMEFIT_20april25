#!/bin/bash

# Supabase credentials from .env file
SUPABASE_URL="https://jjmaxsmlrcizxfgucvzx.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqbWF4c21scmNpenhmZ3Vjdnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NTQxMjIsImV4cCI6MjA1ODIzMDEyMn0.gl4BX2tyGkzby5mkDG0OHUkpa2qV5owYfEjJt0JZYWs"

# Read SQL script
SQL_SCRIPT=$(cat db-setup.sql)

# Execute SQL script via Supabase REST API
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/execute_sql" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${SQL_SCRIPT}\"}"

echo -e "\n\nSQL script executed. Check for any errors in the response above."
