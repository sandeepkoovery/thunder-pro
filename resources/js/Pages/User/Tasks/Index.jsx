import React, { useState, useEffect } from "react";
// Import 'route' from the global window object or ensure it's accessible via window
const route = window.route;
import { usePage, router, Link } from "@inertiajs/react";
import UserLayout from "@/Layouts/UserLayout";
import { Edit, Calendar, X, Eye, Briefcase, MessageSquare } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

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

export default function UserTasks() {
  const { tasks, users } = usePage().props;

  // Normalize incoming tasks (support array, paginated object, or undefined)
  const initialTasks = Array.isArray(tasks)
    ? tasks
    : Array.isArray(tasks?.data)
      ? tasks.data
      : [];

  const [taskList, setTaskList] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    setTaskList(
      Array.isArray(tasks)
        ? tasks
        : Array.isArray(tasks?.data)
          ? tasks.data
          : []
    );
  }, [tasks]);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setFade(true);
        setTimeout(() => setShowSuccess(false), 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

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
  const priorityColors = {
    'High': 'text-red-600',
    'Medium': 'text-yellow-600',
    'Low': 'text-green-600',
  };

  // Robust parse for draggableId - ensures we get a numeric ID
  const parseDraggableId = (draggableId) => {
    if (!draggableId) return null;
    // Handles both 'task-123' and '123'
    const maybeId = String(draggableId).split("-").pop();
    const n = Number(maybeId);
    return Number.isNaN(n) ? null : n;
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (
      !destination ||
      (source.droppableId === destination.droppableId && source.index === destination.index)
    ) {
      return;
    }

    const sourceStatus = source.droppableId;
    const destinationStatus = destination.droppableId;

    const taskId = parseDraggableId(draggableId);

    // CRITICAL CHECK: Ensure taskId is valid before proceeding
    if (!taskId) {
      console.error("Could not parse valid taskId from draggableId:", draggableId);
      return;
    }

    const draggedTask = taskList.find((t) => Number(t.id) === taskId);
    if (!draggedTask || sourceStatus === destinationStatus) return;

    // Optimistic update
    const originalTaskList = [...taskList];
    const newTaskList = taskList.map((task) =>
      Number(task.id) === taskId ? { ...task, status: destinationStatus } : task
    );
    setTaskList(newTaskList);

    // 🎯 FIX: Use the route() helper to generate the URL
    const updateUrl = route('tasks.updateStatus', taskId);

    // Using POST with method spoofing
    router.post(
      updateUrl,
      {
        status: destinationStatus,
        _method: 'put',
      },
      {
        // Inertia options:
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setShowSuccess(true);
          setFade(false);
        },
        onError: (errors) => {
          console.error("Status update failed:", errors);
          setTaskList(originalTaskList); // Revert optimistic update
          alert("Failed to update task status. Please try again.");
        },
      }
    );
  };

  const handleModalStatusUpdate = (e) => {
    e.preventDefault();

    if (!selectedTask) return;

    const taskId = selectedTask.id;
    const statusToUpdate = newStatus;

    // Optimistic update for the modal change
    const originalTaskList = [...taskList];
    const newTaskList = taskList.map((task) =>
      Number(task.id) === taskId ? { ...task, status: statusToUpdate } : task
    );
    setTaskList(newTaskList);
    setSelectedTask(null); // Close modal

    // 🎯 FIX: Use the route() helper to generate the URL
    const updateUrl = route('tasks.updateStatus', taskId);

    // Using POST with method spoofing
    router.post(
      updateUrl,
      {
        status: statusToUpdate,
        _method: 'put',
      },
      {
        // Inertia options:
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setShowSuccess(true);
          setFade(false);
        },
        onError: (errors) => {
          console.error("Status update failed:", errors);
          setTaskList(originalTaskList); // Revert optimistic update
          alert("Failed to update task status in modal. Please try again.");
        },
      }
    );
  };


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

  const grouped = statusOrder.reduce((acc, key) => {
    const priorityMap = { high: 1, medium: 2, low: 3 };
    acc[key] = taskList
      .filter((t) => (t.status || "").toLowerCase() === key)
      .sort((a, b) => {
        const pA = priorityMap[a.priority?.toLowerCase()] || 4;
        const pB = priorityMap[b.priority?.toLowerCase()] || 4;
        if (pA !== pB) return pA - pB;
        return Number(b.id) - Number(a.id); // Secondary sort by latest ID
      });
    return acc;
  }, {});

  return (
    <UserLayout title="My Tasks">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">My Tasks</h1>

        {showSuccess && (
          <div
            className={`mb-4 flex justify-between items-center bg-green-100 text-green-700 px-4 py-2 rounded-lg border border-green-400 transition-opacity duration-500 ${fade ? "opacity-0" : "opacity-100"
              }`}
          >
            <span>Task status updated successfully!</span>
            <button
              onClick={() => {
                setShowSuccess(false);
                setFade(false);
              }}
              className="text-green-700 hover:text-green-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-scroll-area">
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
                            <Draggable key={task.id} draggableId={`task-${task.id}`} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-4 rounded-xl shadow-sm border border-slate-100 ${bgByStatus[task.status] || "bg-white"} hover:shadow-md transition cursor-grab ${snapshot.isDragging ? "shadow-xl ring-2 ring-blue-500" : ""}`}
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <span className="text-[12px] font-medium text-slate-400">
                                      {formatDate(task.start_date) || "-"}
                                    </span>
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

                                  <div className="flex justify-between items-start mb-3">
                                    <Link href={route('tasks.show', task.id)} className="text-[15px] font-bold text-slate-700 leading-snug hover:text-blue-600 transition">
                                      {task.name || "Untitled Task"}
                                    </Link>
                                    <div className="flex gap-1">
                                      <Link
                                        href={route('tasks.show', task.id)}
                                        className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-white/50"
                                        title="View Details"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </Link>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTask(task);
                                          setNewStatus(task.status || "not started");
                                        }}
                                        className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-white/50"
                                        title="Edit Status"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Project and Comments */}
                                  <div className="flex items-center gap-4 mb-4 text-[13px] text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                      <Briefcase size={14} className="text-slate-400" />
                                      <span className="font-medium">{task.project?.name}</span>
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
                          <p className="text-gray-400 text-sm p-4 border border-dashed rounded-xl text-center">No tasks</p>
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
      </div>
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden border-t-4 border-blue-600">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-2xl font-bold text-gray-800 flex-1">
                {selectedTask.name || "Task Details"}
              </h2>
              <span className="text-sm font-medium text-blue-600 ml-3 whitespace-nowrap">
                {(() => {
                  const now = new Date();
                  const end = new Date(selectedTask.end_date);
                  now.setHours(0, 0, 0, 0);
                  end.setHours(0, 0, 0, 0);
                  const diffDays = Math.ceil(
                    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  if (diffDays < 0) return "Overdue";
                  if (diffDays === 0) return "Due today";
                  return `${diffDays} days remaining`;
                })()}
              </span>
              <button
                onClick={() => setSelectedTask(null)}
                className="ml-4 text-gray-400 hover:text-red-500 transition"
                title="Close"
              >
                <X size={22} />
              </button>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleModalStatusUpdate} className="flex flex-col flex-1">
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  {/* Description Scrollable */}
                  <div>
                    <label className="block text-gray-600 mb-1 font-semibold">
                      Description
                    </label>
                    <div className="bg-gray-50 p-3 rounded-lg border max-h-40 overflow-y-auto text-sm whitespace-pre-wrap">
                      {selectedTask.description || "No description provided."}
                    </div>
                  </div>

                  {/* Priority, Dates, Status */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-gray-600 mb-1 font-semibold">
                        Priority
                      </label>
                      <p
                        className={`font-bold p-3 rounded-lg border bg-gray-50 ${priorityColors[selectedTask.priority] || "text-gray-600"
                          }`}
                      >
                        {selectedTask.priority || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-semibold">
                        Start Date
                      </label>
                      <p className="font-medium p-3 rounded-lg border bg-gray-50">
                        {formatDate(selectedTask.start_date)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-semibold">
                        End Date
                      </label>
                      <p className="font-medium p-3 rounded-lg border bg-gray-50">
                        {formatDate(selectedTask.end_date)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-semibold">
                        Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full p-3 rounded-lg border-2 border-blue-300 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-gray-50"
                      >
                        <option value="not started">To Do</option>
                        <option value="in progress">In Progress</option>
                        <option value="on hold">On Hold</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer (Buttons only) */}
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .kanban-scroll-area {
          overflow-x: auto;
          overflow-y: hidden;
          width: 100%;
          padding-bottom: 1rem;
          scrollbar-width: thin;
          scrollbar-color: #9ca3af transparent;
        }
        .kanban-scroll-area::-webkit-scrollbar { height: 8px; }
        .kanban-scroll-area::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .kanban-scroll-area::-webkit-scrollbar-track { background: transparent; }

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
    </UserLayout>
  );
}
