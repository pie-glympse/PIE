import https from 'https';
import http from 'http';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

function pingDatabase() {
  const url = `${APP_URL}/api/health`;
  const client = url.startsWith('https') ? https : http;
  
  console.log(`[${new Date().toISOString()}] Pinging database: ${url}`);
  
  client.get(url, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`[${new Date().toISOString()}] Database ping successful:`, response);
      } catch (error) {
        console.log(`[${new Date().toISOString()}] Database ping response:`, data);
      }
    });
  }).on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Database ping failed:`, error.message);
  });
}

// Run the ping
pingDatabase();
