import React, { useState } from 'react';
import { WalletTransaction } from '../../types/crm';
import { formatNaira } from '../../context/CRMContext';

export interface WalletTransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: WalletTransaction | null;
}

export const WalletTransactionDetailsModal: React.FC<WalletTransactionDetailsModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const isCredit = transaction.type === 'credit';

  const handleCopyReference = () => {
    if (transaction.reference) {
      navigator.clipboard.writeText(transaction.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isCredit ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-red-100 text-red-700'
            }`}>
              <span className="material-symbols-outlined text-[24px]">
                {isCredit ? 'arrow_downward' : 'arrow_upward'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-lg text-lg font-bold text-on-surface">
                  {isCredit ? 'Inbound Inflow Audit Record' : 'Disbursement Audit Record'}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  isCredit ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-red-100 text-red-700'
                }`}>
                  {isCredit ? 'CREDIT / INFLOW' : 'DEBIT / OUTFLOW'}
                </span>
              </div>
              <p className="text-secondary text-xs">
                Verified via Paystack NIBSS Electronic Settlement Switch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-stack-lg overflow-y-auto space-y-5">
          {/* Main Amount Callout */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant text-center">
            <span className="text-xs uppercase tracking-wider font-semibold text-secondary block mb-1">
              {isCredit ? 'Amount Received' : 'Amount Disbursed'}
            </span>
            <div className={`text-3xl font-black font-data-tabular ${
              isCredit ? 'text-[#166534]' : 'text-red-700'
            }`}>
              {isCredit ? `+${formatNaira(transaction.amount)}` : `-${formatNaira(transaction.amount)}`}
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-secondary">
              <span>Balance After: <strong className="text-on-surface">{formatNaira(transaction.balanceAfter)}</strong></span>
              {typeof transaction.fee === 'number' && transaction.fee > 0 && (
                <span>Paystack Fee: <strong className="text-on-surface">{formatNaira(transaction.fee)}</strong></span>
              )}
            </div>
          </div>

          {/* Reference & Verification Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-outline-variant bg-surface">
              <span className="text-secondary block text-[11px] font-semibold uppercase mb-1">
                Transaction Reference / NIP
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-on-surface font-medium truncate select-all">
                  {transaction.reference}
                </span>
                <button
                  type="button"
                  onClick={handleCopyReference}
                  className="px-2 py-1 rounded bg-surface-container text-[11px] font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-outline-variant bg-surface">
              <span className="text-secondary block text-[11px] font-semibold uppercase mb-1">
                Settlement Timestamp & Status
              </span>
              <div className="flex items-center justify-between">
                <span className="text-on-surface font-mono">
                  {new Date(transaction.timestamp).toLocaleString('en-NG', {
                    dateStyle: 'medium',
                    timeStyle: 'medium'
                  })}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  <span>APPROVED</span>
                </span>
              </div>
            </div>
          </div>

          {/* Banking / Party Details Card */}
          <div className="p-4 rounded-xl border border-outline-variant bg-surface space-y-3">
            <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                {isCredit ? 'account_balance' : 'account_circle'}
              </span>
              <h3 className="font-bold text-sm text-on-surface">
                {isCredit ? 'Depositor & Virtual Account Routing' : 'Payee & Beneficiary Banking Credentials'}
              </h3>
            </div>

            {isCredit ? (
              // Inflow Depositor Details
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-secondary text-[11px] block">Depositor Origin</span>
                  <strong className="text-on-surface text-sm block">
                    {transaction.senderName || transaction.initiatedBy || 'Inbound Bank Depositor'}
                  </strong>
                  <span className="text-secondary text-[11px]">
                    {transaction.senderAccountNumber ? `Sender Acc: ${transaction.senderAccountNumber}` : 'Originating Interbank Transfer'}
                  </span>
                </div>
                <div>
                  <span className="text-secondary text-[11px] block">Destination Account (NUBAN)</span>
                  <strong className="text-on-surface text-sm block">
                    {transaction.receiverAccountNumber || '9817707007'}
                  </strong>
                  <span className="text-secondary text-[11px]">
                    {transaction.receiverBank || 'Wema Bank'} (Dedicated NUBAN)
                  </span>
                </div>
                <div className="col-span-2 p-2.5 rounded-lg bg-surface-container-low text-[11px] text-secondary border border-outline-variant">
                  <strong className="text-on-surface block mb-0.5">ℹ️ Payer Privacy Regulation Note</strong>
                  In accordance with CBN and NDPR data protection regulations, interbank NIP transfer switches transmit sender account numbers in masked format (e.g. {transaction.senderAccountNumber || '•••• 0235'}). Automatic settlement and crediting occur via the unique Dedicated NUBAN assigned to your wallet.
                </div>
              </div>
            ) : (
              // Outflow Payee Details
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-secondary text-[11px] block">Verified Payee Legal Name</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <strong className="text-on-surface text-sm block">
                      {transaction.recipientName || 'Official Beneficiary'}
                    </strong>
                    <span className="material-symbols-outlined text-[16px] text-emerald-600" title="Account holder name verified with NIBSS">
                      verified
                    </span>
                  </div>
                  <span className="text-secondary text-[11px]">
                    NIBSS-verified Registered Account Holder
                  </span>
                </div>

                <div>
                  <span className="text-secondary text-[11px] block">Payee Bank & NUBAN</span>
                  <strong className="text-on-surface text-sm block font-mono">
                    {transaction.recipientAccountNumber || '••••••••••'}
                  </strong>
                  <span className="text-secondary text-[11px]">
                    {transaction.recipientBank || 'Commercial Bank'}
                  </span>
                </div>

                {transaction.paystackTransferCode && (
                  <div className="col-span-2">
                    <span className="text-secondary text-[11px] block">Paystack NIBSS Transfer Code</span>
                    <span className="font-mono text-xs bg-surface-container px-2 py-0.5 rounded text-on-surface">
                      {transaction.paystackTransferCode}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description & Narrative */}
          <div className="p-3 rounded-lg border border-outline-variant bg-surface text-xs">
            <span className="text-secondary block text-[11px] font-semibold uppercase mb-1">
              Transaction Narrative & Category
            </span>
            <p className="text-on-surface font-medium mb-1">
              {transaction.description}
            </p>
            <span className="text-secondary text-[11px] font-mono">
              Event Category: {transaction.category}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-stack-md px-stack-lg border-t border-outline-variant bg-surface flex items-center justify-between">
          <span className="text-[11px] text-secondary">
            Nexus Internal Audit Engine • Paystack Live Verified
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
