const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generatePrescriptionPDF = (prescription, patient, doctor) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });

            // Generate random filename based on date and patient
            const filename = `prescription_${patient._id}_${Date.now()}.pdf`;
            const docPath = path.join(__dirname, '..', '..', filename); // Save in root of backend for now or return stream

            const stream = fs.createWriteStream(docPath);
            doc.pipe(stream);

            // Header
            doc.fontSize(20).text('AI Clinic Management', { align: 'center' });
            doc.moveDown();
            doc.fontSize(16).text('Medical Prescription', { align: 'center' });
            doc.moveDown(2);

            // Info
            doc.fontSize(12).text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`);
            doc.text(`Doctor: ${doctor.name}`);
            doc.text(`Patient: ${patient.name}`);
            doc.text(`Age: ${patient.age} | Gender: ${patient.gender}`);
            doc.moveDown(2);

            // Medicines
            doc.fontSize(14).text('Medicines:', { underline: true });
            doc.moveDown();
            doc.fontSize(12);
            prescription.medicines.forEach((med, index) => {
                doc.text(`${index + 1}. ${med.name} - ${med.dosage} - ${med.frequency} - ${med.duration}`);
            });
            doc.moveDown(2);

            // Instructions
            doc.fontSize(14).text('Instructions:', { underline: true });
            doc.moveDown();
            doc.fontSize(12).text(prescription.instructions || 'N/A');
            doc.moveDown(2);

            // AI Explanation
            if (prescription.aiExplanation) {
                doc.fontSize(14).text('AI Explanation & Notes:', { underline: true });
                doc.moveDown();
                doc.fontSize(12).text(prescription.aiExplanation);
            }

            // Footer
            doc.moveDown(4);
            doc.fontSize(10).text('This is a system-generated document.', { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve(docPath);
            });

            stream.on('error', (err) => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generatePrescriptionPDF };
