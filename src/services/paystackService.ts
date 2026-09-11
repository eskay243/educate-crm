// Paystack Inline SDK Service
// Supports live/test Paystack Inline Popup with dynamic script loading and simulated checkout modal

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number; // in kobo
        ref?: string;
        currency?: string;
        metadata?: any;
        callback: (response: { reference: string; status?: string; trxref?: string }) => void;
        onClose: () => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

let scriptLoadingPromise: Promise<boolean> | null = null;

export const loadPaystackScript = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.PaystackPop) return Promise.resolve(true);

  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve) => {
    const existingScript = document.getElementById('paystack-inline-js');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'paystack-inline-js';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Paystack Inline SDK loaded successfully.');
      resolve(true);
    };
    script.onerror = () => {
      console.warn('⚠️ Could not load Paystack inline script from CDN. Fallback simulation available.');
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
};

export interface PaystackCheckoutOptions {
  publicKey: string;
  email: string;
  amountNaira: number;
  studentId?: string;
  invoiceId?: string;
  metadata?: any;
  onSuccess: (response: { reference: string; amountNaira: number }) => void;
  onCancel?: () => void;
}

export const launchPaystackPayment = async (options: PaystackCheckoutOptions) => {
  const { publicKey, email, amountNaira, studentId, invoiceId, metadata, onSuccess, onCancel } = options;
  const isRealKey = publicKey && publicKey.startsWith('pk_') && !publicKey.includes('sample');
  const amountInKobo = Math.round(amountNaira * 100);
  const reference = `CDL-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  if (isRealKey) {
    const isLoaded = await loadPaystackScript();
    if (isLoaded && window.PaystackPop) {
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email,
        amount: amountInKobo,
        ref: reference,
        currency: 'NGN',
        metadata: {
          studentId,
          invoiceId,
          custom_fields: [
            { display_name: 'Student ID', variable_name: 'student_id', value: studentId || 'N/A' },
            { display_name: 'Invoice ID', variable_name: 'invoice_id', value: invoiceId || 'N/A' },
          ],
          ...metadata,
        },
        callback: (response) => {
          onSuccess({
            reference: response.reference || reference,
            amountNaira,
          });
        },
        onClose: () => {
          if (onCancel) onCancel();
        },
      });

      handler.openIframe();
      return;
    }
  }

  // If running in test sandbox or simulated key:
  const confirmed = window.confirm(
    `[CODELAB EDUCARE - Paystack Checkout Simulator]\n\n` +
    `Student: ${email}\n` +
    `Amount: ₦${amountNaira.toLocaleString()}\n` +
    `Ref: ${reference}\n\n` +
    `Mode: ${isRealKey ? 'Paystack Script Unreachable' : 'Test / Sandbox Mode'}\n\n` +
    `Click OK to simulate a successful Paystack transaction.`
  );

  if (confirmed) {
    onSuccess({
      reference,
      amountNaira,
    });
  } else {
    if (onCancel) onCancel();
  }
};
