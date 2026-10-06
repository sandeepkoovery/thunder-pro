import React from "react";
import { Head, router, Link } from "@inertiajs/react";
import UserLayout from "@/Layouts/UserLayout";
import { Eye, Clock, LayoutGrid, ListTodo, MessageSquare } from "lucide-react";

const getAssetUrl = (path) => {
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/index\.php$/, '').replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  if (baseUrl.includes('/public')) {
    return `${baseUrl}${cleanPath}`;
  }
  return `${baseUrl}/public${cleanPath}`;
};

export default function Index({ projects, auth }) {
  const rows = Array.isArray(projects) ? projects : projects?.data ?? [];

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

  return (
    <UserLayout>
      <Head title="My Projects" />

      {/* Page Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">My Assigned Projects</h1>
        <p className="text-sm text-gray-400 mt-0.5">View and trace projects assigned to your team profile</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
        {rows.length > 0 ? (
          rows.map((project) => {
            const badgeClass = getBannerStatusBadge(project.status);
            const badgeLabel = getBannerStatusLabel(project.status);

            return (
              <div key={project.id} className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                
                <div>
                  {/* Top Row: Project Title & Action Button */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Link href={route("tasks.index", { project_id: project.id })} className="block flex-1">
                      <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1 tracking-tight">
                        {project.name}
                      </h3>
                    </Link>

                    <button 
                      onClick={() => router.get(route("tasks.index", { project_id: project.id }))}
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                      title="View Tasks"
                    >
                      <Eye size={16} />
                    </button>
                  </div>

                  {/* Status Pill Badge */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide ${badgeClass}`}>
                      {badgeLabel}
                    </span>
                  </div>

                  {/* Supporting Description text with view more link */}
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 min-h-[2.25rem] mb-4 font-normal">
                    {project.description ? (
                      project.description.length > 85 ? (
                        <>
                          {project.description.slice(0, 80).trim()}...{' '}
                          <Link href={route("tasks.index", { project_id: project.id })} className="text-slate-500 font-bold hover:underline">
                            view more
                          </Link>
                        </>
                      ) : (
                        project.description
                      )
                    ) : (
                      "No project description provided."
                    )}
                  </p>

                  {/* Sub-info: Tasks & Comments Count */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <ListTodo size={14} className="text-slate-400" />
                      <span>{project.tasks_count || 0} Tasks</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-slate-400" />
                      <span>{project.comments_count || 0} Comments</span>
                    </div>
                  </div>

                  {/* Team Avatars */}
                  <div className="flex items-center mb-5">
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
                </div>

                {/* Progress Bar Line */}
                <div className="space-y-2 pt-3 border-t border-slate-100/80">
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
            );
          })
        ) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[40px] border border-gray-100 shadow-sm">
            <div className="bg-gray-50 w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto mb-6">
              <LayoutGrid className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">No Projects Assigned</h3>
            <p className="text-gray-400 text-xs max-w-xs mx-auto">You do not have any projects assigned to you at this time.</p>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
