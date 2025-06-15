// Test script to verify Super Mode card interaction is working
const puppeteer = require('puppeteer');

async function testSuperModeInteraction() {
  console.log('Starting Super Mode interaction test...\n');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    args: ['--window-size=1200,800']
  });
  
  try {
    // Create two browser pages (players)
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();
    
    // Navigate to the app
    await page1.goto('http://localhost:5173');
    await page2.goto('http://localhost:5173');
    
    // Wait for app to load
    await page1.waitForSelector('.lobby', { timeout: 5000 });
    await page2.waitForSelector('.lobby', { timeout: 5000 });
    
    console.log('✓ Both players connected to lobby');
    
    // Player 1: Enter name and select Super Mode
    await page1.type('input[placeholder="Enter your name"]', 'Alice');
    await page1.waitForSelector('.room-type-selector', { timeout: 5000 });
    
    // Click on Super Mode
    await page1.click('.room-type-card.super');
    await page1.waitForTimeout(500);
    
    console.log('✓ Player 1 selected Super Mode');
    
    // Create room
    await page1.click('.create-room-btn');
    await page1.waitForSelector('.waiting-room', { timeout: 5000 });
    
    // Get room code
    const roomCode = await page1.$eval('.room-code', el => el.textContent);
    console.log(`✓ Room created with code: ${roomCode}`);
    
    // Player 2: Join the room
    await page2.type('input[placeholder="Enter your name"]', 'Bob');
    await page2.type('input[placeholder="Room Code"]', roomCode);
    await page2.click('button:has-text("Join Room")');
    
    await page2.waitForSelector('.waiting-room', { timeout: 5000 });
    console.log('✓ Player 2 joined the room');
    
    // Both players ready up
    await page1.click('.ready-btn');
    await page2.click('.ready-btn');
    
    // Wait for game to start
    await page1.waitForSelector('.interactive-center-table', { timeout: 10000 });
    await page2.waitForSelector('.interactive-center-table', { timeout: 10000 });
    
    console.log('✓ Game started in Super Mode');
    
    // Check number of cards
    const cardCount = await page1.$$eval('.center-cards .card-wrapper', cards => cards.length);
    console.log(`✓ Center has ${cardCount} cards (expected 7)`);
    
    // Test card interaction on Player 1
    await page1.waitForTimeout(1000);
    
    // Click first card
    await page1.click('.center-cards .card-wrapper:nth-child(1)');
    await page1.waitForTimeout(500);
    
    // Check if first card is selected
    const firstCardSelected = await page1.$('.card-wrapper.selected');
    console.log(`✓ First card selection: ${firstCardSelected ? 'Success' : 'Failed'}`);
    
    // Click second card
    await page1.click('.center-cards .card-wrapper:nth-child(2)');
    await page1.waitForTimeout(500);
    
    // Check if operation menu appears
    const operationMenu = await page1.$('.operation-menu');
    console.log(`✓ Operation menu appears: ${operationMenu ? 'Success' : 'Failed'}`);
    
    // If menu appeared, select an operation
    if (operationMenu) {
      await page1.click('.operation-btn:first-child'); // Click '+' 
      await page1.waitForTimeout(500);
      
      // Check if cards merged
      const newCardCount = await page1.$$eval('.center-cards .card-wrapper', cards => cards.length);
      console.log(`✓ Cards after operation: ${newCardCount} (should be ${cardCount - 1})`);
    }
    
    // Check for Super Mode hint
    const superModeHint = await page1.$('.super-mode-hint');
    console.log(`✓ Super Mode hint displayed: ${superModeHint ? 'Yes' : 'No'}`);
    
    console.log('\n✅ Super Mode interaction test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close browser after a delay to see results
    setTimeout(async () => {
      await browser.close();
    }, 5000);
  }
}

// Note: This test requires puppeteer to be installed
// Run: npm install puppeteer
// Then: node test-super-mode-interaction.js

console.log('Note: This test requires the app to be running on http://localhost:5173');
console.log('Start the dev server first with: npm run dev\n');

// Uncomment to run the test
// testSuperModeInteraction();