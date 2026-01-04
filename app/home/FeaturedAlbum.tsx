"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_ALBUM_BUCKET,
  DEFAULT_ALBUM_NAME,
  DEFAULT_ALBUM_STORAGE_DASHBOARD_URL,
  getDefaultAlbumPublicUrl,
} from "@/lib/defaultAlbumConfig";

export default function FeaturedAlbum() {
  const [tracks, setTracks] = useState<any[]>([]);
  const bucket = DEFAULT_ALBUM_BUCKET;

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.storage.from(bucket).list();
      if (error) return console.error("Supabase error:", error);
      setTracks((data ?? []).filter(f => f.name.endsWith(".mp3")));
    };
    load();
  }, [bucket]);

  return (
    <div className="mt-8 rounded-2xl bg-white/5 p-6 border border-white/10 backdrop-blur-sm">
                  <h2 className="text-xl font-bold text-teal-400 mb-4">Featured Album: {DEFAULT_ALBUM_NAME}</h2>
      <p className="text-[11px] text-white/60">
        Default album bucket: <a
          className="underline text-teal-200"
          target="_blank"
          rel="noreferrer"
          href={DEFAULT_ALBUM_STORAGE_DASHBOARD_URL}
        >
          Default Album Music For The Future
        </a>
      </p>
      {tracks.length === 0 ? (
        <p className="text-white/60">No tracks yet...</p>
      ) : (
        <div className="space-y-3">
          {tracks.map(t => (
            <div key={t.name} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/10">
              <span>{t.name.replace(/\.mp3$/,"")}</span>
              <audio
                controls
                src={getDefaultAlbumPublicUrl(t.name)}
                className="w-48"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
