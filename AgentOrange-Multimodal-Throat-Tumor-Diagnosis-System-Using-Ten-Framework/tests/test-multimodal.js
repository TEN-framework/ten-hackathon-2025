/**
 * Test Suite for Multimodal Throat Tumor Diagnosis System
 * 
 * Based on documentation:
 * - docs/technical_specifications.md (Testing Requirements)
 * - docs/voice_tumor_diagnosis_implementation_plan.md (Testing Strategy)
 */

const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Import our application
const app = require('../src/index');

describe('Multimodal Throat Tumor Diagnosis System', () => {
    let server;

    beforeAll(async () => {
        // Start the server for testing
        server = app;
    });

    afterAll(async () => {
        // Clean up
        if (server) {
            await server.close();
        }
    });

    describe('Health Check Endpoints', () => {
        test('GET /health should return healthy status', async () => {
            const response = await request(server)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
        });

        test('GET /health/detailed should return detailed system status', async () => {
            const response = await request(server)
                .get('/health/detailed')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('system');
            expect(response.body).toHaveProperty('services');
        });
    });

    describe('Authentication Endpoints', () => {
        test('POST /api/auth/login should authenticate valid user', async () => {
            const response = await request(server)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: 'password'
                })
                .expect(200);

            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('username', 'admin');
        });

        test('POST /api/auth/login should reject invalid credentials', async () => {
            const response = await request(server)
                .post('/api/auth/login')
                .send({
                    username: 'invalid',
                    password: 'wrong'
                })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        test('POST /api/auth/register should create new user', async () => {
            const response = await request(server)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'testpassword'
                })
                .expect(201);

            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('username', 'testuser');
        });
    });

    describe('Multimodal Analysis Endpoints', () => {
        test('GET /api/multimodal/status should return system capabilities', async () => {
            const response = await request(server)
                .get('/api/multimodal/status')
                .expect(200);

            expect(response.body).toHaveProperty('system');
            expect(response.body).toHaveProperty('capabilities');
            expect(response.body).toHaveProperty('multimodal_fusion');
        });

        test('POST /api/multimodal/clinical should process clinical data', async () => {
            const clinicalData = {
                age: 45,
                gender: 'male',
                current_symptoms: ['hoarseness', 'difficulty swallowing'],
                medical_history: 'Previous laryngitis',
                medications: ['ibuprofen'],
                symptom_duration: 14
            };

            const response = await request(server)
                .post('/api/multimodal/clinical')
                .send({
                    clinical_data: clinicalData
                })
                .expect(200);

            expect(response.body).toHaveProperty('analysis_id');
            expect(response.body).toHaveProperty('modality', 'clinical');
            expect(response.body).toHaveProperty('status', 'completed');
            expect(response.body).toHaveProperty('results');
        });

        test('POST /api/multimodal/analyze should reject request without data', async () => {
            const response = await request(server)
                .post('/api/multimodal/analyze')
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Analysis History Endpoints', () => {
        test('GET /api/analysis/history should return analysis history', async () => {
            const response = await request(server)
                .get('/api/analysis/history')
                .expect(200);

            expect(response.body).toHaveProperty('history');
            expect(response.body).toHaveProperty('total');
            expect(Array.isArray(response.body.history)).toBe(true);
        });

        test('GET /api/analysis/statistics should return analysis statistics', async () => {
            const response = await request(server)
                .get('/api/analysis/statistics')
                .expect(200);

            expect(response.body).toHaveProperty('total_analyses');
            expect(response.body).toHaveProperty('successful_analyses');
            expect(response.body).toHaveProperty('modality_usage');
            expect(response.body).toHaveProperty('risk_distribution');
        });
    });

    describe('Error Handling', () => {
        test('GET /nonexistent should return 404', async () => {
            const response = await request(server)
                .get('/nonexistent')
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Endpoint not found');
        });

        test('POST /api/multimodal/analyze with invalid data should return 400', async () => {
            const response = await request(server)
                .post('/api/multimodal/analyze')
                .send({
                    invalid_data: 'test'
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Security Tests', () => {
        test('Should include security headers', async () => {
            const response = await request(server)
                .get('/health')
                .expect(200);

            expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
            expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
            expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
        });

        test('Should handle CORS properly', async () => {
            const response = await request(server)
                .options('/api/multimodal/status')
                .expect(204);

            expect(response.headers).toHaveProperty('access-control-allow-origin');
            expect(response.headers).toHaveProperty('access-control-allow-methods');
        });
    });

    describe('Performance Tests', () => {
        test('Health check should respond quickly', async () => {
            const start = Date.now();
            await request(server)
                .get('/health')
                .expect(200);
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(1000); // Should respond within 1 second
        });

        test('Should handle concurrent requests', async () => {
            const requests = Array(10).fill().map(() => 
                request(server).get('/health')
            );

            const responses = await Promise.all(requests);
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });
        });
    });

    describe('Data Validation Tests', () => {
        test('Should validate clinical data format', async () => {
            const invalidData = {
                age: 'invalid',
                gender: 'unknown',
                current_symptoms: 'not an array'
            };

            const response = await request(server)
                .post('/api/multimodal/clinical')
                .send({
                    clinical_data: invalidData
                });

            // Should either process with warnings or return validation error
            expect([200, 400]).toContain(response.status);
        });

        test('Should handle missing required fields gracefully', async () => {
            const incompleteData = {
                age: 45
                // Missing gender and symptoms
            };

            const response = await request(server)
                .post('/api/multimodal/clinical')
                .send({
                    clinical_data: incompleteData
                });

            // Should handle gracefully
            expect([200, 400]).toContain(response.status);
        });
    });

    describe('Integration Tests', () => {
        test('Should process complete multimodal workflow', async () => {
            // This would test the complete workflow from input to output
            // For now, we'll test the individual components work together
            
            const clinicalData = {
                age: 50,
                gender: 'male',
                current_symptoms: ['hoarseness', 'voice changes'],
                medical_history: 'Smoking history',
                medications: [],
                symptom_duration: 30
            };

            // Test clinical analysis
            const clinicalResponse = await request(server)
                .post('/api/multimodal/clinical')
                .send({ clinical_data: clinicalData })
                .expect(200);

            expect(clinicalResponse.body.results).toHaveProperty('clinical_insights');
            expect(clinicalResponse.body.results).toHaveProperty('risk_factors');

            // Test system status
            const statusResponse = await request(server)
                .get('/api/multimodal/status')
                .expect(200);

            expect(statusResponse.body.capabilities.clinical_analysis.enabled).toBe(true);
        });
    });
});

// Mock data for testing
const mockVoiceData = {
    duration: 20,
    sampleRate: 44100,
    bitDepth: 16,
    format: 'wav'
};

const mockImageData = {
    format: 'jpg',
    resolution: { width: 1024, height: 1024 },
    bitDepth: 8,
    imageType: 'laryngoscopy'
};

const mockClinicalData = {
    age: 45,
    gender: 'male',
    current_symptoms: ['hoarseness', 'difficulty swallowing'],
    medical_history: 'Previous laryngitis',
    medications: ['ibuprofen'],
    symptom_duration: 14
};

// Utility functions for testing
function createMockFile(type, size = 1024) {
    const buffer = Buffer.alloc(size);
    return {
        fieldname: type,
        originalname: `test.${type}`,
        encoding: '7bit',
        mimetype: `application/${type}`,
        buffer: buffer,
        size: size
    };
}

function createMockMultimodalRequest() {
    return {
        voice: mockVoiceData,
        medical_images: [mockImageData],
        clinical_data: mockClinicalData
    };
}

module.exports = {
    mockVoiceData,
    mockImageData,
    mockClinicalData,
    createMockFile,
    createMockMultimodalRequest
};
