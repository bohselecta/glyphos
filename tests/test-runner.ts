/**
 * GlyphOS Test Runner
 * Runs all test suites and provides results
 */

import { StorageTestSuite } from './storage-test.js'
import { AppIntegrationTestSuite } from './integration-test.js'
import { CompleteAppIntegrationTest } from './complete-integration-test.js'

export class GlyphOSTestRunner {
  private results: {
    storage: { passed: number; failed: number; results: any[] } | null
    integration: { passed: number; failed: number; results: any[] } | null
    completeIntegration: { passed: number; failed: number; totalDuration: number; results: any[] } | null
  } = {
    storage: null,
    integration: null,
    completeIntegration: null
  }

  /**
   * Run all test suites
   */
  async runAllTests(): Promise<{
    totalPassed: number
    totalFailed: number
    suites: typeof this.results
  }> {
    console.log('🧪 Starting GlyphOS Test Runner...')
    
    try {
      // Run storage tests
      console.log('\n📦 Running Storage Tests...')
      const storageTestSuite = new StorageTestSuite()
      this.results.storage = await storageTestSuite.runAllTests()
      
      // Run integration tests
      console.log('\n🚀 Running Integration Tests...')
      const integrationTestSuite = new AppIntegrationTestSuite()
      this.results.integration = await integrationTestSuite.runAllTests()
      
      // Run complete integration test
      console.log('\n🎯 Running Complete Integration Test...')
      const completeIntegrationTest = new CompleteAppIntegrationTest()
      this.results.completeIntegration = await completeIntegrationTest.runCompleteTest()
      
    } catch (error) {
      console.error('Test runner failed:', error)
    }

    const totalPassed = (this.results.storage?.passed || 0) + (this.results.integration?.passed || 0) + (this.results.completeIntegration?.passed || 0)
    const totalFailed = (this.results.storage?.failed || 0) + (this.results.integration?.failed || 0) + (this.results.completeIntegration?.failed || 0)

    console.log(`\n🎯 Test Runner Complete:`)
    console.log(`   Total Tests: ${totalPassed + totalFailed}`)
    console.log(`   Passed: ${totalPassed}`)
    console.log(`   Failed: ${totalFailed}`)
    console.log(`   Success Rate: ${totalPassed > 0 ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100) : 0}%`)

    return {
      totalPassed,
      totalFailed,
      suites: this.results
    }
  }

  /**
   * Run only storage tests
   */
  async runStorageTests(): Promise<{ passed: number; failed: number; results: any[] }> {
    console.log('📦 Running Storage Tests...')
    const storageTestSuite = new StorageTestSuite()
    this.results.storage = await storageTestSuite.runAllTests()
    return this.results.storage
  }

  /**
   * Run only complete integration test
   */
  async runCompleteIntegrationTest(): Promise<{ passed: number; failed: number; totalDuration: number; results: any[] }> {
    console.log('🎯 Running Complete Integration Test...')
    const completeIntegrationTest = new CompleteAppIntegrationTest()
    this.results.completeIntegration = await completeIntegrationTest.runCompleteTest()
    return this.results.completeIntegration
  }

