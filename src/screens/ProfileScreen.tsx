/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Camera,
  Check,
  Pencil,
  Users,
  Music,
  Globe,
  Trash2,
  Plus,
  Play,
  Pause,
  Upload,
  Archive,
  ArchiveRestore,
  X,
  RefreshCw,
  Crown,
  Smartphone,
  Monitor,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useProfile } from "../hooks/useProfile";
import { useProfileMusic } from "../hooks/useProfileMusic";
import { useProfileGlobalMusic } from "../hooks/useProfileGlobalMusic";
import {
  fetchLibraryCharacters,
  createLibraryCharacter,
  deleteLibraryCharacter,
  type LibraryCharacter,
  updateLibraryCharacter,
} from "../store/slices/libraryCharacterSlice";
import DeleteModal from "../components/modals/DeleteModal";
import { Dialog } from "@mui/material";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

type Tab = "characters" | "music" | "global";

// Crop a File to the target aspect ratio (centered), return a new File.
async function cropToRatio(file: File, ratio: "16:9" | "9:16"): Promise<File> {
  const [rw, rh] = ratio === "16:9" ? [16, 9] : [9, 16];
  const targetRatio = rw / rh;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });

  const srcRatio = img.width / img.height;
  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height;

  if (srcRatio > targetRatio) {
    // source is wider → crop sides
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    // source is taller → crop top/bottom
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92),
  );
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
  });
}

// ============================================================
const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading, saving, updateName, updateAvatar } = useProfile();

  const [tab, setTab] = useState<Tab>("characters");
  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-screen bg-[#fdfbf8] font-sans">
      {/* Top bar */}
      <div className="border-b border-stone-100 bg-white px-6 py-3">
        <button
          onClick={() => navigate("/")}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-500 hover:bg-stone-50 hover:text-primary-600"
        >
          <ArrowLeft size={16} /> Back to Projects
        </button>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* ---------- Header: details left, avatar right ---------- */}
        {loading ? (
          <div className="py-16 text-center text-stone-400">
            Loading profile…
          </div>
        ) : (
          <ProfileHeader
            profile={profile}
            saving={saving}
            onSaveName={updateName}
            onSaveAvatar={updateAvatar}
          />
        )}

        {/* ---------- Tabs ---------- */}
        <div className="mt-8 flex gap-1 rounded-full border border-stone-200 bg-white p-1 w-fit">
          <TabButton
            active={tab === "characters"}
            icon={Users}
            label="Library Characters"
            onClick={() => setTab("characters")}
          />
          <TabButton
            active={tab === "music"}
            icon={Music}
            label="Your Music"
            onClick={() => setTab("music")}
          />
          {isAdmin && (
            <TabButton
              active={tab === "global"}
              icon={Globe}
              label="Global Music"
              onClick={() => setTab("global")}
            />
          )}
        </div>

        {/* ---------- Tab content ---------- */}
        <div className="mt-6">
          {tab === "characters" && <CharactersTab />}
          {tab === "music" && <MusicTab />}
          {tab === "global" && isAdmin && <GlobalMusicTab />}
        </div>
      </div>
    </div>
  );
};

