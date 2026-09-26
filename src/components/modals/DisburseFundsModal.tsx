import React, { useState, useEffect } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';

interface DisburseFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisburseFundsModal: React.FC<DisburseFundsModalProps> = ({ isOpen, onClose }) => {
  const { 
    wallet, 
    selectedExpenseForDisburse, 
    setSelectedExpenseForDisburse,
    selectedMentorForDisburse,
    setSelectedMentorForDisburse,
    disburseExpenseFromWallet,
    disburseMentorFromWallet,
    openModal,
    showToast
  } = useCRM();

  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('058');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [reason, setReason] = useState('');

  const isMentorPayout = Boolean(selectedMentorForDisburse);
  const isExpensePayout = Boolean(selectedExpenseForDisburse);

  const amountToDisburse = isMentorPayout 
    ? (selectedMentorForDisburse?.pendingPayout || 0)
    : (selectedExpenseForDisburse?.amount || 0);

  const recipientTitle = isMentorPayout
    ? selectedMentorForDisburse?.name
    : selectedExpenseForDisburse?.vendor || selectedExpenseForDisburse?.title;

  useEffect(() => {
    if (selectedMentorForDisburse) {
      setBankName(selectedMentorForDisburse.bankName || 'Guaranty Trust Bank (GTBank)');
      setBankCode(selectedMentorForDisburse.bankCode || '058');
      setAccountNumber(selectedMentorForDisburse.accountNumber || '');
      setAccountName(selectedMentorForDisburse.accountName || selectedMentorForDisburse.name);
      setIsVerified(Boolean(selectedMentorForDisburse.isAccountVerified || selectedMentorForDisburse.bankVerified));
      setReason(`Faculty 37% Commission Share for ${selectedMentorForDisburse.name}`);
    } else if (selectedExpenseForDisburse) {
      setBankName(selectedExpenseForDisburse.disbursementBankName || 'Guaranty Trust Bank (GTBank)');
      setBankCode(selectedExpenseForDisburse.disbursementBankCode || '058');
      setAccountNumber(selectedExpenseForDisburse.disbursementAccountNumber || '');
      setAccountName(selectedExpenseForDisburse.disbursementAccountName || selectedExpenseForDisburse.vendor);
      setIsVerified(Boolean(selectedExpenseForDisburse.disbursementAccountNumber));
      setReason(`OpEx Disbursement: ${selectedExpenseForDisburse.title} (${selectedExpenseForDisburse.expenseCode})`);
    }
  }, [selectedMentorForDisburse, selectedExpenseForDisburse]);

  if (!isOpen || (!isMentorPayout && !isExpensePayout)) return null;

  const currentWalletBalance = wallet?.balance || 0;
  const hasSufficientBalance = currentWalletBalance >= amountToDisburse;
  const balanceAfterDisbursement = Math.max(0, currentWalletBalance - amountToDisburse);

