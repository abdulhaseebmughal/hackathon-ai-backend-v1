const Prescription = require('../models/Prescription');
const User = require('../models/User');
const { callAI } = require('../services/aiService');

const EXPLAIN_SYSTEM = `You are a patient communication specialist. Convert a doctor's prescription into a clear, friendly explanation a patient with no medical background can understand. Write directly to the patient ("You have been prescribed..."), use simple language, keep it under 150 words, and end with a reassuring sentence. No preamble.`;

const createPrescription = async (req, res) => {
    try {
        const { patientId, diagnosis, medicines, instructions, aiExplanation } = req.body;

        const patient = await User.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Use provided aiExplanation or auto-generate one
        let finalAiExplanation = aiExplanation || '';
        if (!finalAiExplanation) {
            const medList = (medicines || []).filter(m => m.name)
                .map((m, i) => `${i + 1}. ${m.name}${m.dosage ? ` — ${m.dosage}` : ''}${m.frequency ? `, ${m.frequency}` : ''}${m.duration ? ` for ${m.duration}` : ''}`)
                .join('\n');
            const result = await callAI({
                systemPrompt: EXPLAIN_SYSTEM,
                userMessage: `Diagnosis: ${diagnosis || 'Not specified'}\nMedicines:\n${medList}\nInstructions: ${instructions || 'None'}`,
                model: 'fast',
                expectJson: false,
                maxTokens: 400,
            });
            if (result.ok) finalAiExplanation = result.message;
        }

        const prescription = await Prescription.create({
            patientId,
            doctorId: req.user._id,
            diagnosis,
            medicines,
            instructions,
            aiExplanation: finalAiExplanation,
        });

        const saved = await Prescription.findById(prescription._id)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name')
            .lean();

        const result = { ...saved, patient: saved.patientId, doctor: saved.doctorId };
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/prescriptions — returns all prescriptions for the logged-in doctor
const getDoctorPrescriptions = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'doctor') {
            filter = { doctorId: req.user._id };
        } else if (req.user.role === 'patient') {
            filter = { patientId: req.user._id };
        }

        const prescriptions = await Prescription.find(filter)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const normalized = prescriptions.map(p => ({
            ...p,
            patient: p.patientId,
            doctor: p.doctorId,
        }));

        res.json(normalized);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPrescriptionsByPatient = async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ patientId: req.params.patientId })
            .populate('patientId', 'name email')
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const normalized = prescriptions.map(p => ({
            ...p,
            patient: p.patientId,
            doctor: p.doctorId,
        }));

        res.json(normalized);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPrescription,
    getDoctorPrescriptions,
    getPrescriptionsByPatient,
};
