/**
 * Flaky Test Suite for Coffee E2E Purchase Flow
 *
 * INTENTIONALLY demonstrates ANTI-PATTERNS that cause flakiness.
 * Same test flow as stable version, but implemented with common mistakes.
 *
 * Application Under Test: https://coffee-e2e.vercel.app/
 * Expected Result: 60-80% pass rate (demonstrating flakiness)
 *
 * DO NOT USE THESE PATTERNS IN PRODUCTION!
 */

import { test, expect } from '@playwright/test';

const TEST_DATA = {
  BASE_URL: 'https://coffee-e2e.vercel.app/en',
  PRODUCT_NAME: 'Colombian Huila SingleOrigin',
  CHECKOUT_FORM: {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    address: '123 Coffee Street',
    city: 'Seattle',
    postalCode: '98101',
    country: 'Afghanistan',
  },
};

test.describe('Coffee Purchase Flow - Flaky Tests', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.annotations.push({
      type: 'category',
      description: 'flaky',
    });

    testInfo.annotations.push({
      type: 'test-type',
      description: 'e2e-anti-patterns',
    });

    await page.goto(TEST_DATA.BASE_URL);

    // ANTI-PATTERN 1: No waitForLoadState - might start before page loads
  });

  test('Should complete full coffee purchase flow with validation (FLAKY)', async ({ page }) => {

    await test.step('Navigate to Coffee section', async () => {
      // ANTI-PATTERN 2: Start clicking immediately without initial wait
      await page.getByText('Coffee', { exact: true }).click();

      // ANTI-PATTERN 3: Hard-coded timeout (1200ms) - sometimes insufficient
      await page.waitForTimeout(1200);

      // ANTI-PATTERN 4: Click and immediately check results
      const singleOriginLink = page.getByRole('link', { name: 'Single Origin Pure coffees' });
      await expect(singleOriginLink).toBeVisible();
      await singleOriginLink.click();

      // ANTI-PATTERN 5: Short timeout for URL check (4000ms) - no waitForLoadState
      await expect(page).toHaveURL(/\/(en\/)?products\?category=SingleOrigin/, { timeout: 4000 });
    });

    await test.step('Select product', async () => {
      // ANTI-PATTERN 6: Using locator.all() - immediate snapshot without waiting for product page to load
      const viewDetailsButtons = await page.getByTestId('product-view-details-colombian-huila').all();
      if (viewDetailsButtons.length > 0) {
        await viewDetailsButtons[0].click({ timeout: 1500 });
      }

      // ANTI-PATTERN 7: Very short timeout (200ms)
      await page.waitForTimeout(200);
    });

    await test.step('Add to cart and buy now', async () => {
      // ANTI-PATTERN 8: Click without verifying button is enabled
      await page.getByRole('button', { name: 'Add to Cart' }).first().click({ timeout: 1500 });

      // ANTI-PATTERN 9: Toast verification with too short wait (50ms insufficient)
      await page.waitForTimeout(50);
      const successToast = page.getByText('Item added to guest cart');
      await expect(successToast).toBeVisible({ timeout: 800 });

      // ANTI-PATTERN 10: Cart badge check with short timeout (600ms may be insufficient)
      const cartBadge = page.locator('div').filter({ hasText: /^Log In\d+$/ }).locator('span');
      await expect(cartBadge).toHaveText('1', { timeout: 600 });

      // ANTI-PATTERN 11: Short timeout between actions
      await page.waitForTimeout(100);

      // ANTI-PATTERN 12: Click Buy Now without state verification
      await page.getByRole('button', { name: 'Buy Now' }).click({ timeout: 1500 });
    });

    await test.step('Proceed to checkout', async () => {
      // ANTI-PATTERN 13: No wait between Buy Now and Proceed to Checkout
      await page.getByRole('button', { name: 'Proceed to Checkout' }).click({ timeout: 1500 });

      // ANTI-PATTERN 14: Very short fixed timeout (300ms)
      await page.waitForTimeout(300);
    });

    await test.step('Fill checkout form', async () => {
      // ANTI-PATTERN 15: Rapid form filling without verification
      await page.getByRole('textbox', { name: 'Full Name' }).fill(TEST_DATA.CHECKOUT_FORM.fullName, { timeout: 1500 });

      // ANTI-PATTERN 16: No value verification after filling
      await page.getByRole('textbox', { name: 'Email' }).fill(TEST_DATA.CHECKOUT_FORM.email);
      await page.getByRole('textbox', { name: 'Address' }).fill(TEST_DATA.CHECKOUT_FORM.address);

      // ANTI-PATTERN 17: Rapid form filling without waiting
      await page.getByRole('textbox', { name: 'City' }).fill(TEST_DATA.CHECKOUT_FORM.city);

      // ANTI-PATTERN 18: No wait or verification before filling
      await page.getByRole('textbox', { name: 'Postal Code' }).fill(TEST_DATA.CHECKOUT_FORM.postalCode);

      // ANTI-PATTERN 19: Hard-coded timeout for dropdown (300ms)
      await page.waitForTimeout(300);

      // ANTI-PATTERN 20: No verification that dropdown is ready
      await page.getByRole('combobox').first().click();

      // ANTI-PATTERN 21: Assuming options are immediately available
      await page.getByRole('option', { name: TEST_DATA.CHECKOUT_FORM.country }).click();

      // ANTI-PATTERN 22: Checkbox check without verification
      await page.getByRole('checkbox').check();
    });

    await test.step('Verify checkout completion ready', async () => {
      // ANTI-PATTERN 23: Short timeout before final assertion (200ms)
      await page.waitForTimeout(200);

      // ANTI-PATTERN 24: Incomplete assertion (only checks visible, not enabled)
      await expect(page.getByRole('button', { name: 'Continue to Payment' })).toBeVisible();
    });
  });
});
