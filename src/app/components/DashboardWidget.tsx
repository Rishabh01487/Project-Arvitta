import React from 'react';
import '../designSystem.css';

interface DashboardWidgetProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({ title, value, icon }) => (
  <div className="card" style={{ width: '200px', textAlign: 'center' }}>
    {icon && <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>}
    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent)' }}>{title}</h3>
    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{value}</p>
  </div>
);
