export interface SchoolRecord {
  reportingMonth: string;
  timestamp: string;
  schoolName: string;
  schoolCode: string;
  district: string;
  block: string;
  pblConducted: string; // "Yes" | "No"
  evidenceSubmitted: string; // "Yes" | "No"
  classesTaught: string; // e.g. "Classes 6, 7 and 8"
  subjectsTaught: string; // e.g. "Math and Science"
  enrollmentC6: number;
  attendanceC6Sci: number;
  attendanceC6Math: number;
  enrollmentC7: number;
  attendanceC7Sci: number;
  attendanceC7Math: number;
  enrollmentC8: number;
  attendanceC8Sci: number;
  attendanceC8Math: number;
  // Raw pre-calculated columns
  totalEnrollment: number;
  totalAttendance: number;
  attendanceRate: number;
  riskStatus: string;
}

export interface FilterState {
  month: string; // "2025-07", "2025-08", "2025-09", "all"
  district: string; // "all", or specific
  block: string; // "all", or specific
  grade: string; // "all", "6", "7", "8"
  subject: string; // "all", "Math", "Science"
}

export interface AggregatedMetrics {
  totalSchools: number;
  participatingSchools: number;
  participationPercentage: number;
  submittingEvidenceSchools: number;
  evidenceSubmissionPercentage: number; // based on participating schools
  overallEvidencePercentage: number; // based on total schools
  totalEnrollment: number;
  totalAttendance: number;
  attendancePercentage: number;
  riskStatus: 'On Track' | 'Behind' | 'At Risk' | 'Critical';
}

export interface GeoMetrics {
  name: string; // District or Block name
  totalSchools: number;
  participatingSchools: number;
  participationPercentage: number;
  attendancePercentage: number;
  riskStatus: 'On Track' | 'Behind' | 'At Risk' | 'Critical';
}

/**
 * Classifies any percentage rate into a Risk Status.
 */
export function classifyRisk(rate: number): 'On Track' | 'Behind' | 'At Risk' | 'Critical' {
  const percent = rate * 100;
  if (percent >= 75) return 'On Track';
  if (percent >= 60) return 'Behind';
  if (percent >= 35) return 'At Risk';
  return 'Critical';
}

/**
 * Parses and determines if a school's record matches the grade and subject filter criteria.
 * This is crucial because a school might teach only Math to Class 6, etc.
 */
export function recordMatchesFilters(record: SchoolRecord, filters: FilterState): boolean {
  // 1. Month filter
  if (filters.month !== 'all' && record.reportingMonth !== filters.month) {
    return false;
  }
  
  // 2. District filter
  if (filters.district !== 'all' && record.district !== filters.district) {
    return false;
  }
  
  // 3. Block filter
  if (filters.block !== 'all' && record.block !== filters.block) {
    return false;
  }
  
  // 4. Grade filter
  // Check if school conducted project in selected grade
  if (filters.grade !== 'all') {
    const classes = String(record.classesTaught || '');
    if (classes === 'Not conducted' || !classes.includes(filters.grade)) {
      return false;
    }
  }
  
  // 5. Subject filter
  if (filters.subject !== 'all') {
    const subjects = String(record.subjectsTaught || '');
    if (subjects === 'Not applicable' || !subjects.includes(filters.subject)) {
      return false;
    }
  }

  return true;
}

/**
 * Calculates metrics for a filtered set of school records, taking into account
 * grade and subject selections to perform precise, mathematically correct aggregations.
 */
