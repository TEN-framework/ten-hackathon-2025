/**
 * Real AI Analysis Service using SiliconFlow (OpenAI-compatible)
 * 
 * This service provides real AI-powered medical analysis using SiliconFlow's API
 */

const OpenAI = require('openai');
const winston = require('winston');

class AIAnalysisService {
    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/ai-analysis-service.log' })
            ]
        });

        // Initialize SiliconFlow client (OpenAI-compatible)
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || process.env.SILICONFLOW_API_KEY,
            baseURL: process.env.OPENAI_API_BASE || 'https://api.siliconflow.com/v1'
        });

        this.model = process.env.OPENAI_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
    }

    async analyzeVoiceForTumorDiagnosis(audioAnalysis, clinicalData) {
        try {
            this.logger.info('Starting real AI analysis for tumor diagnosis...');
            this.logger.info('Audio analysis data:', JSON.stringify(audioAnalysis, null, 2));
            this.logger.info('Clinical data:', JSON.stringify(clinicalData, null, 2));

            const prompt = this.buildMedicalAnalysisPrompt(audioAnalysis, clinicalData);
            this.logger.info('Generated prompt length:', prompt.length);
            this.logger.info('Using model:', this.model);
            this.logger.info('API base URL:', this.openai.baseURL);
            
            const requestData = {
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: "You are a medical AI specialist focused on voice-based tumor diagnosis. Analyze the provided acoustic features and clinical data to provide evidence-based diagnostic insights. Be thorough but concise in your analysis."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            };

            this.logger.info('Request data:', JSON.stringify(requestData, null, 2));

            const response = await this.openai.chat.completions.create(requestData);

            const aiAnalysis = response.choices[0].message.content;
            
            this.logger.info('Real AI analysis completed successfully');
            
            return {
                ai_analysis: aiAnalysis,
                confidence: this.calculateAIConfidence(audioAnalysis, clinicalData),
                recommendations: this.generateRecommendations(audioAnalysis, clinicalData),
                risk_factors: this.identifyRiskFactors(audioAnalysis, clinicalData),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('Real AI analysis failed:', error);
            this.logger.error('Error details:', {
                status: error.status,
                message: error.message,
                code: error.code,
                type: error.type
            });
            throw error;
        }
    }

    buildMedicalAnalysisPrompt(audioAnalysis, clinicalData) {
        const hasAudioData = audioAnalysis && Object.keys(audioAnalysis).length > 0;
        const hasClinicalData = clinicalData && Object.keys(clinicalData).length > 0;

        if (!hasAudioData && !hasClinicalData) {
            return "Please provide a general medical consultation response for a patient seeking throat/voice evaluation.";
        }

        let prompt = `MEDICAL VOICE ANALYSIS REQUEST\n\n`;

        if (hasClinicalData) {
            prompt += `CLINICAL DATA:
- Age: ${clinicalData.age || 'Not provided'}
- Gender: ${clinicalData.gender || 'Not provided'}
- Current Symptoms: ${clinicalData.current_symptoms?.join(', ') || 'Not provided'}
- Duration: ${clinicalData.duration || 'Not provided'}
- Medical History: ${clinicalData.medical_history?.join(', ') || 'Not provided'}\n\n`;
        }

        if (hasAudioData) {
            prompt += `ACOUSTIC FEATURES:
- Fundamental Frequency (F0): Mean ${audioAnalysis.acoustic_features?.f0?.mean?.toFixed(2) || 'N/A'} Hz, Std ${audioAnalysis.acoustic_features?.f0?.std?.toFixed(2) || 'N/A'} Hz
- Jitter: ${audioAnalysis.acoustic_features?.jitter?.local?.toFixed(4) || 'N/A'} (local)
- Shimmer: ${audioAnalysis.acoustic_features?.shimmer?.local?.toFixed(4) || 'N/A'} (local)
- Harmonic-to-Noise Ratio: ${audioAnalysis.acoustic_features?.hnr?.mean?.toFixed(2) || 'N/A'} dB

VOICE QUALITY:
- Overall Quality: ${audioAnalysis.voice_quality?.overall_quality || 'N/A'}
- Quality Score: ${audioAnalysis.voice_quality?.quality_score || 'N/A'}
- Clarity: ${audioAnalysis.voice_quality?.characteristics?.clarity || 'N/A'}
- Naturalness: ${audioAnalysis.voice_quality?.characteristics?.naturalness || 'N/A'}
- Intelligibility: ${audioAnalysis.voice_quality?.characteristics?.intelligibility || 'N/A'}
- Issues: ${audioAnalysis.voice_quality?.issues?.join(', ') || 'None detected'}

PATHOLOGICAL INDICATORS:
- Hoarseness: ${audioAnalysis.pathological_indicators?.hoarseness?.detected ? 'DETECTED' : 'Not detected'} (Confidence: ${audioAnalysis.pathological_indicators?.hoarseness?.confidence?.toFixed(2) || 'N/A'}, Severity: ${audioAnalysis.pathological_indicators?.hoarseness?.severity || 'N/A'})
- Breathiness: ${audioAnalysis.pathological_indicators?.breathiness?.detected ? 'DETECTED' : 'Not detected'} (Confidence: ${audioAnalysis.pathological_indicators?.breathiness?.confidence?.toFixed(2) || 'N/A'}, Severity: ${audioAnalysis.pathological_indicators?.breathiness?.severity || 'N/A'})
- Strain: ${audioAnalysis.pathological_indicators?.strain?.detected ? 'DETECTED' : 'Not detected'} (Confidence: ${audioAnalysis.pathological_indicators?.strain?.confidence?.toFixed(2) || 'N/A'}, Severity: ${audioAnalysis.pathological_indicators?.strain?.severity || 'N/A'})\n\n`;
        }

        prompt += `Please provide:
1. Primary diagnostic assessment
2. Risk level (Low/Medium/High)
3. Key findings ${hasAudioData ? 'from voice analysis' : 'from clinical presentation'}
4. Recommended next steps
5. Differential diagnoses to consider
6. Urgency of follow-up

Format your response as a structured medical analysis.`;

        return prompt.trim();
    }

    calculateAIConfidence(audioAnalysis, clinicalData) {
        let confidence = 0.5; // Base confidence

        // Increase confidence based on data quality
        if (audioAnalysis.acoustic_features?.f0?.mean) confidence += 0.1;
        if (audioAnalysis.pathological_indicators) confidence += 0.1;
        if (clinicalData.age && clinicalData.gender) confidence += 0.1;
        if (clinicalData.current_symptoms?.length > 0) confidence += 0.1;
        if (clinicalData.medical_history?.length > 0) confidence += 0.1;

        // Decrease confidence for missing critical data
        if (!audioAnalysis.acoustic_features?.f0?.mean) confidence -= 0.2;
        if (!clinicalData.current_symptoms?.length) confidence -= 0.1;

        return Math.max(0.1, Math.min(1.0, confidence));
    }

    generateRecommendations(audioAnalysis, clinicalData) {
        const recommendations = [];

        // Based on pathological indicators
        if (audioAnalysis.pathological_indicators?.hoarseness?.detected) {
            recommendations.push('Consider laryngoscopy for detailed vocal cord examination');
        }

        if (audioAnalysis.pathological_indicators?.breathiness?.detected) {
            recommendations.push('Evaluate for vocal cord paralysis or weakness');
        }

        if (audioAnalysis.pathological_indicators?.strain?.detected) {
            recommendations.push('Assess for muscle tension dysphonia');
        }

        // Based on clinical data
        if (clinicalData.current_symptoms?.includes('difficulty swallowing')) {
            recommendations.push('Consider barium swallow study or endoscopy');
        }

        if (clinicalData.medical_history?.includes('smoking history')) {
            recommendations.push('Urgent ENT evaluation due to smoking history');
        }

        if (clinicalData.duration && clinicalData.duration.includes('week')) {
            const weeks = parseInt(clinicalData.duration);
            if (weeks > 2) {
                recommendations.push('Symptoms persisting >2 weeks require prompt evaluation');
            }
        }

        // Default recommendations
        if (recommendations.length === 0) {
            recommendations.push('Continue monitoring symptoms');
            recommendations.push('Follow up in 2-4 weeks if symptoms persist');
        }

        return recommendations;
    }

    identifyRiskFactors(audioAnalysis, clinicalData) {
        const riskFactors = [];

        // Age-related risks
        if (clinicalData.age > 50) {
            riskFactors.push('Age >50 (increased cancer risk)');
        }

        // Gender-related risks
        if (clinicalData.gender === 'male') {
            riskFactors.push('Male gender (higher laryngeal cancer incidence)');
        }

        // Lifestyle risks
        if (clinicalData.medical_history?.includes('smoking history')) {
            riskFactors.push('Smoking history (major risk factor)');
        }

        if (clinicalData.medical_history?.includes('alcohol use')) {
            riskFactors.push('Alcohol use (synergistic with smoking)');
        }

        // Symptom-based risks
        if (clinicalData.current_symptoms?.includes('difficulty swallowing')) {
            riskFactors.push('Dysphagia (concerning symptom)');
        }

        if (clinicalData.current_symptoms?.includes('weight loss')) {
            riskFactors.push('Weight loss (concerning symptom)');
        }

        // Voice analysis risks
        if (audioAnalysis.pathological_indicators?.hoarseness?.severity === 'severe') {
            riskFactors.push('Severe hoarseness (concerning finding)');
        }

        if (audioAnalysis.pathological_indicators?.breathiness?.severity === 'severe') {
            riskFactors.push('Severe breathiness (concerning finding)');
        }

        return riskFactors;
    }

    async generateConversationalResponse(analysisResults) {
        try {
            this.logger.info('Generating conversational response using AI...');

            const prompt = `
Based on the following medical voice analysis results, provide a conversational, empathetic response that a patient can understand:

ANALYSIS RESULTS:
${JSON.stringify(analysisResults, null, 2)}

Please provide:
1. A warm, reassuring greeting
2. Summary of findings in simple terms
3. What the results mean for the patient
4. Next steps in plain language
5. Encouragement and support

Keep the tone professional but friendly, and avoid medical jargon.
            `.trim();

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: "You are a compassionate medical AI assistant. Provide clear, empathetic responses that help patients understand their voice analysis results without causing unnecessary alarm."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            this.logger.info('Conversational response generated successfully');
            
            return {
                greeting: "Hello! I've completed your voice analysis.",
                analysis: response.choices[0].message.content,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('Failed to generate conversational response:', error);
            
            // Fallback response
            return {
                greeting: "Hello! I've completed your voice analysis.",
                analysis: "I've analyzed your voice sample and clinical information. The results show some interesting patterns that we should discuss with your healthcare provider. Please review the detailed analysis results and follow the recommended next steps.",
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = AIAnalysisService;
