/**
 * Report Generator Module
 *
 * Generates multiple report formats from test statistics.
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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap" rel="stylesheet">
    <style>
        :root {
            --background: hsl(0, 0%, 100%);
            --foreground: hsl(0, 0%, 3.9%);
            --card: hsl(0, 0%, 100%);
            --card-foreground: hsl(0, 0%, 3.9%);
            --primary: hsl(0, 0%, 9%);
            --primary-foreground: hsl(0, 0%, 98%);
            --secondary: hsl(0, 0%, 96.1%);
            --secondary-foreground: hsl(0, 0%, 9%);
            --muted: hsl(0, 0%, 96.1%);
            --muted-foreground: hsl(0, 0%, 45.1%);
            --accent: hsl(0, 0%, 96.1%);
            --accent-foreground: hsl(0, 0%, 9%);
            --destructive: hsl(0, 84.2%, 60.2%);
            --destructive-foreground: hsl(0, 0%, 98%);
            --border: hsl(0, 0%, 89.8%);
            --input: hsl(0, 0%, 100%);
            --ring: hsl(0, 0%, 3.9%);
            --cream-light: #fefbf7;
            --cream-dark: #f5f1eb;
            --lavender-light: #f3f0ff;
            --lavender-dark: #e8e2ff;
            --lavender-darker: #ded6ff;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', system-ui, sans-serif;
            background: var(--cream-light);
            min-height: 100vh;
            padding: 40px 20px;
            color: var(--foreground);
            font-feature-settings: "rlig" 1, "calt" 1;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: var(--background);
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.06);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, var(--lavender-dark) 0%, var(--lavender-darker) 100%);
            color: var(--foreground);
            padding: 60px 40px;
            text-align: center;
        }

        .header h1 {
            font-family: 'Source Serif 4', Georgia, serif;
            font-size: 48px;
            font-weight: 400;
            line-height: 1.1;
            letter-spacing: -0.025em;
            margin-bottom: 12px;
            font-feature-settings: "kern" 1, "liga" 1, "calt" 1, "dlig" 1;
        }

        .header .timestamp {
            opacity: 0.75;
            font-size: 0.875rem;
            line-height: 1.25rem;
            font-weight: 400;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 24px;
            padding: 40px;
            background: var(--cream-dark);
        }

        .stat-card {
            background: var(--background);
            padding: 24px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid var(--border);
            transition: all 0.2s ease;
        }

        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.08);
        }

        .stat-number {
            font-family: 'Source Serif 4', Georgia, serif;
            font-size: 40px;
            font-weight: 400;
            line-height: 1.15;
            margin: 12px 0;
        }

        .stat-label {
            color: var(--muted-foreground);
            font-size: 0.75rem;
            line-height: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 500;
        }

        .flaky { color: var(--destructive); }
        .stable { color: #22c55e; }
        .failing { color: #ef4444; }
        .warning { color: #f59e0b; }

        .content {
            padding: 40px;
        }

        .section {
            margin-bottom: 48px;
        }

        .section h2 {
            font-family: 'Source Serif 4', Georgia, serif;
            font-size: 32px;
            font-weight: 400;
            line-height: 1.2;
            letter-spacing: -0.025em;
            color: var(--foreground);
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--border);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: var(--background);
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid var(--border);
        }

        th {
            background: var(--lavender-light);
            color: var(--foreground);
            padding: 16px;
            text-align: left;
            font-weight: 500;
            font-size: 0.875rem;
            line-height: 1.25rem;
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }

        td {
            padding: 16px;
            border-bottom: 1px solid var(--border);
            font-size: 0.875rem;
            line-height: 1.25rem;
        }

        tr:hover {
            background: var(--cream-light);
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.75rem;
            line-height: 1rem;
            font-weight: 600;
            letter-spacing: 0.025em;
        }

        .badge-flaky {
            background: var(--destructive);
            color: white;
        }

        .badge-stable {
            background: #22c55e;
            color: white;
        }

        .badge-failing {
            background: #ef4444;
            color: white;
        }

        .badge-warning {
            background: #f59e0b;
            color: white;
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background: var(--secondary);
            border-radius: 3px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #22c55e, #f59e0b, #ef4444);
            transition: width 0.3s ease;
        }

        .confidence-meter {
            display: inline-block;
            width: 60px;
            height: 6px;
            background: var(--secondary);
            border-radius: 3px;
            position: relative;
            overflow: hidden;
        }

        .confidence-fill {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background: var(--primary);
            border-radius: 3px;
        }

        .chart-container {
            background: var(--background);
            padding: 24px;
            border-radius: 8px;
            border: 1px solid var(--border);
            margin-top: 24px;
        }

        .chart-container h3 {
            font-family: 'Source Serif 4', Georgia, serif;
            font-size: 24px;
            font-weight: 400;
            line-height: 1.3;
            letter-spacing: -0.025em;
            margin-bottom: 16px;
        }

        .chart-container ol {
            margin-left: 20px;
        }

        .chart-container li {
            margin-bottom: 16px;
            line-height: 1.5;
        }

        .chart-container ul {
            margin-left: 20px;
            margin-top: 8px;
        }

        .chart-container code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.875rem;
            background: var(--muted);
            padding: 2px 6px;
            border-radius: 3px;
        }

        .filter-controls {
            margin-bottom: 24px;
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        .filter-btn {
            padding: 10px 20px;
            border: 1px solid var(--border);
            background: var(--background);
            color: var(--foreground);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.875rem;
            line-height: 1.25rem;
            font-weight: 500;
        }

        .filter-btn:hover, .filter-btn.active {
            background: var(--primary);
            color: var(--primary-foreground);
            border-color: var(--primary);
        }

        .search-box {
            padding: 10px 16px;
            border: 1px solid var(--border);
            border-radius: 6px;
            width: 300px;
            font-size: 0.875rem;
            line-height: 1.25rem;
            font-family: 'Inter', system-ui, sans-serif;
            background: var(--background);
            color: var(--foreground);
        }

        .search-box:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
        }

        .tooltip {
            position: relative;
            display: inline-block;
            cursor: help;
        }

        .tooltip .tooltiptext {
            visibility: hidden;
            width: 200px;
            background-color: var(--primary);
            color: var(--primary-foreground);
            text-align: center;
            border-radius: 6px;
            padding: 8px 12px;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            margin-left: -100px;
            font-size: 0.75rem;
            line-height: 1rem;
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
