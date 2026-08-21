import React, { useState } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Edit2, 
  Plus, 
  Trash2, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { OCRService } from '../../services/ocrService';
import { PrescriptionOCRResult, ExtractedMedication } from '../../types';
import { MedicationService } from '../../services/medicationService';

interface PrescriptionScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessScheduleAdded: () => void;
}

export const PrescriptionScanModal: React.FC<PrescriptionScanModalProps> = ({
  isOpen,
  onClose,
  onSuccessScheduleAdded
}) => {
  const [step, setStep] = useState<'upload' | 'scanning' | 'confirm'>('upload');
  const [ocrData, setOcrData] = useState<PrescriptionOCRResult | null>(null);
  const [editableMedicines, setEditableMedicines] = useState<ExtractedMedication[]>([]);

  if (!isOpen) return null;

  const handleStartScan = async (fileName: string = 'Prescription_Aug2026.jpg') => {
    setStep('scanning');
    const result = await OCRService.simulatePrescriptionScan(fileName);
    setOcrData(result);
    setEditableMedicines(result.extractedMedicines);
    setStep('confirm');
  };

  const handleUpdateMedicine = (index: number, updated: Partial<ExtractedMedication>) => {
    const list = [...editableMedicines];
    list[index] = { ...list[index], ...updated };
    setEditableMedicines(list);
  };

  const handleRemoveMedicine = (index: number) => {
    setEditableMedicines(editableMedicines.filter((_, i) => i !== index));
  };

  const handleConfirmAndSave = () => {
    // Save extracted medicines to medication schedule (Section 13)
    editableMedicines.forEach((med) => {
      MedicationService.addSchedule({
        medicineName: med.name,
        dosage: med.dosageStrength,
        timeOfDay: med.timeOfDay,
        specificTimes: med.timeOfDay.map(t => t === 'Morning' ? '08:00 AM' : t === 'Afternoon' ? '02:00 PM' : '08:00 PM'),
        durationDays: med.durationDays,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + med.durationDays * 86400000).toISOString().split('T')[0],
        instructions: med.instructions,
        status: 'Active'
      });
    });

    onSuccessScheduleAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-blue-50 text-[#0057B8]">
              <Sparkles className="w-6 h-6 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-slate-900">PRESCRIPTION OCR SCANNER</h3>
              <p className="text-xs text-slate-500 font-semibold">Extract doctor instructions into automatic reminders</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Upload / Camera Options */}
        {step === 'upload' && (
          <div className="space-y-6 text-center py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Camera Scan Simulation */}
              <button
                onClick={() => handleStartScan('Camera_Prescription.jpg')}
                className="bg-[#EAF3FF] hover:bg-blue-100 border-2 border-[#0057B8] text-[#0057B8] p-8 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 group"
              >
                <Camera className="w-12 h-12 text-[#0057B8] group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-lg">Use Phone Camera</span>
                <span className="text-xs text-blue-800 font-medium">Capture doctor handwritten prescription</span>
              </button>

              {/* Upload Prescription File */}
              <button
                onClick={() => handleStartScan('Uploaded_Rx_Doc.pdf')}
                className="bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 text-slate-700 p-8 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 group"
              >
                <Upload className="w-12 h-12 text-slate-500 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-lg">Upload PDF / Image</span>
                <span className="text-xs text-slate-500 font-medium">Drop prescription file here</span>
              </button>

            </div>

            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs font-semibold text-amber-900 text-left flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Section 12 Safety Rule:</strong> SASHTYA never blindly trusts OCR text. You will be asked to verify and confirm all extracted medicine names, dosages, and schedules before saving.
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: OCR Scanning Animation */}
        {step === 'scanning' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-[#0057B8] animate-spin" />
              <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            <h4 className="text-xl font-extrabold text-slate-900">Scanning & Extracting Text...</h4>
            <p className="text-xs text-slate-500 font-medium max-w-sm">
              Analyzing doctor signature, medicine names (Paracetamol, Pantoprazole, Telmisartan), strengths, and dosage frequencies...
            </p>
          </div>
        )}

        {/* STEP 3: User Confirmation & Editing Form */}
        {step === 'confirm' && ocrData && (
          <div className="space-y-5">
            
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-emerald-800">OCR Extraction Complete (94% Accuracy)</span>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  {ocrData.doctorName} • {ocrData.clinicHospital}
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-700 text-white font-extrabold text-xs">
                CONFIRM MEDICINES
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Extracted Medicines (Edit any field below if needed)
              </span>

              {editableMedicines.map((med, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => handleUpdateMedicine(idx, { name: e.target.value })}
                      className="font-extrabold text-slate-900 text-sm bg-white border border-slate-300 rounded-xl px-3 py-1.5 flex-1 outline-none focus:border-[#0057B8]"
                    />
                    <button 
                      onClick={() => handleRemoveMedicine(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Dosage</label>
                      <input
                        type="text"
                        value={med.dosageStrength}
                        onChange={(e) => handleUpdateMedicine(idx, { dosageStrength: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-semibold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Duration (Days)</label>
                      <input
                        type="number"
                        value={med.durationDays}
                        onChange={(e) => handleUpdateMedicine(idx, { durationDays: parseInt(e.target.value) || 1 })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-semibold outline-none"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Instructions</label>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => handleUpdateMedicine(idx, { instructions: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-semibold outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100"
              >
                Re-scan
              </button>

              <button
                onClick={handleConfirmAndSave}
                className="px-6 py-2.5 rounded-xl bg-[#0057B8] hover:bg-blue-800 text-white font-extrabold text-xs shadow-md flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>CONFIRM & CREATE REMINDERS</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
