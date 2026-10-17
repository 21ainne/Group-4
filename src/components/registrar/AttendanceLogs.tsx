import { useState, useMemo } from 'react';
import { AttendanceRecord, ClassItem, SubjectItem, Student, AttendanceStatus } from '../../types';
import { 
  getAttendanceRecords, 
  getClasses, 
  getSubjects, 
  getStudents,
  deleteAttendanceRecord,
  saveAttendanceRecord
} from '../../storage';
import { 
  FileCheck2, 
  Calendar, 
  User, 
  Eye, 
  X, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Search,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';

export function AttendanceLogs() {
  const [dataVersion, setDataVersion] = useState(0);
  const records = useMemo(() => getAttendanceRecords(), [dataVersion]);
  const classes = useMemo(() => getClasses(), []);
  const subjects = useMemo(() => getSubjects(), []);
  const students = useMemo(() => getStudents(), []);

  // Filter states
  const [classFilter, setClassFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Sheet detail modal & edit state
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editEntries, setEditEntries] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const cls = classes.find((c) => c.id === rec.classId);
      const sub = subjects.find((s) => s.id === rec.subjectId);

      const matchesClass = classFilter === 'ALL' || rec.classId === classFilter;
      const matchesSubject = subjectFilter === 'ALL' || rec.subjectId === subjectFilter;
      const matchesDate = !dateFilter || rec.date === dateFilter;

      const matchesSearch =
        !searchTerm ||
        cls?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.recordedByName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesClass && matchesSubject && matchesDate && matchesSearch;
    });
  }, [records, classes, subjects, classFilter, subjectFilter, dateFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-100 text-sky-800 rounded-lg">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Attendance Audit Logs</h2>
            <p className="text-xs text-slate-500">Master database of all attendance sessions submitted across classes</p>
          </div>
        </div>

        <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
          Total Logs: <strong className="text-slate-900">{records.length}</strong>
        </span>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search teacher, class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
          />
        </div>

        {/* Class */}
        <div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
          >
            <option value="ALL">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
          />
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Class / Section</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Recorded By</th>
                <th className="px-5 py-3 text-center">Summary (P / L / A)</th>
                <th className="px-5 py-3 text-center">Rate</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const cls = classes.find((c) => c.id === rec.classId);
                  const sub = subjects.find((s) => s.id === rec.subjectId);

                  const present = rec.entries.filter((e) => e.status === 'present').length;
                  const late = rec.entries.filter((e) => e.status === 'late').length;
                  const absent = rec.entries.filter((e) => e.status === 'absent').length;
                  const total = rec.entries.length;
                  const rate = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;

                  return (
                    <tr key={`${rec.id}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      {/* Date */}
                      <td className="px-5 py-3.5 font-mono text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rec.date}</span>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {cls?.name || 'Unknown Class'}
                      </td>

                      {/* Subject */}
                      <td className="px-5 py-3.5 text-slate-700">
                        <span className="font-mono text-[11px] text-slate-500 mr-1.5">{sub?.code}</span>
                        <span>{sub?.name || 'Subject'}</span>
                      </td>

                      {/* Instructor */}
                      <td className="px-5 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rec.recordedByName}</span>
                        </div>
                      </td>

                      {/* Counts */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-flex items-center gap-2 text-xs font-mono">
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            P: {present}
                          </span>
                          <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            L: {late}
                          </span>
                          <span className="text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                            A: {absent}
                          </span>
                        </div>
                      </td>

                      {/* Rate */}
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            rate >= 85
                              ? 'bg-emerald-50 text-emerald-800'
                              : rate >= 70
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-rose-50 text-rose-800'
                          }`}
                        >
                          {rate}%
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecord(rec);
                              setIsEditing(false);
                              const initialMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};
                              rec.entries.forEach((e) => {
                                initialMap[e.studentId] = { status: e.status, remarks: e.remarks || '' };
                              });
                              setEditEntries(initialMap);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-700 hover:text-sky-900 hover:bg-sky-50 rounded-md transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingRecord(rec)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Delete Attendance Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect & Edit Record Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-sm">
                  {isEditing ? 'Edit Attendance Session' : 'Attendance Session Details'}
                </h3>
                <p className="text-xs text-slate-400">Record ID: {selectedRecord.id}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRecord(null);
                  setIsEditing(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveToast && (
              <div className="bg-emerald-50 text-emerald-800 border-b border-emerald-200 px-6 py-2 text-xs font-medium flex items-center justify-between">
                <span>{saveToast}</span>
                <button onClick={() => setSaveToast(null)} className="text-emerald-600 hover:text-emerald-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Class</span>
                  <strong className="text-slate-800">
                    {classes.find((c) => c.id === selectedRecord.classId)?.name}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Subject</span>
                  <strong className="text-slate-800">
                    {subjects.find((s) => s.id === selectedRecord.subjectId)?.name}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Date</span>
                  <strong className="text-slate-800">{selectedRecord.date}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Instructor</span>
                  <strong className="text-slate-800">{selectedRecord.recordedByName}</strong>
                </div>
              </div>

              {selectedRecord.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900">
                  <strong>Session Notes:</strong> {selectedRecord.notes}
                </div>
              )}

              {/* Student entries breakdown */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Student Attendance Roster ({selectedRecord.entries.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Entries'}
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Student ID &amp; Name</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                        <th className="px-4 py-2.5">Instructor Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedRecord.entries.map((entry) => {
                        const student = students.find((s) => s.id === entry.studentId);
                        const currentStatus = isEditing && editEntries[entry.studentId]
                          ? editEntries[entry.studentId].status
                          : entry.status;
                        const currentRemarks = isEditing && editEntries[entry.studentId]
                          ? editEntries[entry.studentId].remarks
                          : (entry.remarks || '');

                        return (
                          <tr key={entry.studentId} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5">
                              <div className="font-semibold text-slate-900">
                                {student ? `${student.lastName}, ${student.firstName}` : 'Student Record'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {student?.studentNumber}
                              </div>
                            </td>

                            <td className="px-4 py-2.5 text-center">
                              {isEditing ? (
                                <select
                                  value={currentStatus}
                                  onChange={(e) => {
                                    const nextStatus = e.target.value as AttendanceStatus;
                                    setEditEntries((prev) => ({
                                      ...prev,
                                      [entry.studentId]: {
                                        status: nextStatus,
                                        remarks: prev[entry.studentId]?.remarks || '',
                                      },
                                    }));
                                  }}
                                  className="px-2 py-1 rounded border border-slate-300 text-xs font-semibold focus:outline-hidden"
                                >
                                  <option value="present">Present</option>
                                  <option value="late">Late</option>
                                  <option value="absent">Absent</option>
                                </select>
                              ) : (
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    entry.status === 'present'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : entry.status === 'late'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {entry.status === 'present' && <CheckCircle2 className="w-3 h-3" />}
                                  {entry.status === 'late' && <Clock className="w-3 h-3" />}
                                  {entry.status === 'absent' && <XCircle className="w-3 h-3" />}
                                  <span className="capitalize">{entry.status}</span>
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-2.5 text-slate-600">
                              {isEditing ? (
                                <input
                                  type="text"
                                  placeholder="Add remark..."
                                  value={currentRemarks}
                                  onChange={(e) => {
                                    const nextRemarks = e.target.value;
                                    setEditEntries((prev) => ({
                                      ...prev,
                                      [entry.studentId]: {
                                        status: prev[entry.studentId]?.status || entry.status,
                                        remarks: nextRemarks,
                                      },
                                    }));
                                  }}
                                  className="w-full px-2 py-1 rounded border border-slate-300 text-xs"
                                />
                              ) : (
                                entry.remarks || <span className="text-slate-300 italic">None</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setDeletingRecord(selectedRecord);
                  setSelectedRecord(null);
                }}
                className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Session</span>
              </button>

              <div className="flex gap-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      const updatedEntries = selectedRecord.entries.map((e) => {
                        const modified = editEntries[e.studentId];
                        return {
                          ...e,
                          status: modified ? modified.status : e.status,
                          remarks: modified ? modified.remarks : e.remarks,
                        };
                      });

                      const updatedRecord: AttendanceRecord = {
                        ...selectedRecord,
                        entries: updatedEntries,
                      };

                      saveAttendanceRecord(updatedRecord);
                      setSelectedRecord(updatedRecord);
                      setIsEditing(false);
                      setDataVersion((v) => v + 1);
                      setSaveToast('Attendance record saved and synced to Supabase database.');
                      setTimeout(() => setSaveToast(null), 3500);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecord(null);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Delete Attendance Session?</h3>
            <p className="text-xs text-slate-500 mb-6">
              This will permanently delete the attendance log for {deletingRecord.date} and remove its entries from both local cache and Supabase database.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="flex-1 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAttendanceRecord(deletingRecord.id);
                  setDeletingRecord(null);
                  setDataVersion((v) => v + 1);
                }}
                className="flex-1 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
