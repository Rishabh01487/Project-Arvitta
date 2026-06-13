import React from 'react';
import '../designSystem.css';
import { DashboardWidget } from '../components/DashboardWidget';

export default function DashboardPage() {
  return (
    <section className="card" style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
      <h2 className="heading text-2xl mb-4">Business Dashboard</h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <DashboardWidget title="Users" value={1245} icon={<span>👥</span>} />
        <DashboardWidget title="Revenue" value="₹23K" icon={<span>💰</span>} />
        <DashboardWidget title="Growth" value="12%" icon={<span>📈</span>} />
      </div>
    </section>
  );
}
