'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-theme');
      setIsDark(true);
    }
    
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsRes, invoicesRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/billing/invoices')
      ]);
      setRooms(roomsRes.data.data);
      setInvoices(invoicesRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const isDarkMode = document.body.classList.toggle('dark-theme');
    setIsDark(isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  };

  const formatCurrency = (num) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // Thống kê phòng
  const occupiedRooms = rooms.filter(r => r.status === 'occupied');
  const occupiedCount = occupiedRooms.length;
  const vacantCount = rooms.length - occupiedCount;
  const totalTenants = occupiedRooms.reduce((sum, r) => sum + (r.tenant_id ? 1 : 0), 0); // Đếm tương đối

  // Thống kê tài chính
  const currentMonthInvoices = invoices.filter(inv => inv.month === currentMonth && inv.year === currentYear);
  const totalExpectedThisMonth = currentMonthInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
  const totalCollectedThisMonth = currentMonthInvoices.filter(inv => inv.is_paid).reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
  const collectionRate = totalExpectedThisMonth ? (totalCollectedThisMonth / totalExpectedThisMonth) * 100 : 0;

  const unpaidInvoices = invoices.filter(inv => !inv.is_paid);
  const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
  
  const allTimeCollected = invoices.filter(inv => inv.is_paid).reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);

  // Dữ liệu biểu đồ 6 tháng
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    return { 
      month: d.getMonth() + 1, 
      year: d.getFullYear(), 
      name: `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`, 
      "Doanh thu": 0 
    };
  });

  invoices.forEach(inv => {
    if (inv.is_paid) {
      const match = last6Months.find(m => m.month == inv.month && m.year == inv.year);
      if (match) match["Doanh thu"] += parseFloat(inv.total_amount || 0);
    }
  });

  // Hóa đơn
  const recentPaidInvoices = invoices.filter(inv => inv.is_paid).slice(0, 5);
  const debtInvoices = unpaidInvoices.slice(0, 5);

  const currentDateStr = today.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' });

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Tổng Quan</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>{currentDateStr}</p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn btn-primary" onClick={() => router.push('/billing')}>
                🧾 Chốt Bill
              </button>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-surface)', padding: '8px 20px', borderRadius: '30px', boxShadow: 'var(--shadow-card)' }}>
                <span onClick={toggleTheme} style={{ cursor: 'pointer', fontSize: '18px' }} title="Đổi giao diện">
                  {isDark ? '☀️' : '🌙'}
                </span>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>AD</div>
              </div>
            </div>
          </div>

          {loading ? (
             <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />
          ) : (
            <>
              {/* TOP STATS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>DOANH THU THÁNG {currentMonth}</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(totalExpectedThisMonth)}</div>
                    </div>
                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#eaf4ff', color: '#3965ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💵</div>
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Đã thu: {formatCurrency(totalCollectedThisMonth)}</span>
                      <span style={{ color: '#05cd99' }}>{collectionRate.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${collectionRate}%`, height: '100%', background: '#05cd99', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>CÔNG NỢ HIỆN TẠI</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#EE5D50' }}>{formatCurrency(totalDebt)}</div>
                    </div>
                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#ffe4e1', color: '#EE5D50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🚨</div>
                  </div>
                  <div style={{ marginTop: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{unpaidInvoices.length}</strong> hóa đơn chưa thanh toán
                  </div>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>TÌNH TRẠNG PHÒNG</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{occupiedCount} / {rooms.length}</div>
                    </div>
                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#f4f7fe', color: '#5c6bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🏠</div>
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                    <span style={{ padding: '4px 10px', background: '#eafbf3', color: '#05cd99', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>{vacantCount} trống</span>
                    <span style={{ padding: '4px 10px', background: '#f4f7fe', color: '#5c6bfa', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>~ {totalTenants} khách</span>
                  </div>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>TỔNG TÀI SẢN (ALL-TIME)</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(allTimeCollected)}</div>
                    </div>
                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#fff9e6', color: '#ffb547', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💎</div>
                  </div>
                  <div style={{ marginTop: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                    Đã bao gồm tất cả các kỳ thanh toán
                  </div>
                </div>
              </div>

              {/* CHART & LISTS */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                
                {/* RECHARTS AREA CHART */}
                <div className="card">
                  <div className="card-title" style={{ marginBottom: '24px' }}>📈 Dòng Tiền 6 Tháng Qua</div>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={last6Months} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5c6bfa" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#5c6bfa" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} tickFormatter={(val) => `${val/1000000}M`} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <Tooltip 
                          formatter={(value) => formatCurrency(value)}
                          contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-card)', color: 'var(--text-primary)' }}
                          itemStyle={{ color: '#5c6bfa', fontWeight: 700 }}
                        />
                        <Area type="monotone" dataKey="Doanh thu" stroke="#5c6bfa" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* ALERT DEBT LIST */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <span>🚨 Cần Thu Tiền</span>
                    <span style={{ fontSize: '0.75rem', background: '#ffe4e1', color: '#EE5D50', padding: '2px 8px', borderRadius: '12px' }}>{debtInvoices.length} phòng</span>
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {debtInvoices.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>Không có khoản nợ nào! 🎉</div>
                    ) : (
                      debtInvoices.map(inv => (
                        <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inv.room_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Kỳ {inv.month}/{inv.year}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: '#EE5D50' }}>{formatCurrency(inv.total_amount)}</div>
                            <div style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#5c6bfa', fontWeight: 600 }} onClick={() => router.push('/invoices')}>Thu ngay &rarr;</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button className="btn btn-secondary" style={{ marginTop: '16px', width: '100%' }} onClick={() => router.push('/invoices')}>
                    Xem tất cả công nợ
                  </button>
                </div>
              </div>

              {/* RECENT PAID */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: '20px' }}>🕒 Giao Dịch Gần Đây</div>
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                  <table className="table" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <thead>
                      <tr>
                        <th style={{ color: 'var(--text-secondary)', padding: '16px 8px' }}>Phòng</th>
                        <th style={{ color: 'var(--text-secondary)', padding: '16px 8px' }}>Kỳ Thanh Toán</th>
                        <th style={{ color: 'var(--text-secondary)', padding: '16px 8px' }}>Tổng Tiền</th>
                        <th style={{ color: 'var(--text-secondary)', padding: '16px 8px' }}>Ngày Thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPaidInvoices.map((row) => (
                        <tr key={row.id}>
                          <td style={{ padding: '16px 8px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#05cd99' }}></div>
                              {row.room_name}
                            </div>
                          </td>
                          <td style={{ padding: '16px 8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tháng {row.month}/{row.year}</td>
                          <td style={{ padding: '16px 8px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(row.total_amount)}</td>
                          <td style={{ padding: '16px 8px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {row.payment_date ? new Date(row.payment_date).toLocaleDateString('vi-VN') : '—'}
                          </td>
                        </tr>
                      ))}
                      {recentPaidInvoices.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Chưa có giao dịch thanh toán nào</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
