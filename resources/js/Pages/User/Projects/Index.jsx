import React from "react";
import { Head, router, Link } from "@inertiajs/react";
import UserLayout from "@/Layouts/UserLayout";
import { Eye, Calendar, LayoutGrid, MoreHorizontal, ListTodo, MessageSquare } from "lucide-react";

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

  const getFormattedDate = (dateStr) => {
    if (!dateStr) return "No deadline";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const getDaysLeftBadge = (endDateStr) => {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return (
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-slate-200 text-slate-400 bg-white inline-block">
          {absDays} {absDays === 1 ? 'day' : 'days'} overdue
        </span>
      );
    } else if (diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      return (
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-slate-200 text-slate-400 bg-white inline-block">
          {months} {months === 1 ? 'month' : 'months'} left
        </span>
      );
    } else {
      return (
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-slate-200 text-slate-400 bg-white inline-block">
          {diffDays} {diffDays === 1 ? 'day' : 'days'} left
        </span>
      );
    }
  };

  const getInlineStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    
    if (s === 'completed' || s === 'finished') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-teal-700 border border-cyan-100/80 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
          Complete
        </span>
      );
    }

    if (s === 'on hold' || s === 'inactive') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          On Hold
        </span>
      );
    }

    if (s === 'in progress' || s === 'ongoing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#475569] text-white shrink-0 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Ongoing
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100/80 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
        Planning
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'high' || p === 'critical') {
      return <span className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#00B4D8] text-white tracking-wide shadow-2xs">High</span>;
    }
    if (p === 'low') {
      return <span className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#EF4444] text-white tracking-wide shadow-2xs">Low</span>;
    }
    return <span className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#EAB308] text-white tracking-wide shadow-2xs">Medium</span>;
  };

  const getProgressBarColor = (status, endDateStr) => {
    const isOverdue = endDateStr && new Date(endDateStr) < new Date();
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'finished') return 'bg-[#0D9488]';
    if (s === 'on hold' || s === 'inactive') return 'bg-[#F59E0B]';
    if (s === 'in progress' || s === 'ongoing') return 'bg-[#00B4D8]';
    if (isOverdue) return 'bg-[#EF4444]';
    return 'bg-[#EAB308]';
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
            return (
              <div key={project.id} className="group bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                
                <div>
                  {/* Row 1: Date & Days Left Badge on Left, View Tasks Button on Right */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-[15px]">
                        <Calendar size={17} className="text-slate-800 stroke-[2.5]" />
                        <span className="font-bold text-slate-900">{getFormattedDate(project.end_date)}</span>
                      </div>
                      {getDaysLeftBadge(project.end_date)}
                    </div>

                    <button 
                      onClick={() => router.get(route("tasks.index", { project_id: project.id }))}
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                      title="View Tasks"
                    >
                      <Eye size={18} />
                    </button>
                  </div>

                  {/* Row 2: Project Title & Inline Status Pill */}
                  <div className="flex items-center gap-2 mb-2">
                    <Link href={route("tasks.index", { project_id: project.id })} className="block truncate max-w-[70%]">
                      <h3 className="text-[17px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate tracking-tight">
                        {project.name}
                      </h3>
                    </Link>
                    {getInlineStatusBadge(project.status, project.end_date)}
                  </div>

                  {/* Row 4: Supporting Description text with view more link */}
                  <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 min-h-[2.5rem] mb-3 font-normal">
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

                  {/* Tasks & Comments Count */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mb-5">
                    <div className="flex items-center gap-1.5">
                      <ListTodo size={14} className="text-slate-400" />
                      <span>{project.tasks_count || 0} Tasks</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-slate-400" />
                      <span>{project.comments_count || 0} Comments</span>
                    </div>
                  </div>

                  {/* Row 5: Progress Bar Line & Percentage */}
                  <div className="space-y-1.5 mb-6">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>Progress</span>
                      <span className="text-slate-600 font-bold">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressBarColor(project.status, project.end_date)}`}
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 6: Bottom Footer - Team Avatars */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100/60">
                  <div className="flex items-center">
                    {project.team && project.team.length > 0 ? (
                      <div className="flex items-center -space-x-2 overflow-hidden">
                        {project.team.slice(0, 3).map((member, i) => {
                          const avatarSrc = member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'U')}&background=random&color=fff`;
                          return (
                            <img 
                              key={i} 
                              src={avatarSrc} 
                              alt={member.name} 
                              className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-2xs" 
                              title={member.name} 
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'U')}&background=6366F1&color=fff`;
                              }}
                            />
                          );
                        })}
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
