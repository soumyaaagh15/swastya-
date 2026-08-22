import { PrescriptionOCRResult } from '../types';
import { ApiService } from './apiService';

export class OCRService {
  static async simulatePrescriptionScan(fileOrName: File | string, existingUrl?: string): Promise<PrescriptionOCRResult> {
    if (fileOrName instanceof File) {
      return ApiService.scanPrescription(fileOrName);
    }
    return ApiService.scanPrescription(null, existingUrl || (typeof fileOrName === 'string' ? fileOrName : undefined));
  }
}

