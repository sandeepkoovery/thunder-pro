import React, { useState, useEffect } from "react";
import { Head, useForm, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import DatePicker from "@/Components/DatePicker";
import { 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Search, 
  LayoutGrid, 
  List, 
  MoreHorizontal, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  MessageSquare,
  ListTodo
} from "lucide-react";

const getAssetUrl = (path) => {
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/index\.php$/, '').replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  if (baseUrl.includes('/public')) {
    return `${baseUrl}${cleanPath}`;
  }
  return `${baseUrl}/public${cleanPath}`;
};

export default function Index({ projects, statusCounts, filters, users, success, auth }) {
  const [deleteId, setDeleteId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showSuccess, setShowSuccess] = useState(!!success);
  const [fade, setFade] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState(filters?.search || "");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  const { data: form, setData, post, put, reset, errors, clearErrors } = useForm({
    name: "",
    description: "",
    status: "planning",
    start_date: "",
    end_date: "",
    priority: "Medium",
    image: null,
  });

  const rows = Array.isArray(projects) ? projects : projects?.data ?? [];

  // Filter projects by active tab
  const filteredProjects = rows.filter(project => {
    if (activeTab === "All") return true;
    if (activeTab === "Planning") return project.status === "planning" || project.status === "not started";
    if (activeTab === "In Progress") return project.status === "in progress" || project.status === "ongoing";
    if (activeTab === "Completed") return project.status === "completed";
    if (activeTab === "On Hold") return project.status === "on hold" || project.status === "inactive";
    return true;
  });

  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

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
      status: project.status || "planning",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      priority: project.priority || "Medium",
      image: null,
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
      router.post(route("admin.projects.update", editingProject.id), {
        _method: "PUT",
        ...form,
      }, {
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

  const getDaysLeftText = (endDateStr) => {
    if (!endDateStr) return { text: "No deadline", colorClass: "bg-gray-50 text-gray-400" };
    const end = new Date(endDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: "Overdue", colorClass: "bg-rose-50 text-rose-500 border border-rose-100" };
    } else if (diffDays === 0) {
      return { text: "Due today", colorClass: "bg-amber-50 text-amber-500 border border-amber-100" };
    } else if (diffDays <= 3) {
      return { text: `${diffDays} days left`, colorClass: "bg-rose-50 text-rose-500 border border-rose-100" };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days left`, colorClass: "bg-amber-50 text-amber-500 border border-amber-100" };
    } else {
      return { text: `${diffDays} days left`, colorClass: "bg-green-50 text-green-500 border border-green-100" };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "No deadline";
    const date = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const getInitials = (name) => {
    if (!name) return 'PR';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    if (words.length === 1) {
      const word = words[0];
      if (word.length >= 2) {
        return word.slice(0, 2).toUpperCase();
      }
      return word.charAt(0).toUpperCase();
    }
    return 'PR';
  };

  const getProjectLogo = (project) => {
    const name = typeof project === 'string' ? project : (project?.name || 'Project');
    const initials = getInitials(name);
    const id = typeof project?.id === 'number' ? project.id : (typeof project === 'number' ? project : 0);

    const gradients = [
      'from-indigo-600 to-purple-600 text-white',
      'from-blue-600 to-cyan-500 text-white',
      'from-violet-600 to-pink-500 text-white',
      'from-emerald-600 to-teal-500 text-white',
      'from-amber-500 to-orange-600 text-white',
      'from-rose-500 to-red-600 text-white',
      'from-sky-500 to-indigo-600 text-white',
    ];

    const gradientClass = gradients[id % gradients.length];
    const imageUrl = project?.image_url || (project?.image ? (project.image.startsWith('http') || project.image.startsWith('/') ? project.image : `/storage/${project.image}`) : null);

    return (
      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-contain rounded-xl"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextSibling) {
                e.currentTarget.nextSibling.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div 
          className={`w-full h-full rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center font-bold text-sm tracking-wider uppercase`}
          style={{ display: imageUrl ? 'none' : 'flex' }}
        >
          {initials}
        </div>
      </div>
    );
  };

  const bannerBackgrounds = [
    "bg-[#EBF7FC]", // Soft sky blue
    "bg-[#FAF8F5]", // Soft warm cream/off-white
    "bg-[#FAF4FF]", // Soft lavender/purple
    "bg-[#FFF7E8]", // Soft warm yellow/amber
    "bg-[#F0FAF7]", // Soft mint green
    "bg-[#FFF4F4]", // Soft rose pink
  ];

  const getBannerStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-[#10B981] text-white';
      case 'in progress':
      case 'ongoing':
        return 'bg-[#5B5D6E] text-white';
      case 'on hold':
      case 'inactive':
        return 'bg-amber-500 text-white';
      case 'planning':
      case 'not started':
      default:
        return 'bg-sky-600 text-white';
    }
  };

  const getBannerStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Finished';
      case 'in progress':
      case 'ongoing':
        return 'Ongoing';
      case 'on hold':
      case 'inactive':
        return 'On Hold';
      case 'planning':
      case 'not started':
      default:
        return 'Planning';
    }
  };

  const getHeroProjectLogo = (project) => {
    const name = typeof project === 'string' ? project : (project?.name || 'Project');
    const initials = getInitials(name);
    const id = typeof project?.id === 'number' ? project.id : (typeof project === 'number' ? project : 0);

    const gradients = [
      'from-indigo-600 to-purple-600 text-white',
      'from-blue-600 to-cyan-500 text-white',
      'from-violet-600 to-pink-500 text-white',
      'from-emerald-600 to-teal-500 text-white',
      'from-amber-500 to-orange-600 text-white',
      'from-rose-500 to-red-600 text-white',
      'from-sky-500 to-indigo-600 text-white',
    ];

    const gradientClass = gradients[id % gradients.length];
    const rawImg = project?.image_url || project?.image;
    let imageUrl = null;
    if (rawImg) {
      if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
        imageUrl = rawImg;
      } else {
        const cleanPath = rawImg.replace(/^\/?storage\//, '').replace(/^\//, '');
        imageUrl = getAssetUrl('/storage/' + cleanPath);
      }
    }

    return (
      <div className="w-full h-full flex items-center justify-center">
        {imageUrl ? (
          <div className="w-full h-full flex items-center justify-center p-3">
            <img 
              src={imageUrl} 
              alt={project?.name || 'Project Logo'} 
              className="max-h-24 max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105" 
              onError={(e) => {
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.style.display = 'none';
                  if (parent.nextSibling) {
                    parent.nextSibling.style.display = 'flex';
                  }
                }
              }}
            />
          </div>
        ) : null}
        <div 
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center font-black text-xl tracking-wider shadow-md select-none uppercase`}
          style={{ display: imageUrl ? 'none' : 'flex' }}
        >
          {initials}
        </div>
      </div>
    );
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
      <div className="flex flex-col gap-6 mb-6 px-1">
        {/* Top bar with Add New and Search elements */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap self-start"
            style={{ minHeight: '40px' }}
          >
            <Plus size={16} />
            Add New
          </button>

          <div className="flex items-center gap-3 self-stretch sm:self-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border-0 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400"
                style={{ minHeight: '40px' }}
              />
            </div>
            
            {/* View toggles */}
            <div className="flex items-center bg-gray-50 p-1 rounded-xl" style={{ minHeight: '40px' }}>
              <button 
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List size={16} />
              </button>
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            {/* Config button */}
            <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600" style={{ minHeight: '40px' }}>
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-6 border-b border-gray-100 pb-0.5">
          {['All', 'Planning', 'In Progress', 'Completed', 'On Hold'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold tracking-tight transition-all relative ${activeTab === tab ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}
              style={{ minHeight: '40px' }}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid or List View conditionally */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project, index) => {
              const bgClass = bannerBackgrounds[index % bannerBackgrounds.length];
              const badgeClass = getBannerStatusBadge(project.status);
              const badgeLabel = getBannerStatusLabel(project.status);
              const daysLeft = getDaysLeftText(project.end_date);

              return (
                <div key={project.id} className="group bg-white rounded-2xl border border-slate-200/60 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                  
                  {/* Top Pastel Banner Area */}
                  <div className={`relative h-44 ${bgClass} flex items-center justify-center p-4 border-b border-slate-100/50`}>
                    
                    {/* Status badge top left */}
                    <div className="absolute top-3.5 left-3.5 z-20">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide shadow-2xs ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                    </div>

                    {/* Quick menu top right */}
                    <div className="absolute top-3.5 right-3.5 z-20">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === project.id ? null : project.id);
                        }}
                        className="w-7 h-7 rounded-lg hover:bg-black/5 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {openMenuId === project.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                          <Link
                            href={route("admin.projects.show", project.id)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            <Eye size={14} /> View Details
                          </Link>
                          <button
                            onClick={() => openEditModal(project)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left"
                          >
                            <Edit size={14} /> Edit Project
                          </button>
                          <button
                            onClick={() => setDeleteId(project.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Hero Centered Logo */}
                    {getHeroProjectLogo(project)}
                  </div>

                  {/* Bottom Content Area */}
                  <div className="p-5 flex-1 flex flex-col justify-between bg-white space-y-4">
                    <div>
                      {/* Project Title */}
                      <Link href={route("admin.projects.show", project.id)} className="block mb-2">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 tracking-tight">
                          {project.name}
                        </h3>
                      </Link>

                      {/* Sub-info: Tasks & Comments Count */}
                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mb-4">
                        <div className="flex items-center gap-1.5">
                          <ListTodo size={14} className="text-slate-400" />
                          <span>{project.tasks_count || 0} Tasks</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageSquare size={14} className="text-slate-400" />
                          <span>{project.comments_count || 0} Comments</span>
                        </div>
                      </div>

                      {/* Team Avatars & Days Left */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center">
                          {project.team && project.team.length > 0 ? (
                            <div className="flex items-center -space-x-2 overflow-hidden">
                              {project.team.slice(0, 3).map((member, i) => (
                                member.image ? (
                                  <img 
                                    key={i} 
                                    src={member.image} 
                                    alt={member.name} 
                                    className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover shadow-2xs" 
                                    title={member.name} 
                                  />
                                ) : (
                                  <div 
                                    key={i} 
                                    className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white uppercase shadow-2xs"
                                    title={member.name}
                                  >
                                    {member.name.charAt(0)}
                                  </div>
                                )
                              ))}
                              {project.team.length > 3 && (
                                <span className="text-xs font-bold text-slate-400 pl-3">
                                  +{project.team.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">No team assigned</span>
                          )}
                        </div>

                        {/* Days Left badge */}
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${daysLeft.colorClass}`}>
                          <Clock size={11} />
                          {daysLeft.text}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Line */}
                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>Progress</span>
                        <span className="text-slate-800 font-extrabold">{project.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-24 text-center bg-white rounded-[40px] border border-dashed border-gray-100 shadow-sm">
              <div className="bg-gray-50 w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                <LayoutGrid className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">No Projects Found</h3>
              <p className="text-gray-400 text-xs max-w-xs mx-auto mb-6">Create a new project to get started with task management</p>
              <button onClick={() => { setActiveTab("All"); setSearchQuery(""); }} className="text-indigo-600 font-bold text-xs uppercase tracking-wider hover:underline">Clear Search</button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden px-1">
          <div className="overflow-x-auto min-h-[280px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[13px] font-semibold text-slate-500 text-left bg-gray-50/70">
                  <th className="p-4 pl-6 font-semibold">Project</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Progress</th>
                  <th className="p-4 font-semibold">Deadline</th>
                  <th className="p-4 font-semibold">Team</th>
                  <th className="p-4 text-right pr-8 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => {
                    const daysLeft = getDaysLeftText(project.end_date);
                    const isStarred = ['high', 'critical'].includes((project.priority || '').toLowerCase()) || project.id % 3 === 0;
                    
                    const statusColorBars = {
                      "completed": "bg-emerald-500",
                      "in progress": "bg-indigo-500",
                      "on hold": "bg-amber-500",
                      "planning": "bg-sky-500",
                      "not started": "bg-sky-500",
                    };

                    const tableStatusBadges = {
                      "completed": "bg-emerald-50 text-emerald-600 border border-emerald-100",
                      "in progress": "bg-indigo-50 text-indigo-600 border border-indigo-100",
                      "on hold": "bg-amber-50 text-amber-600 border border-amber-100",
                      "planning": "bg-sky-50 text-sky-600 border border-sky-100",
                      "not started": "bg-sky-50 text-sky-600 border border-sky-100",
                    };

                    const columns = {
                      "completed": "Completed",
                      "in progress": "In Progress",
                      "on hold": "On Hold",
                      "planning": "Planning",
                      "not started": "Planning",
                    };

                    return (
                      <tr key={project.id} className="text-gray-700 hover:bg-gray-50/40 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-1 h-8 rounded-full ${statusColorBars[project.status] || 'bg-gray-300'}`} />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Link href={route("admin.projects.show", project.id)} className="font-bold text-[15px] text-gray-900 hover:text-indigo-600 transition-colors">
                                  {project.name}
                                </Link>
                                {isStarred && (
                                  <svg className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                )}
                              </div>
                              <div className="text-sm text-gray-400 mt-0.5 max-w-sm truncate">{project.description || "No description provided."}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${tableStatusBadges[project.status] || 'bg-gray-100 text-gray-600'}`}>
                            {columns[project.status] || project.status}
                          </span>
                        </td>
                        <td className="p-4 w-44">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-sm font-semibold text-gray-400">
                              <span>Progress</span>
                              <span className="text-[15px] font-bold text-slate-700">{project.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div className="h-full bg-gray-900 rounded-full" style={{ width: `${project.progress}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-medium text-slate-600">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[15px] font-semibold text-slate-600">{formatDate(project.end_date)}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {project.team && project.team.slice(0, 3).map((member, i) => (
                              member.image ? (
                                <img key={i} src={member.image} alt={member.name} className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover" title={member.name} />
                              ) : (
                                <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-indigo-500 flex items-center justify-center text-[8px] font-bold text-white uppercase shadow-sm" title={member.name}>
                                  {member.name.charAt(0)}
                                </div>
                              )
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-right pr-8 relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === project.id ? null : project.id);
                            }}
                            className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            style={{ minHeight: '32px' }}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          {openMenuId === project.id && (
                            <div className="absolute right-8 mt-1 w-36 bg-white border border-gray-150 rounded-xl shadow-lg py-1 z-30 text-left">
                              <Link href={route("admin.projects.show", project.id)} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                <Eye size={14} /> View Project
                              </Link>
                              <button onClick={() => openEditModal(project)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                <Edit size={14} /> Edit
                              </button>
                              <button onClick={() => setDeleteId(project.id)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400 italic text-sm">
                      No projects found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {projects.last_page > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 px-1">
          <div className="text-xs font-bold text-gray-400">
            Showing {projects.from || 0} to {projects.to || 0} of {projects.total} entries
          </div>
          <div className="flex items-center gap-1">
            {projects.links.map((link, idx) => {
              const isPrev = link.label.includes('Previous');
              const isNext = link.label.includes('Next');
              
              if (isPrev) {
                return (
                  <Link 
                    key={idx}
                    href={link.url || '#'}
                    className={`p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all ${!link.url ? 'opacity-30 pointer-events-none' : ''}`}
                    disabled={!link.url}
                  >
                    <ChevronLeft size={16} />
                  </Link>
                );
              }
              
              if (isNext) {
                return (
                  <Link 
                    key={idx}
                    href={link.url || '#'}
                    className={`p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all ${!link.url ? 'opacity-30 pointer-events-none' : ''}`}
                    disabled={!link.url}
                  >
                    <ChevronRight size={16} />
                  </Link>
                );
              }

              return (
                <Link
                  key={idx}
                  href={link.url || '#'}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                    link.active 
                      ? "bg-indigo-600 text-white shadow-sm" 
                      : "text-gray-500 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit Modal (Premium Studio Redesign) */}
      {(showCreate || showEdit) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 rounded-[24px] shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)] w-full max-w-lg border border-slate-100/50 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {editingProject ? "Update Project" : "New Project"}
                </h2>
                <p className="text-xs font-medium text-slate-400 mt-0.5">Configure project settings and properties</p>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-900 active:scale-90">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 px-0.5">Project Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setData("name", e.target.value)}
                  className={`w-full bg-slate-50/50 border border-slate-150 px-4 py-3 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 ${errors.name ? "border-red-200 ring-2 ring-red-50/50" : ""}`}
                  placeholder="Enter project name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1.5 px-1 font-semibold tracking-tight">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 px-0.5">Project Logo (Optional)</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
                  onChange={(e) => setData("image", e.target.files[0])}
                  className={`w-full bg-slate-50/50 border border-slate-150 px-4 py-2.5 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer ${errors.image ? "border-red-200 ring-2 ring-red-50/50" : ""}`}
                />
                {errors.image && <p className="text-red-500 text-xs mt-1.5 px-1 font-semibold tracking-tight">{errors.image}</p>}
                <p className="text-[11px] text-slate-400 mt-1 px-0.5">Supported formats: PNG, JPG, JPEG, WEBP, GIF, SVG (Max: 5MB). If left empty, monogram logo will be used.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 px-0.5">Project Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setData("description", e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-150 px-4 py-3 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[100px] resize-none placeholder:text-slate-400"
                  placeholder="Describe the key objectives and requirements..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 px-0.5">Project Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setData("status", e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-150 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="planning">Planning</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 px-0.5">Start Date</label>
                  <DatePicker
                    value={form.start_date}
                    onChange={(e) => setData("start_date", e.target ? e.target.value : e)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 px-0.5">End Date</label>
                  <DatePicker
                    value={form.end_date}
                    onChange={(e) => setData("end_date", e.target ? e.target.value : e)}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
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
          <div className="bg-white p-8 rounded-[24px] shadow-2xl w-full max-w-sm text-center border-t-4 border-red-500">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Delete Project?</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed px-4">This action cannot be undone. All project data will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 text-sm font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
