import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MonthlySummary from './components/MonthlySummary';
import GrantAssistant from './components/GrantAssistant';
import type { GrantFinance, GrantPerformance, EvidenceMedia } from './components/GrantAssistant';
import ActionsTracker from './components/ActionsTracker';
import type { SchoolRecord, FilterState } from './utils/deterministicEngine';
import { parseCSVToObjects } from './utils/csvParser';
import { GraduationCap, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  
  // Datasets states
  const [schoolRecords, setSchoolRecords] = useState<SchoolRecord[]>([]);
  const [finances, setFinances] = useState<GrantFinance[]>([]);
  const [performance, setPerformance] = useState<GrantPerformance[]>([]);
  const [mediaIndex, setMediaIndex] = useState<EvidenceMedia[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard Filters State
  const [filters, setFilters] = useState<FilterState>({
    month: '2025-09', // September by default
    district: 'all',
    block: 'all',
    grade: 'all',
    subject: 'all',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch CSV files in parallel
        const [
          julyCsv,
          augustCsv,
          septemberCsv,
          financeCsv,
          performanceCsv,
          mediaCsv,
        ] = await Promise.all([
          fetch('/data/PBL_School_Response_Data_July_2025.csv').then((r) => {
            if (!r.ok) throw new Error('Failed to load July CSV');
            return r.text();
          }),
          fetch('/data/PBL_School_Response_Data_August_2025.csv').then((r) => {
            if (!r.ok) throw new Error('Failed to load August CSV');
            return r.text();
          }),
          fetch('/data/PBL_School_Response_Data_September_2025.csv').then((r) => {
            if (!r.ok) throw new Error('Failed to load September CSV');
            return r.text();
          }),
          fetch('/data/01_Grant_Profile_and_Finance.csv').then((r) => {
            if (!r.ok) throw new Error('Failed to load Grant Finance CSV');
            return r.text();
          }),
          fetch('/data/02_Grant_Performance_and_Report_Material.csv').then((r) => {
            if (!r.ok) throw new Error('Failed to load Grant Performance CSV');
            return r.text();
          }),
          fetch('/data/03_Evidence_and_Media_Index.csv').then((r) => {
            if (!r.ok) throw new Error('Failed to load Evidence Media Index CSV');
            return r.text();
          }),
        ]);

        // Parse CSVs into objects
        const julyData = parseCSVToObjects<SchoolRecord>(julyCsv);
        const augustData = parseCSVToObjects<SchoolRecord>(augustCsv);
        const septemberData = parseCSVToObjects<SchoolRecord>(septemberCsv);
        
        // Merge the three monthly response CSVs
        const combinedSchoolResponses = [...julyData, ...augustData, ...septemberData];
        
        const parsedFinances = parseCSVToObjects<GrantFinance>(financeCsv);
        const parsedPerformance = parseCSVToObjects<GrantPerformance>(performanceCsv);
        const parsedMediaIndex = parseCSVToObjects<EvidenceMedia>(mediaCsv);

        setSchoolRecords(combinedSchoolResponses);
        setFinances(parsedFinances);
        setPerformance(parsedPerformance);
        setMediaIndex(parsedMediaIndex);

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error loading static data:', err);
        setError(`Failed to initialize datasets: ${err.message || err}`);
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard
            records={schoolRecords}
            filters={filters}
            setFilters={setFilters}
          />
        );
      case 'summary':
        return (
          <MonthlySummary
            records={schoolRecords}
          />
        );
      case 'grant':
        return (
          <GrantAssistant
            finances={finances}
            performance={performance}
            mediaIndex={mediaIndex}
          />
        );
      case 'actions':
        return <ActionsTracker />;
      default:
        return (
          <Dashboard
            records={schoolRecords}
            filters={filters}
            setFilters={setFilters}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          width: '60px',
          height: '60px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px var(--primary-glow)',
          marginBottom: '20px',
          animation: 'pulseBorder 2s infinite'
        }}>
          <GraduationCap size={36} color="#fff" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <RefreshCw size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
          Loading Program Intelligence Assets...
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '24px'
      }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--critical)', marginBottom: '12px' }}>
          Data Load Failure
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '500px', marginBottom: '20px' }}>
          {error}
        </div>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
}
