import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ICONS } from './constants';

interface Purchase {
  id: string;
  purchase_id: string;
  amount: number;
  buyer_email: string;
  gcash_ref: string;
  status: 'pending' | 'approved' | 'rejected';
  qr_code?: string;
  created_at: string;
  validated_at?: string;
  rejection_reason?: string;
}

const AdminApp: React.FC = () => {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [uploadedQr, setUploadedQr] = useState<File | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Login handler
  const handleAdminLogin = () => {
    if (adminKey.trim()) {
      setIsAuthenticated(true);
      fetchPendingPurchases();
    }
  };

  // Fetch pending purchases
  const fetchPendingPurchases = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_pending_purchases',
          admin_key: adminKey
        })
      });

      const result = await response.json();
      if (response.ok) {
        setPurchases(result.purchases || []);
      }
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate QR code for payment
  const generatePaymentQR = async (purchaseId: string, amount: number) => {
    try {
      const qrData = {
        purchaseId,
        amount,
        timestamp: new Date().toISOString(),
        gcash: true
      };
      
      const qrUrl = await QRCode.toDataURL(JSON.stringify(qrData));
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('QR generation failed:', error);
    }
  };

  // Handle QR upload
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedQr(e.target.files[0]);
    }
  };

  // Approve purchase - generate key and send via chat
  const handleApprovePurchase = async () => {
    if (!selectedPurchase) return;

    setIsLoading(true);
    try {
      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_purchase',
          admin_key: adminKey,
          purchase_id: selectedPurchase.purchase_id,
          status: 'approved'
        })
      });

      const result = await response.json();
      if (response.ok) {
        // Show success message with generated key
        alert(`✓ Purchase Approved!\n\nGenerated Key: ${result.key}\n\nMessage: ${result.notify}`);
        
        // Refresh purchases list
        fetchPendingPurchases();
        setSelectedPurchase(null);
      }
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Failed to approve purchase');
    } finally {
      setIsLoading(false);
    }
  };

  // Reject purchase - send reason
  const handleRejectPurchase = async () => {
    if (!selectedPurchase || !rejectionReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_purchase',
          admin_key: adminKey,
          purchase_id: selectedPurchase.purchase_id,
          status: 'rejected',
          reason: rejectionReason
        })
      });

      const result = await response.json();
      if (response.ok) {
        alert(`✓ Purchase Rejected\n\nMessage: ${result.notify}`);
        fetchPendingPurchases();
        setSelectedPurchase(null);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Rejection failed:', error);
      alert('Failed to reject purchase');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050811] p-8 flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-0"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="bg-[#0e1423]/80 backdrop-blur-3xl border border-slate-800/50 rounded-[2rem] p-8 shadow-xl">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl flex items-center justify-center shadow-lg mb-6 mx-auto">
              <ICONS.Code />
            </div>
            
            <h1 className="text-2xl font-black text-white text-center mb-2 uppercase tracking-tighter">Admin Access</h1>
            <p className="text-center text-slate-500 text-[10px] mb-8 uppercase tracking-widest font-black">Purchase Validator</p>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Admin Key</label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin key..."
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs w-full text-white outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <button
                onClick={handleAdminLogin}
                disabled={!adminKey.trim()}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg transition-all uppercase tracking-[0.2em] text-[10px]"
              >
                Unlock Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredPurchases = purchases.filter(p => filterStatus === 'all' || p.status === filterStatus);

  return (
    <div className="min-h-screen bg-[#050811] p-4 md:p-8">
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-0"></div>

      <header className="w-full max-w-6xl mb-8 flex items-center justify-between relative z-10 mx-auto">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Purchase Validator</h1>
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mt-1">Staff Dashboard</p>
        </div>
        
        <button
          onClick={() => {
            setIsAuthenticated(false);
            setAdminKey('');
          }}
          className="bg-red-950/20 text-red-500 font-black px-6 py-3 rounded-2xl border border-red-500/10 text-[10px] uppercase tracking-widest hover:bg-red-950/40 transition-all"
        >
          Logout
        </button>
      </header>

      <main className="w-full max-w-6xl relative z-10 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Purchases List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0e1423]/80 backdrop-blur-3xl border border-slate-800/50 rounded-[2rem] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-black mb-0 text-white uppercase tracking-[0.3em]">
                  Purchase Queue
                </h2>
                <button
                  onClick={fetchPendingPurchases}
                  disabled={isLoading}
                  className="text-[9px] font-black uppercase px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all"
                >
                  Refresh
                </button>
              </div>

              <div className="flex gap-2 mb-6">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl transition-all ${
                      filterStatus === status
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="space-y-3 max-h-[600px] overflow-auto custom-scrollbar">
                {filteredPurchases.length === 0 ? (
                  <p className="text-center py-10 text-slate-700 text-[10px] uppercase tracking-widest font-black">
                    No {filterStatus !== 'all' ? filterStatus : ''} purchases.
                  </p>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <button
                      key={purchase.id}
                      onClick={() => setSelectedPurchase(purchase)}
                      className={`w-full p-4 rounded-2xl border transition-all text-left ${
                        selectedPurchase?.id === purchase.id
                          ? 'bg-slate-800 border-orange-500'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-black text-white text-sm">#{purchase.purchase_id}</p>
                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${
                          purchase.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          purchase.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {purchase.status}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 mb-2">{purchase.buyer_email}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-[11px] font-bold text-white">₱ {purchase.amount}</p>
                        <p className="text-[8px] text-slate-600">{new Date(purchase.created_at).toLocaleDateString()}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <div className="bg-[#0e1423]/80 backdrop-blur-3xl border border-slate-800/50 rounded-[2rem] p-6 shadow-xl h-fit sticky top-8">
            {selectedPurchase ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-4">
                    Purchase Details
                  </h3>
                  
                  <div className="space-y-3 text-[10px]">
                    <div>
                      <p className="text-slate-500 uppercase font-black tracking-wider mb-1">ID</p>
                      <p className="text-white font-mono">{selectedPurchase.purchase_id}</p>
                    </div>
                    
                    <div>
                      <p className="text-slate-500 uppercase font-black tracking-wider mb-1">Amount</p>
                      <p className="text-white font-bold text-lg">₱ {selectedPurchase.amount}</p>
                    </div>
                    
                    <div>
                      <p className="text-slate-500 uppercase font-black tracking-wider mb-1">Email</p>
                      <p className="text-white font-mono text-[9px]">{selectedPurchase.buyer_email}</p>
                    </div>

                    <div>
                      <p className="text-slate-500 uppercase font-black tracking-wider mb-1">GCash Ref</p>
                      <p className="text-white font-mono text-[9px]">{selectedPurchase.gcash_ref}</p>
                    </div>
                    
                    <div>
                      <p className="text-slate-500 uppercase font-black tracking-wider mb-1">Status</p>
                      <span className={`text-[9px] font-black uppercase px-3 py-1 rounded inline-block ${
                        selectedPurchase.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        selectedPurchase.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {selectedPurchase.status}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedPurchase.status === 'pending' && (
                  <div className="border-t border-slate-800 pt-6 space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2">
                        Upload GCash Payment QR
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrUpload}
                        className="w-full text-[9px] text-slate-400 file:bg-slate-800 file:border-0 file:rounded-lg file:px-3 file:py-2 file:text-[9px] file:font-black file:text-white file:cursor-pointer hover:file:bg-slate-700"
                      />
                      {uploadedQr && (
                        <p className="text-[9px] text-green-400 mt-2">✓ {uploadedQr.name}</p>
                      )}
                    </div>

                    <button
                      onClick={() => generatePaymentQR(selectedPurchase.purchase_id, selectedPurchase.amount)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl text-[9px] uppercase transition-all"
                    >
                      Generate Payment QR
                    </button>

                    {qrCodeUrl && (
                      <div className="bg-slate-950 p-4 rounded-xl">
                        <p className="text-[9px] text-slate-500 font-black uppercase mb-3">QR Code</p>
                        <img src={qrCodeUrl} alt="Payment QR" className="w-full bg-white p-2 rounded" />
                      </div>
                    )}

                    <div className="space-y-3">
                      <button
                        onClick={handleApprovePurchase}
                        disabled={isLoading}
                        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black py-3 rounded-xl text-[9px] uppercase transition-all"
                      >
                        ✓ Approve & Generate Key
                      </button>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter rejection reason..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[9px] text-white outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                        <button
                          onClick={handleRejectPurchase}
                          disabled={isLoading || !rejectionReason.trim()}
                          className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black py-3 rounded-xl text-[9px] uppercase transition-all"
                        >
                          ✗ Reject Purchase
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPurchase.status === 'rejected' && selectedPurchase.rejection_reason && (
                  <div className="border-t border-slate-800 pt-6">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">
                      Rejection Reason
                    </p>
                    <p className="text-[10px] text-slate-300">{selectedPurchase.rejection_reason}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center py-10 text-slate-700 text-[10px] uppercase font-black tracking-widest">
                Select a purchase to validate
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminApp;
