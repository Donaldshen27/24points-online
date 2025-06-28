# Puppeteer MCP Quick Guide

## Setup
```bash
# Already configured in .claude_mcp_settings.json
```

## IMPORTANT: WSL/Linux Usage
- **MUST use IP address, NOT localhost**
- **MUST use headless: true**
- Get IP: `hostname -I | awk '{print $1}'`

## Essential Commands

### Navigate (CORRECT WAY)
```javascript
mcp__puppeteer__puppeteer_navigate
url: "http://172.29.240.200:5173"  // Use IP, not localhost!
launchOptions: {"headless": true}   // Required for WSL
```

### Screenshot
```javascript
mcp__puppeteer__puppeteer_screenshot
name: "test-view"
width: 375  // Mobile width
height: 812 // Mobile height
```

### Click Elements
```javascript
mcp__puppeteer__puppeteer_click
selector: ".mobile-tab"  // CSS selector
```

### Fill Forms
```javascript
mcp__puppeteer__puppeteer_fill
selector: "input[type='email']"
value: "test@example.com"
```

### Execute JS (For Complex Actions)
```javascript
mcp__puppeteer__puppeteer_evaluate
script: "document.querySelector('.badge-tab').click()"
```

## Testing Mobile UI Workflow
1. Get IP address: `hostname -I`
2. Navigate with IP + headless mode
3. Wait 2-3 seconds after navigation
4. Take screenshot at 375x812
5. Use evaluate for arrays/complex selectors

## Common Selectors
- Navigation tabs: `.mobile-tab`
- Auth modal: `.auth-modal`
- Join button: `.mobile-fab`
- Close button: `.modal-close`
- Sign in: `.sign-in-button`

## Critical Tips
- **NEVER use localhost** - Always use IP address
- **ALWAYS use headless: true** in WSL/Linux
- **Wait after navigation** - Use Bash sleep 2-3s
- **Use evaluate for arrays** - `.find()` doesn't work in click selector
- Mobile viewport: 375x812 (iPhone size)

## Example Full Flow
```bash
# 1. Get IP
hostname -I  # e.g., 172.29.240.200

# 2. Navigate with headless
mcp__puppeteer__puppeteer_navigate
url: "http://172.29.240.200:5173"
launchOptions: {"headless": true}

# 3. Wait
Bash: sleep 3

# 4. Screenshot
mcp__puppeteer__puppeteer_screenshot
name: "mobile-test"
width: 375
height: 812
```