import React from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';

export interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose }) => {
  const { invoices, selectedInvoiceId, settings } = useCRM();

  if (!isOpen) return null;

  const currentInvoice = invoices.find(inv => inv.id === selectedInvoiceId) || invoices[0];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-4 sm:p-margin-page animate-in fade-in duration-200 overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">receipt_long</span>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
              {isPaid ? 'Official Tuition Payment Receipt' : 'Tuition Billing Invoice'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 h-9 rounded bg-secondary-container text-primary font-label-md text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-secondary hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="overflow-y-auto p-8 sm:p-10 space-y-8 bg-white text-on-surface print:p-0 print:m-0" id="printable-invoice">
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
                RC: <span className="font-mono text-on-surface font-semibold">{settings.cacNumber}</span> | TIN: <span className="font-mono text-on-surface font-semibold">{settings.tinNumber}</span>
              </p>
              <p className="font-body-sm text-xs text-secondary">Email: {settings.email} | Tel: {settings.phone}</p>
            </div>

            <div className="text-left sm:text-right">
              <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 ${
                isPaid ? 'bg-[#dcfce7] text-[#166534]' : currentInvoice.status === 'Partial' ? 'bg-[#fef9c3] text-[#854d0e]' : 'bg-[#fee2e2] text-[#991b1b]'
              }`}>
                {currentInvoice.status}
              </span>
              <p className="font-mono text-xs font-bold text-primary">{currentInvoice.invoiceNumber}</p>
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
              <p className="font-mono text-secondary">Account: <span className="text-on-surface font-bold">{settings.defaultNIBSSBank.accountNumber}</span></p>
              <p className="text-secondary">Name: {settings.defaultNIBSSBank.accountName}</p>
              {currentInvoice.paymentReference && (
                <p className="mt-1 text-primary font-mono text-[11px] font-semibold">
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
