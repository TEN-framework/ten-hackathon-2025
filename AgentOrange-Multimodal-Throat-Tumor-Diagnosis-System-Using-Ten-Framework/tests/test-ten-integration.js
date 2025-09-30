/**
 * Test script for TEN Framework Integration
 * Tests real integration with TEN framework endpoints and extensions
 * Updated for working TEN Agent integration
 */

const { initializeTENFramework, getTENManager } = require('../src/ten-framework/ten-manager');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class TENTestSuite {
    constructor() {
        this.testResults = [];
        this.tenManager = null;
    }

    async runAllTests() {
        console.log('🧪 Starting TEN Framework Integration Tests...\n');

        try {
            // Initialize TEN Framework
            await this.testTENFrameworkInitialization();
            
            // Test health check
            await this.testHealthCheck();
            
            // Test extension registration
            await this.testExtensionRegistration();
            
            // Test agent creation
            await this.testAgentCreation();
            
            // Test multimodal processing
            await this.testMultimodalProcessing();
            
            // Test conversation generation
            await this.testConversationGeneration();
            
            // Test API connectivity
            await this.testAPIConnectivity();
            
            // Test multimodal analysis API
            await this.testMultimodalAnalysisAPI();
            
            // Generate test report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.testResults.push({
                test: 'Test Suite',
                status: 'FAILED',
                error: error.message
            });
        }
    }

    async testTENFrameworkInitialization() {
        console.log('🔧 Testing TEN Framework Initialization...');
        
        try {
            this.tenManager = await initializeTENFramework();
            
            if (this.tenManager && this.tenManager.getFramework()) {
                this.testResults.push({
                    test: 'TEN Framework Initialization',
                    status: 'PASSED',
                    details: 'Framework initialized successfully'
                });
                console.log('✅ TEN Framework initialized successfully');
            } else {
                throw new Error('Framework not properly initialized');
            }
        } catch (error) {
            this.testResults.push({
                test: 'TEN Framework Initialization',
                status: 'FAILED',
                error: error.message
            });
            console.log('❌ TEN Framework initialization failed:', error.message);
        }
    }

    async testHealthCheck() {
        console.log('🏥 Testing Health Check...');
        
        try {
            const healthStatus = await this.tenManager.healthCheck();
            
            if (healthStatus.status === 'healthy') {
                this.testResults.push({
                    test: 'Health Check',
                    status: 'PASSED',
                    details: `Extensions: ${healthStatus.extensions}, Agents: ${healthStatus.agents}`
                });
                console.log('✅ Health check passed');
            } else {
                throw new Error(`Health check failed: ${healthStatus.error}`);
            }
        } catch (error) {
            this.testResults.push({
                test: 'Health Check',
                status: 'FAILED',
                error: error.message
            });
            console.log('❌ Health check failed:', error.message);
        }
    }

    async testExtensionRegistration() {
        console.log('🔌 Testing Extension Registration...');
        
        try {
            const extensions = this.tenManager.getExtensions();
            const expectedExtensions = ['audio', 'image', 'clinical', 'video', 'sensor'];
            
            let allExtensionsRegistered = true;
            for (const extensionName of expectedExtensions) {
                if (!extensions.has(extensionName)) {
                    allExtensionsRegistered = false;
                    break;
                }
            }
            
            if (allExtensionsRegistered) {
                this.testResults.push({
                    test: 'Extension Registration',
                    status: 'PASSED',
                    details: `All ${expectedExtensions.length} extensions registered`
                });
                console.log('✅ All extensions registered successfully');
            } else {
                throw new Error('Not all extensions were registered');
            }
        } catch (error) {
            this.testResults.push({
                test: 'Extension Registration',
                status: 'FAILED',
                error: error.message
            });
            console.log('❌ Extension registration failed:', error.message);
        }
    }

    async testAgentCreation() {
        console.log('🤖 Testing Agent Creation...');
        
        try {
            const agents = this.tenManager.getAgents();
            
            if (agents.has('medical')) {
                this.testResults.push({
                    test: 'Agent Creation',
                    status: 'PASSED',
                    details: 'Medical diagnosis agent created successfully'
                });
                console.log('✅ Medical agent created successfully');
            } else {
                throw new Error('Medical agent not created');
            }
        } catch (error) {
            this.testResults.push({
                test: 'Agent Creation',
                status: 'FAILED',
                error: error.message
            });
            console.log('❌ Agent creation failed:', error.message);
        }
    }

    async testMultimodalProcessing() {
        console.log('🎯 Testing Multimodal Processing...');
        
        try {
            // Create test input data
            const testInput = {
                voice: {
                    audioBuffer: Buffer.from('test audio data'),
                    sampleRate: 44100,
                    channels: 1
                },
                medical_images: {
                    imageBuffer: Buffer.from('test image data'),
                    format: 'jpeg'
                },
                clinical_data: {
                    clinicalText: 'Patient presents with hoarseness and difficulty swallowing',
                    age: 45,
                    gender: 'male'
                },
                real_time_video: {
                    videoStream: 'test video stream',
                    resolution: '1920x1080'
                },
                sensor_data: {
                    heartRate: 72,
                    bloodPressure: { systolic: 120, diastolic: 80 },
                    temperature: 98.6
                }
            };

            const results = await this.tenManager.processMultimodalInput(testInput);
            
            if (results && results.confidence > 0) {
                this.testResults.push({
                    test: 'Multimodal Processing',
                    status: 'PASSED',
                    details: `Confidence: ${results.confidence}`
                });
                console.log('✅ Multimodal processing completed successfully');
            } else {
                throw new Error('Multimodal processing failed or returned low confidence');
            }
        } catch (error) {
            this.testResults.push({
                test: 'Multimodal Processing',
                status: 'FAILED',
                error: error.message
            });
            console.log('❌ Multimodal processing failed:', error.message);
        }
    }

    async testConversationGeneration() {
        console.log('💬 Testing Conversation Generation...');
        
        try {
            const context = {
                userMessage: 'I have been experiencing hoarseness for the past week',
                sessionId: 'test-session-123',
                userId: 'test-user-456'
            };

            const analysisResults = {
                diagnosis: 'Possible laryngitis',
                confidence: 0.75,
                recommendations: ['Rest voice', 'Stay hydrated', 'See ENT specialist']
            };

            const response = await this.tenManager.generateConversationResponse(context, analysisResults);
            
            if (response && (response.greeting || response.analysis)) {
                this.testResults.push({
                    test: 'Conversation Generation',
                    status: 'PASSED',
                    details: `Response generated with ${Object.keys(response).length} fields`
                });
                console.log('✅ Conversation generation successful');
            } else {
                throw new Error('No response generated');
            }
        } catch (error) {
            this.testResults.push({
                test: 'Conversation Generation',
                status: 'FAILED',
                error: error.message
            });
            console.log('❌ Conversation generation failed:', error.message);
        }
    }

    async testAPIConnectivity() {
        console.log('🌐 Testing API Connectivity...');
        
        try {
            // Test our multimodal diagnosis API
            const response = await axios.get('http://localhost:3199/health', {
                timeout: 5000
            });

            if (response.status === 200) {
                this.testResults.push({
                    test: 'Multimodal API Connectivity',
                    status: 'PASSED',
                    details: `Connected to multimodal diagnosis API`
                });
                console.log('✅ Multimodal API connectivity successful');
            } else {
                throw new Error(`API returned status ${response.status}`);
            }

            // Test TEN Agent API
            try {
                const tenAgentResponse = await axios.get('http://ten-agent:8080/health', {
                    timeout: 5000
                });
                
                if (tenAgentResponse.status === 200) {
                    this.testResults.push({
                        test: 'TEN Agent API Connectivity',
                        status: 'PASSED',
                        details: `Connected to TEN Agent API`
                    });
                    console.log('✅ TEN Agent API connectivity successful');
                }
            } catch (tenError) {
                this.testResults.push({
                    test: 'TEN Agent API Connectivity',
                    status: 'WARNING',
                    details: `TEN Agent not available: ${tenError.message}`
                });
                console.log('⚠️ TEN Agent API not available (expected in fallback mode)');
            }

        } catch (error) {
            this.testResults.push({
                test: 'API Connectivity',
                status: 'FAILED',
                error: error.message
            });
            console.log('❌ API connectivity failed:', error.message);
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

            const response = await axios.post('http://localhost:3199/api/multimodal/analyze', testData, {
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
            console.log('❌ Multimodal analysis API test failed:', error.message);
        }
    }

    generateTestReport() {
        console.log('\n📊 Test Report');
        console.log('================');
        
        const passedTests = this.testResults.filter(test => test.status === 'PASSED');
        const failedTests = this.testResults.filter(test => test.status === 'FAILED');
        
        console.log(`✅ Passed: ${passedTests.length}`);
        console.log(`❌ Failed: ${failedTests.length}`);
        console.log(`📈 Success Rate: ${((passedTests.length / this.testResults.length) * 100).toFixed(1)}%`);
        
        console.log('\n📋 Detailed Results:');
        this.testResults.forEach(test => {
            const status = test.status === 'PASSED' ? '✅' : '❌';
            console.log(`${status} ${test.test}: ${test.status}`);
            if (test.details) {
                console.log(`   Details: ${test.details}`);
            }
            if (test.error) {
                console.log(`   Error: ${test.error}`);
            }
        });

        // Save test results to file
        const reportPath = path.join(__dirname, '../logs/ten-integration-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: {
                total: this.testResults.length,
                passed: passedTests.length,
                failed: failedTests.length,
                successRate: ((passedTests.length / this.testResults.length) * 100).toFixed(1)
            },
            results: this.testResults
        }, null, 2));

        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new TENTestSuite();
    testSuite.runAllTests().catch(console.error);
}

module.exports = TENTestSuite;
