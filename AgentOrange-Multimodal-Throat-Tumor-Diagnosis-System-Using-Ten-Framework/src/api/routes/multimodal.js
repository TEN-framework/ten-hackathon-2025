/**
 * Multimodal Analysis API Routes
 * 
 * Based on documentation:
 * - docs/technical_specifications.md (API Specifications)
 * - docs/multimodal_medical_diagnosis_architecture.md
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getMultimodalManager } = require('../../processors/multimodal-manager');
const { getTENManager } = require('../../ten-framework/ten-manager');
const winston = require('winston');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = process.env.UPLOAD_PATH || './uploads/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow audio, image, and video files
        const allowedExtensions = /\.(jpeg|jpg|png|gif|wav|mp3|flac|m4a|mp4|avi|mov|webm|dicom)$/i;
        const allowedMimeTypes = /^(audio|image|video)\//;
        
        const extname = allowedExtensions.test(file.originalname);
        const mimetype = allowedMimeTypes.test(file.mimetype);

        // Special handling for M4A files which might have different MIME types
        const isM4A = /\.m4a$/i.test(file.originalname);
        
        if ((mimetype && extname) || (isM4A && extname)) {
            return cb(null, true);
        } else {
            console.log(`File upload rejected: ${file.originalname}, MIME: ${file.mimetype}, Extension: ${extname}, MIME match: ${mimetype}`);
            cb(new Error('Invalid file type. Only audio, image, and video files are allowed.'));
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
        new winston.transports.File({ filename: 'logs/multimodal-api.log' })
    ]
});

/**
 * POST /api/multimodal/analyze
 * Comprehensive multimodal analysis endpoint
 */
router.post('/analyze', upload.fields([
    { name: 'voice_file', maxCount: 1 },
    { name: 'medical_images', maxCount: 10 },
    { name: 'video_file', maxCount: 1 }
]), async (req, res) => {
    try {
        logger.info('Starting multimodal analysis request');

        // Validate request
        if (!req.files && !req.body.clinical_data) {
            return res.status(400).json({
                error: 'At least one input modality must be provided',
                required: ['voice_file', 'medical_images', 'clinical_data', 'video_file'],
                provided: Object.keys(req.files || {}).concat(Object.keys(req.body))
            });
        }

        // Prepare input data
        const inputData = await prepareInputData(req);

        // Get multimodal manager
        const multimodalManager = getMultimodalManager();

        // Process multimodal input
        const analysisResults = await multimodalManager.processMultimodalInput(inputData);

        // Generate conversational response using TEN Framework
        const tenManager = getTENManager();
        const conversationResponse = await tenManager.generateConversationResponse(
            req.body.conversation_context || {},
            analysisResults
        );

        // Prepare response
        const response = {
            analysis_id: analysisResults.analysis_id,
            timestamp: analysisResults.timestamp,
            status: 'completed',
            available_modalities: analysisResults.available_modalities,
            diagnosis: analysisResults.diagnosis,
            recommendations: analysisResults.recommendations,
            confidence_assessment: analysisResults.confidence_assessment,
            risk_stratification: analysisResults.risk_stratification,
            follow_up_plan: analysisResults.follow_up_plan,
            conversation_response: conversationResponse,
            processing_time: Date.now() - req.startTime
        };

        logger.info(`Multimodal analysis completed for analysis_id: ${analysisResults.analysis_id}`);
        res.json(response);

    } catch (error) {
        logger.error('Multimodal analysis failed:', error);
        res.status(500).json({
            error: 'Multimodal analysis failed',
            message: error.message,
            analysis_id: `failed_${Date.now()}`
        });
    }
});

/**
 * POST /api/multimodal/voice
 * Voice-only analysis endpoint
 */
