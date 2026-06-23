import { useMemo, useState } from 'react';
import type { SchoolRecord, FilterState } from '../utils/deterministicEngine';
import { calculateMetrics, getGeoPerformance, getPreviousMonth } from '../utils/deterministicEngine';
import { FileText, Copy, Check, MessageSquare, Sparkles } from 'lucide-react';

interface MonthlySummaryProps {
  records: SchoolRecord[];
}

export default function MonthlySummary({ records }: MonthlySummaryProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('2025-09');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [copied, setCopied] = useState<boolean>(false);

  // Extract unique districts
  const districts = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.district))).sort();
  }, [records]);

  // Compute metrics for the selected summary scope
  const summaryFilters = useMemo<FilterState>(() => {
    return {
      month: selectedMonth,
      district: selectedDistrict,
      block: 'all',
      grade: 'all',
      subject: 'all',
    };
  }, [selectedMonth, selectedDistrict]);

  const metrics = useMemo(() => {
    return calculateMetrics(records, summaryFilters);
  }, [records, summaryFilters]);

  // Previous month comparison
  const prevMonth = getPreviousMonth(selectedMonth);
  const prevMetrics = useMemo(() => {
    if (!prevMonth) return null;
    return calculateMetrics(records, { ...summaryFilters, month: prevMonth });
  }, [records, summaryFilters, prevMonth]);

  // Geographies performance
  const geoBlocks = useMemo(() => {
    return getGeoPerformance(records, summaryFilters, 'block');
  }, [records, summaryFilters]);

  const criticalBlocks = useMemo(() => {
    return geoBlocks.filter((b) => b.riskStatus === 'Critical' || b.riskStatus === 'At Risk');
  }, [geoBlocks]);

  const topBlock = useMemo(() => {
    return geoBlocks.length > 0 ? geoBlocks[0] : null;
  }, [geoBlocks]);

  // Structured Summary Content Generation
  const summaryMarkdown = useMemo(() => {
    const monthName = selectedMonth === '2025-07' ? 'July 2025' : selectedMonth === '2025-08' ? 'August 2025' : 'September 2025';
    const scopeName = selectedDistrict === 'all' ? 'All Districts' : selectedDistrict;

    let momParticipationText = '';
    let momAttendanceText = '';
    if (prevMetrics) {
      const partDiff = metrics.participationPercentage - prevMetrics.participationPercentage;
      const attDiff = metrics.attendancePercentage - prevMetrics.attendancePercentage;
      
      momParticipationText = partDiff >= 0 
        ? `up by ${partDiff.toFixed(1)} percentage points MoM` 
        : `down by ${Math.abs(partDiff).toFixed(1)} percentage points MoM`;
      momAttendanceText = attDiff >= 0 
        ? `up by ${attDiff.toFixed(1)} percentage points MoM` 
        : `down by ${Math.abs(attDiff).toFixed(1)} percentage points MoM`;
    }

    const criticalList = criticalBlocks.length > 0 
      ? criticalBlocks.map((b) => `- **${b.name}**: ${b.attendancePercentage.toFixed(1)}% attendance (${b.riskStatus})`).join('\n')
      : '- No blocks are currently classified as Critical or At Risk.';

    return `# PBL Implementation Review Summary - ${monthName} (${scopeName})
Status: **${metrics.riskStatus}** (Attendance: ${metrics.attendancePercentage.toFixed(1)}%)

## 1. Key Achievements
- **Participation**: **${metrics.participationPercentage.toFixed(1)}%** of schools conducted the PBL project (${metrics.participatingSchools} out of ${metrics.totalSchools} schools). ${prevMetrics ? `This is ${momParticipationText}.` : ''}
- **Evidence Submission**: **${metrics.evidenceSubmissionPercentage.toFixed(1)}%** of participating schools successfully uploaded project evidence (${metrics.submittingEvidenceSchools} schools).
- **Total Enrollment Reached**: **${metrics.totalEnrollment.toLocaleString()}** students across Class 6-8.

## 2. Risk Areas & Priority Gaps
- **Overall Attendance**: Student attendance during PBL sessions averaged **${metrics.attendancePercentage.toFixed(1)}%** ${prevMetrics ? `(${momAttendanceText}).` : ''}
- **Critical & At Risk Geographies**:
${criticalList}

## 3. Review Meeting Discussion Points
1. **Spotlight Success**: Block **${topBlock ? topBlock.name : 'N/A'}** is leading with **${topBlock ? topBlock.attendancePercentage.toFixed(1) : 0}%** student attendance. What coaching practices can we replicate from here?
2. **Attendance Interventions**: For blocks showing Critical status (below 35% attendance), how are field facilitators tracking session clashes?
3. **Evidence Upload Compliance**: There is a gap between completion (${metrics.participationPercentage.toFixed(0)}%) and evidence upload (${metrics.overallEvidencePercentage.toFixed(0)}% of total). We need to review cell connectivity issues or portal access.`;
  }, [selectedMonth, selectedDistrict, metrics, prevMetrics, criticalBlocks, topBlock]);

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Monthly Review Summary Generator
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Automatically assemble structured review notes, MoM indicators, and meeting discussion prompts from raw inputs.
        </p>
      </div>

      {/* Control Strip */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Review Month:</span>
          <select
            className="form-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="2025-07">July 2025</option>
            <option value="2025-08">August 2025</option>
            <option value="2025-09">September 2025</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Scope:</span>
          <select
            className="form-select"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="all">All Districts (Program-wide)</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleCopy}
          style={{ marginLeft: 'auto' }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied Summary' : 'Copy Markdown Report'}
        </button>
      </div>

      {/* Main Review Summary Panels */}
      <div className="grid-cols-12">
        {/* Rendered Summary Column */}
        <div className="glass-panel" style={{ gridColumn: 'span 7', padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
            <FileText size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Draft Program Review Summary</h3>
            <span
              className={`badge ${
                metrics.riskStatus === 'On Track' ? 'badge-on-track' :
                metrics.riskStatus === 'Behind' ? 'badge-behind' :
                metrics.riskStatus === 'At Risk' ? 'badge-at-risk' : 'badge-critical'
              }`}
              style={{ marginLeft: 'auto' }}
            >
              {metrics.riskStatus}
            </span>
          </div>

          <div className="markdown-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.6 }}>
            <div>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Achievements</h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>PBL Participation:</strong> {metrics.participationPercentage.toFixed(1)}% of schools conducted the project ({metrics.participatingSchools} out of {metrics.totalSchools} schools).
                  {prevMetrics && (
                    <span style={{ marginLeft: '6px', color: metrics.participationPercentage >= prevMetrics.participationPercentage ? 'var(--success)' : 'var(--critical)' }}>
                      ({metrics.participationPercentage >= prevMetrics.participationPercentage ? '↑' : '↓'} {(metrics.participationPercentage - prevMetrics.participationPercentage).toFixed(1)}% MoM)
                    </span>
                  )}
                </li>
                <li>
                  <strong>Evidence Upload:</strong> {metrics.evidenceSubmissionPercentage.toFixed(1)}% of participating schools submitted evidence files ({metrics.submittingEvidenceSchools} schools).
                </li>
                <li>
                  <strong>Student Reach:</strong> {metrics.totalEnrollment.toLocaleString()} students engaged across classes 6-8.
                </li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority Gaps & Risks</h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>Average Attendance:</strong> {metrics.attendancePercentage.toFixed(1)}% average PBL student attendance.
                  {prevMetrics && (
                    <span style={{ marginLeft: '6px', color: metrics.attendancePercentage >= prevMetrics.attendancePercentage ? 'var(--success)' : 'var(--critical)' }}>
                      ({metrics.attendancePercentage >= prevMetrics.attendancePercentage ? '↑' : '↓'} {(metrics.attendancePercentage - prevMetrics.attendancePercentage).toFixed(1)}% MoM)
                    </span>
                  )}
                </li>
                <li>
                  <strong>Low Performing Blocks:</strong> {criticalBlocks.length > 0 ? `${criticalBlocks.length} blocks are in warning states:` : 'No blocks in warning states.'}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {criticalBlocks.slice(0, 3).map((b) => (
                      <span key={b.name} className="badge badge-critical" style={{ fontSize: '0.7rem' }}>
                        {b.name.split(' - ')[1]}: {b.attendancePercentage.toFixed(1)}%
                      </span>
                    ))}
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Discussion prompts panel */}
        <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(99, 102, 241, 0.02)', borderColor: 'var(--primary-glow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <MessageSquare size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Review Discussion Prompts</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', borderLeft: '3px solid var(--primary)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  PROMPT 1: attendance gaps
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  "Block <strong>{criticalBlocks.length > 0 ? criticalBlocks[0].name.split(' - ')[1] : 'N/A'}</strong> has critical attendance rates. Faciltators should review if session schedules conflicted with examinations."
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', borderLeft: '3px solid var(--accent)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  PROMPT 2: evidence upload compliance
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  "PBL completed by {metrics.participationPercentage.toFixed(0)}% schools, but evidence is submitted by only {metrics.overallEvidencePercentage.toFixed(0)}%. Let's detail action plans to troubleshoot photo uploads."
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', borderLeft: '3px solid var(--success)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  PROMPT 3: success spotlights
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  "Spotlight success in Block <strong>{topBlock ? topBlock.name.split(' - ')[1] : 'N/A'}</strong> with {topBlock ? topBlock.attendancePercentage.toFixed(1) : 0}% student attendance. Let's record their school mentoring process."
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Sparkles size={24} color="var(--accent)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>Copy-Ready Summary</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Perfect for pasting directly into meeting minutes, emails, or WhatsApp updates.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
