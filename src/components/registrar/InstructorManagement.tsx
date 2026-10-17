import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import { getUsers, saveUser, deleteUser } from '../../storage';
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
  Phone,
  Building2,
  Award,
  IdCard,
  KeyRound,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface InstructorManagementProps {
  onDataChanged?: () => void;
}

export function InstructorManagement({ onDataChanged }: InstructorManagementProps) {
  const [users, setUsers] = useState<User[]>(() => getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<User>>({
    fullName: '',
    username: '',
    password: '',
    department: 'Department of Computing Studies',
    title: 'Instructor',
    email: '',
    mobileNumber: '',
    employeeId: '',
    role: 'Instructor',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refreshData = () => {
    const updated = getUsers();
    setUsers(updated);
    if (onDataChanged) onDataChanged();
  };

  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [users]);

  // Filtered Faculty
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDept = deptFilter === 'ALL' || u.department === deptFilter;

      return matchesSearch && matchesDept;
    });
  }, [users, searchTerm, deptFilter]);

  // Open Add Modal
  const handleOpenAdd = () => {
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      fullName: '',
      username: '',
      password: 'password123',
      department: 'Department of Education',
      title: 'Instructor',
      email: '',
      mobileNumber: '',
      employeeId: `FAC-${new Date().getFullYear()}-${nextNum}`,
      role: 'Visiting Lecturer',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      ...user,
      password: user.password || '',
    });
    setFormError(null);
  };

  // Save (Create or Update)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.fullName?.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!formData.username?.trim()) {
      setFormError('Username is required.');
      return;
    }
    if (!formData.email?.trim() || !formData.email.includes('@')) {
      setFormError('A valid institutional email is required.');
      return;
    }

    // Check duplicate username if new or changed
    const cleanUsername = formData.username.trim().toLowerCase();
    const existing = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername &&
        (!editingUser || u.id !== editingUser.id)
    );
    if (existing) {
      setFormError(`Username "${cleanUsername}" is already taken by another user.`);
      return;
    }

    if (editingUser) {
      // Update existing
      const updated: User = {
        ...editingUser,
        fullName: formData.fullName.trim(),
        username: cleanUsername,
        password: formData.password || editingUser.password || 'password123',
        department: formData.department?.trim() || 'Department of Computing Studies',
        title: formData.title?.trim() || 'Instructor',
        email: formData.email.trim(),
        mobileNumber: formData.mobileNumber?.trim(),
        employeeId: formData.employeeId?.trim(),
        role: formData.role || editingUser.role,
      };

      saveUser(updated);
      setEditingUser(null);
      setFeedback(`Successfully updated ${updated.fullName} in database.`);
    } else {
      // Create new
      const newUser: User = {
        id: `user-inst-${Date.now()}`,
        fullName: formData.fullName.trim(),
        username: cleanUsername,
        password: formData.password || 'password123',
        department: formData.department?.trim() || 'Department of Education',
        title: formData.title?.trim() || 'Instructor',
        email: formData.email.trim(),
        mobileNumber: formData.mobileNumber?.trim() || '09170000000',
        employeeId: formData.employeeId?.trim() || `FAC-${new Date().getFullYear()}-001`,
        role: 'instructor',
        createdAt: new Date().toISOString(),
      };

      saveUser(newUser);
      setIsAddModalOpen(false);
      setFeedback(`Successfully added ${newUser.fullName} and synced to Supabase database.`);
    }

    refreshData();
    setTimeout(() => setFeedback(null), 4000);
  };

  // Delete Action
  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    const res = deleteUser(deletingUser.id);
    if (res.success) {
      setFeedback(`Removed ${deletingUser.fullName} from system.`);
      setDeletingUser(null);
      refreshData();
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFormError(res.error || 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {feedback && (
        <div className="bg-[#1cd4bc]/10 border border-[#1cd4bc]/30 text-[#1cd4bc] px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Faculty &amp; Instructor Directory</span>
            <span className="text-[11px] font-mono font-normal px-2.5 py-0.5 rounded-full bg-[#1cd4bc]/10 text-[#1cd4bc] border border-[#1cd4bc]/20">
              Supabase Connected
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Admin CRUD controls for faculty accounts, roles, and classroom teaching credentials
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1cd4bc] to-[#0ea5e9] text-[#050c16] rounded-2xl text-xs font-bold shadow-[0_0_20px_rgba(28,212,188,0.3)] hover:brightness-110 active:scale-98 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Instructor</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0b1220] border border-slate-800 p-4 rounded-3xl">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by instructor name, username, email, or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#050a12] border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#1cd4bc] transition"
          />
        </div>

        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#050a12] border border-slate-700/80 rounded-2xl text-xs text-slate-200 focus:outline-hidden focus:border-[#1cd4bc] transition"
          >
            <option value="ALL">All Departments ({departments.length})</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-[#0b1220] border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-lg flex flex-col justify-between transition group relative"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0e3a5a] text-[#1cd4bc] border border-[#1cd4bc]/30 flex items-center justify-center font-bold text-base shadow-inner">
                    {user.fullName ? user.fullName[0] : 'I'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight group-hover:text-[#1cd4bc] transition-colors">
                      {user.fullName}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      @{user.username}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    user.role === 'registrar'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {user.role}
                </span>
              </div>

              {/* Info Details */}
              <div className="space-y-2 text-xs divide-y divide-slate-800/60 pb-3">
                <div className="pt-2 flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Department:</span>
                  </span>
                  <span className="text-white font-medium truncate max-w-[150px]">
                    {user.department || 'N/A'}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-500" />
                    <span>Title:</span>
                  </span>
                  <span className="text-white font-medium truncate max-w-[150px]">
                    {user.title || 'Instructor'}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Email:</span>
                  </span>
                  <span className="text-white font-mono text-[11px] truncate max-w-[160px]">
                    {user.email || 'N/A'}
                  </span>
                </div>

                {user.mobileNumber && (
                  <div className="pt-2 flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Mobile:</span>
                    </span>
                    <span className="text-white font-mono text-[11px]">
                      {user.mobileNumber}
                    </span>
                  </div>
                )}

                {user.employeeId && (
                  <div className="pt-2 flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <IdCard className="w-3.5 h-3.5 text-slate-500" />
                      <span>Employee ID:</span>
                    </span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {user.employeeId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleOpenEdit(user)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-[#1cd4bc]" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => setDeletingUser(user)}
                disabled={user.role === 'registrar' && users.filter((u) => u.role === 'registrar').length <= 1}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No instructors or faculty found matching current criteria.
          </div>
        )}
      </div>

      {/* ADD / EDIT INSTRUCTOR MODAL */}
      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0b1220] border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingUser(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-[#1cd4bc]/20 text-[#1cd4bc] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingUser ? 'Edit Faculty Account' : 'Register New Instructor'}
                </h3>
                <p className="text-xs text-slate-400">
                  Data will be securely saved and synced to the Supabase database
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ms. Angel Gumantason"
                    value={formData.fullName || ''}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050a12] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-[#1cd4bc] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. angelko"
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050a12] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-[#1cd4bc] focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Department of SSG"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050a12] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-[#1cd4bc] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Academic Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Visiting Lecturer"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050a12] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-[#1cd4bc] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. angelko@gmail.com.edu"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050a12] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-[#1cd4bc] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09171234567"
                    value={formData.mobileNumber || ''}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050a12] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-[#1cd4bc] focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FAC-2026-102"
                    value={formData.employeeId || ''}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050a12] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-[#1cd4bc] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Login Password
                  </label>
                  <input
                    type="text"
                    placeholder="password123"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-[#050a12] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-[#1cd4bc] focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2.5 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold bg-[#1cd4bc] hover:bg-[#1cd4bc]/90 text-[#050c16] shadow-md transition cursor-pointer"
                >
                  {editingUser ? 'Save Changes' : 'Create Instructor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0b1220] border border-rose-500/30 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Remove Faculty Member?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Are you sure you want to delete <strong>{deletingUser.fullName}</strong> (@{deletingUser.username})? This action will remove their account and delete the record from Supabase.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