router.post('/voice', upload.single('voice_file'), async (req, res) => {
    try {
        logger.info('Starting voice analysis request');

        if (!req.file) {
            return res.status(400).json({
                error: 'Voice file is required',
                accepted_formats: ['wav', 'mp3', 'flac', 'm4a']
            });
        }

        // Prepare voice input data
        const voiceData = {
            filePath: req.file.path,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            duration: req.body.duration ? parseFloat(req.body.duration) : null,
            sampleRate: req.body.sample_rate ? parseInt(req.body.sample_rate) : null,
            bitDepth: req.body.bit_depth ? parseInt(req.body.bit_depth) : null
        };

        // Get multimodal manager
        const multimodalManager = getMultimodalManager();

        // Process voice data
        const voiceResults = await multimodalManager.processVoiceData(voiceData);

        // Generate response
        const response = {
            analysis_id: `voice_${Date.now()}`,
            timestamp: new Date().toISOString(),
            modality: 'voice',
            status: 'completed',
            results: voiceResults,
            processing_time: Date.now() - req.startTime
        };

        logger.info('Voice analysis completed');
        res.json(response);

    } catch (error) {
        logger.error('Voice analysis failed:', error);
        res.status(500).json({
            error: 'Voice analysis failed',
            message: error.message
        });
    }
});

/**
 * POST /api/multimodal/images
 * Medical image analysis endpoint
 */
router.post('/images', upload.array('medical_images', 10), async (req, res) => {
    try {
        logger.info('Starting medical image analysis request');

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: 'At least one medical image is required',
                accepted_formats: ['jpg', 'png', 'tiff', 'dicom']
            });
        }

        // Prepare image input data
        const imageData = req.files.map(file => ({
            filePath: file.path,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            format: path.extname(file.originalname).toLowerCase().substring(1),
            imageType: req.body.image_type || 'laryngoscopy',
            dicomMetadata: req.body.dicom_metadata ? JSON.parse(req.body.dicom_metadata) : null
        }));

        // Get multimodal manager
        const multimodalManager = getMultimodalManager();

        // Process image data
        const imageResults = await multimodalManager.processImageData(imageData);

        // Generate response
        const response = {
            analysis_id: `images_${Date.now()}`,
            timestamp: new Date().toISOString(),
            modality: 'images',
            status: 'completed',
            image_count: req.files.length,
            results: imageResults,
            processing_time: Date.now() - req.startTime
        };

        logger.info('Medical image analysis completed');
        res.json(response);

    } catch (error) {
        logger.error('Medical image analysis failed:', error);
        res.status(500).json({
            error: 'Medical image analysis failed',
            message: error.message
        });
    }
});

/**
 * POST /api/multimodal/clinical
 * Clinical data analysis endpoint
 */
router.post('/clinical', async (req, res) => {
    try {
        logger.info('Starting clinical data analysis request');

        if (!req.body.clinical_data) {
            return res.status(400).json({
                error: 'Clinical data is required',
                required_fields: ['age', 'gender', 'current_symptoms']
            });
        }

        // Prepare clinical input data
        const clinicalData = {
            data: req.body.clinical_data,
            format: req.body.format || 'json',
            size: JSON.stringify(req.body.clinical_data).length
        };

        // Get multimodal manager
        const multimodalManager = getMultimodalManager();

        // Process clinical data
        const clinicalResults = await multimodalManager.processClinicalData(clinicalData);

        // Generate response
        const response = {
            analysis_id: `clinical_${Date.now()}`,
            timestamp: new Date().toISOString(),
            modality: 'clinical',
            status: 'completed',
            results: clinicalResults,
            processing_time: Date.now() - req.startTime
        };

        logger.info('Clinical data analysis completed');
        res.json(response);

    } catch (error) {
        logger.error('Clinical data analysis failed:', error);
        res.status(500).json({
            error: 'Clinical data analysis failed',
            message: error.message
        });
    }
});

/**
 * GET /api/multimodal/analysis/:analysis_id
 * Retrieve analysis results by ID
 */
router.get('/analysis/:analysis_id', async (req, res) => {
    try {
        const { analysis_id } = req.params;

        logger.info(`Retrieving analysis results for ID: ${analysis_id}`);

        // In a real implementation, this would retrieve from database
        // For now, we'll return a mock response
        const response = {
            analysis_id: analysis_id,
            timestamp: new Date().toISOString(),
            status: 'completed',
            message: 'Analysis results retrieved successfully',
            note: 'This is a mock response. In production, results would be retrieved from database.'
        };

        res.json(response);

    } catch (error) {
        logger.error('Failed to retrieve analysis results:', error);
        res.status(500).json({
            error: 'Failed to retrieve analysis results',
            message: error.message
        });
    }
});

