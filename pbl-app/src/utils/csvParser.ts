/**
 * Custom CSV parser supporting RFC 4180 rules:
 * - Handles quotes, commas inside quoted cells, and escaped quotes.
 * - Auto-detects row separators (CRLF / LF).
 */
export function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++; // Skip double quote escape
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (char === '\r' || char === '\n') {
        row.push(cell.trim());
        cell = '';
        if (row.length > 0 && row.some((c) => c !== '')) {
          result.push(row);
        }
        row = [];
        if (char === '\r' && nextChar === '\n') {
          i++; // skip LF
        }
      } else {
        cell += char;
      }
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c !== '')) {
      result.push(row);
    }
  }

  return result;
}

/**
 * Normalizes header keys to camelCase for standard Javascript objects.
 */
function normalizeHeader(header: string): string {
  // Common mappings for clean developer use
  const raw = header.trim().toLowerCase();
  
  if (raw.includes('reporting month') || raw === 'reporting_month') return 'reportingMonth';
  if (raw === 'timestamp') return 'timestamp';
  if (raw.includes('name of your school') || raw.includes('school?')) return 'schoolName';
  if (raw.includes('synthetic school code') || raw.includes('school_code')) return 'schoolCode';
  if (raw.includes('name of your district') || raw === 'district') return 'district';
  if (raw.includes('block details') || raw === 'block_details') return 'block';
  if (raw.includes('conducted in your school') || raw.includes('conducted')) return 'pblConducted';
  if (raw.includes('evidence submitted') || raw.includes('evidence_submitted')) return 'evidenceSubmitted';
  if (raw.includes('class/classes did you conduct') || raw === 'classes' || raw === 'classes_taught') return 'classesTaught';
  if (raw.includes('subject do you teach') || raw === 'subject' || raw === 'subjects_taught') return 'subjectsTaught';
  
  // Enrollments
  if (raw.includes('enrolled in class 6')) return 'enrollmentC6';
  if (raw.includes('enrolled in class 7')) return 'enrollmentC7';
  if (raw.includes('enrolled in class 8')) return 'enrollmentC8';
  
  // Attendances
  if (raw.includes('attendance during the class 6 pbl science')) return 'attendanceC6Sci';
  if (raw.includes('attendance during the class 6 pbl math')) return 'attendanceC6Math';
  if (raw.includes('attendance during the class 7 pbl science')) return 'attendanceC7Sci';
  if (raw.includes('attendance during the class 7 pbl math')) return 'attendanceC7Math';
  if (raw.includes('attendance during the class 8 pbl science')) return 'attendanceC8Sci';
  if (raw.includes('attendance during the class 8 pbl math')) return 'attendanceC8Math';
  
  // Derived columns in school responses
  if (raw.includes('derived: total enrollment')) return 'totalEnrollment';
  if (raw.includes('derived: total attendance')) return 'totalAttendance';
  if (raw.includes('derived: overall pbl attendance rate')) return 'attendanceRate';
  if (raw.includes('derived: risk status') || raw === 'risk_status') return 'riskStatus';
  
  // Grant columns mappings
  if (raw === 'grant_id') return 'grantId';
  if (raw === 'donor') return 'donor';
  if (raw === 'grant_name') return 'grantName';
  if (raw === 'period_start') return 'periodStart';
  if (raw === 'period_end') return 'periodEnd';
  if (raw === 'covered_districts') return 'coveredDistricts';
  if (raw === 'budget_line') return 'budgetLine';
  if (raw === 'approved_budget_units') return 'approvedBudgetUnits';
  if (raw === 'monthly_utilized_units') return 'monthlyUtilizedUnits';
  if (raw === 'cumulative_utilized_units') return 'cumulativeUtilizedUnits';
  if (raw === 'cumulative_utilization_rate') return 'cumulativeUtilizationRate';
  if (raw === 'finance_note') return 'financeNote';
  
  // Grant performance report mappings
  if (raw === 'period_end_date') return 'periodEndDate';
  if (raw === 'report_due_date') return 'reportDueDate';
  if (raw === 'report_status') return 'reportStatus';
  if (raw === 'sampled_school_records') return 'sampledSchoolRecords';
  if (raw === 'schools_completed_pbl') return 'schoolsCompletedPbl';
  if (raw === 'pbl_completion_rate') return 'pblCompletionRate';
  if (raw === 'schools_with_evidence') return 'schoolsWithEvidence';
  if (raw === 'evidence_submission_rate') return 'evidenceSubmissionRate';
  if (raw === 'milestone_summary') return 'milestoneSummary';
  if (raw === 'draft_report_text') return 'draftReportText';

  // Media mappings
  if (raw === 'record_id') return 'recordId';
  if (raw === 'record_type') return 'recordType';
  if (raw === 'title') return 'title';
  if (raw === 'summary_or_caption') return 'caption';
  if (raw === 'file_name') return 'fileName';
  if (raw === 'relative_path') return 'relativePath';
  if (raw === 'usage_note') return 'usageNote';

  // Fallback to camelCase converter
  return raw.replace(/[^a-zA-Z0-9]+(.)/g, (_m, chr) => chr.toUpperCase());
}

/**
 * Parses CSV text into an array of typed objects.
 */
export function parseCSVToObjects<T>(text: string): T[] {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];

  const headers = rows[0].map(normalizeHeader);
  const data: T[] = [];

  // Fields that are expected to be numbers
  const numericHeaders = new Set([
    'enrollmentC6', 'enrollmentC7', 'enrollmentC8',
    'attendanceC6Sci', 'attendanceC6Math',
    'attendanceC7Sci', 'attendanceC7Math',
    'attendanceC8Sci', 'attendanceC8Math',
    'totalEnrollment', 'totalAttendance', 'attendanceRate',
    'approvedBudgetUnits', 'monthlyUtilizedUnits', 'cumulativeUtilizedUnits', 'cumulativeUtilizationRate',
    'sampledSchoolRecords', 'schoolsCompletedPbl', 'pblCompletionRate', 'schoolsWithEvidence', 'evidenceSubmissionRate'
  ]);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: any = {};
    for (let j = 0; j < headers.length; j++) {
      const val = row[j];
      const header = headers[j];
      
      // Parse numeric types automatically where possible
      if (val === undefined || val === '') {
        obj[header] = null;
      } else if (numericHeaders.has(header) && !isNaN(Number(val)) && val.trim() !== '') {
        obj[header] = Number(val);
      } else {
        obj[header] = val;
      }
    }
    data.push(obj as T);
  }

  return data;
}

