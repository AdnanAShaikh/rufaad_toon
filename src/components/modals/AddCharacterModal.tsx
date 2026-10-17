import React, { useState } from "react";
import { Dialog } from "@mui/material";
import { Users, X, Loader2 } from "lucide-react";
import { useAppSelector } from "../../store/hooks";

// Shared "Add New Character" modal (name + image prompt).
// Used by both the Review step and the Characters step.
const AddCharacterModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, imagePrompt: string) => void;
}> = ({ open, onClose, onAdd }) => {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const saving = useAppSelector((s) => s.characters.status === "loading");

  const reset = () => {
    setName("");
    setPrompt("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canAdd = name.trim() !== "" && prompt.trim() !== "" && !saving;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          className: "rounded-3xl overflow-hidden",
          style: {
            background: "linear-gradient(180deg, #f3f7ef 0%, #ffffff 45%)",
          },
        },
      }}
    >
      <div className="relative px-7 pb-6 pt-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg shadow-primary-500/30">
            <Users size={22} />
          </span>
          <div>
            <h2 className="m-0 text-lg font-bold text-stone-900">
              Add New Character
            </h2>
            <p className="m-0 text-sm text-stone-500">
              Add the character details now; create the image in the next step
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

        <div className="my-5 h-px bg-primary-100" />

        <label className="text-sm font-semibold text-stone-700">
          Character Name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter character name..."
          className="mt-2 w-full rounded-xl border border-primary-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-stone-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />

        <label className="mt-5 block text-sm font-semibold text-stone-700">
          Character Image Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Describe the character's appearance, clothing, age, and distinctive features..."
          className="mt-2 w-full resize-y rounded-xl border border-primary-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-stone-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />
        <p className="mt-1.5 text-xs text-stone-400">
          This prompt will be used to generate the character in the next step.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="cursor-pointer rounded-full border border-stone-200 bg-white px-6 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={() => canAdd && onAdd(name.trim(), prompt.trim())}
            disabled={!canAdd}
            className={`flex items-center gap-2 rounded-full border-0 bg-gradient-to-r from-primary-500 to-primary-600 px-7 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/30 transition-opacity ${
              canAdd
                ? "cursor-pointer hover:opacity-90"
                : "cursor-not-allowed opacity-60"
            }`}
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Add Character
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default AddCharacterModal;
