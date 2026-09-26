import React, { useState } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';
import { launchWalletTopUpCheckout } from '../../services/paystackService';

interface TopUpWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TopUpWalletModal: React.FC<TopUpWalletModalProps> = ({ isOpen, onClose }) => {
  const { wallet, settings, generateVirtualAccount, topUpWallet, showToast, currentUser } = useCRM();
  const [activeTab, setActiveTab] = useState<'dva' | 'card'>('dva');
  const [customAmount, setCustomAmount] = useState<number>(250000);
  const [copied, setCopied] = useState<boolean>(false);
  const [isGeneratingDva, setIsGeneratingDva] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const virtualAccount = wallet?.virtualAccount;
  const quickAmounts = [100000, 250000, 500000, 1000000, 2500000];

  const handleCopyAccount = () => {
    if (!virtualAccount?.accountNumber) return;
    navigator.clipboard.writeText(virtualAccount.accountNumber);
    setCopied(true);
    showToast('Account Number Copied', `${virtualAccount.accountNumber} copied to clipboard.`, 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGenerateDva = async () => {
    setIsGeneratingDva(true);
    try {
      await generateVirtualAccount();
    } finally {
      setIsGeneratingDva(false);
    }
  };

  const handlePaystackTopUp = async () => {
    if (!customAmount || customAmount <= 0) {
      showToast('Invalid Amount', 'Please specify a valid top-up amount.', 'warning');
      return;
    }

    setIsProcessing(true);
    const publicKey = settings?.paystackPublicKey || 'pk_test_cd572a18dd78ed5493d15433b0e1f3c2057fce2a';
    const email = currentUser?.email || 'finance@codelab.institute';

    launchWalletTopUpCheckout({
      publicKey,
      email,
      amountNaira: customAmount,
      onSuccess: async (response) => {
        setIsProcessing(false);
        await topUpWallet(customAmount, response.reference);
        onClose();
      },
      onCancel: () => {
        setIsProcessing(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-primary to-[#00174a] text-white flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            </div>
            <div>
              <h3 className="font-display text-lg font-bold">Fund Expense &amp; Budget Wallet</h3>
              <p className="text-white/80 text-xs">
                Current liquid balance: <strong className="text-emerald-300 font-data-tabular">{formatNaira(wallet?.balance || 0)}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 m-5 mb-3 bg-surface-container rounded-xl border border-outline-variant/50">
          <button
            onClick={() => setActiveTab('dva')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'dva'
                ? 'bg-surface text-primary shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">account_balance</span>
            <span>Bank Transfer (Dedicated NUBAN)</span>
          </button>
          <button
            onClick={() => setActiveTab('card')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'card'
                ? 'bg-surface text-primary shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">credit_card</span>
            <span>Instant Paystack Checkout</span>
          </button>
        </div>

        {/* Tab 1: Dedicated Virtual Account (Bank Transfer) */}
        {activeTab === 'dva' && (
          <div className="p-6 pt-2 space-y-4">
            {virtualAccount ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-surface to-surface-container-low border border-outline-variant rounded-xl p-5 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                        Dedicated Virtual Account
                      </span>
                      <h4 className="text-sm font-bold text-on-surface flex items-center gap-1.5 mt-0.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                        {virtualAccount.bankName}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#166534] border border-[#166534]/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-pulse" />
                      Active 24/7 NIBSS
                    </span>
                  </div>

                  {/* NUBAN Large Display */}
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 my-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-secondary font-medium block">NUBAN Account Number</span>
                      <span className="font-mono text-2xl font-bold tracking-widest text-primary font-data-tabular">
                        {virtualAccount.accountNumber}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyAccount}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        copied ? 'bg-emerald-600 text-white' : 'bg-primary text-on-primary hover:bg-primary/90'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copied ? 'done' : 'content_copy'}
                      </span>
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-secondary">
                      <span>Account Name:</span>
                      <strong className="text-on-surface font-semibold">{virtualAccount.accountName}</strong>
                    </div>
                    <div className="flex justify-between text-secondary">
                      <span>Assigned Department:</span>
                      <span className="text-on-surface font-medium">Bursary / Operations Budget</span>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-xl text-blue-900 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-700">info</span>
                    <span>How Dedicated NUBAN Funding Works:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-blue-800 text-[11px]">
                    <li>Open any Nigerian banking app (GTBank, Access, Zenith, Kuda, Moniepoint, OPay, etc.).</li>
                    <li>Transfer your budgeted operational funds directly to this 10-digit account.</li>
                    <li>Paystack captures the NIP transaction and updates this CRM wallet in real time.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[24px]">add_card</span>
                </div>
                <h4 className="font-bold text-on-surface">No Virtual Account Assigned Yet</h4>
                <p className="text-secondary text-xs max-w-sm mx-auto">
                  Provision a dedicated 10-digit NUBAN virtual account linked to Paystack to enable autonomous direct bank transfer funding.
                </p>
                <button
                  onClick={handleGenerateDva}
                  disabled={isGeneratingDva}
                  className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isGeneratingDva ? 'progress_activity' : 'account_balance'}
                  </span>
                  <span>{isGeneratingDva ? 'Generating Virtual Account...' : 'Generate Dedicated NUBAN'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Instant Card / USSD Top-Up (Paystack Pop) */}
        {activeTab === 'card' && (
          <div className="p-6 pt-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                Top-Up Amount (₦)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-secondary">₦</span>
                <input
                  type="number"
                  step="50000"
                  min="5000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  placeholder="250000"
                  className="w-full h-11 pl-8 pr-3 rounded-lg border border-outline-variant bg-surface text-base font-bold text-on-surface font-data-tabular focus:border-primary outline-none"
                />
              </div>
            </div>

            {/* Quick Chips */}
            <div className="space-y-1">
              <span className="text-[11px] text-secondary font-medium">Quick Amount Presets:</span>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustomAmount(amt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-data-tabular transition-colors cursor-pointer ${
                      customAmount === amt
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'bg-surface border border-outline-variant text-secondary hover:text-on-surface'
                    }`}
                  >
                    {formatNaira(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/60 text-xs space-y-1 text-secondary">
              <div className="flex justify-between">
                <span>Payment Channels:</span>
                <strong className="text-on-surface">Card, USSD, Bank Transfer, Apple Pay</strong>
              </div>
              <div className="flex justify-between">
                <span>Settlement Time:</span>
                <strong className="text-[#166534]">Instant &amp; Automated</strong>
              </div>
            </div>

            <button
              onClick={handlePaystackTopUp}
              disabled={isProcessing}
              className="w-full h-11 bg-primary text-on-primary font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isProcessing ? 'progress_activity' : 'payments'}
              </span>
              <span>{isProcessing ? 'Processing Checkout...' : `Top Up ${formatNaira(customAmount)} Now`}</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-surface-bright border-t border-outline-variant flex justify-between items-center text-[11px] text-secondary">
          <span>Protected by Paystack 256-bit encryption</span>
          <button
            onClick={onClose}
            className="px-3 py-1 text-secondary hover:text-on-surface rounded font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
