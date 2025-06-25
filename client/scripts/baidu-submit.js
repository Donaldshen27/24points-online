#!/usr/bin/env node

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Baidu submission configuration
const BAIDU_API_URL = 'http://data.zz.baidu.com/urls';
const SITE = 'https://twentyfourpoints.com';
const TOKEN = 'VyiB9zL3nvzREv5I';

// URLs to submit
const urls = [
  'https://twentyfourpoints.com/',
  'https://twentyfourpoints.com/zh',
  'https://twentyfourpoints.com/room',
  'https://twentyfourpoints.com/solo',
  'https://twentyfourpoints.com/about',
  'https://twentyfourpoints.com/privacy',
  'https://twentyfourpoints.com/contact'
];

// Function to submit URLs to Baidu
function submitToBaidu(urlList) {
  const data = urlList.join('\n');
  
  const url = new URL(`${BAIDU_API_URL}?site=${encodeURIComponent(SITE)}&token=${TOKEN}`);
  
  const options = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  console.log('Submitting URLs to Baidu...');
  console.log('URLs:', urlList);

  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(responseData);
        console.log('\nBaidu Submission Result:');
        console.log('Status Code:', res.statusCode);
        console.log('Response:', JSON.stringify(result, null, 2));
        
        if (result.success) {
          console.log(`\n✅ Successfully submitted ${result.success} URLs`);
          console.log(`📊 Remaining quota for today: ${result.remain}`);
        }
        
        if (result.not_same_site && result.not_same_site.length > 0) {
          console.log('\n⚠️  URLs not from this site:', result.not_same_site);
        }
        
        if (result.not_valid && result.not_valid.length > 0) {
          console.log('\n❌ Invalid URLs:', result.not_valid);
        }
      } catch (e) {
        console.error('Error parsing response:', e);
        console.log('Raw response:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Error submitting to Baidu:', e);
  });

  req.write(data);
  req.end();
}

// Create urls.txt file for manual submission
function createUrlsFile() {
  const urlsContent = urls.join('\n');
  const filePath = path.join(__dirname, 'urls.txt');
  
  fs.writeFileSync(filePath, urlsContent);
  console.log(`\n📄 Created urls.txt file at: ${filePath}`);
  console.log('You can also submit manually using:');
  console.log(`curl -H 'Content-Type:text/plain' --data-binary @${filePath} "${BAIDU_API_URL}?site=${SITE}&token=${TOKEN}"`);
}

// Main execution
console.log('🚀 Baidu URL Submission Tool');
console.log('============================\n');

// Submit URLs programmatically
submitToBaidu(urls);

// Also create urls.txt for manual submission
createUrlsFile();