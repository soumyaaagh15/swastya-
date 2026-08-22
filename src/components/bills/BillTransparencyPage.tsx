import React, { useState, useRef } from 'react';
import { 
  Receipt, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  HelpCircle, 
  Calculator, 
  ShieldAlert,
  FileSearch,
  Plus,
  Trash2,
  X,
  Eye,
  ZoomIn,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { MedicalBill, BillLineItem } from '../../types';
import { BillService } from '../../services/billService';
import { ApiService, UploadResult } from '../../services/apiService';

export const BillTransparencyPage: React.FC = () => {
  const [bill, setBill] = useState<MedicalBill>(BillService.getMedicalBill());
  const [uploadedBillImage, setUploadedBillImage] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [hospitalNameInput, setHospitalNameInput] = useState('Sun Hospital & Diagnostics');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleRunAudit = () => {
    const audited = BillService.auditBill(bill);
    setBill(audited);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setFilePreviewUrl(preview);
    }
  };

  const handleUploadBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      // 1. Upload to backend
      const uploadRes: UploadResult = await ApiService.uploadFile(selectedFile);
      setUploadedBillImage(uploadRes.url);

      // 2. Scan & audit bill
      const scannedBill = await ApiService.scanBill(selectedFile, uploadRes.url);
      const audited = BillService.auditBill({
        ...scannedBill,
        hospitalName: hospitalNameInput || scannedBill.hospitalName
      });
      setBill(audited);

      // 3. Save to health records under 'Bills' category
      await ApiService.createHealthRecord({
        title: `Hospital Bill - ${hospitalNameInput || 'Sun Hospital'}`,
        category: 'Bills',
        hospitalName: hospitalNameInput || 'Sun Hospital',
        doctorName: 'Billing & Audit Dept',
        dateUploaded: new Date().toISOString().split('T')[0],
        fileUrl: uploadRes.url,
        fileType: uploadRes.fileType,
        fileSizeMb: uploadRes.fileSizeMb,
        tags: ['Hospital Bill', 'Transparency Audit', 'Itemized Charges'],
        notes: `Audited bill total: ₹${audited.calculatedGrandTotal.toLocaleString('en-IN')}`
      });

      setUploadSuccess(`Successfully uploaded and audited hospital bill!`);
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setTimeout(() => setUploadSuccess(''), 4000);
    } catch (err) {
      console.error('Error uploading bill:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateItem = (index: number, updated: Partial<BillLineItem>) => {
    const items = [...bill.items];
    const curr = { ...items[index], ...updated };
    if (updated.quantity !== undefined || updated.unitCost !== undefined) {
      curr.totalCost = curr.quantity * curr.unitCost;
    }
    items[index] = curr;
    const recalculated = BillService.auditBill({ ...bill, items });
    setBill(recalculated);
  };

  const handleAddItem = () => {
    const newItem: BillLineItem = {
      id: `bi_${Date.now()}`,
      chargeName: 'Additional Hospital Charge',
      quantity: 1,
      unitCost: 1000,
      totalCost: 1000,
      requiresVerification: false
    };
    const recalculated = BillService.auditBill({ ...bill, items: [...bill.items, newItem] });
    setBill(recalculated);
  };

  const handleRemoveItem = (index: number) => {
    const items = bill.items.filter((_, i) => i !== index);
    const recalculated = BillService.auditBill({ ...bill, items });
    setBill(recalculated);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-8 h-8 text-amber-700" />
            <span>Medical Bill Transparency</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Upload hospital bills to independently verify line items, check calculations, and audit total charges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Upload Bill Picture Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-amber-700 dark:hover:bg-amber-800 text-white font-extrabold text-xs sm:text-sm px-4 py-3 rounded-2xl flex items-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Bill Picture</span>
          </button>

          {/* Recalculate Button */}
          <button
            onClick={handleRunAudit}
            className="bg-amber-700 hover:bg-amber-800 text-white font-extrabold text-xs sm:text-sm px-4 py-3 rounded-2xl flex items-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
          >
            <Calculator className="w-4 h-4" />
            <span>Audit Calculations</span>
          </button>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Respectful Guidance Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-4 rounded-3xl text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong>Tone & Language Principle:</strong> SASHTYA uses respectful verification language (e.g. <em>"This charge may require verification with billing desk"</em>) to empower patient understanding without making unsubstantiated accusations.
        </div>
      </div>

      {/* Bill Overview Header & Picture Preview */}
      <div className="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-card space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Hospital Bill Transparency Audit</span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{bill.hospitalName}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bill Date: {bill.billDate} • Patient: {bill.patientName}</p>
          </div>

          <div className="flex items-center gap-2">
            {bill.discrepanciesCount > 0 ? (
              <span className="px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-xs font-black flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>{bill.discrepanciesCount} Line Requires Verification</span>
              </span>
            ) : (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs font-black flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Totals Match Calculated Rate</span>
              </span>
            )}
          </div>
        </div>

        {/* Uploaded Bill Picture Card (if uploaded) */}
        {uploadedBillImage && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 bg-black/10 shrink-0">
              <img src={uploadedBillImage} alt="Uploaded Bill" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-xs space-y-1">
              <span className="font-extrabold text-slate-900 dark:text-white text-sm block">Uploaded Hospital Receipt Picture</span>
              <p className="text-slate-500">Live line items below have been cross-checked with this receipt image.</p>
              <a 
                href={uploadedBillImage} 
                target="_blank" 
                rel="noreferrer"
                className="text-[#0057B8] dark:text-blue-400 font-bold inline-flex items-center gap-1 hover:underline pt-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Resolution Receipt</span>
              </a>
            </div>
          </div>
        )}

        {/* Itemized Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Itemized Charges ({bill.items.length})
            </span>
            <button
              onClick={handleAddItem}
              className="text-xs text-[#0057B8] dark:text-blue-400 font-extrabold flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Charge</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-extrabold uppercase border-y border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-3">Item Description</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Unit Cost</th>
                  <th className="py-3 px-3 text-right">Billed Total</th>
                  <th className="py-3 px-3 text-center">Verification Status</th>
                  <th className="py-3 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                {bill.items.map((item, idx) => (
                  <tr key={item.id} className={item.requiresVerification ? 'bg-amber-50/70 dark:bg-amber-950/30' : ''}>
                    <td className="py-3 px-3">
                      <strong className="font-extrabold text-slate-900 dark:text-white block">{item.chargeName}</strong>
                      {item.flaggedIssue && (
                        <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold block mt-1">
                          ⚠️ {item.flaggedIssue}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-3 text-right">₹{item.unitCost.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right font-black">₹{item.totalCost.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-center">
                      {item.requiresVerification ? (
                        <span className="px-2.5 py-1 rounded-md bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-black">
                          Requires Verification
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                          Verified
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg"
                        title="Remove Line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/70 p-5 rounded-2xl">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Calculated Standard Total</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">₹{bill.calculatedGrandTotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Billed Grand Total</span>
            <span className="text-2xl font-black text-amber-900 dark:text-amber-300">₹{bill.billedGrandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

      </div>

      {/* --- UPLOAD BILL MODAL --- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleUploadBillSubmit}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Upload Medical Bill Photo / PDF</h3>
              <button 
                type="button" 
                onClick={() => setIsUploadModalOpen(false)} 
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dropzone */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-600 rounded-3xl p-6 text-center bg-slate-50 dark:bg-slate-800/50 cursor-pointer space-y-2"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept="image/*,.pdf" 
              />
              
              {filePreviewUrl ? (
                <div className="space-y-2">
                  <img src={filePreviewUrl} alt="Bill Preview" className="max-h-40 mx-auto rounded-xl object-contain" />
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                    ✓ File selected: {selectedFile?.name}
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 mx-auto flex items-center justify-center">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                    Click to select bill photo or receipt
                  </p>
                  <p className="text-xs text-slate-500">Supports JPG, PNG, WEBP, PDF</p>
                </>
              )}
            </div>

            <div className="text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Hospital / Clinic Name</label>
              <input 
                type="text"
                value={hospitalNameInput}
                onChange={(e) => setHospitalNameInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-semibold text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isProcessing || !selectedFile}
                className="px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-extrabold text-xs shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Auditing Bill...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Audit Bill</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
