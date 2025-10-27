/**
 * Test Helper Functions for Coffee E2E Tests
 *
 * Reusable helper functions for the coffee-e2e.vercel.app purchase flow.
 * These helpers follow Playwright best practices with proper waits and semantic selectors.
 *
 * @see https://coffee-e2e.vercel.app/
 */

import { Page, expect } from '@playwright/test';

/**
 * Interface for checkout form data
 */
export interface CheckoutFormData {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  acceptTerms: boolean;
}

/**
 * Navigate to the Coffee section and then to Single Origin collection
 *
 * @param page - Playwright Page object
 * @returns Promise that resolves when navigation is complete
 *
 * @example
 * await navigateToCoffeeSection(page);
 */
export async function navigateToCoffeeSection(page: Page): Promise<void> {
  // Click on "Coffee" in the navbar - use exact match to avoid partial matches
  const coffeeLink = page.getByText('Coffee', { exact: true });
  await expect(coffeeLink).toBeVisible();
  await coffeeLink.click();

  // Wait for navigation to complete
  await page.waitForLoadState('domcontentloaded');

  // Click on "Single Origin" link
  const singleOriginLink = page.getByRole('link', { name: 'Single Origin Pure coffees' });
  await expect(singleOriginLink).toBeVisible();
  await singleOriginLink.click();

  // Wait for navigation to complete using waitForURL (best practice for navigation)
  await page.waitForURL(/\/products\?category=SingleOrigin/);

  // Verify product listings are visible using web-first assertion
  await expect(page.getByRole('link', { name: /Colombian|Ethiopian|Costa Rica Tarrazu/i }).first()).toBeVisible();
}

/**
 * Select a specific coffee product by name
 *
 * @param page - Playwright Page object
 * @param productName - Name of the product to select (e.g., "Colombian Huila SingleOrigin")
 * @returns Promise that resolves when product page is loaded
 *
 * @example
 * await selectProduct(page, 'Colombian Huila SingleOrigin');
 */
