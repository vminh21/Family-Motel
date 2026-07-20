'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';

const SETTING_LABELS = {
  wifi_fee_per_room: { label: 'Tiền Wifi / Phòng / Tháng', unit: 'VNĐ', type: 'number', desc: 'Phí cố định thu mỗi phòng hàng tháng' },
  trash_fee_per_room: { label: 'Tiền Rác & Sinh Hoạt / Phòng / Tháng', unit: 'VNĐ', type: 'number', desc: 'Phí cố định thu mỗi phòng hàng tháng' },
};

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      const data = res.data.data;
      const flat = {};
      Object.entries(data).forEach(([k, v]) => { flat[k] = v.value; });
      setForm(flat);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', form);
      setToast({ msg: 'Đã lưu cấu hình thành công!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
      fetchSettings();
    } catch (err) {
      setToast({ msg: err.response?.data?.message || 'Lỗi khi lưu', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header">
            <h1>⚙️ Cấu Hình Dịch Vụ</h1>
            <p>Thiết lập các khoản phí dịch vụ cố định và đơn giá điện nước</p>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Service Fees Section */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div className="stat-icon blue" style={{ width: 40, height: 40 }}>📶</div>
                  <div>
                    <div className="card-title">Phí Dịch Vụ Cố Định</div>
                    <div className="card-subtitle">Các khoản phí thu cố định theo từng phòng hàng tháng</div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{SETTING_LABELS.wifi_fee_per_room.label}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="setting-wifi"
                        className="form-input"
                        type="number"
                        value={form.wifi_fee_per_room || ''}
                        onChange={e => setForm({ ...form, wifi_fee_per_room: e.target.value })}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>VNĐ</span>
                    </div>
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{SETTING_LABELS.wifi_fee_per_room.desc}</small>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{SETTING_LABELS.trash_fee_per_room.label}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="setting-trash"
                        className="form-input"
                        type="number"
                        value={form.trash_fee_per_room || ''}
                        onChange={e => setForm({ ...form, trash_fee_per_room: e.target.value })}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>VNĐ</span>
                    </div>
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{SETTING_LABELS.trash_fee_per_room.desc}</small>
                  </div>
                </div>
              </div>

              {/* Electricity & Water Note Section */}
               <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="stat-icon yellow" style={{ width: 40, height: 40 }}>⚡</div>
                  <div>
                    <div className="card-title">Cấu Hình Điện / Nước</div>
                    <div className="card-subtitle" style={{ color: 'var(--text-secondary)' }}>
                      Phương thức tính điện và nước sẽ được <strong>chọn trực tiếp cho từng phòng</strong> trong quá trình Chốt Bill hàng tháng. Không cần cấu hình chung ở đây.
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment (QR Code) Section */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div className="stat-icon purple" style={{ width: 40, height: 40 }}>💰</div>
                  <div>
                    <div className="card-title">Thanh Toán / Nhận Tiền</div>
                    <div className="card-subtitle">Cấu hình ngân hàng để tự động tạo mã QR trên hoá đơn</div>
                  </div>
                </div>
                
                <div className="form-group mb-16">
                  <label className="form-label">Ngân hàng / Ví điện tử</label>
                  <select
                    className="form-select"
                    value={form.payment_bank_code || ''}
                    onChange={e => setForm({ ...form, payment_bank_code: e.target.value })}
                  >
                    <option value="">-- Chưa chọn --</option>
                    <option value="vcb">Vietcombank (VCB)</option>
                    <option value="tcb">Techcombank (TCB)</option>
                    <option value="mb">MBBank (MB)</option>
                    <option value="vpb">VPBank</option>
                    <option value="acb">ACB</option>
                    <option value="tpb">TPBank</option>
                    <option value="bidv">BIDV</option>
                    <option value="ctg">VietinBank</option>
                    <option value="vba">Agribank</option>
                    <option value="vib">VIB</option>
                    <option value="shb">SHB</option>
                    <option value="ocb">OCB</option>
                    <option value="momo">Ví MoMo</option>
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Số Tài Khoản</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="VD: 123456789"
                      value={form.payment_account_no || ''}
                      onChange={e => setForm({ ...form, payment_account_no: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tên Người Nhận (In Hoa Không Dấu)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="VD: NGUYEN VAN A"
                      value={form.payment_account_name || ''}
                      onChange={e => setForm({ ...form, payment_account_name: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
              </div>

              <button
                id="save-settings-btn"
                className="btn btn-primary btn-lg"
                onClick={handleSave}
                disabled={saving}
                style={{ alignSelf: 'flex-end', marginTop: '12px' }}
              >
                {saving ? '⏳ Đang lưu...' : '💾 Lưu Cấu Hình'}
              </button>
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
