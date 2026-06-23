import { LayoutDashboard, FileText, Gift, CheckSquare, GraduationCap } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function Sidebar({ currentTab, setCurrentTab }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Program Dashboard', icon: LayoutDashboard },
    { id: 'summary', label: 'Review Summary', icon: FileText },
    { id: 'grant', label: 'Grant Assistant', icon: Gift },
    { id: 'actions', label: 'Actions Tracker', icon: CheckSquare },
  ];

  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px var(--primary-glow)'
        }}>
          <GraduationCap size={24} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Mantra4Change
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            PBL INTELLIGENCE
          </span>
        </div>
      </div>

      <nav style={{ flexGrow: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`nav-link ${currentTab === item.id ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div style={{
        marginTop: 'auto',
        padding: '16px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: '1px solid var(--card-border)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          Assessment Mode
        </div>
        <div>Synthetic school & grant data loaded locally.</div>
      </div>
    </aside>
  );
}
