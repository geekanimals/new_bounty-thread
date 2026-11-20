"use client";

/**
 * Video mein music jodna — poora creator ke browser mein (ffmpeg core, jsDelivr se pehli baar load, phir cache).
 * Video re-encode nahi hota (-c:v copy) — sirf audio AAC mein banta hai, isliye jaldi hota hai.
 *
 * mixMusic(video, music, { start, musicVol, keepOriginal, onLog }) → naya MP4 File
 */
const CORE = "https://cdn.jsdelivr.net/npm/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js";
const WASM = "https://cdn.jsdelivr.net/npm/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.wasm";

let scriptP = null;
function loadCoreScript() {
  if (typeof window !== "undefined" && window.createFFmpegCore) return Promise.resolve();
  if (!scriptP)
    scriptP = new Promise((ok, bad) => {
      const s = document.createElement("script");
      s.src = CORE;
      s.async = true;
      s.onload = () => (window.createFFmpegCore ? ok() : bad(new Error("Music tool didn't load")));
      s.onerror = () => {
        scriptP = null;
        bad(new Error("Couldn't load the music tool — check your internet and try again."));
      };
      document.head.appendChild(s);
    });
  return scriptP;
}

async function runFfmpeg(files, args, onLog) {
  await loadCoreScript();
  const logs = [];
  const Core = await window.createFFmpegCore({
    print: (t) => logs.push(t),
    printErr: (t) => {
      logs.push(t);
      if (onLog) onLog(t);
    },
    locateFile: (path, prefix) => (path.endsWith(".wasm") ? WASM : prefix + path),
    mainScriptUrlOrBlob: CORE,
    noExitRuntime: true,
  });
  for (const [name, data] of Object.entries(files)) Core.FS.writeFile(name, data);
  const main = Core.cwrap("main", "number", ["number", "number"]);
  const all = ["ffmpeg", "-nostdin", "-hide_banner", "-y", ...args];
  const argv = Core._malloc(all.length * 4);
  all.forEach((s, i) => {
    const n = Core.lengthBytesUTF8(s) + 1;
    const buf = Core._malloc(n);
    Core.stringToUTF8(s, buf, n);
    Core.setValue(argv + 4 * i, buf, "i32");
  });
  try {
    main(all.length, argv);
  } catch (e) {
    // ffmpeg khatam hone par emscripten "exit" throw karta hai — output file se pata chalega
    if (!(e && (e.name === "ExitStatus" || /exit|unwind/i.test(String(e.message || e))))) throw e;
  }
  let out = null;
  try {
    out = Core.FS.readFile("out.mp4");
  } catch {
    /* nahi bana */
  }
  return { out, logs };
}

const ext = (f, d) => ((String(f.name || "").match(/\.([a-z0-9]{2,4})$/i) || [])[1] || d).toLowerCase();

export async function mixMusic(video, music, { start = 0, musicVol = 1, origVol = 1, keepOriginal = false, hasOrigAudio = false, onLog } = {}) {
  const vIn = "in." + ext(video, "mp4");
  const aIn = "music." + ext(music, "mp3");
  const files = { [vIn]: new Uint8Array(await video.arrayBuffer()), [aIn]: new Uint8Array(await music.arrayBuffer()) };
  const ss = Math.max(0, Number(start) || 0);
  const mv = Math.min(2, Math.max(0, Number(musicVol) || 0)).toFixed(2);
  const ov = Math.min(2, Math.max(0, Number(origVol) || 0)).toFixed(2);
  // music chhota ho to loop hota rahe — video poori lambi rahe (music video ke saath khatam)
  const base = ["-i", vIn, "-stream_loop", "-1", "-ss", String(ss), "-i", aIn];
  const args =
    keepOriginal && hasOrigAudio
      ? [...base, "-filter_complex", `[0:a]volume=${ov}[a0];[1:a]volume=${mv}[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=0[a]`, "-map", "0:v:0", "-map", "[a]", "-shortest"]
      : [...base, "-filter_complex", `[1:a]volume=${mv}[a]`, "-map", "0:v:0", "-map", "[a]", "-shortest"];
  args.push("-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2", "-movflags", "+faststart", "out.mp4");
  const { out, logs } = await runFfmpeg(files, args, onLog);
  if (!out || out.length < 1000) {
    const last = logs.filter((l) => /error|invalid|could not|no such/i.test(l)).slice(-2).join(" · ");
    throw new Error("Couldn't add the music" + (last ? ` — ${last}` : " — try another song file (MP3 / M4A)."));
  }
  const name = String(video.name || "video").replace(/\.[^.]+$/, "") + "-music.mp4";
  return new File([out], name, { type: "video/mp4" });
}

/** Photo + song → chhota video (story / reel ke liye, 1080×1920, photo beech mein). seconds: 5–60 */
export async function photoToVideo(photo, music, { seconds = 15, start = 0, musicVol = 1, onLog } = {}) {
  const iIn = "img." + (/png/i.test(photo.type || "") ? "png" : "jpg");
  const aIn = "music." + ext(music, "mp3");
  const files = { [iIn]: new Uint8Array(await photo.arrayBuffer()), [aIn]: new Uint8Array(await music.arrayBuffer()) };
  const t = Math.min(60, Math.max(3, Math.round(Number(seconds) || 15)));
  const mv = Math.min(2, Math.max(0, Number(musicVol) || 0)).toFixed(2);
  const args = [
    "-loop", "1", "-framerate", "30", "-i", iIn,
    "-stream_loop", "-1", "-ss", String(Math.max(0, Number(start) || 0)), "-i", aIn,
    "-t", String(t),
    "-filter_complex", `[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p[v];[1:a]volume=${mv}[a]`,
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "ultrafast", "-tune", "stillimage", "-r", "30",
    "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2", "-shortest", "-movflags", "+faststart", "out.mp4",
  ];
  const { out, logs } = await runFfmpeg(files, args, onLog);
  if (!out || out.length < 1000) {
    const last = logs.filter((l) => /error|invalid|could not|no such/i.test(l)).slice(-2).join(" · ");
    throw new Error("Couldn't add the music to the photo" + (last ? ` — ${last}` : " — try another song file (MP3 / M4A)."));
  }
  return new File([out], String(photo.name || "photo").replace(/\.[^.]+$/, "") + "-music.mp4", { type: "video/mp4" });
}
