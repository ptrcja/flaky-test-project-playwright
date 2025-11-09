/**
 * Stable Test Suite for Coffee E2E Purchase Flow
 *
 * Application Under Test: https://coffee-e2e.vercel.app/
 * Expected Result: 100% pass rate over multiple runs
 */

import { test, expect } from '@playwright/test';
import {
  navigateToCoffeeSection,
  selectColombianProduct,
  addToCart,
  clickBuyNow,
  proceedToCheckout,
  fillCheckoutForm,
  type CheckoutFormData,
} from '../utils/coffee-helpers';

const TEST_DATA = {
  BASE_URL: 'https://coffee-e2e.vercel.app/en',
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
    testInfo.annotations.push({
      type: 'category',
      description: 'stable',
    });

    testInfo.annotations.push({
      type: 'test-type',
      description: 'e2e-best-practices',
    });

    await page.goto(TEST_DATA.BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Should complete full coffee purchase flow with validation', async ({ page }) => {
    await test.step('Navigate to Coffee section', async () => {
      await navigateToCoffeeSection(page);
    });

    await test.step('Select product', async () => {
      await selectColombianProduct(page);
    });

    await test.step('Add to cart and buy now', async () => {
      await addToCart(page);
      await clickBuyNow(page);
    });

    await test.step('Proceed to checkout', async () => {
      await proceedToCheckout(page);
    });

    await test.step('Fill checkout form', async () => {
      await fillCheckoutForm(page, TEST_DATA.CHECKOUT_FORM);
    });
  });
});
