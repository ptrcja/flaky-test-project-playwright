/**
 * Flaky Test Suite for FriedHats Coffee Purchase Flow - Realistic Patterns
 * 
 * This file intentionally demonstrates REAL-WORLD flakiness patterns that cause ~40-60% failure rate.
 * Uses the same helpers as stable tests but introduces timing and synchronization issues.
 * 
 * Realistic Flakiness Patterns Demonstrated:
 * - Race conditions between actions and responses
 * - Insufficient waiting for dynamic content
 * - Network latency sensitivity
 * - Parallel test interference
 * - State dependencies between tests
 * - Timing-sensitive assertions
 * 
 * These patterns are based on actual issues found in production test suites.
 * DO NOT USE THESE PATTERNS IN REAL TESTS!
 */

import { test, expect } from '@playwright/test';
import {
 // dismissPrivacyBanner,
  navigateToCoffeeCollection,
  selectFirstAvailableCoffee,
  selectProductOptions,
  addProductToCart,
  proceedToCheckout
} from '../utils/friedhats-helpers';

// Global state that causes test interdependence (ANTI-PATTERN)
let sharedCartState: { itemCount?: number } = {};

test.describe('FriedHats Coffee Purchase Flow - Realistic Flaky Tests', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Add metadata for CTRF reporting
    testInfo.annotations.push({
      type: 'category',
      description: 'realistically-flaky',
    });
    
    await page.goto('https://friedhats.com');
    
    // ANTI-PATTERN: Not waiting for page to be fully ready
    // This might work on fast connections but fail on slower ones
    // await expect(page.locator('body')).toBeVisible(); // Commented out to introduce flakiness
    
  });
  
  test('flaky test - race condition with navigation', async ({ page }) => {
    await test.step('Navigate with race condition', async () => {
      // ANTI-PATTERN: Starting navigation without waiting for page readiness
      const navigationPromise = navigateToCoffeeCollection(page);
      
      // ANTI-PATTERN: Attempting to interact while navigation is in progress
      // This creates a race condition between navigation and interaction
      const viewAllButton = page.getByRole('link', { name: 'VIEW ALL COFFEES' });
      
      // These operations race against each other
      await Promise.all([
        navigationPromise,
        viewAllButton.click().catch(() => {}) // Might fail if navigation completes first
      ]);
      
      // ANTI-PATTERN: Immediate assertion after navigation without proper wait
      // The collection might not be fully loaded yet
      const products = page.getByRole('link', { name: /colombia|kenya|ethiopia/i });
      await expect(products.first()).toBeVisible({ timeout: 500 }); // Very short timeout
    });
    
    await test.step('Select product with timing issues', async () => {
      // ANTI-PATTERN: Not handling dynamic content loading properly
      const selectedCoffee = await selectFirstAvailableCoffee(page);
      
      if (!selectedCoffee) {
        test.skip(true, 'No products available');
        return;
      }
      
      // ANTI-PATTERN: Immediate action after product selection
      // Product page might not be fully loaded
      await selectProductOptions(page);
    });
  });
  
  test('flaky test - network sensitivity and timing', async ({ page, context }) => {
    // ANTI-PATTERN: Test sensitive to network latency
    // Simulate realistic network conditions that vary
    await context.route('**/*', async (route) => {
      // Variable delay simulating real network conditions
      const delay = Math.random() < 0.5 ? 50 : 300; // Sometimes fast, sometimes slow
      await new Promise(resolve => setTimeout(resolve, delay));
      await route.continue();
    });
    
    await test.step('Navigate with network delays', async () => {
      // This will be affected by the network throttling above
      await navigateToCoffeeCollection(page);
      
      // ANTI-PATTERN: Short timeout that might fail with slow network
      await expect(page).toHaveURL(/\/collections\/coffees/, { timeout: 2000 });
    });
    
    await test.step('Quick product selection', async () => {
      // ANTI-PATTERN: Rapid interactions without proper waits
      const selectedCoffee = await selectFirstAvailableCoffee(page);
      
      if (selectedCoffee) {
        // ANTI-PATTERN: Multiple rapid actions in sequence
        await selectProductOptions(page);
        
        // ANTI-PATTERN: Adding to cart immediately without checking if options are set
        await addProductToCart(page);
        
        // ANTI-PATTERN: Not waiting for cart update confirmation
        // Immediately trying to proceed
        await page.waitForTimeout(100); // Small fixed wait instead of proper synchronization
        await proceedToCheckout(page);
      }
    });
  });
  
  test('flaky test - state dependency issues', async ({ page }) => {
    // ANTI-PATTERN: Test depends on shared state from other tests
    if (sharedCartState.itemCount && sharedCartState.itemCount > 0) {
      // Assumes cart already has items from previous test
      await page.goto('https://friedhats.com/cart');
      
      // This will fail if previous test didn't run or failed
      await expect(page.getByText(/\d+ items? in cart/i)).toBeVisible({ timeout: 1000 });
    }
    
    await test.step('Add items with state tracking', async () => {
      await navigateToCoffeeCollection(page);
      const selectedCoffee = await selectFirstAvailableCoffee(page);
      
      if (selectedCoffee) {
        await selectProductOptions(page);
        await addProductToCart(page);
        
        // ANTI-PATTERN: Modifying shared state
        sharedCartState.itemCount = (sharedCartState.itemCount || 0) + 2;
      }
    });
    
    // ANTI-PATTERN: Assertion based on assumed state
    if (sharedCartState.itemCount) {
      const cartCount = page.locator('.cart-count, [data-cart-count]');
      await expect(cartCount).toHaveText(sharedCartState.itemCount.toString(), { timeout: 500 });
    }
  });
  
  test('flaky test - promise.all misuse with actions', async ({ page }) => {
    await navigateToCoffeeCollection(page);
    
    // ANTI-PATTERN: Multiple actions in Promise.all causing unpredictable behavior
    const products = await page.getByRole('link', { name: /colombia|kenya|ethiopia/i }).all();
    
    if (products.length >= 2) {
      // ANTI-PATTERN: Parallel clicks on different products
      await Promise.all([
        products[0].click(),
        products[1].click() // Both trying to navigate simultaneously
      ]).catch(() => {});
      
      // Page state is now unpredictable - which product page are we on?
      await page.waitForTimeout(500); // Fixed wait hoping page settles
      
      // This might work or fail depending on which click "won"
      await selectProductOptions(page);
      await addProductToCart(page);
    }
  });
  
  test('flaky test - insufficient wait for dynamic content', async ({ page }) => {
    await test.step('Quick navigation', async () => {
      // ANTI-PATTERN: Using helpers but with race conditions
      const navPromise = navigateToCoffeeCollection(page);
      
      // Start checking for elements before navigation completes
      const checkProducts = async () => {
        const products = await page.getByRole('link', { name: /coffee/i }).count();
        return products > 0;
      };
      
      // Race between navigation and product check
      await Promise.race([
        navPromise,
        checkProducts()
      ]);
    });
    
    await test.step('Product interaction with poor synchronization', async () => {
      // ANTI-PATTERN: Not ensuring previous step completed properly
      const selectedCoffee = await selectFirstAvailableCoffee(page);
      
      if (selectedCoffee) {
        // ANTI-PATTERN: Chaining operations without proper waits
        await selectProductOptions(page);
        
        // ANTI-PATTERN: Immediate quantity change without ensuring field is ready
        const quantityField = page.locator('input[type="number"]').first();
        await quantityField.fill('3'); // Might fail if field not ready
        
        // ANTI-PATTERN: Click add to cart without verifying options are set
        const addButton = page.getByRole('button', { name: /ADD TO CART/i });
        await addButton.click({ timeout: 500 }); // Very short timeout
      }
    });
  });
  
  test('flaky test - cart drawer timing issues', async ({ page }) => {
    await navigateToCoffeeCollection(page);
    const selectedCoffee = await selectFirstAvailableCoffee(page);
    
    if (selectedCoffee) {
      await selectProductOptions(page);
      
      // ANTI-PATTERN: Not waiting for cart drawer animations
      await addProductToCart(page);
      
      // ANTI-PATTERN: Trying to interact with cart drawer immediately
      // Drawer might still be animating in
      const cartDrawer = page.locator('aside.is-cart');
      
      // ANTI-PATTERN: Multiple rapid interactions with animated elements
      const checkoutButton = cartDrawer.getByRole('button', { name: /CHECKOUT/i });
      
      // This might fail if drawer is still animating
      await checkoutButton.click({ force: true }); // Force click without waiting for stability
      
      // ANTI-PATTERN: Not waiting for navigation after checkout click
      await expect(page).toHaveURL(/checkout/, { timeout: 1000 });
    }
  });
  
  test('flaky test - parallel test interference', async ({ page }) => {
    // ANTI-PATTERN: Test assumes clean state but might be affected by parallel tests
    
    // If another test is running in parallel and modifying cart...
    await page.goto('https://friedhats.com/cart');
    
    // ANTI-PATTERN: Checking cart without ensuring it's in expected state
    const cartItems = page.locator('.cart-item, [data-cart-item]');
    const itemCount = await cartItems.count();
    
    // This assertion might fail if parallel test added/removed items
    if (itemCount > 0) {
      // Clear cart - but another test might be adding items simultaneously
      const removeButtons = page.getByRole('button', { name: /remove/i });
      await removeButtons.first().click();
    }
    
    // Now try to add new items
    await navigateToCoffeeCollection(page);
    const selectedCoffee = await selectFirstAvailableCoffee(page);
    
    if (selectedCoffee) {
      await selectProductOptions(page);
      
      // ANTI-PATTERN: Race condition with other tests modifying cart
      await addProductToCart(page);
      
      // Cart state might be corrupted by parallel test
      const cartCount = page.locator('.cart-count').first();
      await expect(cartCount).toHaveText('2', { timeout: 500 }); // Assumes only our items
    }
  });
  
  test('flaky test - CPU throttling sensitivity', async ({ page, context }) => {
    // ANTI-PATTERN: Test sensitive to CPU speed
    // Simulate slower CPU which makes the test flaky
    const client = await (context as any).newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 }); // 4x slowdown
    
    await test.step('Navigate under CPU stress', async () => {
      await navigateToCoffeeCollection(page);
      
      // ANTI-PATTERN: Short timeouts that fail under CPU throttling
      await expect(page.getByRole('link', { name: /colombia/i }).first())
        .toBeVisible({ timeout: 1500 }); // Might timeout with slow CPU
    });
    
    await test.step('Complex interactions under throttling', async () => {
      const selectedCoffee = await selectFirstAvailableCoffee(page);
      
      if (selectedCoffee) {
        // These operations might timeout under CPU throttling
        await selectProductOptions(page);
        
        // ANTI-PATTERN: Multiple rapid DOM queries under CPU stress
        const roastButtons = await page.getByRole('button', { name: /ESPRESSO|FILTER|OMNI/i }).all();
        const sizeButtons = await page.getByRole('button', { name: /250GR|1000GR/i }).all();
        
        // Rapid clicks that might fail under throttling
        if (roastButtons.length > 0) await roastButtons[0].click();
        if (sizeButtons.length > 0) await sizeButtons[0].click();
        
        await addProductToCart(page);
      }
    });
  });
});

/**
 * Realistic Flakiness Patterns Summary:
 * 
 * ✓ Race conditions: Navigation and interaction competing
 * ✓ Network sensitivity: Variable delays affecting timeouts
 * ✓ State dependencies: Tests relying on shared state
 * ✓ Promise.all misuse: Parallel actions causing conflicts
 * ✓ Insufficient waits: Not waiting for dynamic content
 * ✓ Animation timing: Interacting during transitions
 * ✓ Parallel test interference: Tests affecting each other
 * ✓ CPU throttling: Performance-sensitive operations
 * ✓ Short timeouts: Timeouts too aggressive for variable conditions
 * ✓ Missing awaits: Fire-and-forget operations creating races
 * 
 * These patterns create realistic ~40-60% failure rates by introducing
 * timing-sensitive operations that work sometimes but fail under different
 * conditions (network speed, CPU load, parallel execution, etc.)
 *
 * */