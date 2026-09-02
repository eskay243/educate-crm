import React, { useState } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';

export interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose }) => {
  const { kpis, students, mentors, expenses } = useCRM();

  const [format, setFormat] = useState<'PDF' | 'CSV' | 'XLSX'>('PDF');
  const [dateRange, setDateRange] = useState('This Quarter (Q3 2026)');
  const [includeRevenue, setIncludeRevenue] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [includeStudents, setIncludeStudents] = useState(true);
  const [includeMentors, setIncludeMentors] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  if (!isOpen) return null;

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);

    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
      setTimeout(() => {
        setExportComplete(false);
        onClose();
      }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Export Executive Situation Report</h2>
            <p className="font-body-md text-body-md text-secondary">Download Nigerian financial ledger summaries and cohort audit data.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
          </button>
        </div>

        {/* Form Body - 2 Columns */}
        <form onSubmit={handleExport} className="overflow-y-auto p-stack-lg flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            {/* Left 7 Columns: Configurations */}
            <div className="lg:col-span-7 space-y-stack-md">
              {/* Timeframe */}
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-secondary">Reporting Timeframe</label>
                <select
                  value={dateRange}
                  onChange={e => setDateRange(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  <option value="This Month (Aug 2026)">This Month (Aug 2026)</option>
                  <option value="This Quarter (Q3 2026)">This Quarter (Q3 2026)</option>
                  <option value="Year to Date (2026 YTD)">Year to Date (2026 YTD)</option>
                  <option value="All Time">All Time</option>
                </select>
              </div>

              {/* Data Modules */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-secondary">Data Modules to Include</label>
                <div className="space-y-2 p-3 rounded-lg bg-surface border border-outline-variant/60">
                  <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeRevenue}
                      onChange={e => setIncludeRevenue(e.target.checked)}
                      className="rounded border-outline text-primary focus:ring-primary"
                    />
                    <span>Tuition Collections &amp; Student Invoices (₦)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeExpenses}
                      onChange={e => setIncludeExpenses(e.target.checked)}
                      className="rounded border-outline text-primary focus:ring-primary"
                    />
                    <span>Operational Expenditures &amp; Vendor Payments (₦)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMentors}
                      onChange={e => setIncludeMentors(e.target.checked)}
                      className="rounded border-outline text-primary focus:ring-primary"
                    />
                    <span>Mentor Disbursements &amp; Bank Settlement Log</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeStudents}
                      onChange={e => setIncludeStudents(e.target.checked)}
                      className="rounded border-outline text-primary focus:ring-primary"
                    />
                    <span>Enrolled Student Attendance &amp; Proof Receipts</span>
                  </label>
                </div>
              </div>

              {/* Format Radio Tiles */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-secondary">Export Format</label>
                <div className="grid grid-cols-3 gap-3">
                  <label 
                    onClick={() => setFormat('PDF')}
                    className={`cursor-pointer flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors ${
                      format === 'PDF' 
                        ? 'bg-secondary-container border-primary text-primary font-bold' 
                        : 'border-outline-variant bg-surface hover:bg-surface-container text-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[28px]">picture_as_pdf</span>
                    <span className="font-body-md text-xs">PDF Document</span>
                  </label>
                  <label 
                    onClick={() => setFormat('XLSX')}
                    className={`cursor-pointer flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors ${
                      format === 'XLSX' 
                        ? 'bg-secondary-container border-primary text-primary font-bold' 
                        : 'border-outline-variant bg-surface hover:bg-surface-container text-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[28px]">table_chart</span>
                    <span className="font-body-md text-xs">Excel (.xlsx)</span>
                  </label>
                  <label 
                    onClick={() => setFormat('CSV')}
                    className={`cursor-pointer flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors ${
                      format === 'CSV' 
                        ? 'bg-secondary-container border-primary text-primary font-bold' 
                        : 'border-outline-variant bg-surface hover:bg-surface-container text-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[28px]">csv</span>
                    <span className="font-body-md text-xs">CSV Data</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Data Preview Summary */}
            <div className="lg:col-span-5">
              <div className="bg-surface border border-outline-variant rounded-lg p-stack-md flex flex-col h-full space-y-4">
                <div className="border-b border-outline-variant pb-2">
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">visibility</span> Data Preview
                  </h3>
                  <p className="font-body-sm text-xs text-secondary mt-0.5">{dateRange}</p>
                </div>

                {/* Financial Summary Preview */}
                <div className="space-y-2.5">
                  <div className="p-3 border border-outline-variant rounded bg-surface-container-low/40 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#166534]">
                        <span className="material-symbols-outlined text-[18px]">trending_up</span>
                      </div>
                      <div>
                        <p className="font-label-md text-xs text-secondary">Total Revenue</p>
                        <p className="font-headline-md text-sm font-bold text-on-surface">{formatNaira(kpis.totalRevenue)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border border-outline-variant rounded bg-surface-container-low/40 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#fee2e2] flex items-center justify-center text-[#991b1b]">
                        <span className="material-symbols-outlined text-[18px]">trending_down</span>
                      </div>
                      <div>
                        <p className="font-label-md text-xs text-secondary">Total Expenses</p>
                        <p className="font-headline-md text-sm font-bold text-on-surface">{formatNaira(kpis.totalExpenses)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border border-primary rounded bg-primary text-on-primary flex justify-between items-center shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-[18px]">account_balance</span>
                      </div>
                      <div>
                        <p className="font-label-md text-xs text-primary-fixed-dim">Net Situation</p>
                        <p className="font-display text-base font-bold text-white">{formatNaira(kpis.totalRevenue - kpis.totalExpenses)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operational Counts */}
                <div className="pt-2 border-t border-outline-variant">
                  <h4 className="font-label-md text-xs text-secondary uppercase tracking-wider mb-2 font-semibold">Included Records</h4>
                  <ul className="space-y-1 text-xs font-data-tabular">
                    <li className="flex justify-between text-on-surface">
                      <span>Faculty Mentors</span>
                      <span className="font-bold">{mentors.length}</span>
                    </li>
                    <li className="flex justify-between text-on-surface">
                      <span>Enrolled Students</span>
                      <span className="font-bold">{students.length}</span>
                    </li>
                    <li className="flex justify-between text-on-surface">
                      <span>Expense Ledger Items</span>
                      <span className="font-bold">{expenses.length}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="mt-stack-lg pt-stack-md border-t border-outline-variant flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-10 rounded border border-outline-variant font-label-md text-label-md font-semibold text-secondary hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isExporting || exportComplete}
              className="px-6 h-10 rounded bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-2 disabled:opacity-75"
            >
              {isExporting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Generating {format}...</span>
                </>
              ) : exportComplete ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
                  <span>Report Downloaded!</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                  <span>Generate &amp; Export Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

