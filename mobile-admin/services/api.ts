import axios from 'axios';

const API_BASE = 'https://your-netlify-domain/.netlify/functions/api';

export const purchaseAPI = {
  getPendingPurchases: async (adminKey: string) => {
    const response = await axios.post(API_BASE, {
      action: 'get_pending_purchases',
      admin_key: adminKey
    });
    return response.data;
  },

  approvePurchase: async (adminKey: string, purchaseId: string) => {
    const response = await axios.post(API_BASE, {
      action: 'validate_purchase',
      admin_key: adminKey,
      purchase_id: purchaseId,
      status: 'approved'
    });
    return response.data;
  },

  rejectPurchase: async (adminKey: string, purchaseId: string, reason: string) => {
    const response = await axios.post(API_BASE, {
      action: 'validate_purchase',
      admin_key: adminKey,
      purchase_id: purchaseId,
      status: 'rejected',
      reason
    });
    return response.data;
  },

  generatePremiumKey: async (adminKey: string) => {
    const response = await axios.post(API_BASE, {
      action: 'generate_premium_key',
      admin_key: adminKey
    });
    return response.data;
  }
};
