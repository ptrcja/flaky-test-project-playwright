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
  await expect(page).toHaveURL(/\/collections\/coffees/);
  
  // Verify page content is loaded - check for at least one product link
  await expect(page.getByRole('link', { name: /colombia|kenya|ethiopia|peru|guatemala/i }).first()).toBeVisible();
}

/**
 * Select first available coffee (not sold out)
 * @returns Product details or null if all sold out
 */
export async function selectFirstAvailableCoffee(page: Page): Promise<{name: string} | null> {
  // Get all product links on the collection page - using specific product names
  const productLinks = page.getByRole('link', { name: /colombia|kenya|ethiopia|peru|guatemala/i });
  const count = await productLinks.count();
  
  for (let i = 0; i < count; i++) {
    const productLink = productLinks.nth(i);
    
    // Check if this product is sold out by looking for SOLD OUT text nearby
    const parentContainer = productLink.locator('..');
    const hasSoldOut = await parentContainer.getByText(/SOLD OUT/i).count() > 0;
    
    if (!hasSoldOut) {
      // Get product name directly from link text
      const productName = await productLink.textContent() || 'Coffee';
      
      // Click on the product link
      await productLink.click();
      
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
  // Handle ROAST selection - look for roast options group
  const roastGroup = page.getByText('ROAST').locator('..');
  
  if (await roastGroup.count() > 0) {
    // Try to select roast options in order of preference
    const espressoBtn = roastGroup.getByRole('button', { name: 'ESPRESSO' });
    const filterBtn = roastGroup.getByRole('button', { name: 'FILTER' });
    const omniBtn = roastGroup.getByRole('button', { name: 'OMNI' });
    
    if (await espressoBtn.count() > 0 && await espressoBtn.isEnabled()) {
      await espressoBtn.click();
    } else if (await filterBtn.count() > 0 && await filterBtn.isEnabled()) {
      await filterBtn.click();
    } else if (await omniBtn.count() > 0 && await omniBtn.isEnabled()) {
      await omniBtn.click();
    }
  }
  
  // Handle SIZE selection
  const sizeGroup = page.getByText('SIZE').locator('..');
  
  if (await sizeGroup.count() > 0) {
    const size250Btn = sizeGroup.getByRole('button', { name: '250GR' });
    const size1000Btn = sizeGroup.getByRole('button', { name: '1000GR' });
    
    if (await size250Btn.count() > 0 && await size250Btn.isEnabled()) {
      await size250Btn.click();
    } else if (await size1000Btn.count() > 0 && await size1000Btn.isEnabled()) {
      await size1000Btn.click();
    }
  }
  
  // Set quantity using semantic approach
  const quantityField = page.getByLabel(/quantity|select quantity/i)
    .or(page.getByRole('spinbutton'))
    .or(page.locator('input[type="number"]'));
    
  if (await quantityField.count() > 0) {
    await quantityField.fill('2');
    await expect(quantityField).toHaveValue('2');
  }
}

/**
 * Add current product to cart
 */
export async function addProductToCart(page: Page): Promise<void> {
  // Find Add to Cart button using semantic selector
  const addToCartButton = page.getByRole('button', { name: /ADD TO CART/i });
  
  // Ensure button is enabled before clicking
  await expect(addToCartButton).toBeEnabled();
  
  // Click Add to Cart
  await addToCartButton.click();
  
  // Wait for cart drawer to appear - target the specific cart drawer
  const cartDrawer = page.locator('aside.is-cart');
    
  await expect(cartDrawer).toBeVisible();
  
  // Verify product was added - look for quantity indicator or product info
  await expect(cartDrawer.getByText(/\d+/).or(cartDrawer.getByText(/qty|quantity/i)).first()).toBeVisible();
}

/**
 * Continue from cart to checkout
 */
export async function proceedToCheckout(page: Page): Promise<void> {
  // In the cart drawer, click Continue to Checkout using semantic selectors
  const checkoutButton = page.getByRole('button', { name: /CONTINUE TO CHECKOUT|CHECKOUT/i })
    .or(page.getByRole('link', { name: /CONTINUE TO CHECKOUT|CHECKOUT/i }));
  
  await expect(checkoutButton).toBeVisible();
  await checkoutButton.click();
  
  // Wait for checkout page - could be Shopify or custom checkout
  await expect(page).toHaveURL(/\/(checkouts?\/|cart)/);
  
  // Verify checkout page elements are present
  await expect(page.getByText(/Contact|Express checkout|Delivery/i).first()).toBeVisible();
}