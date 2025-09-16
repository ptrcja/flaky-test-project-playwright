/**
 * CTRF Parser Module
 * 
 * This module is responsible for parsing CTRF (Common Test Report Format) JSON files
 * and extracting test information for flaky detection analysis.
 * 
 * CTRF is an industry-standard format that provides rich metadata about test executions.
 * Learn more: https://github.com/ctrf-io/ctrf
 */

// No external imports needed - this is a pure TypeScript module

/**
 * TODO #1: Define the CTRFReport interface
 * 
 * This interface should match the CTRF JSON structure.
 * Required properties:
 * - results: object containing:
 *   - tool: object with name (string) and optional version (string)
 *   - summary: object with test counts (tests, passed, failed, skipped, pending, other)
 *   - tests: array of CTRFTest objects
 *   - environment: optional object with key-value pairs
 * 
 * Tip: Use the CTRF documentation to understand the complete structure
 */
export interface CTRFReport {
  // TODO: Implement the interface structure
  // Hint: The results property is the main container
  results: {
    tool: {
      name: string;
      version?: string;
};
summary: {
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  other: number;
  start: number;
  stop: number;
};
tests: CTRFTest[];
environment?: {
  [key: string]: string;
};
};
}


/**
 * TODO #2: Define the CTRFTest interface
 * 
 * This represents a single test result in CTRF format.
 * Required properties:
 * - name: string (test name)
 * - status: 'passed' | 'failed' | 'skipped' | 'pending' | 'other'
 * - duration: number (milliseconds)
 * 
 * Optional properties:
 * - start, stop: timestamps
 * - suite: test suite name
 * - filePath: test file location
 * - message: error message for failures
 * - trace: stack trace
 * - tags: array of strings
 * - customFields: object for custom data (important for tracking run numbers)
 * 
 * Design Decision: We use customFields to store run-specific data for flaky detection
 */
export interface CTRFTest {
  // TODO: Implement the interface structure
  // Remember to use union types for status
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending' | 'other';
  duration: number;
  start?: number;
  stop?: number;
  suite?: string;
  filePath?: string;
  message?: string;
  trace?: string;
  tags?: string[];
  type?: string;
  retries?: number; 
  flaky?: boolean; 
  customFields?: {
    [key: string]: any;
  };
}

/**
 * TODO #3: Create the CTRFParser class
 * 
 * This class provides static methods for parsing and analyzing CTRF reports.
 * All methods should be static since we don't need to maintain state.
 */
export class CTRFParser {
  /**
   * TODO #4: Implement parseReport method
   * 
   * Purpose: Parse a JSON string into a CTRFReport object
   * 
   * 
   * @param jsonContent - Raw JSON string from CTRF reporter
   * @returns Parsed CTRFReport object
   * 
   * Implementation steps:
   * 1. Use JSON.parse() with try-catch for error handling
   * 2. Validate that the parsed object has required structure
   * 3. Throw descriptive error if parsing fails or structure is invalid
   * 
   * Error handling tip: Include the original error message in your throw
   */
  static parseReport(jsonContent: string): CTRFReport {
    // TODO: Implement JSON parsing with validation
    // Hint: Check for report.results and report.results.tests existence
    try {
      const report = JSON.parse(jsonContent) as CTRFReport;
      if (!report.results || !report.results.tests) {
    throw new Error('Invalid CTRF format: missing results or tests');
  }
  return report;
    } catch (error) {
      throw new Error(`Failed to parse CTRF report: ${error}`);
    }
  }

  /**
   * TODO #5: Implement extractTests method
   * 
   * Purpose: Extract all test results from a CTRF report
   * 
   * @param report - Parsed CTRF report
   * @returns Array of CTRFTest objects
   * 
   * Implementation: Simply return the tests array from the report
   * Edge case: Return empty array if tests is undefined
   */
  static extractTests(report: CTRFReport): CTRFTest[] {
    // TODO: Extract and return tests array
    // Hint: Use the || operator for default empty array
    return report.results.tests || [];
  }

