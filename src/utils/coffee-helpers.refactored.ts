/**
 * Test Helper Functions for Coffee E2E Tests
 *
 * Reusable helper functions for the coffee-e2e.vercel.app purchase flow.
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
 */
export async function navigateToCoffeeSection(page: Page): Promise<void> {
  const coffeeLink = page.getByText('Coffee', { exact: true });
  await expect(coffeeLink).toBeVisible();
  await coffeeLink.click();

  await page.waitForLoadState('domcontentloaded');

  const singleOriginLink = page.getByRole('link', { name: 'Single Origin Pure coffees' });
  await expect(singleOriginLink).toBeVisible();
  await singleOriginLink.click();

  await page.waitForURL(/\/products\?category=SingleOrigin/);

  await expect(page.locator('[data-testid^="product-view-details"]').first()).toBeVisible();
}

/**
 * Select the Colombian Huila Single Origin product
 *
 * @param page - Playwright Page object
 * @returns Promise that resolves when product page is loaded
 */
export async function selectColombianProduct(page: Page): Promise<void> {
  const productTestId = 'product-view-details-colombian-huila';
  const viewDetailsButton = page.getByTestId(productTestId);

  await expect(viewDetailsButton).toBeVisible();
  await viewDetailsButton.click();

  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL(/\/(en\/)?products(\/|\?)/);

  const addToCartButton = page.getByRole('button', { name: 'Add to Cart' });
  await expect(addToCartButton).toBeVisible();
  await expect(addToCartButton).toBeEnabled();
}

/**
 * Add the current product to the cart
 * Validates both user notification and cart badge update
 *
 * @param page - Playwright Page object
 * @returns Promise that resolves when product is added to cart
 */
export async function addToCart(page: Page): Promise<void> {
  const addToCartButton = page.getByRole('button', { name: 'Add to Cart' });
  await expect(addToCartButton).toBeVisible();
  await expect(addToCartButton).toBeEnabled();
  await addToCartButton.click();

  // Verify success notification
  const successToast = page.getByText('Item added to guest cart');
  await expect(successToast).toBeVisible();

  // Verify cart badge updated
  const cartBadge = page.locator('div').filter({ hasText: /^Log In\d+$/ }).locator('span');
  await expect(cartBadge).toHaveText('1');
}

/**
 * Click the "Buy Now" button to proceed to cart
 *
 * @param page - Playwright Page object
 * @returns Promise that resolves when Buy Now is clicked
 */
export async function clickBuyNow(page: Page): Promise<void> {
  const buyNowButton = page.getByRole('button', { name: 'Buy Now' });

  await expect(buyNowButton).toBeVisible();
  await expect(buyNowButton).toBeEnabled();

  await buyNowButton.click();
}

/**
 * Navigate from cart to checkout
 *
 * @param page - Playwright Page object
 * @returns Promise that resolves when checkout page is loaded
 */
export async function proceedToCheckout(page: Page): Promise<void> {
  const proceedButton = page.getByRole('button', { name: 'Proceed to Checkout' });
  await expect(proceedButton).toBeVisible();
  await expect(proceedButton).toBeEnabled();
  await proceedButton.click();

  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveURL(/\/cart/);
}

/**
 * Fill out the complete checkout form with provided data
 * Validates each field before and after filling
 *
 * @param page - Playwright Page object
 * @param formData - Object containing all form field values
 * @returns Promise that resolves when form is filled
 */
export async function fillCheckoutForm(page: Page, formData: CheckoutFormData): Promise<void> {
  const fullNameField = page.getByRole('textbox', { name: 'Full Name' });
  await expect(fullNameField).toBeVisible();
  await fullNameField.fill(formData.fullName);
  await expect(fullNameField).toHaveValue(formData.fullName);

  const emailField = page.getByRole('textbox', { name: 'Email' });
  await expect(emailField).toBeVisible();
  await emailField.fill(formData.email);
  await expect(emailField).toHaveValue(formData.email);

  const addressField = page.getByRole('textbox', { name: 'Address' });
  await expect(addressField).toBeVisible();
  await addressField.fill(formData.address);
  await expect(addressField).toHaveValue(formData.address);

  const cityField = page.getByRole('textbox', { name: 'City' });
  await expect(cityField).toBeVisible();
  await cityField.fill(formData.city);
  await expect(cityField).toHaveValue(formData.city);

  const postalCodeField = page.getByRole('textbox', { name: 'Postal Code' });
  await expect(postalCodeField).toBeVisible();
  await postalCodeField.fill(formData.postalCode);
  await expect(postalCodeField).toHaveValue(formData.postalCode);

  const countryDropdown = page.getByRole('combobox').filter({ hasText: 'Select a country' });
  await expect(countryDropdown).toBeVisible();
  await countryDropdown.click();

  const countryOption = page.getByRole('option', { name: formData.country });
  await expect(countryOption).toBeVisible();
  await countryOption.click();

  // Verify delivery carrier is present (default UPS is acceptable)
  const deliveryCarrier = page.getByRole('combobox').filter({ hasText: 'UPS' });
  await expect(deliveryCarrier).toBeVisible();

  if (formData.acceptTerms) {
    const termsCheckbox = page.getByRole('checkbox', { name: 'I accept the Terms of Service' });
    await expect(termsCheckbox).toBeVisible();
    await expect(termsCheckbox).toBeEnabled();
    await termsCheckbox.check();
    await expect(termsCheckbox).toBeChecked();
  }

  // Verify form validation passed
  const continueButton = page.getByRole('button', { name: 'Continue to Payment' });
  await expect(continueButton).toBeVisible();
  await expect(continueButton).toBeEnabled();
}
