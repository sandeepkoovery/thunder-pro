import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { Eye } from "lucide-react";

const route = window.route;

export default function TasksIndex() {
  const { tasks } = usePage().props;

  return (
    <>
      <Head title="Tasks" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <Link
            href="/admin/tasks/create"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + New Task
          </Link>
        </div>

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">ID</th>
                <th className="p-2">Task</th>
                <th className="p-2">Project</th>
                <th className="p-2">Assignee</th>
                <th className="p-2">Start</th>
                <th className="p-2">End</th>
                <th className="p-2">Status</th>
                <th className="p-2">Priority</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.data.length > 0 ? (
                tasks.data.map((task) => (
                  <tr key={task.id} className="border-t">
                    <td className="p-2">{task.id}</td>
                    <td className="p-2">{task.name}</td>
                    <td className="p-2">{task.project?.name}</td>
                    <td className="p-2">{task.assignee?.name}</td>
                    <td className="p-2">{task.start_date}</td>
                    <td className="p-2">{task.end_date}</td>
                    <td className="p-2">{task.status}</td>
                    <td className="p-2">{task.priority}</td>
                    <td className="p-2 flex gap-2">
                      <Link
                        href={`/admin/tasks/${task.id}/edit`}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/tasks/${task.id}`}
                        method="delete"
                        as="button"
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center p-4">
                    No tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-center">
          {tasks.links.map((link) => (
            <Link
              key={link.label}
              href={link.url || ""}
              className={`px-4 py-2 border rounded mx-1 ${link.active ? "bg-blue-600 text-white" : "bg-white text-gray-700"
                } ${!link.url ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
