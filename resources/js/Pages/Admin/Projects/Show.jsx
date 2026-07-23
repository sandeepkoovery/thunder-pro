import React, { useState, useEffect, useRef } from "react";
import { usePage, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { 
  Edit, 
  Trash2, 
  Calendar, 
  X, 
  ChevronDown, 
  Eye, 
  Briefcase, 
  MessageSquare,
  Clock,
  Users,
  CheckCircle2,
  ListTodo,
  MoreHorizontal
} from "lucide-react";
import axios from 'axios';
import toast from 'react-hot-toast';

const route = window.route;

// Helper function to format date to "15 Dec 2025"
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export default function Show() {
  const { project, tasks: initialTasks, users } = usePage().props;

  const dropdownRef = useRef(null);

  const [tasks, setTasks] = useState(initialTasks || []);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [openRowMenuId, setOpenRowMenuId] = useState(null);

  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    caption: "",
    thumb_text: "",
    description: "",
    assignee_ids: [],
    start_date: "",
    end_date: "",
    status: "not started",
    priority: "medium",
  });
  const [errors, setErrors] = useState({});

  const statusOrder = ["not started", "in progress", "on hold", "completed"];
  const columns = {
    "not started": "Open",
    "in progress": "Inprogress",
    "on hold": "On Hold",
    completed: "Completed",
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenRowMenuId(null);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => setTasks(initialTasks || []), [initialTasks]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAssigneeDropdownOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleAssigneeDropdown = () => {
    setIsAssigneeDropdownOpen(prev => !prev);
  }

  const openModal = (task = null) => {
    setIsAssigneeDropdownOpen(false);

    if (task) {
      setEditingTask(task);
      const currentAssigneeIds = Array.isArray(task.assignees)
        ? task.assignees.map(a => String(a.id))
        : [];

      setForm({
        name: task.name || "",
        caption: task.caption || "",
        thumb_text: task.thumb_text || "",
        description: task.description || "",
        assignee_ids: currentAssigneeIds,
        start_date: task.start_date ? task.start_date.split(' ')[0] : "",
        end_date: task.end_date ? task.end_date.split(' ')[0] : "",
        status: task.status || "not started",
        priority: task.priority || "medium",
      });
    } else {
      setEditingTask(null);
      setForm({
        name: "",
        caption: "",
        thumb_text: "",
        description: "",
        assignee_ids: [],
        start_date: "",
        end_date: "",
        status: "not started",
        priority: "medium",
      });
    }
    setErrors({});
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssigneeChange = (e) => {
    const { value, checked } = e.target;
    setForm((prev) => {
      const newAssigneeIds = checked
        ? [...prev.assignee_ids, value]
        : prev.assignee_ids.filter((id) => id !== value);

      return { ...prev, assignee_ids: newAssigneeIds };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Task name is required.";
    if (!form.start_date) newErrors.start_date = "Start date is required.";
    if (!form.end_date) newErrors.end_date = "End date is required.";
    if (form.start_date && form.end_date && form.end_date < form.start_date)
      newErrors.end_date = "End date cannot be before start date.";
    if (form.assignee_ids.length === 0) newErrors.assignee_ids = "At least one Assignee is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const routeName = editingTask
      ? route("admin.tasks.update", editingTask.id)
      : route("admin.tasks.store");

    const payload = editingTask
      ? { _method: "PUT", project_id: project.id, ...form }
      : { ...form, project_id: project.id };

    router.post(routeName, payload, {
      preserveScroll: true,
      onSuccess: (page) => {
        if (page.props?.tasks) setTasks(page.props.tasks);
        toast.success(editingTask ? "Task updated successfully!" : "Task created successfully!");
        closeModal();
      },
      onError: (err) => {
        toast.error("Failed to submit task");
      }
    });
  };

  const handleDelete = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!deleteTaskId) return;

    router.delete(route("admin.tasks.destroy", deleteTaskId), {
      preserveScroll: true,
      onSuccess: (page) => {
        if (page.props?.tasks) setTasks(page.props.tasks);
        toast.success("Task deleted successfully!");
        setDeleteTaskId(null);
      },
      onError: () => {
        toast.error("Failed to delete task.");
        setDeleteTaskId(null);
      }
    });
  };

  const getAvatarUrl = (user) => {
    const basePath = import.meta.env.VITE_BASE_URL;
    if (user?.image) {
      return user.image.startsWith("http")
        ? user.image
        : `${basePath}/storage/${user.image}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=random&color=fff`;
  };

  const getSelectedAssigneeNames = () => {
    const selectedUsers = users?.filter(u => form.assignee_ids.includes(String(u.id)));
    if (!selectedUsers || selectedUsers.length === 0) {
      return "Select Assignee(s)";
    }
    const names = selectedUsers.map(u => u.name);
    if (names.length > 2) {
      return `${names[0]}, ${names[1]} (+${names.length - 2} more)`;
    }
    return names.join(', ');
  }

  // Calculations for Stats Card
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  
  // Unique team members assigned to tasks
  const uniqueMembers = {};
  tasks.forEach(t => {
    if (Array.isArray(t.assignees)) {
      t.assignees.forEach(a => {
        uniqueMembers[a.id] = a;
      });
    }
  });
  const membersCount = Object.keys(uniqueMembers).length;
  const totalHours = totalTasks * 8; // Assumes 8 hours average per task to mock total hours

  // Status distributions
  const getStatusCount = (statusKey) => tasks.filter(t => t.status === statusKey).length;
  
  const statusColors = {
    "not started": "bg-sky-500",
    "in progress": "bg-amber-500",
    "on hold": "bg-rose-500",
    completed: "bg-green-500",
  };

  const tableStatusBadges = {
    "not started": "bg-sky-50 text-sky-600 border border-sky-100",
    "in progress": "bg-amber-50/70 text-amber-600 border border-amber-100/50",
    "on hold": "bg-rose-50 text-rose-600 border border-rose-100",
    completed: "bg-green-50 text-green-600 border border-green-100",
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 w-full space-y-6 font-sans">
        {/* Project Header Info */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{project?.name || "Project Details"}</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage details, task list, and trace progress coordinates</p>
          </div>
        </div>

        {/* 2-Tab Navigation selector */}
        <div className="flex bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {['Overview', 'Tasks'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-bold tracking-tight transition-all border-b-2 flex items-center justify-center gap-2 ${
                activeTab === tab 
                  ? "bg-indigo-50/50 border-indigo-600 text-indigo-600" 
                  : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
              }`}
              style={{ minHeight: '52px' }}
            >
              {tab === 'Overview' ? <Briefcase size={16} /> : <ListTodo size={16} />}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        {activeTab === "Overview" ? (
          <div className="space-y-6">
            {/* 4 Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Total Tasks */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <ListTodo size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-none mb-1">{totalTasks}</h3>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Tasks</span>
                </div>
              </div>

              {/* Card 2: Completed Tasks */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-none mb-1">{completedTasks}</h3>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Completed Tasks</span>
                </div>
              </div>

              {/* Card 3: Members */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-none mb-1">{membersCount}</h3>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Members</span>
                </div>
              </div>

              {/* Card 4: Total Hours */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-none mb-1">{totalHours}</h3>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Hours</span>
                </div>
              </div>
            </div>

            {/* Description & Task Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left description (2/3 width) */}
              <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm lg:col-span-2 space-y-4">
                <h2 className="text-[15px] font-bold text-gray-900 border-b border-gray-50 pb-3">Description</h2>
                <div className="text-sm text-gray-500 leading-relaxed space-y-4">
                  {project.description ? (
                    <p className="whitespace-pre-wrap">{project.description}</p>
                  ) : (
                    <p className="text-gray-400 italic">No project description provided yet.</p>
                  )}
                </div>
              </div>

              {/* Right Sidebar Column (1/3 width) */}
              <div className="space-y-6">
                {/* Task Status */}
                <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm space-y-5">
                  <h2 className="text-[15px] font-bold text-gray-900 border-b border-gray-50 pb-3">Task Status</h2>
                  
                  <div className="space-y-5">
                    {statusOrder.map(statusKey => {
                      const count = getStatusCount(statusKey);
                      const percent = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                      return (
                        <div key={statusKey} className="space-y-2">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-gray-600">{columns[statusKey]}</span>
                            <span className="text-gray-400">{String(count).padStart(2, '0')}/{String(totalTasks).padStart(2, '0')}</span>
                          </div>
                          <div className="w-full bg-gray-50 rounded-full h-2 overflow-hidden border border-gray-100/50">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${statusColors[statusKey] || 'bg-gray-400'}`} 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Project Team Card */}
                <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm space-y-5">
                  <h2 className="text-[15px] font-bold text-gray-900 border-b border-gray-50 pb-3">Project Team</h2>
                  
                  {Object.keys(uniqueMembers).length > 0 ? (
                    <div className="space-y-4">
                      {Object.values(uniqueMembers).map((member) => (
                        <div key={member.id} className="flex items-center gap-3">
                          {member.image ? (
                            <img 
                              src={member.image.startsWith('http') ? member.image : `/storage/${member.image}`} 
                              alt={member.name} 
                              className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-[13px] font-bold text-white uppercase border border-slate-100 shadow-sm">
                              {member.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-bold text-gray-900">{member.name}</div>
                            <div className="text-[11px] text-gray-400 font-medium capitalize">{member.designation || 'Team Member'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-gray-400 font-medium leading-relaxed">
                        No team members assigned yet.<br/>
                        <span className="text-[10px] text-slate-300 block mt-1">Assign tasks to users to automatically add them to the project team.</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Tasks List Tab Content */
          <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
            {/* Tab header */}
            <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-4">
              <h2 className="text-base font-bold text-gray-900">Tasks</h2>
              <button
                onClick={() => openModal()}
                className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm"
                style={{ minHeight: '40px' }}
              >
                + Add Task
              </button>
            </div>

            {/* Tasks Table */}
            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-wider text-left bg-gray-50/50">
                    <th className="p-4 w-12 text-center">
                      <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" disabled />
                    </th>
                    <th className="p-4">Task ID</th>
                    <th className="p-4">Task</th>
                    <th className="p-4">Assignee</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <tr key={task.id} className="text-gray-700 hover:bg-gray-50/40 transition-colors">
                        <td className="p-4 text-center">
                          <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        </td>
                        <td className="p-4 text-sm font-semibold text-indigo-600">
                          {`TS-${String(task.id).padStart(3, '0')}`}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-[15px] text-gray-900">{task.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5 font-medium">{formatDate(task.start_date) || "-"}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {Array.isArray(task.assignees) && task.assignees.map((user, i) => (
                              user.image ? (
                                <img 
                                  key={i} 
                                  src={getAvatarUrl(user)} 
                                  alt={user.name} 
                                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover shadow-sm" 
                                  title={user.name} 
                                />
                              ) : (
                                <div 
                                  key={i} 
                                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-indigo-500 flex items-center justify-center text-[8px] font-bold text-white uppercase shadow-sm"
                                  title={user.name}
                                >
                                  {user.name.charAt(0)}
                                </div>
                              )
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${tableStatusBadges[task.status] || 'bg-gray-100 text-gray-600'}`}>
                            {columns[task.status] || task.status}
                          </span>
                        </td>
                        <td className="p-4 text-center relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenRowMenuId(openRowMenuId === task.id ? null : task.id);
                            }}
                            className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            style={{ minHeight: '32px' }}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          {openRowMenuId === task.id && (
                            <div className="absolute right-4 top-12 w-32 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-30 text-left">
                              <Link href={route('admin.tasks.show', task.id)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                <Eye size={12} /> View Details
                              </Link>
                              <button onClick={() => openModal(task)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                <Edit size={12} /> Edit
                              </button>
                              <button onClick={() => setDeleteTaskId(task.id)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-400 italic text-sm">
                        No tasks registered for this project.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create / Edit Modal (Premium Studio Redesign) */}
        {isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center p-8 z-50 overflow-y-auto">
            <div className="bg-white rounded-[24px] shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)] w-full max-w-2xl mt-10 overflow-hidden border border-slate-100 ring-1 ring-slate-900/5 transition-all">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    {editingTask ? "Edit Task" : "Add Task"}
                  </h2>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">Configure task attributes and parameters</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 px-0.5">Task Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={`w-full bg-slate-50/50 border border-slate-150 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 ${errors.name ? "border-red-200 ring-2 ring-red-50/50" : ""}`}
                    placeholder="Enter task name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs font-semibold tracking-tight mt-1.5 px-1">{errors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 px-0.5">Caption (optional)</label>
                    <input
                      type="text"
                      name="caption"
                      value={form.caption}
                      onChange={handleChange}
                      className="w-full bg-slate-50/50 border border-slate-150 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                      placeholder="Brief caption"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 px-0.5">Thumb Text (optional)</label>
                    <input
                      type="text"
                      name="thumb_text"
                      value={form.thumb_text}
                      onChange={handleChange}
                      className="w-full bg-slate-50/50 border border-slate-150 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                      placeholder="Short thumb text"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 px-0.5">Task Description</label>
                  <textarea
                    name="description"
                    value={form.description || ""}
                    onChange={handleChange}
                    className={`w-full bg-slate-50/50 border border-slate-150 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[100px] placeholder:text-slate-400 resize-none`}
                    rows="3"
                    placeholder="Enter detailed task description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 px-0.5">Assignees</label>
                    <div ref={dropdownRef} className="relative">
                      <button
                        type="button"
                        onClick={toggleAssigneeDropdown}
                        className={`w-full flex justify-between items-center bg-slate-50/50 px-4 py-3 text-left border border-slate-150 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all ${errors.assignee_ids ? "border-red-200 ring-2 ring-red-50/50" : ""}`}
                      >
                        <span className="truncate pr-4 text-slate-800 text-sm font-medium">
                          {getSelectedAssigneeNames()}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isAssigneeDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                      </button>

                      {isAssigneeDropdownOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-150 rounded-xl shadow-2xl max-h-60 overflow-y-auto p-2 space-y-1">
                          {users?.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center p-2.5 hover:bg-slate-50 rounded-lg transition cursor-pointer group"
                              onClick={() => {
                                const syntheticEvent = { target: { value: String(user.id), checked: !form.assignee_ids.includes(String(user.id)) } };
                                handleAssigneeChange(syntheticEvent);
                              }}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${form.assignee_ids.includes(String(user.id)) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-200 group-hover:border-gray-300'}`}>
                                {form.assignee_ids.includes(String(user.id)) && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                              <label className="ml-3 text-xs font-semibold text-slate-700 flex items-center flex-grow cursor-pointer">
                                <img
                                  src={getAvatarUrl(user)}
                                  alt="avatar"
                                  className="w-6 h-6 rounded-full border border-white shadow-sm mr-2.5 object-cover"
                                />
                                {user.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.assignee_ids && (
                      <p className="text-red-500 text-xs font-semibold mt-1.5 px-1">{errors.assignee_ids}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 px-0.5">Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full bg-slate-50/50 border border-slate-150 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      {statusOrder.map((status) => (
                        <option key={status} value={status}>
                          {columns[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 px-0.5">Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                      <input
                        type="date"
                        name="start_date"
                        value={form.start_date}
                        onChange={handleChange}
                        className={`w-full bg-slate-50/50 border border-slate-150 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all ${errors.start_date ? "border-red-200 ring-2 ring-red-50/50" : ""}`}
                      />
                    </div>
                    {errors.start_date && (
                      <p className="text-red-500 text-xs font-semibold mt-1.5 px-1">{errors.start_date}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 px-0.5">End Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                      <input
                        type="date"
                        name="end_date"
                        value={form.end_date}
                        onChange={handleChange}
                        className={`w-full bg-slate-50/50 border border-slate-150 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all ${errors.end_date ? "border-red-200 ring-2 ring-red-50/50" : ""}`}
                      />
                    </div>
                    {errors.end_date && (
                      <p className="text-red-500 text-xs font-semibold mt-1.5 px-1">{errors.end_date}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 px-0.5">Priority</label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-150 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-6 text-sm font-semibold text-white bg-slate-900 hover:bg-black rounded-xl shadow-[0_10px_20px_-10px_rgba(15,23,42,0.4)] transition-all active:scale-[0.98]"
                  >
                    {editingTask ? "Save Changes" : "Create Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteTaskId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-[24px] shadow-2xl w-full max-w-sm text-center border-t-4 border-red-500">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Delete Task?</h2>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed px-4">This action cannot be undone. This task will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTaskId(null)} className="flex-1 py-3 text-sm font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
                  Cancel
                </button>
                <button onClick={handleDelete} className="flex-1 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}