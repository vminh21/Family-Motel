'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [toast, setToast] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editReason, setEditReason] = useState('');
  const [editAmount, setEditAmount] = useState('');

  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/billing/invoices');
      setInvoices(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num) + ' ₫';

  const handleDeleteInvoice = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xoá hoá đơn này?')) return;
    try {
      await api.delete(`/billing/invoices/${id}`);
      showToast('Đã xoá hoá đơn');
      fetchInvoices();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi xoá hoá đơn', 'error');
    }
  };

  const handleDeleteCycle = async (id, period) => {
    if (!confirm(`Bạn có chắc chắn muốn huỷ toàn bộ hoá đơn của ${period}? Thao tác này sẽ xoá tất cả hoá đơn trong tháng và bạn có thể chốt bill lại từ đầu.`)) return;
    try {
      await api.delete(`/billing/cycles/${id}`);
      showToast('Đã huỷ chốt bill tháng');
      fetchInvoices();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi huỷ chốt bill', 'error');
    }
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/billing/invoices/${editingInvoice.id}`, {
        adjustment_reason: editReason,
        adjustment_amount: parseFloat(editAmount) || 0
      });
      showToast('Đã cập nhật khoản điều chỉnh');
      setEditingInvoice(null);
      fetchInvoices();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi cập nhật', 'error');
    }
  };

  const handleToggleStatus = async (inv) => {
    if (inv.is_paid) {
      if (!confirm('Bạn có chắc muốn huỷ trạng thái đã thu?')) return;
      try {
        await api.put(`/billing/invoices/${inv.id}/status`, { is_paid: 0, payment_date: null });
        showToast('Đã chuyển thành Chưa Thu');
        fetchInvoices();
      } catch (err) {
        showToast(err.response?.data?.message || 'Lỗi cập nhật trạng thái', 'error');
      }
    } else {
      setPayingInvoice(inv);
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentDate) {
      showToast('Vui lòng chọn ngày thu', 'error');
      return;
    }
    try {
      await api.put(`/billing/invoices/${payingInvoice.id}/status`, { 
        is_paid: 1, 
        payment_date: paymentDate 
      });
      showToast('Đã ghi nhận Đã Thu');
      setPayingInvoice(null);
      fetchInvoices();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi cập nhật', 'error');
    }
  };

  // Group by billing period
  const grouped = invoices.reduce((acc, inv) => {
    const key = `Tháng ${inv.month}/${inv.year}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(inv);
    return acc;
  }, {});

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header">
            <h1>📄 Lịch Sử Hóa Đơn</h1>
            <p>Tổng hợp hóa đơn các kỳ thanh toán</p>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
          ) : invoices.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <h3>Chưa có hóa đơn nào</h3>
                <p>Thực hiện Chốt Bill để tạo hóa đơn đầu tiên</p>
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => router.push('/billing')}>
                  🧾 Đến Trang Chốt Bill
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {Object.entries(grouped).map(([period, invList]) => (
                <div key={period} className="card">
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="card-title">📅 {period}</div>
                      <div className="card-subtitle">{invList.length} hóa đơn · Tổng: {formatVND(invList.reduce((s, i) => s + parseFloat(i.total_amount), 0))}</div>
                    </div>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => handleDeleteCycle(invList[0].billing_cycle_id, period)}
                      style={{ color: 'var(--color-danger)', borderColor: 'rgba(255,107,107,0.3)' }}
                    >
                      🗑️ Huỷ chốt bill tháng này
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {invList.map(inv => (
                      <div key={inv.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'var(--accent-glow)',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            border: '1px solid var(--border-active)',
                          }}>🏠</div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{inv.room_name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {inv.room_number} · {inv.tenant_name}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '1rem' }}>
                              {formatVND(inv.total_amount)}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              #{String(inv.id).padStart(5, '0')}
                              {inv.is_paid && inv.payment_date && ` · Thu ngày ${new Date(inv.payment_date).toLocaleDateString('vi-VN')}`}
                            </div>
                          </div>
                          
                          <button
                            className={`btn btn-sm ${inv.is_paid ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleToggleStatus(inv)}
                            title="Bấm để đổi trạng thái thanh toán"
                            style={inv.is_paid ? { 
                              background: '#00d4aa', 
                              borderColor: '#00d4aa',
                              color: 'white'
                            } : {}}
                          >
                            {inv.is_paid ? '✅ Đã Thu' : '⏳ Chưa Thu'}
                          </button>
                          
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setEditingInvoice(inv);
                              setEditReason(inv.adjustment_reason || '');
                              setEditAmount(inv.adjustment_amount || '');
                            }}
                          >
                            ✏️ Điều chỉnh
                          </button>
                          
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDeleteInvoice(inv.id)}
                            style={{ color: 'var(--color-danger)' }}
                          >
                            🗑️
                          </button>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => router.push(`/billing/invoice/${inv.id}`)}
                          >
                            📄 Xem
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="modal-overlay" onClick={() => setEditingInvoice(null)}>
          <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="card-title mb-16">✏️ Phụ Thu / Giảm Giá {editingInvoice.room_name}</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Thay vì sửa trực tiếp tổng tiền, hãy thêm một khoản điều chỉnh để minh bạch hoá đơn.
            </p>
            <div className="form-group mb-16">
              <label className="form-label">Lý do điều chỉnh</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="VD: Giảm giá lễ, Phụ thu dọn dẹp..."
                value={editReason} 
                onChange={(e) => setEditReason(e.target.value)} 
                autoFocus
              />
            </div>
            <div className="form-group mb-16">
              <label className="form-label">Số Tiền (VNĐ)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="Nhập số âm để giảm (VD: -50000)"
                value={editAmount} 
                onChange={(e) => setEditAmount(e.target.value)} 
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px', display: 'block' }}>
                Tổng thu hiện tại: {formatVND(editingInvoice.total_amount - (editingInvoice.adjustment_amount || 0))} 
                <br/>
                Tổng thu mới: <strong style={{ color: 'var(--accent-primary)' }}>{formatVND((parseFloat(editingInvoice.total_amount) - (parseFloat(editingInvoice.adjustment_amount) || 0)) + (parseFloat(editAmount) || 0))}</strong>
              </small>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setEditingInvoice(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Lưu Thay Đổi</button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Invoice Modal */}
      {payingInvoice && (
        <div className="modal-overlay" onClick={() => setPayingInvoice(null)}>
          <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="card-title mb-16">✅ Ghi Nhận Thu Tiền {payingInvoice.room_name}</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Xác nhận đã thu đủ số tiền <strong>{formatVND(payingInvoice.total_amount)}</strong> cho hoá đơn #{String(payingInvoice.id).padStart(5, '0')}
            </p>
            <div className="form-group mb-16">
              <label className="form-label">Ngày Thu Tiền</label>
              <input 
                type="date" 
                className="form-input" 
                value={paymentDate} 
                onChange={(e) => setPaymentDate(e.target.value)} 
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setPayingInvoice(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleConfirmPayment}>Xác nhận Đã Thu</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
