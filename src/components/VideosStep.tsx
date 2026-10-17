import React, { useRef, useState } from "react";
import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import Backdrop from "@mui/material/Backdrop";
import {
  Clapperboard,
  ArrowLeft,
  Play,
  ChevronDown,
  Sparkles,
  Mic,
  SkipForward,
  Volume2,
  RotateCw,
  RotateCcw,
  Upload,
  User,
  Pencil,
  Trash2,
  X,
  ImageIcon,
  Maximize2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  updateScene,
  deleteScene,
  type Scene,
} from "../store/slices/sceneSlice";
import type { Character } from "../store/slices/characterSlice";
import DeleteModal from "./modals/DeleteModal";

interface VideosStepProps {
  projectId: string;
  onBack: () => void;
  onOpenEditor?: () => void;
  onNext?: () => void;
}

const VIDEO_MODELS = [
  { id: "wan-2.2", name: "Wan 2.2 - Fast, Affordable", free: true },
  { id: "wan-2.6", name: "Wan 2.6 - Better Quality", free: true },
  { id: "kling-3", name: "Kling 3.0 - Premium", free: false },
  { id: "veo-3.1", name: "Veo 3.1 - Best Quality", free: false },
];

const SCENE_BADGE_COLORS = [
  "bg-primary-300",
  "bg-primary-400",
  "bg-primary-500",
  "bg-primary-300",
  "bg-primary-400",
  "bg-primary-500",
  "bg-primary-300",
  "bg-primary-400",
];

/** Placeholder gradients standing in for generated videos.
 *  NOTE: faked only — local state, NOT persisted, lost on refresh.
 *  Real generation will write scene.videoUrl via a backend endpoint. */
const FAKE_VIDEO_GRADIENTS = [
  "linear-gradient(135deg, #99BC85, #6f9159)",
  "linear-gradient(135deg, #c9d9b8, #85a971)",
  "linear-gradient(135deg, #e4ecdb, #99BC85)",
  "linear-gradient(135deg, #85a971, #587446)",
  "linear-gradient(135deg, #b6cfa3, #6f9159)",
  "linear-gradient(135deg, #d3e0c4, #85a971)",
];

