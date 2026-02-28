const mongoose = require('mongoose');

const diagnosisLogSchema = mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        symptoms: {
            type: String,
            required: true,
        },
        clinicalSummary: {
            type: String,
            default: '',
        },
        riskLevel: {
            type: String,
            required: true,
            enum: ['Low', 'Moderate', 'High', 'Critical', 'Unknown'],
            default: 'Unknown',
        },
        urgency: {
            type: String,
            default: '',
        },
        aiResponse: {
            possibleConditions: { type: [String], default: [] },
            suggestedTests:     { type: [String], default: [] },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('DiagnosisLog', diagnosisLogSchema);
