/**
 * Flaky Detector Engine
 * 
 * This is the core module that runs tests multiple times and analyzes
 * the results to identify flaky tests using statistical methods.
 * 
 * Learning Goals:
 * - Understand statistical analysis of test results
 * - Learn to execute shell commands from Node.js
 * - Practice file system operations
 * - Implement confidence scoring algorithms
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { CTRFParser, CTRFReport, CTRFTest } from './ctrf-parser';

/**
 * TODO #1: Define TestStatistics interface
 * 
 * This interface represents the analysis results for a single test.
 * 
 * Required properties:
 * - testId: string (unique identifier from CTRFParser.getTestId)
 * - name: string (test name)
 * - suite: string (test suite/describe block)
 * - file: string (test file path)
 * - totalRuns: number (how many times test was executed)
 * - passed: number (count of passed runs)
 * - failed: number (count of failed runs)
 * - skipped: number (count of skipped runs)
 * - failureRate: number (failed / totalRuns)
 * - successRate: number (passed / totalRuns)
 * - isFlaky: boolean (whether test is identified as flaky)
 * - averageDuration: number (mean execution time in ms)
 * - durationVariance: number (coefficient of variation for duration)
 * - failureMessages: string[] (unique error messages)
 * - tags: string[] (test tags/annotations)
 * - confidence: number (0-1, confidence in flaky detection)
 * 
 * Design Decision: We track both rates and counts for flexibility in reporting
 */
export interface TestStatistics {
  // TODO: Implement interface
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
  confidence: number; // Confidence in flaky detection
}

/**
 * TODO #2: Define FlakyDetectionConfig interface
 * 
 * Configuration options for the flaky detection algorithm.
 * 
 * Properties:
 * - minRuns: number (minimum runs needed for detection, default: 5)
 * - flakyThresholdMin: number (min failure rate for flaky, default: 0.1)
 * - flakyThresholdMax: number (max failure rate for flaky, default: 0.9)
 * - durationVarianceThreshold: number (timing variance threshold, default: 0.5)
 * 
 * Why these thresholds?
 * - < 10% failure: Likely stable with rare issues
 * - 10-90% failure: Flaky behavior
 * - > 90% failure: Consistently broken, not flaky
 */
export interface FlakyDetectionConfig {
  // TODO: Implement interface
  minRuns: number;
  flakyThresholdMin: number;
  flakyThresholdMax: number;
  durationVarianceThreshold: number;
}

/**
 * TODO #3: Create FlakyDetector class
 * 
 * This class orchestrates the entire flaky detection process.
 */
export class FlakyDetector {
  /**
   * TODO #4: Define private properties
   * 
   * Properties needed:
   * - allTestRuns: CTRFTest[] (accumulates all test results)
   * - config: FlakyDetectionConfig (detection configuration)
   * 
   * Tip: Initialize allTestRuns as empty array
   */
  private allTestRuns: CTRFTest[] = [];
  private config: FlakyDetectionConfig;
  /**
   * TODO #5: Implement constructor
   * 
   * @param config - Optional partial configuration
   * 
   * Implementation:
   * 1. Accept optional Partial<FlakyDetectionConfig>
   * 2. Merge with default values using object spread
   * 3. Store in this.config
   * 
   * Default values:
   * - minRuns: 5
   * - flakyThresholdMin: 0.1
   * - flakyThresholdMax: 0.9
   * - durationVarianceThreshold: 0.5
   */
  constructor(config?: Partial<FlakyDetectionConfig>) {
    // TODO: Implement constructor
    this.config = {
      minRuns: 5,
      flakyThresholdMin: 0.1,
      flakyThresholdMax: 0.9,
      durationVarianceThreshold: 0.5,
      ...config
    };
  }

