/**
 * Flaky Test Suite for FriedHats Coffee Purchase Flow
 * 
 * This file intentionally demonstrates ANTI-PATTERNS that cause test flakiness.
 * These tests follow the same user journey but with problematic implementations.
 * 
 * Anti-patterns Demonstrated:
 * - Hard-coded waits instead of proper assertions
 * - Brittle selectors (tags, classes)
 * - Race conditions
 * - Network timing dependencies
 * - Random failures
 * - Poor error handling
 * 
 * DO NOT USE THESE PATTERNS IN REAL TESTS!
 */

import { test, expect } from '@playwright/test';

test.describe('FriedHats Coffee Purchase Flow - Flaky Tests', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Add metadata for CTRF reporting
    testInfo.annotations.push({
      type: 'category',
      description: 'potentially-flaky',
    });
    

    await page.goto('https://friedhats.com');
    
    // ANTI-PATTERN: Hard-coded wait instead of checking element
    await page.waitForTimeout(1000);
  });
  
  test('flaky test - brittle selectors and timing issues', async ({ page }, testInfo) => {
    // ANTI-PATTERN: Using generic tag selectors
    const buttons = await page.$$('button');
    
    // ANTI-PATTERN: Random failure injection
    const random = Math.random();
    testInfo.attachments.push({
      name: 'random-value',
      body: Buffer.from(`Random value: ${random}`),
      contentType: 'text/plain'
    });
    
    if (random < 0.25) {
      throw new Error(`Random failure: ${random.toFixed(3)}`);
    }
    
    // ANTI-PATTERN: Using arbitrary index without checking
    if (buttons.length > 5) {
      await buttons[5].click(); // Might be wrong button!
    }
    
    // ANTI-PATTERN: Fixed timeout instead of waiting for element
    await page.waitForTimeout(2000);
    
    // ANTI-PATTERN: Using fragile CSS selectors
    await page.click('div.product-grid > div:nth-child(2) > a');
    
    // ANTI-PATTERN: Not waiting for navigation
    await page.click('text=Add'); // Too generic!
    
    // ANTI-PATTERN: Immediate assertion without wait
    const cartCount = await page.$('.cart-count');
    expect(cartCount).toBeTruthy(); // Might not be updated yet
  });
  
  test('flaky test - race conditions', async ({ page }) => {
    // ANTI-PATTERN: Not waiting for page load
    await page.goto('https://friedhats.com/collections/coffee');
    
    // ANTI-PATTERN: Multiple parallel operations without coordination
    const promises = [
      page.click('a[href*="/products/"]').catch(() => {}),
      page.waitForSelector('.product-price', { timeout: 1000 }).catch(() => {}),
      page.click('button').catch(() => {})
    ];
    
    // ANTI-PATTERN: Using Promise.race creates unpredictable behavior
    await Promise.race(promises);
    
    // ANTI-PATTERN: Assuming state without verification
    const addButton = await page.$('button');
    if (addButton) {
      await addButton.click();
    }
    
    // ANTI-PATTERN: Not handling dynamic content
    const title = await page.$eval('h1', el => el.textContent);
    expect(title).toBeTruthy(); // Might be on wrong page!
  });
  
  test('flaky test - network timing dependencies', async ({ page, context }) => {
    // ANTI-PATTERN: Network throttling randomly
    if (Math.random() < 0.3) {
      await context.route('**/*', route => {
        setTimeout(() => route.continue(), 5000); // Random delay
      });
    }
    
    await page.goto('https://friedhats.com', { timeout: 10000 });
    
    // ANTI-PATTERN: Clicking without waiting for element
    await page.click('.hero-button'); // Might not exist
    
    // ANTI-PATTERN: Short timeout for slow operations
    await page.waitForSelector('.product-grid', { timeout: 100 });
    
    // ANTI-PATTERN: Not checking if element exists
    await page.click('.product-card:first-child');
    
    // ANTI-PATTERN: Immediate check after async operation
    const price = await page.$('.price');
    expect(price).toBeTruthy();
  });
  
  test('flaky test - improper waits and assertions', async ({ page }) => {
    await page.goto('https://friedhats.com');
    
    // ANTI-PATTERN: Multiple hard-coded waits
    await page.waitForTimeout(500);
    await page.click('text=VIEW ALL COFFEES');
    await page.waitForTimeout(1000);
    
    // ANTI-PATTERN: Not waiting for navigation
    const products = await page.$$('.product-item');
    
    // ANTI-PATTERN: Random product selection without checking availability
    const randomIndex = Math.floor(Math.random() * products.length);
    if (products[randomIndex]) {
      await products[randomIndex].click();
    }
    
    // ANTI-PATTERN: Clicking elements that might be disabled
    await page.click('button >> text=Filter');
    await page.click('button >> text=250gr');
    
    // ANTI-PATTERN: Not verifying element state
    await page.fill('input[type="number"]', '5');
    
    // ANTI-PATTERN: Multiple rapid clicks without waits
    await page.click('button >> text=Add to cart');
    await page.click('button >> text=Add to cart'); // Duplicate!
    
    // ANTI-PATTERN: No verification of success
    await page.waitForTimeout(500);
  });
  
  test('flaky test - state dependencies and timing', async ({ page }) => {
    await page.goto('https://friedhats.com/collections/coffee');
    
    // ANTI-PATTERN: Assuming initial state
    const firstProduct = await page.$('.product-card');
    await firstProduct?.click();
    
    // ANTI-PATTERN: Timing-dependent checks
    const delay = Math.random() * 3000;
    
    if (delay < 1000) {
      // ANTI-PATTERN: Very short timeout
      await expect(page.locator('.product-info')).toBeVisible({ timeout: 50 });
    } else {
      await page.waitForTimeout(delay);
      await expect(page.locator('.product-info')).toBeVisible();
    }
    
    // ANTI-PATTERN: Not checking button state
    const addButton = await page.$('button[class*="add"]');
    await addButton?.click();
    
    // ANTI-PATTERN: Race condition with cart update
    const cartPromises = [
      page.waitForSelector('.cart-drawer', { timeout: 500 }).catch(() => null),
      page.waitForSelector('.cart-modal', { timeout: 500 }).catch(() => null),
      page.waitForTimeout(1000)
    ];
    
    await Promise.race(cartPromises);
    
    // ANTI-PATTERN: Clicking without checking visibility
    await page.click('a >> text=Checkout');
  });
  
  test('flaky test - mixed concerns and dependencies', async ({ page }) => {
    // ANTI-PATTERN: Test doing too many things
    
    // Login simulation (even though site doesn't require it)
    await page.goto('https://friedhats.com');
    await page.waitForTimeout(1000);
    
    // Browse products
    await page.click('nav a >> text=COFFEES');
    await page.waitForTimeout(500);
    
    // ANTI-PATTERN: Complex selector chains
    const productLink = await page.$('div.collection-grid > div.grid-item:nth-of-type(3) > div > a');
    await productLink?.click();
    
    // Add to cart with random quantity
    const quantity = Math.floor(Math.random() * 5) + 1;
    await page.fill('input#quantity', quantity.toString());
    
    // ANTI-PATTERN: Not waiting between actions
    await page.click('button >> text=Add');
    await page.click('button >> text=Continue');
    await page.goto('https://friedhats.com/cart');
    
    // ANTI-PATTERN: Global state assumption
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBeGreaterThan(0); // Assumes previous test ran
    
    // Checkout
    await page.click('button >> text=Checkout');
    
    // ANTI-PATTERN: Not handling redirects
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('checkout');
  });
  
  test('flaky test - element visibility timing', async ({ page }) => {
    await page.goto('https://friedhats.com');
    
    // ANTI-PATTERN: Checking element too early
    const heroImage = page.locator('img[alt*="coffee"]');
    
    // Random timing makes test unpredictable
    if (Math.random() < 0.4) {
      // Check immediately - likely to fail
      await expect(heroImage).toBeVisible({ timeout: 10 });
    } else {
      // Wait then check - should pass
      await page.waitForTimeout(2000);
      await expect(heroImage).toBeVisible();
    }
    
    // ANTI-PATTERN: Click without ensuring element is ready
    page.click('a >> text=COFFEES').catch(() => {}); // Fire and forget
    
    // ANTI-PATTERN: Not waiting for async operation
    await page.waitForTimeout(100);
    
    // This might execute before navigation completes
    const products = await page.$$('[class*="product"]');
    expect(products.length).toBeGreaterThan(0);
  });
  
  test('flaky test - cart state corruption', async ({ page }) => {
    await page.goto('https://friedhats.com/collections/coffee');
    
    // ANTI-PATTERN: Parallel modifications without synchronization
    const addToCartPromises = [];
    
    const products = await page.$$('a[href*="/products/"]');
    
    // Try to add multiple products simultaneously
    for (let i = 0; i < 3 && i < products.length; i++) {
      addToCartPromises.push(
        products[i].click()
          .then(() => page.waitForTimeout(100))
          .then(() => page.click('button >> text=Add'))
          .catch(() => {})
      );
    }
    
    // ANTI-PATTERN: Not handling race conditions
    await Promise.all(addToCartPromises);
    
    // Cart state might be corrupted
    await page.goto('https://friedhats.com/cart');
    
    // ANTI-PATTERN: Assuming cart state without verification
    const total = await page.$('.cart-total');
    expect(total).toBeTruthy(); // Doesn't verify actual content
  });
});

/**
 * Anti-patterns Demonstrated Summary:
 * 
 * ❌ Hard-coded timeouts: waitForTimeout instead of proper waits
 * ❌ Brittle selectors: Using indices, nth-child, generic tags
 * ❌ Race conditions: Promise.race, parallel operations
 * ❌ No error handling: Not checking element existence
 * ❌ Random failures: Math.random() causing inconsistency  
 * ❌ Network dependencies: Artificial delays and throttling
 * ❌ State assumptions: Expecting state from previous tests
 * ❌ Mixed concerns: Tests doing too many things
 * ❌ Poor assertions: Not verifying actual content
 * ❌ Timing issues: Not waiting for async operations
 * 
 * These patterns will cause tests to fail intermittently,
 * making them perfect for demonstrating flaky test detection.
 */