const VideosStep: React.FC<VideosStepProps> = ({
  projectId,
  onBack,
  onOpenEditor,
  onNext,
}) => {
  const dispatch = useAppDispatch();
  const scenes = useAppSelector((s) => s.scenes.items);
  const characters = useAppSelector((s) => s.characters.items);

  const [model, setModel] = useState("wan-2.2");
  const [syncWithVoiceover, setSyncWithVoiceover] = useState(false);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [previewChar, setPreviewChar] = useState<Character | null>(null);
  const [sceneToDelete, setSceneToDelete] = useState<string | null>(null);

  // Faked, non-persisted video previews keyed by scene id.
  const [fakeVideos, setFakeVideos] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetRef = useRef<string | null>(null);

  const videoFor = (sc: Scene) => sc.videoUrl ?? fakeVideos[sc.id];
  const doneCount = scenes.filter((sc) => videoFor(sc)).length;
  const selectedModel = VIDEO_MODELS.find((m) => m.id === model);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /** Derived starting prompt shown in the editor when a scene has none saved. */
  const videoPromptFor = (scene: Scene, index: number) =>
    scene.videoPrompt ??
    `Animate the supplied starting image as a connected, family-friendly multi-scene sequence in which ${(
      scene.text ?? ""
    )
      .toLowerCase()
      .replace(/\.$/, "")}. 0:00–0:04 — Scene ${index + 1} Action...`;

  // ---------- Fake generation (local only) ----------
  const generateOne = (id: string, index: number) => {
    setGeneratingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setFakeVideos((prev) => ({
        ...prev,
        [id]: FAKE_VIDEO_GRADIENTS[index % FAKE_VIDEO_GRADIENTS.length],
      }));
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2200);
  };

  const generateAll = () => {
    scenes.forEach((sc, i) => {
      if (!videoFor(sc)) generateOne(sc.id, i);
    });
  };

  const clearVideo = (id: string) => {
    setFakeVideos((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const openUpload = (id: string) => {
    uploadTargetRef.current = id;
    fileInputRef.current?.click();
  };

  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = uploadTargetRef.current;
    if (file && targetId) {
      setFakeVideos((prev) => ({
        ...prev,
        [targetId]: `url(${URL.createObjectURL(file)})`,
      }));
    }
    e.target.value = "";
    uploadTargetRef.current = null;
  };

  // ---------- Scene actions (API) ----------
  const handleSaveVideoPrompt = (
    scene: Scene,
    index: number,
    value: string,
  ) => {
    const trimmed = value.trim();
    const baseline = scene.videoPrompt ?? videoPromptFor(scene, index);
    if (trimmed && trimmed !== baseline) {
      dispatch(updateScene({ projectId, id: scene.id, videoPrompt: trimmed }));
    }
    setEditingSceneId(null);
  };

  const handleDeleteScene = (id: string) => {
    dispatch(deleteScene({ projectId, id }));
    clearVideo(id);
  };

  // ============================================================
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChosen}
      />

      {/* ---------- Character preview lightbox ---------- */}
      <Modal
        open={Boolean(previewChar)}
        onClose={() => setPreviewChar(null)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 250,
            className: "!bg-black/50 backdrop-blur-sm",
          },
        }}
      >
        <Fade in={Boolean(previewChar)}>
          <div className="absolute left-1/2 top-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 outline-none">
            <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div
                className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 text-primary-300"
                style={
                  previewChar?.imageUrl
                    ? {
                        background: previewChar.imageUrl,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                {!previewChar?.imageUrl && <User size={64} />}
              </div>
              <div className="p-5">
                <div className="mb-1.5 flex items-center justify-between">
                  <h3 className="m-0 text-lg font-bold text-stone-800">
                    {previewChar?.name}
                  </h3>
                  <button
                    onClick={() => setPreviewChar(null)}
                    className="flex cursor-pointer items-center border-0 bg-transparent text-stone-300 hover:text-stone-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="m-0 text-sm italic leading-relaxed text-stone-500">
                  {previewChar?.imagePrompt}
                </p>
              </div>
            </div>
          </div>
        </Fade>
      </Modal>

      {/* ---------- Header ---------- */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-white">
            <Clapperboard size={22} />
          </div>
          <div>
            <h2 className="m-0 text-2xl font-bold text-stone-800">
              Generate Videos
            </h2>
            <span className="text-sm text-stone-500">
              {doneCount}/{scenes.length} videos
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-transparent px-4 py-2.5 font-semibold text-stone-500 hover:text-stone-700"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={onNext}
            className="flex cursor-pointer items-center gap-2.5 rounded-full border-0 bg-gradient-to-r from-primary-600 to-primary-700 py-3 pl-2 pr-6 font-bold text-white shadow-lg shadow-primary-600/30 hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
              <Play size={16} />
            </span>
            Skip to Video Editor
          </button>
        </div>
      </div>

      {/* ---------- Generate All panel ---------- */}
      <div className="mb-8 rounded-3xl border border-primary-100 bg-gradient-to-b from-primary-50/70 to-white px-6 py-9 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-300 to-primary-500 text-white shadow-lg shadow-primary-300/30">
          <Clapperboard size={26} />
        </div>
        <h3 className="m-0 mb-1 text-xl font-bold text-stone-800">
          Generate Videos
        </h3>
        <p className="mx-auto mb-6 max-w-md text-sm text-stone-500">
          AI will create animated videos for each scene of your story.
        </p>

        <div className="mx-auto mb-3 max-w-sm text-left">
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 outline-none focus:border-primary-300"
            >
              {VIDEO_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.free ? "(FREE)" : ""}
                </option>
              ))}
            </select>
            {selectedModel?.free && (
              <span className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 rounded-md bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-600">
                FREE
              </span>
            )}
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
              <ChevronDown size={16} />
            </span>
          </div>
          {selectedModel?.free && (
            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-primary-500">
              <Sparkles size={12} /> FREE
            </div>
          )}
        </div>

        <label className="mx-auto mb-6 flex w-fit cursor-pointer items-center gap-2 text-sm text-stone-500">
          <input
            type="checkbox"
            checked={syncWithVoiceover}
            onChange={(e) => setSyncWithVoiceover(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-primary-500"
          />
          <Mic size={14} /> Sync video duration with voice over
        </label>

        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <span className="absolute -right-2 -top-2 z-10 rounded-full bg-primary-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
              FREE
            </span>
            <button
              onClick={generateAll}
              disabled={generatingIds.size > 0 || scenes.length === 0}
              className="flex cursor-pointer items-center gap-2.5 rounded-full border-0 bg-gradient-to-r from-primary-600 to-primary-700 py-3 pl-2 pr-7 font-bold text-white shadow-lg shadow-primary-600/30 transition-opacity enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary-600">
                <Clapperboard size={18} />
              </span>
              {generatingIds.size > 0 ? "Generating…" : "Start Generating"}
            </button>
          </div>
          <button
            onClick={onOpenEditor}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-200 bg-white px-6 py-3.5 font-semibold text-stone-600 hover:bg-stone-50"
          >
            <SkipForward size={16} /> Skip
          </button>
        </div>

        <div className="mt-6 border-t border-primary-100 pt-4 text-sm italic text-stone-400">
          <span className="text-primary-400">•</span> This step is optional —
          you can complete your project with just images{" "}
          <span className="text-primary-400">•</span>
        </div>
      </div>

      {/* ---------- Scenes list ---------- */}
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-300 to-primary-500 text-white">
          <Clapperboard size={18} />
        </div>
        <span className="font-bold text-stone-800">Scenes</span>
      </div>

      <div className="relative">
        <div className="absolute bottom-8 left-[22px] top-4 w-px bg-stone-200" />

        <div className="flex flex-col gap-5">
          {scenes.map((scene, i) => {
            const isGenerating = generatingIds.has(scene.id);
            const vid = videoFor(scene);
            return (
              <div key={scene.id} className="flex items-start gap-4">
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-white shadow-md ${
                      SCENE_BADGE_COLORS[i % SCENE_BADGE_COLORS.length]
                    }`}
                  >
                    {i + 1}
                  </div>
                  <button
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-primary-200 bg-white text-primary-400 shadow-sm hover:bg-primary-50"
                    title="Play voiceover"
                  >
                    <Volume2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      clearVideo(scene.id);
                      generateOne(scene.id, i);
                    }}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-md hover:opacity-90"
                    title="Regenerate video"
                  >
                    <RotateCw size={14} />
                  </button>
                </div>

                <div className="flex flex-1 gap-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
                  {/* Scene image thumbnail */}
                  {scene.imageUrl ? (
                    <>
                      <div className="relative h-24 overflow-hidden rounded-xl">
                        <div
                          className="h-24 w-40 shrink-0 rounded-xl bg-cover bg-center"
                          style={{ backgroundImage: `url(${scene.imageUrl})` }}
                        />
                        <button
                          onClick={() => setPreviewUrl(scene.imageUrl)}
                          className="absolute inset-0 flex cursor-zoom-in items-center justify-center gap-1 border-0 bg-black/0 text-xs font-semibold text-transparent transition-all hover:bg-black/30 hover:text-white"
                        >
                          <Maximize2 size={14} /> View
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50 text-stone-300">
                      <ImageIcon size={22} />
                    </div>
                  )}

                  {/* Video thumbnail / placeholder */}
                  <div className="relative w-40 shrink-0">
                    {vid ? (
                      <div
                        className="group relative flex h-24 w-full items-center justify-center overflow-hidden rounded-xl bg-cover bg-center"
                        style={{ background: vid, backgroundSize: "cover" }}
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-primary-600">
                          <Play size={18} />
                        </span>
                        <button
                          onClick={() => clearVideo(scene.id)}
                          className="absolute inset-0 flex cursor-pointer items-center justify-center gap-1 border-0 bg-black/0 text-xs font-semibold text-transparent transition-all hover:bg-black/40 hover:text-white"
                        >
                          <RotateCcw size={13} /> Redo
                        </button>
                      </div>
                    ) : isGenerating ? (
                      <div className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-xl bg-primary-50">
                        <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary-200 border-t-primary-500" />
                        <span className="text-[10px] font-semibold text-primary-500">
                          Generating…
                        </span>
                      </div>
                    ) : (
                      <div className="relative flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/60 text-primary-300">
                        <Clapperboard size={22} />
                        <span className="text-[10px] font-semibold">Video</span>
                        <button
                          onClick={() => openUpload(scene.id)}
                          title="Upload custom video"
                          className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-400 shadow-sm transition-colors hover:border-primary-400 hover:bg-primary-500 hover:text-white"
                        >
                          <Upload size={14} />
                        </button>
                        <button
                          onClick={() => generateOne(scene.id, i)}
                          className="absolute -left-2 bottom-2 flex cursor-pointer flex-col items-start rounded-full border-0 bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-1 text-white shadow-md hover:opacity-90"
                        >
                          <span className="text-[8px] font-bold leading-none opacity-80">
                            FREE
                          </span>
                          <span className="text-[11px] font-bold leading-tight">
                            Generate
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Video prompt + characters */}
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary-500">
                      <Clapperboard size={12} /> Video Prompt
                    </div>

                    {editingSceneId === scene.id ? (
                      <textarea
                        autoFocus
                        defaultValue={videoPromptFor(scene, i)}
                        rows={3}
                        onBlur={(e) =>
                          handleSaveVideoPrompt(scene, i, e.target.value)
                        }
                        className="w-full resize-y rounded-lg border border-primary-200 p-2 text-sm text-stone-700 outline-none"
                      />
                    ) : (
                      <p className="m-0 line-clamp-2 text-sm leading-relaxed text-stone-600">
                        {videoPromptFor(scene, i)}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                        Characters:
                      </span>
                      <div className="flex items-center -space-x-1.5">
                        {scene.characters.map(({ id: cid }) => {
                          const char = characters.find((c) => c.id === cid);
                          if (!char) return null;
                          return (
                            <div key={cid} className="group relative">
                              <button
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-stone-100 bg-cover bg-center text-stone-500 shadow-sm"
                                style={
                                  char?.imageUrl
                                    ? {
                                        backgroundImage: `url(${char.imageUrl})`,
                                      }
                                    : undefined
                                }
                              >
                                {!char?.imageUrl && <User size={14} />}
                              </button>
                              <span className="pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-stone-800 px-2.5 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                                {char?.name ?? "Unknown"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 text-stone-300">
                    <button
                      onClick={() => setEditingSceneId(scene.id)}
                      className="flex cursor-pointer items-center border-0 bg-transparent p-0 hover:text-primary-500"
                      title="Edit video prompt"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setSceneToDelete(scene.id)}
                      className="flex cursor-pointer items-center border-0 bg-transparent p-0 hover:text-red-400"
                      title="Delete scene"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- Bottom nav ---------- */}
      <div className="mt-10 flex justify-center gap-3">
        <button
          onClick={onBack}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-200 bg-white px-6 py-3 font-semibold text-stone-500 hover:bg-stone-50"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={onNext}
          className="flex cursor-pointer items-center gap-2.5 rounded-full border-0 bg-gradient-to-r from-primary-600 to-primary-700 py-3 pl-2 pr-6 font-bold text-white shadow-lg shadow-primary-600/30 hover:opacity-90"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
            <Play size={16} />
          </span>
          Open Video Editor
        </button>
      </div>

      <DeleteModal
        open={sceneToDelete !== null}
        title="Delete scene?"
        message="This scene and its generated media will be permanently removed. This can't be undone."
        confirmLabel="Delete scene"
        onClose={() => setSceneToDelete(null)}
        onConfirm={() => {
          if (sceneToDelete) handleDeleteScene(sceneToDelete);
          setSceneToDelete(null);
        }}
      />

      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
        >
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute right-5 top-5 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-0 bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <img
            src={previewUrl}
            alt="Scene preview"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default VideosStep;
