"use client";
import React from "react";

export default function Stories({ users }: { users: Array<{ id: string; username?: string | null; image?: string | null }> }) {
  if (!users?.length) return null;
  return (
    <div className="no-scrollbar mb-3 flex gap-3 overflow-x-auto py-1">
      {users.slice(0, 12).map((u) => (
        <div key={u.id} className="group relative grid w-16 place-items-center text-center">
          <div className="rounded-full p-[2px] bg-[conic-gradient(from_90deg,rgba(94,234,212,.8),rgba(14,165,233,.6),rgba(94,234,212,.8))]">
            <div className="h-12 w-12 rounded-full bg-neutral-900 ring-1 ring-white/10 overflow-hidden">
              <img src={u.image || "/avatar.png"} alt={u.username || u.id} className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="mt-1 truncate text-[11px] text-white/70 w-16">{u.username || "user"}</div>
        </div>
      ))}
    </div>
  );
}

