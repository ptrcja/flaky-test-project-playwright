/**
 * Flaky Detector Engine
 *
 * Core module that runs tests multiple times and analyzes results
 * to identify flaky tests using statistical methods.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { CTRFParser, CTRFReport, CTRFTest } from './ctrf-parser';

export interface TestStatistics {
  testId: string;
  name: string;
  suite: string;
  file: string;
  totalRuns: number;
  passed: number;
  failed: number;
  skipped: number;
  failureRate: number;
  successRate: number;
  isFlaky: boolean;
  averageDuration: number;
  durationVariance: number;
  failureMessages: string[];
  tags: string[];
  confidence: number;
}

export interface FlakyDetectionConfig {
  minRuns: number;
  flakyThresholdMin: number;
  flakyThresholdMax: number;
  durationVarianceThreshold: number;
}

export class FlakyDetector {
  private allTestRuns: CTRFTest[] = [];
  private config: FlakyDetectionConfig;

  constructor(config?: Partial<FlakyDetectionConfig>) {
    this.config = {
      minRuns: 10,
      flakyThresholdMin: 0.1,
      flakyThresholdMax: 0.9,
      durationVarianceThreshold: 0.5,
      ...config
    };
  }

  /**
   * Run tests multiple times and analyze results
   *
   * @param numberOfRuns - How many times to run tests
   * @returns Analysis results for all tests
   */
  async runDetection(numberOfRuns: number = 10): Promise<TestStatistics[]> {
    console.log(` Starting flaky detection with ${numberOfRuns} runs...`);
    console.log(` Configuration:`, this.config);

    this.setupDirectories();

    for (let i = 1; i <= numberOfRuns; i++) {
      console.log(`\n Test Run ${i}/${numberOfRuns}`);
      console.log(`${'='.repeat(40)}`);

      const runId = `run-${i}-${Date.now()}`;

      try {
        process.env.RUN_ID = runId;

        execSync(
          `npx playwright test --reporter=playwright-ctrf-json-reporter`,
          {
            stdio: 'inherit',
            env: { ...process.env, RUN_ID: runId }
          }
        );
      } catch (error) {
        console.log(`Run ${i} completed with test failures (this is expected)`);
      }

      this.collectRunResults(i);

      await this.sleep(1000);
    }

    return this.analyzeResults();
  }

  /**
   * Create required directory structure
   */
  private setupDirectories(): void {
    const directories = ['reports/analysis', 'reports/runs'];

    directories.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * Parse and store results from a single test run
   *
   * @param runNumber - Current run number
   */
  private collectRunResults(runNumber: number): void {
    try {
      const reportPath = path.join(process.cwd(), 'ctrf/ctrf-report.json');
      if (!fs.existsSync(reportPath)) {
        console.error(`CTRF report not found for run ${runNumber}`);
        return;
      }
      const reportContent = fs.readFileSync(reportPath, 'utf-8');
      const report = CTRFParser.parseReport(reportContent);

      const tests = CTRFParser.extractTests(report);
      tests.forEach(test => {
        test.customFields = {
          ...test.customFields,
          runNumber
        };
      });

      this.allTestRuns.push(...tests);

      const archivePath = path.join(
        process.cwd(),
        `reports/runs/run-${runNumber}.json`
      );
      fs.copyFileSync(reportPath, archivePath);

      console.log(`   Collected ${tests.length} test results from run ${runNumber}`);
      console.log(`   Passed: ${report.results.summary.passed}`);
      console.log(`   Failed: ${report.results.summary.failed}`);
      console.log(`   Skipped: ${report.results.summary.skipped}`);

    } catch (error) {
      console.error(`Error collecting results from run ${runNumber}:`, error);
    }
  }

  /**
   * Analyze all collected test runs
   *
   * @returns Test statistics sorted by flakiness
   */
  private analyzeResults(): TestStatistics[] {
    console.log(`Analyzing test results...`);

    const groupedTests = CTRFParser.groupTestsByIdentifier(this.allTestRuns);

    const statistics: TestStatistics[] = [];

    for (const [testId, tests] of groupedTests) {
      const stats = this.calculateTestStatistics(testId, tests);
      statistics.push(stats);
    }

    return statistics.sort((a, b) => {
      if (a.isFlaky && !b.isFlaky) return -1;
      if (!a.isFlaky && b.isFlaky) return 1;
      return b.failureRate - a.failureRate;
    });
  }

  /**
   * Calculate statistics for a single test across all runs
   *
   * @param testId - Unique test identifier
   * @param tests - All runs of this test
   * @returns Test statistics
   */
  private calculateTestStatistics(testId: string, tests: CTRFTest[]): TestStatistics {
    const stats = CTRFParser.calculateStatistics(tests);
    const firstTest = tests[0];

    const failureRate = stats.totalRuns > 0 ? stats.failed / stats.totalRuns : 0;
    const successRate = stats.totalRuns > 0 ? stats.passed / stats.totalRuns : 0;

    const durationVariance = this.calculateDurationVariance(tests);

    const isFlaky = this.isTestFlaky(
      stats.totalRuns,
      failureRate,
      durationVariance
    );

    const confidence = this.calculateConfidence(
      stats.totalRuns,
      failureRate,
      durationVariance
    );

    const uniqueFailures = [...new Set(stats.failureMessages)];

    return {
      testId,
      name: firstTest.name,
      suite: firstTest.suite || 'default',
      file: firstTest.filePath || 'unknown',
      totalRuns: stats.totalRuns,
      passed: stats.passed,
      failed: stats.failed,
      skipped: stats.skipped,
      failureRate,
      successRate,
      isFlaky,
      averageDuration: stats.averageDuration,
      durationVariance,
      failureMessages: uniqueFailures,
      tags: firstTest.tags || [],
      confidence
    };
  }

  /**
   * Calculate coefficient of variation for test duration
   *
   * @param tests - Test runs to analyze
   * @returns Coefficient of variation
   */
  private calculateDurationVariance(tests: CTRFTest[]): number {
    const durations = tests.map(t => t.duration).filter(d => d > 0);

    if (durations.length < 2) return 0;

    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.reduce((sum, duration) => {
      return sum + Math.pow(duration - avg, 2);
    }, 0) / durations.length;

    return avg > 0 ? Math.sqrt(variance) / avg : 0;
  }

  /**
   * Determine if a test is flaky based on metrics
   *
   * @param totalRuns - Number of test executions
   * @param failureRate - Percentage of failures
   * @param durationVariance - Timing variance
   * @returns Whether test is flaky
   */
  private isTestFlaky(
    totalRuns: number,
    failureRate: number,
    durationVariance: number
  ): boolean {
    if (totalRuns < this.config.minRuns) {
      return false;
    }

    const failureRateFlaky =
      failureRate > this.config.flakyThresholdMin &&
      failureRate < this.config.flakyThresholdMax;

    const timingFlaky = durationVariance > this.config.durationVarianceThreshold;

    return failureRateFlaky || timingFlaky;
  }

  /**
   * Calculate confidence score for flaky detection
   *
   * @param totalRuns - Number of test executions
   * @param failureRate - Percentage of failures
   * @param durationVariance - Timing variance
   * @returns Confidence score (0-1)
   */
  private calculateConfidence(
    totalRuns: number,
    failureRate: number,
    durationVariance: number
  ): number {
    let confidence = 0;

    const runConfidence = Math.min(totalRuns / 20, 1) * 0.4;
    confidence += runConfidence;

    if (failureRate > 0.2 && failureRate < 0.8) {
      confidence += 0.3;
    }

    if (durationVariance > this.config.durationVarianceThreshold) {
      confidence += 0.3;
    }

    return Math.min(confidence, 1);
  }

  /**
   * Pause execution for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Export all test run data for external analysis
   */
  exportRawData(): void {
    const exportPath = path.join(process.cwd(), 'reports/analysis/raw-test-data.json');
    fs.writeFileSync(exportPath, JSON.stringify(this.allTestRuns, null, 2));
    console.log(`Raw test data exported to ${exportPath}`);
  }
}
