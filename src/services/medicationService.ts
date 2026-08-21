import { MedicationSchedule } from '../types';
import { StorageService, STORAGE_KEYS } from './storageService';
import { initialMedicationSchedules } from './mockData';

export class MedicationService {
  static getSchedules(): MedicationSchedule[] {
    return StorageService.getItem<MedicationSchedule[]>(STORAGE_KEYS.MEDICATIONS, initialMedicationSchedules);
  }

  static addSchedule(schedule: Omit<MedicationSchedule, 'id' | 'historyLogs'>): MedicationSchedule {
    const schedules = this.getSchedules();
    const newSchedule: MedicationSchedule = {
      ...schedule,
      id: `med_${Date.now()}`,
      historyLogs: []
    };
    const updated = [newSchedule, ...schedules];
    StorageService.setItem(STORAGE_KEYS.MEDICATIONS, updated);
    return newSchedule;
  }

  static logDose(medicationId: string, action: 'Taken' | 'Skipped' | 'Snoozed'): MedicationSchedule[] {
    const schedules = this.getSchedules();
    const updated = schedules.map(med => {
      if (med.id === medicationId) {
        const newLog = {
          id: `log_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action
        };
        return {
          ...med,
          historyLogs: [newLog, ...med.historyLogs]
        };
      }
      return med;
    });
    StorageService.setItem(STORAGE_KEYS.MEDICATIONS, updated);
    return updated;
  }

  static getNextUpcomingDose(): { medication: MedicationSchedule; nextTime: string } | null {
    const active = this.getSchedules().filter(m => m.status === 'Active');
    if (active.length === 0) return null;
    return {
      medication: active[0],
      nextTime: active[0].specificTimes[0] || '08:00 PM'
    };
  }

  static getNextMedication(): { medication: MedicationSchedule; nextTime: string } | null {
    return this.getNextUpcomingDose();
  }
}
