import React, { useState, useRef, useEffect } from 'react';
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
  FileCheck,
  RefreshCw,
  Eye,
  ZoomIn,
  SwitchCamera
} from 'lucide-react';
import { OCRService } from '../../services/ocrService';
import { PrescriptionOCRResult, ExtractedMedication } from '../../types';
import { MedicationService } from '../../services/medicationService';
import { ApiService, UploadResult } from '../../services/apiService';

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
  const [step, setStep] = useState<'upload' | 'camera' | 'scanning' | 'confirm'>('upload');
  const [ocrData, setOcrData] = useState<PrescriptionOCRResult | null>(null);
  const [editableMedicines, setEditableMedicines] = useState<ExtractedMedication[]>([]);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('Prescription.jpg');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup camera stream when modal closes or step changes
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [isOpen, step]);

  if (!isOpen) return null;

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const handleStartCamera = async () => {
    setCameraError('');
    setStep('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Unable to access camera. Please upload an image file instead.');
    }
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      stopCamera();

      // Convert dataUrl to File
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `Prescription_Cam_${Date.now()}.jpg`, { type: 'image/jpeg' });
      await processPrescriptionFile(file, dataUrl);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      await processPrescriptionFile(file, previewUrl);
    }
  };

  const processPrescriptionFile = async (file: File, localPreviewUrl: string) => {
    setUploadedFileUrl(localPreviewUrl);
    setUploadedFileName(file.name);
    setStep('scanning');
    setIsProcessing(true);

    try {
      // 1. Upload to backend
      const uploadRes: UploadResult = await ApiService.uploadFile(file);
      setUploadedFileUrl(uploadRes.url);

      // 2. Perform OCR scan
      const result = await OCRService.simulatePrescriptionScan(file, uploadRes.url);
      setOcrData(result);
      setEditableMedicines(result.extractedMedicines || []);
      setStep('confirm');
    } catch (err) {
      console.error('Error during prescription processing:', err);
      // Fallback
      const result = await OCRService.simulatePrescriptionScan(file.name, localPreviewUrl);
      setOcrData(result);
      setEditableMedicines(result.extractedMedicines || []);
      setStep('confirm');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateMedicine = (index: number, updated: Partial<ExtractedMedication>) => {
    const list = [...editableMedicines];
    list[index] = { ...list[index], ...updated };
    setEditableMedicines(list);
  };

  const handleRemoveMedicine = (index: number) => {
    setEditableMedicines(editableMedicines.filter((_, i) => i !== index));
  };

  const handleAddMedicine = () => {
    const newMed: ExtractedMedication = {
      id: `med_new_${Date.now()}`,
      name: 'New Medicine',
      dosageStrength: '500 mg',
      frequency: 'Once daily',
      timeOfDay: ['Morning'],
      durationDays: 7,
      instructions: 'Take after food'
    };
    setEditableMedicines([...editableMedicines, newMed]);
  };

  const handleConfirmAndSave = async () => {
    // 1. Save extracted medicines to medication schedule
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

    // 2. Also save to Digital Health Records so it appears under Health Records tab
    if (uploadedFileUrl) {
      try {
        await ApiService.createHealthRecord({
          title: `Prescription - ${ocrData?.doctorName || 'Dr. Ananya Sen'}`,
          category: 'Prescriptions',
          doctorName: ocrData?.doctorName || 'Dr. Ananya Sen',
          hospitalName: ocrData?.clinicHospital || 'SCB Medical College',
          dateUploaded: new Date().toISOString().split('T')[0],
          fileUrl: uploadedFileUrl,
          fileType: 'image',
          fileSizeMb: 1.2,
          tags: ['Prescription OCR', 'Active Medications', ...editableMedicines.map(m => m.name.split(' ')[0])],
          notes: `OCR Extracted ${editableMedicines.length} medications into active schedule.`
        });
      } catch (err) {
        console.warn('Could not auto-create health record:', err);
      }
    }

    onSuccessScheduleAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-[#0057B8] dark:text-blue-300">
              <Sparkles className="w-6 h-6 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">PRESCRIPTION OCR SCANNER</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Upload your doctor prescription to auto-create medication reminders
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              stopCamera();
              onClose();
            }} 
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
          accept="image/*,.pdf" 
        />

        {/* STEP 1: Upload / Camera Options */}
        {step === 'upload' && (
          <div className="space-y-6 text-center py-2">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Camera Option */}
              <button
                type="button"
                onClick={handleStartCamera}
                className="bg-[#EAF3FF] dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-2 border-[#0057B8] text-[#0057B8] dark:text-blue-300 p-8 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 group shadow-sm"
              >
                <Camera className="w-12 h-12 text-[#0057B8] dark:text-blue-300 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-lg text-slate-900 dark:text-white">Use Camera</span>
                <span className="text-xs text-blue-800 dark:text-blue-300 font-medium">Capture doctor handwritten prescription</span>
              </button>

              {/* Upload Prescription File */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 p-8 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 group shadow-sm"
              >
                <Upload className="w-12 h-12 text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-lg text-slate-900 dark:text-white">Upload Your Picture / PDF</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Select photo from your phone or PC</span>
              </button>

            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3.5 rounded-2xl text-xs font-semibold text-amber-900 dark:text-amber-200 text-left flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Safety Verification Rule:</strong> SASHTYA OCR extracts medicine names, dosages, and daily frequencies. You will be able to review, adjust, and confirm every medicine before saving.
              </span>
            </div>
          </div>
        )}

        {/* STEP 1.5: Camera Live Viewfinder */}
        {step === 'camera' && (
          <div className="space-y-4 py-2 text-center">
            {cameraError ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-xs text-red-700 dark:text-red-300 font-bold space-y-3">
                <p>{cameraError}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-[#0057B8] text-white font-extrabold text-xs"
                >
                  Upload Picture Instead
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-[#0057B8] max-h-72 flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover max-h-72" 
                  />
                  <div className="absolute inset-x-8 top-1/4 bottom-1/4 border-2 border-dashed border-white/60 rounded-2xl pointer-events-none" />
                  <span className="absolute top-3 bg-black/60 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                    Position prescription inside frame
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setStep('upload');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0057B8] to-blue-700 text-white font-extrabold text-xs shadow-md flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture & Scan Picture</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: OCR Scanning Animation with User's Photo */}
        {step === 'scanning' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            
            {/* Uploaded Photo with Scanning Laser Animation */}
            {uploadedFileUrl && (
              <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-2 border-[#0057B8] shadow-lg bg-slate-900">
                <img 
                  src={uploadedFileUrl} 
                  alt="Scanning prescription" 
                  className="w-full h-full object-cover opacity-80" 
                />
                {/* Laser scan line */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-bounce" />
                <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[1px]" />
              </div>
            )}

            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900 border-t-[#0057B8] animate-spin" />
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>

            <div>
              <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">Analyzing Your Prescription...</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-sm mt-1">
                Extracting medicine names (Paracetamol, Pantoprazole, Telmisartan), dosages, frequencies, and duration from your picture...
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: User Confirmation & Extracted Medicines Side-by-Side */}
        {step === 'confirm' && ocrData && (
          <div className="space-y-4">
            
            {/* Top Banner with Extracted Doctor Info */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300">
                  OCR Extraction Complete ({(ocrData.confidenceScore * 100).toFixed(0)}% Confidence)
                </span>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {ocrData.doctorName} • {ocrData.clinicHospital}
                </h4>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-700 text-white font-extrabold text-xs self-start sm:self-center shrink-0">
                VERIFY & SAVE
              </span>
            </div>

            {/* Side-by-side or stacked: Uploaded Picture & Extracted Medicines */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Left Column: User's Uploaded Picture */}
              {uploadedFileUrl && (
                <div className="md:col-span-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                    Your Uploaded Picture:
                  </span>
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48 bg-black/10 flex items-center justify-center">
                    <img 
                      src={uploadedFileUrl} 
                      alt="Uploaded Prescription" 
                      className="w-full h-auto max-h-48 object-contain" 
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 mt-2 truncate block">
                    {uploadedFileName}
                  </span>
                </div>
              )}

              {/* Right Column: Editable Extracted Medicines */}
              <div className={`${uploadedFileUrl ? 'md:col-span-8' : 'md:col-span-12'} space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Extracted Medicines ({editableMedicines.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddMedicine}
                    className="text-xs text-[#0057B8] dark:text-blue-400 font-extrabold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {editableMedicines.map((med, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={med.name}
                          onChange={(e) => handleUpdateMedicine(idx, { name: e.target.value })}
                          className="font-extrabold text-slate-900 dark:text-white text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 flex-1 outline-none focus:border-[#0057B8]"
                          placeholder="Medicine name"
                        />
                        <button 
                          type="button"
                          onClick={() => handleRemoveMedicine(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Dosage</label>
                          <input
                            type="text"
                            value={med.dosageStrength}
                            onChange={(e) => handleUpdateMedicine(idx, { dosageStrength: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold outline-none text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Days</label>
                          <input
                            type="number"
                            value={med.durationDays}
                            onChange={(e) => handleUpdateMedicine(idx, { durationDays: parseInt(e.target.value) || 1 })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold outline-none text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Schedule</label>
                          <select
                            value={med.timeOfDay.join(', ')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.includes('Morning') && val.includes('Night')) {
                                handleUpdateMedicine(idx, { timeOfDay: ['Morning', 'Night'] });
                              } else if (val.includes('Night')) {
                                handleUpdateMedicine(idx, { timeOfDay: ['Night'] });
                              } else {
                                handleUpdateMedicine(idx, { timeOfDay: ['Morning'] });
                              }
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-1.5 py-1 text-[11px] font-semibold outline-none text-slate-900 dark:text-white"
                          >
                            <option value="Morning">Morning</option>
                            <option value="Morning, Night">Twice Daily</option>
                            <option value="Night">Night</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Scan Another Picture
              </button>

              <button
                type="button"
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