export function calculateMetrics(
  records: SchoolRecord[],
  filters: FilterState
): AggregatedMetrics {
  // Filter records matching geography, grade, and subject
  const matchingRecords = records.filter((r) => recordMatchesFilters(r, filters));
  
  const totalSchools = new Set(matchingRecords.map((r) => r.schoolCode)).size;
  
  // Conducted / Participating
  const participatingRecords = matchingRecords.filter((r) => r.pblConducted === 'Yes');
  const participatingSchools = new Set(participatingRecords.map((r) => r.schoolCode)).size;
  
  // Evidence
  const evidenceRecords = matchingRecords.filter(
    (r) => r.pblConducted === 'Yes' && r.evidenceSubmitted === 'Yes'
  );
  const submittingEvidenceSchools = new Set(evidenceRecords.map((r) => r.schoolCode)).size;
  
  // Attendance and enrollment calculation based on grade/subject filters
  let sumEnrollment = 0;
  let sumAttendance = 0;
  let possibleAttendanceMultiplier = 0;

  // Set multipliers based on subject filter
  if (filters.subject === 'all') {
    possibleAttendanceMultiplier = 2; // Math & Science sessions
  } else {
    possibleAttendanceMultiplier = 1; // 1 subject session
  }

  matchingRecords.forEach((r) => {
    // If project was not conducted, attendance is 0, but enrollment is still present.
    // However, does the enrollment count?
    // According to July CSV rows where pblConducted is "No", enrollment counts towards total, but attendance is 0.
    
    let enroll = 0;
    let attend = 0;
    let activeGrades = 0;

    // Check which classes are included
    const classes = String(r.classesTaught || '');
    const subjects = String(r.subjectsTaught || '');

    // Class 6
    if (filters.grade === 'all' || filters.grade === '6') {
      const isGradeActive = classes.includes('6');
      enroll += r.enrollmentC6 || 0;
      if (isGradeActive && r.pblConducted === 'Yes') {
        activeGrades++;
        if (filters.subject === 'all' || filters.subject === 'Science') {
          if (subjects.includes('Science')) attend += r.attendanceC6Sci || 0;
        }
        if (filters.subject === 'all' || filters.subject === 'Math') {
          if (subjects.includes('Math')) attend += r.attendanceC6Math || 0;
        }
      }
    }

    // Class 7
    if (filters.grade === 'all' || filters.grade === '7') {
      const isGradeActive = classes.includes('7');
      enroll += r.enrollmentC7 || 0;
      if (isGradeActive && r.pblConducted === 'Yes') {
        activeGrades++;
        if (filters.subject === 'all' || filters.subject === 'Science') {
          if (subjects.includes('Science')) attend += r.attendanceC7Sci || 0;
        }
        if (filters.subject === 'all' || filters.subject === 'Math') {
          if (subjects.includes('Math')) attend += r.attendanceC7Math || 0;
        }
      }
    }

    // Class 8
    if (filters.grade === 'all' || filters.grade === '8') {
      const isGradeActive = classes.includes('8');
      enroll += r.enrollmentC8 || 0;
      if (isGradeActive && r.pblConducted === 'Yes') {
        activeGrades++;
        if (filters.subject === 'all' || filters.subject === 'Science') {
          if (subjects.includes('Science')) attend += r.attendanceC8Sci || 0;
        }
        if (filters.subject === 'all' || filters.subject === 'Math') {
          if (subjects.includes('Math')) attend += r.attendanceC8Math || 0;
        }
      }
    }

    sumEnrollment += enroll;
    sumAttendance += attend;
  });

  // Calculate final percentages
  const participationPercentage = totalSchools > 0 ? (participatingSchools / totalSchools) * 100 : 0;
  
  const evidenceSubmissionPercentage =
    participatingSchools > 0 ? (submittingEvidenceSchools / participatingSchools) * 100 : 0;
    
  const overallEvidencePercentage =
    totalSchools > 0 ? (submittingEvidenceSchools / totalSchools) * 100 : 0;

  // In July CSV, the Attendance Rate denominator is (Total Enrollment * 2).
  // If we filter, we want to align with this logic.
  const totalPossibleSlots = sumEnrollment * possibleAttendanceMultiplier;
  const attendancePercentage = totalPossibleSlots > 0 ? (sumAttendance / totalPossibleSlots) * 100 : 0;

  const riskStatus = classifyRisk(attendancePercentage / 100);

  return {
    totalSchools,
    participatingSchools,
    participationPercentage,
    submittingEvidenceSchools,
    evidenceSubmissionPercentage,
    overallEvidencePercentage,
    totalEnrollment: sumEnrollment,
    totalAttendance: sumAttendance,
    attendancePercentage,
    riskStatus,
  };
}

/**
 * Calculates Month-over-Month changes for dashboard metrics.
 * Compares selected month (e.g. 2025-08) with previous month (e.g. 2025-07)
 */
export interface MoMChange {
  currentValue: number;
  prevValue: number;
  difference: number;
  percentageChange: number;
  type: 'rate' | 'count';
}

export function getPreviousMonth(month: string): string | null {
  if (month === '2025-08') return '2025-07';
  if (month === '2025-09') return '2025-08';
  return null;
}

export function calculateMoM(
  records: SchoolRecord[],
  filters: FilterState,
  metricExtractor: (metrics: AggregatedMetrics) => number,
  type: 'rate' | 'count' = 'rate'
): MoMChange | null {
  if (filters.month === 'all' || filters.month === '2025-07') {
    return null; // No previous month data available in dataset
  }

  const prevMonth = getPreviousMonth(filters.month);
  if (!prevMonth) return null;

  const currentMetrics = calculateMetrics(records, filters);
  const prevMetrics = calculateMetrics(records, { ...filters, month: prevMonth });

  const currentValue = metricExtractor(currentMetrics);
  const prevValue = metricExtractor(prevMetrics);
  const difference = currentValue - prevValue;

  let percentageChange = 0;
  if (prevValue > 0) {
    percentageChange = (difference / prevValue) * 100;
  }

  return {
    currentValue,
    prevValue,
    difference,
    percentageChange,
    type,
  };
}

/**
 * Aggregates and calculates metrics by District or Block
 * for comparisons and top/bottom lists.
 */
export function getGeoPerformance(
  records: SchoolRecord[],
  filters: FilterState,
  by: 'district' | 'block'
): GeoMetrics[] {
  // Get all unique districts/blocks matching the filters (ignoring the 'by' filter itself)
  const baseFilters = { ...filters };
  if (by === 'district') baseFilters.district = 'all';
  if (by === 'block') baseFilters.block = 'all';

  const matchingRecords = records.filter((r) => recordMatchesFilters(r, baseFilters));
  
  const geoNames = Array.from(new Set(matchingRecords.map((r) => (by === 'district' ? r.district : r.block))));

  const result: GeoMetrics[] = geoNames.map((name) => {
    const geoFilters = { ...baseFilters };
    if (by === 'district') geoFilters.district = name;
    if (by === 'block') geoFilters.block = name;

    const metrics = calculateMetrics(records, geoFilters);
    return {
      name,
      totalSchools: metrics.totalSchools,
      participatingSchools: metrics.participatingSchools,
      participationPercentage: metrics.participationPercentage,
      attendancePercentage: metrics.attendancePercentage,
      riskStatus: metrics.riskStatus,
    };
  });

  // Sort descending by attendance rate
  return result.sort((a, b) => b.attendancePercentage - a.attendancePercentage);
}
