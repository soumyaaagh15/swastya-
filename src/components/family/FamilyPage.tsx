import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Lock, 
  Check, 
  X, 
  Plus, 
  Heart, 
  UserPlus, 
  FileText, 
  Calendar, 
  Pill, 
  ShieldAlert,
  History
} from 'lucide-react';
import { FamilyMember, FamilyPermission } from '../../types';
import { FamilyService } from '../../services/familyService';
import { initialTimelineEvents } from '../../services/mockData';

export const FamilyPage: React.FC = () => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(FamilyService.getFamilyMembers());
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  const handleTogglePermission = (memberId: string, permKey: keyof FamilyPermission) => {
    const member = familyMembers.find(m => m.id === memberId);
    if (member) {
      const updatedPerms = {
        ...member.permissions,
        [permKey]: !member.permissions[permKey]
      };
      const updatedList = FamilyService.updatePermissions(memberId, updatedPerms);
      setFamilyMembers(updatedList);
      if (selectedMember?.id === memberId) {
        setSelectedMember({ ...member, permissions: updatedPerms });
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-purple-700" />
            <span>My Family & Caregiver Consent</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage family profiles, caregiver appointments, & explicit permission controls.
          </p>
        </div>
      </div>

      {/* Explicit Privacy & Consent Banner (Section 19 & 38) */}
      <div className="bg-purple-50 border border-purple-200 p-4 rounded-3xl text-xs font-semibold text-purple-900 flex items-start gap-3">
        <Lock className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
        <div>
          <strong>Strict Consent Rule (Section 38):</strong> SASHTYA never automatically exposes complete medical records to family members without explicit user authorization. You control exactly what each family member can view or manage.
        </div>
      </div>

      {/* Family Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {familyMembers.map((member) => (
          <div 
            key={member.id}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-lg">
                  {member.fullName.charAt(0)}
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                    {member.relationship}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base">{member.fullName} ({member.age} yrs)</h3>
                  <p className="text-xs text-slate-500 font-medium">{member.phone}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMember(member)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-extrabold text-xs transition-colors"
              >
                Manage Consent
              </button>
            </div>

            {/* Permissions Matrix Pills */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <span className="font-bold text-slate-400 text-[10px] uppercase">Active Authorized Permissions</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                  member.permissions.canViewAppointments ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {member.permissions.canViewAppointments ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Appointments</span>
                </div>

                <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                  member.permissions.canManageMedications ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {member.permissions.canManageMedications ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Medications</span>
                </div>

                <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                  member.permissions.canViewEmergencyCard ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {member.permissions.canViewEmergencyCard ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Emergency Card</span>
                </div>

                <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                  member.permissions.canViewMedicalDocuments ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {member.permissions.canViewMedicalDocuments ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Private Documents</span>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Family Health History Section (Section 20) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-[#0057B8]" />
          <span>Family Health History</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <strong className="font-extrabold text-slate-900 text-sm">Hypertension / Blood Pressure</strong>
              <span className="block text-slate-500 font-medium">Recorded in Father & Paternal Grandmother</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">Voluntary Record</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <strong className="font-extrabold text-slate-900 text-sm">Type 2 Diabetes Mellitus</strong>
              <span className="block text-slate-500 font-medium">Recorded in Mother</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">Voluntary Record</span>
          </div>
        </div>
      </div>

      {/* Permission Consent Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-lg text-slate-900">
                Consent Matrix: {selectedMember.fullName}
              </h3>
              <button onClick={() => setSelectedMember(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {(Object.keys(selectedMember.permissions) as (keyof FamilyPermission)[]).map((key) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 capitalize">
                    {key.replace('can', '').replace(/([A-Z])/g, ' $1')}
                  </span>
                  <button
                    onClick={() => handleTogglePermission(selectedMember.id, key)}
                    className={`px-3 py-1 rounded-xl font-extrabold transition-colors ${
                      selectedMember.permissions[key]
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {selectedMember.permissions[key] ? 'Allowed' : 'Denied'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
