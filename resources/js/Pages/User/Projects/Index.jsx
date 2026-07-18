import React from "react";
import { Head, router } from "@inertiajs/react";
import UserLayout from "@/Layouts/UserLayout";
import { Eye } from "lucide-react";

export default function Index({ projects }) {
  const rows = Array.isArray(projects) ? projects : projects?.data ?? [];

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === "completed" || s === "finished")
      return (
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm">
          Finished
        </span>
      );
    if (s === "in progress")
      return (
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm">
          In Progress
        </span>
      );
    if (s === "on hold")
      return (
        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-sm">
          On Hold
        </span>
      );
    return (
      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-sm">
        Pending
      </span>
    );
  };

  return (
    <UserLayout>
      <Head title="My Projects" />

      {/* ✅ Page Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Projects</h1>
      </div>

      {/* ✅ Project Table */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-blue-50 text-gray-700 text-sm uppercase">
              <th className="p-3 text-left">Project Name</th>
              <th className="p-3 text-left">Start Date</th>
              <th className="p-3 text-left">End Date</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((project) => (
                <tr
                  key={project.id}
                  className="border-t text-gray-700 hover:bg-gray-100 transition"
                >
                  <td
                    className="p-3 font-semibold text-gray-900 text-[15px] tracking-wide hover:text-blue-600 transition-colors cursor-pointer"
                    onClick={() =>
                      router.get(route("tasks.index", { project_id: project.id }))
                    }
                  >
                    {project.name}
                  </td>
                  <td className="p-3 text-gray-600">
                    {project.start_date
                      ? new Date(project.start_date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td className="p-3 text-gray-600">
                    {project.end_date
                      ? new Date(project.end_date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td className="p-3">{getStatusBadge(project.status)}</td>
                  <td className="p-3 flex justify-center">
                    <button
                      onClick={() =>
                        router.get(route("tasks.index", { project_id: project.id }))
                      }
                      className="text-blue-600 hover:text-blue-800"
                      title="View Project Tasks"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-6 text-gray-500 italic"
                >
                  No projects assigned to you
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </UserLayout>
  );
}
