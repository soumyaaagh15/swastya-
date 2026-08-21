import { HealthcareScheme } from '../types';
import { initialHealthcareSchemes } from './mockData';

export class SchemeService {
  static getSchemes(): HealthcareScheme[] {
    return initialHealthcareSchemes;
  }

  static searchSchemes(query: string): HealthcareScheme[] {
    if (!query) return initialHealthcareSchemes;
    const lower = query.toLowerCase();
    return initialHealthcareSchemes.filter(s => 
      s.schemeName.toLowerCase().includes(lower) || 
      s.shortDescription.toLowerCase().includes(lower) ||
      s.category.toLowerCase().includes(lower)
    );
  }
}
