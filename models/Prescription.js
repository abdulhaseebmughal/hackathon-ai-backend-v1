const mongoose = require('mongoose');

const medicineSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
    },
    { _id: false }
);

const prescriptionSchema = mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        diagnosis: {
            type: String,
        },
        medicines: [medicineSchema],
        instructions: {
            type: String,
        },
        aiExplanation: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
