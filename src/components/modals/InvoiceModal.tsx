import React, { useMemo } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';
import { Invoice } from '../../types/crm';

export interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose }) => {
  const { invoices, selectedInvoiceId, selectedStudentId, students, settings, currentStudentProfile } = useCRM();

  if (!isOpen) return null;

  // Resolve target student: selected student -> student linked to selected invoice -> current student profile
  const targetStudent = 
    students.find(s => s.id === selectedStudentId) ||
    (selectedInvoiceId ? students.find(s => s.id === (invoices || []).find(i => i.id === selectedInvoiceId)?.studentId) : undefined) ||
    currentStudentProfile;

  // Strictly resolve target student's authentic invoice to prevent cross-student data leakage
  const currentInvoice: Invoice | undefined = useMemo(() => {
    // 1. Direct match on selectedInvoiceId
    if (selectedInvoiceId) {
      const match = (invoices || []).find(inv => inv.id === selectedInvoiceId);
      if (match) {
        const studentForMatch = targetStudent || students.find(s => s.id === match.studentId);
        const total = match.totalAmount || match.amount || studentForMatch?.totalFees || studentForMatch?.tuitionAmount || 0;
        const paid = match.paidAmount !== undefined ? match.paidAmount : (match.status === 'Paid' ? total : (studentForMatch?.paidAmount || 0));
        const items = (match.items && match.items.length > 0)
          ? match.items
          : (studentForMatch?.courses && studentForMatch.courses.length > 0)
            ? studentForMatch.courses.map((c, idx) => ({
                id: c.id || `item-${idx}`,
                description: `${c.name} (${c.code || 'TECH'})`,
                amount: c.fee || total,
              }))
            : [{ id: 'item-1', description: `${match.programName || match.program || studentForMatch?.program || 'Academic'} Tuition Settlement`, amount: total }];

        return {
          ...match,
          totalAmount: total,
          paidAmount: paid,
          items,
          studentName: match.studentName || studentForMatch?.name || 'Enrolled Student',
          studentEmail: match.studentEmail || studentForMatch?.email || '',
          programName: match.programName || match.program || studentForMatch?.program || 'Academic Track',
        };
      }
    }

    // 2. Match invoice linked to target student
    if (targetStudent) {
      const studentMatch = (invoices || []).find(
        inv =>
          inv.studentId === targetStudent.id ||
          (inv.studentName && targetStudent.name && inv.studentName.toLowerCase().trim() === targetStudent.name.toLowerCase().trim()) ||
          (targetStudent.email && inv.studentEmail && inv.studentEmail.toLowerCase().trim() === targetStudent.email.toLowerCase().trim())
      );
      if (studentMatch) {
        const total = studentMatch.totalAmount || studentMatch.amount || targetStudent.totalFees || targetStudent.tuitionAmount || 0;
        const paid = studentMatch.paidAmount !== undefined ? studentMatch.paidAmount : (studentMatch.status === 'Paid' ? total : (targetStudent.paidAmount || 0));
        const items = (studentMatch.items && studentMatch.items.length > 0)
          ? studentMatch.items
          : (targetStudent.courses && targetStudent.courses.length > 0)
            ? targetStudent.courses.map((c, idx) => ({
                id: c.id || `item-${idx}`,
                description: `${c.name} (${c.code || 'TECH'})`,
                amount: c.fee || total,
              }))
            : [{ id: 'item-1', description: `${targetStudent.program} Academic Tuition`, amount: total }];

        return {
          ...studentMatch,
          totalAmount: total,
          paidAmount: paid,
          items,
          studentName: studentMatch.studentName || targetStudent.name,
          studentEmail: studentMatch.studentEmail || targetStudent.email,
          programName: studentMatch.programName || studentMatch.program || targetStudent.program,
        };
      }

      // 3. Dynamically synthesize authentic invoice matching target student's real academic enrollment
      const totalAmount = targetStudent.totalFees || targetStudent.tuitionAmount || 0;
      const paidAmount = targetStudent.paidAmount || (targetStudent.tuitionStatus === 'Paid' ? totalAmount : 0);
      const balance = Math.max(0, totalAmount - paidAmount);
      const isPaid = balance === 0 && totalAmount > 0;

      const items = (targetStudent.courses && targetStudent.courses.length > 0)
        ? targetStudent.courses.map((c, idx) => ({
            id: c.id || `item-${targetStudent.id}-${idx}`,
            description: `${c.name || targetStudent.program} (${c.code || 'TECH-101'})`,
            amount: c.fee || totalAmount,
          }))
        : [
            {
              id: `item-${targetStudent.id}-main`,
              description: `${targetStudent.program} Comprehensive Academic Tuition`,
              amount: totalAmount,
            },
          ];

      return {
        id: `inv-stu-${targetStudent.id}`,
        invoiceNumber: `INV-${targetStudent.studentCode || new Date().getFullYear() + '-001'}`,
        studentId: targetStudent.id,
        studentName: targetStudent.name,
        studentEmail: targetStudent.email,
        programName: targetStudent.program,
        issueDate: targetStudent.enrolledDate || new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        totalAmount,
        paidAmount,
        status: isPaid ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending',
        items,
        paymentReference: (targetStudent as any).paymentReference || `NIBSS-TRX-${targetStudent.studentCode || 'NEXUS'}`,
        nibssBankName: settings.defaultNIBSSBank?.bankName || 'Access Bank Nigeria PLC',
      };
    }

    // Never leak unrelated student records (e.g. invoices[0])
    return undefined;
  }, [selectedInvoiceId, targetStudent, students, invoices, settings]);

  const handlePrint = () => {
    window.print();
  };

  if (!currentInvoice) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page">
        <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant max-w-sm w-full text-center">
          <p className="text-secondary text-sm mb-4">No invoice selected.</p>
          <button onClick={onClose} className="px-4 py-2 bg-primary text-on-primary rounded text-sm font-semibold">
            Close
          </button>
        </div>
      </div>
    );
  }

  const isPaid = currentInvoice.status === 'Paid';
  const balanceDue = currentInvoice.totalAmount - currentInvoice.paidAmount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/50 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="my-auto glass-panel relative w-full max-w-3xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 animate-in zoom-in-95 duration-150">
        {/* Modal Toolbar */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-bright print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">receipt_long</span>
            <h3 className="font-headline-md text-sm sm:text-base md:text-lg font-bold text-on-surface">
              {isPaid ? 'Official Tuition Payment Receipt' : 'Tuition Billing Invoice'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 sm:px-4 h-9 rounded-lg bg-secondary-container text-primary font-label-md text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-secondary hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-container cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">close</span>
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-8 space-y-6 sm:space-y-8 bg-white text-on-surface print:p-0 print:m-0" id="printable-invoice">
          {/* Institution Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-outline-variant pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold text-sm">
                  <span className="material-symbols-outlined text-[18px]">domain</span>
                </div>
                <h1 className="font-headline-lg text-xl font-black text-primary tracking-tight">
                  {settings.instituteName}
                </h1>
              </div>
              <p className="font-body-sm text-xs text-secondary">{settings.address}</p>
              <p className="font-body-sm text-xs text-secondary">
                RC: <span className="font-data-tabular text-on-surface font-semibold">{settings.cacNumber}</span> | TIN: <span className="font-data-tabular text-on-surface font-semibold">{settings.tinNumber}</span>
              </p>
              <p className="font-body-sm text-xs text-secondary">Email: {settings.email} | Tel: {settings.phone}</p>
            </div>

            <div className="text-left sm:text-right">
              <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 ${
                isPaid ? 'bg-[#dcfce7] text-[#166534]' : currentInvoice.status === 'Partial' ? 'bg-[#fef9c3] text-[#854d0e]' : 'bg-[#fee2e2] text-[#991b1b]'
              }`}>
                {currentInvoice.status}
              </span>
              <p className="font-data-tabular text-xs font-bold text-primary">{currentInvoice.invoiceNumber}</p>
              <p className="font-body-sm text-xs text-secondary">Issue Date: {currentInvoice.issueDate}</p>
              <p className="font-body-sm text-xs text-secondary">Due Date: {currentInvoice.dueDate}</p>
            </div>
          </div>

          {/* Billed To & Payment Channel Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-lg bg-surface-container-low/50 border border-outline-variant text-xs">
            <div>
              <p className="font-bold text-secondary uppercase tracking-wider mb-1">Billed Student / Sponsor</p>
              <p className="text-sm font-bold text-on-surface">{currentInvoice.studentName}</p>
              <p className="text-secondary">{currentInvoice.studentEmail}</p>
              <p className="text-secondary font-medium mt-1">Program Track: <span className="text-on-surface font-semibold">{currentInvoice.programName}</span></p>
            </div>

            <div>
              <p className="font-bold text-secondary uppercase tracking-wider mb-1">Remittance &amp; Settlement Account</p>
              <p className="font-semibold text-on-surface">{settings.defaultNIBSSBank.bankName}</p>
              <p className="font-data-tabular text-secondary">Account: <span className="text-on-surface font-bold">{settings.defaultNIBSSBank.accountNumber}</span></p>
              <p className="text-secondary">Name: {settings.defaultNIBSSBank.accountName}</p>
              {currentInvoice.paymentReference && (
                <p className="mt-1 text-primary font-data-tabular text-[11px] font-semibold">
                  Ref: {currentInvoice.paymentReference}
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-outline-variant text-secondary text-xs uppercase tracking-wider">
                  <th className="py-2.5 font-bold">Item Description</th>
                  <th className="py-2.5 text-right font-bold">Amount (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 font-data-tabular text-sm">
                {currentInvoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 font-medium text-on-surface">{item.description}</td>
                    <td className="py-3 text-right font-semibold">{formatNaira(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Calculation */}
          <div className="flex justify-end pt-2">
            <div className="w-full max-w-xs space-y-2 border-t-2 border-outline-variant pt-3 font-data-tabular">
              <div className="flex justify-between text-xs text-secondary">
                <span>Subtotal Tuition</span>
                <span className="font-semibold text-on-surface">{formatNaira(currentInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-secondary">
                <span>Amount Paid</span>
                <span className="font-semibold text-[#166534]">-{formatNaira(currentInvoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-outline-variant pt-2 text-on-surface">
                <span>Outstanding Balance</span>
                <span className={balanceDue > 0 ? 'text-error' : 'text-primary'}>
                  {formatNaira(balanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Official Stamp & Terms */}
          <div className="border-t border-dashed border-outline-variant pt-6 flex flex-col sm:flex-row justify-between items-end gap-4 text-xs text-secondary">
            <div className="space-y-1">
              <p className="font-semibold text-on-surface">Authorized Registrar Signature &amp; Stamp</p>
              <p className="text-[11px]">Nexus Institute of Technology • Directorate of Academic Finance</p>
              <div className="w-40 h-12 border-b border-outline-variant/80 border-dashed mt-2"></div>
            </div>

            <div className="text-right text-[11px] space-y-0.5">
              <p className="text-primary font-bold">Valid Nigerian Academic Electronic Receipt</p>
              <p>Generated securely on {new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
