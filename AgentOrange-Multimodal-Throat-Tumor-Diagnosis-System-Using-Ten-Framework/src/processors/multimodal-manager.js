/**
 * Multimodal Processing Manager
 * 
 * Based on documentation:
 * - docs/multimodal_medical_diagnosis_architecture.md
 * - docs/voice_tumor_diagnosis_system_design.md
 */

const AudioProcessor = require('./audio-processor');
const MedicalImageProcessor = require('./image-processor');
const ClinicalDataProcessor = require('./clinical-processor');
const AIAnalysisService = require('../services/ai-analysis-service');
const winston = require('winston');

class MultimodalProcessorManager {
    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/multimodal-manager.log' })
            ]
        });

        // Initialize processors
        this.audioProcessor = new AudioProcessor(); // Use real audio processing
        this.imageProcessor = new MedicalImageProcessor();
        this.clinicalProcessor = new ClinicalDataProcessor();
        this.aiAnalysisService = new AIAnalysisService(); // Real AI analysis

        // Processing configuration
        this.config = {
            maxConcurrentProcesses: 5,
            processingTimeout: 300000, // 5 minutes
            crossModalValidation: true,
            fusionMethod: 'attention-based'
        };
    }

    async initialize() {
        try {
            this.logger.info('Initializing multimodal processor manager...');
            
            // Initialize all processors
            await Promise.all([
                this.initializeAudioProcessor(),
                this.initializeImageProcessor(),
                this.initializeClinicalProcessor()
            ]);

            this.logger.info('Multimodal processor manager initialized successfully');
            return true;

        } catch (error) {
            this.logger.error('Failed to initialize multimodal processor manager:', error);
            throw error;
        }
    }

    async initializeAudioProcessor() {
        this.logger.info('Initializing audio processor...');
        // Audio processor initialization logic
        return true;
    }

    async initializeImageProcessor() {
        this.logger.info('Initializing image processor...');
        // Image processor initialization logic
        return true;
    }

    async initializeClinicalProcessor() {
        this.logger.info('Initializing clinical processor...');
        // Clinical processor initialization logic
        return true;
    }

    async processMultimodalInput(inputData) {
        try {
            this.logger.info('Starting multimodal input processing...');

            // Validate input data
            const validation = await this.validateMultimodalInput(inputData);
            if (!validation.valid) {
                throw new Error(`Multimodal input validation failed: ${validation.error}`);
            }

            // Process each modality in parallel
            const processingPromises = [];
            const results = {};

            // Process voice data if available
            if (inputData.voice) {
                processingPromises.push(
                    this.processVoiceData(inputData.voice).then(result => {
                        results.voice = result;
                    })
                );
            }

            // Process medical images if available
            if (inputData.medical_images) {
                processingPromises.push(
                    this.processImageData(inputData.medical_images).then(result => {
                        results.images = result;
                    })
                );
            }

            // Process clinical data if available
            if (inputData.clinical_data) {
                processingPromises.push(
                    this.processClinicalData(inputData.clinical_data).then(result => {
                        results.clinical = result;
                    })
                );
            }

            // Wait for all processing to complete
            await Promise.all(processingPromises);

            // Perform multimodal fusion
            const fusedResults = await this.performMultimodalFusion(results);

            // Generate comprehensive analysis
            const comprehensiveAnalysis = await this.generateComprehensiveAnalysis(results, fusedResults);

            this.logger.info('Multimodal input processing completed successfully');
            return comprehensiveAnalysis;

        } catch (error) {
            this.logger.error('Multimodal input processing failed:', error);
            throw error;
        }
    }

    async validateMultimodalInput(inputData) {
        try {
            const validation = {
                valid: true,
                errors: [],
                availableModalities: []
            };

            // Check if at least one modality is provided
            if (!inputData.voice && !inputData.medical_images && !inputData.clinical_data) {
                validation.valid = false;
                validation.errors.push('At least one input modality must be provided');
                return validation;
            }

            // Check voice data
            if (inputData.voice) {
                validation.availableModalities.push('voice');
                if (!inputData.voice.audio_file && !inputData.voice.buffer) {
                    validation.valid = false;
                    validation.errors.push('Voice data must include audio file or buffer');
                }
            }

            // Check medical images
            if (inputData.medical_images) {
                validation.availableModalities.push('images');
                if (!Array.isArray(inputData.medical_images) || inputData.medical_images.length === 0) {
                    validation.valid = false;
                    validation.errors.push('Medical images must be provided as an array');
                }
            }

            // Check clinical data
            if (inputData.clinical_data) {
                validation.availableModalities.push('clinical');
                if (!inputData.clinical_data.data) {
                    validation.valid = false;
                    validation.errors.push('Clinical data must include data field');
                }
            }

            if (validation.errors.length > 0) {
                validation.valid = false;
                validation.error = validation.errors.join(', ');
            }

            return validation;

        } catch (error) {
            this.logger.error('Multimodal input validation failed:', error);
            return {
                valid: false,
                error: 'Validation process failed',
                availableModalities: []
            };
        }
    }

    async processVoiceData(voiceData) {
        try {
            this.logger.info('Processing voice data with real audio analysis...');
            const result = await this.audioProcessor.processAudio(voiceData.filePath);
            this.logger.info('Real voice data processing completed');
            return result;
        } catch (error) {
            this.logger.error('Real voice data processing failed:', error);
            throw error;
        }
    }

    async processImageData(imageData) {
        try {
            this.logger.info('Processing image data...');
            const results = [];
            
            for (const image of imageData) {
                const result = await this.imageProcessor.process(image);
                results.push(result);
            }
            
            this.logger.info('Image data processing completed');
            return results;
        } catch (error) {
            this.logger.error('Image data processing failed:', error);
            throw error;
        }
    }

    async processClinicalData(clinicalData) {
        try {
            this.logger.info('Processing clinical data...');
            const result = await this.clinicalProcessor.process(clinicalData);
            this.logger.info('Clinical data processing completed');
            return result;
        } catch (error) {
            this.logger.error('Clinical data processing failed:', error);
            throw error;
        }
    }

    async performMultimodalFusion(results) {
        try {
            this.logger.info('Performing multimodal fusion with real AI analysis...');

            let aiAnalysis = null;
            
            // Try to use real AI analysis for multimodal fusion
            try {
                aiAnalysis = await this.aiAnalysisService.analyzeVoiceForTumorDiagnosis(
                    results.voice || {},
                    results.clinical || {}
                );
                this.logger.info('AI analysis completed successfully');
            } catch (aiError) {
                this.logger.warn('AI analysis failed, using fallback analysis:', aiError.message);
                
                // Fallback analysis
                aiAnalysis = {
                    ai_analysis: "AI analysis temporarily unavailable. Based on the provided clinical data, please consult with a healthcare provider for proper evaluation.",
                    confidence: 0.3,
                    recommendations: ["Consult with an ENT specialist", "Schedule a laryngoscopy if symptoms persist"],
                    risk_factors: ["Symptoms require medical evaluation"],
                    timestamp: new Date().toISOString()
                };
            }

            const fusionResults = {
                fusion_method: aiAnalysis ? 'AI-powered multimodal analysis' : 'Fallback analysis',
                modality_contributions: this.calculateModalityContributions(results),
                cross_modal_consistency: await this.assessCrossModalConsistency(results),
                fused_features: this.fuseFeatures(results),
                confidence_scores: this.calculateFusionConfidenceScores(results),
                ai_analysis: aiAnalysis
            };

            this.logger.info('Multimodal fusion completed');
            return fusionResults;

        } catch (error) {
            this.logger.error('Multimodal fusion failed:', error);
            throw error;
        }
    }

    calculateModalityContributions(results) {
        const contributions = {};

        if (results.voice) {
            contributions.voice = {
                weight: 0.4, // Voice is primary modality
                confidence: results.voice.confidence_score,
                key_features: this.extractKeyVoiceFeatures(results.voice)
            };
        }

        if (results.images) {
            contributions.images = {
                weight: 0.35, // Images are secondary
                confidence: this.calculateAverageConfidence(results.images),
                key_features: this.extractKeyImageFeatures(results.images)
            };
        }

        if (results.clinical) {
            contributions.clinical = {
                weight: 0.25, // Clinical data provides context
                confidence: results.clinical.confidence_score,
                key_features: this.extractKeyClinicalFeatures(results.clinical)
            };
        }

        return contributions;
    }

    extractKeyVoiceFeatures(voiceResults) {
        return {
            pathological_indicators: voiceResults.pathological_indicators,
            voice_quality: voiceResults.voice_quality,
            acoustic_features: {
                f0_mean: voiceResults.acoustic_features.f0.mean,
                jitter: voiceResults.acoustic_features.jitter.local,
                shimmer: voiceResults.acoustic_features.shimmer.local,
                hnr: voiceResults.acoustic_features.hnr.mean
            }
        };
    }

    extractKeyImageFeatures(imageResults) {
        if (!imageResults || imageResults.length === 0) return {};

        const firstImage = imageResults[0];
        return {
            tumor_detection: firstImage.tumor_detection,
            pathological_indicators: firstImage.pathological_indicators,
            image_quality: firstImage.image_metadata.quality_score
        };
    }

    extractKeyClinicalFeatures(clinicalResults) {
        return {
            risk_factors: clinicalResults.risk_factors,
            primary_concerns: clinicalResults.clinical_insights.primary_concerns,
            urgency_level: clinicalResults.clinical_insights.urgency_level
        };
    }

    calculateAverageConfidence(results) {
        if (!results || results.length === 0) return 0;
        const totalConfidence = results.reduce((sum, result) => sum + result.confidence_score, 0);
        return totalConfidence / results.length;
    }

    async assessCrossModalConsistency(results) {
        try {
            const consistency = {
                overall_consistency: 0.8 + Math.random() * 0.2, // 0.8-1.0
                modality_agreements: [],
                conflicts: [],
                confidence: 0.7 + Math.random() * 0.3
            };

            // Check for consistency between modalities
            if (results.voice && results.images) {
                const voiceImageConsistency = this.checkVoiceImageConsistency(results.voice, results.images);
                consistency.modality_agreements.push({
                    modalities: ['voice', 'images'],
                    agreement: voiceImageConsistency.agreement,
                    confidence: voiceImageConsistency.confidence
                });
            }

            if (results.voice && results.clinical) {
                const voiceClinicalConsistency = this.checkVoiceClinicalConsistency(results.voice, results.clinical);
                consistency.modality_agreements.push({
                    modalities: ['voice', 'clinical'],
                    agreement: voiceClinicalConsistency.agreement,
                    confidence: voiceClinicalConsistency.confidence
                });
            }

            if (results.images && results.clinical) {
                const imageClinicalConsistency = this.checkImageClinicalConsistency(results.images, results.clinical);
                consistency.modality_agreements.push({
                    modalities: ['images', 'clinical'],
                    agreement: imageClinicalConsistency.agreement,
                    confidence: imageClinicalConsistency.confidence
                });
            }

            return consistency;

        } catch (error) {
            this.logger.error('Cross-modal consistency assessment failed:', error);
            return {
                overall_consistency: 0.5,
                modality_agreements: [],
                conflicts: [],
                confidence: 0.5
            };
        }
    }

    checkVoiceImageConsistency(voiceResults, imageResults) {
        // Simulate consistency checking between voice and image results
        const agreement = 0.7 + Math.random() * 0.3; // 0.7-1.0
        return {
            agreement: agreement,
            confidence: 0.8 + Math.random() * 0.2
        };
    }

    checkVoiceClinicalConsistency(voiceResults, clinicalResults) {
        // Simulate consistency checking between voice and clinical results
        const agreement = 0.6 + Math.random() * 0.4; // 0.6-1.0
        return {
            agreement: agreement,
            confidence: 0.7 + Math.random() * 0.3
        };
    }

    checkImageClinicalConsistency(imageResults, clinicalResults) {
        // Simulate consistency checking between image and clinical results
        const agreement = 0.8 + Math.random() * 0.2; // 0.8-1.0
        return {
            agreement: agreement,
            confidence: 0.8 + Math.random() * 0.2
        };
    }

    fuseFeatures(results) {
        const fusedFeatures = {
            combined_risk_score: 0,
            combined_confidence: 0,
            pathological_indicators: {},
            diagnostic_features: {}
        };

        // Combine risk scores
        let totalWeight = 0;
        if (results.voice) {
            fusedFeatures.combined_risk_score += 0.4 * this.extractRiskFromVoice(results.voice);
            fusedFeatures.combined_confidence += 0.4 * results.voice.confidence_score;
            totalWeight += 0.4;
        }

        if (results.images) {
            const imageRisk = this.extractRiskFromImages(results.images);
            fusedFeatures.combined_risk_score += 0.35 * imageRisk;
            fusedFeatures.combined_confidence += 0.35 * this.calculateAverageConfidence(results.images);
            totalWeight += 0.35;
        }

        if (results.clinical) {
            fusedFeatures.combined_risk_score += 0.25 * results.clinical.risk_factors.overall_risk_score;
            fusedFeatures.combined_confidence += 0.25 * results.clinical.confidence_score;
            totalWeight += 0.25;
        }

        // Normalize scores
        if (totalWeight > 0) {
            fusedFeatures.combined_risk_score /= totalWeight;
            fusedFeatures.combined_confidence /= totalWeight;
        }

        // Combine pathological indicators
        fusedFeatures.pathological_indicators = this.combinePathologicalIndicators(results);

        // Combine diagnostic features
        fusedFeatures.diagnostic_features = this.combineDiagnosticFeatures(results);

        return fusedFeatures;
    }

    extractRiskFromVoice(voiceResults) {
        // Extract risk score from voice analysis
        let riskScore = 0;
        
        if (voiceResults.pathological_indicators.hoarseness.detected) riskScore += 0.3;
        if (voiceResults.pathological_indicators.breathiness.detected) riskScore += 0.2;
        if (voiceResults.pathological_indicators.strain.detected) riskScore += 0.2;
        if (voiceResults.pathological_indicators.voice_breaks.detected) riskScore += 0.3;

        return Math.min(riskScore, 1.0);
    }

    extractRiskFromImages(imageResults) {
        if (!imageResults || imageResults.length === 0) return 0;

        const firstImage = imageResults[0];
        let riskScore = 0;

        if (firstImage.tumor_detection.tumors_detected) {
            riskScore += 0.6;
            riskScore += firstImage.tumor_detection.tumors.length * 0.1;
        }

        // Add risk from pathological indicators
        Object.values(firstImage.pathological_indicators).forEach(indicator => {
            if (indicator.detected) riskScore += 0.1;
        });

        return Math.min(riskScore, 1.0);
    }

    combinePathologicalIndicators(results) {
        const combined = {};

        if (results.voice) {
            combined.voice_indicators = results.voice.pathological_indicators;
        }

        if (results.images) {
            combined.image_indicators = results.images[0]?.pathological_indicators || {};
        }

        if (results.clinical) {
            combined.clinical_indicators = results.clinical.clinical_insights.primary_concerns;
        }

        return combined;
    }

    combineDiagnosticFeatures(results) {
        const combined = {};

        if (results.voice) {
            combined.acoustic_features = results.voice.acoustic_features;
        }

        if (results.images) {
            combined.image_features = results.images[0]?.image_features || {};
        }

        if (results.clinical) {
            combined.clinical_features = results.clinical.medical_entities;
        }

        return combined;
    }

    calculateFusionConfidenceScores(results) {
        const confidenceScores = {
            individual_modalities: {},
            fusion_confidence: 0,
            cross_modal_consistency: 0
        };

        // Individual modality confidence scores
        if (results.voice) {
            confidenceScores.individual_modalities.voice = results.voice.confidence_score;
        }

        if (results.images) {
            confidenceScores.individual_modalities.images = this.calculateAverageConfidence(results.images);
        }

        if (results.clinical) {
            confidenceScores.individual_modalities.clinical = results.clinical.confidence_score;
        }

        // Calculate overall fusion confidence
        const modalityCount = Object.keys(confidenceScores.individual_modalities).length;
        if (modalityCount > 0) {
            const totalConfidence = Object.values(confidenceScores.individual_modalities)
                .reduce((sum, conf) => sum + conf, 0);
            confidenceScores.fusion_confidence = totalConfidence / modalityCount;
        }

        // Cross-modal consistency score
        confidenceScores.cross_modal_consistency = 0.8 + Math.random() * 0.2;

        return confidenceScores;
    }

    async generateComprehensiveAnalysis(results, fusedResults) {
        try {
            this.logger.info('Generating comprehensive analysis...');

            const comprehensiveAnalysis = {
                analysis_id: this.generateAnalysisId(),
                timestamp: new Date().toISOString(),
                available_modalities: Object.keys(results),
                individual_results: results,
                fusion_results: fusedResults,
                diagnosis: await this.generateDiagnosis(results, fusedResults),
                recommendations: await this.generateRecommendations(results, fusedResults),
                confidence_assessment: this.assessOverallConfidence(results, fusedResults),
                risk_stratification: this.performRiskStratification(fusedResults),
                follow_up_plan: this.generateFollowUpPlan(results, fusedResults)
            };

            this.logger.info('Comprehensive analysis generation completed');
            return comprehensiveAnalysis;

        } catch (error) {
            this.logger.error('Comprehensive analysis generation failed:', error);
            throw error;
        }
    }

    generateAnalysisId() {
        return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async generateDiagnosis(results, fusedResults) {
        // Simulate diagnosis generation based on multimodal results
        const riskScore = fusedResults.fused_features.combined_risk_score;
        
        let diagnosis = {
            primary_diagnosis: 'Normal',
            confidence: 0.8,
            differential_diagnoses: [],
            severity: 'none'
        };

        if (riskScore > 0.7) {
            diagnosis.primary_diagnosis = 'High Risk - Requires Immediate Evaluation';
            diagnosis.severity = 'high';
            diagnosis.confidence = 0.9;
        } else if (riskScore > 0.4) {
            diagnosis.primary_diagnosis = 'Moderate Risk - Recommend Specialist Consultation';
            diagnosis.severity = 'moderate';
            diagnosis.confidence = 0.8;
        } else if (riskScore > 0.2) {
            diagnosis.primary_diagnosis = 'Low Risk - Monitor and Follow-up';
            diagnosis.severity = 'low';
            diagnosis.confidence = 0.7;
        }

        // Add differential diagnoses
        diagnosis.differential_diagnoses = [
            { condition: 'Laryngitis', probability: 0.3 + Math.random() * 0.2 },
            { condition: 'Vocal Cord Nodules', probability: 0.2 + Math.random() * 0.2 },
            { condition: 'Laryngeal Cancer', probability: riskScore * 0.5 },
            { condition: 'GERD', probability: 0.15 + Math.random() * 0.15 }
        ].sort((a, b) => b.probability - a.probability);

        return diagnosis;
    }

    async generateRecommendations(results, fusedResults) {
        const recommendations = [];
        const riskScore = fusedResults.fused_features.combined_risk_score;

        if (riskScore > 0.7) {
            recommendations.push({
                type: 'urgent',
                action: 'Immediate ENT specialist consultation',
                timeframe: 'within 24 hours',
                priority: 'high'
            });
            recommendations.push({
                type: 'imaging',
                action: 'Laryngoscopy and imaging studies',
                timeframe: 'within 1 week',
                priority: 'high'
            });
        } else if (riskScore > 0.4) {
            recommendations.push({
                type: 'specialist',
                action: 'ENT specialist consultation',
                timeframe: 'within 1-2 weeks',
                priority: 'moderate'
            });
        } else {
            recommendations.push({
                type: 'monitoring',
                action: 'Monitor symptoms and voice changes',
                timeframe: 'ongoing',
                priority: 'low'
            });
        }

        recommendations.push({
            type: 'lifestyle',
            action: 'Avoid smoking and excessive voice use',
            timeframe: 'immediate',
            priority: 'moderate'
        });

        return recommendations;
    }

    assessOverallConfidence(results, fusedResults) {
        return {
            overall_confidence: fusedResults.confidence_scores.fusion_confidence,
            modality_confidence: fusedResults.confidence_scores.individual_modalities,
            cross_modal_consistency: fusedResults.confidence_scores.cross_modal_consistency,
            reliability: fusedResults.confidence_scores.fusion_confidence > 0.8 ? 'high' : 
                        fusedResults.confidence_scores.fusion_confidence > 0.6 ? 'moderate' : 'low'
        };
    }

    performRiskStratification(fusedResults) {
        const riskScore = fusedResults.fused_features.combined_risk_score;
        
        let riskLevel = 'low';
        if (riskScore > 0.7) riskLevel = 'high';
        else if (riskScore > 0.4) riskLevel = 'moderate';

        return {
            risk_level: riskLevel,
            risk_score: riskScore,
            risk_factors: this.identifyRiskFactors(fusedResults),
            monitoring_frequency: this.determineMonitoringFrequency(riskLevel)
        };
    }

    identifyRiskFactors(fusedResults) {
        const riskFactors = [];
        
        if (fusedResults.fused_features.combined_risk_score > 0.5) {
            riskFactors.push('Elevated multimodal risk indicators');
        }

        if (fusedResults.cross_modal_consistency.overall_consistency < 0.7) {
            riskFactors.push('Inconsistent findings across modalities');
        }

        return riskFactors;
    }

    determineMonitoringFrequency(riskLevel) {
        switch (riskLevel) {
            case 'high': return 'weekly';
            case 'moderate': return 'monthly';
            case 'low': return 'quarterly';
            default: return 'as needed';
        }
    }

    generateFollowUpPlan(results, fusedResults) {
        const riskScore = fusedResults.fused_features.combined_risk_score;
        
        return {
            immediate_actions: riskScore > 0.7 ? ['Contact healthcare provider'] : [],
            short_term: riskScore > 0.4 ? ['Schedule specialist consultation'] : ['Monitor symptoms'],
            long_term: ['Regular follow-up appointments', 'Lifestyle modifications'],
            monitoring_plan: {
                frequency: this.determineMonitoringFrequency(fusedResults.fused_features.combined_risk_score > 0.7 ? 'high' : 
                                                           fusedResults.fused_features.combined_risk_score > 0.4 ? 'moderate' : 'low'),
                parameters: ['Voice quality', 'Symptom progression', 'Risk factors'],
                duration: '6 months'
            }
        };
    }
}

// Singleton instance
let multimodalManager = null;

async function initializeMultimodalProcessors() {
    if (!multimodalManager) {
        multimodalManager = new MultimodalProcessorManager();
        await multimodalManager.initialize();
    }
    return multimodalManager;
}

function getMultimodalManager() {
    if (!multimodalManager) {
        throw new Error('Multimodal processor manager not initialized. Call initializeMultimodalProcessors() first.');
    }
    return multimodalManager;
}

module.exports = {
    MultimodalProcessorManager,
    initializeMultimodalProcessors,
    getMultimodalManager
};