// ---------- Tab button ----------
const TabButton: React.FC<{
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}> = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active
        ? "bg-primary-500 text-white shadow-sm"
        : "text-stone-500 hover:text-stone-700"
    }`}
  >
    <Icon size={15} /> {label}
  </button>
);

// ---------- Profile header ----------
const ProfileHeader: React.FC<{
  profile: ReturnType<typeof useProfile>["profile"];
  saving: boolean;
  onSaveName: (name: string) => Promise<void>;
  onSaveAvatar: (file: File) => Promise<void>;
}> = ({ profile, saving, onSaveName, onSaveAvatar }) => {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile?.name ?? "");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === profile?.name) {
      setEditingName(false);
      return;
    }
    try {
      await onSaveName(trimmed);
      toast.success("Name updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update name");
    }
    setEditingName(false);
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await onSaveAvatar(file);
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't update avatar",
      );
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-primary-100 bg-gradient-to-b from-primary-50/50 to-white p-6 shadow-sm">
      {/* Details (left) */}
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleName()}
                className="rounded-xl border border-primary-200 px-3 py-1.5 text-lg font-bold text-stone-800 outline-none focus:ring-2 focus:ring-primary-100"
              />
              <button
                onClick={handleName}
                disabled={saving}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
              >
                <Check size={15} />
              </button>
            </div>
          ) : (
            <>
              <h1 className="m-0 text-2xl font-bold text-stone-800">
                {profile?.name || "Unnamed"}
              </h1>
              <button
                onClick={() => {
                  setNameDraft(profile?.name ?? "");
                  setEditingName(true);
                }}
                className="flex cursor-pointer items-center border-0 bg-transparent text-stone-300 hover:text-primary-500"
                title="Edit name"
              >
                <Pencil size={15} />
              </button>
              {profile?.role === "admin" && (
                <span className="flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-[11px] font-bold text-primary-600">
                  <Crown size={11} /> Admin
                </span>
              )}
            </>
          )}
        </div>
        <p className="m-0 text-sm text-stone-500">{profile?.email}</p>
      </div>

      {/* Avatar (right) */}
      <div className="relative">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleAvatar}
        />
        {profile?.imageUrl ? (
          <div
            className="h-24 w-24 rounded-3xl bg-cover bg-center shadow-md"
            style={{ backgroundImage: `url(${profile.imageUrl})` }}
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-300 to-primary-500 text-white shadow-md">
            <User size={40} />
          </div>
        )}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={saving}
          className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-primary-500 text-white shadow-md hover:bg-primary-600 disabled:opacity-50"
          title="Change avatar"
        >
          <Camera size={15} />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// CHARACTERS TAB (uses libraryCharacterSlice)
// ============================================================
const CharactersTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.libraryCharacters.items);
  const status = useAppSelector((s) => s.libraryCharacters.status);

  const [addOpen, setAddOpen] = useState(false);
  const [toDelete, setToDelete] = useState<LibraryCharacter | null>(null);
  const [editing, setEditing] = useState<LibraryCharacter | null>(null);

  useEffect(() => {
    dispatch(fetchLibraryCharacters());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await dispatch(deleteLibraryCharacter(toDelete.id)).unwrap();
      toast.success("Character removed from library");
    } catch (e) {
      toast.error(typeof e === "string" ? e : "Couldn't delete");
    }
    setToDelete(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-stone-500">
          {items.length} saved character{items.length === 1 ? "" : "s"}
        </span>
        <button
          onClick={() => setAddOpen(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90"
        >
          <Plus size={15} /> Add Character
        </button>
      </div>

      {status === "loading" && items.length === 0 ? (
        <div className="py-12 text-center text-stone-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 py-12 text-center text-sm text-stone-400">
          No saved characters yet. Add one, or save a character from a project.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <div
              key={c.id}
              className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm"
            >
              {c.imageUrl ? (
                <div
                  className={`w-full bg-cover bg-center ${
                    c.aspectRatio === "9:16"
                      ? "aspect-[9/16] max-h-64"
                      : c.aspectRatio === "1:1"
                        ? "aspect-square"
                        : "aspect-video"
                  }`}
                  style={{ backgroundImage: `url(${c.imageUrl})` }}
                />
              ) : (
                <div
                  className={`flex w-full items-center justify-center bg-primary-50 text-primary-200 ${
                    c.aspectRatio === "9:16"
                      ? "aspect-[9/16] max-h-64"
                      : c.aspectRatio === "1:1"
                        ? "aspect-square"
                        : "aspect-video"
                  }`}
                >
                  <User size={40} />
                </div>
              )}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-stone-800">
                    {c.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing(c)}
                      className="flex cursor-pointer items-center border-0 bg-transparent p-0 text-stone-300 hover:text-primary-500"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setToDelete(c)}
                      className="flex cursor-pointer items-center border-0 bg-transparent p-0 text-stone-300 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {c.sourceProjectTitle && (
                  <span className="text-[11px] text-stone-400">
                    from {c.sourceProjectTitle}
                  </span>
                )}
                <p className="m-0 mt-1 line-clamp-2 text-xs italic text-stone-400">
                  {c.imagePrompt}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddCharacterDialog open={addOpen} onClose={() => setAddOpen(false)} />

      <EditCharacterDialog
        character={editing}
        onClose={() => setEditing(null)}
      />

      <DeleteModal
        open={toDelete !== null}
        title="Delete library character?"
        message={`"${toDelete?.name}" will be removed from your library. Projects that already imported it keep their own copy.`}
        confirmLabel="Delete"
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

// ---------- Add-character dialog (create from scratch, with image upload) ----------
const AddCharacterDialog: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [ratio, setRatio] = useState<"16:9" | "9:16">("9:16"); // portrait default for characters
  const [rawFile, setRawFile] = useState<File | null>(null);

  useEffect(() => {
    if (!rawFile) return;
    cropToRatio(rawFile, ratio).then((cropped) => {
      setFile(cropped);
      setPreview(URL.createObjectURL(cropped));
    });
  }, [ratio, rawFile]);

  useEffect(() => {
    if (open) {
      setName("");
      setPrompt("");
      setFile(null);
      setRawFile(null); // if you added the raw-file state for re-cropping
      setPreview(null);
      setRatio("9:16"); // back to default
      setSubmitting(false);
    }
  }, [open]);

  const reset = () => {
    setName("");
    setPrompt("");
    setFile(null);
    setPreview(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setRawFile(f);
    const cropped = await cropToRatio(f, ratio);
    setFile(cropped);
    setPreview(URL.createObjectURL(cropped));
  };

  const uploadImage = async (f: File): Promise<string> => {
    const b64 = await new Promise<{ data: string; contentType: string }>(
      (resolve, reject) => {
        const r = new FileReader();
        r.onload = () =>
          resolve({
            data: (r.result as string).split(",")[1],
            contentType: f.type,
          });
        r.onerror = reject;
        r.readAsDataURL(f);
      },
    );
    const res = await fetch(`${API_BASE}/library-character/upload-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(b64),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Image upload failed");
    return data.url as string;
  };

  const handleCreate = async () => {
    if (!name.trim() || !prompt.trim()) {
      toast.error("Name and prompt are required.");
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (file) imageUrl = await uploadImage(file);
      await dispatch(
        createLibraryCharacter({
          name: name.trim(),
          imagePrompt: prompt.trim(),
          imageUrl,
          aspectRatio: ratio, // ← send it
        }),
      ).unwrap();
      toast.success("Character added to library");
      handleClose();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : typeof e === "string" ? e : "Failed",
      );
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { className: "rounded-3xl overflow-hidden" } }}
    >
      <div className="relative p-6">
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 flex cursor-pointer items-center border-0 bg-transparent text-stone-400 hover:text-stone-600"
        >
          <X size={20} />
        </button>
        <h2 className="m-0 mb-4 text-lg font-bold text-stone-800">
          Add Library Character
        </h2>

        <div className="mb-3 flex gap-2">
          {(["9:16", "16:9"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRatio(r)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                ratio === r
                  ? "border-primary-500 bg-primary-50 text-primary-600"
                  : "border-stone-200 bg-white text-stone-500 hover:border-primary-300"
              }`}
            >
              {r === "9:16" ? <Smartphone size={14} /> : <Monitor size={14} />}
              {r === "9:16" ? "Portrait" : "Landscape"}
            </button>
          ))}
        </div>

        {/* Image */}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={pickFile}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className={`mb-4 mx-auto flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/40 text-primary-400 hover:border-primary-400 ${
            ratio === "9:16" ? "aspect-[9/16] max-w-[180px]" : "aspect-video"
          }`}
          style={
            preview
              ? {
                  backgroundImage: `url(${preview})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {!preview && (
            <span className="flex flex-col items-center gap-1 text-xs font-semibold">
              <Upload size={22} /> Upload image (optional)
            </span>
          )}
        </button>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Character name"
          className="mb-3 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-primary-300"
        />
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Image prompt — describe the character…"
          className="mb-4 w-full resize-y rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-primary-300"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="cursor-pointer border-0 bg-transparent px-4 py-2 text-sm font-semibold text-stone-500 hover:text-stone-700"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            {submitting ? "Saving…" : "Add"}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

const EditCharacterDialog: React.FC<{
  character: LibraryCharacter | null;
  onClose: () => void;
}> = ({ character, onClose }) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [ratio, setRatio] = useState<"16:9" | "9:16">("9:16"); // portrait default for characters
  const [rawFile, setRawFile] = useState<File | null>(null);

  // Pre-fill whenever a character is opened for editing
  useEffect(() => {
    if (character) {
      setName(character.name);
      setPrompt(character.imagePrompt);
      setPreview(character.imageUrl ?? null);
      setFile(null);
      setSubmitting(false);
    }
  }, [character]);

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setRawFile(f);
    const cropped = await cropToRatio(f, ratio);
    setFile(cropped);
    setPreview(URL.createObjectURL(cropped));
  };

  // re-crop when ratio changes and we have a raw file
  useEffect(() => {
    if (!rawFile) return;
    cropToRatio(rawFile, ratio).then((cropped) => {
      setFile(cropped);
      setPreview(URL.createObjectURL(cropped));
    });
  }, [ratio, rawFile]);

  const uploadImage = async (f: File): Promise<string> => {
    const b64 = await new Promise<{ data: string; contentType: string }>(
      (resolve, reject) => {
        const r = new FileReader();
        r.onload = () =>
          resolve({
            data: (r.result as string).split(",")[1],
            contentType: f.type,
          });
        r.onerror = reject;
        r.readAsDataURL(f);
      },
    );
    const res = await fetch(`${API_BASE}/library-character/upload-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(b64),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Image upload failed");
    return data.url as string;
  };

  const handleSave = async () => {
    if (!character) return;
    if (!name.trim() || !prompt.trim()) {
      toast.error("Name and prompt are required.");
      return;
    }
    setSubmitting(true);
    try {
      // Only upload if the user picked a new file; otherwise keep existing URL.
      let imageUrl = character.imageUrl ?? null;
      if (file) imageUrl = await uploadImage(file);

      await dispatch(
        updateLibraryCharacter({
          id: character.id,
          name: name.trim(),
          imagePrompt: prompt.trim(),
          imageUrl,
        }),
      ).unwrap();
      toast.success("Character updated");
      onClose();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : typeof e === "string" ? e : "Failed",
      );
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={character !== null}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { className: "rounded-3xl overflow-hidden" } }}
    >
      <div className="relative p-6">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex cursor-pointer items-center border-0 bg-transparent text-stone-400 hover:text-stone-600"
        >
          <X size={20} />
        </button>
        <h2 className="m-0 mb-4 text-lg font-bold text-stone-800">
          Edit Library Character
        </h2>

        <div className="mb-3 flex gap-2">
          {(["9:16", "16:9"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRatio(r)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                ratio === r
                  ? "border-primary-500 bg-primary-50 text-primary-600"
                  : "border-stone-200 bg-white text-stone-500 hover:border-primary-300"
              }`}
            >
              {r === "9:16" ? <Smartphone size={14} /> : <Monitor size={14} />}
              {r === "9:16" ? "Portrait" : "Landscape"}
            </button>
          ))}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={pickFile}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className={`mb-4 mx-auto flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/40 text-primary-400 hover:border-primary-400 ${
            ratio === "9:16" ? "aspect-[9/16] max-w-[180px]" : "aspect-video"
          }`}
          style={
            preview
              ? {
                  backgroundImage: `url(${preview})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {!preview && (
            <span className="flex flex-col items-center gap-1 text-xs font-semibold">
              <Upload size={22} /> Change image
            </span>
          )}
        </button>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Character name"
          className="mb-3 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-primary-300"
        />
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Image prompt — describe the character…"
          className="mb-4 w-full resize-y rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-primary-300"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="cursor-pointer border-0 bg-transparent px-4 py-2 text-sm font-semibold text-stone-500 hover:text-stone-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

// ============================================================
// YOUR MUSIC TAB
// ============================================================
const MusicTab: React.FC = () => {
  const { tracks, loading, checkUsage, remove } = useProfileMusic();
  const [toDelete, setToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [usageNote, setUsageNote] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const a = new Audio(url);
    audioRef.current = a;
    a.play().catch(() => toast.error("Couldn't play track"));
    a.onended = () => setPlayingId(null);
    setPlayingId(id);
  };

  const askDelete = async (id: string, title: string) => {
    setToDelete({ id, title });
    setUsageNote(null);
    const { count, exampleTitle } = await checkUsage(id);
    if (count > 0) {
      setUsageNote(
        `This track is used in ${count} project${count === 1 ? "" : "s"}${
          exampleTitle ? ` (e.g. "${exampleTitle}")` : ""
        }. Those projects keep playing it — it's just removed from your library.`,
      );
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      toast.success("Track deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete");
    }
    setToDelete(null);
  };

  if (loading)
    return <div className="py-12 text-center text-stone-400">Loading…</div>;

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        Your uploaded tracks ({tracks.length}/10).
      </p>
      {tracks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 py-12 text-center text-sm text-stone-400">
          You haven't uploaded any music yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tracks.map((t) => (
            <TrackRow
              key={t.id}
              title={t.title}
              mood={t.mood}
              playing={playingId === t.id}
              onPlay={() => togglePlay(t.id, t.url)}
              onDelete={() => askDelete(t.id, t.title)}
            />
          ))}
        </div>
      )}

      <DeleteModal
        open={toDelete !== null}
        title="Delete track?"
        message={
          (usageNote ?? "This track will be removed from your library.") +
          "\nThis can't be undone."
        }
        confirmLabel="Delete track"
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

