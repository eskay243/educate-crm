import React, { useState } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose }) => {
  const { kpis, students, mentors, expenses, leads, currentUser, addNotification } = useCRM();

  const [format, setFormat] = useState<'PDF' | 'CSV' | 'XLSX'>('PDF');
  const [dateRange, setDateRange] = useState('This Quarter (Q3 2026)');
  const [includeRevenue, setIncludeRevenue] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [includeStudents, setIncludeStudents] = useState(true);
  const [includeMentors, setIncludeMentors] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const dateStamp = new Date().toISOString().slice(0, 10);
    const timeStamp = new Date().toLocaleTimeString();

    // Institutional Banner Header
    doc.setFillColor(30, 27, 75); // Deep Indigo (#1e1b4b)
    doc.rect(0, 0, 210, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EDUCATE CRM | EXECUTIVE SITUATION & AUDIT REPORT', 14, 11);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(224, 231, 255);
    doc.text(`Generated: ${dateStamp} ${timeStamp} | Timeframe: ${dateRange} | Prepared by: ${currentUser?.name || 'Administrator'}`, 14, 18);

    let currentY = 30;

    // 1. Executive Summary Table
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Executive Financial & Operational Overview (NGN)', 14, currentY);
    currentY += 4;

    const netSituation = kpis.totalRevenue - kpis.totalExpenses;
    const summaryData = [
      ['Gross Tuition Revenue Collected', formatNaira(kpis.totalRevenue), `${students.length} Enrolled Students`],
      ['Total Operating Expenditures (OpEx)', formatNaira(kpis.totalExpenses), `${expenses.length} Approved Ledger Items`],
      ['Faculty Honorariums & Mentor Payouts', formatNaira(kpis.mentorPayouts), `${mentors.length} Verified Mentors`],
      ['Net Institutional Operating Surplus', formatNaira(netSituation), `${kpis.operatingMargin}% Net Operating Margin`],
      ['Prospective Leads In Follow-up', `${leads.length} Leads`, `${leads.filter(l => l.status === 'Qualified').length} Qualified Prospects`]
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Institutional Metric', 'Current Amount / Count', 'Operational Context']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [49, 46, 129], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      margin: { left: 14, right: 14 }
    });

    currentY = (doc as any).lastAutoTable?.finalY + 8 || currentY + 40;

    // 2. Student Revenue / Tuition Collections
    if (includeRevenue && students.length > 0) {
      if (currentY > 240) { doc.addPage(); currentY = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('2. Tuition Billing & Student Enrollment Schedule', 14, currentY);
      currentY += 4;

      const studentRows = students.slice(0, 40).map(s => {
        const tuition = s.totalFees || s.tuitionAmount || 850000;
        const paid = s.paidAmount !== undefined ? s.paidAmount : (s.totalFees - (s.outstandingBalance || 0));
        return [
          s.studentCode || s.id.slice(0, 8),
          s.name,
          s.program || 'Software Engineering',
          formatNaira(tuition),
          formatNaira(paid),
          s.tuitionStatus || 'Pending'
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Student ID', 'Student Full Name', 'Academic Program', 'Tuition Fee', 'Paid Amount', 'Billing Status']],
        body: studentRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable?.finalY + 8 || currentY + 40;
    }

    // 3. Operational Expenses
    if (includeExpenses && expenses.length > 0) {
      if (currentY > 240) { doc.addPage(); currentY = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('3. Operational Expenditures (OpEx) & Reimbursement Ledger', 14, currentY);
      currentY += 4;

      const expenseRows = expenses.slice(0, 40).map(e => [
        e.expenseCode || e.id.slice(0, 8),
        e.title,
        e.category,
        formatNaira(e.amount),
        e.status,
        e.date || dateStamp
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Voucher #', 'Expense Description', 'Category', 'Amount (NGN)', 'Approval Status', 'Ledger Date']],
        body: expenseRows,
        theme: 'grid',
        headStyles: { fillColor: [180, 83, 9], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable?.finalY + 8 || currentY + 40;
    }

    // 4. Faculty Mentors
    if (includeMentors && mentors.length > 0) {
      if (currentY > 240) { doc.addPage(); currentY = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('4. Faculty Honorariums & Mentor Banking Settlements', 14, currentY);
      currentY += 4;

      const mentorRows = mentors.slice(0, 30).map(m => [
        `#${m.mentorCode}`,
        m.name,
        m.department,
        `${m.sessionsCount || 0} Sessions`,
        formatNaira(m.pendingPayout || 0),
        m.payoutStatus || 'Pending'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Mentor Code', 'Faculty Member', 'Department', 'Sessions', 'Pending Honorarium', 'Settlement Status']],
        body: mentorRows,
        theme: 'grid',
        headStyles: { fillColor: [67, 56, 202], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable?.finalY + 8 || currentY + 40;
    }

    // 5. Leads Pipeline & Follow-up Schedule
    if (includeStudents && leads.length > 0) {
      if (currentY > 240) { doc.addPage(); currentY = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('5. Prospective Leads Pipeline & Contact Follow-ups', 14, currentY);
      currentY += 4;

      const leadRows = leads.slice(0, 40).map(l => [
        l.name,
        l.phone || 'N/A',
        l.programInterest,
        l.status,
        formatNaira(l.dealValue || 850000),
        l.nextFollowUpDate ? `${l.nextFollowUpDate} (${l.preferredChannel || 'Call'})` : 'Unscheduled'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Lead Name', 'Phone Number', 'Program Interest', 'Pipeline Stage', 'Deal Value', 'Next Follow-up']],
        body: leadRows,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        margin: { left: 14, right: 14 }
      });
    }

    const filename = `educate_crm_executive_report_${dateStamp}.pdf`;
    doc.save(filename);
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const dateStamp = new Date().toISOString().slice(0, 10);

    // Sheet 1: Executive KPI Summary
    const summaryRows = [
      { Metric: 'Gross Tuition Revenue', Amount_NGN: kpis.totalRevenue, Details: `${students.length} Enrolled Students` },
      { Metric: 'Total Operating Expenses', Amount_NGN: kpis.totalExpenses, Details: `${expenses.length} OpEx Records` },
      { Metric: 'Faculty Honorariums', Amount_NGN: kpis.mentorPayouts, Details: `${mentors.length} Faculty Mentors` },
      { Metric: 'Net Operating Surplus', Amount_NGN: kpis.totalRevenue - kpis.totalExpenses, Details: `${kpis.operatingMargin}% Margin` },
      { Metric: 'Active Prospective Leads', Amount_NGN: leads.length, Details: `${leads.filter(l => l.status === 'Qualified').length} Qualified` },
      { Metric: 'Report Date Range', Amount_NGN: dateRange, Details: `Exported on ${dateStamp}` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

    // Sheet 2: Students & Tuition
    if (includeRevenue && students.length > 0) {
      const studentRows = students.map(s => {
        const tuition = s.totalFees || s.tuitionAmount || 850000;
        const paid = s.paidAmount !== undefined ? s.paidAmount : (s.totalFees - (s.outstandingBalance || 0));
        return {
          StudentID: s.studentCode || s.id,
          FullName: s.name,
          Email: s.email,
          Phone: s.phone || '',
          Program: s.program || 'Software Engineering',
          TuitionFee_NGN: tuition,
          PaidAmount_NGN: paid,
          Balance_NGN: Math.max(0, tuition - paid),
          PaymentStatus: s.tuitionStatus || 'Pending',
          EnrolledDate: s.enrolledDate || dateStamp
        };
      });
      const wsStudents = XLSX.utils.json_to_sheet(studentRows);
      XLSX.utils.book_append_sheet(wb, wsStudents, 'Student Tuition');
    }

    // Sheet 3: Operational Expenses
    if (includeExpenses && expenses.length > 0) {
      const expenseRows = expenses.map(e => ({
        VoucherID: e.expenseCode || e.id,
        Description: e.title,
        Category: e.category,
        Amount_NGN: e.amount,
        Status: e.status,
        RequestedBy: e.requestedBy || 'Admin',
        Date: e.date || dateStamp,
        ApprovedTimestamp: e.reviewedAt || e.createdAt || ''
      }));
      const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'OpEx Ledger');
    }

    // Sheet 4: Faculty Mentors
    if (includeMentors && mentors.length > 0) {
      const mentorRows = mentors.map(m => ({
        MentorCode: m.mentorCode,
        FullName: m.name,
        Email: m.email,
        Department: m.department,
        SessionsCount: m.sessionsCount || 0,
        PendingPayout_NGN: m.pendingPayout || 0,
        PayoutStatus: m.payoutStatus || 'Pending',
        SettlementBank: m.bankName || 'N/A',
        NUBAN_Account: m.accountNumber || 'N/A'
      }));
      const wsMentors = XLSX.utils.json_to_sheet(mentorRows);
      XLSX.utils.book_append_sheet(wb, wsMentors, 'Faculty Mentors');
    }

    // Sheet 5: Prospective Leads & Follow-ups
    if (includeStudents && leads.length > 0) {
      const leadRows = leads.map(l => ({
        LeadID: l.id,
        Name: l.name,
        Email: l.email,
        Phone: l.phone || '',
        Company: l.company || '',
        ProgramInterest: l.programInterest,
        PipelineStage: l.status,
        DealValue_NGN: l.dealValue || 850000,
        Score: l.score || 0,
        AssignedRep: l.assignedRep,
        NextFollowUpDate: l.nextFollowUpDate || '',
        NextFollowUpTime: l.nextFollowUpTime || '',
        PreferredChannel: l.preferredChannel || '',
        FollowUpPriority: l.followUpPriority || '',
        FollowUpStatus: l.followUpStatus || 'Pending',
        DiscoveryNotes: l.notes || ''
      }));
      const wsLeads = XLSX.utils.json_to_sheet(leadRows);
      XLSX.utils.book_append_sheet(wb, wsLeads, 'Leads & Follow-ups');
    }

    const filename = `educate_crm_executive_report_${dateStamp}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const exportToCSV = () => {
    const dateStamp = new Date().toISOString().slice(0, 10);
    const rows: string[][] = [
      ['EDUCATE CRM - EXECUTIVE FINANCIAL & AUDIT REPORT'],
      ['Timeframe', dateRange],
      ['Exported At', `${dateStamp} ${new Date().toLocaleTimeString()}`],
      ['Prepared By', currentUser?.name || 'Administrator'],
      [],
      ['EXECUTIVE KPI METRICS'],
      ['Gross Tuition Revenue (NGN)', String(kpis.totalRevenue)],
      ['Total Operating Expenses (NGN)', String(kpis.totalExpenses)],
      ['Faculty Honorariums (NGN)', String(kpis.mentorPayouts)],
      ['Net Operating Surplus (NGN)', String(kpis.totalRevenue - kpis.totalExpenses)],
      ['Operating Margin (%)', String(kpis.operatingMargin)],
      ['Enrolled Students', String(students.length)],
      ['Active Leads', String(leads.length)],
      []
    ];

    if (includeRevenue && students.length > 0) {
      rows.push(['STUDENT TUITION BILLING SCHEDULE']);
      rows.push(['Student ID', 'Full Name', 'Email', 'Program', 'Tuition (NGN)', 'Paid (NGN)', 'Status']);
      students.forEach(s => {
        const tuition = s.totalFees || s.tuitionAmount || 850000;
        const paid = s.paidAmount !== undefined ? s.paidAmount : (s.totalFees - (s.outstandingBalance || 0));
        rows.push([
          s.studentCode || s.id,
          s.name,
          s.email,
          s.program || 'Software Engineering',
          String(tuition),
          String(paid),
          s.tuitionStatus || 'Pending'
        ]);
      });
      rows.push([]);
    }

    if (includeExpenses && expenses.length > 0) {
      rows.push(['OPERATIONAL EXPENDITURES (OPEX)']);
      rows.push(['Voucher #', 'Description', 'Category', 'Amount (NGN)', 'Status', 'Date']);
      expenses.forEach(e => {
        rows.push([
          e.expenseCode || e.id,
          e.title,
          e.category,
          String(e.amount),
          e.status,
          e.date || dateStamp
        ]);
      });
      rows.push([]);
    }

    if (includeStudents && leads.length > 0) {
      rows.push(['PROSPECTIVE LEADS & FOLLOW-UP SCHEDULE']);
      rows.push(['Lead Name', 'Phone', 'Email', 'Program', 'Status', 'Deal Value (NGN)', 'Next Follow-up Date', 'Channel', 'Rep']);
      leads.forEach(l => {
        rows.push([
          l.name,
          l.phone || '',
          l.email,
          l.programInterest,
          l.status,
          String(l.dealValue || 850000),
          l.nextFollowUpDate || 'None',
          l.preferredChannel || 'Call',
          l.assignedRep || ''
        ]);
      });
    }

    const csvContent = rows
      .map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `educate_crm_executive_report_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsExporting(true);

    try {
      if (format === 'PDF') {
        exportToPDF();
      } else if (format === 'XLSX') {
        exportToExcel();
      } else if (format === 'CSV') {
        exportToCSV();
      }

      setIsExporting(false);
      setExportComplete(true);
      addNotification({
        title: 'Report Downloaded',
        message: `Executive ${format} report exported successfully.`,
        type: 'system',
      });

      setTimeout(() => {
        setExportComplete(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to export executive report:', err);
      setIsExporting(false);
      setErrorMessage(err.message || 'An error occurred while generating the report.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/40 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="my-auto relative w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-bright">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Export Executive Situation Report</h2>
            <p className="font-body-md text-body-md text-secondary text-xs sm:text-sm">Download Nigerian financial ledger summaries and cohort audit data.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
          </button>
        </div>

        {/* Form Body - 2 Columns */}
        <form onSubmit={handleExport} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

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
                    <option value="This Month (Oct 2026)">This Month (Oct 2026)</option>
                    <option value="This Quarter (Q4 2026)">This Quarter (Q4 2026)</option>
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
                      <span>Prospective Leads &amp; Contact Follow-up Schedule</span>
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
                      <li className="flex justify-between text-on-surface">
                        <span>Leads &amp; Contacts</span>
                        <span className="font-bold">{leads.length}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="shrink-0 p-3 sm:p-4 border-t border-outline-variant bg-surface-bright flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-10 rounded border border-outline-variant font-label-md text-label-md font-semibold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isExporting || exportComplete}
              className="px-6 h-10 rounded bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-2 disabled:opacity-75 cursor-pointer"
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
                  <span>Generate &amp; Download {format}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
