/**
 * Test Helper Functions for FriedHats E2E Tests
 * 
 * Reusable helper functions for the FriedHats coffee purchase flow.
 */

import { Page, expect } from '@playwright/test';

/**
 * Dismiss privacy/cookie banner if it appears
 */
export async function dismissPrivacyBanner(page: Page): Promise<void> {
  const privacyDecline = page.locator('button#shopify-pc__banner__btn-decline');
  if (await privacyDecline.count() > 0) {
    await privacyDecline.click();
    await expect(privacyDecline).toBeHidden();
  }
}

/**
 * Navigate to coffee collection page
 */
export async function navigateToCoffeeCollection(page: Page): Promise<void> {
  // Click VIEW ALL COFFEES button using exact text
  const viewCoffeesButton = page.getByRole('link', { name: 'VIEW ALL COFFEES' });
  await expect(viewCoffeesButton).toBeVisible();
  await viewCoffeesButton.click();
  
  // Wait for coffee collection page
  await expect(page).toHaveURL(/\/collections\/coffee/);
  
  // Verify products are loaded
  await expect(page.locator('.product-item, [class*="product"]').first()).toBeVisible();
}

/**
 * Select first available coffee (not sold out)
 * @returns Product details or null if all sold out
 */
export async function selectFirstAvailableCoffee(page: Page): Promise<{name: string} | null> {
  // Get all product items
  const products = page.locator('.product-item, .grid-item');
  const count = await products.count();
  
  for (let i = 0; i < count; i++) {
    const product = products.nth(i);
    
    // Check for SOLD OUT indicator
    const soldOutBadge = product.locator('text=/SOLD OUT/i');
    const hasSoldOut = await soldOutBadge.count() > 0;
    
    // Also check for ADD button presence (available products have it)
    const addButton = product.locator('button:has-text("ADD")');
    const hasAddButton = await addButton.count() > 0;
    
    // Product is available if no SOLD OUT and has ADD button
    if (!hasSoldOut && hasAddButton) {
      // Get product name
      const productName = await product.locator('h2, h3').first().textContent() || 'Coffee';
      
      // Click on the product link
      await product.locator('a').first().click();
      
      // Wait for product page
      await expect(page).toHaveURL(/\/products\//);
      
      return { name: productName.trim() };
    }
  }
  
  return null;
}

/**
 * Select product options using defaults or first available
 * Default order: 
 * - Roast: ESPRESSO → FILTER → OMNI
 * - Size: 250GR → 1000GR
 */
export async function selectProductOptions(page: Page): Promise<void> {
  // Handle ROAST selection
  const roastSection = page.locator('.product-options').filter({ hasText: 'ROAST' });
  
  if (await roastSection.count() > 0) {
    // Check which buttons are present and enabled
    const espressoBtn = roastSection.locator('button:has-text("ESPRESSO")');
    const filterBtn = roastSection.locator('button:has-text("FILTER")');
    const omniBtn = roastSection.locator('button:has-text("OMNI")');
    
    // Try default (Espresso) first
    if (await espressoBtn.count() > 0 && await espressoBtn.isEnabled()) {
      // Check if already selected
      const isSelected = await espressoBtn.evaluate(el => 
        el.classList.contains('selected') || el.getAttribute('aria-pressed') === 'true'
      );
      
      if (!isSelected) {
        await espressoBtn.click();
      }
    } else if (await filterBtn.count() > 0 && await filterBtn.isEnabled()) {
      // If Espresso not available, select Filter
      await filterBtn.click();
    } else if (await omniBtn.count() > 0 && await omniBtn.isEnabled()) {
      // Omni is usually standalone option
      await omniBtn.click();
    }
  }
  
  // Handle SIZE selection  
  const sizeSection = page.locator('.product-options').filter({ hasText: 'SIZE' });
  
  if (await sizeSection.count() > 0) {
    const size250Btn = sizeSection.locator('button:has-text("250GR")');
    const size1000Btn = sizeSection.locator('button:has-text("1000GR")');
    
    // Try default (250GR) first
    if (await size250Btn.count() > 0 && await size250Btn.isEnabled()) {
      const isSelected = await size250Btn.evaluate(el => 
        el.classList.contains('selected') || el.getAttribute('aria-pressed') === 'true'
      );
      
      if (!isSelected) {
        await size250Btn.click();
      }
    } else if (await size1000Btn.count() > 0 && await size1000Btn.isEnabled()) {
      // If 250GR not available, select 1000GR
      await size1000Btn.click();
    }
  }
  
  // Set quantity to 2
  const quantityInput = page.locator('input[type="number"][name="quantity"], input#quantity');
  if (await quantityInput.count() > 0) {
    await quantityInput.fill('2');
    await expect(quantityInput).toHaveValue('2');
  }
}

/**
 * Add current product to cart
 */
export async function addProductToCart(page: Page): Promise<void> {
  // Find Add to Cart button
  const addToCartButton = page.getByRole('button', { name: /ADD TO CART/i });
  
  // Ensure button is enabled before clicking
  await expect(addToCartButton).toBeEnabled();
  
  // Click Add to Cart
  await addToCartButton.click();
  
  // Wait for cart drawer/modal to appear
  const cartDrawer = page.locator('.cart-drawer, aside:has-text("CART")');
  await expect(cartDrawer).toBeVisible();
  
  // Verify product was added (cart shows quantity)
  await expect(cartDrawer.locator('text=/QTY:/i')).toBeVisible();
}

/**
 * Continue from cart to checkout
 */
export async function proceedToCheckout(page: Page): Promise<void> {
  // In the cart drawer, click Continue to Checkout
  const checkoutButton = page.getByRole('button', { name: /CONTINUE TO CHECKOUT/i })
    .or(page.getByRole('link', { name: /CONTINUE TO CHECKOUT/i }));
  
  await expect(checkoutButton).toBeVisible();
  await checkoutButton.click();
  
  // Wait for Shopify checkout page
  await expect(page).toHaveURL(/\/checkouts\//);
}