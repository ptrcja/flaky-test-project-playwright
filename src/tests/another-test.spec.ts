/**
 * Mixed Behavior Test Suite
 * 
 * This file contains tests with different failure patterns.
 * It helps us distinguish between consistently failing tests and flaky tests.
 * 
 * Learning Goals:
 * - Understand the difference between broken and flaky tests
 * - Learn to categorize test failures
 * - Practice identifying root causes
 */

import { test, expect } from '@playwright/test';

/**
 * TODO #1: Create a test describe block called 'Mixed Behavior Tests'
 */

// TODO: Add describe block here

/**
 * TODO #2: Implement 'consistently failing test'
 * 
 * Purpose: Demonstrate a test that ALWAYS fails (not flaky, just broken)
 * 
 * Implementation:
 * 1. Navigate to base URL
 * 2. Try to find an element that doesn't exist:
 *    await expect(page.locator('.non-existent-element')).toBeVisible({
 *      timeout: 1000
 *    });
 * 
 * Expected behavior: Fails 100% of the time
 * 
 * Learning point:
 * - This is NOT a flaky test (100% failure rate)
 * - It's a broken test that needs fixing
 * - Our detector should identify this as "consistently failing"
 * 
 * Real-world causes:
 * - Element removed from UI
 * - Selector typo
 * - Feature not implemented yet
 */

/**
 * TODO #3: Implement 'data-driven flaky test'
 * 
 * Purpose: Test that fails based on current time (deterministic but time-dependent)
 * 
 * Implementation:
 * 1. Navigate to base URL
 * 2. Get current second: new Date().getSeconds()
 * 3. If currentSecond is divisible by 3:
 *    - Throw error with the second value
 * 4. Otherwise, assert page title contains 'Playwright'
 * 
 * Code:
 * const currentSecond = new Date().getSeconds();
 * if (currentSecond % 3 === 0) {
 *   throw new Error(`Time-based failure at second: ${currentSecond}`);
 * }
 * 
 * Why this pattern exists in real tests:
 * - Tests dependent on current date/time
 * - Tests that fail at specific times (timezone issues)
 * - Tests affected by daylight saving time
 * 
 * Fix in real world:
 * - Mock date/time
 * - Use fixed test data
 * - Make tests time-independent
 */

/**
 * TODO #4: (Optional) Implement 'intermittent timeout test'
 * 
 * Purpose: Test that sometimes exceeds timeout
 * 
 * Implementation:
 * 1. Navigate to base URL
 * 2. Generate random wait: Math.random() * 2000
 * 3. Wait for that duration
 * 4. Try to find an element with short timeout (500ms)
 * 5. If wait was > 1000ms, test likely times out
 * 
 * This simulates:
 * - Slow page loads
 * - Heavy JavaScript execution
 * - Resource loading delays
 */

/**
 * Classification Guide:
 * 
 * Test Categories:
 * 1. Stable (0% failure rate)
 *    - Passes every time
 *    - Well-written, deterministic
 * 
 * 2. Flaky (10-90% failure rate)
 *    - Intermittent failures
 *    - Needs investigation and fixing
 * 
 * 3. Consistently Failing (>90% failure rate)
 *    - Broken functionality
 *    - Clear fix needed
 * 
 * 4. Unstable (1-10% failure rate)
 *    - Mostly stable with rare failures
 *    - May indicate edge cases
 * 
 * Detection Strategy:
 * - Run tests multiple times
 * - Calculate failure rate
 * - Analyze failure patterns
 * - Check duration variance
 * 
 * Action Items by Category:
 * - Stable: No action needed
 * - Flaky: Investigate and fix root cause
 * - Failing: Fix the test or implementation
 * - Unstable: Monitor and investigate if worsens
 * 
 * Exercise:
 * After implementing, run all three test files together:
 * npx playwright test
 * 
 * Observe how CTRF reporter captures all the metadata!
 */