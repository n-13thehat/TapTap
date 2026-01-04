"use client";
import { useState } from "react";

export default function CreatorRequestPage() {
  const [form, setForm] = useState({ stageName: "", genre: "", socialLinks: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/creator/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) setMsg("? Request submitted successfully.");
    else setMsg("? " + data.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <form onSubmit={submit} className="p-8 bg-white/10 rounded-2xl backdrop-blur w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center text-teal-400">Creator Access Request</h2>
        <input placeholder="Stage Name" onChange={e=>setForm({...form,stageName:e.target.value})}
          className="w-full p-2 bg-black/40 border border-white/20 rounded" required/>
        <input placeholder="Genre" onChange={e=>setForm({...form,genre:e.target.value})}
          className="w-full p-2 bg-black/40 border border-white/20 rounded" required/>
        <textarea placeholder="Social Links (comma separated)" onChange={e=>setForm({...form,socialLinks:e.target.value})}
          className="w-full p-2 bg-black/40 border border-white/20 rounded h-24"/>
        <button disabled={loading} className="w-full py-2 bg-teal-500 rounded hover:bg-teal-600">
          {loading ? "Submitting..." : "Submit Request"}
        </button>
        {msg && <p className="text-center mt-2">{msg}</p>}
      </form>
    </div>
  );
}
