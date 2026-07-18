import React, { useState, useEffect } from "react";
import { Head, useForm, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Edit, Trash2, Eye, X, Search, LayoutGrid, List } from "lucide-react";

export default function Index({ projects, statusCounts, filters, users, success }) {
  const [deleteId, setDeleteId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showSuccess, setShowSuccess] = useState(!!success);
  const [fade, setFade] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState(filters?.search || "");

  const { data: form, setData, post, put, reset, errors, clearErrors } = useForm({
    name: "",
    description: "",
    status: "not started",
    start_date: "",
    end_date: "",
    priority: "Medium",
  });

  const rows = Array.isArray(projects) ? projects : projects?.data ?? [];

  // Filter projects by active tab
  const filteredProjects = rows.filter(project => {
    if (activeTab === "All") return true;
    if (activeTab === "Ongoing" && project.status === "in progress") return true;
    if (activeTab === "Completed" && project.status === "completed") return true;
    if (activeTab === "Cancelled" && project.status === "cancelled") return true;
    if (activeTab === "Inactive" && project.status === "on hold") return true;
    if (activeTab === "Critical" && project.status === "critical") return true;
    return false;
  });

  useEffect(() => {
    if (success) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setFade(true);
        setTimeout(() => setShowSuccess(false), 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const openCreateModal = () => {
    reset();
    setEditingProject(null);
    setShowCreate(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setData({
      name: project.name,
      description: project.description || "",
      status: project.status || "not started",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      priority: project.priority || "Medium",
    });
    setShowEdit(true);
  };

  const closeModal = () => {
    reset();
    clearErrors();
    setShowCreate(false);
    setShowEdit(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProject) {
      put(route("admin.projects.update", editingProject.id), {
        preserveScroll: true,
        onSuccess: () => closeModal(),
      });
    } else {
      post(route("admin.projects.store"), {
        preserveScroll: true,
        onSuccess: () => closeModal(),
      });
    }
  };

  const handleDelete = (id) => {
    router.post(route("admin.projects.destroy", id), { _method: "DELETE" });
    setDeleteId(null);
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();

    // Status Badge Style: Capsule shape, light bg, colored border
    if (s === "completed" || s === "finished")
      return <span className="bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest border border-[#C8E6C9]">Completed</span>;
    if (s === "in progress")
      return <span className="bg-[#E3F2FD] text-[#1976D2] px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest border border-[#BBDEFB]">Ongoing</span>;
    if (s === "on hold" || s === "postponed")
      return <span className="bg-[#FFF3E0] text-[#EF6C00] px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest border border-[#FFE0B2]">Inactive</span>;
    if (s === "cancelled")
      return <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest border border-slate-200">Cancelled</span>;
    if (s === "critical")
      return <span className="bg-[#FFEBEE] text-[#C62828] px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest border border-[#FFCDD2]">Critical</span>;

    return <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest border border-slate-100">Pending</span>;
  };

  const getProgressBarColor = (status) => {
    const s = status?.toLowerCase();
    if (s === "completed" || s === "finished") return "bg-[#2E7D32]";
    if (s === "in progress") return "bg-[#1976D2]";
    if (s === "on hold" || s === "postponed") return "bg-[#EF6C00]";
    if (s === "critical") return "bg-[#C62828]";
    return "bg-slate-300";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();

    // Formatting as "17th Nov. 2020" style
    const suffix = (d) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };
    return `${day}${suffix(day)} ${month}. ${year}`;
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    router.get(route('admin.projects.index'), { search: val }, {
      preserveState: true,
      replace: true,
      preserveScroll: true
    });
  };

  return (
    <AdminLayout>
      <Head title="Projects" />

      {/* Success Notification */}
      {showSuccess && (
        <div className={`mb-6 flex justify-between items-center bg-blue-50 text-blue-700 px-6 py-4 rounded-2xl border border-blue-100 transition-opacity duration-500 ${fade ? "opacity-0" : "opacity-100"}`}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
            <span className="font-bold text-sm tracking-tight">{success}</span>
          </div>
          <button onClick={() => setShowSuccess(false)} className="text-blue-400 hover:text-blue-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-5 px-1">
        {/* Tabs */}
        <div className="flex bg-white rounded-2xl shadow-sm border border-slate-100 p-1 overflow-x-auto no-scrollbar">
          {['All', 'Ongoing', 'Cancelled', 'Completed', 'Inactive', 'Critical'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? "bg-slate-900 text-white shadow-md font-black" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
            >
              {tab} <span className={`ml-1 opacity-60 ${activeTab === tab ? "text-slate-300" : ""}`}>{statusCounts?.[tab] || 0}</span>
            </button>
          ))}
        </div>

        {/* Search & Action */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300" />
            <input
              type="text"
              placeholder="SEARCH PROJECT..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-11 pr-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-slate-50 focus:border-slate-300 transition-all shadow-sm placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:tracking-widest placeholder:text-[10px]"
            />
          </div>
          <button onClick={openCreateModal} className="px-7 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.08em] rounded-2xl shadow-xl shadow-slate-100 hover:bg-black transition-all flex items-center gap-2 whitespace-nowrap active:scale-95">
            <span>+ NEW PROJECT</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div key={project.id} className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative">

              {/* Quick Actions (Hover) */}
              <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col gap-2 translate-x-3 group-hover:translate-x-0">
                <button onClick={() => router.get(route("admin.projects.show", project.id))} className="p-2 bg-white text-slate-600 rounded-lg shadow-lg hover:bg-slate-900 hover:text-white transition-all scale-90">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => openEditModal(project)} className="p-2 bg-white text-slate-600 rounded-lg shadow-lg hover:bg-slate-900 hover:text-white transition-all scale-90">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteId(project.id)} className="p-2 bg-white text-red-500 rounded-lg shadow-lg hover:bg-red-500 hover:text-white transition-all scale-90">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Title */}
              <Link href={route("admin.projects.show", project.id)} className="block mb-4">
                <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[50px] tracking-tight">{project.name}</h3>
              </Link>

              {/* Status Badge */}
              <div className="mb-6">
                {getStatusBadge(project.status)}
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-end mb-2.5">
                  <span className="text-[14px] font-bold text-slate-400 leading-none">Progress</span>
                  <span className="text-[16px] font-black text-slate-900 leading-none">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressBarColor(project.status)}`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2 mb-6 text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Started :</span>
                  <span className="text-slate-500 font-medium">{formatDate(project.start_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Deadline :</span>
                  <span className="text-slate-500 font-medium">{formatDate(project.end_date)}</span>
                </div>
              </div>

              {/* Footer: Team & Tasks */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex -space-x-3">
                  {project.team && project.team.slice(0, 4).map((member, i) => (
                    member.image ? (
                      <img key={i} src={member.image} alt={member.name} className="w-9 h-9 rounded-full border-[2.5px] border-white object-cover shadow-sm bg-slate-50 transition-transform hover:scale-110 hover:z-20 cursor-pointer" title={member.name} />
                    ) : (
                      <div key={i} className="w-9 h-9 rounded-full border-[2.5px] border-white bg-slate-800 flex items-center justify-center text-[10px] font-black text-white shadow-md">
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                    )
                  ))}
                  {project.team && project.team.length > 4 && (
                    <div className="w-9 h-9 rounded-full border-[2.5px] border-white bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm z-10">
                      +{project.team.length - 4}
                    </div>
                  )}
                </div>
                <div className="flex items-center text-slate-500 font-bold group/task transition-all hover:text-blue-600 cursor-pointer">
                  <List className="w-4.5 h-4.5 mr-2" />
                  <span className="text-[14px] font-black tracking-tight">{project.tasks_count || 0} Task</span>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100 shadow-inner">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <LayoutGrid className="w-12 h-12 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase">No Initiatives Found</h3>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest max-w-xs mx-auto mb-8 leading-loose px-4">Adjust filter matrix to locate active records</p>
            <button onClick={() => { setActiveTab("All"); setSearchQuery(""); }} className="text-slate-900 font-black text-xs uppercase tracking-[0.2em] hover:underline underline-offset-8 decoration-2">Re-Sync System</button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal (Premium Studio Redesign) */}
      {(showCreate || showEdit) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-10 rounded-[32px] shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)] w-full max-w-lg border border-slate-100/50 transition-all">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-0.5 uppercase">
                  {editingProject ? "Update Unit" : "New Initiative"}
                </h2>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Data management interface</p>
              </div>
              <button onClick={closeModal} className="p-2.5 hover:bg-slate-50 rounded-full transition-colors text-slate-200 hover:text-slate-900 active:scale-90">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 px-0.5">Project Identifier</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setData("name", e.target.value)}
                  className={`w-full bg-slate-50/50 border border-slate-100 px-6 py-4 rounded-2xl text-base font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all placeholder:text-slate-200 ${errors.name ? "border-red-200 ring-2 ring-red-50/50" : ""}`}
                  placeholder="e.g. SKYLINE RESIDENCY"
                />
                {errors.name && <p className="text-red-500 text-[10px] mt-2 px-1 font-bold tracking-tight">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 px-0.5">Operational Scope</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setData("description", e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-100 px-6 py-4 rounded-2xl text-[15px] font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all min-h-[120px] no-scrollbar resize-none placeholder:text-slate-200"
                  placeholder="DEFINE KEY OBJECTIVES..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-full">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 px-0.5">Project Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setData("status", e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-100 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-700 focus:ring-4 focus:ring-slate-100 transition-all appearance-none cursor-pointer"
                  >
                    <option value="not started">Pending</option>
                    <option value="in progress">Ongoing</option>
                    <option value="on hold">Inactive</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 px-0.5">Launched</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setData("start_date", e.target.value)}
                    className={`w-full bg-slate-50/50 border border-slate-100 px-6 py-4 rounded-2xl text-xs font-black text-slate-700 focus:ring-4 focus:ring-slate-100 transition-all uppercase ${errors.start_date ? "border-red-200" : ""}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 px-0.5">Deadline</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setData("end_date", e.target.value)}
                    className={`w-full bg-slate-50/50 border border-slate-100 px-6 py-4 rounded-2xl text-xs font-black text-slate-700 focus:ring-4 focus:ring-slate-100 transition-all uppercase ${errors.end_date ? "border-red-200" : ""}`}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-8 py-3.5 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 px-10 text-sm font-semibold text-white bg-slate-900 hover:bg-black rounded-xl shadow-[0_10px_20px_-10px_rgba(15,23,42,0.4)] transition-all active:scale-[0.98]"
                >
                  {editingProject ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white p-12 rounded-[56px] shadow-2xl w-full max-w-sm text-center border-b-[12px] border-slate-900">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <Trash2 className="w-12 h-12 text-slate-900" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Purge Unit?</h2>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-10 leading-relaxed px-4">Operation is permanent. Data structure will be terminated immediately.</p>
            <div className="flex flex-col gap-4">
              <button onClick={() => handleDelete(deleteId)} className="w-full py-5 text-sm font-black uppercase tracking-[0.25em] text-white bg-slate-900 hover:bg-black rounded-3xl transition-all shadow-lg shadow-slate-200">
                Confirm Purge
              </button>
              <button onClick={() => setDeleteId(null)} className="w-full py-5 text-sm font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-all">
                Abort Mission
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
