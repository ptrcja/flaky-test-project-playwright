/**
 * Stable Test Suite for Coffee E2E Purchase Flow
 *
 * This test suite demonstrates BEST PRACTICES for writing reliable, maintainable Playwright tests.
 * Tests follow Playwright's recommended patterns and should achieve 100% pass rate over 100 runs.
 *
 * Application Under Test: https://coffee-e2e.vercel.app/
 *
 * Best Practices Demonstrated:
 * ✅ Auto-waiting with expect() assertions (NO hard-coded timeouts)
 * ✅ Semantic selectors (getByRole, getByText, getByLabel)
 * ✅ Proper waitForLoadState() for navigation
 * ✅ Inline validation at critical steps
 * ✅ Test.step() for clear reporting
 * ✅ State verification between actions
 * ✅ Reusable helper functions
 * ✅ Proper TypeScript typing
 * ✅ Test isolation (no shared state)
 * ✅ Comprehensive assertions
 *
 * Expected Result: 100/100 passes (100% pass rate)
 */

import { test, expect } from '@playwright/test';
import {
  navigateToCoffeeSection,
  selectProduct,
  addToCart,
  proceedToCheckout,
  fillCheckoutForm,
  waitForCheckoutReady,
  type CheckoutFormData,
} from '../utils/coffee-helpers';

// Test data constants
const TEST_DATA = {
  BASE_URL: 'https://coffee-e2e.vercel.app/',
  PRODUCT_NAME: 'Colombian Huila SingleOrigin',
  CHECKOUT_FORM: {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    address: '123 Coffee Street',
    city: 'Seattle',
    postalCode: '98101',
    country: 'Afghanistan',
    acceptTerms: true,
  } as CheckoutFormData,
};

test.describe('Coffee Purchase Flow - Stable Tests', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Add CTRF metadata for test categorization
    testInfo.annotations.push({
      type: 'category',
      description: 'stable',
    });

    testInfo.annotations.push({
      type: 'test-type',
      description: 'e2e-best-practices',
    });

    // Navigate to application homepage
    await page.goto(TEST_DATA.BASE_URL);

    // BEST PRACTICE: Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');

    // BEST PRACTICE: Verify critical page element is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should complete full coffee purchase flow with validation', async ({ page }) => {
    // BEST PRACTICE: Use test.step() for clear reporting and debugging
    await test.step('Navigate to Coffee section', async () => {
      // BEST PRACTICE: Use helper function with proper waits and assertions
      await navigateToCoffeeSection(page);

      // BEST PRACTICE: Verify navigation completed successfully
      await expect(page).toHaveURL(/products\?category=SingleOrigin/);
    });

    await test.step('Select product', async () => {
      // BEST PRACTICE: Use named constants for test data
      await selectProduct(page, TEST_DATA.PRODUCT_NAME);

      // BEST PRACTICE: Verify we're on the product page
      await expect(page).toHaveURL(/products/);

      // BEST PRACTICE: Verify product details are visible
      await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeVisible();
    });

    await test.step('Add to cart and buy now', async () => {
      // BEST PRACTICE: Use helper with built-in verification
      await addToCart(page);

      // BEST PRACTICE: Verify cart was updated (implicit in helper)
      // Now click "Buy Now" button
      const buyNowButton = page.getByRole('button', { name: 'Buy Now' });
      await expect(buyNowButton).toBeVisible();
      await expect(buyNowButton).toBeEnabled();
      await buyNowButton.click();

      // BEST PRACTICE: Wait for any cart/modal transitions
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Proceed to checkout', async () => {
      // BEST PRACTICE: Helper handles navigation and verification
      await proceedToCheckout(page);

      // BEST PRACTICE: Verify checkout/cart page loaded
      await expect(page).toHaveURL(/\/cart/);
    });

    await test.step('Validate checkout form fields are present', async () => {
      // BEST PRACTICE: Wait for checkout page to be fully ready
      await waitForCheckoutReady(page);

      // BEST PRACTICE: Inline validation - verify form is ready before filling
      // This ensures the page is in the correct state
      await expect(page.getByRole('textbox', { name: 'Full Name' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Address' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'City' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Postal Code' })).toBeVisible();

      // BEST PRACTICE: Verify dropdown is present and interactive
      const countryDropdown = page.getByRole('combobox').filter({ hasText: 'Select a country' });
      await expect(countryDropdown).toBeVisible();
      await expect(countryDropdown).toBeEnabled();

      // BEST PRACTICE: Verify checkbox is present
      const termsCheckbox = page.getByRole('checkbox', { name: 'I accept the Terms of Service' });
      await expect(termsCheckbox).toBeVisible();
      await expect(termsCheckbox).toBeEnabled();
    });

    await test.step('Fill checkout form', async () => {
      // BEST PRACTICE: Use helper with comprehensive validation
      await fillCheckoutForm(page, TEST_DATA.CHECKOUT_FORM);

      // BEST PRACTICE: Verify all fields were filled correctly (done in helper)
      // Additional verification: ensure form is in valid state
      await expect(page.getByRole('textbox', { name: 'Full Name' })).toHaveValue(
        TEST_DATA.CHECKOUT_FORM.fullName
      );
      await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue(
        TEST_DATA.CHECKOUT_FORM.email
      );
      await expect(page.getByRole('checkbox', { name: 'I accept the Terms of Service' })).toBeChecked();
    });

    await test.step('Verify checkout completion ready', async () => {
      // BEST PRACTICE: Multiple assertions to verify button state
      const continueButton = page.getByRole('button', { name: 'Continue to Payment' });

      await expect(continueButton).toBeVisible();
      await expect(continueButton).toBeEnabled();

      // SUCCESS: At this point, the user could proceed to payment
      // The button being enabled indicates form validation passed
      // For this test, we stop here as we've validated the full flow
    });
  });
});

