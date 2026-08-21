import { NearbyHospital } from '../types';
import { initialNearbyHospitals } from './mockData';

export class HospitalService {
  static getNearbyHospitals(onlyEmergency: boolean = false): NearbyHospital[] {
    if (onlyEmergency) {
      return initialNearbyHospitals.filter(h => h.hasEmergencyICU);
    }
    return initialNearbyHospitals;
  }

  static getHospitalById(id: string): NearbyHospital | undefined {
    return initialNearbyHospitals.find(h => h.id === id);
  }

  static getDirectionsUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
}
