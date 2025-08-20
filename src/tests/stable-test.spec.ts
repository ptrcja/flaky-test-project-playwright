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

/**
 * TODO #3: Implement 'should always pass - navigation' test
 * 
 * Test steps:
 * 1. Navigate to the base URL ('/') 
 * 2. Assert that the page title contains 'Playwright'
 * 3. Verify that the nav element is visible
 * 
 * Best practices:
 * - Use page.goto() with the relative path
 * - Use expect(page).toHaveTitle() with regex for flexible matching
 * - Use page.locator('nav') for element selection
 * 
 * Why this is stable:
 * - No random conditions
 * - Clear, deterministic assertions
 * - Proper wait for elements
 */

/**
 * TODO #4: Implement 'should always pass - element check' test
 * 
 * Test steps:
 * 1. Navigate to the base URL
 * 2. Wait for page to be fully loaded using waitForLoadState('networkidle')
 * 3. Find the 'Get started' link using getByRole()
 * 4. Assert that it's visible AND enabled
 * 
 * Key concepts:
 * - waitForLoadState ensures page is ready
 * - getByRole is more stable than CSS selectors
 * - Multiple assertions increase confidence
 * 
 * Why use getByRole?
 * - More accessible
 * - Less likely to break with UI changes
 * - Follows testing best practices
 */

/**
 * TODO #5: Implement 'should always pass - multiple assertions' test
 * 
 * Test steps:
 * 1. Navigate to '/docs/intro'
 * 2. Assert URL contains 'docs' using toHaveURL() with regex
 * 3. Assert h1 element contains 'Installation'
 * 4. Assert navbar is visible
 * 
 * Learning points:
 * - Chain multiple related assertions
 * - Use different types of assertions
 * - Test different aspects of the page
 * 
 * Tip: Use page.locator('h1') and page.locator('.navbar')
 */

/**
 * Reflection Questions for Learning:
 * 
 * 1. What makes these tests stable?
 *    - No random/time-dependent logic
 *    - Proper waiting strategies
 *    - Clear, specific assertions
 * 
 * 2. How do these tests differ from flaky tests?
 *    - Consistent behavior across runs
 *    - No race conditions
 *    - No external dependencies
 * 
 * 3. Best practices demonstrated:
 *    - Use semantic locators (getByRole, getByText)
 *    - Wait for specific conditions, not fixed timeouts
 *    - Test user-visible behavior
 * 
 * Testing Tip: Run these tests 10 times locally to verify stability:
 * npx playwright test stable-test.spec.ts --repeat-each=10
 */