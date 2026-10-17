import React, { useState, useMemo } from 'react';
import { Student, ClassItem } from '../../types';
import { getStudents, saveStudent, deleteStudent } from '../../storage';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  AlertTriangle,
  Mail,
  Phone
} from 'lucide-react';

interface StudentManagementProps {
  classes: ClassItem[];
  onDataChanged?: () => void;
}

export function StudentManagement({ classes, onDataChanged }: StudentManagementProps) {
  const [students, setStudents] = useState<Student[]>(() => getStudents());
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    firstName: '',
    lastName: '',
    middleName: '',
    studentNumber: '',
    gender: 'Male',
    classId: classes[0]?.id || '',
    email: '',
    guardianName: '',
    guardianPhone: '',
    status: 'Active',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const refreshData = () => {
    const updated = getStudents();
    setStudents(updated);
    if (onDataChanged) onDataChanged();
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass = classFilter === 'ALL' || student.classId === classFilter;

      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, classFilter]);

  // Open Add Modal
  const handleOpenAdd = () => {
    const nextNum = String(students.length + 101).padStart(4, '0');
    setFormData({
      firstName: '',
      lastName: '',
      middleName: '',
      studentNumber: `STD-2026-${nextNum}`,
      gender: 'Male',
      classId: classes[0]?.id || '',
      email: '',
      guardianName: '',
      guardianPhone: '',
      status: 'Active',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ ...student });
    setFormError(null);
  };

  // Submit Add or Edit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.studentNumber?.trim() || !formData.classId) {
      setFormError('First Name, Last Name, Student ID, and Class are required.');
      return;
    }

    // Check duplicate student number
    const duplicate = students.find(
      (s) => s.studentNumber.toLowerCase() === formData.studentNumber?.toLowerCase() && s.id !== editingStudent?.id
    );
    if (duplicate) {
      setFormError('A student with this Student ID Number already exists.');
      return;
    }

    if (editingStudent) {
      // Update
      const updated: Student = {
        ...editingStudent,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.middleName?.trim() || undefined,
        studentNumber: formData.studentNumber.trim(),
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        classId: formData.classId,
        email: formData.email?.trim() || `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@student.christyjean.edu`,
        guardianName: formData.guardianName?.trim() || '',
        guardianPhone: formData.guardianPhone?.trim() || '',
        status: formData.status as 'Active' | 'Inactive' | 'Transferred',
      };
      saveStudent(updated);
      setEditingStudent(null);
    } else {
      // Add
      const newStudent: Student = {
        id: `std-${Date.now()}`,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.middleName?.trim() || undefined,
        studentNumber: formData.studentNumber.trim(),
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        classId: formData.classId,
        email: formData.email?.trim() || `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@student.christyjean.edu`,
        guardianName: formData.guardianName?.trim() || '',
        guardianPhone: formData.guardianPhone?.trim() || '',
        status: (formData.status as 'Active' | 'Inactive' | 'Transferred') || 'Active',
        enrollmentDate: new Date().toISOString().split('T')[0],
      };
      saveStudent(newStudent);
      setIsAddModalOpen(false);
    }

    refreshData();
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingStudent) return;
    deleteStudent(deletingStudent.id);
    setDeletingStudent(null);
    refreshData();
  };

  return (
    <div className="space-y-5">
      
      {/* Header with Search & Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-100 text-sky-800 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Student Records Management</h2>
            <p className="text-xs text-slate-500">Add, update, or remove student profiles and class assignments</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
          />
        </div>

        {/* Filter by Class */}
        <div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
          >
            <option value="ALL">All Classes ({students.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Class / Section</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Guardian Info</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No student records match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const assignedClass = classes.find((c) => c.id === student.classId);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* ID */}
                      <td className="px-4 py-3 font-mono font-medium text-slate-700">
                        {student.studentNumber}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {student.lastName}, {student.firstName} {student.middleName ? `${student.middleName[0]}.` : ''}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{student.email}</span>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="px-4 py-3 text-slate-700">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-medium">
                          {assignedClass?.name || 'Unassigned'}
                        </span>
                      </td>

                      {/* Gender */}
                      <td className="px-4 py-3 text-slate-600">
                        {student.gender}
                      </td>

                      {/* Guardian */}
                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-medium">{student.guardianName || '—'}</div>
                        {student.guardianPhone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{student.guardianPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            student.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : student.status === 'Transferred'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-md transition cursor-pointer"
                            title="Update Student Information"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingStudent(student)}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Delete Student Record"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Count footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
          <span>Showing {filteredStudents.length} of {students.length} students</span>
          <span>Christy Jean Academy Student Registry</span>
        </div>
      </div>

      {/* Add or Edit Modal */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm">
                  {editingStudent ? 'Update Student Record' : 'Add New Student'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
                    placeholder="e.g. Liam"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
                    placeholder="e.g. Del Rosario"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formData.middleName || ''}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-black bg-white"
                    placeholder="e.g. Santos"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student ID # *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentNumber || ''}
                    onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono text-black bg-white"
                    placeholder="STD-2026-XXXX"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender || 'Male'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-black bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Section *</label>
                  <select
                    value={formData.classId || classes[0]?.id}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-black bg-white"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enrollment Status</label>
                  <select
                    value={formData.status || 'Active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' | 'Transferred' })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-black bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Transferred">Transferred</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={formData.guardianName || ''}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-black bg-white"
                    placeholder="e.g. Maria Del Rosario"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Phone</label>
                  <input
                    type="text"
                    value={formData.guardianPhone || ''}
                    onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-black bg-white"
                    placeholder="e.g. +1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Email Address</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-black bg-white"
                  placeholder="student@christyjean.edu"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {editingStudent ? 'Save Changes' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Student Record</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900 font-semibold">
                {deletingStudent.firstName} {deletingStudent.lastName}
              </strong>{' '}
              ({deletingStudent.studentNumber})? This will remove their record from future attendance sheets.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
