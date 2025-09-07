/**
 * Stable Test Suite for FriedHats Coffee Purchase Flow
 * 
 * This file demonstrates best practices for writing reliable, maintainable Playwright tests.
 * Tests follow the actual user journey on friedhats.com from browsing to checkout.
 * 
 * Key Principles:
 * - Semantic selectors (getByRole, getByText) 
 * - Auto-wait with expect assertions (NO arbitrary timeouts)
 * - Clean, imported helper functions
 * - Self-contained tests
 * - Proper handling of dynamic content
 */

import { test, expect } from '@playwright/test';
import {
  dismissPrivacyBanner,
  navigateToCoffeeCollection,
  selectFirstAvailableCoffee,
  selectProductOptions,
  addProductToCart,
  proceedToCheckout
} from '../utils/friedhats-helpers';
// ============ TEST SUITE ============

test.describe('FriedHats Coffee Purchase Flow - Stable Tests', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Add CTRF metadata
    testInfo.annotations.push({
      type: 'category',
      description: 'stable',
    });
    
    // Navigate to homepage
    await page.goto('https://friedhats.com');
    
    // Wait for page to be ready
    await expect(page.locator('body')).toBeVisible();
    
    // Dismiss privacy banner if shown
    await dismissPrivacyBanner(page);
  });
  
  test('Complete coffee purchase journey', async ({ page }) => {
    await test.step('Verify homepage', async () => {
      await expect(page).toHaveTitle(/Friedhats/i);
      
      // Verify hero section with VIEW ALL COFFEES button
      const viewAllButton = page.getByRole('link', { name: 'VIEW ALL COFFEES' });
      await expect(viewAllButton).toBeVisible();
    });
    
    await test.step('Navigate to coffee collection', async () => {
      await navigateToCoffeeCollection(page);
      
      // Verify we're on coffee page with products
      await expect(page.getByRole('heading', { name: /COFFEES/i })).toBeVisible();
    });
    
    await test.step('Select available coffee', async () => {
      const selectedCoffee = await selectFirstAvailableCoffee(page);
      
      if (!selectedCoffee) {
        test.skip('All coffees are sold out - valid scenario');
        return;
      }
      
      // Verify product page elements
      await expect(page.getByRole('heading', { name: selectedCoffee.name })).toBeVisible();
      await expect(page.getByText(/€\d+\.\d+|\$\d+\.\d+/).first()).toBeVisible();
    });
    
    await test.step('Configure product options', async () => {
      await selectProductOptions(page);
      
      // Verify options are available and at least one selection is possible
      const roastOptions = page.getByRole('button', { name: /ESPRESSO|FILTER|OMNI/i });
      const sizeOptions = page.getByRole('button', { name: /250GR|1000GR/i });
      const hasOptions = (await roastOptions.count()) > 0 || (await sizeOptions.count()) > 0;
      expect(hasOptions).toBeTruthy();
    });
    
    await test.step('Add to cart', async () => {
      await addProductToCart(page);
      
      // Verify cart drawer shows product using semantic selectors
      const cartDrawer = page.getByRole('dialog').or(page.getByRole('complementary')).or(page.locator('aside'));
      await expect(cartDrawer).toBeVisible();
      await expect(cartDrawer.getByText(/Kenya|Ethiopia|Colombia|Guatemala/i).first()).toBeVisible();
    });
    
    await test.step('Proceed to checkout', async () => {
      await proceedToCheckout(page);
      
      // Verify checkout page loaded
      await expect(page.getByText(/Express checkout|Contact|Delivery/i).first()).toBeVisible();
      
      // Verify order summary shows correct product using semantic approach
      const orderSummary = page.getByRole('region', { name: /order summary/i }).or(page.locator('[aria-label*="Order summary"]'));
      await expect(orderSummary.getByText(/Filter|Espresso|Omni/i).first()).toBeVisible();
      await expect(orderSummary.getByText(/250gr|1000gr/i).first()).toBeVisible();
    });
  });
  
  test('Handle sold out products gracefully', async ({ page }) => {
    await navigateToCoffeeCollection(page);
    
    // Look for any sold out products
    const soldOutProducts = page.getByText(/SOLD OUT/i);
    
    if (await soldOutProducts.count() === 0) {
      test.skip('No sold out products to test');
      return;
    }
    
    // Click on first sold out product using semantic approach
    const firstSoldOutLink = page.getByRole('link').filter({ 
      has: page.getByText(/SOLD OUT/i) 
    }).first();
    
    await firstSoldOutLink.click();
    
    // Wait for product page
    await expect(page).toHaveURL(/\/products\//);
    
    // Verify SOLD OUT state is shown
    await expect(page.getByRole('button', { name: /SOLD OUT/i })).toBeVisible();
    
    // Add to Cart button should be disabled or show SOLD OUT
    const addButton = page.getByRole('button', { name: /ADD TO CART|SOLD OUT/i });
    
    const buttonText = await addButton.textContent();
    if (buttonText && !buttonText.includes('SOLD OUT')) {
      await expect(addButton).toBeDisabled();
    }
  });
  
  test('Cart persistence across navigation', async ({ page }) => {
    await navigateToCoffeeCollection(page);
    
    const selectedCoffee = await selectFirstAvailableCoffee(page);
    if (!selectedCoffee) {
      test.skip('No available products');
      return;
    }
    
    await selectProductOptions(page);
    await addProductToCart(page);
    
    // Close cart drawer if open using semantic approach
    const closeButton = page.getByRole('button', { name: /close|×/i })
      .or(page.locator('[aria-label*="close"]', { hasText: /×|close/i }));
    if (await closeButton.isVisible()) {
      await closeButton.click();
      // Wait for drawer to close
      await expect(closeButton).toBeHidden();
    }
    
    // Navigate back to homepage
    await page.goto('https://friedhats.com');
    
    // Verify cart count persists (shown in header)
    const cartIcon = page.getByRole('link', { name: /cart/i })
      .or(page.locator('[aria-label*="cart"]'))
      .or(page.locator('a[href*="cart"]'));
    await expect(cartIcon.getByText(/\d+/)).toBeVisible();
    
    // Navigate directly to cart page
    await page.goto('https://friedhats.com/cart');
    
    // Verify product is in cart page
    await expect(page.getByText(selectedCoffee.name)).toBeVisible();
  });
});

/**
 * Best Practices Applied:
 * 
 * ✅ NO TIMEOUTS: Using Playwright's auto-wait with expect()
 * ✅ SEMANTIC SELECTORS: getByRole, getByText for resilience
 * ✅ PROPER DEFAULTS: Espresso → Filter for roast, 250GR → 1000GR for size
 * ✅ DYNAMIC HANDLING: Checks availability before clicking
 * ✅ CLEAN HELPERS: Imported from separate file
 * ✅ SELF-CONTAINED: Each test is independent
 * ✅ GRACEFUL FAILURES: Handles sold out products properly
 * ✅ CLEAR ASSERTIONS: Multiple specific checks
 * ✅ REAL USER FLOW: Follows actual FriedHats purchase journey
 */