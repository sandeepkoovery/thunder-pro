import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { usePage, router, Link } from "@inertiajs/react";
import axios from 'axios';
import AdminLayout from "@/Layouts/AdminLayout";
import { Edit, Trash2, Calendar, X, ChevronDown, Eye, Briefcase, MessageSquare } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

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

  // Ref for the custom assignee dropdown to handle outside clicks
  const dropdownRef = useRef(null);

  const [tasks, setTasks] = useState(initialTasks || []);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fade, setFade] = useState(false);

  // 💡 NEW STATE for dropdown visibility
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
    "not started": "TODO",
    "in progress": "IN PROGRESS",
    "on hold": "ON HOLD",
    completed: "COMPLETED",
  };

  const bgByStatus = {
    "not started": "bg-blue-100",
    "in progress": "bg-green-100",
    "on hold": "bg-orange-100",
    completed: "bg-gray-200",
  };

  // Synchronize local tasks state when initialTasks prop changes
  useEffect(() => setTasks(initialTasks || []), [initialTasks]);

  // Handle success message fading
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setFade(true);
        setTimeout(() => setShowSuccess(false), 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Handle click outside to close the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAssigneeDropdownOpen(false);
      }
    }
    // Only add listener if the modal is open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // 💡 Function to toggle the custom dropdown
  const toggleAssigneeDropdown = () => {
    setIsAssigneeDropdownOpen(prev => !prev);
  }

  const openModal = (task = null) => {
    // Reset dropdown state
    setIsAssigneeDropdownOpen(false);

    if (task) {
      setEditingTask(task);

      // 💡 FIX 1A: Extract IDs from the 'assignees' relationship array
      const currentAssigneeIds = Array.isArray(task.assignees)
        ? task.assignees.map(a => String(a.id)) // Map the User objects to string IDs
        : [];

      setForm({
        name: task.name || "",
        caption: task.caption || "",
        thumb_text: task.thumb_text || "",
        description: task.description || "",
        assignee_ids: currentAssigneeIds, // <-- Now uses the mapped IDs
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

  // Handler for multi-select checkboxes (used inside the dropdown)
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
        setShowSuccess(true);
        setFade(false);
        closeModal();
      },
    });
  };

  const handleDelete = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!deleteTaskId) return;

    const url = route("admin.tasks.destroy", deleteTaskId);

    router.delete(url, {
      preserveScroll: true,
      onSuccess: () => {
        // Modal closing handled by onFinish
      },
      onError: (errors) => {
        console.error("Delete failed:", errors);
        alert("Failed to delete task. Please try again.");
      },
      onFinish: () => {
        setDeleteTaskId(null);
      },
    });
  };

  const grouped = statusOrder.reduce((acc, key) => {
    acc[key] = tasks
      .filter((t) => (t.status || "").toLowerCase() === key)
      .sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const pA = priorityWeight[(a.priority || "medium").toLowerCase()] || 0;
        const pB = priorityWeight[(b.priority || "medium").toLowerCase()] || 0;
        return pB - pA; // Descending order
      });
    return acc;
  }, {});

  const getAssigneeUsers = (task) => {
    if (Array.isArray(task.assignees) && task.assignees.length > 0) {
      return task.assignees;
    }
    return [];
  };

  const getAvatarUrl = (user) => {
    const basePath = import.meta.env.VITE_BASE_URL;

    if (user?.image) {
      return user.image.startsWith("http")
        ? user.image
        : `${basePath}/storage/${user.image}`;
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.name || "U"
    )}&background=random&color=fff`;
  };

  // Drag and Drop Handler remains unchanged
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    const sourceStatus = source.droppableId;
    const destinationStatus = destination.droppableId;
    const taskId = parseInt(draggableId.split('-')[1]);
    const draggedTask = tasks.find(t => t.id === taskId);

    if (!draggedTask) return;

    // 1. Optimistic UI Update (Save the original state for rollback)
    const originalTasks = [...tasks];
    const newTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status: destinationStatus } : task
    );
    setTasks(newTasks);

    // 2. Persist Change to the Backend using Axios
    if (sourceStatus !== destinationStatus) {
      axios.put(route("admin.tasks.status", taskId), {
        status: destinationStatus
      })
        .then(response => {
          setShowSuccess(true);
          setFade(false);
        })
        .catch(error => {
          setTasks(originalTasks);
          alert("Failed to update task status. Please check server logs.");
          console.error("Status update failed:", error);
        });
    }
  };

  // Helper to get selected user names for display in the dropdown header
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


  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {project?.name || "Project"}
          </h1>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            + Add Task
          </button>
        </div>

        {/* ✅ Success Message */}
        {showSuccess && (
          <div
            className={`mb-4 flex justify-between items-center bg-green-100 text-green-700 px-4 py-2 rounded-lg border border-green-400 transition-opacity duration-500 ${fade ? "opacity-0" : "opacity-100"
              }`}
          >
            <span>Task status updated successfully!</span>
            <button
              onClick={() => { setShowSuccess(false); setFade(false); }}
              className="text-green-700 hover:text-green-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Kanban Context */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max">
              {statusOrder.map((statusKey) => (
                <Droppable droppableId={statusKey} key={statusKey}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-shrink-0 w-[320px] rounded-2xl shadow-sm p-5 bg-white ${snapshot.isDraggingOver ? "bg-slate-50" : ""}`}
                    >
                      <h2 className="text-[13px] font-bold mb-4 text-slate-600 uppercase tracking-wider">
                        {columns[statusKey]} ({grouped[statusKey].length})
                      </h2>

                      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 280px)', minHeight: '100px' }}>
                        {grouped[statusKey].length > 0 ? (
                          grouped[statusKey].map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={`task-${task.id}`}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-4 rounded-xl shadow-sm border border-slate-100 ${bgByStatus[task.status] || "bg-white"} hover:shadow-md transition cursor-pointer ${snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500' : ''}`}
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <span className="text-[12px] font-medium text-slate-400">
                                      {formatDate(task.start_date) || "-"}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <Link
                                        href={route('admin.tasks.show', task.id)}
                                        className="text-gray-400 hover:text-green-600 p-1 rounded-full hover:bg-white/50"
                                        title="View Details"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </Link>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); openModal(task); }}
                                        className="text-gray-400 hover:text-blue-700 p-1 rounded-full hover:bg-white/50"
                                        title="Edit Task"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteTaskId(task.id); }}
                                        className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-white/50"
                                        title="Delete Task"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-[15px] font-bold text-slate-700 leading-snug">
                                      {task.name}
                                    </h3>
                                    <span
                                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${task.priority === "high"
                                        ? "bg-red-50 text-red-500"
                                        : task.priority === "medium"
                                          ? "bg-orange-50 text-orange-400"
                                          : "bg-green-50 text-green-400"
                                        }`}
                                    >
                                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                    </span>
                                  </div>

                                  {/* Project and Comments */}
                                  <div className="flex items-center gap-4 mb-4 text-[13px] text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                      <Briefcase size={14} className="text-slate-400" />
                                      <span className="font-medium">{project.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <MessageSquare size={14} className="text-slate-400" />
                                      <span className="font-medium">{task.comments_count || 0} Comments</span>
                                    </div>
                                  </div>

                                  {/* Assignees */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex -space-x-2 overflow-hidden">
                                      {getAssigneeUsers(task).slice(0, 4).map((user) => (
                                        <img
                                          key={user.id}
                                          src={getAvatarUrl(user)}
                                          alt={user.name}
                                          className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm transition hover:z-10 hover:scale-110"
                                          title={user.name}
                                        />
                                      ))}
                                      {getAssigneeUsers(task).length > 4 && (
                                        <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm">
                                          +{getAssigneeUsers(task).length - 4}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm p-4 border border-dashed rounded-xl text-center">
                            No tasks in this column.
                          </p>
                        )}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>
        </DragDropContext>

        {/* ✅ Add/Edit Modal */}
        {isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-start justify-center p-8 z-50 overflow-y-auto">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl mt-10 overflow-hidden border border-slate-100 ring-1 ring-slate-900/5 transition-all">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {editingTask ? "Edit Task" : "Add Task"}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Project task coordination</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2.5 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all active:scale-90"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-0.5">Task</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={`w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-base font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all placeholder:text-slate-200 ${errors.name ? "border-red-200 ring-2 ring-red-50/50" : ""}`}
                    placeholder="Enter task name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-[10px] font-bold tracking-tight uppercase mt-2 px-1">{errors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-0.5">Caption (optional)</label>
                    <input
                      type="text"
                      name="caption"
                      value={form.caption}
                      onChange={handleChange}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-base font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all placeholder:text-slate-200"
                      placeholder="Brief caption"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-0.5">Thumb Text (optional)</label>
                    <input
                      type="text"
                      name="thumb_text"
                      value={form.thumb_text}
                      onChange={handleChange}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-base font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all placeholder:text-slate-200"
                      placeholder="Short thumb text"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-0.5">Operational Brief</label>
                  <textarea
                    name="description"
                    value={form.description || ""}
                    onChange={handleChange}
                    className={`w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-base font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all min-h-[120px] placeholder:text-slate-200 resize-none ${errors.description ? "border-red-200 ring-2 ring-red-50/50" : ""}`}
                    rows="4"
                    placeholder="Enter detailed task description..."
                  />
                  {errors.description && (
                    <p className="text-red-500 text-[10px] font-bold tracking-tight uppercase mt-2 px-1">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-0.5">Assignees</label>
                    <div ref={dropdownRef} className="relative">
                      <button
                        type="button"
                        onClick={toggleAssigneeDropdown}
                        className={`w-full flex justify-between items-center bg-slate-50/50 px-6 py-4 text-left border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-100 focus:border-slate-300 focus:bg-white outline-none transition-all ${errors.assignee_ids ? "border-red-200 ring-2 ring-red-50/50" : ""}`}
                      >
                        <span className="truncate pr-4 text-slate-900 text-base font-bold">
                          {getSelectedAssigneeNames()}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform duration-200 ${isAssigneeDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                      </button>

                      {isAssigneeDropdownOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-2 space-y-1">
                          {users?.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition cursor-pointer group"
                              onClick={() => {
                                const syntheticEvent = { target: { value: String(user.id), checked: !form.assignee_ids.includes(String(user.id)) } };
                                handleAssigneeChange(syntheticEvent);
                              }}
                            >
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.assignee_ids.includes(String(user.id)) ? 'bg-slate-900 border-slate-900' : 'border-slate-200 group-hover:border-slate-300'}`}>
                                {form.assignee_ids.includes(String(user.id)) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <label
                                className="ml-3 text-sm font-bold text-slate-700 flex items-center flex-grow cursor-pointer"
                              >
                                <img
                                  src={getAvatarUrl(user)}
                                  alt="avatar"
                                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm mr-3 object-cover"
                                />
                                {user.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.assignee_ids && (
                      <p className="text-red-500 text-[10px] font-bold tracking-tight uppercase mt-2 px-1">{errors.assignee_ids}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-0.5">Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-700 focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all appearance-none cursor-pointer"
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
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-0.5">Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="date"
                        name="start_date"
                        value={form.start_date}
                        onChange={handleChange}
                        className={`w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-base font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all ${errors.start_date ? "border-red-200 ring-2 ring-red-50/50" : ""}`}
                      />
                    </div>
                    {errors.start_date && (
                      <p className="text-red-500 text-[10px] font-bold tracking-tight uppercase mt-2 px-1">{errors.start_date}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-0.5">End Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="date"
                        name="end_date"
                        value={form.end_date}
                        onChange={handleChange}
                        className={`w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-base font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all ${errors.end_date ? "border-red-200 ring-2 ring-red-50/50" : ""}`}
                      />
                    </div>
                    {errors.end_date && (
                      <p className="text-red-500 text-[10px] font-bold tracking-tight uppercase mt-2 px-1">{errors.end_date === "End date cannot be before start date." ? "Must be on or after start date" : errors.end_date}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-0.5">Priority</label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-700 focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all appearance-none cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="flex gap-4 mt-6 pt-10 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-slate-400 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98]"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 px-10 text-sm font-black uppercase tracking-[0.2em] text-white bg-slate-900 hover:bg-black rounded-2xl shadow-[0_10px_20px_-10px_rgba(15,23,42,0.4)] transition-all active:scale-[0.98]"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Deletion</h2>
              <p className="mb-6 text-gray-700">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteTaskId(null)}
                  className="px-5 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-md font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </AdminLayout>
  );
}