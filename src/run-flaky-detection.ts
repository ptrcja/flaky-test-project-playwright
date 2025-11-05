#!/usr/bin/env node

/**
 * Main Runner Script
 *
 * Entry point for the flaky test detection tool.
 */

import { FlakyDetector } from './utils/flaky-detector';
import { ReportGenerator } from './utils/report-generator';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║     🔍 Playwright Flaky Test Detector      ║
  ║         Powered by CTRF Reporter           ║
  ╚════════════════════════════════════════════╝
  `);

  const args = process.argv.slice(2);
  const numberOfRuns = parseInt(args[0]) || 10;
  const configFile = args[1];

  let config = {};
  if (configFile && fs.existsSync(configFile)) {
    console.log(`Loading configuration from ${configFile}`);
    config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  }

  const detector = new FlakyDetector(config);

  try {
    const statistics = await detector.runDetection(numberOfRuns);

    detector.exportRawData();

    const generator = new ReportGenerator({
      generateHtml: true,
      generateMarkdown: true,
      generateJson: true,
      generateCsv: true
    });
    generator.generateReports(statistics);

    console.log('\n📊 Detection Summary');
    console.log('═'.repeat(50));

    const flakyTests = statistics.filter(s => s.isFlaky);
    const stableTests = statistics.filter(s => !s.isFlaky && s.failureRate === 0);
    const failingTests = statistics.filter(s => s.failureRate >= 0.9);

    console.log(`Total tests analyzed: ${statistics.length}`);
    console.log(`✅ Stable tests: ${stableTests.length}`);
    console.log(`🔴 Flaky tests: ${flakyTests.length}`);
    console.log(`❌ Consistently failing tests: ${failingTests.length}`);

    if (flakyTests.length > 0) {
      console.log('\n⚠️  Flaky Tests Detected:');
      console.log('─'.repeat(50));

      flakyTests.forEach((test, index) => {
        console.log(`\n${index + 1}. ${test.name}`);
        console.log(`   Suite: ${test.suite}`);
        console.log(`   File: ${test.file}`);
        console.log(`   Failure Rate: ${(test.failureRate * 100).toFixed(1)}%`);
        console.log(`   Duration Variance: ${(test.durationVariance * 100).toFixed(1)}%`);
        console.log(`   Confidence: ${(test.confidence * 100).toFixed(0)}%`);

        if (test.failureMessages.length > 0) {
          console.log(`   Common Failure: ${test.failureMessages[0].substring(0, 80)}...`);
        }
      });
      console.log('\n💡 Recommended Actions:');
      console.log('─'.repeat(50));
      console.log('1. Review the HTML report for detailed analysis');
      console.log('2. Fix tests with highest confidence scores first');
      console.log('3. Look for patterns in failure messages');
      console.log('4. Consider adding retry mechanisms for network-dependent tests');
      console.log('5. Ensure proper test isolation and cleanup');
      process.exit(1);
    } else {
      console.log('\n✅ Excellent! No flaky tests detected.');
      console.log('Your test suite appears to be stable and reliable.');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌Error during detection:', error);
    process.exit(2);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };
