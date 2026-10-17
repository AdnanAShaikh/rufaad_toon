import React, { useRef, useState } from "react";
import {
  Image as ImageIcon,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Upload,
  Clapperboard,
  Volume2,
  User,
  Trash2,
  Pencil,
  Plus,
  Lock,
  Maximize2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  updateScene,
  deleteScene,
  type Scene,
  setScene,
} from "../store/slices/sceneSlice";
import { type Character } from "../store/slices/characterSlice";
import { useGenerateSceneImage } from "../hooks/useGenerateSceneImage";
import { useUploadSceneImage } from "../hooks/useUploadSceneImage";
import DeleteModal from "./modals/DeleteModal";

interface ImagesStepProps {
  projectId: string;
  onBack: () => void;
  onNext: () => void;
}

const IMAGE_MODELS = [
  { id: "nanobanana", name: "NanoBanana", free: true },
  { id: "imagen-3", name: "Imagen 3", free: false },
  { id: "flux-schnell", name: "FLUX Schnell", free: true },
  { id: "sdxl", name: "SDXL", free: false },
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

const ImagesStep: React.FC<ImagesStepProps> = ({
  projectId,
  onBack,
  onNext,
}) => {
  const dispatch = useAppDispatch();
  const scenes = useAppSelector((s) => s.scenes.items);
  const characters = useAppSelector((s) => s.characters.items);

  const { generate } = useGenerateSceneImage();
  const { upload } = useUploadSceneImage(projectId);

  const [model, setModel] = useState("nanobanana");
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [sceneToDelete, setSceneToDelete] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetRef = useRef<string | null>(null);

  // A scene is "done" once it has a persisted imageUrl.
  const imageFor = (sc: Scene) => sc.imageUrl;
  const doneCount = scenes.filter((sc) => imageFor(sc)).length;
  const selectedModel = IMAGE_MODELS.find((m) => m.id === model);
  const allDone = doneCount === scenes.length && scenes.length > 0;

  /** Derived starting prompt shown in the editor when a scene has none saved. */
  const promptFor = (scene: Scene) =>
    scene.imagePrompt ??
    `A wide cinematic shot. ${scene.text ?? ""} Rich lighting, detailed environment, film still quality.`;

  /** Characters in this scene that still lack an image (block reason). */
  const missingCharsFor = (scene: Scene): Character[] =>
    scene.characters
      .map(({ id }) => characters.find((c) => c.id === id))
      .filter((c): c is Character => !!c && !c.imageUrl);

  // ---------- Real generation (persists imageUrl via backend) ----------
  const generateOne = async (id: string) => {
    setGeneratingIds((prev) => new Set(prev).add(id));
    try {
      const updated = await generate(id);
      dispatch(setScene(updated));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const generateAll = () => {
    scenes.forEach((sc) => {
      if (!imageFor(sc) && missingCharsFor(sc).length === 0) generateOne(sc.id);
    });
  };

  // ---------- Upload from device (persists imageUrl via backend) ----------
  const openUpload = (id: string) => {
    uploadTargetRef.current = id;
    fileInputRef.current?.click();
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = uploadTargetRef.current;
    e.target.value = "";
    uploadTargetRef.current = null;
    if (!file || !targetId) return;

    setGeneratingIds((prev) => new Set(prev).add(targetId));
    try {
      const updated = await upload(targetId, file);
      dispatch(setScene(updated));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  // ---------- Scene actions (API) ----------
  const handleSavePrompt = (scene: Scene, value: string) => {
    const trimmed = value.trim();
    const baseline = scene.imagePrompt ?? promptFor(scene);
    if (trimmed && trimmed !== baseline) {
      dispatch(updateScene({ projectId, id: scene.id, imagePrompt: trimmed }));
    }
    setEditingSceneId(null);
  };

  // const removeCharacterFromScene = (scene: Scene, charId: string) => {
  //   const next = scene.characters.map((c) => c.id).filter((c) => c !== charId);
  //   dispatch(updateScene({ projectId, id: scene.id, characterIds: next }));
  // };

  const addCharacterToScene = (scene: Scene) => {
    const nextChar = characters.find(
      (c) => !scene.characters.some((sc) => sc.id === c.id),
    );
    if (!nextChar) return;
    const next = [...scene.characters.map((c) => c.id), nextChar.id];
    dispatch(updateScene({ projectId, id: scene.id, characterIds: next }));
  };

  const removeImage = async (scene: Scene) => {
    try {
      const updated = await dispatch(
        updateScene({ projectId, id: scene.id, imageUrl: null }),
      ).unwrap();
      dispatch(setScene(updated));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't remove image");
    }
  };

  // ============================================================
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChosen}
      />

      {/* ---------- Header ---------- */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-300 to-primary-500 text-white">
            <ImageIcon size={22} />
          </div>
          <div>
            <h2 className="m-0 text-2xl font-bold text-stone-800">
              Generate Scene Images
            </h2>
            <span className="text-sm text-stone-500">
              {doneCount}/{scenes.length} scenes
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-200 bg-white px-5 py-2.5 font-semibold text-stone-500 hover:bg-stone-50"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={onNext}
            className={`flex cursor-pointer items-center gap-2.5 rounded-full border-0 py-3 pl-2 pr-6 font-bold text-white shadow-lg transition-all ${
              allDone
                ? "bg-gradient-to-r from-primary-600 to-primary-700 shadow-primary-600/30 hover:opacity-90"
                : "bg-gradient-to-r from-primary-300 to-primary-400 shadow-primary-300/30"
            }`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
              <ArrowRight size={18} />
            </span>
            Next Step: Generate Audio
          </button>
        </div>
      </div>

      {/* ---------- Generate All panel ---------- */}
      <div className="mb-8 rounded-3xl border border-primary-100 bg-gradient-to-b from-primary-50/70 to-white px-6 py-9 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-300 to-primary-500 text-white shadow-lg shadow-primary-300/30">
          <ImageIcon size={26} />
        </div>
        <h3 className="m-0 mb-1 text-xl font-bold text-stone-800">
          Generate Scene Images
        </h3>
        <p className="mx-auto mb-6 max-w-md text-sm text-stone-500">
          AI will create images for each scene of your story. Scenes whose
          characters still need images are skipped until those are ready.
        </p>

        <div className="mx-auto mb-5 max-w-sm text-left">
          <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-stone-500">
            <Sparkles size={13} className="text-primary-400" /> AI Image Model
          </label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 outline-none focus:border-primary-300"
            >
              {IMAGE_MODELS.map((m) => (
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
        </div>

        <div className="relative inline-block">
          {selectedModel?.free && (
            <span className="absolute -right-3 -top-2 z-10 rounded-full bg-primary-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
              FREE
            </span>
          )}
          <button
            onClick={generateAll}
            disabled={generatingIds.size > 0 || scenes.length === 0}
            className="flex cursor-pointer items-center gap-2.5 rounded-full border-0 bg-gradient-to-r from-primary-400 to-primary-500 py-3 pl-2 pr-7 font-bold text-white shadow-lg shadow-primary-400/30 transition-opacity enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
              <ImageIcon size={18} />
            </span>
            {generatingIds.size > 0 ? "Generating..." : "Generate All Images"}
          </button>
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
            const img = imageFor(scene);
            const missing = missingCharsFor(scene);
            const blocked = missing.length > 0;
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
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-primary-200 text-primary-300">
                    <Volume2 size={12} />
                  </span>
                </div>

                <div className="flex flex-1 gap-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
                  {/* Thumbnail */}
                  <div className="relative w-40 shrink-0">
                    {img ? (
                      <div className="group relative h-28 w-full overflow-hidden rounded-xl">
                        <div
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${img})` }}
                        />
                        {/* View — opens the lightbox; does NOT regenerate */}
                        <button
                          onClick={() => setPreviewUrl(img)}
                          className="absolute inset-0 flex cursor-zoom-in items-center justify-center gap-1 border-0 bg-black/0 text-xs font-semibold text-transparent transition-all hover:bg-black/30 hover:text-white"
                        >
                          <Maximize2 size={14} /> View
                        </button>
                        {/* Top-right actions: Redo + Remove */}
                        <div className="absolute right-2 top-2 z-10 flex gap-1.5">
                          <button
                            onClick={() => !blocked && generateOne(scene.id)}
                            disabled={blocked}
                            title={
                              blocked
                                ? `Generate images for: ${missing.map((c) => c.name).join(", ")} first`
                                : "Regenerate this scene image"
                            }
                            className="flex cursor-pointer items-center gap-1 rounded-full border-0 bg-black/50 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <RotateCcw size={12} /> Redo
                          </button>
                          <button
                            onClick={() => removeImage(scene)}
                            title="Remove image"
                            className="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-full border-0 bg-black/50 text-white shadow-sm transition-colors hover:bg-red-500"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ) : isGenerating ? (
                      <div className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl bg-primary-50">
                        <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary-200 border-t-primary-500" />
                        <span className="text-[10px] font-semibold text-primary-500">
                          Working...
                        </span>
                      </div>
                    ) : (
                      <div className="relative flex h-28 w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/60 text-primary-200">
                        <ImageIcon size={28} />
                        <button
                          onClick={() => openUpload(scene.id)}
                          title="Upload custom image"
                          className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-400 shadow-sm transition-colors hover:border-primary-400 hover:bg-primary-500 hover:text-white"
                        >
                          <Upload size={14} />
                        </button>
                        <button
                          onClick={() => !blocked && generateOne(scene.id)}
                          disabled={blocked}
                          title={
                            blocked
                              ? `Generate images for: ${missing
                                  .map((c) => c.name)
                                  .join(", ")} first`
                              : "Generate scene image"
                          }
                          className={`absolute -left-2 bottom-2 flex flex-col items-start rounded-full border-0 px-3 py-1 text-white shadow-md ${
                            blocked
                              ? "cursor-not-allowed bg-stone-300"
                              : "cursor-pointer bg-gradient-to-r from-primary-400 to-primary-500 hover:opacity-90"
                          }`}
                        >
                          {blocked ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold leading-tight">
                              <Lock size={10} /> Locked
                            </span>
                          ) : (
                            <>
                              <span className="text-[8px] font-bold leading-none opacity-80">
                                FREE
                              </span>
                              <span className="text-[11px] font-bold leading-tight">
                                Generate
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Prompt + characters */}
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary-500">
                      <ImageIcon size={12} /> Image Prompt
                    </div>

                    {editingSceneId === scene.id ? (
                      <textarea
                        autoFocus
                        defaultValue={promptFor(scene)}
                        rows={3}
                        onBlur={(e) => handleSavePrompt(scene, e.target.value)}
                        className="w-full resize-y rounded-lg border border-primary-200 p-2 text-sm text-stone-700 outline-none"
                      />
                    ) : (
                      <p className="m-0 line-clamp-2 text-sm leading-relaxed text-stone-600">
                        {promptFor(scene)}
                      </p>
                    )}

                    {/* Block hint */}
                    {blocked && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                        <Lock size={11} /> Needs images for:{" "}
                        {missing.map((c) => c.name).join(", ")}
                      </div>
                    )}

                    {/* Characters */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                        Characters:
                      </span>
                      <div className="flex items-center -space-x-1.5">
                        {scene.characters.map(({ id: cid }) => {
                          const char = characters.find((c) => c.id === cid);
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
                              {/* <button
                                onClick={() =>
                                  removeCharacterFromScene(scene, cid)
                                }
                                className="absolute -bottom-8 left-1/2 z-20 flex h-7 w-7 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-red-500 text-white opacity-0 shadow-md transition-opacity hover:bg-red-600 group-hover:opacity-100"
                                title="Remove from scene"
                              >
                                <Trash2 size={13} />
                              </button> */}
                            </div>
                          );
                        })}
                      </div>
                      {characters.some(
                        (c) => !scene.characters.some((sc) => sc.id === c.id),
                      ) && (
                        <button
                          onClick={() => addCharacterToScene(scene)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-primary-500 text-white shadow-sm hover:bg-primary-600"
                          title="Add character to scene"
                        >
                          <Plus size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 text-stone-300">
                    <button
                      onClick={() => setEditingSceneId(scene.id)}
                      className="flex cursor-pointer items-center border-0 bg-transparent p-0 hover:text-primary-500"
                      title="Edit image prompt"
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
            <ArrowRight size={18} />
          </span>
          Next Step: Generate Audio
        </button>
      </div>

      <DeleteModal
        open={sceneToDelete !== null}
        title="Delete scene?"
        message="This scene and its generated media will be permanently removed. This can't be undone."
        confirmLabel="Delete scene"
        onClose={() => setSceneToDelete(null)}
        onConfirm={() => {
          if (sceneToDelete) {
            dispatch(deleteScene({ projectId, id: sceneToDelete }));
          }
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

export default ImagesStep;
