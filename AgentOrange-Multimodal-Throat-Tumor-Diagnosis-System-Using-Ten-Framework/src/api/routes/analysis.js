/**
 * Analysis Routes
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/analysis/history
 * Get analysis history for user
 */
router.get('/history', (req, res) => {
    // Mock analysis history
    const history = [
        {
            id: 'analysis_001',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            modalities: ['voice', 'clinical'],
            diagnosis: 'Low Risk - Monitor and Follow-up',
            confidence: 0.85
        },
        {
            id: 'analysis_002',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            modalities: ['voice', 'images'],
            diagnosis: 'Moderate Risk - Recommend Specialist Consultation',
            confidence: 0.78
        }
    ];

    res.json({
        history: history,
        total: history.length
    });
});

/**
 * GET /api/analysis/statistics
 * Get analysis statistics
 */
router.get('/statistics', (req, res) => {
    const statistics = {
        total_analyses: 1250,
        successful_analyses: 1200,
        failed_analyses: 50,
        average_confidence: 0.82,
        modality_usage: {
            voice_only: 450,
            voice_images: 300,
            voice_clinical: 250,
            full_multimodal: 250
        },
        risk_distribution: {
            low: 800,
            moderate: 300,
            high: 150
        }
    };

    res.json(statistics);
});

module.exports = router;
