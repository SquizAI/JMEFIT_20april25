import fs from 'fs';
import https from 'https';

// Supabase credentials from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
  console.error('\nPlease set these in your .env file');
  process.exit(1);
}

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
