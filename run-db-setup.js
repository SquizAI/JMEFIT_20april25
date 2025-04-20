import fs from 'fs';
import https from 'https';

// Supabase credentials
const SUPABASE_URL = 'https://jjmaxsmlrcizxfgucvzx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqbWF4c21scmNpenhmZ3Vjdnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NTQxMjIsImV4cCI6MjA1ODIzMDEyMn0.gl4BX2tyGkzby5mkDG0OHUkpa2qV5owYfEjJt0JZYWs';

// Read SQL script
const sqlScript = fs.readFileSync('db-setup.sql', 'utf8');

// Prepare the request data
const data = JSON.stringify({
  query: sqlScript
});

// Set up the request options
const options = {
  hostname: SUPABASE_URL.replace('https://', ''),
  path: '/rest/v1/rpc/execute_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Length': data.length
  }
};

// Make the request
const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Headers:', res.headers);
    
    try {
      const parsedData = JSON.parse(responseData);
      console.log('Response Data:', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.log('Raw Response:', responseData);
    }
    
    console.log('\nSQL script execution completed.');
  });
});

req.on('error', (error) => {
  console.error('Error executing SQL script:', error);
});

// Write data to request body
req.write(data);
req.end();

console.log('Executing SQL script on Supabase...');
