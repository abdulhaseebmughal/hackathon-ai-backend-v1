const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const DiagnosisLog = require('../models/DiagnosisLog');

const getAdminStats = async (req, res) => {
    try {
        const totalPatients = await Patient.countDocuments({});
        const totalDoctors = await User.countDocuments({ role: 'doctor' });
        const totalAppointments = await Appointment.countDocuments({});

        // Find the most common diagnosis using aggregation Pipeline
        // This assumes AI returns a standard array format in `aiResponse.possibleConditions` 
        // We will unwind that array and group by condition
        const mostCommonDiagnosisAggregate = await DiagnosisLog.aggregate([
            // Unwind the possible conditions array
            { $unwind: "$aiResponse.possibleConditions" },
            // Group by the condition string and count
            {
                $group: {
                    _id: "$aiResponse.possibleConditions",
                    count: { $sum: 1 }
                }
            },
            // Sort descending
            { $sort: { count: -1 } },
            // Get the top 1
            { $limit: 1 }
        ]);

        let mostCommonDiagnosis = 'N/A';
        if (mostCommonDiagnosisAggregate.length > 0) {
            mostCommonDiagnosis = mostCommonDiagnosisAggregate[0]._id;
        }

        res.json({
            totalPatients,
            totalDoctors,
            totalAppointments,
            mostCommonDiagnosis,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAdminStats,
};
