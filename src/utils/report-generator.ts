/**
 * Report Generator Module
 * 
 * This module generates multiple report formats from test statistics.
 * Each format serves different purposes and audiences.
 * 
 * Learning Goals:
 * - Generate different output formats (HTML, Markdown, JSON, CSV)
 * - Create visualizations and dashboards
 * - Practice string templating and file I/O
 * - Learn to present data effectively
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestStatistics } from './flaky-detector';

export interface ReportOptions {
  outputDir?: string;
  generateHtml?: boolean;
  generateMarkdown?: boolean;
  generateJson?: boolean;
  generateCsv?: boolean;
}

export class ReportGenerator {
  private options: Required<ReportOptions>;

  constructor(options?: ReportOptions) {
    this.options = {
      outputDir: 'reports/analysis',
      generateHtml: true,
      generateMarkdown: true,
      generateJson: true,
      generateCsv: true,
      ...options
    };
  }

  /**
   * Generate all configured report types
   */
  generateReports(statistics: TestStatistics[]): void {
    console.log('\n📊 Generating reports...');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
    
    if (this.options.generateMarkdown) {
      this.generateMarkdownReport(statistics);
    }
    
    if (this.options.generateJson) {
      this.generateJsonReport(statistics);
    }
    
    if (this.options.generateHtml) {
      this.generateHtmlReport(statistics);
    }
    
    if (this.options.generateCsv) {
      this.generateCsvReport(statistics);
    }
    
    console.log(`✅ Reports generated in ${this.options.outputDir}`);
  }

  /**
   * Generate Markdown report for GitHub
   */
  private generateMarkdownReport(statistics: TestStatistics[]): void {
    const flakyTests = statistics.filter(s => s.isFlaky);
    const stableTests = statistics.filter(s => !s.isFlaky && s.failureRate === 0);
    const failingTests = statistics.filter(s => s.failureRate >= 0.9);
    const unstableTests = statistics.filter(s => !s.isFlaky && s.failureRate > 0 && s.failureRate < 0.9);
    
    let markdown = '# 🔍 Flaky Test Detection Report\n\n';
    markdown += `> Generated: ${new Date().toISOString()}\n\n`;
    
    // Executive Summary
    markdown += '## 📊 Executive Summary\n\n';
    markdown += '| Metric | Count | Percentage |\n';
    markdown += '|--------|-------|------------|\n';
    markdown += `| Total Tests | ${statistics.length} | 100% |\n`;
    markdown += `| 🔴 Flaky Tests | ${flakyTests.length} | ${this.percentage(flakyTests.length, statistics.length)} |\n`;
    markdown += `| ✅ Stable Tests | ${stableTests.length} | ${this.percentage(stableTests.length, statistics.length)} |\n`;
    markdown += `| ❌ Consistently Failing | ${failingTests.length} | ${this.percentage(failingTests.length, statistics.length)} |\n`;
    markdown += `| ⚠️ Unstable (not flaky) | ${unstableTests.length} | ${this.percentage(unstableTests.length, statistics.length)} |\n\n`;
    
    // Flaky Tests Details
    if (flakyTests.length > 0) {
      markdown += '## 🔴 Flaky Tests (Immediate Attention Required)\n\n';
      markdown += 'These tests show inconsistent behavior and need to be fixed:\n\n';
      markdown += '| Test Name | Suite | Pass Rate | Duration Variance | Confidence | Common Failure |\n';
      markdown += '|-----------|-------|-----------|-------------------|------------|----------------|\n';
      
      for (const test of flakyTests) {
        const passRate = `${(test.successRate * 100).toFixed(1)}%`;
        const variance = `${(test.durationVariance * 100).toFixed(1)}%`;
        const confidence = `${(test.confidence * 100).toFixed(0)}%`;
        const commonFailure = test.failureMessages[0]?.substring(0, 50) || 'N/A';
        
        markdown += `| \`${test.name}\` | ${test.suite} | ${passRate} | ${variance} | ${confidence} | ${commonFailure}... |\n`;
      }
      markdown += '\n';
      
      // Failure Analysis
      markdown += '### 📈 Failure Patterns\n\n';
      for (const test of flakyTests.slice(0, 3)) { // Top 3 flaky tests
        markdown += `#### ${test.name}\n`;
        markdown += `- **File**: \`${test.file}\`\n`;
        markdown += `- **Failure Rate**: ${(test.failureRate * 100).toFixed(1)}%\n`;
        markdown += `- **Average Duration**: ${test.averageDuration.toFixed(0)}ms\n`;
        if (test.failureMessages.length > 0) {
          markdown += `- **Failure Types**: ${test.failureMessages.length} unique\n`;
          markdown += '  ```\n';
          markdown += `  ${test.failureMessages[0]}\n`;
          markdown += '  ```\n';
        }
        markdown += '\n';
      }
    }
    
    // Recommendations
    markdown += '## 💡 Recommendations\n\n';
    
    if (flakyTests.length > 0) {
      const timingFlaky = flakyTests.filter(t => t.durationVariance > 0.5);
      const randomFlaky = flakyTests.filter(t => t.failureRate > 0.2 && t.failureRate < 0.8);
      
      if (timingFlaky.length > 0) {
        markdown += `### ⏱️ Timing Issues (${timingFlaky.length} tests)\n`;
        markdown += 'These tests have high duration variance, indicating timing-related flakiness:\n';
        markdown += '- Add explicit waits using `waitForSelector` or `waitForLoadState`\n';
        markdown += '- Avoid fixed timeouts; use dynamic waits instead\n';
        markdown += '- Check for race conditions in async operations\n\n';
      }
      
      if (randomFlaky.length > 0) {
        markdown += `### 🎲 Random Failures (${randomFlaky.length} tests)\n`;
        markdown += 'These tests fail randomly without clear patterns:\n';
        markdown += '- Check for test isolation issues\n';
        markdown += '- Verify test data cleanup between runs\n';
        markdown += '- Look for external dependencies (APIs, databases)\n';
        markdown += '- Consider mocking unstable external services\n\n';
      }
    } else {
      markdown += '### ✅ Great job! No flaky tests detected.\n\n';
      markdown += 'Your test suite appears stable. Continue monitoring for flakiness as the codebase evolves.\n\n';
    }
    
    // Test Health Score
    const healthScore = this.calculateHealthScore(statistics);
    markdown += '## 🏥 Test Suite Health Score\n\n';
    markdown += `### Overall Score: ${this.getHealthEmoji(healthScore)} ${healthScore}/100\n\n`;
    markdown += '- **Stability**: ' + (100 - (flakyTests.length / statistics.length * 100)).toFixed(0) + '/100\n';
    markdown += '- **Reliability**: ' + (stableTests.length / statistics.length * 100).toFixed(0) + '/100\n';
    markdown += '- **Maintainability**: ' + (100 - (failingTests.length / statistics.length * 100)).toFixed(0) + '/100\n';
    
    // Save report
    const reportPath = path.join(this.options.outputDir, 'flaky-report.md');
    fs.writeFileSync(reportPath, markdown);
    console.log(`   📝 Markdown report: ${reportPath}`);
  }

  /**
   * Generate JSON report for programmatic access
   */
  private generateJsonReport(statistics: TestStatistics[]): void {
    const report = {
      metadata: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        tool: 'playwright-flaky-detector',
        format: 'ctrf-enhanced'
      },
      summary: {
        totalTests: statistics.length,
        flakyTests: statistics.filter(s => s.isFlaky).length,
        stableTests: statistics.filter(s => !s.isFlaky && s.failureRate === 0).length,
        failingTests: statistics.filter(s => s.failureRate >= 0.9).length,
        healthScore: this.calculateHealthScore(statistics)
      },
      tests: statistics,
      analysis: {
        mostFlaky: statistics.filter(s => s.isFlaky).slice(0, 5),
        longestDuration: [...statistics].sort((a, b) => b.averageDuration - a.averageDuration).slice(0, 5),
        highestVariance: [...statistics].sort((a, b) => b.durationVariance - a.durationVariance).slice(0, 5)
      }
    };
    
    const reportPath = path.join(this.options.outputDir, 'flaky-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`   📄 JSON report: ${reportPath}`);
  }

  /**
   * Generate HTML report with interactive features
   */
  private generateHtmlReport(statistics: TestStatistics[]): void {
    const flakyTests = statistics.filter(s => s.isFlaky);
    const stableTests = statistics.filter(s => !s.isFlaky && s.failureRate === 0);
    const failingTests = statistics.filter(s => s.failureRate >= 0.9);
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flaky Test Detection Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header .timestamp {
            opacity: 0.9;
            font-size: 0.9em;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        .stat-label {
            color: #6c757d;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .flaky { color: #dc3545; }
        .stable { color: #28a745; }
        .failing { color: #ff6b6b; }
        .warning { color: #ffc107; }
        .content {
            padding: 30px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        th {
            background: #667eea;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #f0f0f0;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: 600;
        }
        .badge-flaky { background: #dc3545; color: white; }
        .badge-stable { background: #28a745; color: white; }
        .badge-failing { background: #ff6b6b; color: white; }
        .badge-warning { background: #ffc107; color: #333; }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #28a745, #ffc107, #dc3545);
            transition: width 0.3s;
        }
        .confidence-meter {
            display: inline-block;
            width: 60px;
            height: 20px;
            background: #e0e0e0;
            border-radius: 10px;
            position: relative;
            overflow: hidden;
        }
        .confidence-fill {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background: #667eea;
            border-radius: 10px;
        }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-top: 20px;
        }
        .filter-controls {
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .filter-btn {
            padding: 8px 16px;
            border: 2px solid #667eea;
            background: white;
            color: #667eea;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .filter-btn:hover, .filter-btn.active {
            background: #667eea;
            color: white;
        }
        .search-box {
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 5px;
            width: 300px;
            font-size: 14px;
        }
        .tooltip {
            position: relative;
            display: inline-block;
            cursor: help;
        }
        .tooltip .tooltiptext {
            visibility: hidden;
            width: 200px;
            background-color: #333;
            color: #fff;
            text-align: center;
            border-radius: 6px;
            padding: 8px;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            margin-left: -100px;
            font-size: 12px;
        }
        .tooltip:hover .tooltiptext {
            visibility: visible;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Flaky Test Detection Report</h1>
            <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Tests</div>
                <div class="stat-number">${statistics.length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Flaky Tests</div>
                <div class="stat-number flaky">${flakyTests.length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Stable Tests</div>
                <div class="stat-number stable">${stableTests.length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Failing Tests</div>
                <div class="stat-number failing">${failingTests.length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Health Score</div>
                <div class="stat-number">${this.calculateHealthScore(statistics)}/100</div>
            </div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>Test Results Overview</h2>
                
                <div class="filter-controls">
                    <input type="text" class="search-box" id="searchBox" placeholder="Search tests..." onkeyup="filterTests()">
                    <button class="filter-btn active" onclick="filterByStatus('all')">All Tests</button>
                    <button class="filter-btn" onclick="filterByStatus('flaky')">Flaky Only</button>
                    <button class="filter-btn" onclick="filterByStatus('stable')">Stable Only</button>
                    <button class="filter-btn" onclick="filterByStatus('failing')">Failing Only</button>
                </div>
                
                <table id="testTable">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Test Name</th>
                            <th>Suite</th>
                            <th>Pass Rate</th>
                            <th>Avg Duration</th>
                            <th>Variance</th>
                            <th>Confidence</th>
                            <th>Runs</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${statistics.map(test => {
                            let badge = '';
                            if (test.isFlaky) {
                                badge = '<span class="badge badge-flaky">FLAKY</span>';
                            } else if (test.failureRate === 0) {
                                badge = '<span class="badge badge-stable">STABLE</span>';
                            } else if (test.failureRate >= 0.9) {
                                badge = '<span class="badge badge-failing">FAILING</span>';
                            } else {
                                badge = '<span class="badge badge-warning">UNSTABLE</span>';
                            }
                            
                            const passRate = (test.successRate * 100).toFixed(1);
                            const variance = (test.durationVariance * 100).toFixed(1);
                            const confidence = test.confidence * 100;
                            
                            return `
                            <tr class="test-row" data-status="${test.isFlaky ? 'flaky' : test.failureRate === 0 ? 'stable' : test.failureRate >= 0.9 ? 'failing' : 'unstable'}">
                                <td>${badge}</td>
                                <td>
                                    <div class="tooltip">
                                        <strong>${test.name}</strong>
                                        <span class="tooltiptext">${test.file}</span>
                                    </div>
                                </td>
                                <td>${test.suite}</td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${passRate}%"></div>
                                    </div>
                                    ${passRate}%
                                </td>
                                <td>${test.averageDuration.toFixed(0)}ms</td>
                                <td>${variance}%</td>
                                <td>
                                    <div class="confidence-meter">
                                        <div class="confidence-fill" style="width: ${confidence}%"></div>
                                    </div>
                                    ${confidence.toFixed(0)}%
                                </td>
                                <td>${test.totalRuns}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            ${flakyTests.length > 0 ? `
            <div class="section">
                <h2>Flaky Test Analysis</h2>
                <div class="chart-container">
                    <h3>Top Issues to Address</h3>
                    <ol>
                        ${flakyTests.slice(0, 5).map(test => `
                            <li>
                                <strong>${test.name}</strong> (${test.suite})
                                <ul>
                                    <li>Failure Rate: ${(test.failureRate * 100).toFixed(1)}%</li>
                                    <li>Duration Variance: ${(test.durationVariance * 100).toFixed(1)}%</li>
                                    ${test.failureMessages.length > 0 ? `<li>Common Error: <code>${test.failureMessages[0].substring(0, 100)}...</code></li>` : ''}
                                </ul>
                            </li>
                        `).join('')}
                    </ol>
                </div>
            </div>
            ` : ''}
        </div>
    </div>
    
    <script>
        function filterByStatus(status) {
            const rows = document.querySelectorAll('.test-row');
            const buttons = document.querySelectorAll('.filter-btn');
            
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            rows.forEach(row => {
                if (status === 'all' || row.dataset.status === status) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
        
        function filterTests() {
            const searchTerm = document.getElementById('searchBox').value.toLowerCase();
            const rows = document.querySelectorAll('.test-row');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        }
    </script>
</body>
</html>`;
    
    const reportPath = path.join(this.options.outputDir, 'flaky-report.html');
    fs.writeFileSync(reportPath, html);
    console.log(`   🌐 HTML report: ${reportPath}`);
  }

  /**
   * Generate CSV report for spreadsheet analysis
   */
  private generateCsvReport(statistics: TestStatistics[]): void {
    const headers = [
      'Test Name',
      'Suite',
      'File',
      'Status',
      'Total Runs',
      'Passed',
      'Failed',
      'Pass Rate (%)',
      'Failure Rate (%)',
      'Avg Duration (ms)',
      'Duration Variance (%)',
      'Confidence (%)',
      'Is Flaky',
      'Failure Messages'
    ];
    
    const rows = statistics.map(test => [
      `"${test.name}"`,
      `"${test.suite}"`,
      `"${test.file}"`,
      test.isFlaky ? 'Flaky' : test.failureRate === 0 ? 'Stable' : test.failureRate >= 0.9 ? 'Failing' : 'Unstable',
      test.totalRuns,
      test.passed,
      test.failed,
      (test.successRate * 100).toFixed(2),
      (test.failureRate * 100).toFixed(2),
      test.averageDuration.toFixed(2),
      (test.durationVariance * 100).toFixed(2),
      (test.confidence * 100).toFixed(2),
      test.isFlaky ? 'Yes' : 'No',
      `"${test.failureMessages.join('; ')}"`
    ]);
    
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    const reportPath = path.join(this.options.outputDir, 'flaky-report.csv');
    fs.writeFileSync(reportPath, csv);
    console.log(`   📊 CSV report: ${reportPath}`);
  }

  /**
   * Calculate percentage helper
   */
  private percentage(value: number, total: number): string {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  }

  /**
   * Calculate test suite health score
   */
  private calculateHealthScore(statistics: TestStatistics[]): number {
    if (statistics.length === 0) return 100;
    
    const flakyCount = statistics.filter(s => s.isFlaky).length;
    const stableCount = statistics.filter(s => !s.isFlaky && s.failureRate === 0).length;
    const failingCount = statistics.filter(s => s.failureRate >= 0.9).length;
    
    const stabilityScore = (1 - (flakyCount / statistics.length)) * 40;
    const reliabilityScore = (stableCount / statistics.length) * 40;
    const maintainabilityScore = (1 - (failingCount / statistics.length)) * 20;
    
    return Math.round(stabilityScore + reliabilityScore + maintainabilityScore);
  }

  /**
   * Get health score emoji
   */
  private getHealthEmoji(score: number): string {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    if (score >= 50) return '🟠';
    return '🔴';
    
  }
}
/**
 * Report Design Principles:
 * 
 * 1. Markdown Report:
 *    - Human-readable
 *    - GitHub/GitLab friendly
 *    - Easy to share in PRs
 *    - Good for documentation
 * 
 * 2. JSON Report:
 *    - Machine-readable
 *    - API integration ready
 *    - Can be consumed by other tools
 *    - Good for automation
 * 
 * 3. HTML Report:
 *    - Interactive dashboard
 *    - Visual representations
 *    - Good for stakeholders
 *    - Can be hosted as static site
 * 
 * 4. CSV Report:
 *    - Excel/Sheets compatible
 *    - Good for data analysis
 *    - Easy to create charts
 *    - Historical tracking
 * 
 * Best Practices:
 * - Use consistent color coding across formats
 * - Include both absolute numbers and percentages
 * - Sort by importance (flaky tests first)
 * - Provide actionable recommendations
 * - Include timestamp for tracking
 * 
 * Testing Your Reports:
 * 1. Generate with small data set first
 * 2. Open each format and verify correctness
 * 3. Test with edge cases (no flaky tests, all failing, etc.)
 * 4. Validate HTML renders correctly in browser
 * 5. Import CSV into spreadsheet software
 * 
 * Enhancement Ideas:
 * - Add charts/graphs to HTML report
 * - Include trend analysis over time
 * - Add email report format
 * - Create Slack/Teams notification format
 * - Generate JUnit XML for CI integration
 */
