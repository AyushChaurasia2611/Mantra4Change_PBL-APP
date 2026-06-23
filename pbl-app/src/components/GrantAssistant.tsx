import { useState, useMemo } from 'react';
import { Sparkles, FileText, Landmark, Award, Image, Copy, Check, HelpCircle } from 'lucide-react';

export interface GrantFinance {
  grantId: string;
  donor: string;
  grantName: string;
  periodStart: string;
  periodEnd: string;
  coveredDistricts: string;
  reportingMonth: string;
  budgetLine: string;
  approvedBudgetUnits: number;
  monthlyUtilizedUnits: number;
  cumulativeUtilizedUnits: number;
  cumulativeUtilizationRate: number;
  financeNote: string;
}

export interface GrantPerformance {
  grantId: string;
  donor: string;
  grantName: string;
  reportingMonth: string;
  periodEndDate: string;
  reportDueDate: string;
  reportStatus: string;
  coveredDistricts: string;
  sampledSchoolRecords: number;
  schoolsCompletedPbl: number;
  pblCompletionRate: number;
  schoolsWithEvidence: number;
  evidenceSubmissionRate: number;
  totalEnrollment: number;
  totalAttendance: number;
  attendanceRate: number;
  riskStatus: string;
  milestoneSummary: string;
  draftReportText: string;
}

export interface EvidenceMedia {
  recordId: string;
  recordType: string;
  grantId: string;
  donor: string;
  reportingMonth: string;
  district: string;
  title: string;
  caption: string;
  fileName: string;
  relativePath: string;
  usageNote: string;
}

interface GrantAssistantProps {
  finances: GrantFinance[];
  performance: GrantPerformance[];
  mediaIndex: EvidenceMedia[];
}

