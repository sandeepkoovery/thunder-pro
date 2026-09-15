// resources/js/Pages/Admin/Dashboard.jsx
import React, { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, usePage, router } from "@inertiajs/react";
import toast from "react-hot-toast";
import {
  Users,
  FolderKanban,
  ListTodo,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  CreditCard,
  Settings,
  Sparkles,
  CheckCircle2,
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
  const { 
    auth, 
    userPlan = 'basic', 
    subscriptionStatus = 'active', 
    isTrial = false, 
    isTrialExpired = false, 
    daysLeftInTrial = 0,
    isSubscriptionPending = false,
  } = usePage().props;
  const user = auth.user;
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';

  // Subscribe directly from dashboard (same as pricing page)
  const [isSubscribing, setIsSubscribing] = useState(false);
  const handleSubscribe = (planName) => {
    setIsSubscribing(true);
    router.post(route('admin.pricing.subscribe'), {
      plan: planName,
      additional_modules: [],
    }, {
      onSuccess: () => {
        toast.success('Subscription request submitted! Awaiting Super Admin approval.');
        setIsSubscribing(false);
      },
      onError: () => {
        toast.error('Failed to submit subscription request.');
        setIsSubscribing(false);
      },
      onFinish: () => setIsSubscribing(false),
    });
  };

  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        <Head title="Super Admin Dashboard" />

        {/* VUESY STYLE HEADER BANNER */}
        <div className="mp-vuesy-header text-white -mx-[28px] -mt-[24px] px-[28px] py-8 shadow-sm transition-all duration-300 relative rounded-b-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">Super Admin Control Panel</h1>
              <p className="text-xs sm:text-sm text-purple-200 mt-1">
                Manage global application workspaces, subscription plans, and general systems settings.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-purple-200 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span>Logged in as <strong className="text-white font-semibold">Super Admin</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs text-purple-300 font-medium uppercase tracking-wider">Total Registered Admins</div>
              <div className="text-2xl sm:text-3xl font-bold mt-2 text-white">{stats.total_admins ?? 0}</div>
            </div>
          </div>
        </div>

        {/* SaaS Management Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Pricing Config Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-max mb-4">
                <CreditCard size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Plan Pricing & Modules</h3>
              <p className="text-sm text-gray-500 mt-1.5">
                Update subscription plan amounts (e.g. ₹999/month, ₹2999/month) and customize which specific modules are included in each tier.
              </p>
            </div>
            <Link 
              href={route("admin.pricing.index")}
              className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl text-center transition-colors shadow-sm shadow-emerald-600/10"
            >
              Configure Plans
            </Link>
          </div>

          {/* Subscriptions Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-max mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Workspace Subscriptions</h3>
              <p className="text-sm text-gray-500 mt-1.5">
                Check registered administrators, review active plan statuses, and manually switch plans (Basic/Premium) for clients.
              </p>
            </div>
            <button 
              onClick={() => {
                window.location.href = route("admin.pricing.index") + "?tab=admins";
              }}
              className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl text-center transition-colors shadow-sm shadow-blue-600/10 animate-none cursor-pointer"
            >
              Manage Subscriptions
            </button>
          </div>

          {/* Site Settings Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-max mb-4">
                <Settings size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">General Settings</h3>
              <p className="text-sm text-gray-500 mt-1.5">
                Configure global settings, monthly working days calculator parameters, and handle hidden modules/beta-menu releases.
              </p>
            </div>
            <Link 
              href={route("admin.settings.index")}
              className="mt-6 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl text-center transition-colors shadow-sm shadow-purple-600/10"
            >
              Configure Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

      {/* VUESY STYLE HEADER BANNER */}
      <div className="mp-vuesy-header text-white -mx-[28px] -mt-[24px] px-[28px] py-6 sm:py-8 shadow-sm transition-all duration-300 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">Dashboard</h1>
              {userPlan === 'premium' ? (
                isTrial ? (
                  <span className="px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-xs font-bold flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-300" />
                    Premium Free Trial
                  </span>
                ) : isTrialExpired ? (
                  <span className="px-3 py-0.5 rounded-full bg-red-400/20 text-red-200 border border-red-300/30 text-xs font-bold flex items-center gap-1">
                    <AlertCircle size={12} className="text-red-300" />
                    Trial Expired
                  </span>
                ) : (
                  <span className="px-3 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-xs font-bold flex items-center gap-1">
                    <Sparkles size={12} className="text-emerald-300" />
                    Premium Plan
                  </span>
                )
              ) : (
                <span className="px-3 py-0.5 rounded-full bg-blue-400/20 text-blue-200 border border-blue-300/30 text-xs font-bold">
                  Basic Plan
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-purple-200 mt-1 mp-header-breadcrumb">
              <Link href="/" className="hover:text-white transition-colors">Home</Link> &gt; <span className="text-white">Dashboard</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-purple-200 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span>Welcome back, <strong className="text-white font-semibold">{user?.name}</strong></span>
            </div>
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

      {/* TENANT ADMIN SUBSCRIPTION & TRIAL BANNER */}
      {isAdmin && (
        <div className="pt-2">
          {isTrial ? (
            isSubscriptionPending ? (
              // Already requested subscription – show pending state
              <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/30 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={24} className="text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                        Premium Plan (Free Trial)
                      </span>
                      <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                        ⏳ <strong>{daysLeftInTrial} {daysLeftInTrial === 1 ? 'Day' : 'Days'} Left</strong> in Free Trial
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mt-1.5">
                      Subscription Requested – Awaiting Super Admin Approval
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 max-w-2xl">
                      Your subscription request has been submitted. You have full Premium access during your free trial. Subscription activates after Super Admin approval.
                    </p>
                  </div>
                </div>
                <div className="px-5 py-2.5 bg-amber-100 text-amber-700 font-bold text-xs uppercase tracking-wider rounded-2xl border border-amber-200 flex items-center gap-2 whitespace-nowrap flex-shrink-0">
                  <CheckCircle2 size={16} />
                  <span>Pending Approval</span>
                </div>
              </div>
            ) : (
              // Trial active, not yet subscribed – show Subscribe Now
              <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/30 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={24} className="text-amber-600 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                        Premium Plan (Free Trial)
                      </span>
                      <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                        ⏳ <strong>{daysLeftInTrial} {daysLeftInTrial === 1 ? 'Day' : 'Days'} Left</strong> in Free Trial
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mt-1.5">
                      Your 1-Month Premium Free Trial is Active
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 max-w-2xl">
                      You currently have full access to all Premium features. Subscribe to an active paid subscription now to ensure uninterrupted access when your trial ends.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSubscribe('premium')}
                  disabled={isSubscribing}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-blue-600/20 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer"
                >
                  <CreditCard size={16} />
                  <span>{isSubscribing ? 'Processing...' : 'Subscribe Now'}</span>
                </button>
              </div>
            )
          ) : isTrialExpired ? (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200">
                      Trial Expired
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mt-1.5">
                    Your Premium Free Trial Has Expired
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 max-w-2xl">
                    Your 1-month free trial period has ended. Subscribe to a paid subscription now to reactivate access to Premium features.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSubscribe('premium')}
                disabled={isSubscribing}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-blue-600/20 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer"
              >
                <CreditCard size={16} />
                <span>{isSubscribing ? 'Processing...' : 'Subscribe Now'}</span>
              </button>
            </div>
          ) : userPlan === 'basic' ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <CreditCard size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Basic Plan
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mt-1.5">
                    Active Subscription: Basic Plan
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 max-w-2xl">
                    You are currently on the Basic Plan (up to 10 active employees, core tracking). Upgrade to Premium Plan for unlimited users, Calendar, Chat, Executive Reports, Cloud Drive & Add-on modules.
                  </p>
                </div>
              </div>
              <Link
                href={route("admin.pricing.index")}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-blue-600/20 flex items-center gap-2 whitespace-nowrap transition-all"
              >
                <Sparkles size={16} />
                <span>Upgrade to Premium</span>
              </Link>
            </div>
          ) : null}
        </div>
      )}

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
