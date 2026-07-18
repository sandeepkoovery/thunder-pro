import React from "react";
import { useForm, Link } from "@inertiajs/react";

export default function Edit({ task, projects, users }) {
  const { data, setData, put, errors } = useForm({
    project_id: task.project_id || "",
    user_id: task.user_id || "",
    name: task.name || "",
    caption: task.caption || "",
    thumb_text: task.thumb_text || "",
    description: task.description || "",
    status: task.status || "not started",
    start_date: task.start_date || "",
    end_date: task.end_date || "",
    priority: task.priority || "medium",
  });

  function submit(e) {
    e.preventDefault();
    put(route("admin.tasks.update", task.id));
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Edit Task</h1>
      <form onSubmit={submit} className="space-y-4">
        <select
          className="border p-2 w-full"
          value={data.project_id}
          onChange={(e) => setData("project_id", e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="border p-2 w-full"
          value={data.user_id}
          onChange={(e) => setData("user_id", e.target.value)}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <input
          className="border p-2 w-full"
          value={data.name}
          onChange={(e) => setData("name", e.target.value)}
        />
        <input
          className="border p-2 w-full"
          placeholder="Caption (optional)"
          value={data.caption}
          onChange={(e) => setData("caption", e.target.value)}
        />
        <input
          className="border p-2 w-full"
          placeholder="Thumb Text (optional)"
          value={data.thumb_text}
          onChange={(e) => setData("thumb_text", e.target.value)}
        />
        <textarea
          className="border p-2 w-full"
          value={data.description}
          onChange={(e) => setData("description", e.target.value)}
        />
        <select
          className="border p-2 w-full"
          value={data.status}
          onChange={(e) => setData("status", e.target.value)}
        >
          <option>not started</option>
          <option>in progress</option>
          <option>completed</option>
          <option>on hold</option>
        </select>
        <input
          type="date"
          className="border p-2"
          value={data.start_date}
          onChange={(e) => setData("start_date", e.target.value)}
        />
        <input
          type="date"
          className="border p-2"
          value={data.end_date}
          onChange={(e) => setData("end_date", e.target.value)}
        />
        <select
          className="border p-2 w-full"
          value={data.priority}
          onChange={(e) => setData("priority", e.target.value)}
        >
          <option>low</option>
          <option>medium</option>
          <option>high</option>
        </select>

        <button className="px-3 py-2 bg-blue-600 text-white rounded">
          Update
        </button>
        <Link href={route("admin.tasks.index")} className="ml-2 underline">
          Cancel
        </Link>
      </form>
    </div>
  );
}