/**
 * GET /api/multimodal/status
 * Get system status and capabilities
 */
router.get('/status', async (req, res) => {
    try {
        const response = {
            system: 'Multimodal Throat Tumor Diagnosis System',
            version: '1.0.0',
            status: 'operational',
            capabilities: {
                voice_analysis: {
                    enabled: process.env.AUDIO_PROCESSING_ENABLED === 'true',
                    supported_formats: ['wav', 'mp3', 'flac', 'm4a'],
                    max_duration: 30,
                    min_duration: 10
                },
                image_analysis: {
                    enabled: process.env.IMAGE_PROCESSING_ENABLED === 'true',
                    supported_formats: ['jpg', 'png', 'tiff', 'dicom'],
                    max_file_size: '50MB',
                    max_images: 10
                },
                clinical_analysis: {
                    enabled: process.env.CLINICAL_DATA_ENABLED === 'true',
                    supported_formats: ['json', 'xml', 'csv'],
                    max_size: '10MB'
                },
                video_analysis: {
                    enabled: process.env.VIDEO_PROCESSING_ENABLED === 'true',
                    supported_formats: ['mp4', 'avi', 'mov', 'webm'],
                    max_duration: 60
                }
            },
            multimodal_fusion: {
                enabled: true,
                method: 'attention-based',
                cross_modal_validation: true
            },
            compliance: {
                hipaa: process.env.HIPAA_COMPLIANCE === 'true',
                audit_logging: process.env.AUDIT_LOGGING === 'true'
            }
        };

        res.json(response);

    } catch (error) {
        logger.error('Failed to get system status:', error);
        res.status(500).json({
            error: 'Failed to get system status',
            message: error.message
        });
    }
});

// Helper function to prepare input data
async function prepareInputData(req) {
    const inputData = {};

    // Process voice file
    if (req.files && req.files.voice_file) {
        const voiceFile = req.files.voice_file[0];
        inputData.voice = {
            audio_file: voiceFile.path,  // Changed from filePath to audio_file
            filePath: voiceFile.path,    // Keep filePath for backward compatibility
            originalName: voiceFile.originalname,
            size: voiceFile.size,
            mimetype: voiceFile.mimetype,
            duration: req.body.voice_duration ? parseFloat(req.body.voice_duration) : null,
            sampleRate: req.body.voice_sample_rate ? parseInt(req.body.voice_sample_rate) : null,
            bitDepth: req.body.voice_bit_depth ? parseInt(req.body.voice_bit_depth) : null
        };
    }

    // Process medical images
    if (req.files && req.files.medical_images) {
        inputData.medical_images = req.files.medical_images.map(file => ({
            filePath: file.path,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            format: path.extname(file.originalname).toLowerCase().substring(1),
            imageType: req.body.image_type || 'laryngoscopy',
            dicomMetadata: req.body.dicom_metadata ? JSON.parse(req.body.dicom_metadata) : null
        }));
    }

    // Process video file
    if (req.files && req.files.video_file) {
        const videoFile = req.files.video_file[0];
        inputData.real_time_video = {
            filePath: videoFile.path,
            originalName: videoFile.originalname,
            size: videoFile.size,
            mimetype: videoFile.mimetype,
            duration: req.body.video_duration ? parseFloat(req.body.video_duration) : null,
            resolution: req.body.video_resolution || null,
            frameRate: req.body.video_frame_rate ? parseInt(req.body.video_frame_rate) : null
        };
    }

    // Process clinical data
    if (req.body.clinical_data) {
        inputData.clinical_data = {
            data: typeof req.body.clinical_data === 'string' 
                ? JSON.parse(req.body.clinical_data) 
                : req.body.clinical_data,
            format: req.body.clinical_format || 'json',
            size: JSON.stringify(req.body.clinical_data).length
        };
    }

    // Process sensor data
    if (req.body.sensor_data) {
        inputData.sensor_data = {
            data: typeof req.body.sensor_data === 'string'
                ? JSON.parse(req.body.sensor_data)
                : req.body.sensor_data,
            format: req.body.sensor_format || 'json'
        };
    }

    return inputData;
}

// Middleware to track request start time
router.use((req, res, next) => {
    req.startTime = Date.now();
    next();
});

module.exports = router;
