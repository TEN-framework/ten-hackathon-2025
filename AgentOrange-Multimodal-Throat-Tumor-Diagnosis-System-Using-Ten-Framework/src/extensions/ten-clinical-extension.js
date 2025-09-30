/**
 * TEN Framework Clinical Data Extension for Medical Data Processing
 * Real implementation using SiliconFlow (OpenAI-compatible) for clinical NLP and medical entity recognition
 */

// TEN Framework Extension - communicates with TEN service
// Base Extension class for service-based integration
class Extension {
    constructor(config) {
        this.name = config.name;
        this.version = config.version;
        this.description = config.description;
        this.capabilities = config.capabilities || [];
    }
}
const OpenAI = require('openai');
const winston = require('winston');

class TENClinicalExtension extends Extension {
    constructor(config) {
        super({
            name: 'voice-tumor-diagnosis-clinical',
            version: '1.0.0',
            description: 'Clinical data processing extension for tumor diagnosis',
            capabilities: [
                'clinical-nlp',
                'medical-entity-recognition',
                'structured-data-processing',
                'risk-factor-analysis'
            ]
        });

        this.config = config;
        
        // Initialize SiliconFlow client (OpenAI-compatible)
        this.openai = new OpenAI({
            apiKey: config.apiKeys.siliconflow?.apiKey || config.apiKeys.openai,
            baseURL: config.apiKeys.siliconflow?.baseUrl || 'https://api.siliconflow.com/v1'
        });

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/ten-clinical-extension.log' })
            ]
        });
    }

    async process(input) {
        try {
            this.logger.info('Processing clinical data with SiliconFlow (OpenAI-compatible) API...');

            const results = {
                entities: null,
                riskFactors: null,
                symptoms: null,
                medicalHistory: null,
                structuredData: null,
                confidence: 0
            };

            // Process clinical text data
            if (input.clinicalText || input.medicalNotes) {
                const entities = await this.extractMedicalEntities(input);
                results.entities = entities;
            }

            // Analyze risk factors
            const riskFactors = await this.analyzeRiskFactors(input, results.entities);
            results.riskFactors = riskFactors;

            // Extract symptoms
            const symptoms = await this.extractSymptoms(input, results.entities);
            results.symptoms = symptoms;

            // Process medical history
            const medicalHistory = await this.processMedicalHistory(input);
            results.medicalHistory = medicalHistory;

            // Process structured data
            const structuredData = await this.processStructuredData(input);
            results.structuredData = structuredData;

            // Calculate overall confidence
            results.confidence = this.calculateConfidence(results);

            this.logger.info('Clinical data processing completed successfully');
            return results;

        } catch (error) {
            this.logger.error('Failed to process clinical data:', error);
            throw error;
        }
    }

    async extractMedicalEntities(input) {
        try {
            const clinicalText = input.clinicalText || input.medicalNotes || '';
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `You are a medical AI assistant specialized in extracting medical entities from clinical text. 
                        Extract and categorize the following medical entities:
                        1. Symptoms (e.g., hoarseness, difficulty swallowing, throat pain)
                        2. Medical conditions (e.g., laryngitis, GERD, vocal cord nodules)
                        3. Medications (e.g., proton pump inhibitors, antibiotics)
                        4. Procedures (e.g., laryngoscopy, biopsy, surgery)
                        5. Anatomical structures (e.g., larynx, vocal cords, throat)
                        6. Risk factors (e.g., smoking, alcohol use, age)
                        7. Vital signs and lab values
                        8. Temporal information (e.g., duration, onset)
                        
                        Return the results in a structured JSON format.`
                    },
                    {
                        role: "user",
                        content: clinicalText
                    }
                ],
                max_tokens: 1500,
                temperature: 0.1
            });

            const entitiesText = response.choices[0].message.content;
            
            // Parse the JSON response
            let entities;
            try {
                entities = JSON.parse(entitiesText);
            } catch (parseError) {
                // Fallback parsing if JSON is malformed
                entities = this.parseEntitiesFallback(entitiesText);
            }

            return {
                symptoms: entities.symptoms || [],
                conditions: entities.conditions || [],
                medications: entities.medications || [],
                procedures: entities.procedures || [],
                anatomicalStructures: entities.anatomicalStructures || [],
                riskFactors: entities.riskFactors || [],
                vitalSigns: entities.vitalSigns || [],
                temporalInfo: entities.temporalInfo || [],
                confidence: 0.9
            };

        } catch (error) {
            this.logger.error('Medical entity extraction failed:', error);
            throw error;
        }
    }

    async analyzeRiskFactors(input, entities) {
        try {
            const riskFactors = {
                smoking: this.assessSmokingRisk(input, entities),
                alcohol: this.assessAlcoholRisk(input, entities),
                age: this.assessAgeRisk(input, entities),
                gender: this.assessGenderRisk(input, entities),
                occupational: this.assessOccupationalRisk(input, entities),
                familyHistory: this.assessFamilyHistoryRisk(input, entities),
                medicalHistory: this.assessMedicalHistoryRisk(input, entities),
                environmental: this.assessEnvironmentalRisk(input, entities)
            };

            // Calculate overall risk score
            const riskScores = Object.values(riskFactors).filter(score => typeof score === 'number');
            riskFactors.overallRisk = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;

            return riskFactors;

        } catch (error) {
            this.logger.error('Risk factor analysis failed:', error);
            throw error;
        }
    }

    async extractSymptoms(input, entities) {
        try {
            const symptoms = {
                voiceRelated: this.extractVoiceSymptoms(entities),
                swallowingRelated: this.extractSwallowingSymptoms(entities),
                breathingRelated: this.extractBreathingSymptoms(entities),
                painRelated: this.extractPainSymptoms(entities),
                general: this.extractGeneralSymptoms(entities)
            };

            // Calculate symptom severity
            symptoms.severity = this.calculateSymptomSeverity(symptoms);
            symptoms.duration = this.extractSymptomDuration(entities);

            return symptoms;

        } catch (error) {
            this.logger.error('Symptom extraction failed:', error);
            throw error;
        }
    }

    async processMedicalHistory(input) {
        try {
            const history = {
                previousDiagnoses: this.extractPreviousDiagnoses(input),
                surgeries: this.extractSurgeries(input),
                medications: this.extractMedications(input),
                allergies: this.extractAllergies(input),
                familyHistory: this.extractFamilyHistory(input)
            };

            return history;

        } catch (error) {
            this.logger.error('Medical history processing failed:', error);
            throw error;
        }
    }

    async processStructuredData(input) {
        try {
            const structuredData = {
                demographics: this.processDemographics(input),
                vitalSigns: this.processVitalSigns(input),
                labResults: this.processLabResults(input),
                imagingResults: this.processImagingResults(input)
            };

            return structuredData;

        } catch (error) {
            this.logger.error('Structured data processing failed:', error);
            throw error;
        }
    }

    parseEntitiesFallback(text) {
        // Fallback parsing when JSON parsing fails
        const entities = {
            symptoms: [],
            conditions: [],
            medications: [],
            procedures: [],
            anatomicalStructures: [],
            riskFactors: [],
            vitalSigns: [],
            temporalInfo: []
        };

        // Simple text-based extraction
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.toLowerCase().includes('symptom')) {
                entities.symptoms.push(line.trim());
            } else if (line.toLowerCase().includes('condition') || line.toLowerCase().includes('diagnosis')) {
                entities.conditions.push(line.trim());
            } else if (line.toLowerCase().includes('medication') || line.toLowerCase().includes('drug')) {
                entities.medications.push(line.trim());
            }
        }

        return entities;
    }

    assessSmokingRisk(input, entities) {
        const smokingIndicators = ['smoking', 'cigarette', 'tobacco', 'smoker', 'pack-years'];
        const text = JSON.stringify(input).toLowerCase();
        
        for (const indicator of smokingIndicators) {
            if (text.includes(indicator)) {
                return 0.8; // High risk for throat cancer
            }
        }
        
        return 0.1; // Low risk if no smoking indicators
    }

    assessAlcoholRisk(input, entities) {
        const alcoholIndicators = ['alcohol', 'drinking', 'ethanol', 'heavy drinking'];
        const text = JSON.stringify(input).toLowerCase();
        
        for (const indicator of alcoholIndicators) {
            if (text.includes(indicator)) {
                return 0.6; // Moderate risk
            }
        }
        
        return 0.1; // Low risk
    }

    assessAgeRisk(input, entities) {
        const age = input.age || this.extractAgeFromText(JSON.stringify(input));
        
        if (age >= 65) return 0.7; // Higher risk for older adults
        if (age >= 45) return 0.4; // Moderate risk
        return 0.2; // Lower risk for younger adults
    }

    assessGenderRisk(input, entities) {
        const gender = input.gender || this.extractGenderFromText(JSON.stringify(input));
        
        // Males have higher risk of throat cancer
        return gender === 'male' ? 0.6 : 0.3;
    }

    assessOccupationalRisk(input, entities) {
        const occupationalIndicators = ['asbestos', 'chemical', 'industrial', 'construction', 'mining'];
        const text = JSON.stringify(input).toLowerCase();
        
        for (const indicator of occupationalIndicators) {
            if (text.includes(indicator)) {
                return 0.5; // Moderate occupational risk
            }
        }
        
        return 0.1; // Low occupational risk
    }

    assessFamilyHistoryRisk(input, entities) {
        const familyIndicators = ['family history', 'genetic', 'hereditary', 'cancer in family'];
        const text = JSON.stringify(input).toLowerCase();
        
        for (const indicator of familyIndicators) {
            if (text.includes(indicator)) {
                return 0.4; // Moderate genetic risk
            }
        }
        
        return 0.1; // Low genetic risk
    }

    assessMedicalHistoryRisk(input, entities) {
        const medicalRiskIndicators = ['GERD', 'reflux', 'HPV', 'EBV', 'previous cancer'];
        const text = JSON.stringify(input).toLowerCase();
        
        for (const indicator of medicalRiskIndicators) {
            if (text.includes(indicator)) {
                return 0.6; // Moderate to high medical risk
            }
        }
        
        return 0.2; // Low medical risk
    }

    assessEnvironmentalRisk(input, entities) {
        const environmentalIndicators = ['pollution', 'air quality', 'chemical exposure'];
        const text = JSON.stringify(input).toLowerCase();
        
        for (const indicator of environmentalIndicators) {
            if (text.includes(indicator)) {
                return 0.3; // Moderate environmental risk
            }
        }
        
        return 0.1; // Low environmental risk
    }

    extractVoiceSymptoms(entities) {
        const voiceSymptoms = ['hoarseness', 'voice change', 'voice loss', 'vocal fatigue', 'voice strain'];
        return entities.symptoms?.filter(symptom => 
            voiceSymptoms.some(vs => symptom.toLowerCase().includes(vs))
        ) || [];
    }

    extractSwallowingSymptoms(entities) {
        const swallowingSymptoms = ['dysphagia', 'difficulty swallowing', 'painful swallowing', 'choking'];
        return entities.symptoms?.filter(symptom => 
            swallowingSymptoms.some(ss => symptom.toLowerCase().includes(ss))
        ) || [];
    }

    extractBreathingSymptoms(entities) {
        const breathingSymptoms = ['stridor', 'breathing difficulty', 'shortness of breath', 'wheezing'];
        return entities.symptoms?.filter(symptom => 
            breathingSymptoms.some(bs => symptom.toLowerCase().includes(bs))
        ) || [];
    }

    extractPainSymptoms(entities) {
        const painSymptoms = ['throat pain', 'neck pain', 'ear pain', 'painful swallowing'];
        return entities.symptoms?.filter(symptom => 
            painSymptoms.some(ps => symptom.toLowerCase().includes(ps))
        ) || [];
    }

    extractGeneralSymptoms(entities) {
        const generalSymptoms = ['weight loss', 'fatigue', 'fever', 'night sweats'];
        return entities.symptoms?.filter(symptom => 
            generalSymptoms.some(gs => symptom.toLowerCase().includes(gs))
        ) || [];
    }

    calculateSymptomSeverity(symptoms) {
        const allSymptoms = [
            ...symptoms.voiceRelated,
            ...symptoms.swallowingRelated,
            ...symptoms.breathingRelated,
            ...symptoms.painRelated,
            ...symptoms.general
        ];

        if (allSymptoms.length === 0) return 'none';
        if (allSymptoms.length <= 2) return 'mild';
        if (allSymptoms.length <= 4) return 'moderate';
        return 'severe';
    }

    extractSymptomDuration(entities) {
        const temporalInfo = entities.temporalInfo || [];
        const durationKeywords = ['weeks', 'months', 'years', 'days'];
        
        for (const info of temporalInfo) {
            for (const keyword of durationKeywords) {
                if (info.toLowerCase().includes(keyword)) {
                    return info;
                }
            }
        }
        
        return 'unknown';
    }

    extractPreviousDiagnoses(input) {
        const text = JSON.stringify(input).toLowerCase();
        const diagnoses = [];
        
        const diagnosisKeywords = ['diagnosed with', 'history of', 'previous diagnosis'];
        for (const keyword of diagnosisKeywords) {
            if (text.includes(keyword)) {
                // Extract diagnosis text (simplified)
                diagnoses.push('Previous diagnosis mentioned');
            }
        }
        
        return diagnoses;
    }

    extractSurgeries(input) {
        const text = JSON.stringify(input).toLowerCase();
        const surgeries = [];
        
        const surgeryKeywords = ['surgery', 'operation', 'procedure', 'resection'];
        for (const keyword of surgeryKeywords) {
            if (text.includes(keyword)) {
                surgeries.push('Surgical procedure mentioned');
            }
        }
        
        return surgeries;
    }

    extractMedications(input) {
        return input.medications || [];
    }

    extractAllergies(input) {
        return input.allergies || [];
    }

    extractFamilyHistory(input) {
        const text = JSON.stringify(input).toLowerCase();
        const familyHistory = [];
        
        if (text.includes('family history')) {
            familyHistory.push('Family history of medical conditions');
        }
        
        return familyHistory;
    }

    processDemographics(input) {
        return {
            age: input.age,
            gender: input.gender,
            ethnicity: input.ethnicity,
            occupation: input.occupation
        };
    }

    processVitalSigns(input) {
        return {
            bloodPressure: input.bloodPressure,
            heartRate: input.heartRate,
            temperature: input.temperature,
            respiratoryRate: input.respiratoryRate
        };
    }

    processLabResults(input) {
        return {
            bloodWork: input.bloodWork,
            urinalysis: input.urinalysis,
            otherLabs: input.otherLabs
        };
    }

    processImagingResults(input) {
        return {
            ctScan: input.ctScan,
            mri: input.mri,
            xray: input.xray,
            otherImaging: input.otherImaging
        };
    }

    extractAgeFromText(text) {
        const ageMatch = text.match(/(\d+)\s*(?:years?|y\.o\.|yo)/i);
        return ageMatch ? parseInt(ageMatch[1]) : null;
    }

    extractGenderFromText(text) {
        if (text.includes('male') || text.includes('man')) return 'male';
        if (text.includes('female') || text.includes('woman')) return 'female';
        return null;
    }

    calculateConfidence(results) {
        // Calculate overall confidence in the analysis
        const entityConfidence = results.entities ? results.entities.confidence : 0.3;
        const riskConfidence = results.riskFactors ? 0.8 : 0.3;
        const symptomConfidence = results.symptoms ? 0.7 : 0.3;
        const historyConfidence = results.medicalHistory ? 0.6 : 0.3;
        
        return (entityConfidence + riskConfidence + symptomConfidence + historyConfidence) / 4;
    }
}

module.exports = TENClinicalExtension;

