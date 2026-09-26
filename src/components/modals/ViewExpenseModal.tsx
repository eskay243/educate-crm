import React, { useState } from 'react';
import { Expense } from '../../types/crm';
import { formatNaira } from '../../context/CRMContext';

export interface ViewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  isSuperAdmin?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (expense: Expense) => void;
}

export const ViewExpenseModal: React.FC<ViewExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  isSuperAdmin = false,
  onApprove,
  onReject,
}) => {
  const [imageZoomed, setImageZoomed] = useState(false);

  if (!isOpen || !expense) return null;

  const isAwaiting = 
    expense.status === 'Awaiting Approval' || 
    expense.status === 'Pending' || 
    expense.status === 'In Review';
  const isApproved = expense.status === 'Approved' || expense.status === 'Paid';
  const isRejected = expense.status === 'Rejected';

  const isImageAttachment = 
    Boolean(expense.receiptUrl && (
      expense.receiptUrl.startsWith('data:image/') ||
      /\.(png|jpe?g|webp|gif|svg)$/i.test(expense.receiptName || '')
    ));

  const isPdfAttachment = 
    Boolean(expense.receiptUrl && (
      expense.receiptUrl.startsWith('data:application/pdf') ||
      /\.pdf$/i.test(expense.receiptName || '')
    ));

  const handlePrintVoucher = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-lg text-lg font-bold text-on-surface">Requisition Dossier</h2>
                <span className="font-data-tabular font-bold px-2 py-0.5 rounded bg-primary/10 text-primary text-xs border border-primary/20">
                  #{expense.expenseCode}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  isApproved 
                    ? 'bg-[#DCFCE7] text-[#166534]' 
                    : isRejected 
                    ? 'bg-[#FEE2E2] text-[#991B1B]' 
                    : 'bg-[#FEF9C3] text-[#854D0E]'
                }`}>
                  {expense.status}
                </span>
                {expense.urgency && expense.urgency !== 'Standard' && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    expense.urgency === 'Emergency' ? 'bg-error text-white' : 'bg-[#FEF9C3] text-[#854D0E]'
                  }`}>
                    {expense.urgency} Urgency
                  </span>
                )}
              </div>
              <p className="font-body-md text-xs text-secondary mt-0.5">
                Submitted on {expense.date} • Department: {expense.department}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-stack-lg space-y-stack-md flex-1">
          {/* Main Title & Amount Highlight Card */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-secondary">
                Expenditure Item / Purpose
              </span>
              <h3 className="font-bold text-base text-on-surface">{expense.title}</h3>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-secondary">
                <span className="px-2 py-0.5 rounded bg-surface border border-outline-variant font-medium">
                  {expense.category}
                </span>
                <span>•</span>
                <span>Vendor: <strong className="text-on-surface">{expense.vendor}</strong></span>
                <span>•</span>
                <span>Channel: <strong className="text-on-surface">{expense.paymentMethod}</strong></span>
              </div>
            </div>

            <div className="text-left md:text-right shrink-0 p-3 rounded-lg bg-surface border border-outline-variant">
              <span className="text-[11px] uppercase tracking-wider font-bold text-secondary block">
                Total Requested Amount
              </span>
              <span className="font-data-tabular font-extrabold text-2xl text-primary block">
                {formatNaira(expense.amount)}
              </span>
              <span className="text-[10px] text-secondary">Nigerian Naira (NGN)</span>
            </div>
          </div>

          {/* Grid: Details Left, Document Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column (5 cols): Metadata & Governance */}
            <div className="lg:col-span-5 space-y-4">
              {/* Justification Box */}
              <div className="p-3.5 rounded-xl bg-surface border border-outline-variant space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">notes</span>
                  Requisition Justification
                </span>
                <p className="text-xs text-on-surface leading-relaxed whitespace-pre-line bg-surface-container-lowest/60 p-2.5 rounded-lg border border-outline-variant/60">
                  {expense.description ? expense.description : 'No additional justification notes provided at time of submission.'}
                </p>
              </div>

              {/* Requester & Department Details */}
              <div className="p-3.5 rounded-xl bg-surface border border-outline-variant space-y-2.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                  Requester Profile
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
                    <span className="text-secondary">Submitted By:</span>
                    <span className="font-semibold text-on-surface">{expense.requestedBy || 'Staff Member'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
                    <span className="text-secondary">Requester Email:</span>
                    <span className="font-medium text-primary break-all">{expense.requesterEmail || 'admin@codelab.institute'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
                    <span className="text-secondary">Department:</span>
                    <span className="font-semibold text-on-surface">{expense.department}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
                    <span className="text-secondary">Vendor / Payee:</span>
                    <span className="font-semibold text-on-surface">{expense.vendor}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-secondary">Disbursement Method:</span>
                    <span className="font-semibold text-on-surface">{expense.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Audit / Review Status Trail */}
              {isApproved && (
                <div className="p-3.5 rounded-xl bg-[#DCFCE7]/60 border border-[#166534]/30 space-y-1 text-xs text-[#166534]">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Requisition Approved &amp; Disbursed</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Approved by <strong className="text-on-surface">{expense.reviewedBy || 'Super Admin'}</strong> {expense.reviewedAt && `on ${expense.reviewedAt}`}.
                  </p>
                  <p className="text-[10px] text-[#166534]/80">
                    Funds released and deducted from approved monthly operating budget.
                  </p>
                </div>
              )}

              {isRejected && (
                <div className="p-3.5 rounded-xl bg-[#FEE2E2]/70 border border-[#991B1B]/30 space-y-1.5 text-xs text-[#991B1B]">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    <span>Requisition Rejected</span>
                  </div>
                  {expense.rejectionReason && (
                    <div className="bg-white/80 p-2.5 rounded border border-[#991B1B]/20 text-[11px] italic">
                      "{expense.rejectionReason}"
                    </div>
                  )}
                  {expense.reviewedBy && (
                    <p className="text-[10px] text-[#991B1B]/80 pt-0.5">
                      Reviewed by {expense.reviewedBy} {expense.reviewedAt && `on ${expense.reviewedAt}`}
                    </p>
                  )}
                </div>
              )}

              {isAwaiting && (
                <div className="p-3.5 rounded-xl bg-[#FEF9C3]/70 border border-[#854D0E]/30 space-y-1 text-xs text-[#854D0E]">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                    <span>Awaiting Super Admin Decision</span>
                  </div>
                  <p className="text-[11px]">
                    This requisition is queued for executive governance. Funds remain untouched until approved.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column (7 cols): Document & Attached Proforma Viewer */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">attachment</span>
                  Attached Proforma Invoice / Quotation / Receipt
                </span>
                {expense.receiptUrl && (
                  <a
                    href={expense.receiptUrl}
                    download={expense.receiptName || `receipt-${expense.expenseCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <span className="material-symbols-outlined text-[15px]">download</span>
                    <span>Download File</span>
                  </a>
                )}
              </div>

              {/* Attachment Display Area */}
              {expense.receiptUrl ? (
                <div className="rounded-xl border border-outline-variant bg-surface overflow-hidden flex flex-col items-center justify-center p-3 relative group">
                  {isImageAttachment ? (
                    <div className="w-full flex flex-col items-center">
                      <div className="max-h-[380px] w-full overflow-hidden rounded-lg flex items-center justify-center bg-black/5 p-2">
                        <img
                          src={expense.receiptUrl}
                          alt={expense.receiptName || 'Receipt'}
                          className={`max-h-[360px] max-w-full object-contain rounded transition-transform cursor-pointer ${
                            imageZoomed ? 'scale-125' : ''
                          }`}
                          onClick={() => setImageZoomed(!imageZoomed)}
                          title="Click to toggle zoom"
                        />
                      </div>
                      <div className="w-full flex items-center justify-between pt-2 px-1 text-xs text-secondary">
                        <span className="truncate max-w-[200px] font-medium text-on-surface">
                          {expense.receiptName || 'Receipt Image'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setImageZoomed(!imageZoomed)}
                            className="text-primary hover:underline font-semibold cursor-pointer"
                          >
                            {imageZoomed ? 'Reset Zoom' : 'Zoom In'}
                          </button>
                          <span>•</span>
                          <a
                            href={expense.receiptUrl}
                            download={expense.receiptName || 'receipt'}
                            className="text-primary hover:underline font-bold"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : isPdfAttachment ? (
                    <div className="w-full flex flex-col items-center space-y-3 py-2">
                      <iframe
                        src={expense.receiptUrl}
                        title="Receipt PDF"
                        className="w-full h-[340px] rounded-lg border border-outline-variant/80 bg-white"
                      />
                      <div className="w-full flex items-center justify-between px-1 text-xs">
                        <span className="font-semibold text-on-surface">{expense.receiptName || 'Invoice Document.pdf'}</span>
                        <a
                          href={expense.receiptUrl}
                          download={expense.receiptName || 'proforma_invoice.pdf'}
                          className="px-3 py-1 rounded bg-primary text-on-primary font-bold text-xs flex items-center gap-1 shadow-2xs hover:bg-primary/90"
                        >
                          <span className="material-symbols-outlined text-[14px]">download</span>
                          <span>Download PDF</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full py-8 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">description</span>
                      </div>
                      <p className="font-bold text-sm text-on-surface">{expense.receiptName || 'Attached Document'}</p>
                      <a
                        href={expense.receiptUrl}
                        download={expense.receiptName || 'attached-document'}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        <span>Download &amp; Open Document</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : expense.receiptName ? (
                /* Fallback Voucher Preview for records with receiptName but without binary */
                <div className="rounded-xl border border-outline-variant bg-surface p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant/60">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Digital Requisition Voucher</p>
                        <p className="text-[10px] text-secondary">Verified Record: {expense.receiptName}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handlePrintVoucher}
                      className="px-2.5 py-1 rounded border border-outline-variant bg-surface-container-lowest text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">print</span>
                      <span>Print Voucher</span>
                    </button>
                  </div>

                  {/* Voucher Card */}
                  <div className="p-4 rounded-lg bg-surface-container-lowest border border-dashed border-outline-variant text-xs space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-extrabold text-sm text-primary tracking-wide">CODELAB INSTITUTE</p>
                        <p className="text-[10px] text-secondary">Operational Expenditure (OpEx) Voucher</p>
                      </div>
                      <span className="font-data-tabular font-bold px-2 py-0.5 rounded bg-surface-container text-secondary text-[10px]">
                        Ref: {expense.expenseCode}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-outline-variant/40">
                      <div>
                        <span className="text-secondary block">Payee / Vendor:</span>
                        <strong className="text-on-surface">{expense.vendor}</strong>
                      </div>
                      <div>
                        <span className="text-secondary block">Date of Claim:</span>
                        <strong className="text-on-surface">{expense.date}</strong>
                      </div>
                      <div>
                        <span className="text-secondary block">Department:</span>
                        <strong className="text-on-surface">{expense.department}</strong>
                      </div>
                      <div>
                        <span className="text-secondary block">Disbursement Mode:</span>
                        <strong className="text-on-surface">{expense.paymentMethod}</strong>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-surface border border-outline-variant/60">
                      <span className="text-[10px] uppercase font-bold text-secondary block">Purpose / Line Item:</span>
                      <p className="font-semibold text-on-surface text-xs">{expense.title}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-outline-variant/60">
                      <span className="font-bold text-on-surface">Voucher Amount:</span>
                      <span className="font-data-tabular font-extrabold text-lg text-primary">
                        {formatNaira(expense.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* No Receipt Attached */
                <div className="p-8 rounded-xl border border-dashed border-outline-variant bg-surface-container-low text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-secondary-container text-secondary mx-auto flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">no_sim</span>
                  </div>
                  <p className="font-semibold text-xs text-on-surface">No Digital Document Attached</p>
                  <p className="text-[11px] text-secondary max-w-xs mx-auto">
                    The requester submitted this operational requisition without attaching an external quotation or proforma invoice file.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer with Governance Actions */}
        <div className="p-stack-md px-stack-lg border-t border-outline-variant bg-surface-bright flex items-center justify-between">
          <div className="text-xs text-secondary">
            {isSuperAdmin ? (
              <span className="flex items-center gap-1 text-primary font-medium">
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                Super Admin Governance Mode
              </span>
            ) : (
              <span>Auditing Requisition Dossier</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-lg border border-outline-variant font-label-md text-xs font-semibold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
            >
              Close
            </button>

            {/* If Super Admin & Awaiting Approval, provide instant decision buttons */}
            {isSuperAdmin && isAwaiting && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (onReject) {
                      onReject(expense);
                      onClose();
                    }
                  }}
                  className="px-4 h-9 rounded-lg bg-[#FEE2E2] hover:bg-[#fecaca] text-[#991B1B] text-xs font-bold flex items-center gap-1.5 border border-[#991B1B]/30 transition-all cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  <span>Reject Requisition</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onApprove) {
                      onApprove(expense.id);
                      onClose();
                    }
                  }}
                  className="px-4 h-9 rounded-lg bg-[#DCFCE7] hover:bg-[#bbf7d0] text-[#166534] text-xs font-bold flex items-center gap-1.5 border border-[#166534]/30 transition-all cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Approve &amp; Release Funds</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
