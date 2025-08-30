/**
 * Flaky Test Suite
 * 
 * This file contains tests that intentionally exhibit flaky behavior.
 * These tests help us validate our flaky detection algorithm.
 * 
 * Learning Goals:
 * - Understand common causes of test flakiness
 * - Learn to identify flaky patterns
 * - Practice debugging intermittent failures
 */

import { test, expect } from '@playwright/test';

/**
 * TODO #1: Create a test describe block called 'Potentially Flaky Tests'
 */

// TODO: Add describe block here
test.describe('Potentially Flaky Tests', () => {

/**
 * TODO #2: Add beforeEach hook for CTRF metadata
 * 
 * Similar to stable tests, but use:
 * description: 'potentially-flaky'
 */
test.beforeEach(async ({ }, testInfo) => {
  testInfo.annotations.push({
    type: 'category',
    description: 'potentially-flaky',
  });
});

/**
 * TODO #3: Implement 'flaky test - random failure' test
 * 
 * Purpose: Simulate random test failures (30% failure rate)
 * 
 * Implementation steps:
 * 1. Navigate to base URL
 * 2. Generate a random number using Math.random()
 * 3. Add the random value to testInfo.attachments for debugging:
 *    testInfo.attachments.push({
 *      name: 'random-value',
 *      body: Buffer.from(`Random value: ${random}`),
 *      contentType: 'text/plain'
 *    })
 * 4. If random < 0.3, throw an error with the random value
 * 5. Otherwise, assert page title contains 'Playwright'
 * 
 * Learning: This simulates non-deterministic test behavior
 * Real-world causes: Race conditions, test order dependencies
 */
test('flaky test - random failure', async ({ page }, testInfo) => {
  await page.goto('/');

  const random = Math.random();

  testInfo.attachments.push({
    name: 'random-value',
    body: Buffer.from(`Random value: ${random}`),
    contentType: 'text/plain'
  });

  if (random < 0.3) {
    throw new Error(`Random failure occurred: (value ${random.toFixed(3)})`);
  }

  await expect(page).toHaveTitle(/Friedhats/);
});

/**
 * TODO #4: Implement 'flaky test - timing dependent' test
 * 
 * Purpose: Simulate timing-related flakiness
 * 
 * Implementation:
 * 1. Navigate to base URL
 * 2. Generate random delay: Math.random() * 3000
 * 3. If delay < 1000ms:
 *    - Try to assert element is visible with very short timeout (100ms)
 *    - This will likely fail (element not ready)
 * 4. Else:
 *    - Wait for the delay using page.waitForTimeout()
 *    - Then assert element is visible (should pass)
 * 
 * Use: page.locator('.hero__title') for the element
 * 
 * Real-world lesson: Fixed timeouts are unreliable
 * Better approach: Use proper wait conditions
 */
test('flaky test - timing dependent', async ({ page }) => {
  await page.goto('/');

  if (Math.random() < 0.5) {
    // 50% chance: Check slower CMS image immediately (likely to fail)
    const element = page.locator('img[alt="Lex brewing V60"]');
    await expect(element).toBeVisible({ timeout: 10 }); // Extremely short timeout + slow element
  } else {
    // 50% chance: Wait first then check (should pass)
    await page.waitForTimeout(1000);
    const element = page.locator('img[alt="Lex brewing V60"]');
    await expect(element).toBeVisible();
  }
});
/**
 * TODO #5: Implement 'flaky test - network dependent' test
 * 
 * Purpose: Simulate network-related flakiness
 * 
 * Implementation:
 * 1. Use Math.random() to decide (25% chance) to simulate network issues
 * 2. If simulating issues:
 *    - Use context.route() to intercept all requests
 *    - Add 35-second delay (exceeds 30-second timeout)
 *    - This causes test timeout
 * 3. Navigate to page with 30-second timeout
 * 4. Assert h1 element is visible
 * 
 * 
 * Real-world causes: Slow APIs, network latency, service outages
 */
test('flaky test - network dependent', async ({ page, context }) => {
    // Simulate network issues randomly
    if (Math.random() < 0.25) {
      // 25% chance of network timeout
      await context.route('**/*', route => {
        setTimeout(() => route.continue(), 35000); // Exceed timeout
      });
    }
    
    await page.goto('/', { timeout: 30000 });
    await expect(page.locator('body')).toBeVisible();
  });


/**
 * TODO #6: Implement 'flaky test - race condition' test
 * 
 * Purpose: Simulate race conditions between async operations
 * 
 * Implementation:
 * 1. Navigate to base URL
 * 2. Create two promises that wait for different elements:
 *    - waitForSelector('.hero__title', { timeout: 5000 })
 *    - waitForSelector('.hero__subtitle', { timeout: 5000 })
 * 3. Randomly choose resolution strategy:
 *    - If Math.random() < 0.4: Use Promise.race()
 *    - Else: Use Promise.all()
 * 4. Assert hero title contains 'Playwright'
 * 
 * Why this is flaky:
 * - Promise.race() might resolve before both elements ready
 * - Creates unpredictable test behavior
 * 
 * Real-world lesson: Always wait for all required elements
 */
test('flaky test - race condition', async ({ page }) => { 
  await page.goto('/'); 

  const promises = [ 
    page.waitForSelector('.swiper-slide.hero-slide', { timeout: 3000 }),
    page.waitForSelector('img[alt="Lex brewing V60"]', { timeout: 3000 }), 
  ];

  await Promise.race(promises); 

  if (Math.random() < 0.5) {
    // 50% chance: Assert hero slider loaded (might fail if Lex image won the race)
    await expect(page.locator('.swiper-slide.hero-slide')).toBeVisible({ timeout: 1 });
  } else {
    // 50% chance: Assert Lex image loaded (might fail if hero slider won the race)
    await expect(page.locator('img[alt="Lex brewing V60"]')).toBeVisible({ timeout: 1 });
  }

}); 
});
/**
 * Analysis Questions for Learning:
 * 
 * 1. Identify the flaky patterns:
 *    - Random failures (non-deterministic)
 *    - Timing dependencies (race conditions)
 *    - Network dependencies (external factors)
 *    - Async race conditions (improper waiting)
 * 
 * 2. How to fix these in real tests:
 *    - Remove random logic
 *    - Use proper wait conditions instead of timeouts
 *    - Mock network calls for consistency
 *    - Wait for all required elements
 * 
 * 3. Detection strategy:
 *    - Run multiple times to identify inconsistent results
 *    - Look for tests that pass/fail without code changes
 *    - Monitor failure rate between 10-90%
 * 
 * Testing Exercise:
 * Run this test file 10 times and observe the results:
 * for i in {1..10}; do npx playwright test flaky-test.spec.ts; done
 * 
 * Expected: Different results each run (that's the point!)
 */
