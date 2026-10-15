import React, { useState } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';

export interface BulkUploadCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedCourse {
  code: string;
  title: string;
  category: string;
  durationWeeks: number;
  tuitionFee: number;
  leadInstructor: string;
  description: string;
  syllabusModules: string[];
  isValid: boolean;
  errors: string[];
}

export const BulkUploadCoursesModal: React.FC<BulkUploadCoursesModalProps> = ({ isOpen, onClose }) => {
  const { addCourse, activeMentors, showToast } = useCRM();

  const [fileName, setFileName] = useState<string>('');
  const [parsedCourses, setParsedCourses] = useState<ParsedCourse[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  // Download Sample CSV
  const handleDownloadCsvTemplate = () => {
    const csvHeader = 'code,title,category,durationWeeks,tuitionFee,leadInstructor,description,syllabusModules\n';
    const csvRow1 = 'DFT-501,"Diploma in Financial Trading","Fintech & Financial Markets",12,650000,"Abiola Adefowope","VTCT Level 5 Advanced Diploma in Financial Trading covering derivatives, forex, and risk governance.","Week 1: Foundations;Week 2: Equities & Futures;Week 3: Fixed Income & FX;Week 4: Options"\n';
    const csvRow2 = 'SWE-301,"Full-Stack Cloud & TypeScript Engineering","Software Engineering",16,850000,"Bolanle Nnamdi","End-to-end fullstack development with Node.js, React, Docker, and Microservices.","Module 1: Advanced TypeScript;Module 2: Cloud Architectures;Module 3: PostgreSQL & Distributed Systems"\n';
    const csvRow3 = 'AI-401,"Applied Artificial Intelligence & Machine Learning","Data Science & AI",12,750000,"General Faculty","Practical LLM orchestration, model fine-tuning, embeddings, and vector databases.","Unit 1: Python for Data Science;Unit 2: Deep Learning Foundations;Unit 3: LLM Engineering"\n';

    const blob = new Blob([csvHeader + csvRow1 + csvRow2 + csvRow3], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'courses_bulk_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Sample JSON
  const handleDownloadJsonTemplate = () => {
    const jsonSample = [
      {
        code: 'DFT-501',
        title: 'Diploma in Financial Trading',
        category: 'Fintech & Financial Markets',
        durationWeeks: 12,
        tuitionFee: 650000,
        leadInstructor: 'Abiola Adefowope',
        description: 'VTCT Level 5 Advanced Diploma in Financial Trading covering derivatives, forex, and risk governance.',
        syllabusModules: [
          'Week 1: Foundations & Principles',
          'Week 2: Equities & Futures Mechanics',
          'Week 3: Fixed Income & FX Derivatives',
          'Week 4: Options & Greeks'
        ]
      },
      {
        code: 'SWE-301',
        title: 'Full-Stack Cloud & TypeScript Engineering',
        category: 'Software Engineering',
        durationWeeks: 16,
        tuitionFee: 850000,
        leadInstructor: 'Bolanle Nnamdi',
        description: 'End-to-end fullstack development with Node.js, React, Docker, and Microservices.',
        syllabusModules: [
          'Module 1: Advanced TypeScript',
          'Module 2: Cloud Architectures',
          'Module 3: PostgreSQL & Distributed Systems'
        ]
      }
    ];

    const blob = new Blob([JSON.stringify(jsonSample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'courses_bulk_import_template.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parse CSV Line Helper (handles quoted commas)
  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const isJson = file.name.endsWith('.json');

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCourses(text, isJson ? 'json' : 'csv');
      };
      reader.readAsText(file);
    }
  };

  const parseCourses = (content: string, format: 'csv' | 'json') => {
    const list: ParsedCourse[] = [];

    if (format === 'json') {
      try {
        const data = JSON.parse(content);
        if (!Array.isArray(data)) {
          showToast('JSON Format Error', 'Expected a JSON array of course objects.', 'error');
          return;
        }

        data.forEach((item: any, idx: number) => {
          const errors: string[] = [];
          if (!item.title) errors.push('Course title is required');
          if (!item.code) errors.push('Course code is required');
          const fee = Number(item.tuitionFee);
          if (isNaN(fee) || fee <= 0) errors.push('Tuition fee must be a positive number');

          const weeks = Number(item.durationWeeks) || 12;

          let rawModules: string[] = [];
          if (Array.isArray(item.syllabusModules)) {
            rawModules = item.syllabusModules;
          } else if (typeof item.syllabusModules === 'string') {
            rawModules = item.syllabusModules.split(';').map((m: string) => m.trim()).filter(Boolean);
          }

          list.push({
            code: (item.code || `CRS-${idx + 1}`).toUpperCase().trim(),
            title: item.title || 'Untitled Course',
            category: item.category || 'General Curriculum',
            durationWeeks: weeks,
            tuitionFee: isNaN(fee) ? 0 : fee,
            leadInstructor: item.leadInstructor || activeMentors[0]?.name || 'General Faculty',
            description: item.description || `Comprehensive course track in ${item.title || 'the subject'}.`,
            syllabusModules: rawModules.length > 0 ? rawModules : ['Foundational Syllabus & Practical Labs'],
            isValid: errors.length === 0,
            errors,
          });
        });
      } catch (err) {
        showToast('JSON Parse Error', 'Unable to parse JSON file. Please check syntax.', 'error');
      }
    } else {
      // CSV parser
      const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        showToast('CSV Error', 'CSV file must have a header row and at least one course data row.', 'warning');
        return;
      }

      // First line is header
      const rows = lines.slice(1);
      rows.forEach((row) => {
        const cols = parseCSVLine(row);
        if (cols.length < 2) return;

        const [
          code = '',
          title = '',
          category = 'General Curriculum',
          durationWeeks = '12',
          tuitionFee = '500000',
          leadInstructor = activeMentors[0]?.name || 'General Faculty',
          description = '',
          syllabusModules = ''
        ] = cols;

        const errors: string[] = [];
        if (!title.replace(/^"|"$/g, '').trim()) errors.push('Title missing');
        if (!code.replace(/^"|"$/g, '').trim()) errors.push('Code missing');
        const cleanFee = Number(tuitionFee.replace(/[^0-9.]/g, ''));
        if (isNaN(cleanFee) || cleanFee <= 0) errors.push('Tuition fee must be > 0');

        const cleanModules = syllabusModules
          .replace(/^"|"$/g, '')
          .split(';')
          .map(m => m.trim())
          .filter(Boolean);

        list.push({
          code: code.replace(/^"|"$/g, '').toUpperCase().trim(),
          title: title.replace(/^"|"$/g, '').trim(),
          category: category.replace(/^"|"$/g, '').trim(),
          durationWeeks: Number(durationWeeks) || 12,
          tuitionFee: isNaN(cleanFee) ? 0 : cleanFee,
          leadInstructor: leadInstructor.replace(/^"|"$/g, '').trim() || 'General Faculty',
          description: description.replace(/^"|"$/g, '').trim() || `Comprehensive curriculum training track.`,
          syllabusModules: cleanModules.length > 0 ? cleanModules : ['Curriculum Overview & Practical Labs'],
          isValid: errors.length === 0,
          errors,
        });
      });
    }

    setParsedCourses(list);
  };

  const validCount = parsedCourses.filter(c => c.isValid).length;
  const invalidCount = parsedCourses.filter(c => !c.isValid).length;

  const handleImportCourses = async () => {
    const validOnes = parsedCourses.filter(c => c.isValid);
    if (validOnes.length === 0) {
      showToast('No Valid Courses', 'Please resolve parsing errors before importing.', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      for (const course of validOnes) {
        addCourse({
          code: course.code,
          title: course.title,
          category: course.category,
          durationWeeks: course.durationWeeks,
          tuitionFee: course.tuitionFee,
          leadInstructor: course.leadInstructor,
          description: course.description,
          syllabusModules: course.syllabusModules,
          status: 'Active',
        });
      }

      showToast('Bulk Courses Uploaded', `Successfully imported ${validOnes.length} courses into the catalog.`, 'success');
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">upload_file</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-lg font-bold text-on-surface">Bulk Upload Academic Courses</h2>
              <p className="font-body-sm text-xs text-secondary">
                Upload multiple courses, syllabus modules, tuition pricing in ₦, and faculty leads using CSV or JSON format.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-stack-lg space-y-5 flex-1">
          {/* Download Templates Banner */}
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-0.5">
              <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-blue-600">download</span>
                <span>Standardized Course Import Format</span>
              </h4>
              <p className="text-secondary leading-relaxed">
                Download the verified import template to ensure your course codes, syllabus modules (semicolon-separated), and Naira tuition fees match the schema.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="h-8 px-3 rounded bg-white hover:bg-blue-100 text-primary font-bold text-xs border border-primary/30 flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">table_chart</span>
                <span>Download CSV Template</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadJsonTemplate}
                className="h-8 px-3 rounded bg-white hover:bg-blue-100 text-primary font-bold text-xs border border-primary/30 flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">code</span>
                <span>Download JSON Template</span>
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="space-y-2">
            <label
              htmlFor="course-bulk-file"
              className="border-2 border-dashed border-outline-variant hover:border-primary rounded-xl p-6 flex flex-col items-center justify-center bg-surface hover:bg-surface-container-low transition-all cursor-pointer text-center block"
            >
              <input
                id="course-bulk-file"
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-secondary-container text-primary flex items-center justify-center mb-2 mx-auto">
                <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
              </div>
              <p className="font-headline-md text-sm font-bold text-on-surface">
                {fileName ? fileName : 'Choose CSV or JSON Course File'}
              </p>
              <p className="text-xs text-secondary mt-1">
                Drag and drop your prepared course list or click to browse (supports .csv, .json)
              </p>
            </label>
          </div>

          {/* Parsed Preview Table */}
          {parsedCourses.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <span>Detected Courses ({parsedCourses.length})</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-error-container text-error text-[10px] font-bold">
                      {invalidCount} Issues
                    </span>
                  )}
                </h4>
              </div>

              <div className="overflow-x-auto rounded-lg border border-outline-variant/80 max-h-72">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-surface-container-low text-secondary font-semibold uppercase text-[11px] sticky top-0 border-b border-outline-variant">
                    <tr>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Course Program</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Weeks</th>
                      <th className="p-2.5">Tuition (₦)</th>
                      <th className="p-2.5">Lead Faculty</th>
                      <th className="p-2.5">Modules</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60 font-data-tabular">
                    {parsedCourses.map((c, index) => (
                      <tr key={index} className={`hover:bg-surface-bright ${!c.isValid ? 'bg-red-50/50' : ''}`}>
                        <td className="p-2.5 font-bold text-primary">{c.code}</td>
                        <td className="p-2.5 font-semibold text-on-surface">{c.title}</td>
                        <td className="p-2.5 text-secondary">{c.category}</td>
                        <td className="p-2.5 text-secondary">{c.durationWeeks} Wks</td>
                        <td className="p-2.5 font-bold text-emerald-700">{formatNaira(c.tuitionFee)}</td>
                        <td className="p-2.5 text-secondary">{c.leadInstructor}</td>
                        <td className="p-2.5 text-secondary">
                          <span className="px-2 py-0.5 rounded bg-surface border border-outline-variant text-[11px]">
                            {c.syllabusModules.length} Modules
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          {c.isValid ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Ready
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-error-container text-error text-[10px] font-bold" title={c.errors.join(', ')}>
                              Invalid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-stack-md px-stack-lg border-t border-outline-variant flex justify-between items-center bg-surface-bright">
          <p className="text-xs text-secondary">
            {validCount > 0 ? `${validCount} courses ready for immediate catalog integration.` : 'Upload a formatted file to begin.'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded border border-outline-variant text-xs font-semibold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={validCount === 0 || isProcessing}
              onClick={handleImportCourses}
              className="px-5 h-9 rounded bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">publish</span>
              <span>{isProcessing ? 'Importing...' : `Import ${validCount} Courses`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