  /**
   * TODO #6: Implement runDetection method (main entry point)
   * 
   * Purpose: Run tests multiple times and analyze results
   * 
   * @param numberOfRuns - How many times to run tests (default: 10)
   * @returns Promise<TestStatistics[]> - Analysis results
   * 
   * Implementation steps:
   * 1. Log start message with run count
   * 2. Log configuration
   * 3. Call setupDirectories()
   * 4. Loop numberOfRuns times:
   *    a. Log current run number
   *    b. Generate unique runId
   *    c. Set RUN_ID environment variable
   *    d. Execute tests using execSync (wrap in try-catch)
   *    e. Call collectRunResults()
   *    f. Sleep for 1 second between runs
   * 5. Call and return analyzeResults()
   * 
   * Command to run: 'npx playwright test'
   * Use { stdio: 'inherit' } to show test output
   */
  async runDetection(numberOfRuns: number = 10): Promise<TestStatistics[]> {
    // TODO: Implement main detection logic
    console.log(` Starting flaky detection with ${numberOfRuns} runs...`);
    console.log(` Configuration:`, this.config);
    
    // Create reports directory structure
    this.setupDirectories();
    
    // Run tests multiple times
    for (let i = 1; i <= numberOfRuns; i++) {
      console.log(`\n Test Run ${i}/${numberOfRuns}`);
      console.log(`${'='.repeat(40)}`);
      
      const runId = `run-${i}-${Date.now()}`;
      
      try {
        // Set environment variable for CTRF custom fields
        process.env.RUN_ID = runId;
        
        // Run Playwright tests with CTRF reporter
        execSync(
          `npx playwright test --reporter=playwright-ctrf-json-reporter`,
          { 
            stdio: 'inherit',
            env: { ...process.env, RUN_ID: runId }
          }
        );
      } catch (error) {
        // Tests might fail, but we continue collecting data
        console.log(`Run ${i} completed with test failures (this is expected)`);
      }
      
      // Parse and store the CTRF results
      this.collectRunResults(i);
      
      // Brief pause between runs to avoid resource conflicts
      await this.sleep(1000);
    }
    
    // Analyze all collected results
    return this.analyzeResults();

  }


