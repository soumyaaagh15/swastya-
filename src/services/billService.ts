import { MedicalBill, BillLineItem } from '../types';
import { StorageService, STORAGE_KEYS } from './storageService';
import { initialMedicalBill } from './mockData';

export class BillService {
  static getMedicalBill(): MedicalBill {
    return StorageService.getItem<MedicalBill>(STORAGE_KEYS.BILL, initialMedicalBill);
  }

  static auditBill(bill: MedicalBill): MedicalBill {
    let calculatedSubtotal = 0;
    let discrepancies = 0;

    const auditedItems: BillLineItem[] = bill.items.map(item => {
      const expectedTotal = item.quantity * item.unitCost;
      let flaggedIssue: string | undefined = undefined;
      let requiresVerification = false;

      if (expectedTotal !== item.totalCost) {
        discrepancies++;
        requiresVerification = true;
        flaggedIssue = `Calculated line item total (₹${expectedTotal.toLocaleString('en-IN')}) differs from billed item total (₹${item.totalCost.toLocaleString('en-IN')}). This charge may require verification with the hospital billing department.`;
      }

      calculatedSubtotal += item.totalCost;
      return {
        ...item,
        flaggedIssue,
        requiresVerification
      };
    });

    const calculatedGrandTotal = calculatedSubtotal + bill.taxAmount;
    if (calculatedGrandTotal !== bill.billedGrandTotal && discrepancies === 0) {
      discrepancies++;
    }

    const updatedBill: MedicalBill = {
      ...bill,
      items: auditedItems,
      subtotal: calculatedSubtotal,
      calculatedGrandTotal,
      discrepanciesCount: discrepancies,
      status: discrepancies > 0 ? 'Discrepancy Found' : 'Audited'
    };

    StorageService.setItem(STORAGE_KEYS.BILL, updatedBill);
    return updatedBill;
  }
}
