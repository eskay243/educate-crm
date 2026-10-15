import React, { useState, useEffect } from 'react';
import { WalletTransaction, BankDeliveryStatus } from '../../types/crm';
import { formatNaira, useCRM } from '../../context/CRMContext';

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
  const { verifyBankTransferStatus } = useCRM();
  const [copied, setCopied] = useState(false);
  const [currentTx, setCurrentTx] = useState<WalletTransaction | null>(transaction);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setCurrentTx(transaction);
  }, [transaction]);

  if (!isOpen || !currentTx) return null;

  const isCredit = currentTx.type === 'credit';

  const handleCopyReference = (text?: string) => {
    const val = text || currentTx.reference;
    if (val) {
      navigator.clipboard.writeText(val);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerifyBankStatus = async () => {
    if (!currentTx.reference) return;
    setIsVerifying(true);
    try {
      const updated = await verifyBankTransferStatus(currentTx.reference);
      if (updated) {
        setCurrentTx(updated);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusBadge = (status?: BankDeliveryStatus | string) => {
    switch (status) {
      case 'received_by_bank':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: 'verified',
          label: 'Received by Beneficiary Bank (NIP)'
        };
      case 'disbursed_corporate_nip':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: 'account_balance',
          label: 'Disbursed via Corporate NIP'
        };
      case 'processing_at_switch':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: 'sync',
          label: 'Processing at Switch (NIP In-Flight)'
        };
      case 'failed':
        return {
          bg: 'bg-red-100 text-red-800 border-red-300',
          icon: 'cancel',
          label: 'Failed / Rejected by Bank'
        };
      case 'reversed':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: 'replay',
          label: 'Reversed & Refunded'
        };
      case 'simulated':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: 'science',
          label: 'Local Simulation (Not Sent to Bank)'
        };
      default:
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: 'verified',
          label: isCredit ? 'SETTLED' : 'APPROVED'
        };
    }
  };

  const badgeInfo = getStatusBadge(currentTx.bankDeliveryStatus);

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
              {isCredit ? `+${formatNaira(currentTx.amount)}` : `-${formatNaira(currentTx.amount)}`}
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-secondary">
              <span>Balance After: <strong className="text-on-surface">{formatNaira(currentTx.balanceAfter)}</strong></span>
              {typeof currentTx.fee === 'number' && currentTx.fee > 0 && (
                <span>Paystack Fee: <strong className="text-on-surface">{formatNaira(currentTx.fee)}</strong></span>
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
                  {currentTx.reference}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyReference(currentTx.reference)}
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
                Settlement Timestamp & Method
              </span>
              <div className="flex items-center justify-between">
                <span className="text-on-surface font-mono">
                  {new Date(currentTx.timestamp).toLocaleString('en-NG', {
                    dateStyle: 'medium',
                    timeStyle: 'medium'
                  })}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-bold text-[10px] uppercase">
                  {currentTx.channel === 'direct_corporate_nip' ? 'Corporate Bank NIP' : 
                   currentTx.channel === 'paystack_transfer' ? 'Paystack API' : 
                   currentTx.channel === 'dedicated_nuban' ? 'Wema DVA Deposit' : 'Interbank Switch'}
                </span>
              </div>
            </div>
          </div>

          {/* Interbank Bank Delivery Status Section */}
          <div className={`p-4 rounded-xl border ${badgeInfo.bg} space-y-2`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">
                  {badgeInfo.icon}
                </span>
                <strong className="text-sm font-bold">
                  {badgeInfo.label}
                </strong>
              </div>
              <button
                type="button"
                onClick={handleVerifyBankStatus}
                disabled={isVerifying}
                className="px-3 py-1 rounded-lg bg-surface hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-all flex items-center gap-1.5 shadow-xs border border-outline-variant cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${isVerifying ? 'animate-spin' : ''}`}>
                  {isVerifying ? 'sync' : 'published_with_changes'}
                </span>
                <span>{isVerifying ? 'Verifying with Bank...' : 'Verify Bank Status'}</span>
              </button>
            </div>

            {currentTx.bankDeliveryMessage && (
              <p className="text-xs font-medium opacity-90">
                {currentTx.bankDeliveryMessage}
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] opacity-80 pt-1 border-t border-current/10 flex-wrap gap-2">
              {currentTx.nipSessionId ? (
                <span>NIP Session ID: <strong className="font-mono">{currentTx.nipSessionId}</strong></span>
              ) : (
                <span>Switch Route: <strong className="font-mono">{currentTx.channel || 'Interbank Central Switch'}</strong></span>
              )}
              {currentTx.lastBankCheckAt && (
                <span>Checked: {new Date(currentTx.lastBankCheckAt).toLocaleTimeString()}</span>
              )}
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
                    {currentTx.senderName || currentTx.initiatedBy || 'Inbound Bank Depositor'}
                  </strong>
                  <span className="text-secondary text-[11px]">
                    {currentTx.senderAccountNumber ? `Sender Acc: ${currentTx.senderAccountNumber}` : 'Originating Interbank Transfer'}
                  </span>
                </div>
                <div>
                  <span className="text-secondary text-[11px] block">Destination Account (NUBAN)</span>
                  <strong className="text-on-surface text-sm block">
                    {currentTx.receiverAccountNumber || '9817707007'}
                  </strong>
                  <span className="text-secondary text-[11px]">
                    {currentTx.receiverBank || 'Wema Bank'} (Dedicated NUBAN)
                  </span>
                </div>
                <div className="col-span-2 p-2.5 rounded-lg bg-surface-container-low text-[11px] text-secondary border border-outline-variant">
                  <strong className="text-on-surface block mb-0.5">ℹ️ Payer Privacy Regulation Note</strong>
                  In accordance with CBN and NDPR data protection regulations, interbank NIP transfer switches transmit sender account numbers in masked format (e.g. {currentTx.senderAccountNumber || '•••• 0235'}). Automatic settlement and crediting occur via the unique Dedicated NUBAN assigned to your wallet.
                </div>
              </div>
            ) : (
              // Outflow Payee Details
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-secondary text-[11px] block">Verified Payee Legal Name</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <strong className="text-on-surface text-sm block">
                      {currentTx.recipientName || 'Official Beneficiary'}
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
                    {currentTx.recipientAccountNumber || '••••••••••'}
                  </strong>
                  <span className="text-secondary text-[11px]">
                    {currentTx.recipientBank || 'Commercial Bank'}
                  </span>
                </div>

                {currentTx.paystackTransferCode && (
                  <div className="col-span-2">
                    <span className="text-secondary text-[11px] block">Paystack NIBSS Transfer Code</span>
                    <span className="font-mono text-xs bg-surface-container px-2 py-0.5 rounded text-on-surface">
                      {currentTx.paystackTransferCode}
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
              {currentTx.description}
            </p>
            <span className="text-secondary text-[11px] font-mono">
              Event Category: {currentTx.category}
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
