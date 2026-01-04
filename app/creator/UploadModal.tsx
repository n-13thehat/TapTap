"use client";
import React, { useState } from "react";

export default function UploadModal() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [createNft, setCreateNft] = useState(false);
  const [priceCents, setPriceCents] = useState<number>(0);
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!file) return alert("Choose a file");
    setPending(true);
    try {
      const res = await fetch("/api/tracks", { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: title || file.name, mimeType: file.type, nft: createNft, priceCents }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Upload init failed');
      alert(createNft ? 'NFT drop initialized (stub)' : 'Track created');
      setOpen(false); setFile(null); setTitle(""); setPriceCents(0); setCreateNft(false);
    } catch (e: any) {
      alert(e?.message || 'Upload failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button onClick={() => setOpen(true)} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-black hover:bg-teal-500">New Upload</button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/90 p-4">
            <div className="mb-3 text-lg font-semibold text-teal-300">Upload</div>
            <input type="file" onChange={(e) => setFile(e.currentTarget.files?.[0] || null)} className="mb-2 block w-full text-xs text-white" />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="mb-2 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-sm outline-none" />
            <label className="mb-2 flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" checked={createNft} onChange={(e) => setCreateNft(e.currentTarget.checked)} /> Create NFT
            </label>
            {createNft && (
              <input type="number" min={0} step={1} value={priceCents} onChange={(e) => setPriceCents(Number(e.target.value || 0))} placeholder="Price (cents)" className="mb-2 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-sm outline-none" />
            )}
            <div className="mt-3 flex items-center justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded border border-white/10 px-3 py-1 text-sm hover:bg-white/10">Cancel</button>
              <button onClick={submit} disabled={!file || pending} className="rounded bg-teal-600 px-3 py-1 text-sm font-semibold text-black hover:bg-teal-500 disabled:opacity-60">{pending ? 'Saving…' : 'Save'}</button>
            </div>
            <div className="mt-2 text-xs text-white/50">Echo AI and Posterize Auto will analyze top moments after upload (stubs).</div>
          </div>
        </div>
      )}
    </div>
  );
}

