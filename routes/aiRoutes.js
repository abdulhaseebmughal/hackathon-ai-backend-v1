const express = require('express');
const router = express.Router();
const { symptomChecker, explainPrescription, smartTriage } = require('../controllers/aiController');
const { verifyToken, authorizeRoles, checkSubscription } = require('../middleware/authMiddleware');

// Symptom Checker — Pro doctors only
router.post('/symptom-check',
    verifyToken,
    authorizeRoles(['doctor']),
    checkSubscription('pro'),
    symptomChecker
);

// Prescription Explainer — all doctors
router.post('/explain-prescription',
    verifyToken,
    authorizeRoles(['doctor']),
    explainPrescription
);

// Smart Triage — doctors and receptionists
router.post('/triage',
    verifyToken,
    authorizeRoles(['doctor', 'receptionist']),
    smartTriage
);

module.exports = router;