  /**
   * Get test results summary
   */
  getResults(): typeof this.results {
    return this.results
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(): string {
    const storageResults = this.results.storage
    const integrationResults = this.results.integration
    const completeIntegrationResults = this.results.completeIntegration
    
    const totalPassed = (storageResults?.passed || 0) + (integrationResults?.passed || 0) + (completeIntegrationResults?.passed || 0)
    const totalFailed = (storageResults?.failed || 0) + (integrationResults?.failed || 0) + (completeIntegrationResults?.failed || 0)
    const totalTests = totalPassed + totalFailed
    const successRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GlyphOS Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 2rem;
            background: #0f172a;
            color: #e2e8f0;
        }
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 3rem;
        }
        .summary-card {
            background: #1e293b;
            padding: 1.5rem;
            border-radius: 0.5rem;
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 0.5rem 0;
            color: #06b6d4;
        }
        .summary-card .value {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        .summary-card .label {
            color: #64748b;
            font-size: 0.875rem;
        }
        .suite {
            background: #1e293b;
            border-radius: 0.5rem;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        .suite h2 {
            margin: 0 0 1rem 0;
            color: #06b6d4;
        }
        .test-result {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            margin: 0.5rem 0;
            border-radius: 0.375rem;
            background: rgba(255, 255, 255, 0.03);
        }
        .test-result.passed {
            border-left: 4px solid #10b981;
        }
        .test-result.failed {
            border-left: 4px solid #ef4444;
        }
        .test-name {
            font-weight: 500;
        }
        .test-status {
            font-size: 0.875rem;
            padding: 0.25rem 0.75rem;
            border-radius: 0.25rem;
        }
        .test-status.passed {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
        }
        .test-status.failed {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
        }
        .test-error {
            font-size: 0.75rem;
            color: #ef4444;
            margin-top: 0.5rem;
            font-family: Monaco, monospace;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 GlyphOS Test Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Tests</h3>
            <div class="value">${totalTests}</div>
            <div class="label">Tests Run</div>
        </div>
        <div class="summary-card">
            <h3>Passed</h3>
            <div class="value" style="color: #10b981;">${totalPassed}</div>
            <div class="label">Successful</div>
        </div>
        <div class="summary-card">
            <h3>Failed</h3>
            <div class="value" style="color: #ef4444;">${totalFailed}</div>
            <div class="label">Failed</div>
        </div>
        <div class="summary-card">
            <h3>Success Rate</h3>
            <div class="value" style="color: #06b6d4;">${successRate}%</div>
            <div class="label">Pass Rate</div>
        </div>
    </div>

    ${storageResults ? `
    <div class="suite">
        <h2>📦 Storage Tests</h2>
        <p>${storageResults.passed} passed, ${storageResults.failed} failed</p>
        ${storageResults.results.map(result => `
            <div class="test-result ${result.passed ? 'passed' : 'failed'}">
                <div>
                    <div class="test-name">${result.test}</div>
                    ${result.error ? `<div class="test-error">${result.error}</div>` : ''}
                </div>
                <div class="test-status ${result.passed ? 'passed' : 'failed'}">
                    ${result.passed ? '✓ PASSED' : '✗ FAILED'}
                </div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${integrationResults ? `
    <div class="suite">
        <h2>🚀 Integration Tests</h2>
        <p>${integrationResults.passed} passed, ${integrationResults.failed} failed</p>
        ${integrationResults.results.map(result => `
            <div class="test-result ${result.passed ? 'passed' : 'failed'}">
                <div>
                    <div class="test-name">${result.test}</div>
                    ${result.error ? `<div class="test-error">${result.error}</div>` : ''}
                </div>
                <div class="test-status ${result.passed ? 'passed' : 'failed'}">
                    ${result.passed ? '✓ PASSED' : '✗ FAILED'}
                </div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${completeIntegrationResults ? `
    <div class="suite">
        <h2>🎯 Complete Integration Test</h2>
        <p>${completeIntegrationResults.passed} passed, ${completeIntegrationResults.failed} failed (${completeIntegrationResults.totalDuration}ms)</p>
        ${completeIntegrationResults.results.map(result => `
            <div class="test-result ${result.passed ? 'passed' : 'failed'}">
                <div>
                    <div class="test-name">${result.step} ${result.duration ? `(${result.duration}ms)` : ''}</div>
                    ${result.error ? `<div class="test-error">${result.error}</div>` : ''}
                </div>
                <div class="test-status ${result.passed ? 'passed' : 'failed'}">
                    ${result.passed ? '✓ PASSED' : '✗ FAILED'}
                </div>
            </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>
    `
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  (window as any).GlyphOSTestRunner = GlyphOSTestRunner
}
