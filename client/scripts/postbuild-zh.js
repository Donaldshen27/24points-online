import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the built index.html to get the asset paths
const builtIndexPath = path.join(__dirname, '../dist/index.html');
const builtIndexContent = fs.readFileSync(builtIndexPath, 'utf-8');

// Extract the script and link tags from the built index.html
const scriptMatch = builtIndexContent.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);
const linkMatches = builtIndexContent.match(/<link[^>]*(?:href="([^"]+\.(?:js|css))"[^>]*|[^>]*href="([^"]+\.(?:js|css))")>/g);

if (!scriptMatch) {
  console.error('Could not find main script tag in built index.html');
  process.exit(1);
}

// Read the Chinese HTML template
const zhTemplatePath = path.join(__dirname, '../index-zh.html');
let zhContent = fs.readFileSync(zhTemplatePath, 'utf-8');

// Replace the development script tag with the built assets
zhContent = zhContent.replace(
  '<script type="module" src="/src/main.tsx"></script>',
  scriptMatch[0] + '\n' + (linkMatches ? linkMatches.join('\n') : '')
);

// Write the processed Chinese HTML to dist
const zhDistPath = path.join(__dirname, '../dist/index-zh.html');
fs.writeFileSync(zhDistPath, zhContent, 'utf-8');

console.log('Updated index-zh.html with production assets');