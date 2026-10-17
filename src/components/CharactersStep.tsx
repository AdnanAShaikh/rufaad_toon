import React, { useRef, useState } from "react";
import {
  Users,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Upload,
  RotateCcw,
  Pencil,
  Star,
  Lightbulb,
  ChevronDown,
  Plus,
  Trash2,
  BookmarkPlus,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  createCharacter,
  importCharacter,
  updateCharacter,
  deleteCharacter,
  type Character,
} from "../store/slices/characterSlice";
import { fetchLibraryCharacters } from "../store/slices/libraryCharacterSlice";
import { useGenerateCharacterImage } from "../hooks/useGenerateCharacterImage";
import { useUploadCharacterImage } from "../hooks/useUploadCharacterImage";
import AddCharacterModal from "./modals/AddCharacterModal";
import LibraryPickerModal from "./modals/LibraryPickerModal";
import EditCharacterModal from "./modals/EditCharacterModal";
import DeleteModal from "./modals/DeleteModal";
import { useSaveToLibrary } from "../hooks/useSaveToLibrary";

interface CharactersScreenProps {
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

const CharactersStep: React.FC<CharactersScreenProps> = ({
  projectId,
  onBack,
  onNext,
}) => {
  const dispatch = useAppDispatch();
  const characters = useAppSelector((s) => s.characters.items);
  const { save: saveToLibrary, savingId } = useSaveToLibrary(projectId);

  const { generate } = useGenerateCharacterImage();
  const { upload } = useUploadCharacterImage(projectId);

  const [model, setModel] = useState("nanobanana");
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [charToDelete, setCharToDelete] = useState<string | null>(null);

  // Shared-modal state
  const [addOpen, setAddOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);

  // Upload plumbing
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetRef = useRef<string | null>(null);

  // A character is "done" once it has a persisted imageUrl.
  const imageFor = (c: Character) => c.imageUrl;
  const doneCount = characters.filter((c) => imageFor(c)).length;
  const allDone = doneCount === characters.length && characters.length > 0;

  // ---------- Real generation (persists imageUrl via backend) ----------
  const generateOne = async (id: string) => {
    setGeneratingIds((prev) => new Set(prev).add(id));
    try {
      const updated = await generate(id);
      dispatch(updateCharacter(updated)); // slice replaces by id -> imageUrl now set
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
    characters.forEach((c) => {
      if (!imageFor(c)) generateOne(c.id);
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
    e.target.value = ""; // reset so the same file can be re-picked
    uploadTargetRef.current = null;
    if (!file || !targetId) return;

    // reuse the generating spinner so the card shows activity
    setGeneratingIds((prev) => new Set(prev).add(targetId));
    try {
      const updated = await upload(targetId, file);
      dispatch(updateCharacter(updated));
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

  // ---------- Character CRUD (API, via shared modals) ----------
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
      await dispatch(deleteCharacter({ projectId, id })).unwrap();
    } catch {
      /* slice records the error */
    }
  };

  const openLibrary = () => {
    dispatch(fetchLibraryCharacters());
    setLibraryOpen(true);
  };

  const handleSaveToLibrary = async (id: string) => {
    try {
      await saveToLibrary(id);
      toast.success("Saved to your library");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save to library");
    }
  };

  const selectedModel = IMAGE_MODELS.find((m) => m.id === model);

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
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-white">
            <Users size={22} />
          </div>
          <div>
            <h2 className="m-0 text-2xl font-bold text-stone-800">
              Generate Characters
            </h2>
            <span className="text-sm text-stone-500">
              {doneCount}/{characters.length} characters
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
                ? "bg-gradient-to-r from-primary-400 to-primary-500 shadow-primary-400/30 hover:opacity-90"
                : "bg-gradient-to-r from-primary-200 to-primary-300 shadow-primary-200/30"
            }`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
              <ArrowRight size={18} />
            </span>
            Next Step: Generate Images
          </button>
        </div>
      </div>

      {/* ---------- Generate All panel ---------- */}
      <div className="mb-8 rounded-3xl border border-primary-100 bg-gradient-to-b from-primary-50/70 to-white px-6 py-9 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-300 to-primary-500 text-white shadow-lg shadow-primary-300/30">
          <Users size={26} />
        </div>
        <h3 className="m-0 mb-1 text-xl font-bold text-stone-800">
          Generate Characters
        </h3>
        <p className="mx-auto mb-6 max-w-md text-sm text-stone-500">
          AI will create images for each character in your story. You can also
          generate or upload individually below.
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
            disabled={generatingIds.size > 0 || characters.length === 0}
            className="flex cursor-pointer items-center gap-2.5 rounded-full border-0 bg-gradient-to-r from-primary-400 to-primary-500 py-3 pl-2 pr-7 font-bold text-white shadow-lg shadow-primary-400/30 transition-opacity enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
              <Users size={18} />
            </span>
            {generatingIds.size > 0
              ? "Generating..."
              : "Generate All Characters"}
          </button>
        </div>
      </div>

      {/* ---------- Characters grid ---------- */}
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-300 to-primary-500 text-white">
          <Users size={18} />
        </div>
        <span className="font-bold text-stone-800">Characters</span>
        <span className="text-sm text-stone-400">({characters.length})</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {characters.map((char: Character) => {
          const isGenerating = generatingIds.has(char.id);
          const img = imageFor(char);
          return (
            <div
              key={char.id}
              className="overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-b from-primary-50/50 to-white shadow-sm"
            >
              <div className="px-4 pb-4 pt-5">
                {img ? (
                  <div
                    className="relative h-44 w-full rounded-xl bg-cover bg-center shadow-inner"
                    style={{ backgroundImage: `url(${img})` }}
                  >
                    <div className="absolute right-2 top-2 flex gap-1.5">
                      <button
                        onClick={() => generateOne(char.id)}
                        title="Regenerate image"
                        className="flex cursor-pointer items-center gap-1 rounded-full border-0 bg-black/40 px-2.5 py-1 text-xs font-semibold text-white hover:bg-black/60"
                      >
                        <RotateCcw size={12} /> Redo
                      </button>
                      <button
                        onClick={() => openUpload(char.id)}
                        title="Upload a different image"
                        className="flex cursor-pointer items-center gap-1 rounded-full border-0 bg-black/40 px-2.5 py-1 text-xs font-semibold text-white hover:bg-black/60"
                      >
                        <Upload size={12} /> Replace
                      </button>
                    </div>
                    <button
                      onClick={() => handleSaveToLibrary(char.id)}
                      disabled={savingId === char.id}
                      title="Save this character to your library"
                      className="absolute left-2 top-2 flex cursor-pointer items-center gap-1 rounded-full border-0 bg-black/40 px-2.5 py-1 text-xs font-semibold text-white hover:bg-black/60 disabled:opacity-60"
                    >
                      <BookmarkPlus size={12} />{" "}
                      {savingId === char.id ? "Saving..." : "Save"}
                    </button>
                  </div>
                ) : isGenerating ? (
                  <div className="flex h-44 w-full flex-col items-center justify-center gap-3 rounded-xl bg-primary-50">
                    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary-200 border-t-primary-500" />
                    <span className="text-xs font-semibold text-primary-500">
                      Working...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 text-center text-sm text-stone-400">
                      Generate or add image
                    </div>
                    <div className="mb-3 flex justify-center gap-2.5">
                      <ActionButton
                        icon={Sparkles}
                        label="Generate"
                        onClick={() => generateOne(char.id)}
                      />

                      <ActionButton
                        icon={Upload}
                        label="Upload"
                        onClick={() => openUpload(char.id)}
                      />
                    </div>
                    <div className="mx-auto flex max-w-[220px] items-center justify-center gap-1 rounded-lg bg-white/80 px-3 py-2 text-center text-[11px] leading-snug text-stone-400 shadow-sm">
                      <Star size={11} className="shrink-0" /> Or use "Generate
                      All" above to create all at once
                    </div>
                  </>
                )}
              </div>

              {/* Name + prompt (edit = prompt only, name locked) */}
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
          );
        })}

        {/* Add character card -- create new OR select from library */}
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

      {/* Tip */}
      <div className="mt-5 flex justify-center">
        <span className="flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-600">
          <Lightbulb size={13} /> You can add or remove characters here or in
          the Review step.
        </span>
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
          className="flex cursor-pointer items-center gap-2.5 rounded-full border-0 bg-gradient-to-r from-primary-400 to-primary-500 py-3 pl-2 pr-6 font-bold text-white shadow-lg shadow-primary-400/30 hover:opacity-90"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
            <ArrowRight size={18} />
          </span>
          Next Step: Generate Images
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
        onSave={(imagePrompt) => {
          if (editingChar) handleUpdatePrompt(editingChar.id, imagePrompt);
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
    </div>
  );
};

// ---------- Small action button ----------
const ActionButton: React.FC<{
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}> = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-stone-100 bg-white px-3 py-2.5 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
  >
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-300 to-primary-500 text-white">
      <Icon size={18} />
    </span>
    <span className="text-xs font-semibold text-stone-600">{label}</span>
  </button>
);

export default CharactersStep;
