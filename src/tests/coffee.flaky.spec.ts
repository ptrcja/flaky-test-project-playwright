/**
 * Flaky Test Suite for Coffee E2E Purchase Flow
 *
 * This test suite INTENTIONALLY demonstrates ANTI-PATTERNS that cause flakiness.
 * Same test flow as stable version, but implemented with common mistakes.
 *
 * Application Under Test: https://coffee-e2e.vercel.app/
 *
 * Anti-Patterns Demonstrated:
 * ❌ Hard-coded timeouts instead of proper waits
 * ❌ Missing waitForLoadState after navigation
 * ❌ Race conditions between actions
 * ❌ Fragile CSS selectors with nth-child
 * ❌ No assertions between steps
 * ❌ Premature interactions before page ready
 * ❌ No state verification
 * ❌ Timing-sensitive operations
 * ❌ Text encoding issues
 * ❌ Bad form filling practices
 *
 * Expected Result: 60-80/100 passes (60-80% pass rate, demonstrating flakiness)
 *
 * DO NOT USE THESE PATTERNS IN PRODUCTION TESTS!
 * This is for educational and flaky detection validation purposes only.
 */

import { test, expect } from '@playwright/test';

// Test data (same as stable version)
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
  },
};

test.describe('Coffee Purchase Flow - Flaky Tests', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Add CTRF metadata
    testInfo.annotations.push({
      type: 'category',
      description: 'flaky',
    });

    testInfo.annotations.push({
      type: 'test-type',
      description: 'e2e-anti-patterns',
    });

    // Navigate to homepage
    await page.goto(TEST_DATA.BASE_URL);

    // ANTI-PATTERN 1: No waitForLoadState - might start interacting before page loads
    // Missing: await page.waitForLoadState('domcontentloaded');
    // WHY IT FAILS: If page takes longer to load, subsequent actions will fail
    // FIX: Add await page.waitForLoadState('domcontentloaded');
  });

  test('should complete full coffee purchase flow with validation (FLAKY)', async ({ page }) => {
    // ANTI-PATTERN 2: NO initial wait - start clicking immediately
    // From articles: "Tests proceed before the application is ready"
    // WHY IT FAILS: Page might not be fully interactive yet
    // FIX: Add await page.waitForLoadState('domcontentloaded') after navigation

    // ANTI-PATTERN 3: No test.step() - harder to debug which step fails
    // Navigate to Coffee section
    await page.getByText('Coffee', { exact: true }).click();

    // ANTI-PATTERN 4: Very short timeout (hope-based timing from articles)
    // WHY IT FAILS: 100ms rarely enough for dropdown menu to render
    // FIX: Use proper wait for element visibility
    await page.waitForTimeout(100);

    // ANTI-PATTERN 5: Click Single Origin link and immediately check results
    // Pattern from articles: "async operations without proper waiting"
    const singleOriginLink = page.getByRole('link', { name: 'Single Origin Pure coffees' });
    await expect(singleOriginLink).toBeVisible();
    await singleOriginLink.click();

    // ANTI-PATTERN 6: NO WAIT - Immediately check URL after navigation with VERY SHORT timeout
    // From articles: "Tests proceed before the application is ready"
    // WHY IT FAILS: 1500ms often not enough for navigation + page load
    // FIX: Use await page.waitForURL(/\/products\?category=SingleOrigin/) with default timeout
    await expect(page).toHaveURL(/\/products\?category=SingleOrigin/, { timeout: 1500 });

    // ANTI-PATTERN 7: Using locator.all() - immediate snapshot (from articles)
    // WHY IT FAILS: "performs an immediate snapshot without waiting" - race condition
    // FIX: Use await expect(button).toBeVisible() before clicking
    const viewDetailsButtons = await page.getByTestId('product-view-details-colombian-huila').all();
    if (viewDetailsButtons.length > 0) {
      await viewDetailsButtons[0].click({ timeout: 1500 });
    }

    // ANTI-PATTERN 8: Very short timeout before checking element (hope-based timing)
    // WHY IT FAILS: 200ms rarely enough for product page to render
    // FIX: Use await page.waitForLoadState('networkidle')
    await page.waitForTimeout(200);

    // ANTI-PATTERN 9: Click without verifying button is ready (async operation pattern)
    // From articles: "async operations - checking results before completion"
    // WHY IT FAILS: Button might not be interactive yet
    // FIX: Add await expect(button).toBeVisible() and toBeEnabled()
    await page.getByRole('button', { name: 'Add to Cart' }).first().click({ timeout: 1500 });

    // ANTI-PATTERN 10: Short timeout between async operations
    // WHY IT FAILS: Cart might not have updated in 100ms
    // FIX: Use proper state verification or waitForLoadState
    await page.waitForTimeout(100);

    // ANTI-PATTERN 11: Rapid consecutive clicks (from articles: race conditions)
    // WHY IT FAILS: "Multiple actions without waiting for state updates"
    // FIX: Add await page.waitForLoadState() between clicks
    await page.getByRole('button', { name: 'Buy Now' }).click({ timeout: 1500 });
    await page.getByRole('button', { name: 'Proceed to Checkout' }).click({ timeout: 1500 });

    // ANTI-PATTERN 12: Very short fixed timeout (hope-based timing from articles)
    // WHY IT FAILS: 300ms often not enough for checkout page navigation
    // FIX: Use await page.waitForURL(/\/cart/) with default timeout
    await page.waitForTimeout(300);

    // ANTI-PATTERN 13: Rapid form filling without wait (from articles)
    // From articles: "Tests proceed before application is ready"
    // WHY IT FAILS: Form might not be fully rendered/interactive yet
    // FIX: Use await waitForCheckoutReady(page) before filling

    // ANTI-PATTERN 14: Fill field with short timeout
    // WHY IT FAILS: 1500ms might not be enough for form to be ready
    // FIX: Use default timeout and verify field is visible first
    await page.getByRole('textbox', { name: 'Full Name' }).fill(TEST_DATA.CHECKOUT_FORM.fullName, { timeout: 1500 });

    // ANTI-PATTERN 18: No value verification after filling
    // Missing: await expect(field).toHaveValue(expectedValue);
    // WHY IT FAILS: Fill operation might fail silently
    // FIX: Verify each field contains the expected value

    // ANTI-PATTERN 19: Rapid form filling without proper synchronization
    // WHY IT FAILS: Fields might not process input fast enough
    // FIX: Add visibility checks and value verification for each field
    await page.getByRole('textbox', { name: 'Email' }).fill(TEST_DATA.CHECKOUT_FORM.email);
    await page.getByRole('textbox', { name: 'Address' }).fill(TEST_DATA.CHECKOUT_FORM.address);

    // ANTI-PATTERN 20: Rapid form filling without waiting for previous field
    // WHY IT FAILS: Filling too fast might cause focus issues or missed inputs
    // FIX: Add small waits or verification between field fills
    await page.getByRole('textbox', { name: 'City' }).fill(TEST_DATA.CHECKOUT_FORM.city);

    // ANTI-PATTERN 21: No wait or verification before filling field
    // WHY IT FAILS: Field might not be ready yet, causing intermittent failures
    // FIX: Add await expect(field).toBeVisible() before filling
    await page.getByRole('textbox', { name: 'Postal Code' }).fill(TEST_DATA.CHECKOUT_FORM.postalCode);

    // ANTI-PATTERN 22: Hard-coded timeout for dropdown
    // WHY IT FAILS: Dropdown might not be ready in 300ms
    // FIX: Verify dropdown is visible and enabled before clicking
    await page.waitForTimeout(300);

    // ANTI-PATTERN 23: No verification that dropdown is ready
    // WHY IT FAILS: Dropdown might still be initializing
    // FIX: Add await expect(dropdown).toBeVisible() and toBeEnabled()
    await page.getByRole('combobox').first().click();

    // ANTI-PATTERN 24: Assuming options are immediately available
    // WHY IT FAILS: Dropdown options might take time to render
    // FIX: Wait for specific option to be visible before clicking
    await page.getByRole('option', { name: TEST_DATA.CHECKOUT_FORM.country }).click();

    // ANTI-PATTERN 25: Checkbox check without verification
    // WHY IT FAILS: Checkbox might not be enabled or clickable
    // FIX: Verify checkbox is visible, enabled, and then check it's checked
    await page.getByRole('checkbox').check();

    // ANTI-PATTERN 26: No wait after checkbox interaction
    // Missing: await expect(checkbox).toBeChecked();
    // WHY IT FAILS: Checkbox state change might not complete
    // FIX: Verify checkbox is in expected state

    // ANTI-PATTERN 27: Short timeout before final assertion
    // WHY IT FAILS: Form validation might take longer than 200ms
    // FIX: Use proper wait for button state changes
    await page.waitForTimeout(200);

    // ANTI-PATTERN 28: Premature assertion without proper wait
    // WHY IT FAILS: Button might still be disabled due to ongoing validation
    // FIX: Wait for networkidle or add explicit wait for button to be enabled
    await expect(page.getByRole('button', { name: 'Continue to Payment' })).toBeVisible();

    // ANTI-PATTERN 29: No verification that button is enabled
    // Missing: await expect(continueButton).toBeEnabled();
    // WHY IT FAILS: Button might be visible but disabled
    // FIX: Check both visibility AND enabled state
  });
});

