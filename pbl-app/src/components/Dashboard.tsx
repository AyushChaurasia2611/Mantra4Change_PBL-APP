import { useMemo, useState } from 'react';
import type { SchoolRecord, FilterState } from '../utils/deterministicEngine';
import { calculateMetrics, calculateMoM, getGeoPerformance } from '../utils/deterministicEngine';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface DashboardProps {
  records: SchoolRecord[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export default function Dashboard({ records, filters, setFilters }: DashboardProps) {
  // Extract all unique districts
  const districts = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.district))).sort();
  }, [records]);

  // Extract blocks matching selected district
  const blocks = useMemo(() => {
    const filteredRecords = filters.district === 'all'
      ? records
      : records.filter((r) => r.district === filters.district);
    return Array.from(new Set(filteredRecords.map((r) => r.block))).sort();
  }, [records, filters.district]);

  // Compute metrics for current filters
  const metrics = useMemo(() => {
    return calculateMetrics(records, filters);
  }, [records, filters]);

  // Compute Month-over-Month changes
  const momParticipation = useMemo(() => {
    return calculateMoM(records, filters, (m) => m.participationPercentage, 'rate');
  }, [records, filters]);

  const momAttendance = useMemo(() => {
    return calculateMoM(records, filters, (m) => m.attendancePercentage, 'rate');
  }, [records, filters]);

  const momEvidence = useMemo(() => {
    return calculateMoM(records, filters, (m) => m.evidenceSubmissionPercentage, 'rate');
  }, [records, filters]);

  // Geographic comparison (Top and Bottom performers)
  const [geoLevel, setGeoLevel] = useState<'district' | 'block'>('block');
  
  const geoPerformers = useMemo(() => {
    return getGeoPerformance(records, filters, geoLevel);
  }, [records, filters, geoLevel]);

  const topGeos = useMemo(() => geoPerformers.slice(0, 5), [geoPerformers]);
  const bottomGeos = useMemo(() => [...geoPerformers].reverse().slice(0, 5), [geoPerformers]);

  // Event handlers
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      district: e.target.value,
      block: 'all', // Reset block when district changes
    }));
  };

  const renderTrendIndicator = (mom: ReturnType<typeof calculateMoM>) => {
    if (!mom) return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No MoM data</span>;

    const { difference } = mom;
    const absDiff = Math.abs(difference).toFixed(1);

    if (difference > 0.5) {
      return (
        <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
          <TrendingUp size={14} /> +{absDiff}% MoM
        </span>
      );
    } else if (difference < -0.5) {
      return (
        <span style={{ color: 'var(--critical)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
          <TrendingDown size={14} /> -{absDiff}% MoM
        </span>
      );
    } else {
      return (
        <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
          <Minus size={14} /> No Change
        </span>
      );
    }
  };

  const getRiskBadgeClass = (status: string) => {
    switch (status) {
      case 'On Track': return 'badge-on-track';
      case 'Behind': return 'badge-behind';
      case 'At Risk': return 'badge-at-risk';
      default: return 'badge-critical';
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            PBL Program Intelligence Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Deterministic performance review of Project-Based Learning implementation across geographies and grades.
          </p>
        </div>
      </div>

      {/* Filters panel */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '32px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Month</label>
          <select
            className="form-select"
            value={filters.month}
            onChange={(e) => setFilters((prev) => ({ ...prev, month: e.target.value }))}
            style={{ width: '130px' }}
          >
            <option value="all">All Months</option>
            <option value="2025-07">July 2025</option>
            <option value="2025-08">August 2025</option>
            <option value="2025-09">September 2025</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>District</label>
          <select
            className="form-select"
            value={filters.district}
            onChange={handleDistrictChange}
            style={{ width: '150px' }}
          >
            <option value="all">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Block</label>
          <select
            className="form-select"
            value={filters.block}
            disabled={filters.district === 'all'}
            onChange={(e) => setFilters((prev) => ({ ...prev, block: e.target.value }))}
            style={{ width: '180px', opacity: filters.district === 'all' ? 0.5 : 1 }}
          >
            <option value="all">All Blocks</option>
            {blocks.map((b) => (
              <option key={b} value={b}>{b.replace(`${filters.district} - `, '')}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Grade</label>
          <select
            className="form-select"
            value={filters.grade}
            onChange={(e) => setFilters((prev) => ({ ...prev, grade: e.target.value }))}
            style={{ width: '130px' }}
          >
            <option value="all">All Grades</option>
            <option value="6">Class 6</option>
            <option value="7">Class 7</option>
            <option value="8">Class 8</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subject</label>
          <select
            className="form-select"
            value={filters.subject}
            onChange={(e) => setFilters((prev) => ({ ...prev, subject: e.target.value }))}
            style={{ width: '150px' }}
          >
            <option value="all">All Subjects</option>
            <option value="Math">Math</option>
            <option value="Science">Science</option>
          </select>
        </div>

        {/* Reset filters */}
        <div style={{ display: 'flex', alignSelf: 'flex-end', marginLeft: 'auto' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setFilters({ month: '2025-09', district: 'all', block: 'all', grade: 'all', subject: 'all' })}
          >
            Reset to Sep 2025
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
        {/* Total Schools */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Sampled Schools
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {metrics.totalSchools}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Active schools in current filter
          </div>
        </div>

        {/* Participation Rate */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            PBL Participation
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {metrics.participationPercentage.toFixed(1)}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderTrendIndicator(momParticipation)}
          </div>
        </div>

        {/* Evidence Submission */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Evidence Submission
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {metrics.evidenceSubmissionPercentage.toFixed(1)}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderTrendIndicator(momEvidence)}
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '24px', borderLeft: '3px solid var(--primary)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            Attendance Rate
            <span className={`badge ${getRiskBadgeClass(metrics.riskStatus)}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
              {metrics.riskStatus}
            </span>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {metrics.attendancePercentage.toFixed(1)}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderTrendIndicator(momAttendance)}
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '32px', display: 'flex', gap: '12px', alignItems: 'center', borderColor: 'var(--primary-glow)', background: 'rgba(99, 102, 241, 0.03)' }}>
        <Info size={18} color="var(--primary)" />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Risk Classification Logic:</strong> On Track (&ge; 75%) | Behind (60% to 75%) | At Risk (35% to 60%) | Critical ({"< 35%"}). Classification is deterministic and based on overall attendance.
        </div>
      </div>

      {/* Performance Split Grid */}
      <div className="grid-cols-2">
        {/* Top Performers */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Highest-Performing Geographies
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Top 5 active zones ranked by overall PBL attendance rate
              </p>
            </div>
            <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '2px' }}>
              <button
                onClick={() => setGeoLevel('district')}
                style={{
                  border: 'none',
                  background: geoLevel === 'district' ? 'var(--primary)' : 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                District
              </button>
              <button
                onClick={() => setGeoLevel('block')}
                style={{
                  border: 'none',
                  background: geoLevel === 'block' ? 'var(--primary)' : 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Block
              </button>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>{geoLevel === 'district' ? 'District' : 'Block'}</th>
                <th style={{ textAlign: 'center' }}>Participation</th>
                <th style={{ textAlign: 'center' }}>Attendance</th>
                <th style={{ textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {topGeos.map((g) => (
                <tr key={g.name}>
                  <td style={{ fontWeight: 600 }}>{g.name}</td>
                  <td style={{ textAlign: 'center' }}>{g.participationPercentage.toFixed(0)}%</td>
                  <td style={{ textAlign: 'center', color: 'var(--accent)', fontWeight: 600 }}>
                    {g.attendancePercentage.toFixed(1)}%
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`badge ${getRiskBadgeClass(g.riskStatus)}`}>
                      {g.riskStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low Performers / Priority Gaps */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Low-Performing & Priority Gaps
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Bottom 5 zones requiring immediate intervention and field coaching
              </p>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>{geoLevel === 'district' ? 'District' : 'Block'}</th>
                <th style={{ textAlign: 'center' }}>Participation</th>
                <th style={{ textAlign: 'center' }}>Attendance</th>
                <th style={{ textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bottomGeos.map((g) => (
                <tr key={g.name}>
                  <td style={{ fontWeight: 600 }}>{g.name}</td>
                  <td style={{ textAlign: 'center' }}>{g.participationPercentage.toFixed(0)}%</td>
                  <td style={{ textAlign: 'center', color: 'var(--critical)', fontWeight: 600 }}>
                    {g.attendancePercentage.toFixed(1)}%
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`badge ${getRiskBadgeClass(g.riskStatus)}`}>
                      {g.riskStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
