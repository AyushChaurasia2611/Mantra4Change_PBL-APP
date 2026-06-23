import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { CheckSquare, Plus, User, Calendar, Tag, AlertCircle, CheckCircle2, Play } from 'lucide-react';

export interface ProgramAction {
  id: string;
  description: string;
  owner: string;
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  linkedMetric: string;
}

export default function ActionsTracker() {
  const [actions, setActions] = useState<ProgramAction[]>([
    {
      id: 'ACT_01',
      description: 'Run field coaching session for math mentors in District D - Block 010 to troubleshoot low attendance.',
      owner: 'Anoop (District Lead)',
      priority: 'Urgent',
      dueDate: '2025-10-05',
      status: 'In Progress',
      linkedMetric: 'Attendance Rate (5.9%)',
    },
    {
      id: 'ACT_02',
      description: 'Deploy network assistance visits to schools in District E - Block 014 to resolve image portal connection failures.',
      owner: 'M&E Specialist',
      priority: 'High',
      dueDate: '2025-10-10',
      status: 'Pending',
      linkedMetric: 'Evidence Upload Rate (54.5%)',
    },
    {
      id: 'ACT_03',
      description: 'Audit Learning Support Grant AA facilitator orientation budget utilization line items.',
      owner: 'Operations Manager',
      priority: 'Medium',
      dueDate: '2025-10-15',
      status: 'Pending',
      linkedMetric: 'Budget Utilization (81.2%)',
    },
    {
      id: 'ACT_04',
      description: 'Publish spotlight write-up for District C Block 007 success in achieving 83.8% attendance rate.',
      owner: 'Communications Lead',
      priority: 'Low',
      dueDate: '2025-09-30',
      status: 'Completed',
      linkedMetric: 'Success Spotlight',
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low' | 'Urgent'>('Medium');
  const [newMetric, setNewMetric] = useState('');
  const [newDate, setNewDate] = useState('2025-10-20');

  const handleStatusChange = (id: string, newStatus: ProgramAction['status']) => {
    setActions((prev) =>
      prev.map((act) => (act.id === id ? { ...act, status: newStatus } : act))
    );
  };

  const handleAddAction = (e: FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim() || !newOwner.trim()) return;

    const newAction: ProgramAction = {
      id: `ACT_${Date.now().toString().slice(-4)}`,
      description: newDesc,
      owner: newOwner,
      priority: newPriority,
      dueDate: newDate,
      status: 'Pending',
      linkedMetric: newMetric || 'General Program Improvement',
    };

    setActions((prev) => [newAction, ...prev]);
    setShowAddForm(false);
    setNewDesc('');
    setNewOwner('');
    setNewPriority('Medium');
    setNewMetric('');
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'badge-critical';
      case 'High': return 'badge-at-risk';
      case 'Medium': return 'badge-behind';
      default: return 'badge-on-track';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 size={16} color="var(--success)" />;
      case 'In Progress': return <Play size={16} color="var(--accent)" />;
      default: return <AlertCircle size={16} color="var(--warning)" />;
    }
  };

  // Summarize action cards
  const summary = useMemo(() => {
    const completed = actions.filter((a) => a.status === 'Completed').length;
    const progress = actions.filter((a) => a.status === 'In Progress').length;
    const pending = actions.filter((a) => a.status === 'Pending').length;
    return { completed, progress, pending };
  }, [actions]);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Action Trackers & Next Steps
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Review, allocate, and record actions targeting priority gaps identified in the review dashboards.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={16} />
          Create Custom Action
        </button>
      </div>

      {/* Action Stats Panel */}
      <div className="grid-cols-3" style={{ marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--warning-bg)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
            <AlertCircle size={20} color="var(--warning)" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{summary.pending}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Intervention</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--behind-bg)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
            <Play size={18} color="var(--behind)" style={{ marginLeft: '2px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{summary.progress}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>In Development</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--success-bg)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{summary.completed}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Interventions Resolved</div>
          </div>
        </div>
      </div>

      {/* Main Actions List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
          <CheckSquare size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Recommended Field Action Items</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {actions.map((act) => (
            <div
              key={act.id}
              className="glass-panel"
              style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.01)',
                borderColor: act.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : 'var(--card-border)',
                transition: 'all 0.2s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '75%' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, color: act.status === 'Completed' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: act.status === 'Completed' ? 'line-through' : 'none' }}>
                  {act.description}
                </div>
                
                {/* Meta details row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={12} /> Owner: <strong style={{ color: 'var(--text-secondary)' }}>{act.owner}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={12} /> Due: <strong style={{ color: 'var(--text-secondary)' }}>{act.dueDate}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={12} /> Linked: <strong style={{ color: 'var(--accent)' }}>{act.linkedMetric}</strong>
                  </span>
                </div>
              </div>

              {/* Status control side */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={`badge ${getPriorityBadgeClass(act.priority)}`} style={{ fontSize: '0.65rem' }}>
                  {act.priority}
                </span>

                <div style={{ position: 'relative' }}>
                  <select
                    className="form-select"
                    value={act.status}
                    onChange={(e) => handleStatusChange(act.id, e.target.value as ProgramAction['status'])}
                    style={{
                      padding: '6px 12px 6px 28px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: 'var(--bg-tertiary)'
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    {getStatusIcon(act.status)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Creation Modal Form */}
      {showAddForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <form
            onSubmit={handleAddAction}
            className="glass-panel animate-fade-in"
            style={{ width: '500px', padding: '32px', background: 'var(--bg-secondary)' }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
              Create Custom Action Item
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the follow-up task..."
                  required
                  style={{ resize: 'none', padding: '10px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Owner</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="e.g. District Lead"
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Priority</label>
                  <select
                    className="form-select"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Linked Metric / Gap</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newMetric}
                    onChange={(e) => setNewMetric(e.target.value)}
                    placeholder="e.g. Attendance Rate"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Action
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
