'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRoom, setEditRoom] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openEdit = (room) => {
    setEditRoom(room);
    setEditForm({ 
      name: room.name, 
      base_rent: room.base_rent,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/rooms/${editRoom.id}`, editForm);
      showToast('Cập nhật phòng thành công!');
      setEditRoom(null);
      fetchRooms();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (num) =>
    new Intl.NumberFormat('vi-VN').format(num) + ' ₫';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header">
            <h1>🏠 Quản Lý Phòng Trọ</h1>
            <p>Thông tin các phòng trọ và tình trạng sử dụng</p>
          </div>

          {loading ? (
            <div className="grid-cols-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 220 }} />)}
            </div>
          ) : (
            <div className="grid-cols-3">
              {rooms.map((room) => (
                <div key={room.id} className={`room-card ${room.status === 'vacant' ? 'vacant' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                        {room.room_number}
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{room.name}</h3>
                    </div>
                    <span className={`badge ${room.status === 'occupied' ? 'badge-occupied' : 'badge-vacant'}`}>
                      {room.status === 'occupied' ? '● Đang thuê' : '○ Trống'}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: 'var(--accent-primary)',
                    marginBottom: '16px',
                  }}>
                    {formatCurrency(room.base_rent)}
                    <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/tháng</span>
                  </div>

                  <hr className="divider" />

                  {room.status === 'occupied' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>👤 Khách thuê</span>
                        <span style={{ fontWeight: 600 }}>{room.tenant_name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>📞 Liên hệ</span>
                        <span>{room.tenant_phone || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>👥 Số người</span>
                        <span>{room.num_of_people} người</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>💵 Đặt cọc</span>
                        <span>{formatCurrency(room.deposit_amount)}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      Phòng chưa có khách thuê
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%' }}
                      onClick={() => openEdit(room)}
                    >
                      ✏️ Sửa Thông Tin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editRoom && (
        <div className="modal-overlay" onClick={() => setEditRoom(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">✏️ Sửa Thông Tin — {editRoom.name}</h3>
              <button className="close-btn" onClick={() => setEditRoom(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Tên phòng</label>
                <input
                  className="form-input"
                  value={editForm.name || ''}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Giá thuê cơ bản (VNĐ)</label>
                <input
                  className="form-input"
                  type="number"
                  value={editForm.base_rent || ''}
                  onChange={e => setEditForm({ ...editForm, base_rent: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditRoom(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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
