import { useState, useMemo, useEffect } from 'react';
import { 
  ClassItem, 
  SubjectItem, 
  Student, 
  AttendanceRecord, 
  User,
  AcademyInfo
} from '../../types';
import { 
  getAttendanceRecords, 
  getClasses, 
  getSubjects, 
  getStudents,
  getAcademyInfo 
} from '../../storage';
import { 
  Printer, 
  FileText, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Building,
  Calendar,
  Sparkles
} from 'lucide-react';

interface AttendanceReportsProps {
  currentUser: User;
}

export function AttendanceReports({ currentUser }: AttendanceReportsProps) {
  const classes = useMemo(() => getClasses(), []);
  const subjects = useMemo(() => getSubjects(), []);
  const students = useMemo(() => getStudents(), []);
  const records = useMemo(() => getAttendanceRecords(), []);

  // Live Academy profile data
  const [academyInfo, setAcademyInfo] = useState<AcademyInfo>(() => getAcademyInfo());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setAcademyInfo(e.detail);
      } else {
        setAcademyInfo(getAcademyInfo());
      }
    };
    window.addEventListener('academy-info-updated', handleUpdate);
    return () => window.removeEventListener('academy-info-updated', handleUpdate);
  }, []);

  // Filter criteria
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<'ALL' | 'LAST_7' | 'LAST_30' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [printPreviewMode, setPrintPreviewMode] = useState(false);

  // Compute matched records based on filters
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Class filter
      if (selectedClassId !== 'ALL' && rec.classId !== selectedClassId) return false;
      // Subject filter
      if (selectedSubjectId !== 'ALL' && rec.subjectId !== selectedSubjectId) return false;

      // Date filter
      if (dateRange === 'LAST_7') {
        const d = new Date(rec.date);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        if (d < cutoff) return false;
      } else if (dateRange === 'LAST_30') {
        const d = new Date(rec.date);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        if (d < cutoff) return false;
      } else if (dateRange === 'CUSTOM') {
        if (customStartDate && rec.date < customStartDate) return false;
        if (customEndDate && rec.date > customEndDate) return false;
      }

      return true;
    });
  }, [records, selectedClassId, selectedSubjectId, dateRange, customStartDate, customEndDate]);

  // Students in selected scope
  const targetStudents = useMemo(() => {
    if (selectedClassId === 'ALL') {
      return students.filter((s) => s.status === 'Active');
    }
    return students.filter((s) => s.classId === selectedClassId && s.status === 'Active');
  }, [students, selectedClassId]);

  // Aggregate student statistics across filtered sessions
  const studentMetrics = useMemo(() => {
    return targetStudents.map((student) => {
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let totalAssessed = 0;

      filteredRecords.forEach((rec) => {
        // Only count if student belongs to this record's class
        if (student.classId === rec.classId) {
          const entry = rec.entries.find((e) => e.studentId === student.id);
          if (entry) {
            totalAssessed++;
            if (entry.status === 'present') presentCount++;
            else if (entry.status === 'late') lateCount++;
            else if (entry.status === 'absent') absentCount++;
          }
        }
      });

      // Attendance rate formula: Present counts 100%, Late counts 50%
      const effectivePresent = presentCount + lateCount * 0.5;
      const rate = totalAssessed > 0 ? Math.round((effectivePresent / totalAssessed) * 100) : 100;

      return {
        student,
        presentCount,
        lateCount,
        absentCount,
        totalAssessed,
        rate,
      };
    });
  }, [targetStudents, filteredRecords]);

  // Macro Summary Statistics
  const macroStats = useMemo(() => {
    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;
    let totalMarks = 0;

    studentMetrics.forEach((m) => {
      totalPresent += m.presentCount;
      totalLate += m.lateCount;
      totalAbsent += m.absentCount;
      totalMarks += m.totalAssessed;
    });

    const averageRate = totalMarks > 0 ? Math.round(((totalPresent + totalLate * 0.5) / totalMarks) * 100) : 100;
    const atRiskCount = studentMetrics.filter((m) => m.rate < 80 && m.totalAssessed > 0).length;

    return {
      totalSessions: filteredRecords.length,
      totalStudents: targetStudents.length,
      totalPresent,
      totalLate,
      totalAbsent,
      averageRate,
      atRiskCount,
    };
  }, [studentMetrics, filteredRecords, targetStudents]);

  const handlePrint = () => {
    window.print();
  };

  const selectedClassObj = classes.find((c) => c.id === selectedClassId);
  const selectedSubObj = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="space-y-6">
      
      {/* Configuration & Generator Controls (Hidden when printing) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-800 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Attendance Report Generator</h2>
              <p className="text-xs text-slate-500">Filter parameters to produce certified academic attendance summaries</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPrintPreviewMode(!printPreviewMode)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              {printPreviewMode ? 'Standard View' : 'Print Document View'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Report</span>
            </button>
          </div>
        </div>

        {/* Filter Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white"
            >
              <option value="ALL">All Classes & Sections</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white"
            >
              <option value="ALL">All Enrolled Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Date Period</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white"
            >
              <option value="ALL">Full Academic Term</option>
              <option value="LAST_7">Past 7 Days</option>
              <option value="LAST_30">Past 30 Days</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>

          {dateRange === 'CUSTOM' ? (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block font-semibold text-slate-700 mb-1">From</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5"
                />
              </div>
              <div className="flex-1">
                <label className="block font-semibold text-slate-700 mb-1">To</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-end">
              <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-500 text-[11px] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Found <strong>{filteredRecords.length}</strong> recorded sessions</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable / Formal Report Canvas */}
      <div className={`bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6 ${printPreviewMode ? 'ring-2 ring-sky-500' : ''}`}>
        
        {/* Formal Institutional Header (Visible in print & preview) */}
        <div className="text-center pb-6 border-b-2 border-slate-900">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                {academyInfo.name}
              </h1>
              <p className="text-xs text-slate-600 font-medium tracking-wide uppercase">
                {academyInfo.registrarName} • {academyInfo.address}
              </p>
            </div>
          </div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mt-3 bg-slate-100 py-1 px-4 inline-block rounded">
            Official Student Attendance Summary Report
          </h2>
          <div className="text-[11px] text-slate-500 mt-2 flex justify-center gap-4 flex-wrap">
            <span>Academic Year: <strong>{academyInfo.academicYear} ({academyInfo.semester})</strong></span>
            <span>•</span>
            <span>Class Scope: <strong>{selectedClassObj ? selectedClassObj.name : 'All Classes'}</strong></span>
            <span>•</span>
            <span>Subject: <strong>{selectedSubObj ? `${selectedSubObj.code} - ${selectedSubObj.name}` : 'All Subjects'}</strong></span>
            <span>•</span>
            <span>Generated on: <strong>{new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</strong></span>
          </div>
        </div>

        {/* Executive Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
          <div className="text-center sm:text-left">
            <span className="text-[11px] text-slate-500 block uppercase font-medium">Total Sessions</span>
            <span className="text-xl font-bold text-slate-900">{macroStats.totalSessions}</span>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[11px] text-slate-500 block uppercase font-medium">Enrolled Students</span>
            <span className="text-xl font-bold text-slate-900">{macroStats.totalStudents}</span>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[11px] text-slate-500 block uppercase font-medium">Overall Attendance Rate</span>
            <span className="text-xl font-bold text-sky-800">{macroStats.averageRate}%</span>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[11px] text-slate-500 block uppercase font-medium">Attendance Alerts (&lt;80%)</span>
            <span className={`text-xl font-bold ${macroStats.atRiskCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {macroStats.atRiskCount} Student(s)
            </span>
          </div>
        </div>

        {/* Breakdown by Attendance Status */}
        <div className="flex items-center justify-between text-xs px-2 py-1 bg-slate-100/60 rounded-lg text-slate-700 font-mono">
          <span>Aggregate Tally:</span>
          <div className="flex gap-4">
            <span className="text-emerald-700 font-semibold">Total Present: {macroStats.totalPresent}</span>
            <span className="text-amber-700 font-semibold">Total Late: {macroStats.totalLate}</span>
            <span className="text-rose-700 font-semibold">Total Absent: {macroStats.totalAbsent}</span>
          </div>
        </div>

        {/* Student Breakdown Table */}
        <div className="border border-slate-300 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5 w-12 text-center">#</th>
                <th className="px-4 py-2.5">Student ID & Name</th>
                <th className="px-4 py-2.5">Class / Section</th>
                <th className="px-4 py-2.5 text-center">Present</th>
                <th className="px-4 py-2.5 text-center">Late</th>
                <th className="px-4 py-2.5 text-center">Absent</th>
                <th className="px-4 py-2.5 text-center">Sessions</th>
                <th className="px-4 py-2.5 text-center">Attendance %</th>
                <th className="px-4 py-2.5 text-center">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {studentMetrics.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No student attendance data recorded for this selection.
                  </td>
                </tr>
              ) : (
                studentMetrics.map((item, index) => {
                  const studentClass = classes.find((c) => c.id === item.student.classId);
                  const isLow = item.rate < 80 && item.totalAssessed > 0;

                  return (
                    <tr key={item.student.id} className={isLow ? 'bg-rose-50/40' : 'hover:bg-slate-50/50'}>
                      <td className="px-4 py-2.5 text-center text-slate-400 font-mono">
                        {index + 1}
                      </td>

                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-900">
                          {item.student.lastName}, {item.student.firstName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {item.student.studentNumber}
                        </div>
                      </td>

                      <td className="px-4 py-2.5 text-slate-700">
                        {studentClass?.name || 'Unassigned'}
                      </td>

                      <td className="px-4 py-2.5 text-center font-mono font-semibold text-emerald-700">
                        {item.presentCount}
                      </td>

                      <td className="px-4 py-2.5 text-center font-mono font-semibold text-amber-700">
                        {item.lateCount}
                      </td>

                      <td className="px-4 py-2.5 text-center font-mono font-semibold text-rose-700">
                        {item.absentCount}
                      </td>

                      <td className="px-4 py-2.5 text-center font-mono text-slate-600">
                        {item.totalAssessed}
                      </td>

                      <td className="px-4 py-2.5 text-center font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            item.rate >= 85
                              ? 'text-emerald-800'
                              : item.rate >= 75
                              ? 'text-amber-800'
                              : 'text-rose-800 font-extrabold'
                          }`}
                        >
                          {item.rate}%
                        </span>
                      </td>

                      <td className="px-4 py-2.5 text-center">
                        {item.totalAssessed === 0 ? (
                          <span className="text-[10px] text-slate-400">No Records</span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Intervention</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Good Standing
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Official Certification & Signatures Section (Perfect for printed copies) */}
        <div className="pt-8 mt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-xs text-slate-700">
          <div>
            <div className="h-12 border-b border-slate-400 mx-auto w-48 mb-2"></div>
            <div className="font-bold text-slate-900">
              {selectedClassObj ? selectedClassObj.adviser : 'Faculty Adviser'}
            </div>
            <div className="text-[11px] text-slate-500">Instructor / Class Adviser</div>
          </div>

          <div>
            <div className="h-12 border-b border-slate-400 mx-auto w-48 mb-2"></div>
            <div className="font-bold text-slate-900">{currentUser.fullName}</div>
            <div className="text-[11px] text-slate-500">Office of the Registrar</div>
          </div>

          <div>
            <div className="h-12 border-b border-slate-400 mx-auto w-48 mb-2"></div>
            <div className="font-bold text-slate-900">{academyInfo.principal || 'School Principal'}</div>
            <div className="text-[11px] text-slate-500">Principal / Head of Institution</div>
          </div>
        </div>

        {/* Official Document Security Note */}
        <div className="text-[10px] text-slate-400 text-center pt-2">
          This document is generated directly from the {academyInfo.name} Student Attendance Management System database. Any unauthorized alteration renders this report invalid.
        </div>
      </div>

    </div>
  );
}
