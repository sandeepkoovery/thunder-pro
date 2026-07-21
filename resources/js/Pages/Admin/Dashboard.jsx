// resources/js/Pages/Admin/Dashboard.jsx
import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import {
  Users,
  FolderKanban,
  ListTodo,
  AlertCircle,
  CalendarCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const sparkLine = [
  { v: 20 }, { v: 35 }, { v: 25 }, { v: 45 }, { v: 30 }, { v: 55 }, { v: 40 },
];
const sparkBars = [
  { v: 10 }, { v: 25 }, { v: 18 }, { v: 35 }, { v: 28 }, { v: 40 }, { v: 32 },
  { v: 50 }, { v: 38 }, { v: 45 }, { v: 30 }, { v: 20 },
];

function MiniLine({ id = "spark-grad" }) {
  return (
    <ResponsiveContainer width={100} height={40}>
      <AreaChart data={sparkLine} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="rgba(255,255,255,0.4)" stopOpacity={1} />
            <stop offset="95%" stopColor="rgba(255,255,255,0)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#ffffff" strokeWidth={2} fill={`url(#${id})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MiniBar() {
  return (
    <ResponsiveContainer width={100} height={40}>
      <BarChart data={sparkBars} margin={{ top: 2, right: 0, left: 0, bottom: 0 }} barSize={5} barGap={1}>
        <Bar dataKey="v" fill="rgba(255,255,255,0.6)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MiniPureLine() {
  return (
    <ResponsiveContainer width={100} height={40}>
      <LineChart data={sparkLine} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <Line type="monotone" dataKey="v" stroke="#ffffff" strokeWidth={2.5} dot={false} strokeDasharray="3 3" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MiniTrend() {
  return (
    <div className="bg-white/15 border border-white/20 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1 shadow-sm backdrop-blur-sm self-center">
      <TrendingUp size={14} className="text-white animate-pulse" />
      <span>+8.2%</span>
    </div>
  );
}

export default function Dashboard({
  stats,
  users = [],
  todayAttendance,
  personalStats,
  recentTasks = [],
}) {
  const { auth } = usePage().props;
  const user = auth.user;
  const isAdmin = ["admin", "superadmin"].includes(user?.role);
  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  const taskPieData = [
    { name: "Completed", value: stats.completed_tasks || 0, color: "#26c6da" },
    { name: "In Progress", value: stats.in_progress_tasks || 0, color: "#1e88e5" },
    { name: "Pending", value: stats.pending_tasks || 0, color: "#ffb22b" },
  ].filter((d) => d.value > 0);

  const myTasksData = [
    { name: "Total", value: personalStats?.total_tasks || 0 },
    { name: "Pending", value: personalStats?.pending_tasks || 0 },
    { name: "In Progress", value: personalStats?.in_progress_tasks || 0 },
    { name: "Done", value: personalStats?.completed_tasks || 0 },
  ];

  const statCards = [
    isAdmin && {
      label: "Total Users",
      subtitle: currentMonth,
      value: stats.total_users ?? 0,
      icon: Users,
      gradient: "linear-gradient(135deg, #7460ee 0%, #9b8cf2 100%)",
      chart: "line",
      link: route("admin.users.index"),
    },
    {
      label: "Total Projects",
      subtitle: currentMonth,
      value: stats.total_projects ?? 0,
      icon: FolderKanban,
      gradient: "linear-gradient(135deg, #49d9a0 0%, #6ee7b7 100%)",
      chart: "bar",
      link: route("admin.projects.index"),
    },
    {
      label: "Total Tasks",
      subtitle: currentMonth,
      value: stats.total_tasks ?? 0,
      icon: ListTodo,
      gradient: "linear-gradient(135deg, #1e88e5 0%, #42a5f5 100%)",
      chart: "pure-line",
      link: null,
    },
    isAdmin && {
      label: "Pending Leaves",
      subtitle: currentMonth,
      value: stats.pending_leaves ?? 0,
      icon: AlertCircle,
      gradient: "linear-gradient(135deg, #ffb22b 0%, #ffd166 100%)",
      chart: "trend",
      link: route("admin.leaves.index"),
    },
  ].filter(Boolean);

  const getStatusColor = (status) => {
    if (status === "completed") return "text-mp-cyan bg-cyan-50";
    if (status === "in progress") return "text-primary bg-blue-50";
    return "text-mp-warning bg-amber-50";
  };

  return (
    <div className="space-y-6">
      <Head title="Admin Dashboard" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-mp shadow-mp-card">
        <div>
          <h1 className="mp-page-title text-lg sm:text-xl">Dashboard</h1>
          <p className="mp-breadcrumb text-sm mt-0.5">
            <Link href="/">Home</Link> &gt;{" "}
            <span>Dashboard</span>
          </p>
        </div>
        <div className="mp-dash-header-chips flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-mp-bg rounded-mp-sm px-4 py-2 flex-1" style={{minWidth:'160px'}}>
            <CalendarCheck className="w-5 h-5 text-mp-cyan flex-shrink-0" />
            <div>
              <div className="text-xs mp-text-muted">Today's Attendance</div>
              <div className="text-sm text-mp-heading">
                {todayAttendance
                  ? `${todayAttendance.check_in || "—"} – ${todayAttendance.check_out || "Active"}`
                  : "Not Checked In"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-mp-bg rounded-mp-sm px-4 py-2 flex-1" style={{minWidth:'140px'}}>
            <TrendingUp className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <div className="text-xs mp-text-muted">My Tasks</div>
              <div className="text-sm text-mp-heading">
                {personalStats?.completed_tasks || 0} / {personalStats?.total_tasks || 0} Done
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const CardWrapper = card.link ? Link : "div";
          return (
            <CardWrapper
              key={i}
              href={card.link || undefined}
              className="dashboard-stat-card group rounded-mp overflow-hidden shadow-mp-card hover:shadow-mp transition-shadow duration-300 flex flex-col p-6 cursor-pointer"
              style={{ background: card.gradient }}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium leading-tight text-white">{card.label}</h3>
                  <p className="text-[11px] tracking-[0.08em] uppercase text-white/80 mt-1">{card.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-6 gap-2">
                <h2 className="text-3xl md:text-4xl font-medium leading-none text-white">{card.value}</h2>
                <div className="opacity-90 flex-shrink-0">
                  {card.chart === "line" && <MiniLine id={`spark-grad-${i}`} />}
                  {card.chart === "bar" && <MiniBar />}
                  {card.chart === "pure-line" && <MiniPureLine />}
                  {card.chart === "trend" && <MiniTrend />}
                </div>
              </div>
            </CardWrapper>
          );
        })}
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-mp shadow-mp-card p-6">
          <div className="border-b border-gray-100 pb-4 mb-4">
            <h2 className="mp-card-title text-lg">Recent Tasks</h2>
            <p className="mp-card-subtitle text-xs">Your latest assigned tasks</p>
          </div>
          {recentTasks.length > 0 ? (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-mp-bg rounded-mp-sm hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      task.status === "completed" ? "bg-mp-cyan" :
                      task.status === "in progress" ? "bg-primary" : "bg-mp-warning"
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm text-mp-heading truncate">{task.title}</p>
                      <p className="text-xs mp-text-muted truncate">
                        {task.project?.name || "No Project"}
                        {task.due_date && ` · Due ${task.due_date}`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 capitalize ml-3 ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-mp-body text-sm">No recent tasks found</div>
          )}
        </div>

        <div className="bg-white rounded-mp shadow-mp-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="mp-card-title text-lg">Team Members</h2>
            <p className="mp-card-subtitle text-xs mb-4">Active users in the system</p>
            <div className="space-y-3">
              {users.slice(0, 6).map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  {u.image ? (
                    <img src={`/storage/${u.image}`} alt={u.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-primary flex items-center justify-center text-sm flex-shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-mp-heading truncate">{u.name}</p>
                    <p className="text-xs mp-text-muted capitalize truncate">{u.designation || u.role || "User"}</p>
                  </div>
                  <div className="ml-auto w-2 h-2 rounded-full bg-accent flex-shrink-0" title="Active" />
                </div>
              ))}
            </div>
          </div>
          <Link
            href={route("admin.users.index")}
            className="w-full flex items-center justify-center gap-2 py-3 bg-mp-purple text-white text-sm font-medium rounded-mp-sm hover:opacity-90 transition-all mt-6 shadow-mp-card"
          >
            View All Users <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

Dashboard.layout = (page) => <AdminLayout>{page}</AdminLayout>;
