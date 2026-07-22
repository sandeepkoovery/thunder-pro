// resources/js/Pages/Admin/Dashboard.jsx
import React, { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import {
  Users,
  FolderKanban,
  ListTodo,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  TrendingUp
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Mock data for task activity & productivity over time (matching Vuesy Jan-Jul layout)
const productivityData = [
  { name: "Jan", assigned: 15, completed: 8 },
  { name: "Feb", assigned: 25, completed: 15 },
  { name: "Mar", assigned: 35, completed: 24 },
  { name: "Apr", assigned: 30, completed: 22 },
  { name: "May", assigned: 45, completed: 35 },
  { name: "Jun", assigned: 35, completed: 28 },
  { name: "Jul", assigned: 50, completed: 42 }
];

export default function Dashboard({
  stats = {},
  users = [],
  todayAttendance,
  personalStats
}) {
  const { auth } = usePage().props;
  const user = auth.user;
  const [statsExpanded, setStatsExpanded] = useState(true);
  const [timeframe, setTimeframe] = useState("Yearly");
  const [distributionTimeframe, setDistributionTimeframe] = useState("Monthly");

  // Stats calculation
  const totalUsers = stats.total_users ?? 0;
  const totalProjects = stats.total_projects ?? 0;
  const totalTasks = stats.total_tasks ?? 0;
  const pendingLeaves = stats.pending_leaves ?? 0;
  const completedTasks = stats.completed_tasks ?? 0;
  const inProgressTasks = stats.in_progress_tasks ?? 0;
  const pendingTasks = stats.pending_tasks ?? 0;

  // Donut chart logic & fallback
  const hasDonutData = (completedTasks + inProgressTasks + pendingTasks) > 0;
  const donutData = hasDonutData
    ? [
        { name: "Completed", value: completedTasks, color: "#7460ee" },
        { name: "In Progress", value: inProgressTasks, color: "#26c6da" },
        { name: "Pending", value: pendingTasks, color: "#ffb22b" }
      ]
    : [
        { name: "No Tasks", value: 1, color: "#e2e8f0" }
      ];

  const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <Head title="Admin Dashboard" />

      {/* VUESY STYLE DEEP PURPLE HEADER BANNER */}
      <div className="mp-vuesy-header bg-[#2b1440] text-white -mx-[28px] -mt-[24px] px-[28px] py-6 sm:py-8 shadow-sm transition-all duration-300 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">Dashboard</h1>
            <p className="text-xs sm:text-sm text-purple-200 mt-1 mp-header-breadcrumb">
              <Link href="/" className="hover:text-white transition-colors">Home</Link> &gt; <span className="text-white">Dashboard</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-purple-200 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span>Welcome back, <strong className="text-white font-semibold">{user?.name}</strong></span>
          </div>
        </div>

        {/* Expandable/Collapsible Row of Stats (separated by vertical lines) */}
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 transition-all duration-500 ease-in-out overflow-hidden ${
            statsExpanded ? "max-h-[300px] opacity-100 mb-2" : "max-h-0 opacity-0 pointer-events-none mb-0 pb-0 border-none"
          }`}
        >
          {/* Stat 1: Total Users */}
          <Link
            href={route("admin.users.index")}
            className="px-4 border-r border-white/10 hover:opacity-80 transition-opacity block last:border-none"
          >
            <div className="text-xs text-purple-300 font-medium uppercase tracking-wider">Total Users</div>
            <div className="text-2xl sm:text-3xl font-bold mt-2 text-white">{totalUsers}</div>
          </Link>

          {/* Stat 2: Total Projects */}
          <Link
            href={route("admin.projects.index")}
            className="px-4 border-r border-white/10 hover:opacity-80 transition-opacity block last:border-none"
          >
            <div className="text-xs text-purple-300 font-medium uppercase tracking-wider">Total Projects</div>
            <div className="text-2xl sm:text-3xl font-bold mt-2 text-green-400">{totalProjects}</div>
          </Link>

          {/* Stat 3: Total Tasks */}
          <div className="px-4 border-r border-white/10 last:border-none">
            <div className="text-xs text-purple-300 font-medium uppercase tracking-wider">Total Tasks</div>
            <div className="text-2xl sm:text-3xl font-bold mt-2 text-blue-300">{totalTasks}</div>
          </div>

          {/* Stat 4: Pending Leaves */}
          <Link
            href={route("admin.leaves.index")}
            className="px-4 last:border-none hover:opacity-80 transition-opacity block"
          >
            <div className="text-xs text-purple-300 font-medium uppercase tracking-wider">Pending Leaves</div>
            <div className="text-2xl sm:text-3xl font-bold mt-2 text-yellow-300">{pendingLeaves}</div>
          </Link>
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={() => setStatsExpanded(!statsExpanded)}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-8 rounded-full bg-[#7460ee] hover:bg-[#5e45d6] text-white flex items-center justify-center shadow-lg border border-white/10 hover:scale-105 active:scale-95 transition-all z-10"
          title={statsExpanded ? "Collapse Stats" : "Expand Stats"}
        >
          {statsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* DASHBOARD CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Left Card: Task Productivity Overview (Line + Bar Chart) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">System Task Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Task assignments vs completions across the platform</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-400 uppercase">Sort By:</span>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-gray-50 border border-gray-100 text-gray-600 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#7460ee] cursor-pointer"
              >
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Legend Stats Column */}
            <div className="space-y-4 pr-0 md:pr-4 md:border-r border-gray-50">
              <div>
                <span className="text-xs font-medium text-gray-400 block uppercase tracking-wider">Overall Success Rate</span>
                <div className="text-3xl font-black text-gray-800 mt-1">{successRate}%</div>
                <p className="text-xs text-gray-400 mt-1">Platform task completion efficiency</p>
              </div>

              <div className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1.5 rounded-lg border border-green-100 w-max text-xs font-bold">
                <TrendingUp size={13} />
                <span>+12.4% this month</span>
              </div>

              <div className="pt-2 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7460ee]"></span>
                    Total Tasks
                  </span>
                  <span className="font-bold text-gray-700">{totalTasks}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#26c6da]"></span>
                    Completed Tasks
                  </span>
                  <span className="font-bold text-gray-700">{completedTasks}</span>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="md:col-span-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={productivityData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#26c6da" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#26c6da" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#1e293b"
                    }}
                  />
                  <Bar dataKey="assigned" barSize={14} fill="#7460ee" radius={[4, 4, 0, 0]} />
                  <Area type="monotone" dataKey="completed" stroke="#26c6da" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Card: Task Status Distribution (Donut Chart) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Platform Distribution</h2>
              <p className="text-xs text-gray-400 mt-0.5">Task distribution across statuses</p>
            </div>
            <select
              value={distributionTimeframe}
              onChange={(e) => setDistributionTimeframe(e.target.value)}
              className="bg-gray-50 border border-gray-100 text-gray-600 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#7460ee] cursor-pointer"
            >
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          {/* Donut Chart Visual */}
          <div className="flex justify-center items-center h-40 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={hasDonutData ? 4 : 0}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    borderRadius: "12px",
                    fontSize: "12px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {hasDonutData && (
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-gray-800">{totalTasks}</span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Tasks</span>
              </div>
            )}
          </div>

          {/* Legend Items with Badges */}
          <div className="space-y-2.5 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7460ee]"></span>
                Completed Tasks
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-700">{completedTasks}</span>
                <span className="text-[10px] font-bold text-green-500 bg-green-50 border border-green-100 rounded-md px-1.5 py-0.5">+12.5%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#26c6da]"></span>
                In Progress
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-700">{inProgressTasks}</span>
                <span className="text-[10px] font-bold text-yellow-500 bg-yellow-50 border border-yellow-100 rounded-md px-1.5 py-0.5">+8.3%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffb22b]"></span>
                Pending Tasks
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-700">{pendingTasks}</span>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 rounded-md px-1.5 py-0.5">-2.1%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Dashboard.layout = (page) => <AdminLayout>{page}</AdminLayout>;
