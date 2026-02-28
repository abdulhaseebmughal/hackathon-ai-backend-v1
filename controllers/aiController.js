/**
 * AI-CLIENT Controller — ClinIQ Pro
 * Handles all AI-powered features using Anthropic Claude.
 */

const DiagnosisLog = require('../models/DiagnosisLog');
const { callAI } = require('../services/aiService');

// ─── System Prompts ────────────────────────────────────────────────────────────

const SYMPTOM_CHECKER_SYSTEM = `You are a clinical decision-support AI integrated into ClinIQ Pro — a licensed clinic management system used exclusively by qualified, registered medical professionals.

Your role is to assist the attending doctor by generating a structured differential diagnosis based on the patient information provided. You are a medical second-opinion tool, NOT a replacement for physician judgment.

CRITICAL RULES:
1. Respond with ONLY a valid JSON object. Zero markdown, zero prose, zero extra text — pure JSON only.
2. Order "possibleConditions" from most to least likely based on the symptom profile.
3. "riskLevel" must be exactly one of: "Low", "Moderate", "High", "Critical" — nothing else.
4. "suggestedTests" should be practical, evidence-based investigations the doctor can order.
5. "clinicalSummary" must be a brief, professional 1-2 sentence summary for the doctor.
6. "urgency" must clearly state the recommended follow-up timeline.
7. If symptoms are vague or insufficient for a differential, still return the JSON with appropriately cautious values.
8. Base responses on current clinical guidelines (WHO, UpToDate standards).

STRICT OUTPUT FORMAT — respond with exactly this JSON structure:
{
  "possibleConditions": ["string", "string", ...],
  "riskLevel": "Low | Moderate | High | Critical",
  "suggestedTests": ["string", "string", ...],
  "clinicalSummary": "string",
  "urgency": "string"
}`;

const PRESCRIPTION_EXPLAINER_SYSTEM = `You are a patient communication specialist at ClinIQ Pro clinic. Your sole job is to convert a doctor's prescription into a clear, friendly, and reassuring explanation that any patient — regardless of medical knowledge — can fully understand.

STYLE GUIDELINES:
1. Write directly to the patient in second person: "You have been prescribed..."
2. Use everyday language — never use Latin abbreviations (say "twice a day" not "BID", "before meals" not "AC")
3. For each medicine, briefly explain what it does in one simple sentence
4. Mention the most important practical notes: take with/without food, avoid alcohol, common side effects to watch for
5. Keep the total response under 180 words
6. Use short paragraphs (not bullet points) for a natural, conversational feel
7. End with one warm, reassuring closing sentence
8. Never alarm the patient — be supportive and positive
9. Do NOT start with "Sure", "Of course", or any AI preamble — go straight into the explanation`;

const SMART_TRIAGE_SYSTEM = `You are an intelligent triage assistant at ClinIQ Pro clinic. You help the front desk and doctors quickly assess the urgency of an incoming patient visit based on the provided reason and patient details.

RULES:
1. Respond with ONLY a valid JSON object — no markdown, no extra text.
2. "priority" must be exactly one of: "Emergency", "Urgent", "Semi-Urgent", "Routine"
3. "waitTime" is the recommended maximum wait time (e.g., "Immediately", "Within 1 hour", "Within 24 hours", "Schedule within a week")
4. "recommendation" is a concise, actionable note for the receptionist (1 sentence)
5. "flagForDoctor" is a boolean — true if the doctor should be informed immediately

OUTPUT FORMAT:
{
  "priority": "Emergency | Urgent | Semi-Urgent | Routine",
  "waitTime": "string",
  "recommendation": "string",
  "flagForDoctor": true | false
}`;

// ─── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/ai/symptom-check
 * Doctor-only, Pro plan required
 */