// ============================================================
// GLOBAL MUSIC TAB (admin only)
// ============================================================
const GlobalMusicTab: React.FC = () => {
  const { tracks, loading, checkUsage, archive, remove } =
    useProfileGlobalMusic();
  const [toDelete, setToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [usageNote, setUsageNote] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const a = new Audio(url);
    audioRef.current = a;
    a.play().catch(() => toast.error("Couldn't play track"));
    a.onended = () => setPlayingId(null);
    setPlayingId(id);
  };

  const toggleArchive = async (id: string, active: boolean) => {
    try {
      await archive(id, !active);
      toast.success(active ? "Track archived" : "Track restored");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update");
    }
  };

  const askDelete = async (id: string, title: string) => {
    setToDelete({ id, title });
    setUsageNote(null);
    const { count } = await checkUsage(id);
    if (count > 0) {
      setUsageNote(
        `This global track is used in ${count} project${count === 1 ? "" : "s"} across users. They keep their copy, but this permanently removes it from the library.`,
      );
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      toast.success("Global track deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete");
    }
    setToDelete(null);
  };

  if (loading)
    return <div className="py-12 text-center text-stone-400">Loading…</div>;

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        Shared tracks available to all users. Archive to hide from the picker
        (reversible), or delete permanently.
      </p>
      {tracks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 py-12 text-center text-sm text-stone-400">
          No global tracks yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tracks.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                t.active
                  ? "border-stone-100 bg-white"
                  : "border-stone-200 bg-stone-50 opacity-60"
              }`}
            >
              <button
                onClick={() => togglePlay(t.id, t.url)}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-primary-100 text-primary-600 hover:bg-primary-200"
              >
                {playingId === t.id ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-stone-800">
                  {t.title}
                  {!t.active && (
                    <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-500">
                      Archived
                    </span>
                  )}
                </div>
                {t.mood && (
                  <span className="text-xs text-stone-400">{t.mood}</span>
                )}
              </div>
              <button
                onClick={() => toggleArchive(t.id, t.active)}
                title={t.active ? "Archive" : "Restore"}
                className="flex cursor-pointer items-center border-0 bg-transparent p-1 text-stone-400 hover:text-primary-600"
              >
                {t.active ? (
                  <Archive size={16} />
                ) : (
                  <ArchiveRestore size={16} />
                )}
              </button>
              <button
                onClick={() => askDelete(t.id, t.title)}
                title="Delete permanently"
                className="flex cursor-pointer items-center border-0 bg-transparent p-1 text-stone-300 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <DeleteModal
        open={toDelete !== null}
        title="Delete global track?"
        message={
          (usageNote ??
            "This permanently removes the track from the shared library.") +
          "\nThis can't be undone."
        }
        confirmLabel="Delete permanently"
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

// ---------- Shared track row (user music) ----------
const TrackRow: React.FC<{
  title: string;
  mood: string | null;
  playing: boolean;
  onPlay: () => void;
  onDelete: () => void;
}> = ({ title, mood, playing, onPlay, onDelete }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3">
    <button
      onClick={onPlay}
      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-primary-100 text-primary-600 hover:bg-primary-200"
    >
      {playing ? <Pause size={16} /> : <Play size={16} />}
    </button>
    <div className="flex-1">
      <div className="text-sm font-semibold text-stone-800">{title}</div>
      {mood && <span className="text-xs text-stone-400">{mood}</span>}
    </div>
    <button
      onClick={onDelete}
      className="flex cursor-pointer items-center border-0 bg-transparent p-1 text-stone-300 hover:text-red-500"
      title="Delete"
    >
      <Trash2 size={16} />
    </button>
  </div>
);

export default ProfileScreen;