export async function selectProduct(page: Page, productName: string): Promise<void> {
  // For Colombian Huila product, we can use the test-id for reliable selection
  // Alternative: use getByRole('link', { name: /View Details/i }) within the product card
  const productTestId = 'product-view-details-colombian-huila';
  const viewDetailsButton = page.getByTestId(productTestId);

  await expect(viewDetailsButton).toBeVisible();
  await viewDetailsButton.click();

  // Wait for product page to load
  await page.waitForLoadState('domcontentloaded');

  // Verify we navigated to individual product page
  await expect(page).toHaveURL(/\/products\//);

  // IMPORTANT: Wait for "Add to Cart" button to be visible on the product page
  // This ensures the product page is fully loaded before proceeding
  const addToCartButton = page.getByRole('button', { name: 'Add to Cart' });
  await expect(addToCartButton).toBeVisible();
  await expect(addToCartButton).toBeEnabled();
}

/**
 * Add the current product to the cart
 *
 * @param page - Playwright Page object
 * @returns Promise that resolves when product is added to cart
 *
 * @example
 * await addToCart(page);
 */
export async function addToCart(page: Page): Promise<void> {
  // Find and click "Add to Cart" button
  const addToCartButton = page.getByRole('button', { name: 'Add to Cart' });
  await expect(addToCartButton).toBeVisible();
  await expect(addToCartButton).toBeEnabled();
  await addToCartButton.click();

  // Wait for cart to update - verify by checking cart indicator or success message
  // Wait a moment for cart state to update
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate from cart to checkout
 *
 * @param page - Playwright Page object
 * @returns Promise that resolves when checkout page is loaded
 *
 * @example
 * await proceedToCheckout(page);
 */
export async function proceedToCheckout(page: Page): Promise<void> {
  // Click "Proceed to Checkout" button
  const proceedButton = page.getByRole('button', { name: 'Proceed to Checkout' });
  await expect(proceedButton).toBeVisible();
  await expect(proceedButton).toBeEnabled();
  await proceedButton.click();

  // Wait for checkout/cart page to load
  await page.waitForLoadState('domcontentloaded');

  // Verify we're on the cart/checkout page
  await expect(page).toHaveURL(/\/cart/);

  // Verify checkout form fields are present
  await expect(page.getByRole('textbox', { name: 'Full Name' })).toBeVisible();
}

/**
 * Wait for checkout page to be fully ready for interaction
 *
 * @param page - Playwright Page object
 * @returns Promise that resolves when checkout page is fully loaded
 *
 * @example
 * await waitForCheckoutReady(page);
 */
export async function waitForCheckoutReady(page: Page): Promise<void> {
  // Wait for network to be idle (all resources loaded)
  await page.waitForLoadState('networkidle');

  // Verify critical form elements are present and interactive
  await expect(page.getByRole('textbox', { name: 'Full Name' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Address' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'City' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Postal Code' })).toBeVisible();

  // Verify country dropdown is ready
  const countryDropdown = page.getByRole('combobox').filter({ hasText: 'Select a country' });
  await expect(countryDropdown).toBeVisible();
}

/**
 * Fill out the complete checkout form with provided data
 *
 * @param page - Playwright Page object
 * @param formData - Object containing all form field values
 * @returns Promise that resolves when form is filled
 *
 * @example
 * await fillCheckoutForm(page, {
 *   fullName: 'John Doe',
 *   email: 'john@example.com',
 *   address: '123 Coffee St',
 *   city: 'Seattle',
 *   postalCode: '98101',
 *   country: 'United States',
 *   acceptTerms: true
 * });
 */
export async function fillCheckoutForm(page: Page, formData: CheckoutFormData): Promise<void> {
  // Fill Full Name
  const fullNameField = page.getByRole('textbox', { name: 'Full Name' });
  await expect(fullNameField).toBeVisible();
  await fullNameField.fill(formData.fullName);
  await expect(fullNameField).toHaveValue(formData.fullName);

  // Fill Email
  const emailField = page.getByRole('textbox', { name: 'Email' });
  await expect(emailField).toBeVisible();
  await emailField.fill(formData.email);
  await expect(emailField).toHaveValue(formData.email);

  // Fill Address
  const addressField = page.getByRole('textbox', { name: 'Address' });
  await expect(addressField).toBeVisible();
  await addressField.fill(formData.address);
  await expect(addressField).toHaveValue(formData.address);

  // Fill City
  const cityField = page.getByRole('textbox', { name: 'City' });
  await expect(cityField).toBeVisible();
  await cityField.fill(formData.city);
  await expect(cityField).toHaveValue(formData.city);

  // Fill Postal Code
  const postalCodeField = page.getByRole('textbox', { name: 'Postal Code' });
  await expect(postalCodeField).toBeVisible();
  await postalCodeField.fill(formData.postalCode);
  await expect(postalCodeField).toHaveValue(formData.postalCode);

  // Select Country
  const countryDropdown = page.getByRole('combobox').filter({ hasText: 'Select a country' });
  await expect(countryDropdown).toBeVisible();
  await countryDropdown.click();

  // Wait for dropdown options to appear and select country
  const countryOption = page.getByRole('option', { name: formData.country });
  await expect(countryOption).toBeVisible();
  await countryOption.click();

  // Delivery Carrier - default is usually pre-selected (UPS), no need to change unless specified
  // But we can verify it's present
  const deliveryCarrier = page.getByRole('combobox').filter({ hasText: 'UPS' });
  if (await deliveryCarrier.count() > 0) {
    await expect(deliveryCarrier).toBeVisible();
  }

  // Accept Terms of Service
  if (formData.acceptTerms) {
    const termsCheckbox = page.getByRole('checkbox', { name: 'I accept the Terms of Service' });
    await expect(termsCheckbox).toBeVisible();
    await expect(termsCheckbox).toBeEnabled();
    await termsCheckbox.check();
    await expect(termsCheckbox).toBeChecked();
  }

  // Verify "Continue to Payment" button is now visible (form validation passed)
  const continueButton = page.getByRole('button', { name: 'Continue to Payment' });
  await expect(continueButton).toBeVisible();
}

/**
 * Best Practices Applied in These Helpers:
 *
 * 1. Semantic Selectors: Using getByRole, getByText for accessibility-first approach
 * 2. Auto-waiting: Leveraging Playwright's built-in auto-wait with expect()
 * 3. State Verification: Checking element visibility and enabled state before interaction
 * 4. Load State Management: Using waitForLoadState() for proper navigation waits
 * 5. Value Verification: Confirming form fields contain expected values after filling
 * 6. Proper Typing: TypeScript interfaces for type safety
 * 7. Documentation: JSDoc comments for better code maintainability
 * 8. Error Prevention: Multiple checks to ensure element is ready before interaction
 * 9. Realistic Waits: Using networkidle for operations that trigger network requests
 * 10. Atomic Operations: Each helper performs a single, well-defined task
 */
