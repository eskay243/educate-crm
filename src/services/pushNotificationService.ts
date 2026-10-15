// ==============================================================================
// CODELAB EDUCARE Nexus CRM — Web Push Notification Service (W3C Push API / RFC 8292)
// ==============================================================================

import { AuthUser } from '../types/crm';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Convert URL-safe base64 string to a Uint8Array for PushManager
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushNotificationService = {
  /**
   * Check if the current browser/device environment supports Web Push
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  /**
   * Get current browser notification permission
   */
  getPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  },

  /**
   * Check if device is currently subscribed
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return Boolean(subscription);
    } catch (err) {
      console.warn('Error checking push subscription:', err);
      return false;
    }
  },

  /**
   * Request permission and subscribe device to Web Push
   */
  async subscribe(currentUser: AuthUser): Promise<{ success: boolean; message: string }> {
    if (!this.isSupported()) {
      return { 
        success: false, 
        message: 'Web Push notifications are not supported on this browser or platform.' 
      };
    }

    try {
      // 1. Request permission from user
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          success: false,
          message: permission === 'denied' 
            ? 'Notification permission was blocked in browser settings. Please enable notifications in your browser preferences.'
            : 'Notification permission was dismissed.'
        };
      }

      // 2. Fetch VAPID Public Key from server
      const keyRes = await fetch(`${API_BASE_URL}/push/vapid-public-key`);
      const keyData = await keyRes.json();
      if (!keyData.success || !keyData.publicKey) {
        throw new Error('Failed to retrieve VAPID public key from backend server.');
      }

      // 3. Register with browser PushManager
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) as unknown as BufferSource
        });
      }

      // 4. Send subscription endpoint & cryptographic keys to backend server
      const subPayload = {
        subscription: subscription.toJSON(),
        userId: currentUser.id,
        userRole: currentUser.role,
        userEmail: currentUser.email,
        userName: currentUser.name,
        isApprover: Boolean(currentUser.isApprover || currentUser.role === 'approver' || currentUser.role === 'super_admin' || currentUser.role === 'finance')
      };

      const saveRes = await fetch(`${API_BASE_URL}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subPayload)
      });

      const saveJson = await saveRes.json();
      if (!saveJson.success) {
        throw new Error(saveJson.message || 'Failed to save push subscription on server.');
      }

      return {
        success: true,
        message: '🎉 Push notifications successfully enabled on this device!'
      };
    } catch (err: any) {
      console.error('Web Push subscription error:', err);
      return {
        success: false,
        message: err.message || 'Failed to complete push notification setup.'
      };
    }
  },

  /**
   * Unsubscribe device from Web Push
   */
  async unsubscribe(): Promise<{ success: boolean; message: string }> {
    if (!this.isSupported()) return { success: true, message: 'Not supported' };

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        // Inform server
        await fetch(`${API_BASE_URL}/push/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint })
        });
      }

      return { success: true, message: 'Unsubscribed from push notifications.' };
    } catch (err: any) {
      console.error('Web Push unsubscribe error:', err);
      return { success: false, message: err.message };
    }
  },

  /**
   * Send a test push notification to this device
   */
  async sendTestPush(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/push/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Test push failed' };
    }
  }
};
