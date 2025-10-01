/**
 * Voice-Guided Form Filling Agent
 * 
 * This service provides conversational form assistance using the TEN Framework
 * to guide users through form completion using natural language interaction.
 */

const winston = require('winston');
const AIAnalysisService = require('./ai-analysis-service');

class VoiceGuidedFormAgent {
    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/voice-guided-form-agent.log' })
            ]
        });

        this.aiAnalysisService = new AIAnalysisService();
        
        // Form templates for different types of medical forms
        this.formTemplates = {
            'clinical_intake': {
                name: 'Clinical Intake Form',
                fields: [
                    { id: 'age', label: 'Age', type: 'number', required: true, validation: 'age' },
                    { id: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'], required: true },
                    { id: 'current_symptoms', label: 'Current Symptoms', type: 'array', required: true },
                    { id: 'medical_history', label: 'Medical History', type: 'text', required: false },
                    { id: 'medications', label: 'Current Medications', type: 'array', required: false },
                    { id: 'symptom_duration', label: 'Symptom Duration (days)', type: 'number', required: true },
                    { id: 'smoking_history', label: 'Smoking History', type: 'select', options: ['never', 'former', 'current'], required: true },
                    { id: 'family_history', label: 'Family History of Cancer', type: 'select', options: ['yes', 'no', 'unknown'], required: true }
                ]
            },
            'voice_assessment': {
                name: 'Voice Assessment Form',
                fields: [
                    { id: 'voice_quality_rating', label: 'Rate your voice quality (1-10)', type: 'number', required: true, validation: 'rating_1_10' },
                    { id: 'hoarseness_severity', label: 'Hoarseness severity (1-10)', type: 'number', required: true, validation: 'rating_1_10' },
                    { id: 'voice_fatigue', label: 'Voice fatigue after speaking', type: 'select', options: ['none', 'mild', 'moderate', 'severe'], required: true },
                    { id: 'speaking_difficulty', label: 'Difficulty speaking', type: 'select', options: ['none', 'mild', 'moderate', 'severe'], required: true },
                    { id: 'voice_breaks', label: 'Voice breaks or cracks', type: 'select', options: ['never', 'rarely', 'sometimes', 'often'], required: true }
                ]
            }
        };

        // Conversation state management
        this.activeSessions = new Map();
    }

    /**
     * Start a new voice-guided form session
     */
    async startFormSession(sessionId, formType = 'clinical_intake') {
        try {
            this.logger.info(`Starting voice-guided form session: ${sessionId} for form: ${formType}`);

            const formTemplate = this.formTemplates[formType];
            if (!formTemplate) {
                throw new Error(`Unknown form type: ${formType}`);
            }

            const session = {
                sessionId,
                formType,
                formTemplate,
                currentFieldIndex: 0,
                completedFields: {},
                conversationHistory: [],
                status: 'active',
                startTime: new Date().toISOString()
            };

            this.activeSessions.set(sessionId, session);

            // Generate initial greeting and first question
            const greeting = await this.generateFormGreeting(formTemplate);
            const firstQuestion = await this.generateFieldQuestion(formTemplate.fields[0], session);

            this.logger.info(`Form session started successfully: ${sessionId}`);
            
            return {
                sessionId,
                greeting,
                currentQuestion: firstQuestion,
                progress: {
                    current: 1,
                    total: formTemplate.fields.length,
                    percentage: Math.round((1 / formTemplate.fields.length) * 100)
                },
                formName: formTemplate.name
            };

        } catch (error) {
            this.logger.error('Failed to start form session:', error);
            throw error;
        }
    }

    /**
     * Process user voice input and provide next question or validation
     */
    async processVoiceInput(sessionId, voiceInput, audioFile = null) {
        try {
            this.logger.info(`Processing voice input for session: ${sessionId}`);

            const session = this.activeSessions.get(sessionId);
            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }

            if (session.status !== 'active') {
                throw new Error(`Session is not active: ${session.status}`);
            }

            const currentField = session.formTemplate.fields[session.currentFieldIndex];
            
            // If audio file is provided, convert it to text first
            let processedInput = voiceInput;
            if (audioFile && !voiceInput) {
                this.logger.info('Converting audio to text...');
                processedInput = await this.convertAudioToText(audioFile);
                this.logger.info(`Audio converted to text: ${processedInput}`);
            }
            
            // Add to conversation history
            session.conversationHistory.push({
                type: 'user_input',
                content: processedInput,
                timestamp: new Date().toISOString(),
                field: currentField.id,
                audioFile: audioFile ? 'provided' : null
            });

            // Process the voice input to extract field value
            const extractedValue = await this.extractFieldValue(processedInput, currentField, session);
            
            // Validate the extracted value
            const validationResult = this.validateFieldValue(extractedValue, currentField);
            
            if (validationResult.isValid) {
                // Store the value and move to next field
                session.completedFields[currentField.id] = extractedValue;
                session.currentFieldIndex++;

                // Add to conversation history
                session.conversationHistory.push({
                    type: 'field_completed',
                    field: currentField.id,
                    value: extractedValue,
                    timestamp: new Date().toISOString()
                });

                // Check if form is complete
                if (session.currentFieldIndex >= session.formTemplate.fields.length) {
                    return await this.completeForm(session);
                } else {
                    // Generate next question
                    const nextField = session.formTemplate.fields[session.currentFieldIndex];
                    const nextQuestion = await this.generateFieldQuestion(nextField, session);
                    
                    return {
                        sessionId,
                        response: validationResult.confirmationMessage,
                        nextQuestion,
                        progress: {
                            current: session.currentFieldIndex + 1,
                            total: session.formTemplate.fields.length,
                            percentage: Math.round(((session.currentFieldIndex + 1) / session.formTemplate.fields.length) * 100)
                        },
                        completedFields: session.completedFields
                    };
                }
            } else {
                // Generate clarification question
                const clarificationQuestion = await this.generateClarificationQuestion(currentField, validationResult.error, session);
                
                return {
                    sessionId,
                    response: validationResult.errorMessage,
                    clarificationQuestion,
                    progress: {
                        current: session.currentFieldIndex + 1,
                        total: session.formTemplate.fields.length,
                        percentage: Math.round(((session.currentFieldIndex + 1) / session.formTemplate.fields.length) * 100)
                    },
                    needsClarification: true
                };
            }

        } catch (error) {
            this.logger.error('Failed to process voice input:', error);
            throw error;
        }
    }

    /**
     * Extract field value from voice input using AI
     */
    async extractFieldValue(voiceInput, field, session) {
        try {
            const prompt = this.buildFieldExtractionPrompt(voiceInput, field, session);
            
            const response = await this.aiAnalysisService.openai.chat.completions.create({
                model: this.aiAnalysisService.model,
                messages: [
                    {
                        role: "system",
                        content: "You are a medical form assistant. Extract the requested information from the user's voice input. Return only the extracted value in the appropriate format."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 100
            });

            const extractedValue = response.choices[0].message.content.trim();
            this.logger.info(`Extracted value for field ${field.id}: ${extractedValue}`);
            
            return this.formatExtractedValue(extractedValue, field);

        } catch (error) {
            this.logger.error('Failed to extract field value:', error);
            throw error;
        }
    }

    /**
     * Generate form greeting message
     */
    async generateFormGreeting(formTemplate) {
        try {
            const prompt = `Generate a warm, professional greeting for a medical form called "${formTemplate.name}". 
            The greeting should:
            - Welcome the user
            - Explain that you'll guide them through the form using voice
            - Mention that they can speak naturally
            - Be encouraging and reassuring
            - Keep it concise (2-3 sentences)`;

            const response = await this.aiAnalysisService.openai.chat.completions.create({
                model: this.aiAnalysisService.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 150
            });

            return response.choices[0].message.content.trim();

        } catch (error) {
            this.logger.error('Failed to generate form greeting:', error);
            return "Hello! I'll help you complete this medical form using voice. Please speak naturally, and I'll guide you through each question.";
        }
    }

    /**
     * Generate question for a specific field
     */
    async generateFieldQuestion(field, session) {
        try {
            const context = this.buildFieldContext(field, session);
            
            const prompt = `Generate a natural, conversational question for a medical form field.
            
            Field Details:
            - Label: ${field.label}
            - Type: ${field.type}
            - Required: ${field.required}
            ${field.options ? `- Options: ${field.options.join(', ')}` : ''}
            ${field.validation ? `- Validation: ${field.validation}` : ''}
            
            Context: ${context}
            
            The question should:
            - Be conversational and friendly
            - Clearly explain what information is needed
            - Provide examples if helpful
            - Be encouraging
            - Keep it concise (1-2 sentences)`;

            const response = await this.aiAnalysisService.openai.chat.completions.create({
                model: this.aiAnalysisService.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 200
            });

            return response.choices[0].message.content.trim();

        } catch (error) {
            this.logger.error('Failed to generate field question:', error);
            return `Please tell me your ${field.label.toLowerCase()}.`;
        }
    }

    /**
     * Generate clarification question when validation fails
     */
    async generateClarificationQuestion(field, error, session) {
        try {
            const prompt = `Generate a helpful clarification question for a medical form field.
            
            Field: ${field.label}
            Error: ${error}
            Field Type: ${field.type}
            ${field.options ? `Options: ${field.options.join(', ')}` : ''}
            
            The clarification should:
            - Acknowledge the confusion
            - Provide clear guidance
            - Give examples if helpful
            - Be encouraging and patient
            - Keep it concise (1-2 sentences)`;

            const response = await this.aiAnalysisService.openai.chat.completions.create({
                model: this.aiAnalysisService.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 200
            });

            return response.choices[0].message.content.trim();

        } catch (error) {
            this.logger.error('Failed to generate clarification question:', error);
            return `I didn't quite understand that. Could you please tell me your ${field.label.toLowerCase()} again?`;
        }
    }

    /**
     * Complete the form and generate summary
     */
    async completeForm(session) {
        try {
            this.logger.info(`Completing form session: ${session.sessionId}`);

            session.status = 'completed';
            session.endTime = new Date().toISOString();

            // Generate completion message
            const completionMessage = await this.generateCompletionMessage(session);
            
            // Generate form summary
            const formSummary = this.generateFormSummary(session);

            this.logger.info(`Form session completed successfully: ${session.sessionId}`);
            
            return {
                sessionId: session.sessionId,
                status: 'completed',
                completionMessage,
                formSummary,
                completedFields: session.completedFields,
                processingTime: this.calculateProcessingTime(session),
                nextSteps: [
                    "Review your completed form",
                    "Proceed with voice analysis if desired",
                    "Schedule follow-up if recommended"
                ]
            };

        } catch (error) {
            this.logger.error('Failed to complete form:', error);
            throw error;
        }
    }

    /**
     * Build field extraction prompt for AI
     */
    buildFieldExtractionPrompt(voiceInput, field, session) {
        let prompt = `Extract the ${field.label} from this voice input: "${voiceInput}"\n\n`;
        
        prompt += `Field Details:\n`;
        prompt += `- Type: ${field.type}\n`;
        prompt += `- Required: ${field.required}\n`;
        
        if (field.options) {
            prompt += `- Valid options: ${field.options.join(', ')}\n`;
        }
        
        if (field.validation) {
            prompt += `- Validation rules: ${field.validation}\n`;
        }
        
        prompt += `\nReturn only the extracted value in the appropriate format.`;
        
        return prompt;
    }

    /**
     * Build context for field question generation
     */
    buildFieldContext(field, session) {
        let context = `This is question ${session.currentFieldIndex + 1} of ${session.formTemplate.fields.length} in the ${session.formTemplate.name}.`;
        
        if (session.completedFields && Object.keys(session.completedFields).length > 0) {
            context += ` So far, you've provided: ${Object.keys(session.completedFields).join(', ')}.`;
        }
        
        return context;
    }

    /**
     * Format extracted value based on field type
     */
    formatExtractedValue(value, field) {
        switch (field.type) {
            case 'number':
                const num = parseFloat(value);
                return isNaN(num) ? value : num;
            case 'array':
                if (typeof value === 'string') {
                    return value.split(',').map(item => item.trim());
                }
                return Array.isArray(value) ? value : [value];
            case 'select':
                return value.toLowerCase();
            default:
                return value;
        }
    }

    /**
     * Validate field value
     */
    validateFieldValue(value, field) {
        const result = {
            isValid: true,
            error: null,
            errorMessage: null,
            confirmationMessage: null
        };

        // Check if required field is empty
        if (field.required && (!value || value === '' || (Array.isArray(value) && value.length === 0))) {
            result.isValid = false;
            result.error = 'Required field is empty';
            result.errorMessage = `I need your ${field.label.toLowerCase()} to continue.`;
            return result;
        }

        // Type-specific validation
        switch (field.type) {
            case 'number':
                if (isNaN(value)) {
                    result.isValid = false;
                    result.error = 'Invalid number format';
                    result.errorMessage = `Please provide a number for ${field.label.toLowerCase()}.`;
                } else if (field.validation === 'age' && (value < 0 || value > 150)) {
                    result.isValid = false;
                    result.error = 'Age out of range';
                    result.errorMessage = `Please provide a valid age between 0 and 150.`;
                } else if (field.validation === 'rating_1_10' && (value < 1 || value > 10)) {
                    result.isValid = false;
                    result.error = 'Rating out of range';
                    result.errorMessage = `Please provide a rating between 1 and 10.`;
                }
                break;
                
            case 'select':
                if (field.options && !field.options.includes(value.toLowerCase())) {
                    result.isValid = false;
                    result.error = 'Invalid option';
                    result.errorMessage = `Please choose from: ${field.options.join(', ')}.`;
                }
                break;
        }

        if (result.isValid) {
            result.confirmationMessage = `Got it! Your ${field.label.toLowerCase()} is ${value}.`;
        }

        return result;
    }

    /**
     * Generate completion message
     */
    async generateCompletionMessage(session) {
        try {
            const prompt = `Generate a warm completion message for a medical form.
            
            Form: ${session.formTemplate.name}
            Fields completed: ${Object.keys(session.completedFields).length}
            
            The message should:
            - Congratulate the user on completing the form
            - Thank them for their time
            - Be encouraging and reassuring
            - Keep it concise (2-3 sentences)`;

            const response = await this.aiAnalysisService.openai.chat.completions.create({
                model: this.aiAnalysisService.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 150
            });

            return response.choices[0].message.content.trim();

        } catch (error) {
            this.logger.error('Failed to generate completion message:', error);
            return "Thank you for completing the form! I've recorded all your information. You can now proceed with the voice analysis if you'd like.";
        }
    }

    /**
     * Generate form summary
     */
    generateFormSummary(session) {
        const summary = {
            formName: session.formTemplate.name,
            completionTime: session.endTime,
            fieldsCompleted: Object.keys(session.completedFields).length,
            totalFields: session.formTemplate.fields.length,
            data: session.completedFields
        };

        return summary;
    }

    /**
     * Calculate processing time
     */
    calculateProcessingTime(session) {
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
        return Math.round((end - start) / 1000); // seconds
    }

    /**
     * Get session status
     */
    getSessionStatus(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return null;
        }

        return {
            sessionId: session.sessionId,
            formType: session.formType,
            status: session.status,
            progress: {
                current: session.currentFieldIndex + 1,
                total: session.formTemplate.fields.length,
                percentage: Math.round(((session.currentFieldIndex + 1) / session.formTemplate.fields.length) * 100)
            },
            completedFields: session.completedFields,
            startTime: session.startTime,
            endTime: session.endTime
        };
    }

    /**
     * Convert audio file to text using AI
     */
    async convertAudioToText(audioFile) {
        try {
            this.logger.info('Converting audio to text using AI...');
            
            // For now, we'll use a simple approach with the AI service
            // In a production system, you might want to use a dedicated speech-to-text service
            const prompt = `Please transcribe the following audio file. The audio contains a user's voice input for a medical form. Extract only the spoken words clearly and accurately.`;
            
            // Since we can't directly process audio files with the current AI service,
            // we'll return a placeholder that indicates audio was received
            // In a real implementation, you would use a speech-to-text API here
            
            this.logger.warn('Audio-to-text conversion not fully implemented. Using placeholder response.');
            return "Audio input received - please use text input for now";
            
        } catch (error) {
            this.logger.error('Failed to convert audio to text:', error);
            throw new Error('Failed to process audio input');
        }
    }

    /**
     * End a form session
     */
    endSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.status = 'ended';
            session.endTime = new Date().toISOString();
            this.logger.info(`Form session ended: ${sessionId}`);
        }
    }
}

module.exports = VoiceGuidedFormAgent;
