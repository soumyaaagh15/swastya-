import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Directories
const uploadsDir = path.join(__dirname, '../uploads');
const dataDir = path.join(__dirname, 'data');
const recordsFile = path.join(dataDir, 'records.json');

// Ensure required directories exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial Seed Data for Health Records
const defaultRecords = [
  {
    id: 'rec_101',
    title: 'Dr. Ananya Sen - Cardiology Prescription',
    category: 'Prescriptions',
    doctorName: 'Dr. Ananya Sen (MD, DM)',
    hospitalName: 'Apollo Hospital & Heart Institute',
    dateUploaded: '2026-08-18',
    fileUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=60',
    fileType: 'image',
    fileSizeMb: 1.4,
    tags: ['Cardiology', 'Hypertension', 'Daily Dosage'],
    notes: 'Prescribed Telmisartan 40mg and Amlodipine 5mg for 30 days.'
  },
  {
    id: 'rec_102',
    title: 'HbA1c & Fasting Lipid Profile Blood Report',
    category: 'Lab Reports',
    doctorName: 'Dr. R.K. Mishra (Pathologist)',
    hospitalName: 'Thyrocare / Max Lab Diagnostics',
    dateUploaded: '2026-08-15',
    fileUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&auto=format&fit=crop&q=60',
    fileType: 'pdf',
    fileSizeMb: 2.8,
    tags: ['Blood Test', 'Diabetes', 'HbA1c 6.8%'],
    notes: 'Blood sugar controlled. HbA1c improved to 6.8%.'
  },
  {
    id: 'rec_103',
    title: 'Chest X-Ray & ECG Report',
    category: 'Scans',
    doctorName: 'Dr. S. Patnaik',
    hospitalName: 'Sun Hospital Imaging Centre',
    dateUploaded: '2026-08-02',
    fileUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=60',
    fileType: 'image',
    fileSizeMb: 3.1,
    tags: ['X-Ray', 'ECG', 'Normal Sinus Rhythm'],
    notes: 'Normal lung fields, clear costophrenic angles.'
  },
  {
    id: 'rec_104',
    title: 'Ayushman Bharat Cashless Admission Discharge Summary',
    category: 'Discharge',
    doctorName: 'Dr. Ananya Sen',
    hospitalName: 'SCB Medical College & Hospital',
    dateUploaded: '2026-07-10',
    fileUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60',
    fileType: 'pdf',
    fileSizeMb: 4.2,
    tags: ['Discharge', 'Cashless', 'In-Patient'],
    notes: 'Observation for mild chest discomfort. Discharged in stable condition.'
  }
];

// Helper to read/write records
function getSavedRecords() {
  try {
    if (!fs.existsSync(recordsFile)) {
      fs.writeFileSync(recordsFile, JSON.stringify(defaultRecords, null, 2));
      return defaultRecords;
    }
    const data = fs.readFileSync(recordsFile, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading records file:', err);
    return defaultRecords;
  }
}

function saveRecords(records) {
  try {
    fs.writeFileSync(recordsFile, JSON.stringify(records, null, 2));
  } catch (err) {
    console.error('Error saving records:', err);
  }
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e4)}`;
    cb(null, `${baseName}_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Serve static uploaded files
app.use('/uploads', express.static(uploadsDir));

// --- ROUTES ---

// Healthcheck
app.get('/api/health', (req, res) => {
  const files = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
  res.json({
    status: 'ok',
    message: 'SASHTYA Backend Server is running',
    timestamp: new Date().toISOString(),
    uploadsCount: files.length,
    port: PORT
  });
});

// Upload Single File
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  const fileSizeMb = parseFloat((req.file.size / (1024 * 1024)).toFixed(2)) || 0.1;
  const isPdf = req.file.mimetype.includes('pdf') || req.file.originalname.toLowerCase().endsWith('.pdf');

  res.json({
    success: true,
    file: {
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      sizeBytes: req.file.size,
      fileSizeMb,
      fileType: isPdf ? 'pdf' : 'image',
      uploadedAt: new Date().toISOString()
    }
  });
});

// Get All Health Records
app.get('/api/records', (req, res) => {
  const records = getSavedRecords();
  res.json(records);
});

// Create New Health Record
app.post('/api/records', (req, res) => {
  const records = getSavedRecords();
  const newRecord = {
    id: req.body.id || `rec_${Date.now()}`,
    title: req.body.title || 'Medical Document',
    category: req.body.category || 'Other',
    doctorName: req.body.doctorName || 'Attending Physician',
    hospitalName: req.body.hospitalName || 'Healthcare Provider',
    dateUploaded: req.body.dateUploaded || new Date().toISOString().split('T')[0],
    fileUrl: req.body.fileUrl || '/uploads/default.jpg',
    fileType: req.body.fileType || 'image',
    fileSizeMb: req.body.fileSizeMb || 1.0,
    tags: Array.isArray(req.body.tags) ? req.body.tags : ['Uploaded Document'],
    notes: req.body.notes || 'Uploaded by patient'
  };

  const updatedRecords = [newRecord, ...records];
  saveRecords(updatedRecords);
  res.status(201).json(newRecord);
});

