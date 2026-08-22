import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Sparkles, 
  Download, 
  Eye, 
  Trash2, 
  Plus, 
  Tag, 
  Calendar, 
  User, 
  Building2,
  X,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  FileCheck,
  RefreshCw,
  ZoomIn
} from 'lucide-react';
import { HealthRecord, RecordCategory } from '../../types';
import { initialHealthRecords } from '../../services/mockData';
import { ApiService, UploadResult } from '../../services/apiService';

interface HealthRecordsPageProps {
  onOpenScanModal: () => void;
}

export const HealthRecordsPage: React.FC<HealthRecordsPageProps> = ({
  onOpenScanModal
}) => {
  const [records, setRecords] = useState<HealthRecord[]>(initialHealthRecords);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<RecordCategory>('Lab Reports');
  const [doctorName, setDoctorName] = useState('Dr. S. Patnaik');
  const [hospitalName, setHospitalName] = useState('Apollo Diagnostics');
  const [docTags, setDocTags] = useState('Blood Test, Fasting');
  const [docNotes, setDocNotes] = useState('Uploaded by patient');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  const categories: string[] = [
    'All',
    'Prescriptions',
    'Lab Reports',
    'Scans',
    'Bills',
    'Insurance',
    'Discharge',
    'Other'
  ];

  // Fetch records from backend on mount
  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await ApiService.getHealthRecords();
      setRecords(data);
    } catch (e) {
      console.error('Error loading records:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      
      // Categorize smartly based on filename
      const lower = file.name.toLowerCase();
      if (lower.includes('rx') || lower.includes('presc')) setDocCategory('Prescriptions');
      else if (lower.includes('bill') || lower.includes('invoice')) setDocCategory('Bills');
      else if (lower.includes('xray') || lower.includes('scan') || lower.includes('mri') || lower.includes('ct')) setDocCategory('Scans');
      else if (lower.includes('blood') || lower.includes('lab') || lower.includes('report') || lower.includes('test')) setDocCategory('Lab Reports');
      else if (lower.includes('discharge')) setDocCategory('Discharge');

      // Create live object URL for instant preview
      const preview = URL.createObjectURL(file);
      setFilePreviewUrl(preview);
      setUploadError('');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      const preview = URL.createObjectURL(file);
      setFilePreviewUrl(preview);
      setUploadError('');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select an image or PDF file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // 1. Upload to backend
      const uploadRes: UploadResult = await ApiService.uploadFile(selectedFile);

      // 2. Format tags
      const tagArray = docTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      // 3. Create persistent record
      const newRecord = await ApiService.createHealthRecord({
        title: docTitle || selectedFile.name,
        category: docCategory,
        doctorName: doctorName || 'Attending Physician',
        hospitalName: hospitalName || 'Healthcare Provider',
        dateUploaded: new Date().toISOString().split('T')[0],
        fileUrl: uploadRes.url,
        fileType: uploadRes.fileType,
        fileSizeMb: uploadRes.fileSizeMb,
        tags: tagArray.length > 0 ? tagArray : ['Uploaded Document'],
        notes: docNotes
      });

      // Update state
      setRecords([newRecord, ...records.filter(r => r.id !== newRecord.id)]);
      setUploadSuccess(`Successfully uploaded and saved "${newRecord.title}"!`);
      setIsUploadModalOpen(false);
      resetUploadForm();

      setTimeout(() => setUploadSuccess(''), 4000);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(null);
    setDocTitle('');
    setDocCategory('Lab Reports');
    setDocTags('Blood Test, Fasting');
    setDocNotes('Uploaded by patient');
    setUploadError('');
  };

  const handleDeleteRecord = async (id: string) => {
    await ApiService.deleteHealthRecord(id);
    setRecords(records.filter(r => r.id !== id));
    if (selectedRecord?.id === id) setSelectedRecord(null);
  };

  const filteredRecords = records.filter(rec => {
    const matchesCategory = selectedCategory === 'All' || rec.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.doctorName && rec.doctorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.hospitalName && rec.hospitalName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      rec.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-[#0057B8]" />
            <span>Digital Health Records</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Upload and view your prescriptions, lab reports, X-rays, bills, and discharge summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Prescription Scan + OCR Button */}
          <button
            onClick={onOpenScanModal}
            className="bg-gradient-to-r from-[#0057B8] to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-xs sm:text-sm px-4 py-3 rounded-2xl flex items-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Scan Prescription OCR</span>
          </button>

          {/* Upload File Button */}
          <button
            onClick={() => {
              resetUploadForm();
              setIsUploadModalOpen(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm px-4 py-3 rounded-2xl flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Picture / File</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {uploadSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Search & Category Filter Pills */}
      <div className="bg-white dark:bg-slate-800/80 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-card space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records by title, doctor name, hospital, or tag (e.g. 'Blood test', 'Cardiology')..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#0057B8] focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0057B8] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Health Records List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecords.map((rec) => (
          <div 
            key={rec.id}
            className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-card hover:shadow-cardHover transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="px-3 py-1 rounded-full bg-[#EAF3FF] dark:bg-blue-900/40 text-[#0057B8] dark:text-blue-300 text-xs font-black">
                  {rec.category}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{rec.dateUploaded}</span>
              </div>

              {/* Title & Preview Thumbnail */}
              <div className="flex items-start gap-3 mt-3">
                <div 
                  onClick={() => setSelectedRecord(rec)}
                  className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shrink-0 cursor-pointer relative group/thumb shadow-xs"
                >
                  <img 
                    src={rec.fileUrl} 
                    alt={rec.title} 
                    className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300" 
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 
                    onClick={() => setSelectedRecord(rec)}
                    className="font-extrabold text-slate-900 dark:text-white text-base leading-snug hover:text-[#0057B8] dark:hover:text-blue-400 cursor-pointer transition-colors line-clamp-2"
                  >
                    {rec.title}
                  </h3>
                  {rec.doctorName && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1 flex items-center gap-1 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{rec.doctorName}</span>
                    </p>
                  )}
                  {rec.hospitalName && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{rec.hospitalName}</span>
                    </p>
                  )}
                </div>
              </div>

              {rec.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-3 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {rec.notes}
                </p>
              )}

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {rec.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">
                {rec.fileType.toUpperCase()} • {rec.fileSizeMb} MB
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedRecord(rec)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 text-[#0057B8] dark:text-blue-300 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Picture</span>
                </button>
                <button
                  onClick={() => handleDeleteRecord(rec.id)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/40 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Delete Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-800/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-base">No health records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload your medical prescriptions, blood test reports, bills, or scans to get started.
          </p>
          <button
            onClick={() => {
              resetUploadForm();
              setIsUploadModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#0057B8] text-white font-bold text-xs"
          >
            Upload Document Now
          </button>
        </div>
      )}

      {/* --- UPLOAD DOCUMENT MODAL --- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleUploadSubmit} 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#0057B8]">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Upload Medical Document / Picture</h3>
                  <p className="text-xs text-slate-500">Save prescription, report, bill, or scan to backend</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsUploadModalOpen(false)} 
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error message */}
            {uploadError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-xs text-red-700 dark:text-red-300 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* File Dropzone / Selector */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#0057B8] dark:hover:border-blue-500 rounded-3xl p-5 text-center bg-slate-50 dark:bg-slate-800/50 transition-all cursor-pointer relative group"
            >
              <input 
                type="file" 
                id="docFileInput"
                onChange={handleFileSelect} 
                className="hidden" 
                accept="image/*,.pdf,.doc,.docx" 
              />
              
              {filePreviewUrl ? (
                <div className="space-y-3">
                  <div className="relative max-h-48 rounded-2xl overflow-hidden bg-black/5 mx-auto flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    {selectedFile?.type.includes('pdf') ? (
                      <div className="py-8 px-4 flex flex-col items-center gap-2 text-slate-700 dark:text-slate-300">
                        <FileCheck className="w-12 h-12 text-[#0057B8]" />
                        <span className="font-extrabold text-sm">{selectedFile.name}</span>
                        <span className="text-xs text-slate-500">PDF Document ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      </div>
                    ) : (
                      <img 
                        src={filePreviewUrl} 
                        alt="Selected document" 
                        className="max-h-48 w-auto object-contain rounded-2xl" 
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <label 
                      htmlFor="docFileInput"
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      Change Picture
                    </label>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ File selected ({selectedFile?.name})
                    </span>
                  </div>
                </div>
              ) : (
                <label htmlFor="docFileInput" className="cursor-pointer block py-4 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-[#0057B8] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                    Click to browse your photos or drop file here
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    Supports JPG, PNG, WEBP photos and PDF reports (up to 25 MB)
                  </p>
                </label>
              )}
            </div>

            {/* Document Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Document Title *</label>
                <input 
                  type="text" 
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Apollo Hospital Blood Sugar Test"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-semibold text-slate-900 dark:text-white focus:border-[#0057B8]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category *</label>
                <select 
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as RecordCategory)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-semibold text-slate-900 dark:text-white focus:border-[#0057B8]"
                >
                  <option value="Prescriptions">Prescriptions</option>
                  <option value="Lab Reports">Lab Reports</option>
                  <option value="Scans">Scans & X-Rays</option>
                  <option value="Bills">Bills & Invoices</option>
                  <option value="Insurance">Insurance Documents</option>
                  <option value="Discharge">Discharge Summaries</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Doctor / Clinician</label>
                <input 
                  type="text" 
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Ananya Sen"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Hospital / Clinic / Lab</label>
                <input 
                  type="text" 
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g. SCB Medical College, Apollo Diagnostics"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tags (Comma-separated)</label>
                <input 
                  type="text" 
                  value={docTags}
                  onChange={(e) => setDocTags(e.target.value)}
                  placeholder="e.g. Blood Test, Cardiology, HbA1c"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Clinical Notes / Comments</label>
                <textarea 
                  rows={2}
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="Optional notes regarding this medical file..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-semibold text-slate-900 dark:text-white resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-2.5 rounded-xl bg-[#0057B8] hover:bg-blue-800 text-white font-extrabold text-xs shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading to Backend...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Save Record</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- PREVIEW MODAL (SHOWS USER'S REAL UPLOADED PICTURE) --- */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-extrabold text-[#0057B8] dark:text-blue-400 uppercase tracking-wider">
                  {selectedRecord.category}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{selectedRecord.title}</h3>
                <p className="text-xs text-slate-500 font-medium">Uploaded on {selectedRecord.dateUploaded}</p>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)} 
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Picture Display */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950/5 dark:bg-black/40 max-h-[55vh] flex items-center justify-center relative p-2">
              <img 
                src={selectedRecord.fileUrl} 
                alt={selectedRecord.title} 
                className="max-h-[50vh] w-auto max-w-full object-contain rounded-xl shadow-md" 
                onError={(e) => {
                  (e.target as HTMLElement).parentElement!.innerHTML = `
                    <div class="py-16 text-center text-slate-500">
                      <p class="font-bold text-sm">Document File Preview</p>
                      <p class="text-xs mt-1">Direct preview not available for this format</p>
                    </div>
                  `;
                }}
              />
            </div>

            {/* Details & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <div>
                <span className="text-slate-400 font-bold block">Doctor / Clinician</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{selectedRecord.doctorName || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Hospital / Facility</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{selectedRecord.hospitalName || 'Not specified'}</span>
              </div>
              {selectedRecord.notes && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-bold block">Notes</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{selectedRecord.notes}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold">
                Format: {selectedRecord.fileType.toUpperCase()} • Size: {selectedRecord.fileSizeMb} MB
              </span>

              <div className="flex items-center gap-2">
                {selectedRecord.category === 'Prescriptions' && (
                  <button
                    onClick={() => {
                      setSelectedRecord(null);
                      onOpenScanModal();
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-extrabold flex items-center gap-1.5 border border-amber-300 dark:border-amber-700"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Scan with OCR</span>
                  </button>
                )}

                <a 
                  href={selectedRecord.fileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  download
                  className="px-4 py-2 rounded-xl bg-[#0057B8] hover:bg-blue-800 text-white font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download / Full Image</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
