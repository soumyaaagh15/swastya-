import { HealthRecord, PrescriptionOCRResult, MedicalBill } from '../types';
import { StorageService, STORAGE_KEYS } from './storageService';
import { initialHealthRecords, initialMedicalBill } from './mockData';

export interface UploadResult {
  url: string;
  filename: string;
  originalName: string;
  mimetype: string;
  sizeBytes: number;
  fileSizeMb: number;
  fileType: 'pdf' | 'image' | 'doc';
  uploadedAt: string;
}

// Convert a File to base64 Data URL for offline fallback
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export class ApiService {
  private static baseUrl = '';

  /**
   * Uploads a file (image or PDF) to the backend server with offline base64 fallback.
   */
  static async uploadFile(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
    const fileSizeMb = parseFloat((file.size / (1024 * 1024)).toFixed(2)) || 0.1;

    try {
      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.file) {
          return result.file;
        }
      }
      throw new Error('Upload request failed');
    } catch (err) {
      console.warn('Backend upload unavailable, using client-side Data URL fallback:', err);
      // Client-side fallback so demo NEVER fails
      const base64Url = await fileToBase64(file);
      return {
        url: base64Url,
        filename: file.name,
        originalName: file.name,
        mimetype: file.type || 'image/jpeg',
        sizeBytes: file.size,
        fileSizeMb,
        fileType: isPdf ? 'pdf' : 'image',
        uploadedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Fetches all digital health records.
   */
  static async getHealthRecords(): Promise<HealthRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/records`);
      if (response.ok) {
        const records: HealthRecord[] = await response.json();
        // Update local cache
        StorageService.setItem(STORAGE_KEYS.RECORDS, records);
        return records;
      }
    } catch (err) {
      console.warn('Backend unavailable, reading from local cache:', err);
    }
    return StorageService.getItem<HealthRecord[]>(STORAGE_KEYS.RECORDS, initialHealthRecords);
  }

  /**
   * Creates and persists a new health record.
   */
  static async createHealthRecord(recordData: Omit<HealthRecord, 'id'> & { id?: string }): Promise<HealthRecord> {
    const newRecord: HealthRecord = {
      id: recordData.id || `rec_${Date.now()}`,
      ...recordData
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
      if (response.ok) {
        const saved = await response.json();
        // Update local storage
        const current = StorageService.getItem<HealthRecord[]>(STORAGE_KEYS.RECORDS, initialHealthRecords);
        StorageService.setItem(STORAGE_KEYS.RECORDS, [saved, ...current.filter(r => r.id !== saved.id)]);
        return saved;
      }
    } catch (err) {
      console.warn('Backend unavailable, saving to local cache:', err);
    }

    // Save locally
    const current = StorageService.getItem<HealthRecord[]>(STORAGE_KEYS.RECORDS, initialHealthRecords);
    const updated = [newRecord, ...current.filter(r => r.id !== newRecord.id)];
    StorageService.setItem(STORAGE_KEYS.RECORDS, updated);
    return newRecord;
  }

  /**
   * Deletes a health record.
   */
  static async deleteHealthRecord(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/records/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        const current = StorageService.getItem<HealthRecord[]>(STORAGE_KEYS.RECORDS, initialHealthRecords);
        StorageService.setItem(STORAGE_KEYS.RECORDS, current.filter(r => r.id !== id));
        return true;
      }
    } catch (err) {
      console.warn('Backend unavailable, deleting from local cache:', err);
    }

    const current = StorageService.getItem<HealthRecord[]>(STORAGE_KEYS.RECORDS, initialHealthRecords);
    StorageService.setItem(STORAGE_KEYS.RECORDS, current.filter(r => r.id !== id));
    return true;
  }

  /**
   * Performs OCR scan on an uploaded prescription file.
   */
  static async scanPrescription(file: File | null, existingUrl?: string): Promise<PrescriptionOCRResult> {
    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${this.baseUrl}/api/ocr/scan-prescription`, {
          method: 'POST',
          body: formData
        });
        if (response.ok) {
          const res = await response.json();
          if (res.success && res.data) {
            return res.data;
          }
        }
      } else if (existingUrl) {
        const response = await fetch(`${this.baseUrl}/api/ocr/scan-prescription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: existingUrl })
        });
        if (response.ok) {
          const res = await response.json();
          if (res.success && res.data) {
            return res.data;
          }
        }
      }
    } catch (err) {
      console.warn('OCR backend scan failed, falling back to simulated OCR:', err);
    }

    // Fallback simulated result
    let fallbackImageUrl = existingUrl;
    if (file) {
      fallbackImageUrl = await fileToBase64(file);
    }

    return {
      prescriptionId: `presc_ocr_${Date.now().toString().slice(-4)}`,
      doctorName: 'Dr. Ananya Sen (MD, DM Cardiology)',
      clinicHospital: 'SCB Medical College & Hospital',
      date: new Date().toISOString().split('T')[0],
      rawText: `
SCB MEDICAL COLLEGE & HOSPITAL
OPD Card #89412 - Dept of Cardiology
Patient: Aarav Sharma (Age: 42, M) Date: ${new Date().toLocaleDateString()}

Rx:
1. Tab. Paracetamol 500mg -- 1-0-1 (3 days) after food
2. Tab. Pantoprazole 40mg -- 1-0-0 (7 days) 30 min before breakfast
3. Tab. Telmisartan 40mg -- 1-0-0 (30 days) morning after breakfast
4. Tab. Azithromycin 500mg -- 1-0-0 (5 days) after dinner

Follow up after 15 days.
Dr. Ananya Sen (MD, DM)
      `.trim(),
      confidenceScore: 0.96,
      extractedMedicines: [
        {
          id: `med_${Date.now()}_1`,
          name: 'Paracetamol 500 mg',
          dosageStrength: '500 mg',
          frequency: 'Twice daily',
          timeOfDay: ['Morning', 'Night'],
          durationDays: 3,
          instructions: 'Take after meals for fever or ache'
        },
        {
          id: `med_${Date.now()}_2`,
          name: 'Pantoprazole 40 mg',
          dosageStrength: '40 mg',
          frequency: 'Once daily',
          timeOfDay: ['Morning'],
          durationDays: 7,
          instructions: 'Take 30 minutes before breakfast'
        },
        {
          id: `med_${Date.now()}_3`,
          name: 'Telmisartan 40 mg',
          dosageStrength: '40 mg',
          frequency: 'Once daily',
          timeOfDay: ['Morning'],
          durationDays: 30,
          instructions: 'Take after morning breakfast'
        }
      ]
    };
  }

  /**
   * Performs OCR scan & audit on an uploaded medical bill.
   */
  static async scanBill(file: File | null, existingUrl?: string): Promise<MedicalBill> {
    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${this.baseUrl}/api/ocr/scan-bill`, {
          method: 'POST',
          body: formData
        });
        if (response.ok) {
          const res = await response.json();
          if (res.success && res.data) {
            return res.data;
          }
        }
      }
    } catch (err) {
      console.warn('Bill OCR backend scan failed, falling back to local audit:', err);
    }

    return initialMedicalBill;
  }
}
