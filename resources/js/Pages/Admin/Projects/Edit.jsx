import React from "react";
import { Head, useForm, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";

export default function EditProject({ project }) {
  const { data, setData, put, processing, errors } = useForm({
    name: project.name || "",
    description: project.description || "",
    status: project.status || "not started",
    start_date: project.start_date || "",
    end_date: project.end_date || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route("admin.projects.update", project.id), {
      preserveScroll: true,
      onError: (errors) => {
        console.log("Validation errors:", errors);
      },
    });
  };

  return (
    <AdminLayout>
      <Head title="Edit Project" />
      <div className="container mx-auto p-10 mt-10">
        <div className="bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] rounded-[40px] p-16 max-w-2xl mx-auto border border-slate-50">
          <div className="mb-14 text-center">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-1">Update Segment</h1>
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">Management Interface Console</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Identity */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3.5 px-0.5">Project Identifier</label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
                className={`w-full bg-slate-50/50 border border-slate-100 px-8 py-5 rounded-[20px] text-lg font-bold text-slate-900 focus:bg-white focus:ring-8 focus:ring-slate-100/50 focus:border-slate-300 transition-all placeholder:text-slate-200 ${errors.name ? "border-red-200 ring-2 ring-red-50" : ""}`}
                placeholder="ASSIGN UNIQUE TITLE..."
              />
              {errors.name && (
                <div className="text-red-500 text-xs mt-3 px-1 font-bold tracking-tight">{errors.name}</div>
              )}
            </div>

            {/* Scope */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3.5 px-0.5">Operational Scope</label>
              <textarea
                value={data.description}
                onChange={(e) => setData("description", e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100 px-8 py-6 rounded-[20px] text-[17px] font-bold text-slate-900 focus:bg-white focus:ring-8 focus:ring-slate-100/50 focus:border-slate-300 transition-all min-h-[160px] resize-none no-scrollbar placeholder:text-slate-200"
                placeholder="DEFINE OBJECTIVES & GOALS..."
              />
              {errors.description && (
                <div className="text-red-500 text-xs mt-3 px-1 font-bold tracking-tight">{errors.description}</div>
              )}
            </div>

            {/* Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="col-span-full">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3.5 px-0.5">Status Matrix</label>
                <select
                  value={data.status}
                  onChange={(e) => setData("status", e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-100 px-7 py-5 rounded-[20px] text-xs font-black uppercase tracking-widest text-slate-700 focus:ring-8 focus:ring-slate-100/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="not started">Pending</option>
                  <option value="in progress">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="on hold">Inactive</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3.5 px-0.5">Launched</label>
                <input
                  type="date"
                  value={data.start_date}
                  onChange={(e) => setData("start_date", e.target.value)}
                  className={`w-full bg-slate-50/50 border border-slate-100 px-7 py-5 rounded-[20px] text-xs font-black text-slate-700 focus:ring-8 focus:ring-slate-100/50 transition-all uppercase ${errors.start_date ? "border-red-200" : ""}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3.5 px-0.5">Deadline</label>
                <input
                  type="date"
                  value={data.end_date}
                  onChange={(e) => setData("end_date", e.target.value)}
                  className={`w-full bg-slate-50/50 border border-slate-100 px-7 py-5 rounded-[20px] text-xs font-black text-slate-700 focus:ring-8 focus:ring-slate-100/50 transition-all uppercase ${errors.end_date ? "border-red-200" : ""}`}
                />
              </div>
            </div>

            {/* Command Area */}
            <div className="flex gap-4 pt-8 border-t border-slate-50">
              <Link
                href="/admin/projects"
                className="px-10 py-3.5 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-center"
              >
                Discard
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="flex-1 py-3.5 px-10 text-sm font-semibold text-white bg-slate-900 hover:bg-black rounded-xl shadow-[0_10px_20px_-10px_rgba(15,23,42,0.4)] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Update Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
