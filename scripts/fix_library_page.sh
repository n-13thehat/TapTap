#!/usr/bin/env bash
set -euo pipefail
FILE="app/library/page.tsx"

echo "🧹 Cleaning and repairing $FILE …"

# 1️⃣ Remove broken section starting after the default case (~372 to EOF)
awk 'NR<372{print;exit}' "$FILE" > "$FILE.tmp" || true
mv "$FILE.tmp" "$FILE"

# 2️⃣ Append clean, balanced ending + SettingsPanel
cat >> "$FILE" <<'TSX'

      <div className="p-8 text-gray-400">
        {activeSection} section coming soon.
      </div>
    );
  }   // closes switch
};    // closes renderMain

return (
  <div className="flex min-h-screen bg-black/90 text-white">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-800/30">
        <AnimatePresence mode="wait">{renderMain()}</AnimatePresence>
      </main>
    </div>
    <MiniPlayer
      track={currentTrack}
      playing={playing}
      onPlayPause={() => setPlaying((p) => !p)}
      onNext={() => console.log("next")}
      onPrev={() => console.log("prev")}
    />
    <PlaylistModal
      open={showPlaylistModal}
      onClose={() => setShowPlaylistModal(false)}
      onSave={handleCreatePlaylist}
    />
  </div>
);
} // closes LibraryPageInternal

export default dynamic(() => Promise.resolve(LibraryPageInternal), { ssr: false });

/*──────────────────────────────────────────────
  🧰 ZION Settings Panel (Dynamic Theme Switch)
──────────────────────────────────────────────*/
const SettingsPanel = ({ settings, updateSetting, session }) => (
  <div className="p-8 space-y-8 transition-colors duration-500">
    <h2 className="text-2xl font-semibold text-accent">Settings</h2>

    {/* Appearance */}
    <div className="bg-surface border border-accent/40 p-6 rounded-2xl space-y-4">
      <h3 className="text-lg font-semibold text-accent mb-2">Appearance</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => updateSetting("theme", e.target.value)}
            className="bg-black/40 border border-accent/40 rounded-lg px-3 py-2 text-sm outline-none text-white focus:border-accent w-full"
          >
            <option value="zion">ZION (Teal)</option>
            <option value="hope">HOPE (Blue)</option>
            <option value="muse">MUSE (Violet)</option>
            <option value="treasure">TREASURE (Green)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">UI Density</label>
          <select
            value={settings.ui_density}
            onChange={(e) => updateSetting("ui_density", e.target.value)}
            className="bg-black/40 border border-accent/40 rounded-lg px-3 py-2 text-sm outline-none text-white focus:border-accent w-full"
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
            <option value="spacious">Spacious</option>
          </select>
        </div>
      </div>
    </div>

    {/* Notifications */}
    <div className="bg-surface border border-accent/40 p-6 rounded-2xl space-y-3">
      <h3 className="text-lg font-semibold text-accent mb-2">Notifications</h3>
      {Object.keys(settings.notifications).map((key) => (
        <label key={key} className="flex items-center gap-3 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={settings.notifications[key]}
            onChange={(e) =>
              updateSetting("notifications", {
                ...settings.notifications,
                [key]: e.target.checked,
              })
            }
            className="accent-accent scale-110"
          />
          <span className="capitalize">{key}</span>
        </label>
      ))}
    </div>

    {/* Account */}
    <div className="bg-surface border border-accent/40 p-6 rounded-2xl space-y-2">
      <h3 className="text-lg font-semibold text-accent mb-2">Account</h3>
      <p className="text-sm text-gray-400">
        <span className="text-accent">Username:</span> {session?.user?.name || "—"}
      </p>
      <p className="text-sm text-gray-400">
        <span className="text-accent">Email:</span> {session?.user?.email || "—"}
      </p>
    </div>

    {/* Developer Mode */}
    <div className="bg-surface border border-accent/40 p-6 rounded-2xl">
      <label className="flex items-center gap-3 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={settings.developer_mode}
          onChange={(e) => updateSetting("developer_mode", e.target.checked)}
          className="accent-accent scale-110"
        />
        Enable Developer Mode
      </label>
    </div>
  </div>
);
TSX

echo "✅ Library page repaired and balanced."