  /**
   * TODO #7: Implement setupDirectories method
   * 
   * Purpose: Create required directory structure
   * 
   * Directories to create:
   * - reports/ctrf
   * - reports/analysis  
   * - reports/runs
   * 
   * Implementation:
   * 1. Define array of directory paths
   * 2. For each directory:
   *    - Build full path using path.join(process.cwd(), dir)
   *    - Check if exists using fs.existsSync()
   *    - Create if missing using fs.mkdirSync({ recursive: true })
   */
  private setupDirectories(): void {
    // TODO: Create directory structure
    const directories = ['reports/analysis', 'reports/runs'];

    directories.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * TODO #8: Implement collectRunResults method
   * 
   * Purpose: Parse and store results from a single test run
   * 
   * @param runNumber - Current run number
   * 
   * Implementation:
   * 1. Build report path: reports/ctrf/ctrf-report.json
   * 2. Check if file exists
   * 3. Read file content using fs.readFileSync(path, 'utf-8')
   * 4. Parse using CTRFParser.parseReport()
   * 5. Extract tests using CTRFParser.extractTests()
   * 6. Add runNumber to each test's customFields
   * 7. Push tests to this.allTestRuns
   * 8. Archive report to reports/runs/run-{runNumber}.json
   * 9. Log summary (passed, failed, skipped counts)
   * 
   * Error handling: Wrap in try-catch, log errors
   */
  private collectRunResults(runNumber: number): void {
    // TODO: Collect and store test results
    try {
      const reportPath = path.join(process.cwd(), 'ctrf/ctrf-report.json');
      if (!fs.existsSync(reportPath)) {
        console.error(`CTRF report not found for run ${runNumber}`);
        return;
      }
      const reportContent = fs.readFileSync(reportPath, 'utf-8'); 
    const report = CTRFParser.parseReport(reportContent);  

     // Extract tests and add run metadata
     const tests = CTRFParser.extractTests(report);
     tests.forEach(test => {
       test.customFields = {
         ...test.customFields,
         runNumber
       }; 
     }); 

     // Store all test results
     this.allTestRuns.push(...tests);
      
     // Archive this run's report
     const archivePath = path.join(
       process.cwd(), 
       `reports/runs/run-${runNumber}.json`
     );
     fs.copyFileSync(reportPath, archivePath);
     
     // Log summary
     console.log(`   Collected ${tests.length} test results from run ${runNumber}`);
     console.log(`   Passed: ${report.results.summary.passed}`);
     console.log(`   Failed: ${report.results.summary.failed}`);
     console.log(`   Skipped: ${report.results.summary.skipped}`);
     
   } catch (error) {
     console.error(`Error collecting results from run ${runNumber}:`, error);
   }
 }   

  /**
   * TODO #9: Implement analyzeResults method
   * 
   * Purpose: Analyze all collected test runs
   * 
   * @returns TestStatistics[] sorted by flakiness
   * 
   * Implementation:
   * 1. Log "Analyzing test results..."
   * 2. Group tests using CTRFParser.groupTestsByIdentifier()
   * 3. For each grouped test:
   *    - Call calculateTestStatistics()
   *    - Add to results array
   * 4. Sort results:
   *    - Flaky tests first
   *    - Then by failure rate (descending)
   * 5. Return sorted array
   */
  private analyzeResults(): TestStatistics[] {
    // TODO: Analyze all test runs
   console.log(`Analyzing test results...`); 
  // Group tests by unique identifier
  const groupedTests = CTRFParser.groupTestsByIdentifier(this.allTestRuns);
    
  const statistics: TestStatistics[] = [];
  
  for (const [testId, tests] of groupedTests) {
    const stats = this.calculateTestStatistics(testId, tests);
    statistics.push(stats);
  }
  
  // Sort by flakiness (flaky tests first, then by failure rate)
  return statistics.sort((a, b) => {
    if (a.isFlaky && !b.isFlaky) return -1;
    if (!a.isFlaky && b.isFlaky) return 1;
    return b.failureRate - a.failureRate;
  });

  }

  /**
   * TODO #10: Implement calculateTestStatistics method
   * 
   * Purpose: Calculate statistics for a single test across all runs
   * 
   * @param testId - Unique test identifier
   * @param tests - All runs of this test
   * @returns TestStatistics object
   * 
   * Implementation:
   * 1. Use CTRFParser.calculateStatistics() for basic stats
   * 2. Calculate rates:
   *    - failureRate = failed / totalRuns
   *    - successRate = passed / totalRuns
   * 3. Calculate duration variance using calculateDurationVariance()
   * 4. Determine isFlaky using isTestFlaky()
   * 5. Calculate confidence using calculateConfidence()
   * 6. Extract unique failure messages
   * 7. Build and return TestStatistics object
   * 
   * Tip: Use first test for name, suite, file info
   */
  private calculateTestStatistics(testId: string, tests: CTRFTest[]): TestStatistics {
    // TODO: Calculate statistics for a test
    const stats = CTRFParser.calculateStatistics(tests);
    const firstTest = tests[0];
    
    // Calculate failure and success rates
    const failureRate = stats.totalRuns > 0 ? stats.failed / stats.totalRuns : 0;
    const successRate = stats.totalRuns > 0 ? stats.passed / stats.totalRuns : 0;
    
    // Calculate duration variance (indicator of timing issues)
    const durationVariance = this.calculateDurationVariance(tests);
    
    // Determine if test is flaky
    const isFlaky = this.isTestFlaky(
      stats.totalRuns,
      failureRate,
      durationVariance
    );
    
    // Calculate confidence in flaky detection
    const confidence = this.calculateConfidence(
      stats.totalRuns,
      failureRate,
      durationVariance
    );
    
    // Extract unique failure messages
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
   * TODO #11: Implement calculateDurationVariance method
   * 
   * Purpose: Calculate coefficient of variation for test duration
   * High variance indicates timing-related flakiness
   * 
   * @param tests - Test runs to analyze
   * @returns Coefficient of variation (0-1+)
   * 
   * Formula:
   * 1. Filter durations > 0
   * 2. If less than 2 durations, return 0
   * 3. Calculate mean (average)
   * 4. Calculate variance: sum((duration - mean)²) / count
   * 5. Calculate standard deviation: sqrt(variance)
   * 6. Return coefficient: stdDev / mean
   * 
   * Math explanation:
   * - Returns 0 if durations are consistent
   * - Returns > 0.5 if high variation (flaky timing)
   */
  private calculateDurationVariance(tests: CTRFTest[]): number {
    // TODO: Calculate duration variance
    const durations = tests.map(t => t.duration).filter(d => d > 0);
    
    if (durations.length < 2) return 0;
    
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.reduce((sum, duration) => {
      return sum + Math.pow(duration - avg, 2);
    }, 0) / durations.length;
    
    // Return coefficient of variation (normalized variance)
    return avg > 0 ? Math.sqrt(variance) / avg : 0;
  }

  /**
   * TODO #12: Implement isTestFlaky method
   * 
   * Purpose: Determine if a test is flaky based on metrics
   * 
   * @param totalRuns - Number of test executions
   * @param failureRate - Percentage of failures
   * @param durationVariance - Timing variance
   * @returns boolean indicating flakiness
   * 
   * Logic:
   * 1. If totalRuns < config.minRuns, return false (not enough data)
   * 2. Check if failure rate is in flaky range:
   *    - failureRate > config.flakyThresholdMin AND
   *    - failureRate < config.flakyThresholdMax
   * 3. OR check if duration variance > config.durationVarianceThreshold
   * 4. Return true if either condition met
   * 
   * Why this logic?
   * - Need enough runs for statistical significance
   * - Flaky tests fail sometimes, not always or never
   * - High timing variance indicates race conditions
   */
  private isTestFlaky(
    totalRuns: number,
    failureRate: number,
    durationVariance: number
  ): boolean {
    // TODO: Determine flakiness
      // Not enough data
      if (totalRuns < this.config.minRuns) {
        return false;
      }
      
      // Check failure rate is in flaky range
      const failureRateFlaky = 
        failureRate > this.config.flakyThresholdMin && 
        failureRate < this.config.flakyThresholdMax;
      
      // Check for high duration variance (timing issues)
      const timingFlaky = durationVariance > this.config.durationVarianceThreshold;
      
      return failureRateFlaky || timingFlaky;
  }

  /**
   * TODO #13: Implement calculateConfidence method
   * 
   * Purpose: Calculate confidence score for flaky detection (0-1)
   * 
   * @param totalRuns - Number of test executions
   * @param failureRate - Percentage of failures  
   * @param durationVariance - Timing variance
   * @returns Confidence score (0-1)
   * 
   * Scoring algorithm:
   * 1. Start with confidence = 0
   * 2. Add run confidence (max 0.4):
   *    - Math.min(totalRuns / 20, 1) * 0.4
   * 3. Add pattern confidence (0.3):
   *    - If failureRate between 0.2 and 0.8, add 0.3
   * 4. Add variance confidence (0.3):
   *    - If durationVariance > threshold, add 0.3
   * 5. Return Math.min(confidence, 1)
   * 
   * Interpretation:
   * - Higher score = more confident in flaky detection
   * - Considers multiple factors for accuracy
   */
  private calculateConfidence(
    totalRuns: number,
    failureRate: number,
    durationVariance: number
  ): number {
    let confidence = 0;
    // TODO: Calculate confidence score
   // More runs = higher confidence
    const runConfidence = Math.min(totalRuns / 20, 1) * 0.4;
    confidence += runConfidence;
    
    // Clear flaky pattern = higher confidence
    if (failureRate > 0.2 && failureRate < 0.8) {
      confidence += 0.3;
    }
    
    // High variance = higher confidence in timing issues
    if (durationVariance > this.config.durationVarianceThreshold) {
      confidence += 0.3;
    }
    
    return Math.min(confidence, 1);
  }

  /**
   * TODO #14: Implement sleep helper method
   * 
   * Purpose: Pause between test runs to avoid conflicts
   * 
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   * 
   * Implementation:
   * return new Promise(resolve => setTimeout(resolve, ms));
   */
  private sleep(ms: number): Promise<void> {
    // TODO: Implement sleep
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * TODO #15: Implement exportRawData method
   * 
   * Purpose: Export all test run data for external analysis
   * 
   * Implementation:
   * 1. Build path: reports/analysis/raw-test-data.json
   * 2. Write this.allTestRuns to file using:
   *    fs.writeFileSync(path, JSON.stringify(data, null, 2))
   * 3. Log success message with file path
   * 
   * This allows:
   * - Manual analysis
   * - Data visualization
   * - Integration with other tools
   */
  exportRawData(): void {
    // TODO: Export raw test data
    const exportPath = path.join(process.cwd(), 'reports/analysis/raw-test-data.json');
    fs.writeFileSync(exportPath, JSON.stringify(this.allTestRuns, null, 2));
    console.log(`Raw test data exported to ${exportPath}`);
  }
}

/**
 * Learning Exercises:
 * 
 * 1. Statistical Analysis:
 *    - Why use coefficient of variation instead of raw variance?
 *    - What makes 10-90% the "flaky" range?
 *    - How does sample size affect confidence?
 * 
 * 2. System Design:
 *    - Why accumulate all runs before analysis?
 *    - Benefits of separating collection from analysis?
 *    - How would you scale this for 1000s of tests?
 * 
 * 3. Error Handling:
 *    - Why continue on test failure in runDetection?
 *    - How to handle missing report files?
 *    - What if a test is renamed between runs?
 * 
 * 4. Performance:
 *    - Why sleep between runs?
 *    - How to optimize for large test suites?
 *    - Parallel vs sequential execution trade-offs?
 * 
 * Testing Your Implementation:
 * 1. Start with a single test file
 * 2. Run with small numberOfRuns (3-5)
 * 3. Verify CTRF reports are generated
 * 4. Check that statistics match expectations
 * 5. Test with all three test files
 * 
 * Debugging Tips:
 * - Add console.log statements to track flow
 * - Inspect CTRF JSON files manually
 * - Use debugger in VS Code
 * - Test each method independently
 */