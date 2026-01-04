import fs from "fs";
import path from "path";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const albumDir = "C:\\Users\\Revolutions.Inc\\Desktop\\TapTap-Mainframe gitty\\TapTap_Matrix_BuildID_ZION\\app\\stemstation\\Music For The Future -vx9";
const title = "Music For The Future - Vx9";
const artist = "VX9";

async function uploadFile(localPath, bucket, remoteName) {
  const fileBuffer = fs.readFileSync(localPath);
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(remoteName, fileBuffer, {
      upsert: true,
      contentType: localPath.toLowerCase().endsWith(".png")
        ? "image/png"
        : "audio/mpeg",
    });
  if (error) throw error;
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(remoteName);
  return pub.publicUrl;
}

(async () => {
  try {
    const bucket = "music";
    const files = fs.readdirSync(albumDir);

    // upload album art
    const artFile = files.find(f => f.toLowerCase().includes("png"));
    const artPath = artFile ? path.join(albumDir, artFile) : null;
    const artUrl = artPath
      ? await uploadFile(artPath, bucket, `MusicForTheFuture/${artFile}`)
      : null;

    // upload audio
    const audioFiles = files.filter(f =>
      [".mp3", ".wav", ".flac"].some(ext => f.toLowerCase().endsWith(ext))
    );

    for (const file of audioFiles) {
      const filePath = path.join(albumDir, file);
      const publicUrl = await uploadFile(
        filePath,
        bucket,
        `MusicForTheFuture/${file}`
      );

      const { error } = await supabase.from("songs").insert({
        title: path.parse(file).name,
        artist,
        album: title,
        cover_art: artUrl || "/crop tap.png",
        file_url: publicUrl,
        created_at: new Date().toISOString(),
      });
      if (error) console.error("DB insert error:", error);
      else console.log("? Uploaded + registered", file);
    }

    console.log("?? Default album upload complete!");
  } catch (err) {
    console.error("? Upload failed:", err.message);
  }
})();
