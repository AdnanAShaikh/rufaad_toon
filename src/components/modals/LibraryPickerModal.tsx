import React, { useState } from "react";
import { Dialog } from "@mui/material";
import {
  Users,
  User,
  X,
  Search,
  Lightbulb,
  Check,
  Loader2,
} from "lucide-react";
import { useAppSelector } from "../../store/hooks";
import type { LibraryCharacter } from "../../store/slices/libraryCharacterSlice";

// Shared "Select Existing Character" picker. Reads the library pool from the
// slice; the caller is responsible for dispatching fetchLibraryCharacters()
// before opening, and for the import on `onUse`.
const LibraryPickerModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onUse: (libraryCharacterId: string) => void;
}> = ({ open, onClose, onUse }) => {
  const items = useAppSelector((s) => s.libraryCharacters.items);
  const status = useAppSelector((s) => s.libraryCharacters.status);
  const importing = useAppSelector((s) => s.characters.status === "loading");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const loading = status === "loading";

  const filtered = items.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.sourceProjectTitle?.toLowerCase().includes(q) ?? false)
    );
  });

  const handleClose = () => {
    setSelectedId(null);
    setQuery("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          className: "rounded-3xl overflow-hidden",
          style: {
            background: "linear-gradient(180deg, #f3f7ef 0%, #ffffff 30%)",
          },
        },
      }}
    >
      <div className="relative flex max-h-[80vh] flex-col px-7 pb-5 pt-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg shadow-primary-500/30">
            <Users size={22} />
          </span>
          <div>
            <h2 className="m-0 text-lg font-bold text-stone-900">
              Select Existing Character
            </h2>
            <p className="m-0 text-sm text-stone-500">
              Choose a character from your library
            </p>
          </div>
          <button
            onClick={handleClose}
            className="absolute right-5 top-6 flex cursor-pointer items-center border-0 bg-transparent text-stone-400 hover:text-stone-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Ratio-filter hint (filter added once aspectRatio exists on the model) */}
        <div className="mt-4 flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50/70 px-3 py-2 text-xs font-medium text-primary-700">
          <Lightbulb size={13} className="shrink-0" /> Only characters in the
          same aspect ratio as your project will be shown
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-2.5 shadow-sm">
          <Search size={17} className="text-stone-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or project..."
            className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-stone-400">
              <Loader2 size={26} className="animate-spin text-primary-400" />
              Loading your library…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-stone-400">
              {items.length === 0
                ? "Your library is empty. Characters you create are saved here."
                : `No characters match "${query}"`}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {filtered.map((c) => (
                <LibraryCard
                  key={c.id}
                  character={c}
                  selected={selectedId === c.id}
                  onSelect={() => setSelectedId(c.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-3 border-t border-stone-100 pt-4">
          <button
            onClick={handleClose}
            className="cursor-pointer rounded-full border border-stone-200 bg-white px-6 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedId && onUse(selectedId)}
            disabled={!selectedId || importing}
            className={`flex items-center gap-2 rounded-full border-0 bg-gradient-to-r from-primary-500 to-primary-600 px-7 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/30 transition-opacity ${
              selectedId && !importing
                ? "cursor-pointer hover:opacity-90"
                : "cursor-not-allowed opacity-60"
            }`}
          >
            {importing && <Loader2 size={15} className="animate-spin" />}
            Use This Character
          </button>
        </div>
      </div>
    </Dialog>
  );
};

// ---------- Single library card ----------
const LibraryCard: React.FC<{
  character: LibraryCharacter;
  selected: boolean;
  onSelect: () => void;
}> = ({ character, selected, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all ${
        selected
          ? "border-primary-400 ring-2 ring-primary-200"
          : "border-stone-100 hover:border-primary-200"
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-primary-50">
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt={character.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary-200">
            <User size={40} />
          </div>
        )}
        {selected && (
          <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white shadow-md">
            <Check size={15} strokeWidth={3} />
          </span>
        )}
      </div>

      <div className="px-3 py-2.5">
        <p className="m-0 truncate text-sm font-bold text-stone-800">
          {character.name}
        </p>
        <p className="m-0 truncate text-xs text-stone-400">
          {character.sourceProjectTitle ?? character.imagePrompt}
        </p>
      </div>
    </button>
  );
};

export default LibraryPickerModal;
