'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  {
    section: 'Tổng Quan',
    items: [
      { href: '/', icon: '📊', label: 'Dashboard' },
    ],
  },
  {
    section: 'Quản Lý',
    items: [
      { href: '/rooms', icon: '🏠', label: 'Phòng Trọ' },
      { href: '/tenants', icon: '👤', label: 'Khách Thuê' },
      { href: '/equipments', icon: '🛋️', label: 'Thiết Bị' },
    ],
  },
  {
    section: 'Tài Chính',
    items: [
      { href: '/billing', icon: '🧾', label: 'Chốt Bill' },
      { href: '/invoices', icon: '📄', label: 'Hóa Đơn' },
    ],
  },
  {
    section: 'Hệ Thống',
    items: [
      { href: '/settings', icon: '⚙️', label: 'Cấu Hình' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('Admin');

  useEffect(() => {
    const stored = localStorage.getItem('admin_username');
    if (stored) setUsername(stored);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin_username');
    router.push('/login');
  };

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const getPageTitle = () => {
    if (pathname === '/') return '📊 Dashboard';
    if (pathname.startsWith('/rooms')) return '🏠 Phòng Trọ';
    if (pathname.startsWith('/tenants')) return '👤 Khách Thuê';
    if (pathname.startsWith('/equipments')) return '🛋️ Thiết Bị';
    if (pathname.startsWith('/billing')) return '🧾 Chốt Bill';
    if (pathname.startsWith('/invoices')) return '📄 Hóa Đơn';
    if (pathname.startsWith('/settings')) return '⚙️ Cấu Hình';
    return '🏠 Phòng Trọ';
  };

  const SidebarContent = () => (
    <>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏠</div>
        <div className="sidebar-logo-text">
          <h2 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>Family Motel</h2>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Quản lý phòng trọ gia đình</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((section) => (
          <div key={section.section}>
            <p className="nav-section-title">{section.section}</p>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="admin-tag" style={{ background: 'transparent' }}>
          <div className="admin-avatar">Q</div>
          <div className="admin-info">
            <span style={{ color: 'var(--text-primary)' }}>Quản Trị Viên</span>
            <small style={{ color: 'var(--text-secondary)' }}>Quản trị viên</small>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="hamburger-btn" onClick={() => setIsOpen(true)} id="sidebar-toggle">
          ☰
        </button>
        <h2>{getPageTitle()}</h2>
        <div style={{ width: 40 }} />
      </header>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="main-sidebar">
        <SidebarContent />
      </aside>
    </>
  );
}
