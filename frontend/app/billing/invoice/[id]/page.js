'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import api from '@/lib/api';

export default function InvoicePage({ params }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
    fetchSettings();
  }, [id]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      const data = res.data.data;
      const flat = {};
      Object.entries(data).forEach(([k, v]) => { flat[k] = v.value; });
      setSettings(flat);
    } catch (err) {
      console.error('Lỗi lấy cấu hình thanh toán', err);
    }
  };

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/billing/invoices/${id}`);
      setInvoice(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8f9fa' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
          <p style={{ color: '#666' }}>Đang tải hóa đơn...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Không tìm thấy hóa đơn</p>
      </div>
    );
  }

  const snap = invoice.snapshot_json || {};
  const lineItems = snap.line_items || {};

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(Math.round(num || 0)) + ' ₫';

  const getElectricityDetail = () => {
    const elec = lineItems.electricity || {};
    if (elec.method === 'shared') {
      if (elec.total_electricity_amount !== undefined && elec.shared_rooms_count !== undefined) {
        return `Chia đều: ${formatVND(elec.total_electricity_amount)} / ${elec.shared_rooms_count} phòng`;
      }
      return `${elec.kwh_allocated?.toFixed(1)} KWh × ${formatVND(elec.unit_price)}`;
    }
    if (elec.method === 'flat_rate') return 'Điện khoán';
    if (elec.method === 'free') return 'Miễn phí';
    return '—';
  };

  const getWaterDetail = () => {
    const w = lineItems.water || {};
    if (w.method === 'free') return 'Miễn phí';
    if (w.method === 'fixed') {
      return w.flat_amount !== null && w.flat_amount !== undefined 
        ? `Cố định: ${formatVND(w.flat_amount)}`
        : 'Cố định/phòng';
    }
    return '—';
  };

  const rows = [
    {
      label: 'Tiền thuê phòng',
      detail: `${invoice.room_number} — ${invoice.room_name}`,
      amount: invoice.base_rent,
    },
    {
      label: 'Tiền điện',
      detail: getElectricityDetail(),
      amount: invoice.electricity_amount,
    },
    {
      label: 'Tiền nước',
      detail: getWaterDetail(),
      amount: invoice.water_amount,
    },
    {
      label: 'Tiền Wifi',
      detail: 'Cố định/phòng',
      amount: invoice.wifi_amount,
    },
    {
      label: 'Tiền Rác & Sinh hoạt',
      detail: 'Cố định/phòng',
      amount: invoice.trash_amount || 0,
    },
  ];

  if (invoice.adjustment_amount && parseFloat(invoice.adjustment_amount) !== 0) {
    rows.push({
      label: invoice.adjustment_reason || 'Điều chỉnh (Phụ thu/Giảm giá)',
      detail: 'Khoản phát sinh',
      amount: parseFloat(invoice.adjustment_amount),
    });
  }

  const qrBankCode = settings.payment_bank_code;
  const qrAccount = settings.payment_account_no;
  const qrName = settings.payment_account_name;
  let qrUrl = null;

  if (qrBankCode && qrAccount) {
    const addInfo = encodeURIComponent(`Thanh toan tien phong ${invoice.room_number || ''}`);
    const accName = encodeURIComponent(qrName || '');
    qrUrl = `https://img.vietqr.io/image/${qrBankCode}-${qrAccount}-compact2.png?amount=${invoice.total_amount}&addInfo=${addInfo}&accountName=${accName}`;
  }

  return (
    <div className="invoice-page" id="invoice-content">
      {/* Print/Back buttons — hidden when printing */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }} className="no-print">
        <button
          onClick={() => window.history.back()}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          ← Quay Lại
        </button>
        <button
          id="print-invoice-btn"
          onClick={() => window.print()}
          style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#00d4aa', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
        >
          🖨️ In / Lưu PDF
        </button>
      </div>

      {/* Invoice */}
      <div style={{ maxWidth: '680px', margin: '0 auto', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 40px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f1117, #1a1d27)', padding: '32px 36px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ fontSize: '28px' }}>🏠</div>
                <div>
                  <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'white' }}>PHÒNG TRỌ GIA ĐÌNH</h1>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', margin: 0 }}>Hóa đơn điện tử</p>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#00d4aa', lineHeight: 1 }}>HÓA ĐƠN</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '4px' }}>
                {snap.billing_period || `Tháng ${invoice.month}/${invoice.year}`}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '2px' }}>
                #{String(invoice.id).padStart(5, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {invoice.is_paid ? (
          <div style={{ padding: '12px 24px', background: 'rgba(0, 212, 170, 0.1)', color: '#00d4aa', textAlign: 'center', fontWeight: '900', letterSpacing: '4px', borderBottom: '2px dashed rgba(0, 212, 170, 0.3)' }}>
            ĐÃ THANH TOÁN
          </div>
        ) : null}

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', borderBottom: '2px solid #00d4aa' }}>
          <div style={{ padding: '20px 24px', borderRight: '1px solid #eee' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Thông Tin Phòng</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f1117' }}>{invoice.room_name}</div>
            <div style={{ color: '#555', fontSize: '0.85rem', marginTop: '2px' }}>Số phòng: {invoice.room_number}</div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Thông Tin Khách Thuê</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f1117' }}>{invoice.tenant_name}</div>
            <div style={{ color: '#555', fontSize: '0.85rem', marginTop: '2px' }}>
              {lineItems.tenant?.num_of_people || snap.tenant?.num_of_people || '—'} người ở
            </div>
          </div>
        </div>

        {/* Line Items */}
        <table className="invoice-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: '24px' }}>Khoản Thu</th>
              <th>Chi Tiết</th>
              <th style={{ textAlign: 'right', paddingRight: '24px' }}>Thành Tiền</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td style={{ paddingLeft: '24px', fontWeight: 600 }}>{row.label}</td>
                <td style={{ color: '#666', fontSize: '0.83rem' }}>{row.detail}</td>
                <td className="amount" style={{ paddingRight: '24px' }}>{formatVND(row.amount)}</td>
              </tr>
            ))}
            <tr className="invoice-total-row">
              <td style={{ paddingLeft: '24px' }} colSpan={2}>
                💰 TỔNG CỘNG PHẢI TRẢ
              </td>
              <td className="amount" style={{ paddingRight: '24px' }}>
                {formatVND(invoice.total_amount)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Payment QR */}
        {qrUrl && (
          <div style={{ padding: '24px', textAlign: 'center', borderBottom: '1px dashed #ddd', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ fontWeight: 600, marginBottom: '12px', fontSize: '0.95rem' }}>Mở App Ngân Hàng Hoặc MoMo Quét Mã Để Thanh Toán Nhanh</p>
            <img src={qrUrl} alt="Mã QR Thanh Toán" style={{ width: '280px', maxWidth: '100%', borderRadius: '12px', border: '1px solid #eee', padding: '10px' }} />
          </div>
        )}

        {/* Footer */}
        <div style={{ background: '#f8f9fa', padding: '20px 24px', textAlign: 'center' }}>
          <p style={{ color: '#999', fontSize: '0.78rem', lineHeight: 1.8 }}>
            Ngày tạo: {new Date(invoice.created_at).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            <br />
            Vui lòng thanh toán trước ngày 5 tháng sau. Cảm ơn quý khách! 🙏
          </p>
        </div>
      </div>
    </div>
  );
}
