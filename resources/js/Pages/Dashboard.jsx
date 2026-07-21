// resources/js/Pages/Dashboard.jsx
import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import UserLayout from "@/Layouts/UserLayout";
import AttendanceWidget from "@/Components/AttendanceWidget";
import {
  TrendingUp,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calendar,
  Layers,
  Phone,
  Video,
  ChevronRight,
  Clock
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

// Mock data for user productivity
const taskActivityData = [
  { name: "Mon", tasks: 2 },
  { name: "Tue", tasks: 5 },
  { name: "Wed", tasks: 3 },
  { name: "Thu", tasks: 8 },
  { name: "Fri", tasks: 4 },
  { name: "Sat", tasks: 6 }
];

const productivityData = [
  { name: "W1", assigned: 5, completed: 3 },
  { name: "W2", assigned: 8, completed: 6 },
  { name: "W3", assigned: 6, completed: 4 },
  { name: "W4", assigned: 10, completed: 8 },
  { name: "W5", assigned: 7, completed: 5 },
  { name: "W6", assigned: 9, completed: 8 }
];

export default function Dashboard({ stats, todayAttendance }) {
  const { auth } = usePage().props;

  const highlights = [
    { label: "Pending Leaves", value: stats.pending_leaves || "0", trend: "up", change: "New" },
    { label: "In Progress Tasks", value: stats.in_progress_tasks || "0", trend: "up", change: "Active" },
    { label: "Assigned Projects", value: "3", trend: "down", change: "0%" }
  ];

  return (
    <div className="space-y-6">
      <Head title="User Dashboard" />

      {/* TOP HEADER SECTION */}
      <div className="flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">My Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              <Link href="/" className="hover:text-[#26c6da]">Home</Link> &gt; <span className="text-gray-500">Dashboard</span>
            </p>
          </div>

          {/* Sparklines */}
          <div className="mp-dash-header-chips flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div>
                <div className="text-xs text-gray-400 font-medium">Work Hours</div>
                <div className="text-sm font-bold text-gray-700">168 hrs</div>
              </div>
              <svg className="w-12 h-8 text-blue-500" viewBox="0 0 50 30" fill="currentColor">
                <rect x="0" y="15" width="6" height="15" rx="2" />
                <rect x="10" y="20" width="6" height="10" rx="2" />
                <rect x="20" y="10" width="6" height="20" rx="2" />
                <rect x="30" y="5" width="6" height="25" rx="2" />
                <rect x="40" y="18" width="6" height="12" rx="2" />
              </svg>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center gap-3 flex-1">
              <div>
                <div className="text-xs text-gray-400 font-medium">Leaves Left</div>
                <div className="text-sm font-bold text-gray-700">14 Days</div>
              </div>
              <svg className="w-12 h-8 text-[#26c6da]" viewBox="0 0 50 30" fill="currentColor">
                <rect x="0" y="5" width="6" height="25" rx="2" />
                <rect x="10" y="10" width="6" height="20" rx="2" />
                <rect x="20" y="18" width="6" height="12" rx="2" />
                <rect x="30" y="22" width="6" height="8" rx="2" />
                <rect x="40" y="15" width="6" height="15" rx="2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* FIRST ROW - 4 WIDGETS */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Widget 1: Assigned Tasks */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-40">
          <div>
            <h3 className="text-sm font-semibold text-gray-400">Assigned Tasks</h3>
            <p className="text-3xl font-black text-gray-800 mt-2">{stats.total_tasks || 0}</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#26c6da] bg-[#26c6da]/10 border border-[#26c6da]/20 rounded-xl px-2.5 py-1 w-max">
            <TrendingUp size={13} />
            <span>+12.5% this month</span>
          </div>
        </div>

        {/* Widget 2: Completed Tasks (Teal solid) */}
        <div className="bg-[#26c6da] rounded-2xl shadow-sm p-6 text-white flex flex-col justify-between h-40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <div>
            <h3 className="text-sm font-medium text-white/80">Completed Tasks</h3>
            <p className="text-4xl font-bold mt-2">{stats.completed_tasks || 0}</p>
          </div>
          <p className="text-xs text-white/70">Great job on finishing your work!</p>
        </div>

        {/* Widget 3: Task Link (Play card) */}
        <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between h-40">
          <div className="space-y-2">
            <Link href={route('tasks.index')} className="w-10 h-10 bg-white text-[#26c6da] shadow-md rounded-full flex items-center justify-center hover:scale-115 transition-transform">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </Link>
            <div>
              <h3 className="text-sm font-bold text-gray-700 leading-none">My Tasks</h3>
              <p className="text-xs text-gray-400 mt-1">Jump to workspace</p>
            </div>
          </div>
          <svg className="w-20 h-20 text-[#26c6da]/25" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="40" />
            <path d="M50,10 A40,40 0 0,0 10,50 A40,40 0 0,0 50,90" fill="none" stroke="#26c6da" strokeWidth="6" strokeDasharray="5 5" />
            <circle cx="50" cy="50" r="20" fill="#1e88e5" className="animate-pulse" />
          </svg>
        </div>

        {/* Widget 4: Highlights */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between h-40">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Overview</h3>
          <div className="space-y-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">{h.label}</span>
                <span className="font-bold text-gray-700 flex items-center gap-1">
                  {h.value}
                  {h.trend === "up" ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECOND ROW - BANNER CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Banner Card 1: Upgrade Plan */}
        <div className="bg-[#1e88e5] rounded-2xl shadow-sm text-white p-5 sm:p-8 flex flex-col md:flex-row justify-between items-center relative overflow-hidden group">
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="space-y-4 text-center md:text-left z-10">
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider">Leave Balance</span>
            <h2 className="text-2xl md:text-3xl font-black leading-tight">Apply For Leave</h2>
            <p className="text-sm text-white/90">Need time off? Easily request leaves online and track approval status.</p>
            <Link href={route('leave.create')} className="inline-block px-6 py-2.5 bg-white text-[#1e88e5] font-bold rounded-xl shadow-lg hover:bg-gray-100 transition-colors">
              Request Leave
            </Link>
          </div>
          {/* Custom Illustration SVG */}
          <div className="mt-4 md:mt-0 z-10 shrink-0 hidden sm:block">
            <svg width="150" height="150" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="80" fill="white" fillOpacity="0.1" />
              <rect x="60" y="40" width="80" height="110" rx="10" fill="white" />
              <circle cx="100" cy="70" r="20" fill="#26c6da" />
              <rect x="75" y="105" width="50" height="8" rx="4" fill="#eef5f9" />
              <rect x="85" y="120" width="30" height="8" rx="4" fill="#eef5f9" />
              <path d="M125,50 L145,35 L145,65 Z" fill="#ffb22b" />
            </svg>
          </div>
        </div>

        {/* Banner Card 2: Attendance card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">My Attendance</h2>
              <p className="text-gray-400 text-sm mt-1">Track check-in and check-out logs</p>
            </div>
            <Clock className="w-8 h-8 text-[#7460ee]" />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-center sm:justify-start">
              <AttendanceWidget />
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-50">
              <Link href={route('attendance.index')} className="text-xs font-bold text-[#7460ee] hover:underline flex items-center gap-1">
                Manage Attendance <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Dashboard.layout = (page) => <UserLayout>{page}</UserLayout>;
