import React, { useEffect, useState } from "react";
import {
  Check,
  Eye,
  ArrowRight,
  Lightbulb,
  Copy,
  FileText,
  Star,
  Users,
  User,
  Pencil,
  Trash2,
  Plus,
  Clapperboard,
  Volume2,
  GripVertical,
  Maximize2,
  ImageIcon,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  createCharacter,
  importCharacter,
  updateCharacter,
  deleteCharacter,
  type Character,
} from "../store/slices/characterSlice";
import { fetchLibraryCharacters } from "../store/slices/libraryCharacterSlice";
import {
  createScene,
  updateScene,
  deleteScene,
  reorderScenes,
  type Scene,
} from "../store/slices/sceneSlice";
import AddCharacterModal from "./modals/AddCharacterModal";
import LibraryPickerModal from "./modals/LibraryPickerModal";
import EditCharacterModal from "./modals/EditCharacterModal";
import DeleteModal from "./modals/DeleteModal";

interface ReviewScreenProps {
  projectId: string;
  onNext: () => void;
  onShowPrompts?: () => void;
  ideaText?: string;
  scriptText?: string;
}

const SCENE_BADGE_COLORS = [
  "bg-primary-500",
  "bg-primary-600",
  "bg-primary-400",
  "bg-primary-700",
  "bg-primary-500",
  "bg-primary-600",
  "bg-primary-400",
  "bg-primary-700",
];

