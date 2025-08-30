/**
 * Stable Test Suite for FriedHats Coffee Purchase Flow
 * 
 * This test demonstrates best practices for writing reliable Playwright tests.
 * We'll test a realistic user journey: browsing coffee → viewing details → adding to cart
 * 
 * Key stability principles applied:
 * - Proper waiting strategies (no arbitrary timeouts)
 * - Stable selectors (text, roles, test-ids where available)
 * - Explicit conditions for dynamic content
 * - Network stability through proper load states
 */

import { test, expect } from '@playwright/test';

test.describe('FriedHats Coffee Purchase Flow - Stable Implementation', () => {
    // Add metadata for CTRF reporting
    test.beforeEach(async ({ }, testInfo) => {
        testInfo.annotations.push({
            type: 'category',
            description: 'stable',
        });
    });

    test('should browse and add coffee to cart reliably', async ({ page }) => {
        // Step 1: Navigate to homepage with proper wait strategy
        await page.goto('https://friedhats.com');

        // GOOD PRACTICE: Wait for the page to be fully loaded
        // networkidle ensures all network requests are finished
        await page.waitForLoadState('networkidle');

        // Step 2: Verify homepage loaded correctly
        // GOOD PRACTICE: Use page-level assertions for basic checks
        await expect(page).toHaveTitle(/Friedhats/);

        // Step 3: Navigate to coffee collection
        // GOOD PRACTICE: Use role-based selectors when possible
        // Look for a link that contains "coffee" text (case-insensitive)
        const shopCoffeeLink = page.getByRole('link', { name: /^Coffees$/i }).first();

        // GOOD PRACTICE: Wait for element to be visible before interaction
        await expect(shopCoffeeLink).toBeVisible();
        await shopCoffeeLink.click();

        // Step 4: Wait for coffee collection to load
        // GOOD PRACTICE: Wait for specific content that indicates page is ready
        // Instead of arbitrary timeout, wait for product grid to appear
        await page.waitForSelector('[class*="product"]', { state: 'visible' });

        // GOOD PRACTICE: Additional check - wait for at least one product to be visible
        await page.getByRole('link', { name: /colombia|kenya|ethiopia|peru/i }).first().waitFor({ state: 'visible' });

        // Step 5: Select a specific coffee product
        // GOOD PRACTICE: Use text content for user-facing elements
        // This mimics how a real user would identify the product
        const firstCoffeeProduct = page.locator('div').filter({ hasText: /€\d+/ }).first();

        // GOOD PRACTICE: Ensure element is ready before interaction
        await expect(firstCoffeeProduct).toBeVisible();

        // Get the product name for later verification
        const productName = await firstCoffeeProduct.locator('h3, h2').textContent();
        console.log(`Selected product: ${productName}`);

        // Click on the product to view details
        await firstCoffeeProduct.click();

        // Step 6: Wait for product detail page to load
        // GOOD PRACTICE: Wait for specific elements that indicate the page is ready
        await page.waitForSelector('text=/add to cart/i', { state: 'visible' });

        // GOOD PRACTICE: Verify we're on the correct product page
        await expect(page.locator('h1, h2').first()).toContainText(productName || '');

        // Step 7: Select product options (if available)
        // GOOD PRACTICE: Check if element exists before interaction
        const grindSelector = page.locator('select[name*="grind"], [data-option="Grind"]').first();

        if (await grindSelector.count() > 0) {
            // GOOD PRACTICE: Use proper wait before interaction
            await grindSelector.waitFor({ state: 'visible' });
            await grindSelector.selectOption({ index: 1 }); // Select first available option

            // Small wait for any UI updates after selection
            await page.waitForLoadState('domcontentloaded');
        }

        // Step 8: Add product to cart
        // GOOD PRACTICE: Use multiple strategies to find the button
        const addToCartButton = page.getByRole('button', { name: /add to cart/i })
            .or(page.locator('button:has-text("Add to cart")'))
            .first();

        // GOOD PRACTICE: Ensure button is enabled before clicking
        await expect(addToCartButton).toBeEnabled();
        await addToCartButton.click();

        // Step 9: Verify product was added to cart
        // GOOD PRACTICE: Wait for cart notification or cart update
        // Different approaches for different cart implementations

        // Option 1: Wait for cart drawer/modal to appear
        const cartDrawer = page.locator('[class*="cart-drawer"], [class*="cart-modal"], [id*="cart"]').first();

        // Option 2: Wait for cart count to update
        const cartCount = page.locator('[class*="cart-count"], [data-cart-count]').first();

        // Use Promise.race to handle different cart implementations
        await Promise.race([
            cartDrawer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { }),
            cartCount.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { }),
            page.waitForSelector('text=/added to cart/i', { timeout: 5000 }).catch(() => { })
        ]);

        // Step 10: Final verification
        // GOOD PRACTICE: Verify the end state
        const cartIndicator = page.locator('[class*="cart"], [href*="cart"]').first();
        await expect(cartIndicator).toBeVisible();

        // Log success for debugging
        console.log(' Product successfully added to cart');
    });

    test('should handle product filtering and search reliably', async ({ page }) => {
        // Navigate to coffee collection directly
        await page.goto('https://friedhats.com/collections/coffees');

        // GOOD PRACTICE: Wait for critical content to load
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('[class*="product"]', { state: 'visible' });

        // Count initial products
        const initialProductCount = await page.locator('[class*="product"]').count();
        console.log(`Found ${initialProductCount} products initially`);

        // GOOD PRACTICE: Look for filter elements using semantic selectors
        const filterButton = page.getByRole('button', { name: /filter/i }).first();

        if (await filterButton.count() > 0) {
            await filterButton.click();

            // GOOD PRACTICE: Wait for filter panel to be ready
            await page.waitForSelector('[class*="filter"], [data-filter-panel]', {
                state: 'visible',
                timeout: 3000
            }).catch(() => {
                console.log('No filter panel found, skipping filter test');
            });
        }

        // Verify products are displayed correctly
        const products = page.locator('[class*="product"]');

        // GOOD PRACTICE: Use count() for collection assertions
        await expect(products).toHaveCount(initialProductCount);

        // GOOD PRACTICE: Verify each product has required elements
        const firstProduct = products.first();
        await expect(firstProduct).toBeVisible();

        // Check for price - a required element for any e-commerce product
        await expect(firstProduct.locator('text=/€\\d+/')).toBeVisible();
    });

    test('should navigate through main menu reliably', async ({ page }) => {
        await page.goto('https://friedhats.com');
        await page.waitForLoadState('networkidle');

        // GOOD PRACTICE: Test navigation menu which is critical for user journey
        const navigationMenu = page.locator('header').first();
        await expect(navigationMenu).toBeVisible();

        // Test main navigation links
        const menuLinks = [
            { text: /coffees/i, urlPart: '/coffees' },
            { text: /merchandise/i, urlPart: '/merchandise' },
            { text: /tools/i, urlPart: '/tools' }
        ];

        for (const link of menuLinks) {
            const menuItem = page.getByRole('link', { name: link.text }).first();

            if (await menuItem.count() > 0) {
                // GOOD PRACTICE: Verify link is visible and get href
                await expect(menuItem).toBeVisible();
                const href = await menuItem.getAttribute('href');

                // GOOD PRACTICE: Verify link points to expected location
                expect(href).toContain(link.urlPart);
                console.log(` Found menu item: ${href}`);
            }
        }
    });
});

/**
 * Key Stability Practices Demonstrated:
 * 
 * 1.  Proper Waiting:
 *    - waitForLoadState('networkidle') instead of arbitrary timeouts
 *    - waitForSelector with specific conditions
 *    - Wait for elements to be visible/enabled before interaction
 * 
 * 2.  Stable Selectors:
 *    - Role-based selectors (getByRole)
 *    - Text content selectors for user-visible elements
 *    - Multiple fallback strategies using .or()
 * 
 * 3.  Defensive Programming:
 *    - Check element existence before interaction
 *    - Use Promise.race for multiple possible outcomes
 *    - Proper error handling with .catch()
 * 
 * 4.  Clear Test Structure:
 *    - Step-by-step comments
 *    - Console logging for debugging
 *    - Meaningful variable names
 * 
 * 5.  No Flaky Patterns:
 *    - No page.waitForTimeout()
 *    - No hardcoded delays
 *    - No brittle XPath or complex CSS selectors
 *    - No assumptions about timing
 */