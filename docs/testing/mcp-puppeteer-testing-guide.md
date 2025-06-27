# MCP Puppeteer Testing Guide for 24 Points Game

## Overview
This guide documents the proper way to use MCP (Model Context Protocol) Puppeteer tools to test and tune the 24 Points game application, based on real-world testing experience.

## Key Learnings from Testing Experience

### 1. **Connection Issues and Solutions**

**Problem**: The application wouldn't connect when using `localhost` or `127.0.0.1`.

**Solution**: Use the actual network interface IP address.
```javascript
// ❌ Doesn't work in containerized environments
mcp__puppeteer__puppeteer_navigate({ url: "http://localhost:5173" })

// ✅ Works reliably
mcp__puppeteer__puppeteer_navigate({ url: "http://172.29.240.200:5173" })
```

**How to find the correct IP**:
```bash
# Check listening ports
netstat -tlnp | grep :5173

# Get network interfaces
ip addr show | grep inet

# Test connectivity
curl -I http://[IP]:5173
```

### 2. **Headless Mode Configuration**

**Problem**: Default headless mode may fail due to display requirements.

**Solution**: Use proper launch options with security flags.
```javascript
mcp__puppeteer__puppeteer_navigate({
  url: "http://172.29.240.200:5173",
  launchOptions: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  },
  allowDangerous: true  // Required for sandbox flags
})
```

### 3. **WebSocket Connection Testing**

**Problem**: The game relies heavily on WebSocket connections that may not establish immediately.

**Solution**: Implement proper waiting and verification.
```javascript
// Wait for socket connection
mcp__puppeteer__puppeteer_evaluate({
  script: `
    new Promise((resolve) => {
      let attempts = 0;
      const checkConnection = setInterval(() => {
        attempts++;
        if (window.socketService?.socket?.connected || attempts > 20) {
          clearInterval(checkConnection);
          resolve({
            connected: window.socketService?.socket?.connected || false,
            attempts: attempts
          });
        }
      }, 500);
    })
  `
})
```

### 4. **Testing Game-Specific Features**

#### Badge System Testing
```javascript
// Create test environment
mcp__puppeteer__puppeteer_evaluate({
  script: `
    // Inject test utilities
    window.testBadge = {
      triggerAllOperations: () => {
        const solution = {
          operations: [
            { operator: '+', left: 8, right: 2, result: 10 },
            { operator: '*', left: 10, right: 3, result: 30 },
            { operator: '/', left: 6, right: 1, result: 6 },
            { operator: '-', left: 30, right: 6, result: 24 }
          ]
        };
        window.socketService.emit('submit-solution', { solution });
      }
    };
  `
})
```

#### Language Tracking
```javascript
// Test language switching for International Player badge
mcp__puppeteer__puppeteer_evaluate({
  script: `
    // Switch to Chinese
    window.i18n.changeLanguage('zh');
    // Switch back to English after delay
    setTimeout(() => window.i18n.changeLanguage('en'), 1000);
  `
})
```

### 5. **Effective Screenshot Strategy**

Take screenshots at key moments for debugging:
```javascript
// Before action
mcp__puppeteer__puppeteer_screenshot({
  name: "before-test",
  width: 1200,
  height: 800
})

// After action with specific element
mcp__puppeteer__puppeteer_screenshot({
  name: "badge-notification",
  selector: ".badge-notification",
  width: 400,
  height: 200
})
```

### 6. **Creating Standalone Test Pages**

When the main app has issues, create simplified test pages:
```javascript
// Create test harness
const testPageContent = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <div id="status">Connecting...</div>
  <div id="controls">
    <button onclick="testBadge()">Test Badge</button>
  </div>
  <script>
    const socket = io('http://172.29.240.200:3024');
    // Test implementation
  </script>
</body>
</html>
`;

// Serve through existing dev server
mcp__bash({ command: "echo '$testPageContent' > client/public/test.html" })
mcp__puppeteer__puppeteer_navigate({ url: "http://172.29.240.200:5173/test.html" })
```

### 7. **Debugging Connection Issues**

Use a systematic approach:
```javascript
// 1. Check if services are running
mcp__bash({ command: "ps aux | grep -E 'node.*(server|vite)' | grep -v grep" })

// 2. Verify ports
mcp__bash({ command: "netstat -tlnp | grep -E ':(5173|3024)'" })

// 3. Test connectivity
mcp__bash({ command: "curl -I http://172.29.240.200:5173" })

