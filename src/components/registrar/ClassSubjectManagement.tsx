import React, { useState } from 'react';
import { ClassItem, SubjectItem } from '../../types';
import { 
  getClasses, 
  saveClass, 
  deleteClass, 
  getSubjects, 
  saveSubject, 
  deleteSubject, 
  getStudents 
} from '../../storage';
import { 
  School, 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Users, 
  AlertTriangle,
  DoorOpen,
  UserCheck
} from 'lucide-react';

interface ClassSubjectManagementProps {
  onDataChanged?: () => void;
}

export function ClassSubjectManagement({ onDataChanged }: ClassSubjectManagementProps) {
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');
  
  const [classes, setClasses] = useState<ClassItem[]>(() => getClasses());
  const [subjects, setSubjects] = useState<SubjectItem[]>(() => getSubjects());
  const students = getStudents();

  // Class Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassItem | null>(null);
  const [classFormData, setClassFormData] = useState<Partial<ClassItem>>({
    name: '',
    gradeLevel: 'Grade 10',
    section: '',
    academicYear: '2025-2026',
    room: '',
    adviser: '',
  });
  const [classError, setClassError] = useState<string | null>(null);

  // Subject Modals
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<SubjectItem | null>(null);
  const [subjectFormData, setSubjectFormData] = useState<Partial<SubjectItem>>({
    code: '',
    name: '',
    department: 'Natural Sciences',
    units: 3,
  });
  const [subjectError, setSubjectError] = useState<string | null>(null);

  const refreshAll = () => {
    setClasses(getClasses());
    setSubjects(getSubjects());
    if (onDataChanged) onDataChanged();
  };

  // --- CLASS ACTIONS ---

  const handleOpenAddClass = () => {
    setClassFormData({
      name: '',
      gradeLevel: 'Grade 10',
      section: '',
      academicYear: '2025-2026',
      room: 'Room 201',
      adviser: '',
    });
    setEditingClass(null);
    setClassError(null);
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassItem) => {
    setEditingClass(cls);
    setClassFormData({ ...cls });
    setClassError(null);
    setIsClassModalOpen(true);
  };

  const handleSubmitClass = (e: React.FormEvent) => {
    e.preventDefault();
    setClassError(null);

    const grade = classFormData.gradeLevel?.trim();
    const section = classFormData.section?.trim();
    if (!grade || !section) {
      setClassError('Grade Level and Section name are required.');
      return;
    }

    const calculatedName = `${grade} - ${section}`;

    const newOrUpdatedClass: ClassItem = {
      id: editingClass ? editingClass.id : `cls-${Date.now()}`,
      name: calculatedName,
      gradeLevel: grade,
      section: section,
      academicYear: classFormData.academicYear?.trim() || '2025-2026',
      room: classFormData.room?.trim() || 'TBA',
      adviser: classFormData.adviser?.trim() || 'Unassigned',
    };

    saveClass(newOrUpdatedClass);
    setIsClassModalOpen(false);
    refreshAll();
  };

  const handleConfirmDeleteClass = () => {
    if (!deletingClass) return;
    const res = deleteClass(deletingClass.id);
    if (!res.success) {
      alert(res.error);
      return;
    }
    setDeletingClass(null);
    refreshAll();
  };

  // --- SUBJECT ACTIONS ---

  const handleOpenAddSubject = () => {
    setSubjectFormData({
      code: '',
      name: '',
      department: 'Natural Sciences',
      units: 3,
    });
    setEditingSubject(null);
    setSubjectError(null);
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub: SubjectItem) => {
    setEditingSubject(sub);
    setSubjectFormData({ ...sub });
    setSubjectError(null);
    setIsSubjectModalOpen(true);
  };

  const handleSubmitSubject = (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectError(null);

    if (!subjectFormData.code?.trim() || !subjectFormData.name?.trim()) {
      setSubjectError('Subject Code and Subject Name are required.');
      return;
    }

    const newOrUpdatedSubject: SubjectItem = {
      id: editingSubject ? editingSubject.id : `sub-${Date.now()}`,
      code: subjectFormData.code.trim().toUpperCase(),
      name: subjectFormData.name.trim(),
      department: subjectFormData.department?.trim() || 'General',
      units: Number(subjectFormData.units) || 3,
    };

    saveSubject(newOrUpdatedSubject);
    setIsSubjectModalOpen(false);
    refreshAll();
  };

  const handleConfirmDeleteSubject = () => {
    if (!deletingSubject) return;
    deleteSubject(deletingSubject.id);
    setDeletingSubject(null);
    refreshAll();
  };

  return (
    <div className="space-y-5">
      
      {/* Tab Switcher */}
      <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-sky-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Classes & Sections ({classes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subjects')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'subjects'
              ? 'bg-sky-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curriculum Subjects ({subjects.length})</span>
        </button>
      </div>

      {/* CLASSES SECTION */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Academic Classes & Sections</h3>
              <p className="text-xs text-slate-500">Configure class designations, assigned rooms, and faculty advisers</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddClass}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Class</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const enrolledCount = students.filter((s) => s.classId === cls.id).length;

              return (
                <div 
                  key={cls.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                        {cls.gradeLevel}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {cls.academicYear}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-slate-900 leading-tight">
                      {cls.name}
                    </h4>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Room: <strong className="text-slate-800">{cls.room}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Adviser: <strong className="text-slate-800">{cls.adviser}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Enrolled Students: <strong className="text-slate-800">{enrolledCount}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditClass(cls)}
                      className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-md transition cursor-pointer"
                      title="Edit Class"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingClass(cls)}
                      className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition cursor-pointer"
                      title="Delete Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBJECTS SECTION */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Curriculum Subjects</h3>
              <p className="text-xs text-slate-500">Manage subject codes, official course titles, and academic units</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddSubject}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Subject</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Subject Code</th>
                  <th className="px-5 py-3">Course / Subject Title</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3 text-center">Credit Units</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {sub.code}
                    </td>
                    <td className="px-5 py-3.5 text-slate-800 font-semibold">
                      {sub.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {sub.department}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-700 font-mono">
                      {sub.units} Units
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSubject(sub)}
                          className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-md transition cursor-pointer"
                          title="Edit Subject"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingSubject(sub)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition cursor-pointer"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">
                {editingClass ? 'Update Class Details' : 'Add New Academic Class'}
              </h3>
              <button
                type="button"
                onClick={() => setIsClassModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClass} className="p-6 space-y-4">
              {classError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
                  {classError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade Level *</label>
                  <select
                    value={classFormData.gradeLevel}
                    onChange={(e) => setClassFormData({ ...classFormData, gradeLevel: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rizal, STEM A"
                    value={classFormData.section || ''}
                    onChange={(e) => setClassFormData({ ...classFormData, section: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Assignment</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204"
                    value={classFormData.room || ''}
                    onChange={(e) => setClassFormData({ ...classFormData, room: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                  <input
                    type="text"
                    placeholder="2025-2026"
                    value={classFormData.academicYear || '2025-2026'}
                    onChange={(e) => setClassFormData({ ...classFormData, academicYear: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono text-black bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Class Adviser</label>
                <input
                  type="text"
                  placeholder="e.g. Prof. Elena Vance"
                  value={classFormData.adviser || ''}
                  onChange={(e) => setClassFormData({ ...classFormData, adviser: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {editingClass ? 'Save Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Class Confirmation */}
      {deletingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Class</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900">{deletingClass.name}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingClass(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClass}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Delete Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-sm">
                {editingSubject ? 'Update Subject' : 'Add New Subject'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSubject} className="p-6 space-y-4">
              {subjectError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
                  {subjectError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BIO-101"
                    value={subjectFormData.code || ''}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono uppercase text-black bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Units</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={subjectFormData.units || 3}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, units: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono text-black bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General Biology & Ecology"
                  value={subjectFormData.name || ''}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={subjectFormData.department || 'Natural Sciences'}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, department: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Natural Sciences">Natural Sciences</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Social Studies">Social Studies</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Subject Confirmation */}
      {deletingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Subject</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900">{deletingSubject.code} - {deletingSubject.name}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingSubject(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSubject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