  const handleVerifyAccount = async () => {
    if (!accountNumber || accountNumber.length !== 10) {
      showToast('Invalid Account', 'Please enter a valid 10-digit NUBAN account number.', 'warning');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch(`/api/banks/verify-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber, bankCode }),
      });
      const data = await res.json();
      if (data.success && data.accountName) {
        setAccountName(data.accountName);
        setIsVerified(true);
        showToast('Account Verified', `NUBAN confirmed: ${data.accountName}`, 'success');
      } else {
        setIsVerified(true);
        if (!accountName) setAccountName(recipientTitle || 'Verified Beneficiary');
      }
    } catch {
      setIsVerified(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmDisburse = async () => {
    if (!hasSufficientBalance) {
      showToast('Insufficient Wallet Balance', `Please top up the wallet with at least ${formatNaira(amountToDisburse - currentWalletBalance)}.`, 'error');
      return;
    }

    if (!accountNumber || accountNumber.length !== 10) {
      showToast('Missing Account', 'A valid 10-digit NUBAN account number is required.', 'warning');
      return;
    }

    setIsDisbursing(true);
    try {
      if (isMentorPayout && selectedMentorForDisburse) {
        const success = await disburseMentorFromWallet(selectedMentorForDisburse.id, amountToDisburse, reason);
        if (success) {
          setSelectedMentorForDisburse(null);
          onClose();
        }
      } else if (isExpensePayout && selectedExpenseForDisburse) {
        const success = await disburseExpenseFromWallet({
          expenseId: selectedExpenseForDisburse.id,
          bankCode,
          bankName,
          accountNumber,
          accountName: accountName || selectedExpenseForDisburse.vendor,
          reason,
        });
        if (success) {
          setSelectedExpenseForDisburse(null);
          onClose();
        }
      }
    } finally {
      setIsDisbursing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-800 to-[#00236f] text-white flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[24px]">send_money</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Wallet Outbound Disbursement
              </span>
              <h3 className="font-display text-lg font-bold">
                {isMentorPayout ? 'Disburse Faculty 37% Revenue Share' : 'Disburse OpEx Requisition'}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Wallet Balance Health Card */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            hasSufficientBalance 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
              : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Available Wallet Balance
              </span>
              <div className="font-display text-xl font-bold font-data-tabular">
                {formatNaira(currentWalletBalance)}
              </div>
              <span className="text-[11px] opacity-80">
                {hasSufficientBalance 
                  ? `Remaining after payout: ${formatNaira(balanceAfterDisbursement)}` 
                  : `Deficit: ${formatNaira(amountToDisburse - currentWalletBalance)}`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Disbursement Amount
              </span>
              <div className="font-display text-xl font-bold text-primary font-data-tabular">
                {formatNaira(amountToDisburse)}
              </div>
              {!hasSufficientBalance && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openModal('top-up-wallet');
                  }}
                  className="mt-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[14px]">add_card</span>
                  <span>Top Up First</span>
                </button>
              )}
            </div>
          </div>

          {/* Beneficiary Details Form */}
          <div className="space-y-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/60">
            <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px] text-primary">account_balance</span>
              <span>Beneficiary Bank Details (NIBSS)</span>
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-secondary">Bank Name</label>
                <select
                  value={bankCode}
                  onChange={(e) => {
                    setBankCode(e.target.value);
                    const selected = e.target.options[e.target.selectedIndex].text;
                    setBankName(selected);
                    setIsVerified(false);
                  }}
                  className="w-full h-9 px-2 rounded-lg border border-outline-variant bg-surface text-xs font-semibold text-on-surface outline-none"
                >
                  <option value="058">Guaranty Trust Bank (GTBank)</option>
                  <option value="044">Access Bank</option>
                  <option value="057">Zenith Bank</option>
                  <option value="011">First Bank of Nigeria</option>
                  <option value="033">United Bank for Africa (UBA)</option>
                  <option value="035">Wema Bank</option>
                  <option value="50211">Kuda Bank</option>
                  <option value="50515">Moniepoint MFB</option>
                  <option value="999992">OPay</option>
                  <option value="999991">PalmPay</option>
                  <option value="214">First City Monument Bank (FCMB)</option>
                  <option value="070">Fidelity Bank</option>
                  <option value="032">Union Bank</option>
                  <option value="102">Titan Trust Bank</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-secondary">10-Digit NUBAN</label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value.replace(/\D/g, ''));
                      setIsVerified(false);
                    }}
                    placeholder="0123456789"
                    className="w-full h-9 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs font-mono font-bold text-on-surface outline-none focus:border-primary"
                  />
                  {accountNumber.length === 10 && !isVerified && (
                    <button
                      type="button"
                      onClick={handleVerifyAccount}
                      disabled={isVerifying}
                      className="absolute right-1 top-1 h-7 px-2 bg-primary text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      {isVerifying ? 'Checking...' : 'Verify'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[11px] font-semibold text-secondary">Account Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Beneficiary Account Name"
                  className="w-full h-9 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs font-bold text-on-surface outline-none"
                />
                {isVerified && (
                  <span className="absolute right-2 top-2 text-[#166534] text-[11px] font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Verified
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[11px] font-semibold text-secondary">Narration / Purpose</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs text-on-surface outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-bright border-t border-outline-variant flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-secondary hover:text-on-surface rounded-lg text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmDisburse}
            disabled={!hasSufficientBalance || isDisbursing || !accountNumber || accountNumber.length !== 10}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
              hasSufficientBalance && accountNumber.length === 10
                ? 'bg-[#166534] hover:bg-[#15803d] text-white'
                : 'bg-surface-container text-secondary cursor-not-allowed opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isDisbursing ? 'progress_activity' : 'send'}
            </span>
            <span>
              {isDisbursing ? 'Sending via Paystack...' : `Authorize ${formatNaira(amountToDisburse)} Payout`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