const ReviewStep: React.FC<ReviewScreenProps> = ({
  projectId,
  onNext,
  onShowPrompts,
  ideaText = "",
  scriptText = "",
}) => {
  const dispatch = useAppDispatch();

  const characters = useAppSelector((s) => s.characters.items);
  const scenes = useAppSelector((s) => s.scenes.items);
  const [sceneToDelete, setSceneToDelete] = useState<string | null>(null);
  const [charToDelete, setCharToDelete] = useState<string | null>(null);

  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState<"idea" | "script" | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewUrl) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setPreviewUrl(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewUrl]);

  const copyText = async (text: string, which: "idea" | "script") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  // ---------- Character actions (API) ----------
  const handleAddCharacter = async (name: string, imagePrompt: string) => {
    try {
      await dispatch(
        createCharacter({ projectId, name, imagePrompt }),
      ).unwrap();
      dispatch(fetchLibraryCharacters());
      setAddOpen(false);
    } catch {
      /* slice records the error */
    }
  };

  const handleImportCharacter = async (libraryCharacterId: string) => {
    try {
      await dispatch(
        importCharacter({ projectId, libraryCharacterId }),
      ).unwrap();
      setLibraryOpen(false);
    } catch {
      /* slice records the error */
    }
  };

  const handleUpdatePrompt = async (id: string, imagePrompt: string) => {
    try {
      await dispatch(updateCharacter({ projectId, id, imagePrompt })).unwrap();
      setEditingChar(null);
    } catch {
      /* slice records the error */
    }
  };

  const handleDeleteCharacter = async (id: string) => {
    try {
      const affected = scenes.filter((sc) =>
        sc.characters.some((c) => c.id === id),
      );
      await Promise.all(
        affected.map((sc) =>
          dispatch(
            updateScene({
              projectId,
              id: sc.id,
              characterIds: sc.characters
                .map((c) => c.id)
                .filter((cid) => cid !== id),
            }),
          ).unwrap(),
        ),
      );
      await dispatch(deleteCharacter({ projectId, id })).unwrap();
    } catch {
      /* slice records the error */
    }
  };

  const openLibrary = () => {
    dispatch(fetchLibraryCharacters());
    setLibraryOpen(true);
  };

  // ---------- Scene actions (API) ----------
  const handleAddScene = () => {
    dispatch(createScene({ projectId }));
  };

  const handleUpdateSceneText = (id: string, text: string) => {
    dispatch(updateScene({ projectId, id, text }));
  };

  const handleToggleSceneCharacter = (scene: Scene, charId: string) => {
    const current = scene.characters.map((c) => c.id);
    const next = current.includes(charId)
      ? current.filter((c) => c !== charId)
      : [...current, charId];
    dispatch(updateScene({ projectId, id: scene.id, characterIds: next }));
  };

  // ---------- Drag to reorder (optimistic) ----------
  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const ids = scenes.map((s) => s.id);
    const [moved] = ids.splice(dragIndex, 1);
    ids.splice(targetIndex, 0, moved);
    dispatch(reorderScenes({ projectId, orderedIds: ids }));
    setDragIndex(null);
  };

  // ============================================================
  return (
    <div>
      {/* ---------- Header ---------- */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white">
            <Check size={22} strokeWidth={3} />
          </div>
          <div>
            <h2 className="m-0 text-2xl font-bold text-stone-800">
              Review Your Storyboard
            </h2>
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <span>
                {scenes.length} scenes • {characters.length} characters
              </span>
              <button
                onClick={onShowPrompts}
                className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-sm font-semibold text-primary-600 hover:underline"
              >
                <Eye size={14} /> Show Prompts
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onNext}
          className="flex cursor-pointer items-center gap-2.5 rounded-full border-0 bg-gradient-to-r from-primary-500 to-primary-600 py-3 pl-2 pr-6 font-bold text-white shadow-lg shadow-primary-500/30 hover:opacity-90"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
            <ArrowRight size={18} />
          </span>
          Next Step: Generate Characters
        </button>
      </div>

      {/* ---------- Project Source banner ---------- */}
      <div className="mb-7 rounded-2xl border border-primary-100 bg-primary-50/60 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-stone-700">
            <Lightbulb size={16} /> Project Source
          </span>
          <button
            onClick={() => copyText(ideaText, "idea")}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-primary-200 bg-white px-4 py-1.5 text-sm font-semibold text-stone-700 hover:bg-primary-50"
          >
            {copied === "idea" ? (
              <>
                <Check size={14} /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy Idea
              </>
            )}
          </button>
          <button
            onClick={() => copyText(scriptText, "script")}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-primary-200 bg-white px-4 py-1.5 text-sm font-semibold text-stone-700 hover:bg-primary-50"
          >
            {copied === "script" ? (
              <>
                <Check size={14} /> Copied!
              </>
            ) : (
              <>
                <FileText size={14} /> Copy Script
              </>
            )}
          </button>
        </div>
        <p className="m-0 flex items-start gap-1.5 text-sm text-stone-500">
          <Star size={14} className="mt-0.5 shrink-0" />
          <span>
            Review your scenes and make any changes you'd like before
            proceeding. Click <strong>Next Step</strong> to generate characters.
            In each step, you can generate or upload assets related to that
            step.
          </span>
        </p>
      </div>

      {/* ---------- Characters ---------- */}
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white">
          <Users size={18} />
        </div>
        <span className="font-bold text-stone-800">Characters</span>
        <span className="text-sm text-stone-400">({characters.length})</span>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {characters.map((char) => (
          <div
            key={char.id}
            className="overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-b from-primary-50/50 to-white shadow-sm"
          >
            <div className="flex flex-col items-center gap-3 px-4 pb-3 pt-8">
              {char.imageUrl ? (
                <button
                  onClick={() => setPreviewUrl(char.imageUrl!)}
                  className="group relative h-16 w-16 cursor-zoom-in overflow-hidden rounded-2xl border-0 p-0 shadow-sm"
                >
                  <img
                    src={char.imageUrl}
                    alt={char.name}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition-all group-hover:bg-black/30 group-hover:text-white">
                    <Maximize2 size={14} />
                  </span>
                </button>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary-300 shadow-sm">
                    <User size={28} />
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-white/80 px-3 py-1.5 text-center text-[11px] leading-snug text-stone-400 shadow-sm">
                    <Star size={11} className="shrink-0" /> You will be able to
                    upload or generate characters in the next step
                  </div>
                </>
              )}
            </div>

            <div className="bg-white px-4 pb-4 pt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-base font-bold text-stone-800">
                  {char.name}
                </span>
                <div className="flex gap-2 text-stone-300">
                  <button
                    onClick={() => setEditingChar(char)}
                    className="flex cursor-pointer items-center border-0 bg-transparent p-0 hover:text-primary-500"
                    title="Edit image prompt"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setCharToDelete(char.id)}
                    className="flex cursor-pointer items-center border-0 bg-transparent p-0 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <p className="m-0 line-clamp-3 text-sm italic leading-snug text-stone-400">
                {char.imagePrompt}
              </p>
            </div>
          </div>
        ))}

        {/* Add character card — create new OR select from library */}
        <div className="flex min-h-[280px] flex-col rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/30 p-3 transition-colors hover:border-primary-400 hover:bg-primary-50/60">
          <button
            onClick={() => setAddOpen(true)}
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 border-0 bg-transparent"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg shadow-primary-500/30">
              <Plus size={26} />
            </div>
            <span className="font-semibold text-stone-800">Add Character</span>
            <span className="text-xs text-stone-400">Click to create new</span>
          </button>

          <button
            onClick={openLibrary}
            className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white py-2.5 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50"
          >
            <Users size={16} /> Select from library
          </button>
        </div>
      </div>

      {/* ---------- Scenes ---------- */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white">
            <Clapperboard size={18} />
          </div>
          <span className="font-bold text-stone-800">Scenes</span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3.5 py-1.5 text-xs font-semibold text-stone-700">
          <Lightbulb size={13} /> Drag scenes to reorder
        </span>
      </div>

      <div className="relative">
        <div className="absolute bottom-8 left-[22px] top-4 w-px bg-stone-200" />

        <div className="flex flex-col gap-5">
          {scenes.map((scene, i) => (
            <div
              key={scene.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              className={`flex items-start gap-4 ${dragIndex === i ? "opacity-50" : ""}`}
            >
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

              <div className="flex-1 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  {/* Scene thumbnail — view only in Review; empty until ImagesStep fills it */}
                  <div className="w-28 shrink-0">
                    {scene.imageUrl ? (
                      <button
                        onClick={() => setPreviewUrl(scene.imageUrl!)}
                        className="group relative h-20 w-full cursor-zoom-in overflow-hidden rounded-xl border-0 p-0"
                      >
                        <div
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${scene.imageUrl})` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition-all group-hover:bg-black/30 group-hover:text-white">
                          <Maximize2 size={16} />
                        </span>
                      </button>
                    ) : (
                      <div className="flex h-20 w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/60 text-primary-200">
                        <ImageIcon size={22} />
                      </div>
                    )}
                  </div>

                  <span
                    className="cursor-grab pt-1 text-stone-300"
                    title="Drag to reorder"
                  >
                    <GripVertical size={16} />
                  </span>

                  <div className="flex-1">
                    {editingSceneId === scene.id ? (
                      <textarea
                        autoFocus
                        defaultValue={scene.text ?? ""}
                        rows={2}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val && val !== (scene.text ?? "")) {
                            handleUpdateSceneText(scene.id, val);
                          }
                          setEditingSceneId(null);
                        }}
                        className="w-full resize-y rounded-lg border border-primary-200 p-2 text-[0.95rem] text-stone-700 outline-none"
                      />
                    ) : (
                      <p className="m-0 text-[0.95rem] text-stone-700">
                        {scene.text || (
                          <span className="italic text-stone-300">
                            Describe this scene…
                          </span>
                        )}
                      </p>
                    )}

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
                              <button
                                onClick={() =>
                                  handleToggleSceneCharacter(scene, cid)
                                }
                                className="absolute -bottom-8 left-1/2 z-20 flex h-7 w-7 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-red-500 text-white opacity-0 shadow-md transition-opacity hover:bg-red-600 group-hover:opacity-100"
                                title="Remove from scene"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {characters.some(
                        (c) => !scene.characters.some((sc) => sc.id === c.id),
                      ) && (
                        <button
                          onClick={() => {
                            const nextChar = characters.find(
                              (c) =>
                                !scene.characters.some((sc) => sc.id === c.id),
                            );
                            if (nextChar)
                              handleToggleSceneCharacter(scene, nextChar.id);
                          }}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-primary-500 text-white shadow-sm hover:bg-primary-600"
                          title="Add character to scene"
                        >
                          <Plus size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 text-stone-300">
                    <button
                      onClick={() => setEditingSceneId(scene.id)}
                      className="flex cursor-pointer items-center border-0 bg-transparent p-0 hover:text-primary-500"
                      title="Edit scene"
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
            </div>
          ))}

          <div className="flex items-start gap-4">
            <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-300">
              {scenes.length + 1}
            </div>
            <button
              onClick={handleAddScene}
              className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-stone-200 bg-white/60 py-6 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
            >
              <span className="flex items-center gap-2 font-semibold text-stone-600">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                  <Plus size={16} />
                </span>
                Add New Scene
              </span>
              <span className="text-xs text-stone-400">
                Add a blank scene to your storyboard
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Bottom CTA ---------- */}
      <div className="mt-10 flex justify-center">
        <button
          onClick={onNext}
          className="flex cursor-pointer items-center gap-2.5 rounded-full border-0 bg-gradient-to-r from-primary-500 to-primary-600 py-3 pl-2 pr-6 font-bold text-white shadow-lg shadow-primary-500/30 hover:opacity-90"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
            <ArrowRight size={18} />
          </span>
          Next Step: Generate Characters
        </button>
      </div>

      {/* ---------- Shared modals ---------- */}
      <AddCharacterModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddCharacter}
      />

      <LibraryPickerModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onUse={handleImportCharacter}
      />

      <EditCharacterModal
        key={editingChar?.id ?? "closed"}
        character={editingChar}
        onClose={() => setEditingChar(null)}
        onSave={(imagePrompt: string) => {
          if (editingChar) handleUpdatePrompt(editingChar.id, imagePrompt);
        }}
      />

      <DeleteModal
        open={sceneToDelete !== null}
        title="Delete scene?"
        message="This scene and its generated media will be permanently removed. This can't be undone."
        confirmLabel="Delete scene"
        onClose={() => setSceneToDelete(null)}
        onConfirm={() => {
          if (sceneToDelete)
            dispatch(deleteScene({ projectId, id: sceneToDelete }));
          setSceneToDelete(null);
        }}
      />

      <DeleteModal
        open={charToDelete !== null}
        title="Delete character?"
        message="This character will be removed from the project and from any scenes it appears in. Your library copy stays intact."
        confirmLabel="Delete character"
        onClose={() => setCharToDelete(null)}
        onConfirm={() => {
          if (charToDelete) handleDeleteCharacter(charToDelete);
          setCharToDelete(null);
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
            alt="Preview"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default ReviewStep;
