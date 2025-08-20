import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests',
  
  // Run tests in parallel for efficiency
  fullyParallel: true,
  
  // Fail the build on CI if test.only is left in
  forbidOnly: !!process.env.CI,
  
  // No retries during flaky detection - we want raw pass/fail data
  retries: 0,
  
  // More workers = faster execution
  workers: process.env.CI ? 2 : 4,
  
  // Timeout for each test
  timeout: 30000,
  
  // Global test timeout
  globalTimeout: 600000,
  
  // Reporter configuration with CTRF
  reporter: [
    ['list'], // Console output for visibility
    [
      'playwright-ctrf-json-reporter',
      {
        outputFile: 'reports/ctrf/ctrf-report.json',
        // CTRF specific options
        minimal: false, // Full details for analysis
        testType: 'e2e', // Categorize as end-to-end tests
        // Custom fields for flaky detection
        customFields: {
          project: 'flaky-detector',
          environment: process.env.CI ? 'ci' : 'local',
          runId: process.env.RUN_ID || Date.now().toString()
        }
      }
    ],
    ['html', { outputFolder: 'reports/html', open: 'never' }]
  ],

  use: {
    // Base URL for testing
    baseURL: 'https://playwright.dev',
    
    // Collect trace on failure for debugging
    trace: 'retain-on-failure',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Add custom test id attribute for flaky detection
        testIdAttribute: 'data-testid'
      },
    },
  ],

  // Store test results
  outputDir: './test-results',
});