export default function GrantAssistant({ finances, performance, mediaIndex }: GrantAssistantProps) {
  const [selectedGrant, setSelectedGrant] = useState<string>('GRANT_AA_2025');
  const [selectedMonth, setSelectedMonth] = useState<string>('2025-09');
  
  // AI Options
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [aiError, setAiError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [hoveredCitation, setHoveredCitation] = useState<string | null>(null);

  // Get unique grants for the selector
  const grantsList = useMemo(() => {
    const map = new Map<string, string>();
    performance.forEach((p) => {
      map.set(p.grantId, p.grantName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [performance]);

  // Filters
  const activeFinance = useMemo(() => {
    return finances.filter((f) => f.grantId === selectedGrant && f.reportingMonth === selectedMonth);
  }, [finances, selectedGrant, selectedMonth]);

  const activePerformance = useMemo(() => {
    return performance.find((p) => p.grantId === selectedGrant && p.reportingMonth === selectedMonth);
  }, [performance, selectedGrant, selectedMonth]);

  const activeMedia = useMemo(() => {
    return mediaIndex.filter((m) => m.grantId === selectedGrant && m.reportingMonth === selectedMonth);
  }, [mediaIndex, selectedGrant, selectedMonth]);

  // Summarize financial totals
  const financeSummary = useMemo(() => {
    let budgetTotal = 0;
    let utilizedMonthlyTotal = 0;
    let utilizedCumulativeTotal = 0;
    
    activeFinance.forEach((f) => {
      budgetTotal += f.approvedBudgetUnits || 0;
      utilizedMonthlyTotal += f.monthlyUtilizedUnits || 0;
      utilizedCumulativeTotal += f.cumulativeUtilizedUnits || 0;
    });

    const rate = budgetTotal > 0 ? (utilizedCumulativeTotal / budgetTotal) * 100 : 0;

    return {
      budgetTotal,
      utilizedMonthlyTotal,
      utilizedCumulativeTotal,
      rate,
    };
  }, [activeFinance]);

  // Generate grounded report narrative
  const handleGenerateReport = async () => {
    if (!activePerformance) return;
    
    setIsGenerating(true);
    setAiError('');
    
    const outcomeFacts = {
      grantName: activePerformance.grantName,
      month: selectedMonth,
      completionRate: (activePerformance.pblCompletionRate * 100).toFixed(1),
      completedSchools: activePerformance.schoolsCompletedPbl,
      totalSchools: activePerformance.sampledSchoolRecords,
      evidenceRate: (activePerformance.evidenceSubmissionRate * 100).toFixed(1),
      evidenceSchools: activePerformance.schoolsWithEvidence,
      attendanceRate: (activePerformance.attendanceRate * 100).toFixed(1),
      enrollment: activePerformance.totalEnrollment.toLocaleString(),
      attendanceCount: activePerformance.totalAttendance.toLocaleString(),
      districts: activePerformance.coveredDistricts,
      milestones: activePerformance.milestoneSummary,
      utilizationRate: financeSummary.rate.toFixed(1),
      utilizedUnits: financeSummary.utilizedCumulativeTotal,
      totalBudget: financeSummary.budgetTotal,
    };

    // If API Key is provided, attempt client-side generation using OpenRouter API (Gemini model)
    if (apiKey.trim() !== '') {
      try {
        const response = await fetch(
          `https://openrouter.ai/api/v1/chat/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': 'http://localhost:5173',
              'X-Title': 'PBL Program Intelligence Assistant'
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'user',
                  content: `Write a professional grant report section for "${outcomeFacts.grantName}" during the month of ${outcomeFacts.month}. 
                  The report must be strictly grounded in the following computed facts and contain references/citations for each fact using bracketed numbers e.g. [1], [2] to cross-reference the source facts.
                  
                  FACTS:
                  [1] PBL Completion Rate: ${outcomeFacts.completionRate}% (${outcomeFacts.completedSchools} out of ${outcomeFacts.totalSchools} schools completed).
                  [2] Evidence Submission Rate: ${outcomeFacts.evidenceRate}% of schools (${outcomeFacts.evidenceSchools} schools).
                  [3] Overall Student Attendance: ${outcomeFacts.attendanceRate}% (Total enrollment: ${outcomeFacts.enrollment}, sessions attended: ${outcomeFacts.attendanceCount}).
                  [4] Covered Districts: ${outcomeFacts.districts}.
                  [5] Milestones: ${outcomeFacts.milestones}.
                  [6] Financial Utilization: ${outcomeFacts.utilizationRate}% of budget used (${outcomeFacts.utilizedUnits} utilized out of ${outcomeFacts.totalBudget} total units).
                  
                  Format the response in Clean Markdown with headings:
                  - Executive Summary
                  - Program Accomplishments
                  - Financial Utilization & Operations
                  - Next Actions & Intervention Plans
                  
                  Rules: Avoid any hallucination. Cite every fact using its matching number [1]-[6].`
                }
              ]
            })
          }
        );

        if (!response.ok) {
          let errMsg = `OpenRouter API returned status ${response.status}`;
          try {
            const errData = await response.json();
            if (errData && errData.error && errData.error.message) {
              errMsg += `: ${errData.error.message}`;
            } else if (errData && typeof errData === 'object') {
              errMsg += `: ${JSON.stringify(errData)}`;
            }
          } catch (e) {
            // Ignore parse error
          }
          throw new Error(errMsg);
        }

        const resData = await response.json();
        const generatedText = resData.choices?.[0]?.message?.content;
        
        if (generatedText) {
          setGeneratedReport(generatedText);
          setIsGenerating(false);
          return;
        } else {
          throw new Error('Failed to retrieve generated content from response structure.');
        }
      } catch (err: any) {
        console.error(err);
        setAiError(`API Error: ${err.message || 'Unknown error'}. Falling back to deterministic rule-based writer.`);
      }
    }

    // Default: Grounded deterministic rule-based composer that simulates AI with exact citations
    setTimeout(() => {
      const generatedTemplate = `### Executive Summary
During the month of **${selectedMonth}**, the **${outcomeFacts.grantName}** program was actively deployed across **${outcomeFacts.districts}** [4]. The program recorded a status of **${activePerformance.riskStatus}**, driven by stable implementation outputs and an overall cumulative financial utilization of **${outcomeFacts.utilizationRate}%** [6].

### Program Accomplishments & Evidence
1. **Classroom Implementation**: A total of **${outcomeFacts.completedSchools} schools** completed their scheduled PBL cycles [1], resulting in an implementation completion rate of **${outcomeFacts.completionRate}%** [1] out of a total target of **${outcomeFacts.totalSchools}** schools.
2. **Evidence Collection**: Photographic and lesson-plan evidence was successfully submitted by **${outcomeFacts.evidenceSchools} schools** [2], representing an evidence submission rate of **${outcomeFacts.evidenceRate}%** [2] of participating schools. 
3. **Student Reach**: The curriculum reached **${outcomeFacts.enrollment} enrolled students** [3]. Across Math and Science sessions, actual student attendance logs recorded **${outcomeFacts.attendanceCount} session participations** [3], leading to an overall PBL attendance rate of **${outcomeFacts.attendanceRate}%** [3].

### Financial & Operational Performance
Cumulatively, the program has utilized **${outcomeFacts.utilizedUnits} budget units** [6] out of the total approved **${outcomeFacts.totalBudget} budget units** [6] allocated under the current cycle. Core operations are aligned with project milestones:
- *Milestone Check*: ${outcomeFacts.milestones} [5]

### Action Plan
For areas classified as warning states, facilitators are scheduled for targeted field interventions to improve student session-level attendance.`;
      
      setGeneratedReport(generatedTemplate);
      setIsGenerating(false);
    }, 800);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReport || activePerformance?.draftReportText || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Setup citation descriptions
  const getCitationTooltip = (citation: string): string => {
    switch (citation) {
      case '1': return `PBL Completion Rate: ${activePerformance ? (activePerformance.pblCompletionRate * 100).toFixed(1) : 0}% (${activePerformance?.schoolsCompletedPbl}/${activePerformance?.sampledSchoolRecords} schools)`;
      case '2': return `Evidence Uploads: ${activePerformance ? (activePerformance.evidenceSubmissionRate * 100).toFixed(1) : 0}% (${activePerformance?.schoolsWithEvidence} schools)`;
      case '3': return `Attendance Record: ${activePerformance ? (activePerformance.attendanceRate * 100).toFixed(1) : 0}% (${activePerformance?.totalAttendance?.toLocaleString()} out of ${(Number(activePerformance?.totalEnrollment || 0) * 2).toLocaleString()} slot-attendances)`;
      case '4': return `Geography Reach: Covers districts [${activePerformance?.coveredDistricts}]`;
      case '5': return `Milestone Outcomes: ${activePerformance?.milestoneSummary}`;
      case '6': return `Finance Utilization: ${financeSummary.rate.toFixed(1)}% (${financeSummary.utilizedCumulativeTotal}/${financeSummary.budgetTotal} units utilized)`;
      default: return 'Grounded programmatic fact source.';
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Grant Reporting & Evidence Assistant
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Compile verified donor section reports with financial sheets, performance audits, and synthetic field evidence.
        </p>
      </div>

      {/* Selectors panel */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Select Grant:</span>
          <select
            className="form-select"
            value={selectedGrant}
            onChange={(e) => setSelectedGrant(e.target.value)}
            style={{ width: '250px' }}
          >
            {grantsList.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Reporting Month:</span>
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

        {activePerformance && (
          <span className={`badge ${
            activePerformance.riskStatus === 'On Track' ? 'badge-on-track' :
            activePerformance.riskStatus === 'Behind' ? 'badge-behind' :
            activePerformance.riskStatus === 'At Risk' ? 'badge-at-risk' : 'badge-critical'
          }`} style={{ marginLeft: 'auto' }}>
            Overall Status: {activePerformance.riskStatus}
          </span>
        )}
      </div>

      {/* Outer Layout Columns */}
      <div className="grid-cols-12" style={{ marginBottom: '32px' }}>
        
        {/* Left Side: Audited Facts & Utilization Sheets */}
        <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Performance Audit Panel */}
          {activePerformance ? (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Award size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Performance Outcome Audit</h3>
              </div>
              <div className="grid-cols-3" style={{ gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PBL Completion</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {(activePerformance.pblCompletionRate * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {activePerformance.schoolsCompletedPbl}/{activePerformance.sampledSchoolRecords} schools
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Evidence Upload</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {(activePerformance.evidenceSubmissionRate * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {activePerformance.schoolsWithEvidence} schools
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attendance Rate</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {(activePerformance.attendanceRate * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {activePerformance.totalEnrollment.toLocaleString()} students
                  </div>
                </div>
              </div>

              {/* Milestones bar */}
              <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '0.8rem', display: 'flex', gap: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Milestones:</span>
                <span style={{ color: 'var(--text-primary)' }}>{activePerformance.milestoneSummary}</span>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No performance data available for this month.
            </div>
          )}

          {/* Finance Sheet Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Landmark size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Financial Utilization Sheet</h3>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Cumulative: <strong style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>{financeSummary.rate.toFixed(1)}%</strong> utilized ({financeSummary.utilizedCumulativeTotal}/{financeSummary.budgetTotal} units)
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Budget Line Item</th>
                    <th style={{ textAlign: 'center' }}>Approved</th>
                    <th style={{ textAlign: 'center' }}>Monthly</th>
                    <th style={{ textAlign: 'center' }}>Cumulative</th>
                    <th style={{ textAlign: 'right' }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {activeFinance.map((f, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{f.budgetLine}</td>
                      <td style={{ textAlign: 'center' }}>{f.approvedBudgetUnits}</td>
                      <td style={{ textAlign: 'center', color: 'var(--accent)' }}>{f.monthlyUtilizedUnits}</td>
                      <td style={{ textAlign: 'center' }}>{f.cumulativeUtilizedUnits}</td>
                      <td style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.financeNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Linked Evidence Assets / Gallery */}
        <div style={{ gridColumn: 'span 5' }}>
          <div className="glass-panel" style={{ padding: '24px', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Image size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Linked Field Evidence</h3>
            </div>
            
            {activeMedia.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeMedia.map((media) => (
                  <div key={media.recordId} className="glass-panel" style={{ overflow: 'hidden' }}>
                    {/* Render Image Frame */}
                    <div
                      className="media-card"
                      style={{ borderRadius: '12px 12px 0 0', border: 'none' }}
                      onClick={() => setPreviewImage(`/images/${media.fileName}`)}
                    >
                      <img src={`/images/${media.fileName}`} alt={media.title} />
                      <div className="media-overlay">
                        <span className="badge badge-on-track" style={{ fontSize: '0.6rem', alignSelf: 'flex-start', marginBottom: '4px' }}>
                          {media.recordType}
                        </span>
                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
                          {media.title}
                        </div>
                      </div>
                    </div>
                    {/* Caption area */}
                    <div style={{ padding: '12px 16px', fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.01)', borderTop: '1px solid var(--card-border)' }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{media.caption}</div>
                      <div style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                        <span>ID: {media.recordId} ({media.district})</span>
                        <span>Citations: [{media.usageNote ? 'Linked' : 'Not Linked'}]</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'var(--text-muted)', border: '1px dashed var(--card-border)', borderRadius: '12px' }}>
                <HelpCircle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <span>No media assets cataloged for this reporting month.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: narrative output panel & Gemini parameters */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={22} color="var(--primary)" />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Generative Section Writer</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Draft reports are grounded automatically using the facts audited above to ensure absolute compliance.
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={handleGenerateReport}
              disabled={isGenerating || !activePerformance}
            >
              <Sparkles size={16} />
              {isGenerating ? 'Compiling Report...' : 'Generate Narrative'}
            </button>
          </div>
        </div>

        {aiError && (
          <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', color: 'var(--warning)', borderRadius: '8px', padding: '12px 16px', fontSize: '0.8rem', marginBottom: '20px' }}>
            {aiError}
          </div>
        )}

        {/* Narrative layout splits */}
        <div className="grid-cols-12" style={{ gap: '24px' }}>
          {/* Markdown editor & preview */}
          <div style={{ gridColumn: 'span 8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Report Section Preview
              </span>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                onClick={handleCopy}
                disabled={!generatedReport && !activePerformance?.draftReportText}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy Report'}
              </button>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--card-border)',
              borderRadius: '12px',
              padding: '24px',
              minHeight: '260px',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              color: 'var(--text-primary)',
              overflowY: 'auto'
            }}>
              {generatedReport ? (
                // Parse markdown tags loosely for visualization
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {generatedReport.split('\n\n').map((para, i) => {
                    if (para.startsWith('### ')) {
                      return <h4 key={i} style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px', marginTop: '10px' }}>{para.replace('### ', '')}</h4>;
                    }
                    if (para.startsWith('1. ') || para.startsWith('2. ') || para.startsWith('3. ')) {
                      return (
                        <div key={i} style={{ paddingLeft: '16px' }}>
                          {para.replace(/^\d+\.\s+/, '')}
                        </div>
                      );
                    }
                    
                    // Replace references [1], [2] with highlighted buttons
                    const parts = para.split(/(\[\d+\])/g);
                    return (
                      <p key={i}>
                        {parts.map((part, pi) => {
                          const citationMatch = part.match(/\[(\d+)\]/);
                          if (citationMatch) {
                            const cit = citationMatch[1];
                            return (
                              <span
                                key={pi}
                                onMouseEnter={() => setHoveredCitation(cit)}
                                onMouseLeave={() => setHoveredCitation(null)}
                                style={{
                                  background: hoveredCitation === cit ? 'var(--primary)' : 'var(--primary-glow)',
                                  color: 'var(--text-primary)',
                                  border: '1px solid var(--primary)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'help',
                                  margin: '0 4px',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                Fact {cit}
                              </span>
                            );
                          }
                          return part;
                        })}
                      </p>
                    );
                  })}
                </div>
              ) : activePerformance ? (
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '16px' }}>
                    Click "Generate Narrative" to construct a report with highlighted fact traceability, or read the static template:
                  </p>
                  <p>{activePerformance.draftReportText}</p>
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Select a grant and month above.</span>
              )}
            </div>
          </div>

          {/* Traceability Audit Trail Panel */}
          <div style={{ gridColumn: 'span 4' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Fact Audit Trail & Traceability
            </span>
            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.01)', height: 'calc(100% - 24px)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px', fontWeight: 600 }}>
                Traceability citations:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['1', '2', '3', '4', '5', '6'].map((num) => (
                  <div
                    key={num}
                    style={{
                      background: hoveredCitation === num ? 'var(--primary-glow)' : 'rgba(255,255,255,0.01)',
                      border: hoveredCitation === num ? '1px solid var(--primary)' : '1px solid var(--card-border)',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '0.75rem',
                      color: hoveredCitation === num ? 'var(--text-primary)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--primary)',
                      color: '#fff',
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      marginRight: '8px',
                      fontWeight: 700,
                      fontSize: '0.65rem'
                    }}>
                      {num}
                    </span>
                    {getCitationTooltip(num)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer'
          }}
        >
          <img
            src={previewImage}
            alt="Evidence preview"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: '8px',
              border: '2px solid rgba(255,255,255,0.2)'
            }}
          />
        </div>
      )}
    </div>
  );
}
