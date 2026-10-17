import React, { useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import {
  Music,
  Upload,
  Play,
  Pause,
  Trash2,
  Check,
  X,
  Library,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import { useMusic, type MusicTrack } from "../../hooks/useMusic";

interface MusicLibraryModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the chosen track's URL when the user confirms. */
  onSelect: (url: string, title: string) => void;
  /** Currently selected music URL on the project, to highlight it. */
  currentUrl?: string | null;
}

type Tab = "library" | "yours";

const MusicLibraryModal: React.FC<MusicLibraryModalProps> = ({
  open,
  onClose,
  onSelect,
  currentUrl,
}) => {
  const { yours, library, loading, error, uploading, reload, upload, remove } =
    useMusic();

  const [tab, setTab] = useState<Tab>("library");
  const [picked, setPicked] = useState<string | null>(currentUrl ?? null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tracks = tab === "library" ? library : yours;

  // ---- Preview playback (one at a time) ----
  const togglePlay = (track: MusicTrack) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(track.url);
    audioRef.current = audio;
    audio.play().catch(() => toast.error("Couldn't play this track."));
    audio.onended = () => setPlayingId(null);
    setPlayingId(track.id);
  };

  // ---- Upload ----
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const track = await upload(file, file.name.replace(/\.[^.]+$/, ""));
      setTab("yours");
      setPicked(track.url);
      toast.success("Track uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast.success("Track removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleConfirm = () => {
    if (!picked) {
      toast.info("Pick a track first.");
      return;
    }
    const chosen = [...library, ...yours].find((t) => t.url === picked);
    onSelect(picked, chosen?.title ?? "Background music");
    handleClose();
  };

  const handleClose = () => {
    audioRef.current?.pause();
    setPlayingId(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { className: "rounded-3xl overflow-hidden" } }}
    >
      <div className="flex flex-col" style={{ maxHeight: "80vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white">
              <Music size={18} />
            </span>
            <h2 className="m-0 text-lg font-bold text-stone-800">
              Background Music
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="flex cursor-pointer items-center border-0 bg-transparent text-stone-400 hover:text-stone-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs + upload */}
        <div className="flex items-center justify-between gap-2 px-6 pt-4">
          <div className="flex gap-1 rounded-full bg-stone-100 p-1">
            <button
              onClick={() => setTab("library")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === "library"
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <Library size={14} /> Music Library
            </button>
            <button
              onClick={() => setTab("yours")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === "yours"
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <Music size={14} /> Your Music
            </button>
          </div>

          <div className="flex items-center gap-3">
            {tab === "yours" && (
              <span className="text-xs font-semibold text-stone-400">
                {yours.length}/10 uploads
              </span>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 disabled:opacity-50"
            >
              {uploading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              Upload
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {/* Track list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-stone-400">
              Loading tracks…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="text-sm text-stone-400">{error}</span>
              <button
                onClick={reload}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50"
              >
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone-400">
              {tab === "yours"
                ? "You haven't uploaded any music yet."
                : "No tracks in the library yet."}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tracks.map((t) => {
                const isPicked = picked === t.url;
                const isPlaying = playingId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
                      isPicked
                        ? "border-primary-400 bg-primary-50/60"
                        : "border-stone-100 bg-white hover:border-primary-200"
                    }`}
                  >
                    <button
                      onClick={() => togglePlay(t)}
                      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-primary-100 text-primary-600 hover:bg-primary-200"
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>

                    <button
                      onClick={() => setPicked(t.url)}
                      className="flex flex-1 cursor-pointer flex-col items-start border-0 bg-transparent text-left"
                    >
                      <span className="text-sm font-semibold text-stone-800">
                        {t.title}
                      </span>
                      {t.mood && (
                        <span className="text-xs text-stone-400">{t.mood}</span>
                      )}
                    </button>

                    {isPicked && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white">
                        <Check size={13} strokeWidth={3} />
                      </span>
                    )}

                    {/* Delete only on your own tracks */}
                    {tab === "yours" && (
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="flex cursor-pointer items-center border-0 bg-transparent p-1 text-stone-300 hover:text-red-500"
                        title="Delete track"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-100 px-6 py-4">
          <button
            onClick={handleClose}
            className="cursor-pointer border-0 bg-transparent px-4 py-2 text-sm font-semibold text-stone-500 hover:text-stone-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex cursor-pointer items-center gap-2 rounded-full border-0 bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/30 hover:opacity-90"
          >
            <Check size={16} /> Use this track
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default MusicLibraryModal;
