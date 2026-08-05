import React, { useState, useEffect } from "react";
import { Head, Link, usePage, router } from "@inertiajs/react";
import UserLayout from "@/Layouts/UserLayout";
import { 
  Briefcase, 
  ListTodo, 
  CheckCircle2, 
  Users, 
  Clock, 
  Eye, 
  Search, 
  Inbox,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

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
  const { tasks, filters = {}, auth } = usePage().props;

  // Initialize activeTab from URL search query parameter 'tab'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || filters.tab || "Overview";
  });

  const [search, setSearch] = useState(filters.q || "");
  const [statusFilter, setStatusFilter] = useState(filters.status || "all");
  const [priorityFilter, setPriorityFilter] = useState(filters.priority || "all");

  const taskData = Array.isArray(tasks?.data) ? tasks.data : Array.isArray(tasks) ? tasks : [];

  const statusOrder = ["not started", "in progress", "on hold", "completed"];
  const columns = {
    "not started": "Open",
    "in progress": "Inprogress",
    "on hold": "On Hold",
    completed: "Completed",
  };

  const statusColors = {
    "not started": "bg-sky-500",
    "in progress": "bg-amber-500",
    "on hold": "bg-rose-500",
    completed: "bg-green-500",
  };

  const tableStatusBadges = {
    "not started": "bg-sky-50 text-sky-600 border border-sky-100/50",
    "in progress": "bg-amber-50/70 text-amber-600 border border-amber-100/50",
    "on hold": "bg-rose-50 text-rose-600 border border-rose-100/50",
    completed: "bg-emerald-50 text-emerald-600 border border-emerald-100/50",
  };

  // Switch Tab and update URL query param without triggering full page reload
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  // Helper to preserve active tab in pagination links
  const getPaginationUrl = (url) => {
    if (!url) return "#";
    try {
      const parsedUrl = new URL(url, window.location.origin);
      parsedUrl.searchParams.set("tab", activeTab);
      return parsedUrl.pathname + parsedUrl.search;
    } catch (e) {
      return url;
    }
  };

  // Stats Calculations
  const totalTasks = taskData.length;
  const completedTasks = taskData.filter((t) => t.status === "completed").length;
  const getStatusCount = (statusKey) => taskData.filter((t) => t.status === statusKey).length;

  // Team Members
  const uniqueMembers = {};
  taskData.forEach((t) => {
    if (Array.isArray(t.assignees)) {
      t.assignees.forEach((a) => {
        uniqueMembers[a.id] = a;
      });
    }
  });
  if (auth?.user) {
    uniqueMembers[auth.user.id] = auth.user;
  }
  const membersCount = Object.keys(uniqueMembers).length;
  const totalHours = totalTasks * 8;

  const handleStatusUpdate = (taskId, newStatus) => {
    router.put(
      route("tasks.updateStatus", taskId),
      { status: newStatus },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success("Task status updated successfully!");
        },
        onError: () => {
          toast.error("Failed to update task status.");
        },
      }
    );
  };

  const handleFilterChange = (newFilters = {}) => {
    const query = {
      q: search,
      status: statusFilter,
      priority: priorityFilter,
      tab: activeTab,
      ...newFilters,
    };
    router.get(route("tasks.index"), query, { preserveState: true, preserveScroll: true });
  };

  const getAvatarUrl = (user) => {
    if (user?.image_url) return user.image_url;
    if (user?.image) {
      return user.image.startsWith("http") ? user.image : `/storage/${user.image}`;
    }
    return "/images/default-avatar.jpg";
  };

  return (
    <UserLayout title="Tasks">
      <Head title="Tasks Overview" />

      <div className="p-4 sm:p-6 w-full space-y-6 font-sans pb-10">
        {/* Header Title Card with Breadcrumb */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* BREADCRUMB */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-2">
              <Link href={route('dashboard')} className="hover:text-indigo-600 transition-colors">Home</Link>
              <ChevronRight size={12} className="text-gray-300" />
              <Link href={route('projects.index')} className="hover:text-indigo-600 transition-colors">Projects</Link>
              <ChevronRight size={12} className="text-gray-300" />
              <span className="text-indigo-600 font-bold">Tasks</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">MY TASKS WORKLOAD</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage details, task list, and trace progress coordinates</p>
          </div>
        </div>

        {/* 2-Tab Navigation Selector */}
        <div className="flex bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {["Overview", "Tasks"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`flex-1 py-4 text-sm font-bold tracking-tight transition-all border-b-2 flex items-center justify-center gap-2 ${
                activeTab === tab
                  ? "bg-indigo-50/50 border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
              }`}
              style={{ minHeight: "52px" }}
            >
              {tab === "Overview" ? <Briefcase size={16} /> : <ListTodo size={16} />}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
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
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">TOTAL TASKS</span>
                </div>
              </div>

              {/* Card 2: Completed Tasks */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-none mb-1">{completedTasks}</h3>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">COMPLETED TASKS</span>
                </div>
              </div>

              {/* Card 3: Members */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-none mb-1">{membersCount}</h3>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">MEMBERS</span>
                </div>
              </div>

              {/* Card 4: Total Hours */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-none mb-1">{totalHours}</h3>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">TOTAL HOURS</span>
                </div>
              </div>
            </div>

            {/* Description & Task Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left description (2/3 width) */}
              <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm lg:col-span-2 space-y-4">
                <h2 className="text-[15px] font-bold text-gray-900 border-b border-gray-50 pb-3">Description</h2>
                <div className="text-sm text-gray-500 leading-relaxed space-y-4">
                  <p className="uppercase font-bold tracking-wider text-xs text-indigo-600">Assigned Tasks Overview</p>
                  <p>
                    Welcome to your task dashboard. Track your assigned task schedules, progress milestones, and project team updates. Update task status as you complete deliverables.
                  </p>
                </div>
              </div>

              {/* Right Sidebar Column (1/3 width) */}
              <div className="space-y-6">
                {/* Task Status Breakdown Card */}
                <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm space-y-5">
                  <h2 className="text-[15px] font-bold text-gray-900 border-b border-gray-50 pb-3">Task Status</h2>

                  <div className="space-y-5">
                    {statusOrder.map((statusKey) => {
                      const count = getStatusCount(statusKey);
                      const percent = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                      return (
                        <div key={statusKey} className="space-y-2">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-gray-600">{columns[statusKey]}</span>
                            <span className="text-gray-400">
                              {String(count).padStart(2, "0")}/{String(totalTasks).padStart(2, "0")}
                            </span>
                          </div>
                          <div className="w-full bg-gray-50 rounded-full h-2 overflow-hidden border border-gray-100/50">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${statusColors[statusKey] || "bg-gray-400"}`}
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
                          <img
                            src={getAvatarUrl(member)}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/images/default-avatar.jpg";
                            }}
                          />
                          <div>
                            <div className="text-sm font-bold text-gray-900">{member.name}</div>
                            <div className="text-[11px] text-gray-400 font-medium capitalize">
                              {member.designation || "Team Member"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-gray-400 font-medium leading-relaxed">
                        No team members assigned yet.<br />
                        <span className="text-[10px] text-slate-300 block mt-1">
                          Assign tasks to users to automatically add them to the project team.
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Tasks List Tab Content */
          <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden space-y-4">
            {/* Filter Bar inside Tasks Tab */}
            <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
              <h2 className="text-base font-bold text-gray-900">Task List</h2>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3.5 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search task or project..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFilterChange({ q: search });
                    }}
                    onBlur={() => handleFilterChange({ q: search })}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStatusFilter(val);
                    handleFilterChange({ status: val });
                  }}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="not started">Not Started (Open)</option>
                  <option value="in progress">In Progress</option>
                  <option value="on hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPriorityFilter(val);
                    handleFilterChange({ priority: val });
                  }}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Tasks Table matching Admin/Projects/Show */}
            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[13px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">
                    <th className="py-4 px-6 w-12 text-center">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/25" disabled />
                    </th>
                    <th className="py-4 px-6">Task ID</th>
                    <th className="py-4 px-6">Task</th>
                    <th className="py-4 px-6">Project</th>
                    <th className="py-4 px-6">Assignee</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {taskData.length > 0 ? (
                    taskData.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6 text-center">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/25" />
                        </td>
                        <td className="py-4 px-6 text-[15px] text-gray-700 font-medium">
                          {`TS-${String(task.id).padStart(3, "0")}`}
                        </td>
                        <td className="py-4 px-6">
                          <Link
                            href={route("tasks.show", task.id)}
                            className="font-bold text-gray-800 text-[15px] hover:text-[#1e88e5] transition-colors leading-snug block"
                          >
                            {task.name}
                          </Link>
                          <div className="text-sm text-gray-400 font-medium mt-0.5">{formatDate(task.start_date) || "-"}</div>
                        </td>
                        <td className="py-4 px-6 text-[15px] text-gray-700 font-medium">
                          {task.project?.name || "-"}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {Array.isArray(task.assignees) && task.assignees.length > 0 ? (
                              task.assignees.map((user, i) => (
                                <img
                                  key={i}
                                  src={getAvatarUrl(user)}
                                  alt={user.name}
                                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-sm"
                                  title={user.name}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/images/default-avatar.jpg";
                                  }}
                                />
                              ))
                            ) : (
                              <img
                                src={getAvatarUrl(auth?.user)}
                                alt={auth?.user?.name || "User"}
                                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-sm"
                                title={auth?.user?.name}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/images/default-avatar.jpg";
                                }}
                              />
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={task.status || "not started"}
                            onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-80 capitalize focus:outline-none cursor-pointer border ${tableStatusBadges[task.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                          >
                            <option value="not started">Open</option>
                            <option value="in progress">Inprogress</option>
                            <option value="on hold">On Hold</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2.5 text-gray-400">
                            <Link
                              href={route("tasks.show", task.id)}
                              className="hover:text-blue-500 transition-colors p-1.5 hover:bg-blue-50 rounded-lg"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-gray-400 font-medium italic">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Inbox size={28} className="text-gray-300" />
                          No tasks assigned yet.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table pagination stats footer */}
            {tasks?.links && tasks.links.length > 3 && (
              <div className="bg-white px-6 py-5 border-t border-gray-50 flex items-center justify-center gap-1.5">
                {tasks.links.map((link, idx) => (
                  <Link
                    key={idx}
                    href={getPaginationUrl(link.url)}
                    preserveState={true}
                    preserveScroll={true}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      link.active
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                        : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
                    } ${!link.url ? "opacity-40 cursor-not-allowed" : ""}`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