// 4. Check console errors
mcp__puppeteer__puppeteer_evaluate({
  script: "console.error"  // Returns any console errors
})
```

### 8. **Testing Real-Time Features**

For testing real-time game features:
```javascript
// Listen for socket events
mcp__puppeteer__puppeteer_evaluate({
  script: `
    window.socketEvents = [];
    const originalEmit = window.socketService.socket.emit;
    window.socketService.socket.emit = function(...args) {
      window.socketEvents.push({ type: 'emit', event: args[0], data: args[1] });
      return originalEmit.apply(this, args);
    };
    
    const events = ['badge-unlocked', 'game-started', 'round-ended'];
    events.forEach(event => {
      window.socketService.socket.on(event, (data) => {
        window.socketEvents.push({ type: 'on', event, data });
      });
    });
  `
})

// Check captured events later
mcp__puppeteer__puppeteer_evaluate({
  script: "window.socketEvents"
})
```

### 9. **Performance Testing**

Monitor performance during badge calculations:
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    performance.mark('badge-check-start');
    // Trigger badge check
    window.socketService.emit('check-badges');
    
    window.socketService.socket.once('badges-checked', () => {
      performance.mark('badge-check-end');
      performance.measure('badge-check', 'badge-check-start', 'badge-check-end');
      const measure = performance.getEntriesByName('badge-check')[0];
      console.log('Badge check took:', measure.duration, 'ms');
    });
  `
})
```

### 10. **Automated Test Suite Structure**

```javascript
// Test runner function
async function runBadgeTests() {
  const tests = [
    {
      name: "Mathematical Genius Badge",
      setup: () => createSoloPractice(),
      action: () => solveWithAllOperations(),
      verify: () => checkBadgeAwarded('mathematical_genius')
    },
    {
      name: "Quick Thinker Badge",
      setup: () => createSoloPractice(),
      action: () => solveInUnderOneSecond(),
      verify: () => checkSubSecondSolves(10)
    }
  ];
  
  for (const test of tests) {
    console.log(`Running: ${test.name}`);
    await test.setup();
    await wait(2000);
    await test.action();
    await wait(1000);
    const result = await test.verify();
    console.log(`Result: ${result ? 'PASS' : 'FAIL'}`);
  }
}
```

## Best Practices

### 1. **Always Check Service Status First**
Before running tests, verify:
- Frontend dev server is running (port 5173)
- Backend server is running (port 3024)
- Database is accessible
- Migrations have been run

### 2. **Use Actual IPs, Not Localhost**
In containerized or WSL environments, always use the actual IP address instead of localhost.

### 3. **Handle Async Operations Properly**
Game actions are asynchronous. Always wait for:
- Socket connections to establish
- Game rooms to be created
- Rounds to start
- Solutions to be processed

### 4. **Create Isolated Test Environments**
When testing specific features:
- Create dedicated test users (prefix with "Test_")
- Use solo practice mode for faster testing
- Create simplified test pages for complex scenarios

### 5. **Monitor Multiple Channels**
- Browser console (via evaluate)
- Network requests
- WebSocket events
- Server logs (if accessible)
- Database state

### 6. **Document Failures**
When tests fail, capture:
- Screenshots
- Console logs
- Network state
- Socket event history

## Common Pitfalls to Avoid

1. **Don't assume immediate connection** - Always wait for confirmation
2. **Don't use hardcoded delays** - Use event-based waiting when possible
3. **Don't test in production** - Use test user accounts
4. **Don't ignore CORS issues** - Properly configure allowed origins
5. **Don't forget cleanup** - Close test rooms and connections

## Example: Complete Badge Test Flow

```javascript
// 1. Navigate to app
await mcp__puppeteer__puppeteer_navigate({
  url: "http://172.29.240.200:5173",
  launchOptions: { headless: true, args: ["--no-sandbox"] },
  allowDangerous: true
});

// 2. Wait for connection
await mcp__puppeteer__puppeteer_evaluate({
  script: `/* connection check code */`
});

// 3. Create test room
await mcp__puppeteer__puppeteer_evaluate({
  script: `
    window.socketService.emit('create-room', {
      playerName: 'TestUser_' + Date.now(),
      roomType: 'classic',
      isSoloPractice: true
    });
  `
});

// 4. Wait for game start
await wait(2000);

// 5. Submit solution with all operations
await mcp__puppeteer__puppeteer_evaluate({
  script: `/* solution submission code */`
});

// 6. Verify badge
await mcp__puppeteer__puppeteer_evaluate({
  script: `
    new Promise(resolve => {
      window.socketService.socket.once('badge-unlocked', (badges) => {
        resolve(badges.some(b => b.badge.id === 'mathematical_genius'));
      });
      setTimeout(() => resolve(false), 5000); // Timeout
    });
  `
});
```

## Conclusion

MCP Puppeteer is powerful for testing real-time web applications like 24 Points, but requires careful attention to:
- Network configuration
- Asynchronous operations
- WebSocket connections
- State management

By following these patterns and practices, you can effectively test and tune the application's features, especially complex systems like badge detection and real-time gameplay.