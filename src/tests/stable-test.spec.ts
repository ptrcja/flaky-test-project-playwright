/**
 * Stable Test Suite
 * 
 * This file contains tests that should ALWAYS pass.
 * These tests help validate that our flaky detection is accurate.
 * 
 * Learning Goals:
 * - Understand what makes a test stable
 * - Learn Playwright best practices
 * - Practice writing reliable assertions
 */

import { test, expect } from '@playwright/test';

/**
 * TODO #1: Create a test describe block called 'Stable Tests'
 * 
 * Use test.describe() to group related tests
 * This helps with organization and reporting
 */

// TODO: Add describe block here
/**
 * Inside the describe block, implement these tests:
 */

/**
 * TODO #2: Add a beforeEach hook
 * 
 * Purpose: Add metadata for CTRF reporting
 * 
 * Implementation:
 * 1. Use test.beforeEach(async ({ }, testInfo) => { ... })
 * 2. Add annotation to testInfo: 
 *    testInfo.annotations.push({ type: 'category', description: 'stable' })
 * 
 * Why? This metadata helps CTRF categorize tests in reports
 */
test.describe('Stable Tests', () => {
// Add metadata for CTRF
test.beforeEach
(async ({ }, testInfo) => {
  testInfo.annotations.push({
    type: 'category',
    description: 'stable',
  });
});

/**
 * TODO #3: Implement 'should always pass - navigation' test
 * 
 * Test steps:
 * 1. Navigate to the base URL ('/') 
 * 2. Assert that the page title contains 'Friedhats'
 * 3. Verify that the body element is visible 
 * 
 * Best practices:
 - Use regex for flexible title matching (/Friedhats/)                                                                                                   │ │
 - Test fundamental page elements (body) that are guaranteed to exist                                                                                    │ │
 - Avoid complex selectors that might change 
 * 
 * Why this is stable:
  - Tests basic page loading functionality                                                                                                                │ │
  - Uses reliable, unchanging elements (body)                                                                                                             │ │
  - No complex interactions or timing dependencies 
 */
test('should always pass - navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Friedhats/);
  await expect(page.locator('body')).toBeVisible();
});


/**
 * TODO #4: Implement 'should always pass - element check' test
 * 
 * Test steps:
 * 1. Navigate to the base URL
 * 2. Wait for page to be fully loaded using waitForLoadState('networkidle')
 * 3. Find "View All Coffees" button using specific CSS classes                                                                                            │ │
│* 4. Click the button to test navigation functionality                                                                                                    │ │
│* 5. Verify successful navigation by checking for "Coffees" heading   
 * 
 * Key concepts:
 * - Key learnings from FriedHats implementation:                                                                                                            │ │
│* - CSS class selectors can be very specific and reliable                                                                                                 │ │
 * - Tailwind CSS classes (px-[15px], py-[20px]) need escaping in selectors                                                                                │ │
 * - Combining class + text selectors (:has-text) solves ambiguity issues                                                                                  │ │
 * - Real e-commerce sites have complex but predictable element structures  
 *
 * Why this approach works:                                                                                                                                │ │
* - Uses exact classes from browser inspection                                                                                                            │ │
* - Tests actual user workflow (click → navigate → verify)                                                                                                │ │
* - Combines multiple verification methods for reliability
 */
test('should always pass - element check', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Target the "View All Coffees" div using its specific class
  const viewAllCoffeesLink = page.locator('.bg-offwhite.px-\\[15px\\].py-\\[20px\\].text-center.font-display.text-xl.uppercase');
  
  await expect(viewAllCoffeesLink).toBeVisible();
  await viewAllCoffeesLink.click();
  
  // Verify navigation by checking for "Coffees" specifically (combine class + text)
  await expect(page.locator('.mr-4.hidden.font-display.text-xl.uppercase.md\\:inline:has-text("Coffees")')).toBeVisible();
});

/**
 * TODO #5: Implement 'should always pass - multiple assertions' test
 * 
 * Test steps:
 * 1. Navigate to FriedHats homepage ('/')                                                                                                                │ │
 * 2. Assert exact URL matches 'https://friedhats.com/'                                                                                                   │ │
 * 3. Assert html element is visible (document root)                                                                                                      │ │
 * 4. Assert body element is visible (page content container)    
 * 
 * Learning points for stable testing:                                                                                                                    │ │
 * - Use exact URL matching for precise verification                                                                                                      │ │
 * - Test fundamental DOM elements that always exist                                                                                                      │ │
 * - Multiple simple assertions are better than complex ones                                                                                              │ │
 * - Focus on elements guaranteed to be present 
 * 
 * Why these assertions are reliable:                                                                                                                     │ │
│* - HTML and body elements exist on every valid web page                                                                                                 │ │
 * - URL verification ensures correct navigation                                                                                                          │ │
 * - No dependency on changing UI elements or content 
 */
test('should always pass - multiple assertions', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('https://friedhats.com/');
  await expect(page.locator('html')).toBeVisible();
  await expect(page.locator('body')).toBeVisible();
});
});
/**
 * Key Learnings from FriedHats.com Testing:
 * 
 * 1. What makes these tests stable for e-commerce sites?
 *    - Test fundamental page elements (html, body, title)
 *    - Use exact CSS classes found through browser inspection
 *    - Verify core business functionality (product navigation)
 *    - No random conditions or timing dependencies
 * 
 * 2. How these stable tests differ from flaky tests?
 *    - Consistent results across multiple runs
 *    - Use reliable, unchanging DOM elements
 *    - Proper waiting strategies (networkidle)
 *    - Combine multiple verification methods for accuracy
 * 
 * 3. Real-world e-commerce testing practices demonstrated:
 *    - CSS class targeting for complex Tailwind designs
 *    - Escape special characters in selectors (\\[15px\\])
 *    - Combine class + text selectors to avoid ambiguity
 *    - Test actual user workflows (click → navigate → verify)
 * 
 * 4. Selector strategies that work:
 *    - Exact class matching: .bg-offwhite.px-\\[15px\\]
 *    - Text + class combination: :has-text("Coffees")
 *    - Fundamental elements: html, body, title
 * 
 * Testing Tip: These tests should pass consistently when run:
 * npx playwright test stable-test.spec.ts --repeat-each=10
 */

