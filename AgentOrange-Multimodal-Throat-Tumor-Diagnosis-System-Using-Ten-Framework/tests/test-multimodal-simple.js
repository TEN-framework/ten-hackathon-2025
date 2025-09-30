/**
 * Simple Test Suite for Multimodal Throat Tumor Diagnosis System
 * 
 * Updated for working TEN Framework integration
 */

const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:3199';

class MultimodalTestSuite {
    constructor() {
        this.testResults = [];
        this.passed = 0;
        this.failed = 0;
    }

    async runAllTests() {
        console.log('🧪 Starting Multimodal System Tests...\n');

        // Wait for the server to be ready
        console.log('⏳ Waiting for server to be ready...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Run all tests
        await this.testHealthCheck();
        await this.testMultimodalAnalysisAPI();
        await this.testFileUploadEndpoints();

        this.printReport();
    }

    async testHealthCheck() {
        console.log('🏥 Testing Health Check...');
        
        try {
            const response = await axios.get(`${API_BASE_URL}/health`);
            
            if (response.status === 200 && 
                response.data.status === 'healthy' && 
                response.data.timestamp && 
                response.data.uptime) {
                this.testResults.push({
                    test: 'Health Check',
                    status: 'PASSED',
                    details: `Status: ${response.data.status}, Uptime: ${response.data.uptime}`
                });
                this.passed++;
                console.log('✅ Health check successful');
            } else {
                throw new Error('Health check response missing required fields');
            }
        } catch (error) {
            this.testResults.push({
                test: 'Health Check',
                status: 'FAILED',
                error: error.message
            });
            this.failed++;
            console.log('❌ Health check failed:', error.message);
        }
    }

    async testMultimodalAnalysisAPI() {
        console.log('🔬 Testing Multimodal Analysis API...');
        
        try {
            const testData = {
                clinical_data: {
                    age: 45,
                    gender: 'male',
                    current_symptoms: ['hoarseness', 'difficulty swallowing'],
                    duration: '2 weeks',
                    medical_history: ['smoking history']
                }
            };

            const response = await axios.post(`${API_BASE_URL}/api/multimodal/analyze`, testData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            if (response.status === 200 && response.data.analysis_id) {
                this.testResults.push({
                    test: 'Multimodal Analysis API',
                    status: 'PASSED',
                    details: `Analysis ID: ${response.data.analysis_id}, Status: ${response.data.status}`
                });
                this.passed++;
                console.log('✅ Multimodal analysis API test successful');
                console.log(`   Analysis ID: ${response.data.analysis_id}`);
                console.log(`   Diagnosis: ${response.data.diagnosis?.primary_diagnosis || 'N/A'}`);
                console.log(`   Confidence: ${response.data.diagnosis?.confidence || 'N/A'}`);
            } else {
                throw new Error('API response missing required fields');
            }
        } catch (error) {
            this.testResults.push({
                test: 'Multimodal Analysis API',
                status: 'FAILED',
                error: error.message
            });
            this.failed++;
            console.log('❌ Multimodal analysis API test failed:', error.message);
        }
    }

    async testFileUploadEndpoints() {
        console.log('📁 Testing File Upload Endpoints...');
        
        try {
            // Test if upload endpoints are accessible
            const endpoints = [
                '/api/upload/audio',
                '/api/upload/image',
                '/api/upload/video'
            ];

            let accessibleEndpoints = 0;
            for (const endpoint of endpoints) {
                try {
                    // Just check if endpoint exists (should return 400 for missing file)
                    await axios.post(`${API_BASE_URL}${endpoint}`, {}, {
                        timeout: 5000
                    });
                } catch (error) {
                    if (error.response && error.response.status === 400) {
                        // 400 is expected for missing file, endpoint exists
                        accessibleEndpoints++;
                    }
                }
            }

            if (accessibleEndpoints > 0) {
                this.testResults.push({
                    test: 'File Upload Endpoints',
                    status: 'PASSED',
                    details: `${accessibleEndpoints}/${endpoints.length} endpoints accessible`
                });
                this.passed++;
                console.log('✅ File upload endpoints test successful');
            } else {
                throw new Error('No upload endpoints accessible');
            }
        } catch (error) {
            this.testResults.push({
                test: 'File Upload Endpoints',
                status: 'FAILED',
                error: error.message
            });
            this.failed++;
            console.log('❌ File upload endpoints test failed:', error.message);
        }
    }

    printReport() {
        const total = this.passed + this.failed;
        const successRate = total > 0 ? ((this.passed / total) * 100).toFixed(1) : 0;

        console.log('\n📊 Test Report');
        console.log('================');
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`📈 Success Rate: ${successRate}%\n`);

        console.log('📋 Detailed Results:');
        this.testResults.forEach(result => {
            const status = result.status === 'PASSED' ? '✅' : '❌';
            console.log(`${status} ${result.test}: ${result.status}`);
            if (result.details) {
                console.log(`   Details: ${result.details}`);
            }
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        });

        // Save detailed report
        const fs = require('fs');
        const reportPath = '/app/logs/multimodal-test-report.json';
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total,
                passed: this.passed,
                failed: this.failed,
                successRate: parseFloat(successRate)
            },
            results: this.testResults
        };

        try {
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        } catch (error) {
            console.log(`\n⚠️ Could not save report: ${error.message}`);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new MultimodalTestSuite();
    testSuite.runAllTests().catch(console.error);
}

module.exports = MultimodalTestSuite;
