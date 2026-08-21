import { FamilyMember, FamilyPermission } from '../types';
import { StorageService, STORAGE_KEYS } from './storageService';
import { initialFamilyMembers } from './mockData';

export class FamilyService {
  static getFamilyMembers(): FamilyMember[] {
    return StorageService.getItem<FamilyMember[]>(STORAGE_KEYS.FAMILY, initialFamilyMembers);
  }

  static updatePermissions(memberId: string, permissions: Partial<FamilyPermission>): FamilyMember[] {
    const members = this.getFamilyMembers();
    const updated = members.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          permissions: { ...m.permissions, ...permissions }
        };
      }
      return m;
    });
    StorageService.setItem(STORAGE_KEYS.FAMILY, updated);
    return updated;
  }

  static addFamilyMember(member: Omit<FamilyMember, 'id' | 'healthSummary'>): FamilyMember {
    const members = this.getFamilyMembers();
    const newMember: FamilyMember = {
      ...member,
      id: `fam_${Date.now()}`,
      healthSummary: {
        activeMedicinesCount: 0,
        upcomingAppointmentsCount: 0,
        lastCheckupDate: 'None'
      }
    };
    const updated = [...members, newMember];
    StorageService.setItem(STORAGE_KEYS.FAMILY, updated);
    return newMember;
  }
}
