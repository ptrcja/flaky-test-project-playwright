/**
 * CTRF Parser Module
 *
 * Parses CTRF (Common Test Report Format) JSON files and extracts
 * test information for flaky detection analysis.
 *
 * @see https://github.com/ctrf-io/ctrf
 */

export interface CTRFReport {
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

export interface CTRFTest {
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

export class CTRFParser {
  /**
   * Parse a JSON string into a CTRFReport object
   *
   * @param jsonContent - Raw JSON string from CTRF reporter
   * @returns Parsed CTRFReport object
   */
  static parseReport(jsonContent: string): CTRFReport {
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
   * Extract all test results from a CTRF report
   *
   * @param report - Parsed CTRF report
   * @returns Array of CTRFTest objects
   */
  static extractTests(report: CTRFReport): CTRFTest[] {
    return report.results.tests || [];
  }

  /**
   * Generate a unique identifier for a test
   *
   * @param test - Single test result
   * @returns Unique string identifier in format "filePath::suite::testName"
   */
  static getTestId(test: CTRFTest): string {
    const suite = test.suite || 'default';
    const file = test.filePath || 'unknown';
    return `${file}::${suite}::${test.name}`;
  }

  /**
   * Group test results by their unique identifier
   *
   * @param tests - Array of all test results from multiple runs
   * @returns Map where key is test ID and value is array of test results
   */
  static groupTestsByIdentifier(tests: CTRFTest[]): Map<string, CTRFTest[]> {
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
   * Calculate statistical metrics for a group of test runs
   *
   * @param tests - Array of test results for the same test across multiple runs
   * @returns Calculated statistics
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
