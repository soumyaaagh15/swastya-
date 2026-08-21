import { EmergencyCard, PatientProfile } from '../types';
import { StorageService, STORAGE_KEYS } from './storageService';
import { initialEmergencyCard, initialPatientProfile } from './mockData';

export class EmergencyService {
  static getEmergencyCard(): EmergencyCard {
    return StorageService.getItem<EmergencyCard>(STORAGE_KEYS.EMERGENCY_CARD, initialEmergencyCard);
  }

  static updateEmergencyCard(card: Partial<EmergencyCard>): EmergencyCard {
    const current = this.getEmergencyCard();
    const updated = { ...current, ...card, updatedAt: new Date().toISOString().split('T')[0] };
    StorageService.setItem(STORAGE_KEYS.EMERGENCY_CARD, updated);
    return updated;
  }

  static triggerEmergencyCall(number: string = '108'): void {
    if (typeof window !== 'undefined') {
      window.location.href = `tel:${number}`;
    }
  }

  static getCurrentLocation(): Promise<{ latitude: number; longitude: number; address: string }> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              address: 'Dist. Cuttack, Odisha (GPS Active)'
            });
          },
          () => {
            // Fallback default coordinates
            resolve({
              latitude: 20.4625,
              longitude: 85.8792,
              address: 'Mangalabag, Cuttack, Odisha 753007 (Approximate Location)'
            });
          },
          { timeout: 5000 }
        );
      } else {
        resolve({
          latitude: 20.4625,
          longitude: 85.8792,
          address: 'Cuttack, Odisha (Default Location)'
        });
      }
    });
  }
}
