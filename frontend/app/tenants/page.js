'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';

const emptyForm = {
  room_id: '',
  full_name: '',
  phone: '',
  id_card: '',
  deposit_amount: '',
  num_of_people: 1,
  start_date: new Date().toISOString().split('T')[0],
  notes: '',
};

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [tRes, rRes] = await Promise.all([
        api.get('/tenants'),
        api.get('/rooms'),
      ]);
      setTenants(tRes.data.data);
      setRooms(rRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openAdd = () => {
    const vacantRoom = rooms.find(r => r.status === 'vacant');
    setForm({ ...emptyForm, room_id: vacantRoom?.id || '' });
    setEditTenant(null);
    setShowModal(true);
  };

  const openEdit = (tenant) => {
    setEditTenant(tenant);
    setForm({
      room_id: tenant.room_id,
      full_name: tenant.full_name,
      phone: tenant.phone || '',
      id_card: tenant.id_card || '',
      deposit_amount: tenant.deposit_amount,
      num_of_people: tenant.num_of_people,
      start_date: tenant.start_date?.split('T')[0] || '',
      notes: tenant.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.room_id || !form.full_name || !form.start_date) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editTenant) {
        await api.put(`/tenants/${editTenant.id}`, form);
        showToast('Cập nhật thông tin khách thuê thành công!');
      } else {
        await api.post('/tenants', form);
        showToast('Thêm khách thuê mới thành công!');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tenants/${id}`);
      showToast('Đã chuyển khách ra phòng thành công!');
      setConfirmDelete(null);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi xóa', 'error');
    }
  };

  const formatCurrency = (num) =>
    new Intl.NumberFormat('vi-VN').format(num) + ' ₫';

  const vacantRooms = rooms.filter(r => r.status === 'vacant');

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header-flex">
            <div>
              <h1>👤 Quản Lý Khách Thuê</h1>
              <p>Hồ sơ khách đang thuê · {tenants.length} khách</p>
            </div>
            <button
              id="add-tenant-btn"
              className="btn btn-primary"
              onClick={openAdd}
              disabled={vacantRooms.length === 0}
            >
              + Thêm Khách Thuê
            </button>
          </div>

          {vacantRooms.length === 0 && (
            <div style={{
              background: 'var(--accent-glow)',
              border: '1px solid var(--border-active)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: '0.85rem',
              color: 'var(--accent-primary)',
              marginBottom: '20px',
            }}>
              ℹ️ Tất cả phòng đang được cho thuê. Cần trả phòng trước khi thêm khách mới.
            </div>
          )}

          {loading ? (
            <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
          ) : tenants.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">👤</div>
                <h3>Chưa có khách thuê</h3>
                <p>Nhấn "Thêm Khách Thuê" để bắt đầu</p>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Phòng</th>
                      <th>Họ Tên</th>
                      <th>Số Điện Thoại</th>
                      <th>Số Người</th>
                      <th>Tiền Cọc</th>
                      <th>Ngày Vào</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map(t => (
                      <tr key={t.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                            {t.room_number}
                          </span>
                          <br />
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.room_name}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{t.full_name}</td>
                        <td>{t.phone || '—'}</td>
                        <td>
                          <span className="badge badge-success">{t.num_of_people} người</span>
                        </td>
                        <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                          {formatCurrency(t.deposit_amount)}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {new Date(t.start_date).toLocaleDateString('vi-VN')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEdit(t)}
                            >✏️</button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setConfirmDelete(t)}
                            >🚪</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editTenant ? '✏️ Sửa Hồ Sơ Khách Thuê' : '👤 Thêm Khách Thuê Mới'}
              </h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Phòng <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <select
                  className="form-select"
                  value={form.room_id}
                  onChange={e => setForm({ ...form, room_id: e.target.value })}
                  disabled={!!editTenant}
                >
                  <option value="">-- Chọn phòng --</option>
                  {rooms.filter(r => r.status === 'vacant' || r.id === form.room_id).map(r => (
                    <option key={r.id} value={r.id}>{r.room_number} — {r.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Họ và Tên <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input className="form-input" value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Nguyễn Văn A" />
                </div>
                <div className="form-group">
                  <label className="form-label">Số Điện Thoại</label>
                  <input className="form-input" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="090..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">CCCD / CMT</label>
                  <input className="form-input" value={form.id_card}
                    onChange={e => setForm({ ...form, id_card: e.target.value })} placeholder="0123..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Số Người Ở</label>
                  <input className="form-input" type="number" min="1" max="10"
                    value={form.num_of_people}
                    onChange={e => setForm({ ...form, num_of_people: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tiền Đặt Cọc (VNĐ)</label>
                  <input className="form-input" type="number"
                    value={form.deposit_amount}
                    onChange={e => setForm({ ...form, deposit_amount: e.target.value })} placeholder="5000000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày Vào Ở <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input className="form-input" type="date"
                    value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Ghi Chú</label>
                <textarea className="form-textarea" value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Gửi xe, vật nuôi, hợp đồng..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Đang lưu...' : '💾 Lưu Hồ Sơ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🚪 Xác Nhận Trả Phòng</h3>
              <button className="close-btn" onClick={() => setConfirmDelete(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Bạn có chắc muốn ghi nhận <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete.full_name}</strong> trả phòng?
                Hành động này sẽ đánh dấu phòng <strong style={{ color: 'var(--accent-primary)' }}>{confirmDelete.room_number}</strong> là trống.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Hủy</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete.id)}>
                🚪 Xác Nhận Trả Phòng
              </button>
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
