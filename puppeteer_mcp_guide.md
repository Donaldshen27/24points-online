# Puppeteer MCP Quick Guide

## Setup
```bash
# Already configured in .claude_mcp_settings.json
```

## Essential Commands

### Navigate
```javascript
mcp__puppeteer__puppeteer_navigate
url: "http://172.29.240.200:5173"
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

### Execute JS
```javascript
mcp__puppeteer__puppeteer_evaluate
script: "document.querySelector('.badge-tab').click()"
```

## Testing Mobile UI
1. Navigate to local dev server
2. Take screenshot at 375x812 (iPhone)
3. Click tabs: `.mobile-tab`
4. Fill auth: `input[type="email"]`, `input[type="password"]`
5. Check layouts with evaluate

## Common Selectors
- Navigation tabs: `.mobile-tab`
- Auth modal: `.auth-modal`
- Join button: `.mobile-fab`
- Close button: `.modal-close`
- Sign in: `.sign-in-button`

## Tips
- Use evaluate for complex clicks
- Always wait 2-3s after navigation
- Screenshot to verify UI state
- Mobile viewport: 375x812