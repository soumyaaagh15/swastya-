import { Appointment } from '../types';
import { StorageService, STORAGE_KEYS } from './storageService';
import { initialAppointments } from './mockData';

export class AppointmentService {
  static getAppointments(): Appointment[] {
    return StorageService.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
  }

  static bookAppointment(appointment: Omit<Appointment, 'id' | 'status'>): Appointment {
    const appointments = this.getAppointments();
    const newAppointment: Appointment = {
      ...appointment,
      id: `app_${Date.now()}`,
      status: 'Upcoming',
      queuePosition: Math.floor(Math.random() * 8) + 3,
      currentlyServing: 1,
      estimatedWaitMinutes: 20
    };
    const updated = [newAppointment, ...appointments];
    StorageService.setItem(STORAGE_KEYS.APPOINTMENTS, updated);
    return newAppointment;
  }

  static syncToGoogleCalendar(appointmentId: string): boolean {
    const appointments = this.getAppointments();
    const updated = appointments.map(app => {
      if (app.id === appointmentId) {
        return { ...app, syncedToGoogleCalendar: true };
      }
      return app;
    });
    StorageService.setItem(STORAGE_KEYS.APPOINTMENTS, updated);
    return true;
  }
}
