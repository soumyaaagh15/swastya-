import { PrescriptionOCRResult } from '../types';

export class OCRService {
  static simulatePrescriptionScan(fileName: string): Promise<PrescriptionOCRResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          prescriptionId: `presc_ocr_${Date.now().toString().slice(-4)}`,
          doctorName: 'Dr. Ananya Sen (MD, DM)',
          clinicHospital: 'SCB Cardiology OP Clinic',
          date: new Date().toISOString().split('T')[0],
          rawText: `
          SCB MEDICAL COLLEGE & HOSPITAL
          OPD Card #89412 - Dept of Cardiology
          Patient: Aarav Sharma (Age: 42, M) Date: ${new Date().toLocaleDateString()}
          
          Rx:
          1. Tab. Paracetamol 500mg -- 1-0-1 (3 days) after food
          2. Tab. Pantoprazole 40mg -- 1-0-0 (7 days) 30 min before breakfast
          3. Tab. Telmisartan 40mg -- 1-0-0 (30 days) morning
          
          Follow up after 15 days.
          Dr. Ananya Sen
          `,
          confidenceScore: 0.94,
          extractedMedicines: [
            {
              id: 'ocr_med_1',
              name: 'Paracetamol 500 mg',
              dosageStrength: '500 mg',
              frequency: 'Twice daily',
              timeOfDay: ['Morning', 'Night'],
              durationDays: 3,
              instructions: 'Take after meals for fever or ache'
            },
            {
              id: 'ocr_med_2',
              name: 'Pantoprazole 40 mg',
              dosageStrength: '40 mg',
              frequency: 'Once daily',
              timeOfDay: ['Morning'],
              durationDays: 7,
              instructions: 'Take 30 minutes before breakfast'
            },
            {
              id: 'ocr_med_3',
              name: 'Telmisartan 40 mg',
              dosageStrength: '40 mg',
              frequency: 'Once daily',
              timeOfDay: ['Morning'],
              durationDays: 30,
              instructions: 'Take after morning breakfast'
            }
          ]
        });
      }, 1500); // Realistic scanning delay
    });
  }
}
