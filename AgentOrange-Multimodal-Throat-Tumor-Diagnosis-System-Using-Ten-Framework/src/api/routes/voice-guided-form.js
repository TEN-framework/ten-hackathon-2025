/**
 * Voice-Guided Form Filling API Routes
 * 
 * Provides REST API endpoints for voice-guided form completion
 */

const express = require('express');
const multer = require('multer');
const winston = require('winston');
const VoiceGuidedFormAgent = require('../../services/voice-guided-form-agent');

const router = express.Router();

// Initialize the voice-guided form agent
const formAgent = new VoiceGuidedFormAgent();

// Configure multer for audio file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `voice-form-${uniqueSuffix}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit for voice files
    },
    fileFilter: (req, file, cb) => {
        // Allow audio files for voice input
        const allowedExtensions = /\.(wav|mp3|flac|m4a|ogg)$/i;
        const allowedMimeTypes = /^(audio)\//;
        
        const extname = allowedExtensions.test(file.originalname);
        const mimetype = allowedMimeTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only audio files are allowed.'));
        }
    }
});

// Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/voice-guided-form-api.log' })
    ]
});

/**
 * POST /api/voice-guided-form/start
 * Start a new voice-guided form session
 */
router.post('/start', async (req, res) => {
    try {
        const { formType = 'clinical_intake' } = req.body;
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        logger.info(`Starting voice-guided form session: ${sessionId} for form type: ${formType}`);

        const session = await formAgent.startFormSession(sessionId, formType);

        res.status(200).json({
            success: true,
            message: 'Voice-guided form session started successfully',
            data: session
        });

    } catch (error) {
        logger.error('Failed to start voice-guided form session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start form session',
            message: error.message
        });
    }
});

/**
 * POST /api/voice-guided-form/process
 * Process voice input for form completion
 */
router.post('/process', upload.single('audio_file'), async (req, res) => {
    try {
        const { sessionId, voiceInput } = req.body;
        const audioFile = req.file;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }

        if (!voiceInput && !audioFile) {
            return res.status(400).json({
                success: false,
                error: 'Either voice input text or audio file is required'
            });
        }

        logger.info(`Processing voice input for session: ${sessionId}`);

        const result = await formAgent.processVoiceInput(sessionId, voiceInput, audioFile);

        res.status(200).json({
            success: true,
            message: 'Voice input processed successfully',
            data: result
        });

    } catch (error) {
        logger.error('Failed to process voice input:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process voice input',
            message: error.message
        });
    }
});

/**
 * GET /api/voice-guided-form/status/:sessionId
 * Get the status of a form session
 */
router.get('/status/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        logger.info(`Getting status for session: ${sessionId}`);

        const status = formAgent.getSessionStatus(sessionId);

        if (!status) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        res.status(200).json({
            success: true,
            data: status
        });

    } catch (error) {
        logger.error('Failed to get session status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get session status',
            message: error.message
        });
    }
});

/**
 * POST /api/voice-guided-form/end/:sessionId
 * End a form session
 */
router.post('/end/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        logger.info(`Ending session: ${sessionId}`);

        formAgent.endSession(sessionId);

        res.status(200).json({
            success: true,
            message: 'Session ended successfully'
        });

    } catch (error) {
        logger.error('Failed to end session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to end session',
            message: error.message
        });
    }
});

/**
 * GET /api/voice-guided-form/templates
 * Get available form templates
 */
router.get('/templates', async (req, res) => {
    try {
        const templates = Object.keys(formAgent.formTemplates).map(key => ({
            id: key,
            name: formAgent.formTemplates[key].name,
            fieldCount: formAgent.formTemplates[key].fields.length,
            description: `Form with ${formAgent.formTemplates[key].fields.length} fields for ${formAgent.formTemplates[key].name.toLowerCase()}`
        }));

        res.status(200).json({
            success: true,
            data: {
                templates,
                total: templates.length
            }
        });

    } catch (error) {
        logger.error('Failed to get form templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get form templates',
            message: error.message
        });
    }
});

/**
 * GET /api/voice-guided-form/template/:templateId
 * Get detailed information about a specific form template
 */
router.get('/template/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;

        const template = formAgent.formTemplates[templateId];

        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: templateId,
                name: template.name,
                fields: template.fields.map(field => ({
                    id: field.id,
                    label: field.label,
                    type: field.type,
                    required: field.required,
                    options: field.options,
                    validation: field.validation
                }))
            }
        });

    } catch (error) {
        logger.error('Failed to get form template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get form template',
            message: error.message
        });
    }
});

/**
 * POST /api/voice-guided-form/validate-field
 * Validate a specific field value
 */
router.post('/validate-field', async (req, res) => {
    try {
        const { fieldId, value, formType } = req.body;

        if (!fieldId || !formType) {
            return res.status(400).json({
                success: false,
                error: 'Field ID and form type are required'
            });
        }

        const template = formAgent.formTemplates[formType];
        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Form template not found'
            });
        }

        const field = template.fields.find(f => f.id === fieldId);
        if (!field) {
            return res.status(404).json({
                success: false,
                error: 'Field not found'
            });
        }

        const validationResult = formAgent.validateFieldValue(value, field);

        res.status(200).json({
            success: true,
            data: {
                fieldId,
                value,
                validation: validationResult
            }
        });

    } catch (error) {
        logger.error('Failed to validate field:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate field',
            message: error.message
        });
    }
});

/**
 * GET /api/voice-guided-form/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Voice-guided form service is healthy',
        timestamp: new Date().toISOString(),
        activeSessions: formAgent.activeSessions.size,
        availableTemplates: Object.keys(formAgent.formTemplates).length
    });
});

module.exports = router;