  /**
   * TODO #6: Implement getTestId method
   * 
   * Purpose: Generate a unique identifier for a test
   * This ID is used to group test results across multiple runs
   * 
   * @param test - Single test result
   * @returns Unique string identifier
   * 
   * Format: "filePath::suite::testName"
   * 
   * Implementation steps:
   * 1. Extract suite (default to 'default' if not present)
   * 2. Extract filePath (default to 'unknown' if not present)
   * 3. Combine with test name using :: separator
   * 
   * Why this format? It ensures uniqueness and is human-readable in reports
   */
  static getTestId(test: CTRFTest): string {
    // TODO: Create unique identifier
    // Hint: Use template literals for clean string concatenation 
    const suite = test.suite || 'default';
    const file = test.filePath || 'unknown';
    return `${file}::${suite}::${test.name}`;
  } 

  /**
   * TODO #7: Implement groupTestsByIdentifier method
   * 
   * Purpose: Group test results by their unique identifier
   * This is crucial for analyzing the same test across multiple runs
   * 
   * @param tests - Array of all test results from multiple runs
   * @returns Map where key is test ID and value is array of test results
   * 
   * Implementation steps:
   * 1. Create a new Map<string, CTRFTest[]>
   * 2. Iterate through all tests
   * 3. For each test, get its ID using getTestId
   * 4. Add test to the appropriate group in the Map
   * 
   * Data structure tip: Use Map.has() and Map.get() for efficient grouping
   */
  static groupTestsByIdentifier(tests: CTRFTest[]): Map<string, CTRFTest[]> {
    // TODO: Implement grouping logic
    // Hint: Initialize empty array for new test IDs
    const groupedTests = new Map<string, CTRFTest[]>();
    for (const test of tests) {
      const testId = this.getTestId(test);
      if (!groupedTests.has(testId)) {
        groupedTests.set(testId, []);
      }
      groupedTests.get(testId)!.push(test);
    }
    return groupedTests;
  }

  /**
   * TODO #8: Implement calculateStatistics method
   * 
   * Purpose: Calculate statistical metrics for a group of test runs
   * These statistics help identify flaky behavior patterns
   * 
   * @param tests - Array of test results for the same test across multiple runs
   * @returns Object with calculated statistics
   * 
   * Statistics to calculate:
   * - totalRuns: Total number of test executions
   * - passed: Count of passed tests
   * - failed: Count of failed tests
   * - skipped: Count of skipped tests
   * - averageDuration: Mean execution time (exclude 0 values)
   * - minDuration: Minimum execution time
   * - maxDuration: Maximum execution time
   * - failureMessages: Array of unique failure messages
   * 
   * Implementation tips:
   * - Use array filter() for counting by status
   * - Filter out 0 durations before calculating statistics
   * - Use Math.min/max with spread operator for duration stats
   * - Extract failure messages only from failed tests with messages
   */
  static calculateStatistics(tests: CTRFTest[]): {
    totalRuns: number;
    passed: number;
    failed: number;
    skipped: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    failureMessages: string[];
  } {
    // TODO: Calculate all statistics
    // Hint: Start by filtering durations > 0
    const durations = tests.map(t => t.duration).filter(d => d > 0); 
    return {
      totalRuns: tests.length,
      passed: tests.filter(t => t.status === 'passed').length,
      failed: tests.filter(t => t.status === 'failed').length,
      skipped: tests.filter(t => t.status === 'skipped').length,
      averageDuration: durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      failureMessages: tests
      .filter(t => t.status === 'failed' && t.message)
      .map(t => t.message!)
    
    };
  }
}

/**
 * Learning Notes :
 * 
 * 1. Why static methods?
 *    - We don't need to maintain state between method calls
 *    - Makes the code more functional and testable
 *    - Easier to use - no need to instantiate
 * 
 * 2. Why TypeScript interfaces?
 *    - Provides type safety and IntelliSense
 *    - Documents the expected data structure
 *    - Catches errors at compile time
 * 
 * 3. CTRF Benefits:
 *    - Standardized format works across test frameworks
 *    - Rich metadata for analysis
 *    - Extensible with custom fields
 * 
 * 4. Map vs Object for grouping:
 *    - Map preserves insertion order
 *    - Better performance for frequent additions/deletions
 *    - Cleaner API with has(), get(), set()
 * 
 * Test this module by:
 * 1. Creating a sample CTRF JSON file
 * 2. Writing unit tests for each method
 * 3. Validating with real Playwright test output
 */