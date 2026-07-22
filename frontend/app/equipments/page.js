'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';

export default function EquipmentsPage() {
  const router = useRouter();
  const [equipments, setEquipments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Add Equipment Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ room_id: '', name: '', status: 'normal', notes: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eqRes, roomRes] = await Promise.all([
        api.get('/equipments'),
        api.get('/rooms')
      ]);
      setEquipments(eqRes.data.data);
      setRooms(roomRes.data.data);
      
      // Select first room as default for add form
      if (roomRes.data.data.length > 0) {
        setAddForm(prev => ({ ...prev, room_id: roomRes.data.data[0].id }));
      }
    } catch (err) {
      showToast('Lỗi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateEquipment = async (id, status, notes) => {
    try {
      await api.put(`/equipments/${id}`, { status, notes });
      setEquipments(prev => prev.map(eq => eq.id === id ? { ...eq, status, notes } : eq));
      showToast('Đã lưu trạng thái', 'success');
    } catch (err) {
      showToast('Lỗi cập nhật', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xoá thiết bị này?')) return;
    try {
      await api.delete(`/equipments/${id}`);
      setEquipments(prev => prev.filter(eq => eq.id !== id));
      showToast('Đã xoá thiết bị', 'success');
    } catch (err) {
      showToast('Lỗi xoá thiết bị', 'error');
    }
  };

  const handleAdd = async () => {
    if (!addForm.room_id || !addForm.name) {
      return showToast('Vui lòng điền đủ Tên phòng và Tên thiết bị', 'error');
    }
    setAdding(true);
    try {
      await api.post('/equipments', addForm);
      showToast('Thêm thiết bị thành công', 'success');
      setShowAddModal(false);
      setAddForm({ ...addForm, name: '', notes: '' }); // reset only text fields
      fetchData(); // reload
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi thêm thiết bị', 'error');
    } finally {
      setAdding(false);
    }
  };


  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header-flex">
            <div>
              <h1>🛋️ Quản Lý Thiết Bị</h1>
              <p>Quản lý tài sản, theo dõi tình trạng nội thất các phòng</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              ➕ Thêm Thiết Bị
            </button>
          </div>

          {loading ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Đang tải...</div>
          ) : rooms.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có phòng nào.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {rooms.map((room) => {
                const roomNameLabel = room.name && room.name !== room.room_number 
                  ? room.name 
                  : `Phòng ${room.room_number}`;
                const eqs = equipments.filter(eq => eq.room_id === room.id);
                
                return (
                  <div key={room.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--bg-elevated)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="stat-icon teal" style={{ width: 36, height: 36, fontSize: '1.2rem' }}>🏠</span>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{roomNameLabel}</h3>
                    </div>
                    
                    {eqs.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ marginBottom: '12px' }}>Phòng này chưa có thiết bị nào</p>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setAddForm(prev => ({ ...prev, room_id: room.id }));
                            setShowAddModal(true);
                          }}
                        >
                          ➕ Thêm Thiết Bị
                        </button>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th style={{ width: '30%' }}>Tên Thiết Bị</th>
                              <th style={{ width: '25%' }}>Trạng Thái</th>
                              <th style={{ width: '35%' }}>Ghi Chú</th>
                              <th style={{ width: '10%', textAlign: 'center' }}>Hành Động</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eqs.map(eq => (
                              <tr key={eq.id}>
                                <td style={{ fontWeight: 500 }}>{eq.name}</td>
                            <td>
                              <select 
                                className="form-select" 
                                style={{ width: '100%', padding: '6px 8px', fontSize: '0.85rem' }}
                                value={eq.status}
                                onChange={(e) => updateEquipment(eq.id, e.target.value, eq.notes)}
                              >
                                <option value="new">🌟 Mới</option>
                                <option value="normal">✅ Bình thường</option>
                                <option value="damaged">⚠️ Hư hỏng</option>
                              </select>
                            </td>
                            <td>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Ghi chú..."
                                defaultValue={eq.notes || ''}
                                onBlur={(e) => {
                                  if (e.target.value !== eq.notes) {
                                    updateEquipment(eq.id, eq.status, e.target.value);
                                  }
                                }}
                                style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button 
                                className="btn btn-sm" 
                                style={{ background: '#ffebee', color: '#d32f2f', border: '1px solid #ffcdd2', padding: '4px 10px' }}
                                onClick={() => handleDelete(eq.id)}
                                title="Xoá thiết bị"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ Thêm Thiết Bị Mới</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Chọn phòng</label>
                <select 
                  className="form-select"
                  value={addForm.room_id}
                  onChange={e => setAddForm({ ...addForm, room_id: e.target.value })}
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>Phòng {r.room_number} - {r.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tên thiết bị</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="VD: Tủ lạnh, Máy giặt, Quạt..."
                  value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tình trạng hiện tại</label>
                <select 
                  className="form-select"
                  value={addForm.status}
                  onChange={e => setAddForm({ ...addForm, status: e.target.value })}
                >
                  <option value="new">🌟 Mới 100%</option>
                  <option value="normal">✅ Bình thường</option>
                  <option value="damaged">⚠️ Đã hư hỏng</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ghi chú (Tùy chọn)</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="VD: Mới mua ngày 01/05"
                  value={addForm.notes}
                  onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={adding}>
                {adding ? '⏳ Đang lưu...' : '💾 Thêm thiết bị'}
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