const symptomChecker = async (req, res) => {
    try {
        const { symptoms, age, gender, history, patientId } = req.body;

        if (!symptoms || symptoms.trim().length < 5) {
            return res.status(400).json({ message: 'Please provide a meaningful description of symptoms.' });
        }

        const userMessage = `Analyze the following patient case and return a differential diagnosis:

Patient Demographics:
- Age: ${age || 'Not specified'}
- Gender: ${gender || 'Not specified'}

Presenting Symptoms:
${symptoms.trim()}

Relevant Medical History:
${history?.trim() || 'No known history provided'}

Provide a structured clinical analysis.`;

        const result = await callAI({
            systemPrompt: SYMPTOM_CHECKER_SYSTEM,
            userMessage,
            model: 'quality',
            expectJson: true,
            maxTokens: 1200,
        });

        if (!result.ok) {
            return res.status(503).json({ message: `AI service error: ${result.message}` });
        }

        const ai = result.data;

        // Save to DiagnosisLog
        const diagnosisLog = await DiagnosisLog.create({
            patientId:    patientId || undefined,
            doctorId:     req.user._id,
            symptoms:     symptoms.trim(),
            clinicalSummary: ai.clinicalSummary || '',
            riskLevel:    ai.riskLevel || 'Unknown',
            urgency:      ai.urgency   || 'Review with patient',
            aiResponse: {
                possibleConditions: ai.possibleConditions || [],
                suggestedTests:     ai.suggestedTests     || [],
            },
        });

        return res.status(201).json({
            _id:              diagnosisLog._id,
            riskLevel:        diagnosisLog.riskLevel,
            urgency:          diagnosisLog.urgency,
            clinicalSummary:  diagnosisLog.clinicalSummary,
            conditions:       diagnosisLog.aiResponse.possibleConditions,
            suggestedTriages: diagnosisLog.aiResponse.suggestedTests,
        });

    } catch (error) {
        console.error('[symptomChecker]', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * POST /api/ai/explain-prescription
 * Doctor-only (no plan restriction — available to all doctors)
 */
const explainPrescription = async (req, res) => {
    try {
        const { diagnosis, medicines, instructions } = req.body;

        if (!medicines || medicines.length === 0 || !medicines[0]?.name) {
            return res.status(400).json({ message: 'At least one medicine with a name is required.' });
        }

        const medList = medicines
            .filter(m => m.name)
            .map((m, i) => `${i + 1}. ${m.name}${m.dosage ? ` — ${m.dosage}` : ''}${m.frequency ? `, ${m.frequency}` : ''}${m.duration ? ` for ${m.duration}` : ''}`)
            .join('\n');

        const userMessage = `Generate a patient-friendly explanation for this prescription:

Diagnosis: ${diagnosis || 'Not specified'}

Prescribed Medicines:
${medList}

Doctor's Additional Instructions: ${instructions?.trim() || 'None'}

Write the explanation now.`;

        const result = await callAI({
            systemPrompt: PRESCRIPTION_EXPLAINER_SYSTEM,
            userMessage,
            model: 'fast',
            expectJson: false,
            maxTokens: 600,
        });

        if (!result.ok) {
            return res.status(503).json({ message: `AI service error: ${result.message}` });
        }

        return res.json({
            explanation: result.message,
            fallback: false,
        });

    } catch (error) {
        console.error('[explainPrescription]', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * POST /api/ai/triage
 * Receptionist or Doctor — assess appointment urgency
 */
const smartTriage = async (req, res) => {
    try {
        const { reason, age, chiefComplaint } = req.body;

        if (!reason && !chiefComplaint) {
            return res.status(400).json({ message: 'Reason for visit is required.' });
        }

        const userMessage = `Triage the following patient visit:

Patient Age: ${age || 'Not specified'}
Reason for Visit: ${reason || chiefComplaint}

Assess urgency and provide your triage recommendation.`;

        const result = await callAI({
            systemPrompt: SMART_TRIAGE_SYSTEM,
            userMessage,
            model: 'fast',
            expectJson: true,
            maxTokens: 300,
        });

        if (!result.ok) {
            return res.status(503).json({ message: `AI service error: ${result.message}` });
        }

        return res.json(result.data);

    } catch (error) {
        console.error('[smartTriage]', error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { symptomChecker, explainPrescription, smartTriage };
