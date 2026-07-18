import React from "react";
import { Head, router, usePage } from "@inertiajs/react";
import UserLayout from "@/Layouts/UserLayout";
import { Calendar } from "lucide-react";


export default function UserProjects() {
  const { projects } = usePage().props; // projects fetched from backend
  const rows = projects?.data ?? [];

  return (
    <UserLayout title="My Projects">
      <Head title="My Projects" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Projects</h1>
      </div>

      {rows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rows.map((project) => (
            <div
              key={project.id}
              className="bg-white shadow rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <h2
                  onClick={() =>
                    router.get(route("user.projects.show", project.id))
                  }
                  className="text-lg font-bold text-blue-600 cursor-pointer hover:underline"
                >
                  {project.name}
                </h2>
                <p className="text-sm mt-1 text-gray-500 capitalize">
                  Status: {project.status}
                </p>
                <div className="flex items-center mt-2 text-sm text-gray-600 space-x-3">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" /> {project.start_date}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" /> {project.end_date}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No projects assigned to you.</p>
      )}
    </UserLayout>
  );
}