// Delete Record
app.delete('/api/records/:id', (req, res) => {
  const { id } = req.params;
  const records = getSavedRecords();
  const recordToDelete = records.find(r => r.id === id);

  if (recordToDelete && recordToDelete.fileUrl && recordToDelete.fileUrl.startsWith('/uploads/')) {
    const filename = recordToDelete.fileUrl.replace('/uploads/', '');
    const localFilePath = path.join(uploadsDir, filename);
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.warn('Could not delete file from disk:', err);
      }
    }
  }

  const updatedRecords = records.filter(r => r.id !== id);
  saveRecords(updatedRecords);
  res.json({ success: true, message: 'Record deleted', id });
});

// Prescription OCR Scanner Endpoint
app.post('/api/ocr/scan-prescription', upload.single('file'), (req, res) => {
  let fileUrl = req.body.fileUrl;
  let fileName = req.body.fileName || 'Prescription.jpg';

  if (req.file) {
    fileUrl = `/uploads/${req.file.filename}`;
    fileName = req.file.originalname;
  }

  const ocrResult = {
    prescriptionId: `presc_ocr_${Date.now().toString().slice(-4)}`,
    doctorName: req.body.doctorName || 'Dr. Ananya Sen (MD, DM Cardiology)',
    clinicHospital: req.body.clinicHospital || 'SCB Medical College & Hospital',
    date: new Date().toISOString().split('T')[0],
    imageUrl: fileUrl,
    fileName: fileName,
    rawText: `
SCB MEDICAL COLLEGE & HOSPITAL
OPD Card #89412 - Dept of Cardiology
Patient: Aarav Sharma (Age: 42, M) Date: ${new Date().toLocaleDateString()}

Rx:
1. Tab. Paracetamol 500mg -- 1-0-1 (3 days) after food
2. Tab. Pantoprazole 40mg -- 1-0-0 (7 days) 30 min before breakfast
3. Tab. Telmisartan 40mg -- 1-0-0 (30 days) morning after breakfast
4. Tab. Azithromycin 500mg -- 1-0-0 (5 days) after dinner

Follow up after 15 days.
Dr. Ananya Sen (MD, DM)
    `.trim(),
    confidenceScore: 0.96,
    extractedMedicines: [
      {
        id: `med_${Date.now()}_1`,
        name: 'Paracetamol 500 mg',
        dosageStrength: '500 mg',
        frequency: 'Twice daily (1-0-1)',
        timeOfDay: ['Morning', 'Night'],
        durationDays: 3,
        instructions: 'Take after meals for fever or ache'
      },
      {
        id: `med_${Date.now()}_2`,
        name: 'Pantoprazole 40 mg',
        dosageStrength: '40 mg',
        frequency: 'Once daily (1-0-0)',
        timeOfDay: ['Morning'],
        durationDays: 7,
        instructions: 'Take 30 minutes before breakfast on empty stomach'
      },
      {
        id: `med_${Date.now()}_3`,
        name: 'Telmisartan 40 mg',
        dosageStrength: '40 mg',
        frequency: 'Once daily (1-0-0)',
        timeOfDay: ['Morning'],
        durationDays: 30,
        instructions: 'Take after morning breakfast for BP regulation'
      }
    ]
  };

  res.json({
    success: true,
    data: ocrResult
  });
});

// Bill OCR / Audit Endpoint
app.post('/api/ocr/scan-bill', upload.single('file'), (req, res) => {
  let fileUrl = req.body.fileUrl;
  let fileName = req.body.fileName || 'Hospital_Bill.pdf';

  if (req.file) {
    fileUrl = `/uploads/${req.file.filename}`;
    fileName = req.file.originalname;
  }

  const billAuditData = {
    id: `bill_${Date.now()}`,
    hospitalName: req.body.hospitalName || 'Sun Hospital & Heart Research Institute',
    billDate: new Date().toISOString().split('T')[0],
    patientName: 'Aarav Sharma',
    imageUrl: fileUrl,
    fileName: fileName,
    items: [
      {
        id: 'bi_1',
        chargeName: 'Deluxe Private Room Bed Charges (3 Days)',
        quantity: 3,
        unitCost: 3500,
        totalCost: 10500,
        requiresVerification: false
      },
      {
        id: 'bi_2',
        chargeName: 'Cardiologist Consultation & Round Visits',
        quantity: 3,
        unitCost: 1200,
        totalCost: 3600,
        requiresVerification: false
      },
      {
        id: 'bi_3',
        chargeName: 'Nursing Care & Monitoring Charges',
        quantity: 3,
        unitCost: 800,
        totalCost: 3400,
        flaggedIssue: 'Calculated line item total (₹2,400) differs from billed item total (₹3,400). Requires verification with billing desk.',
        requiresVerification: true
      },
      {
        id: 'bi_4',
        chargeName: 'Diagnostic Investigations (ECG, 2D Echo, Lipid Panel)',
        quantity: 1,
        unitCost: 4500,
        totalCost: 4500,
        requiresVerification: false
      },
      {
        id: 'bi_5',
        chargeName: 'In-Patient Pharmacy & Consumables',
        quantity: 1,
        unitCost: 2850,
        totalCost: 2850,
        requiresVerification: false
      }
    ],
    subtotal: 24850,
    taxAmount: 0,
    calculatedGrandTotal: 23850,
    billedGrandTotal: 24850,
    discrepanciesCount: 1,
    status: 'Discrepancy Found'
  };

  res.json({
    success: true,
    data: billAuditData
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SASHTYA Backend Server running on http://localhost:${PORT}`);
  console.log(`📂 Uploads directory: ${uploadsDir}`);
});
