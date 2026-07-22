'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';

const STEPS = ['Chọn Kỳ', 'Nhập Điện', 'Chốt Bill'];

export default function BillingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [settings, setSettings] = useState({});
  const [cycleId, setCycleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [result, setResult] = useState(null);

  const now = new Date();
  const [cycleForm, setCycleForm] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    total_electricity_amount: '',
    shared_rooms_count: 1,
  });

  const [readings, setReadings] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [roomsRes, settingsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/settings')
      ]);
      const occupied = roomsRes.data.data.filter(r => r.status === 'occupied');
      setRooms(occupied);

      const flatSettings = {};
      Object.entries(settingsRes.data.data).forEach(([k, v]) => { flatSettings[k] = v.value; });
      setSettings(flatSettings);

      setCycleForm(prev => ({ ...prev, shared_rooms_count: occupied.length || 1 }));
      setReadings(occupied.map(r => ({
        room_id: r.id,
        room_number: r.room_number,
        room_name: r.name,
        electricity_method: r.electricity_method === 'free' ? 'shared' : (r.electricity_method || 'shared'),
        electricity_flat_amount: r.electricity_flat_amount || 500000,
        water_method: r.water_method || 'free',
        water_fixed_amount: r.water_fixed_amount || 50000
      })));
    } catch (err) {
      showToast('Lỗi tải dữ liệu', 'error');
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveReadingsAndContinue = async () => {
    if (!cycleForm.total_electricity_amount || !cycleForm.shared_rooms_count) {
      showToast('Vui lòng nhập đủ thông tin điện tổng', 'error'); return;
    }
    setLoading(true);
    try {
      const res = await api.post('/billing/cycles', {
        month: parseInt(cycleForm.month),
        year: parseInt(cycleForm.year),
        total_electricity_amount: parseFloat(cycleForm.total_electricity_amount),
        shared_rooms_count: parseInt(cycleForm.shared_rooms_count),
      });
      const newCycleId = res.data.data.id;
      setCycleId(newCycleId);

      await api.post(`/billing/cycles/${newCycleId}/readings`, {
        readings: readings.map(r => ({
          room_id: r.room_id,
          electricity_method: r.electricity_method,
          electricity_flat_amount: r.electricity_flat_amount ? parseFloat(r.electricity_flat_amount) : 0,
          water_method: r.water_method,
          water_fixed_amount: r.water_fixed_amount ? parseFloat(r.water_fixed_amount) : 0
        })),
      });

      setStep(2); // Go to review
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi tạo kỳ thanh toán', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/billing/cycles/${cycleId}/calculate`);
      setResult(res.data.data);
      showToast('Tính toán hóa đơn thành công! 🎉');
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi tính toán hóa đơn', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateReading = (idx, field, value) => {
    const copy = [...readings];
    copy[idx][field] = value;
    setReadings(copy);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container" style={{ maxWidth: 800 }}>
          <div className="page-header">
            <h1>🧾 Chốt Bill Hàng Tháng</h1>
            <p>Tính toán và tạo hóa đơn cho tất cả phòng đang thuê</p>
          </div>

          {/* Step indicator */}
          <div className="steps-container" style={{ marginBottom: '32px' }}>
            {STEPS.map((label, idx) => (
              <div key={label} className={`step-item ${idx < step ? 'completed' : idx === step ? 'active' : ''}`}>
                <div className="step-circle">
                  {idx < step ? '✓' : idx + 1}
                </div>
                <div className="step-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Step 0: Chọn kỳ */}
          {step === 0 && (
            <div className="card">
              <div className="card-title mb-16">📅 Bước 1: Chọn Kỳ Thanh Toán</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tháng</label>
                  <select className="form-select" value={cycleForm.month}
                    onChange={e => setCycleForm({ ...cycleForm, month: e.target.value })}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Năm</label>
                  <input className="form-input" type="number" value={cycleForm.year}
                    onChange={e => setCycleForm({ ...cycleForm, year: e.target.value })} />
                </div>
              </div>
              <div style={{ background: 'var(--accent-glow)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: '0.85rem', color: 'var(--accent-primary)', marginTop: '8px' }}>
                🔍 Sẽ tạo hóa đơn cho kỳ: <strong>Tháng {cycleForm.month}/{cycleForm.year}</strong> — {rooms.length} phòng đang thuê
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn btn-primary" onClick={() => setStep(1)}>
                  Tiếp Theo →
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Nhập điện */}
          {step === 1 && (
            <div className="card">
              <div className="card-title mb-16">⚡ Bước 2: Thiết Lập Điện / Nước Từng Phòng</div>
              <div className="form-row" style={{ marginBottom: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Tổng Tiền Điện Trong Tháng (VNĐ)</label>
                  <input
                    id="electricity-amount-input"
                    className="form-input"
                    type="number"
                    placeholder="VD: 1500000"
                    value={cycleForm.total_electricity_amount}
                    onChange={e => setCycleForm({ ...cycleForm, total_electricity_amount: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số phòng CHIA điện</label>
                  <input
                    id="shared-rooms-count"
                    className="form-input"
                    type="number"
                    value={cycleForm.shared_rooms_count}
                    onChange={e => setCycleForm({ ...cycleForm, shared_rooms_count: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="card-title mb-16" style={{ fontSize: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                Cấu hình tiền Điện & Nước cho từng phòng
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {readings.map((r, idx) => (
                  <div key={r.room_id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-primary)', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px' }}>
                      🏠 {r.room_name}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '24px' }}>
                      {/* Điện */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>⚡ Tiền Điện</div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <select 
                            className="form-select" 
                            style={{ flex: 1 }}
                            value={r.electricity_method}
                            onChange={e => updateReading(idx, 'electricity_method', e.target.value)}
                          >
                            <option value="flat_rate">Khoán số tiền</option>
                            <option value="shared">Chia đều theo tổng bill</option>
                          </select>
                          
                          <div style={{ flex: 1, minWidth: '120px' }}>
                            {r.electricity_method === 'flat_rate' && (
                              <input
                                className="form-input"
                                type="number"
                                placeholder="VNĐ"
                                value={r.electricity_flat_amount}
                                onChange={e => updateReading(idx, 'electricity_flat_amount', e.target.value)}
                              />
                            )}
                            {r.electricity_method === 'shared' && cycleForm.total_electricity_amount && cycleForm.shared_rooms_count > 0 && (
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                ~ {new Intl.NumberFormat('vi-VN').format(Math.round(cycleForm.total_electricity_amount / cycleForm.shared_rooms_count))} ₫
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nước */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>💧 Tiền Nước</div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <select 
                            className="form-select" 
                            style={{ flex: 1 }}
                            value={r.water_method}
                            onChange={e => updateReading(idx, 'water_method', e.target.value)}
                          >
                            <option value="free">Miễn phí (0đ)</option>
                            <option value="fixed">Cố định theo phòng</option>
                          </select>
                          
                          <div style={{ flex: 1, minWidth: '120px' }}>
                            {r.water_method === 'fixed' && (
                              <input
                                className="form-input"
                                type="number"
                                placeholder="VNĐ"
                                value={r.water_fixed_amount}
                                onChange={e => updateReading(idx, 'water_fixed_amount', e.target.value)}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                <button className="btn btn-secondary" onClick={() => setStep(0)}>← Quay Lại</button>
                <button className="btn btn-primary" onClick={handleSaveReadingsAndContinue} disabled={loading}>
                  {loading ? '⏳...' : 'Lưu Thiết Lập & Tạo Hóa Đơn →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Confirm & Calculate */}
          {step === 2 && (
            <div className="card">
              <div className="card-title mb-16">🧮 Bước 3: Xác Nhận & Tính Toán</div>

              {result ? (
                <div>
                  <div style={{
                    background: 'var(--accent-glow)',
                    border: '1px solid var(--border-active)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    textAlign: 'center',
                    marginBottom: '24px',
                  }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      Đã tạo {result.invoices_created} hóa đơn thành công!
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Kỳ thanh toán #{result.billing_cycle_id}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {result.invoices?.map((inv) => (
                      <div key={inv.invoice_id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 20px',
                        border: '1px solid var(--border-color)',
                      }}>
                        <div>
                          <span style={{ fontWeight: 700 }}>🏠 {inv.room}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                            Hóa đơn #{inv.invoice_id}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                            {new Intl.NumberFormat('vi-VN').format(inv.total)} ₫
                          </span>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => router.push(`/billing/invoice/${inv.invoice_id}`)}
                          >
                            📄 Xem Hóa Đơn
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn btn-secondary"
                    style={{ marginTop: '20px', width: '100%' }}
                    onClick={() => router.push('/invoices')}
                  >
                    📋 Xem Tất Cả Hóa Đơn
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginBottom: '24px',
                  }}>
                    {[
                      { label: 'Kỳ thanh toán', value: `Tháng ${cycleForm.month}/${cycleForm.year}` },
                      { label: 'Tổng tiền điện', value: `${new Intl.NumberFormat('vi-VN').format(cycleForm.total_electricity_amount)} ₫` },
                      { label: 'Số phòng', value: `${rooms.length} phòng` },
                      { label: 'Phòng chia điện', value: `${cycleForm.shared_rooms_count} phòng` },
                    ].map(item => (
                      <div key={item.label} style={{
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px 16px',
                      }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{item.label}</div>
                        <div style={{ fontWeight: 700 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    background: 'rgba(253, 203, 110, 0.08)',
                    border: '1px solid rgba(253, 203, 110, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    fontSize: '0.85rem',
                    color: 'var(--color-warning)',
                    marginBottom: '20px',
                  }}>
                    ⚠️ Sau khi tính toán, kỳ này sẽ được <strong>khóa (finalized)</strong>. Kiểm tra kỹ thông tin trước khi xác nhận.
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>← Quay Lại</button>
                    <button
                      id="calculate-btn"
                      className="btn btn-primary btn-lg"
                      onClick={handleCalculate}
                      disabled={loading}
                      style={{ flex: 2 }}
                    >
                      {loading ? '⏳ Đang tính toán...' : '🧮 Tính Toán & Tạo Hóa Đơn'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

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