/**
 * Why This Test Should Achieve 100% Pass Rate:
 *
 * 1. Proper Waits:
 *    - waitForLoadState() after navigation
 *    - Auto-wait with expect() assertions
 *    - waitForCheckoutReady() ensures form is fully loaded
 *
 * 2. State Verification:
 *    - URL checks after navigation
 *    - Element visibility checks before interaction
 *    - Value verification after form filling
 *    - Button state checks (visible + enabled)
 *
 * 3. Robust Selectors:
 *    - getByRole for semantic HTML elements
 *    - getByText with exact matching
 *    - No fragile CSS selectors or nth-child
 *
 * 4. Load State Management:
 *    - domcontentloaded for page transitions
 *    - networkidle for operations with network requests
 *    - Auto-wait built into Playwright assertions
 *
 * 5. Error Prevention:
 *    - Checking enabled state before clicking
 *    - Verifying fields are visible before filling
 *    - Confirming values after filling
 *
 * 6. Test Isolation:
 *    - Each test starts fresh with beforeEach
 *    - No shared state between tests
 *    - Constants for test data (no mutations)
 *
 * 7. Comprehensive Validation:
 *    - Assertions at every critical step
 *    - Form validation checks
 *    - No assumptions about page state
 *
 * 8. Helper Functions:
 *    - Reusable, well-tested helpers
 *    - Built-in verification
 *    - Proper error handling
 *
 * 9. Clear Reporting:
 *    - test.step() for structured output
 *    - Descriptive test names
 *    - CTRF annotations for categorization
 *
 * 10. No Anti-Patterns:
 *     - NO hard-coded timeouts (waitForTimeout)
 *     - NO force clicks
 *     - NO brittle selectors
 *     - NO race conditions
 *     - NO missing waits
 *
 * This test follows the exact same user journey as the flaky version,
 * but implements it correctly. The contrast will clearly demonstrate
 * how proper testing practices eliminate flakiness.
 */
