import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, Inbox, Plus } from "lucide-react";

export default function TasksIndex() {
  const { tasks } = usePage().props;

  const statusBadges = {
    'not started': 'bg-gray-100 text-gray-600 border border-gray-200/50',
    'in progress': 'bg-blue-50 text-blue-600 border border-blue-100/50',
    'completed': 'bg-emerald-50 text-emerald-600 border border-emerald-100/50',
    'on hold': 'bg-amber-50 text-amber-600 border border-amber-100/50',
  };

  const priorityBadges = {
    'high': 'bg-red-50 text-red-600 border border-red-100/50',
    'medium': 'bg-amber-50 text-amber-600 border border-amber-100/50',
    'low': 'bg-gray-100 text-gray-500 border border-gray-200/50',
  };

  return (
    <AdminLayout title="Tasks">
      <Head title="Tasks List" />

      <div className="w-full space-y-6 font-sans pb-10">
        {/* Header Panel */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tasks Management</h1>
            <p className="text-gray-500 font-medium">Configure, assign, and track employee workload schedules.</p>
          </div>
          <Link
            href={route("admin.tasks.create")}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest text-[11px] transition-all shadow-md shadow-blue-600/25 flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={2.5} />
            New Task
          </Link>
        </div>

        {/* Datatable Wrapper */}
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[13px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">
                  <th className="py-4 px-6 w-16 text-center">ID</th>
                  <th className="py-4 px-6">Task</th>
                  <th className="py-4 px-6">Project</th>
                  <th className="py-4 px-6">Assignee</th>
                  <th className="py-4 px-6">Start Date</th>
                  <th className="py-4 px-6">End Date</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Priority</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.data.length > 0 ? (
                  tasks.data.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 text-center text-gray-400 font-bold text-sm">
                        #{task.id}
                      </td>
                      <td className="py-4 px-6">
                        <Link
                          href={route("admin.tasks.show", task.id)}
                          className="font-bold text-gray-800 text-[15px] hover:text-blue-600 transition-colors"
                        >
                          {task.name}
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-[15px] text-gray-700 font-medium">
                        {task.project?.name || "-"}
                      </td>
                      <td className="py-4 px-6 text-[15px] text-gray-700 font-medium">
                        {task.assignee?.name || "-"}
                      </td>
                      <td className="py-4 px-6 text-[15px] text-gray-700 font-medium">
                        {task.start_date || "-"}
                      </td>
                      <td className="py-4 px-6 text-[15px] text-gray-700 font-medium">
                        {task.end_date || "-"}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-80 capitalize ${statusBadges[task.status] || 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${priorityBadges[task.priority] || 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2.5 text-gray-400">
                          <Link
                            href={route("admin.tasks.show", task.id)}
                            className="hover:text-blue-500 transition-colors p-1.5 hover:bg-blue-55 rounded-lg"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            href={route("admin.tasks.edit", task.id)}
                            className="hover:text-gray-700 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
                            title="Edit Task"
                          >
                            <Edit size={16} />
                          </Link>
                          <Link
                            href={route("admin.tasks.destroy", task.id)}
                            method="delete"
                            as="button"
                            className="hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                            title="Delete Task"
                          >
                            <Trash2 size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-gray-400 font-medium italic">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Inbox size={28} className="text-gray-300" />
                        No tasks found in the database.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table pagination stats footer */}
          {tasks.data.length > 0 && tasks.links.length > 3 && (
            <div className="bg-white px-6 py-5 border-t border-gray-50 flex items-center justify-center gap-1.5">
              {tasks.links.map((link, idx) => (
                <Link
                  key={idx}
                  href={link.url || ""}
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
      </div>
    </AdminLayout>
  );
}
