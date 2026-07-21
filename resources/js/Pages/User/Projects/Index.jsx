import React from "react";
import { Head, router, Link } from "@inertiajs/react";
import UserLayout from "@/Layouts/UserLayout";
import { Eye, Clock, LayoutGrid } from "lucide-react";

export default function Index({ projects }) {
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

  const getProjectLogo = (projectId) => {
    const index = (projectId || 0) % 8;
    const logos = [
      // Triangle logo (neon purple/blue)
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <defs>
          <linearGradient id={`usrgrad0-${projectId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8A2387" />
            <stop offset="50%" stopColor="#E94057" />
            <stop offset="100%" stopColor="#F27121" />
          </linearGradient>
        </defs>
        <path d="M50 20 L80 75 L20 75 Z" fill={`url(#usrgrad0-${projectId})`} />
      </svg>,
      // Teal wave logo
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <defs>
          <linearGradient id={`usrgrad1-${projectId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#11998e" />
            <stop offset="100%" stopColor="#38ef7d" />
          </linearGradient>
        </defs>
        <path d="M20 50 Q 35 20, 50 50 T 80 50" fill="none" stroke={`url(#usrgrad1-${projectId})`} strokeWidth="12" strokeLinecap="round" />
        <circle cx="50" cy="50" r="10" fill={`url(#usrgrad1-${projectId})`} />
      </svg>,
      // Blue loop logo
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <defs>
          <linearGradient id={`usrgrad2-${projectId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00c6ff" />
            <stop offset="100%" stopColor="#0072ff" />
          </linearGradient>
        </defs>
        <path d="M50 20 A 30 30 0 1 1 50 80 A 30 30 0 1 1 50 20 Z" fill="none" stroke={`url(#usrgrad2-${projectId})`} strokeWidth="10" />
        <path d="M50 35 L50 65 L65 50 Z" fill={`url(#usrgrad2-${projectId})`} />
      </svg>,
      // Circular letter 'e' logo
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <defs>
          <linearGradient id={`usrgrad3-${projectId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7F00FF" />
            <stop offset="100%" stopColor="#E100FF" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="35" fill="none" stroke={`url(#usrgrad3-${projectId})`} strokeWidth="8" />
        <text x="50" y="62" textAnchor="middle" fontSize="38" fontWeight="900" fill={`url(#usrgrad3-${projectId})`} fontFamily="sans-serif">e</text>
      </svg>,
      // Ring logo
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <defs>
          <linearGradient id={`usrgrad4-${projectId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4b1f" />
            <stop offset="100%" stopColor="#ff9068" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="30" fill="none" stroke={`url(#usrgrad4-${projectId})`} strokeWidth="12" />
      </svg>,
      // Green wave / leaf logo
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <defs>
          <linearGradient id={`usrgrad5-${projectId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3CA55C" />
            <stop offset="100%" stopColor="#B5AC49" />
          </linearGradient>
        </defs>
        <path d="M50 15 C30 35 30 65 50 85 C70 65 70 35 50 15 Z" fill={`url(#usrgrad5-${projectId})`} />
      </svg>,
      // Double wave logo
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <defs>
          <linearGradient id={`usrgrad6-${projectId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f857a6" />
            <stop offset="100%" stopColor="#ff5858" />
          </linearGradient>
        </defs>
        <path d="M25 40 Q 40 15, 55 40 T 85 40" fill="none" stroke={`url(#usrgrad6-${projectId})`} strokeWidth="10" strokeLinecap="round" />
        <path d="M15 60 Q 40 35, 60 60 T 75 60" fill="none" stroke={`url(#usrgrad6-${projectId})`} strokeWidth="10" strokeLinecap="round" />
      </svg>,
      // Star/Sun gradient logo
      <svg viewBox="0 0 100 100" className="w-12 h-12">
        <defs>
          <linearGradient id={`usrgrad7-${projectId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5af19" />
            <stop offset="100%" stopColor="#f12711" />
          </linearGradient>
        </defs>
        <polygon points="50,15 62,38 88,38 67,54 75,80 50,64 25,80 33,54 12,38 38,38" fill={`url(#usrgrad7-${projectId})`} />
      </svg>
    ];
    return logos[index];
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
            const daysLeft = getDaysLeftText(project.end_date);
            return (
              <div key={project.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative flex flex-col justify-between">
                
                <div>
                  <div className="flex items-start justify-between mb-5">
                    {/* Dynamic logo */}
                    <div className="p-1 bg-gray-50/50 rounded-2xl inline-block">
                      {getProjectLogo(project.id)}
                    </div>

                    <button 
                      onClick={() => router.get(route("tasks.index", { project_id: project.id }))}
                      className="p-2 hover:bg-gray-50 text-indigo-600 rounded-full transition-colors"
                      style={{ minHeight: '36px', minWidth: '36px' }}
                      title="View Tasks"
                    >
                      <Eye size={18} />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <Link href={route("tasks.index", { project_id: project.id })} className="block mb-2 group">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-6 min-h-[32px]">
                    {project.description || "No project description provided."}
                  </p>

                  {/* Progress Line */}
                  <div className="mb-6">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${daysLeft.colorClass}`}>
                    <Clock size={10} />
                    {daysLeft.text}
                  </div>

                  {/* Team Avatars fallback */}
                  <div className="flex items-center gap-2">
                    {project.team && project.team.length > 0 ? (
                      <div className="flex -space-x-2 overflow-hidden">
                        {project.team.slice(0, 3).map((member, i) => (
                          member.image ? (
                            <img 
                              key={i} 
                              src={member.image} 
                              alt={member.name} 
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover" 
                              title={member.name} 
                            />
                          ) : (
                            <div 
                              key={i} 
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-indigo-500 flex items-center justify-center text-[8px] font-bold text-white uppercase"
                              title={member.name}
                            >
                              {member.name.charAt(0)}
                            </div>
                          )
                        ))}
                        {project.team.length > 3 && (
                          <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">
                            +{project.team.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-semibold uppercase tracking-wider">No team</span>
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
