'use client';
import { useState } from 'react';
import { useAuth } from '@/app/providers';
import { DashboardView } from './Dashboard';
import { SuppliersView } from './Suppliers';
import { PaymentView } from './PaymentCenter';
import { TransactionsView } from './Transactions';
import { NotificationsView } from './Notifications';
import { SettingsView } from './Settings';

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: '◉' },
  { id: 'suppliers', label: 'Suppliers', icon: '◈' },
  { id: 'pay', label: 'Pay Now', icon: '◎' },
  { id: 'transactions', label: 'Transactions', icon: '◇' },
  { id: 'notifications', label: 'Notifications', icon: '◊' },
  { id: 'settings', label: 'Settings', icon: '○' },
];

export function AppShell() {
  const { business, logout } = useAuth();
  const [active, setActive] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const renderPage = () => {
    switch (active) {
      case 'dashboard': return <DashboardView onNavigate={setActive} />;
      case 'suppliers': return <SuppliersView />;
      case 'pay': return <PaymentView />;
      case 'transactions': return <TransactionsView />;
      case 'notifications': return <NotificationsView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView onNavigate={setActive} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: collapsed ? 64 : 220,
        background: '#14151e',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
      }}>
        {/* logo */}
        <div style={{
          padding: collapsed ? '16px 0' : '20px 24px',
          textAlign: collapsed ? 'center' : 'left',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          {collapsed ? (
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>A</div>
          ) : (
            <>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, letterSpacing: '-0.03em' }}>Arvitta</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Payment Platform</div>
            </>
          )}
        </div>

        {/* collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          alignSelf: collapsed ? 'center' : 'flex-end',
          margin: collapsed ? '10px 0' : '8px 14px',
          padding: '4px 8px', background: 'rgba(255,255,255,0.06)',
          border: 'none', borderRadius: 6, color: 'rgba(255,255,255,0.35)',
          cursor: 'pointer', fontSize: 12, lineHeight: 1, fontFamily: 'inherit',
        }}>
          {collapsed ? '▸' : '◂'}
        </button>

        {/* nav */}
        <nav style={{
          flex: 1, padding: collapsed ? '4px 0' : '8px 12px',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {pages.map(p => {
            const isActive = active === p.id;
            return (
              <button key={p.id} onClick={() => setActive(p.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 0' : '9px 12px',
                border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                justifyContent: collapsed ? 'center' : 'flex-start',
                transition: 'all 0.1s',
              }}>
                <span style={{ fontSize: collapsed ? 15 : 13, lineHeight: 1 }}>{p.icon}</span>
                {!collapsed && <span>{p.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* user */}
        <div style={{
          padding: collapsed ? '10px 0' : '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600,
          }}>
            {business?.name?.charAt(0) || '?'}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{
                color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {business?.name || 'User'}
              </div>
              <button onClick={logout} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)',
                fontSize: 10, cursor: 'pointer', padding: 0, fontFamily: 'inherit',
              }}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      <main style={{
        marginLeft: collapsed ? 64 : 220,
        flex: 1, transition: 'margin-left 0.2s',
        minHeight: '100vh',
      }}>
        {renderPage()}
      </main>
    </div>
  );
}
