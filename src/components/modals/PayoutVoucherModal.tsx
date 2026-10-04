import React from 'react';
import { MentorPayoutRequest } from '../../types/crm';
import { formatNaira } from '../../context/CRMContext';

interface PayoutVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  payoutRequest: MentorPayoutRequest | null;
}

export const PayoutVoucherModal: React.FC<PayoutVoucherModalProps> = ({
  isOpen,
  onClose,
  payoutRequest,
}) => {
  if (!isOpen || !payoutRequest) return null;

  const whtRate = payoutRequest.whtRatePercent ?? 5;
  const grossAmount = payoutRequest.amount;
  const whtAmount = payoutRequest.whtDeductedAmount ?? Math.round(grossAmount * (whtRate / 100));
  const netAmount = payoutRequest.netDisbursedAmount ?? (grossAmount - whtAmount);
  const voucherNum = payoutRequest.voucherNumber || `VCHR-CDL-${new Date().getFullYear()}-${payoutRequest.id.slice(-4)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSlip = () => {
    const slipData = `
========================================================================
CODELAB INSTITUTE OF ADVANCED TECHNOLOGY & SOFTWARE ENGINEERING
RC: 1849204 | FIRS TIN: 24892019-0001
OFFICIAL FACULTY PAYOUT ADVICE & WITHHOLDING TAX (WHT) CERTIFICATE
========================================================================

Voucher Number:     ${voucherNum}
Issue Date:         ${new Date(payoutRequest.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
Settlement Status:  ${payoutRequest.status.toUpperCase()}
NIP Reference:      ${payoutRequest.disburseReference || 'PENDING SETTLEMENT'}

FACULTY PAYEE DETAILS:
------------------------------------------------------------------------
Faculty Member:     ${payoutRequest.mentorName}
Payee Account:      ${payoutRequest.accountName}
Email:              ${payoutRequest.mentorEmail}
Settlement Bank:    ${payoutRequest.bankName}
10-Digit NUBAN:     ${payoutRequest.accountNumber}
Teaching Hours:     ${payoutRequest.lecturedHours} Hours Verified (Target: ${payoutRequest.minimumRequiredHours}h)

FINANCIAL & STATUTORY TAX BREAKDOWN:
------------------------------------------------------------------------
Gross 37% Commission Accrual:     NGN ${grossAmount.toLocaleString()}
Statutory WHT Deduction (${whtRate}%):      - NGN ${whtAmount.toLocaleString()}
------------------------------------------------------------------------
NET PAYABLE / DISBURSED AMOUNT:   NGN ${netAmount.toLocaleString()}
========================================================================
TAX NOTES:
Withholding tax deducted at source in accordance with Section 81 of the 
Personal Income Tax Act (PITA) / Companies Income Tax Act (CITA).
Directly remitted to Federal/State Internal Revenue Service.
Generated electronically by Educate CRM Financial Accounting Subsystem.
========================================================================
`;
    const blob = new Blob([slipData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payout-Advice-${voucherNum}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden bg-surface border border-outline-variant z-10">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-outline-variant bg-surface-container-low print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">receipt_long</span>
            <div>
              <h3 className="font-bold text-sm text-on-surface">Faculty Remuneration Advice &amp; WHT Slip</h3>
              <p className="text-[11px] text-secondary font-mono">{voucherNum}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSlip}
              className="h-8 px-3 rounded-lg bg-surface border border-outline-variant hover:border-primary text-on-surface text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Download text summary"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span>Export Text</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-3 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Print voucher or save as PDF"
            >
              <span className="material-symbols-outlined text-[15px]">print</span>
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer ml-2"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Printable Voucher Body */}
        <div id="printable-payout-voucher" className="overflow-y-auto p-6 md:p-8 space-y-6 flex-1 bg-surface text-on-surface">
          {/* Official Letterhead */}
          <div className="border-b-2 border-primary/30 pb-5 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-primary text-on-primary font-extrabold flex items-center justify-center text-sm shadow-xs">
                    CDL
                  </div>
                  <div>
                    <h2 className="font-bold text-base tracking-tight text-on-surface">CODELAB INSTITUTE</h2>
                    <p className="text-[10px] text-secondary font-semibold uppercase tracking-wider">
                      Academy of Engineering &amp; Technology • RC 1849204
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-secondary">
                  14 Victoria Island Tech Hub Corridor, Lagos, Nigeria • TIN: 24892019-0001
                </p>
              </div>

              <div className="text-left sm:text-right space-y-0.5">
                <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  payoutRequest.status === 'Disbursed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : payoutRequest.status === 'Approved'
                    ? 'bg-blue-50 text-blue-700 border border-blue-300'
                    : 'bg-amber-50 text-amber-700 border border-amber-300'
                }`}>
                  {payoutRequest.status === 'Disbursed' ? '✓ Disbursed & Settled' : payoutRequest.status}
                </span>
                <p className="font-mono text-xs font-bold text-primary mt-1">{voucherNum}</p>
                <p className="text-[10px] text-secondary">
                  Date: {new Date(payoutRequest.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-center font-bold text-xs uppercase tracking-wider text-primary bg-primary/5 py-1.5 rounded border border-primary/10">
                Official Faculty Remuneration Advice &amp; WHT Tax Slip
              </h3>
            </div>
          </div>

          {/* Payee Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/70 text-xs">
            <div className="space-y-1.5">
              <span className="font-bold text-[10px] uppercase tracking-wider text-secondary">Faculty Payee Information</span>
              <p className="font-bold text-sm text-on-surface">{payoutRequest.mentorName}</p>
              <p className="text-secondary">{payoutRequest.mentorEmail}</p>
              <p className="text-[11px] text-secondary">
                Verified Teaching Hours: <strong className="text-on-surface">{payoutRequest.lecturedHours}h</strong> (Threshold: {payoutRequest.minimumRequiredHours}h)
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-[10px] uppercase tracking-wider text-secondary">Settlement Bank &amp; NUBAN</span>
              <p className="font-bold text-sm text-on-surface">{payoutRequest.bankName}</p>
              <p className="font-mono text-xs font-semibold text-primary">NUBAN: {payoutRequest.accountNumber}</p>
              <p className="text-secondary text-[11px]">Account Name: {payoutRequest.accountName}</p>
            </div>
          </div>

          {/* Itemized Financial Breakdown Table */}
          <div className="border border-outline-variant rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant text-secondary font-semibold">
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Tax Rate</th>
                  <th className="p-3 text-right">Amount (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 font-data-tabular">
                <tr>
                  <td className="p-3">
                    <p className="font-bold text-on-surface">Faculty Mentorship &amp; Tuition Commission Share</p>
                    <p className="text-[11px] text-secondary">37% statutory revenue share on enrolled student cohorts</p>
                  </td>
                  <td className="p-3 text-right text-secondary">—</td>
                  <td className="p-3 text-right font-bold text-on-surface">{formatNaira(grossAmount)}</td>
                </tr>

                <tr className="bg-rose-50/40 dark:bg-rose-950/10">
                  <td className="p-3">
                    <p className="font-bold text-rose-700 dark:text-rose-300">Withholding Tax (WHT) Deduction at Source</p>
                    <p className="text-[11px] text-secondary">Pursuant to Section 81 of PITA/CITA (Remitted directly to FIRS / LIRS)</p>
                  </td>
                  <td className="p-3 text-right text-rose-600 font-bold font-mono">{whtRate}%</td>
                  <td className="p-3 text-right font-bold text-rose-600">- {formatNaira(whtAmount)}</td>
                </tr>

                <tr className="bg-emerald-50/60 dark:bg-emerald-950/20 font-bold">
                  <td className="p-3.5 text-sm text-emerald-800 dark:text-emerald-200">
                    Net Settlement Amount Disbursed
                  </td>
                  <td className="p-3.5 text-right text-emerald-700 dark:text-emerald-300">Net Payable</td>
                  <td className="p-3.5 text-right text-base text-emerald-700 dark:text-emerald-300">
                    {formatNaira(netAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Audit Verification & References */}
          <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/60 space-y-1.5 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-secondary font-semibold">Payment Settlement Reference:</span>
              <span className="font-mono font-bold text-primary">{payoutRequest.disburseReference || 'NIP-CDL-SETTLEMENT-PENDING'}</span>
            </div>
            {payoutRequest.disbursedAt && (
              <div className="flex items-center justify-between flex-wrap gap-2 text-[11px]">
                <span className="text-secondary">Disbursement Timestamp:</span>
                <span className="text-on-surface">{new Date(payoutRequest.disbursedAt).toLocaleString('en-GB')}</span>
              </div>
            )}
            {payoutRequest.notes && (
              <p className="text-[11px] text-secondary pt-1 border-t border-outline-variant/40">
                <strong>Notes / Reference:</strong> {payoutRequest.notes}
              </p>
            )}
          </div>

          {/* Authorized Signatures & Tax Note */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-outline-variant text-center text-xs">
            <div className="space-y-2">
              <div className="h-9 border-b border-dashed border-secondary/50 flex items-end justify-center pb-1">
                <span className="font-serif italic text-primary text-sm font-semibold">Abiola Adefowope</span>
              </div>
              <p className="font-bold text-on-surface">Director of Finance &amp; Administration</p>
              <p className="text-[10px] text-secondary">CodeLab Institute</p>
            </div>

            <div className="space-y-2">
              <div className="h-9 border-b border-dashed border-secondary/50 flex items-end justify-center pb-1">
                <span className="font-serif italic text-emerald-700 text-sm font-semibold">Verified NIP NUBAN</span>
              </div>
              <p className="font-bold text-on-surface">Internal Audit &amp; Compliance</p>
              <p className="text-[10px] text-secondary">Central Bank of Nigeria (CBN) Validated</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