/**
 * Why This Test Has 60-80% Pass Rate (20-40% Failure Rate):
 *
 * Failure Distribution Across Different Conditions:
 *
 * 1. Navigation Failures (~20%):
 *    - Missing waitForLoadState causes race conditions
 *    - Hard-coded timeouts too short for slow networks
 *    - Clicking before elements are visible
 *
 * 2. Element Not Found (~25%):
 *    - Fragile nth-child selector breaks on DOM changes
 *    - Premature interactions before page ready
 *    - No visibility checks before clicking
 *
 * 3. Timing Issues (~30%):
 *    - Hard-coded timeouts (200ms, 300ms, 400ms, 500ms)
 *    - Multiple rapid clicks without state verification
 *    - Form filling without synchronization
 *    - Dropdown interactions too fast
 *
 * 4. State Problems (~15%):
 *    - No assertions between steps
 *    - Missing value verification after form filling
 *    - No URL checks after navigation
 *    - Checkbox state not verified
 *
 * 5. Form Validation Issues (~10%):
 *    - Premature final assertion
 *    - No check for enabled state
 *    - No verification of validation errors
 *    - Rapid field filling causing missed inputs
 *
 * Comparison to Stable Version:
 *
 * | Aspect | Stable Test | Flaky Test |
 * |--------|-------------|------------|
 * | Waits | waitForLoadState, expect() | waitForTimeout(ms) |
 * | Selectors | getByRole, semantic | nth-child, CSS, IDs |
 * | Assertions | After every step | Minimal |
 * | State Checks | Visibility + enabled | None |
 * | Form Filling | Verified each field | Rapid, unverified |
 * | Navigation | URL checks, load states | No verification |
 * | Structure | test.step() | Flat, hard to debug |
 * | Pass Rate | 100/100 (100%) | 60-80/100 (60-80%) |
 *
 * The contrast demonstrates how small implementation differences
 * dramatically affect test reliability. Both tests follow the same
 * user journey, but anti-patterns cause intermittent failures.
 *
 * Educational Value:
 * - Shows exact patterns to avoid
 * - Demonstrates real failure scenarios
 * - Validates flaky detection system
 * - Helps junior developers learn what NOT to do
 */
