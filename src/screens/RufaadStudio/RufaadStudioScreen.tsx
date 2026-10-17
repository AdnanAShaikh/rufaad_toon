/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  Users,
  Music,
  Download,
  Clapperboard,
  Volume2,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Image as ImageIcon,
  Check,
  Film,
  Loader2,
} from "lucide-react";
import type { Scene } from "../../store/slices/sceneSlice";
import type { Character } from "../../store/slices/characterSlice";
import { useAppSelector } from "../../store/hooks";
import { toast } from "react-toastify";

interface VideoEditorScreenProps {
  scenes: Scene[];
  characters: Character[];
  projectTitle?: string;
  projectId: string | undefined; // <-- add
  musicUrl?: string | null;
  onBack: () => void;
}

/** Every scene is a fixed 7-second slide in the final render. */
const SCENE_DURATION = 7;

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const RufaadStudioScreen: React.FC<VideoEditorScreenProps> = ({
  scenes,
  projectId, // <-- add
  characters,
  projectTitle = "Untitled Project",
  musicUrl,
  onBack,
}) => {
  const token = useAppSelector((s) => s.auth.token);

  // ---------- Preview state ----------
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [previewVolume, setPreviewVolume] = useState(70);
  const [musicVolume, setMusicVolume] = useState(15);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const wasPlayingRef = useRef(false); // remembers play state across a drag
  const trackRef = useRef<HTMLDivElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  // ---------- Derived timeline (fixed 7s per scene) ----------
  const durations = useMemo(() => scenes.map(() => SCENE_DURATION), [scenes]);
  const totalDuration = useMemo(
    () => durations.reduce((a, b) => a + b, 0),
    [durations],
  );
  const sceneStarts = useMemo(() => {
    let acc = 0;
    return durations.map((d) => {
      const start = acc;
      acc += d;
      return start;
    });
  }, [durations]);

  const currentSceneIndex = useMemo(() => {
    for (let i = sceneStarts.length - 1; i >= 0; i--) {
      if (currentTime >= sceneStarts[i]) return i;
    }
    return 0;
  }, [currentTime, sceneStarts]);

  // ---------- Preview playback loop (image slideshow timing) ----------
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setCurrentTime((t) => {
        const next = t + dt;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, totalDuration]);

  // Keep filmstrip selection following playback
  useEffect(() => {
    if (isPlaying || isScrubbing) setSelectedIndex(currentSceneIndex);
  }, [currentSceneIndex, isPlaying, isScrubbing]);

  // ---------- Background music ----------
  // Create/destroy a single looping audio element for the project's track.
  useEffect(() => {
    if (!musicUrl) {
      musicAudioRef.current?.pause();
      musicAudioRef.current = null;
      return;
    }
    const audio = new Audio(musicUrl);
    audio.loop = true;
    musicAudioRef.current = audio;
    return () => {
      audio.pause();
      musicAudioRef.current = null;
    };
  }, [musicUrl]);

  // Play/pause the music with the preview and keep its volume in sync.
  useEffect(() => {
    const audio = musicAudioRef.current;
    if (!audio) return;
    audio.volume = musicVolume / 100;
    if (isPlaying) {
      audio.currentTime = currentTime % (audio.duration || totalDuration || 1);
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, musicVolume]);

  // ---------- Handlers ----------
  const selectScene = (i: number) => {
    setSelectedIndex(i);
    setCurrentTime(sceneStarts[i]);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!isPlaying && currentTime >= totalDuration - 0.05) {
      setCurrentTime(0);
    }
    setIsPlaying((p) => !p);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // 1. Ask the backend to render + return the video URL
      const res = await fetch(`${API_BASE}/api/project/${projectId}/render`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ musicVolume }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Render failed (${res.status})`);
      }
      const { videoUrl } = await res.json();

      // 2. Fetch the finished mp4 and save it to the user's device
      const fileRes = await fetch(videoUrl);
      const blob = await fileRes.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectTitle || "video"}.mp4`; // the saved filename
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  // ---------- Scrubbing (draggable playhead) ----------
  const seekToClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setCurrentTime(ratio * totalDuration);
  };

  const handleScrubStart = (e: React.PointerEvent<HTMLDivElement>) => {
    wasPlayingRef.current = isPlaying; // remember whether we were playing
    setIsPlaying(false); // pause visuals while dragging
    setIsScrubbing(true);
    seekToClientX(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleScrubMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    seekToClientX(e.clientX);
  };

  const handleScrubEnd = () => {
    if (!isScrubbing) return;
    setIsScrubbing(false);
    if (wasPlayingRef.current) setIsPlaying(true); // resume if it was playing
  };

  // Preview follows the playhead so scrubbing updates the shown frame live.
  const displayScene = scenes[currentSceneIndex] ?? scenes[selectedIndex];
  const playheadPct = totalDuration ? (currentTime / totalDuration) * 100 : 0;

  // ============================================================
  return (
    <div className="flex h-screen flex-col bg-[#fdfbf8] font-sans">
      {/* ================= TOP BAR ================= */}
      <div className="flex items-center justify-between gap-4 border-b border-stone-100 bg-white px-4 py-2.5">
        {/* Left: back + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <div className="text-base font-bold leading-tight text-stone-800">
              {projectTitle}
            </div>
            <div className="flex items-center gap-2">
              <span
                onClick={onBack}
                className="cursor-pointer rounded-md bg-primary-500 px-1.5 py-0.5 text-[9px] font-bold text-white"
              >
                RUFAADGUIDE
              </span>
              <span className="flex items-center gap-1 text-[11px] text-stone-400">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />{" "}
                Auto-saved
              </span>
            </div>
          </div>
        </div>

        {/* Right: characters (info), export */}
        <div className="flex items-center gap-2.5">
          {/* <span className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600">
            <Users size={15} /> Characters
            <span className="rounded-full bg-primary-100 px-1.5 text-xs font-bold text-primary-600">
              {characters.length}
            </span>
          </span> */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex cursor-pointer items-center gap-2 rounded-full border-0 bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary-600/30 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Preparing…
              </>
            ) : (
              <>
                <Download size={15} /> Download
              </>
            )}
          </button>
        </div>
      </div>

      {/* ================= MAIN AREA ================= */}
      <div className="flex min-h-0 flex-1">
        {/* ----- Preview + transport ----- */}
        <div className="flex min-w-0 flex-1 flex-col p-4">
          {/* Video preview */}
          <div className="relative mx-auto flex aspect-video w-full max-w-2xl items-center justify-center overflow-hidden rounded-xl bg-stone-900 shadow-lg">
            {displayScene?.videoUrl || displayScene?.imageUrl ? (
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                style={{
                  backgroundImage: `url(${displayScene.videoUrl ?? displayScene.imageUrl})`,
                }}
              />
            ) : (
              <span className="relative text-stone-600">
                <Clapperboard size={52} />
              </span>
            )}
            {/* Caption overlay */}
            {/* <span
              className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-lg font-bold text-primary-300"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}
            >
              {(displayScene?.voiceoverText ?? displayScene?.text ?? "").slice(
                0,
                24,
              )}
            </span> */}
          </div>

          {/* Transport / tracks */}
          <div className="mx-auto mt-4 w-full max-w-4xl rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
            {/* Playhead time bubble + tracks */}
            <div className="relative pt-6">
              <div
                className="absolute -top-0 z-10 -translate-x-1/2 rounded-md bg-primary-600 px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ left: `${playheadPct}%` }}
              >
                {formatTime(currentTime)}
              </div>

              {/* Track 1: whole scene timeline — draggable to scrub */}
              <div
                ref={trackRef}
                className="relative mb-1.5 h-2 cursor-pointer touch-none"
                onPointerDown={handleScrubStart}
                onPointerMove={handleScrubMove}
                onPointerUp={handleScrubEnd}
                onPointerCancel={handleScrubEnd}
              >
                <div className="absolute inset-0 rounded-full bg-primary-100" />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary-500"
                  style={{ width: `${playheadPct}%` }}
                />
                {/* Scene boundary dots */}
                {sceneStarts.map((s, i) =>
                  i === 0 ? null : (
                    <span
                      key={i}
                      className="pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-stone-400"
                      style={{ left: `${(s / totalDuration) * 100}%` }}
                    />
                  ),
                )}
                {/* Playhead knob */}
                <span
                  className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500 ring-2 ring-white"
                  style={{ left: `${playheadPct}%` }}
                />
              </div>

              {/* Track 2: voiceover timeline */}
              <div className="relative mb-1.5 h-1.5">
                {sceneStarts.map((s, i) => (
                  <span
                    key={i}
                    className="absolute inset-y-0 rounded-full bg-stone-300"
                    style={{
                      left: `${(s / totalDuration) * 100}%`,
                      width: `${(durations[i] / totalDuration) * 100 - 1}%`,
                    }}
                  />
                ))}
              </div>

              {/* Track 3: video timeline (current scene highlighted) */}
              <div className="relative h-1.5">
                {sceneStarts.map((s, i) => (
                  <span
                    key={i}
                    className={`absolute inset-y-0 rounded-full ${
                      i === currentSceneIndex
                        ? "bg-secondary-400"
                        : "bg-secondary-300/50"
                    }`}
                    style={{
                      left: `${(s / totalDuration) * 100}%`,
                      width: `${(durations[i] / totalDuration) * 100 - 1}%`,
                    }}
                  />
                ))}
              </div>

              {/* Time markers */}
              <div className="mt-2 flex justify-between text-[10px] text-stone-300">
                <span>0:00</span>
                <span>{formatTime(totalDuration * 0.25)}</span>
                <span>{formatTime(totalDuration * 0.5)}</span>
                <span>{formatTime(totalDuration * 0.75)}</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
            </div>

            {/* Controls row */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {/* Preview volume (browser playback only) */}
              <div className="flex items-center gap-2 rounded-xl border border-stone-100 bg-white px-3 py-2 shadow-sm">
                <Volume2 size={15} className="text-stone-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-stone-400">
                    Preview
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={previewVolume}
                    onChange={(e) => setPreviewVolume(Number(e.target.value))}
                    className="h-1 w-20 cursor-pointer accent-primary-500"
                  />
                </div>
              </div>

              {/* Music volume (feeds the final render mix) */}
              <div className="flex items-center gap-2 rounded-xl border border-stone-100 bg-white px-3 py-2 shadow-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  <Music size={14} />
                </span>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-stone-400">
                    Music Volume{" "}
                    <span className="text-primary-600">{musicVolume}%</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={musicVolume}
                    onChange={(e) => setMusicVolume(Number(e.target.value))}
                    className="h-1 w-20 cursor-pointer accent-primary-500"
                  />
                </div>
              </div>

              {/* Playback buttons */}
              <div className="mx-auto flex items-center gap-3">
                <button
                  onClick={() => selectScene(Math.max(0, selectedIndex - 1))}
                  className="flex cursor-pointer items-center border-0 bg-transparent text-stone-400 hover:text-stone-600"
                >
                  <SkipBack size={20} />
                </button>
                <button
                  onClick={togglePlay}
                  className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-0 bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/40 hover:opacity-90"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                  onClick={() =>
                    selectScene(Math.min(scenes.length - 1, selectedIndex + 1))
                  }
                  className="flex cursor-pointer items-center border-0 bg-transparent text-stone-400 hover:text-stone-600"
                >
                  <SkipForward size={20} />
                </button>
              </div>

              {/* Scene indicator */}
              <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-600">
                Scene {currentSceneIndex + 1} / {scenes.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= FILMSTRIP (navigation only) ================= */}
      <div className="border-t border-stone-100 bg-white px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Film size={15} />
            </span>
            <span className="font-bold text-stone-800">Timeline</span>
          </div>
          <span className="rounded-full bg-stone-100 px-4 py-1 text-xs font-semibold text-stone-500">
            {scenes.length} scenes&nbsp;&nbsp;|&nbsp;&nbsp;~
            {Math.round(totalDuration)}s
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {scenes.map((scene, i) => {
            const isSel = currentSceneIndex === i;
            const sceneProgress = Math.min(
              1,
              Math.max(0, (currentTime - sceneStarts[i]) / durations[i]),
            );
            const thumb = scene.videoUrl ?? scene.imageUrl;
            const hasImage = Boolean(scene.imageUrl);
            const hasVideo = Boolean(scene.videoUrl);
            return (
              <button
                key={scene.id}
                onClick={() => selectScene(i)}
                className={`relative h-24 w-44 shrink-0 cursor-pointer overflow-hidden rounded-xl border-0 bg-stone-800 bg-cover bg-center p-0 text-left transition-all ${
                  isSel
                    ? "ring-[3px] ring-primary-500 ring-offset-2"
                    : "hover:opacity-90"
                }`}
                style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
              >
                {/* Number badge */}
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                {/* Real status icons — only shown when that media exists */}
                <span className="absolute bottom-1.5 left-1.5 flex gap-1">
                  {hasImage && (
                    <span className="flex h-4 items-center gap-0.5 rounded bg-black/40 px-1 text-[8px] text-primary-300">
                      <ImageIcon size={8} />
                      <Check size={7} strokeWidth={3} />
                    </span>
                  )}
                  {hasVideo && (
                    <span className="flex h-4 items-center gap-0.5 rounded bg-black/40 px-1 text-[8px] text-primary-300">
                      <Clapperboard size={8} />
                      <Check size={7} strokeWidth={3} />
                    </span>
                  )}
                </span>
                {/* Duration */}
                <span className="absolute bottom-1.5 right-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {durations[i]}s
                </span>
                {/* Per-scene progress bar */}
                <span className="absolute bottom-0 left-0 h-1 w-full bg-black/20">
                  <span
                    className="block h-full bg-primary-500"
                    style={{ width: `${sceneProgress * 100}%` }}
                  />
                </span>
                {/* Playhead line inside active scene */}
                {isSel && isPlaying && (
                  <span
                    className="absolute inset-y-0 w-0.5 bg-primary-600"
                    style={{ left: `${sceneProgress * 100}%` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RufaadStudioScreen;
