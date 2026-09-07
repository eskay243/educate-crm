export interface NigerianBank {
  name: string;
  code: string;
  category: 'Commercial' | 'FinTech / Neobank' | 'Non-Interest' | 'Merchant';
}

export const NIGERIAN_BANKS: NigerianBank[] = [
  // Commercial Banks
  { name: 'Access Bank Nigeria PLC', code: '044', category: 'Commercial' },
  { name: 'Citibank Nigeria', code: '023', category: 'Commercial' },
  { name: 'Ecobank Nigeria', code: '050', category: 'Commercial' },
  { name: 'Fidelity Bank Nigeria', code: '070', category: 'Commercial' },
  { name: 'First Bank of Nigeria', code: '011', category: 'Commercial' },
  { name: 'First City Monument Bank (FCMB)', code: '214', category: 'Commercial' },
  { name: 'Globus Bank', code: '00103', category: 'Commercial' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058', category: 'Commercial' },
  { name: 'Heritage Bank', code: '030', category: 'Commercial' },
  { name: 'Keystone Bank', code: '082', category: 'Commercial' },
  { name: 'Nova Commercial Bank', code: '561', category: 'Commercial' },
  { name: 'Optimus Bank', code: '107', category: 'Commercial' },
  { name: 'Parallex Bank', code: '526', category: 'Commercial' },
  { name: 'Polaris Bank', code: '076', category: 'Commercial' },
  { name: 'PremiumTrust Bank', code: '105', category: 'Commercial' },
  { name: 'Providus Bank', code: '101', category: 'Commercial' },
  { name: 'Signature Bank', code: '106', category: 'Commercial' },
  { name: 'Stanbic IBTC Bank', code: '221', category: 'Commercial' },
  { name: 'Standard Chartered Bank', code: '068', category: 'Commercial' },
  { name: 'Sterling Bank', code: '232', category: 'Commercial' },
  { name: 'SunTrust Bank Nigeria', code: '100', category: 'Commercial' },
  { name: 'Titan Trust Bank', code: '102', category: 'Commercial' },
  { name: 'Union Bank of Nigeria', code: '032', category: 'Commercial' },
  { name: 'United Bank for Africa (UBA)', code: '033', category: 'Commercial' },
  { name: 'Unity Bank', code: '215', category: 'Commercial' },
  { name: 'Wema Bank', code: '035', category: 'Commercial' },
  { name: 'Zenith Bank', code: '057', category: 'Commercial' },

  // FinTechs & Digital Neobanks (MFBs & Payment Service Banks)
  { name: 'ALAT by Wema', code: '035A', category: 'FinTech / Neobank' },
  { name: 'Carbon (One Finance)', code: '565', category: 'FinTech / Neobank' },
  { name: 'Eyowo MFB', code: '50126', category: 'FinTech / Neobank' },
  { name: 'FairMoney Microfinance Bank', code: '51318', category: 'FinTech / Neobank' },
  { name: 'GoMoney (Sterling)', code: '100022', category: 'FinTech / Neobank' },
  { name: 'Kuda Microfinance Bank', code: '50211', category: 'FinTech / Neobank' },
  { name: 'Moniepoint Microfinance Bank', code: '50515', category: 'FinTech / Neobank' },
  { name: 'OPay (PayCom)', code: '999992', category: 'FinTech / Neobank' },
  { name: 'PalmPay', code: '999991', category: 'FinTech / Neobank' },
  { name: 'Piggyvest (PocketApp)', code: '51229', category: 'FinTech / Neobank' },
  { name: 'Raven Bank', code: '50200', category: 'FinTech / Neobank' },
  { name: 'Rubies Microfinance Bank', code: '125', category: 'FinTech / Neobank' },
  { name: 'VFD Microfinance Bank', code: '566', category: 'FinTech / Neobank' },

  // Non-Interest / Islamic Banks
  { name: 'Alternative Bank', code: '000304', category: 'Non-Interest' },
  { name: 'Jaiz Bank', code: '301', category: 'Non-Interest' },
  { name: 'Lotus Bank', code: '303', category: 'Non-Interest' },
  { name: 'TAJBank', code: '302', category: 'Non-Interest' },

  // Merchant Banks
  { name: 'Coronation Merchant Bank', code: '559', category: 'Merchant' },
  { name: 'FBNQuest Merchant Bank', code: '560', category: 'Merchant' },
  { name: 'FSDH Merchant Bank', code: '501', category: 'Merchant' },
  { name: 'Greenwich Merchant Bank', code: '562', category: 'Merchant' },
  { name: 'Rand Merchant Bank Nigeria', code: '502', category: 'Merchant' },
];

export const NIGERIAN_BANK_NAMES = NIGERIAN_BANKS.map(b => b.name);
