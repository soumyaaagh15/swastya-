import { InsurancePolicy, InsuranceClaim } from '../types';
import { StorageService, STORAGE_KEYS } from './storageService';
import { initialInsurancePolicy } from './mockData';

export class InsuranceService {
  static getPolicy(): InsurancePolicy {
    return StorageService.getItem<InsurancePolicy>(STORAGE_KEYS.INSURANCE, initialInsurancePolicy);
  }

  static submitClaim(claimData: { hospitalName: string; treatmentName: string; amountClaimed: number }): InsuranceClaim {
    const policy = this.getPolicy();
    const newClaim: InsuranceClaim = {
      id: `claim_${Date.now()}`,
      claimNumber: `CLM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      hospitalName: claimData.hospitalName,
      treatmentName: claimData.treatmentName,
      amountClaimed: claimData.amountClaimed,
      dateSubmitted: new Date().toISOString().split('T')[0],
      status: 'Documents Uploaded',
      statusStep: 2,
      supportingDocumentCount: 2,
      remarks: 'Claim submitted. Awaiting verification by TPA officer.'
    };
    const updatedPolicy: InsurancePolicy = {
      ...policy,
      claims: [newClaim, ...policy.claims]
    };
    StorageService.setItem(STORAGE_KEYS.INSURANCE, updatedPolicy);
    return newClaim;
  }
}
