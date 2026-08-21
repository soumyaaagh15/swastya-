import React, { useState, useEffect } from 'react';
import { 
  X, 
  PhoneCall, 
  UserCheck, 
  MapPin, 
  QrCode, 
  Hospital, 
  AlertTriangle,
  Share2,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { EmergencyService } from '../../services/emergencyService';
import { HospitalService } from '../../services/hospitalService';
import { NearbyHospital, EmergencyCard } from '../../types';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCard: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  onOpenCard
}) => {
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [locationSharingStatus, setLocationSharingStatus] = useState<string>('');
  const emergencyCard = EmergencyService.getEmergencyCard();

  useEffect(() => {
    if (isOpen) {
      setHospitals(HospitalService.getNearbyHospitals(true));
      EmergencyService.getCurrentLocation().then(loc => setLocation(loc));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShareLocation = () => {
    if (location) {
      const text = `🚨 EMERGENCY HELP REQUIRED: I am located at ${location.address} (GPS: ${location.latitude}, ${location.longitude}). Blood Group: ${emergencyCard.bloodGroup}. Emergency Contact: ${emergencyCard.emergencyContact.phone}`;
      if (navigator.share) {
        navigator.share({ title: 'Emergency Location Share', text });
      } else {
        navigator.clipboard.writeText(text);
        setLocationSharingStatus('Emergency location copied to clipboard!');
        setTimeout(() => setLocationSharingStatus(''), 3000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border-4 border-[#D92D20] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#D92D20] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-white/20">
              <AlertTriangle className="w-8 h-8 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-wide">🚨 EMERGENCY ASSISTANCE</h2>
              <p className="text-xs font-semibold text-white/90">Immediate actions & emergency hospital routing</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Quick Call Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Call 108 Ambulance */}
            <button
              onClick={() => EmergencyService.triggerEmergencyCall('108')}
              className="bg-[#D92D20] hover:bg-[#B42318] text-white p-5 rounded-2xl flex items-center gap-4 shadow-lg active:scale-95 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <PhoneCall className="w-6 h-6 text-white group-hover:animate-bounce" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">National Emergency</span>
                <h3 className="text-xl font-black">CALL 108 AMBULANCE</h3>
              </div>
            </button>

            {/* Call Emergency Contact */}
            <button
              onClick={() => EmergencyService.triggerEmergencyCall(emergencyCard.emergencyContact.phone)}
              className="bg-slate-900 hover:bg-slate-800 text-white p-5 rounded-2xl flex items-center gap-4 shadow-md active:scale-95 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                  {emergencyCard.emergencyContact.name} ({emergencyCard.emergencyContact.relationship})
                </span>
                <h3 className="text-base font-extrabold">{emergencyCard.emergencyContact.phone}</h3>
              </div>
            </button>

          </div>

          {/* Emergency QR Medical Card & Share Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={onOpenCard}
              className="bg-[#EAF3FF] border-2 border-[#0057B8] text-[#0057B8] p-4 rounded-2xl flex items-center gap-3 font-extrabold hover:bg-blue-100 transition-colors"
            >
              <QrCode className="w-6 h-6 shrink-0" />
              <div className="text-left">
                <div className="text-xs text-blue-900 font-semibold">Authorized Profile</div>
                <div className="text-sm">View Emergency Medical Card</div>
              </div>
            </button>

            <button
              onClick={handleShareLocation}
              className="bg-amber-50 border-2 border-amber-500 text-amber-900 p-4 rounded-2xl flex items-center gap-3 font-extrabold hover:bg-amber-100 transition-colors"
            >
              <Share2 className="w-6 h-6 text-amber-700 shrink-0" />
              <div className="text-left">
                <div className="text-xs text-amber-800 font-semibold">GPS Active</div>
                <div className="text-sm">Share Emergency Location</div>
              </div>
            </button>
          </div>

          {locationSharingStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{locationSharingStatus}</span>
            </div>
          )}

          {/* Location Badge */}
          {location && (
            <div className="bg-slate-100 p-3 rounded-xl flex items-center gap-2 text-xs font-medium text-slate-700">
              <MapPin className="w-4 h-4 text-[#D92D20] shrink-0" />
              <span><strong>Current Location:</strong> {location.address}</span>
            </div>
          )}

          {/* Nearest Emergency Hospitals */}
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Hospital className="w-4 h-4 text-[#0057B8]" />
              <span>Nearest Emergency ICU Hospitals ({hospitals.length})</span>
            </h4>

            <div className="space-y-3">
              {hospitals.map(hosp => (
                <div key={hosp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-extrabold text-slate-900 text-base">{hosp.name}</h5>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">24x7 ICU</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{hosp.address}</p>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-700 mt-2">
                      <span className="text-[#0057B8]">📍 {hosp.distanceKm} km away</span>
                      <span className="text-slate-500">⏱ ~{hosp.estimatedTravelTimeMinutes} mins travel</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => EmergencyService.triggerEmergencyCall(hosp.phone)}
                      className="px-3.5 py-2 rounded-xl bg-[#0057B8] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-800 transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </button>
                    <a
                      href={HospitalService.getDirectionsUrl(hosp.latitude, hosp.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-800 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Directions</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
