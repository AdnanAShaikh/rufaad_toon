import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  ArrowLeft,
  ArrowRight,
  SkipForward,
  Sparkles,
  Heart,
  Briefcase,
  Zap,
  Clock,
  Drama,
  BookOpen,
  Radio,
  Film,
  Music,
  Laptop,
  Leaf,
  Music4,
  Tv,
  ChevronLeft,
  ChevronRight,
  Check,
  Play,
  Headphones,
  Volume2,
  Library,
  Clapperboard,
  User,
  Pencil,
  Trash2,
  Maximize2,
  ImageIcon,
  X,
  RefreshCw,
  Pause,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  updateScene,
  deleteScene,
  type Scene,
} from "../store/slices/sceneSlice";
import DeleteModal from "./modals/DeleteModal";
import { useNarrators } from "../hooks/useNarrators";
import { toast } from "react-toastify";
import MusicLibraryModal from "./modals/MusicLibraryModal";

interface VoiceMusicStepProps {
  projectId: string;
  // Persisted config (owned by the parent, seeded from the project)
  narrator: string;
  speakingStyle: string;
  musicStyle: string;
  voicePrompt: string;
  musicPrompt: string;
  musicUrl?: string | null;
  musicTitle?: string | null;
  onNarratorChange: (value: string) => void;
  onSpeakingStyleChange: (value: string) => void;
  onMusicStyleChange: (value: string) => void;
  onVoicePromptChange: (value: string) => void;
  onMusicPromptChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkipToEditor?: () => void;
  onMusicUrlChange: (url: string | null, title: string | null) => void;
}

const SPEAKING_STYLES = [
  { name: "Standard", icon: Sparkles },
  { name: "Warm & Friendly", icon: Heart },
  { name: "Professional", icon: Briefcase },
  { name: "Energetic", icon: Zap },
  { name: "Calm", icon: Clock },
  { name: "Dramatic", icon: Drama },
  { name: "Educational", icon: BookOpen },
  { name: "Podcast", icon: Mic },
];

const MUSIC_STYLES = [
  { name: "Standard", icon: Sparkles },
  { name: "Cinematic", icon: Film },
  { name: "Upbeat", icon: Music },
  { name: "Lo-Fi", icon: Radio },
  { name: "Emotional", icon: Heart },
  { name: "Tech", icon: Laptop },
  { name: "Peaceful", icon: Leaf },
  { name: "Jazz", icon: Music4 },
  { name: "Retro", icon: Tv },
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

const VoiceMusicStep: React.FC<VoiceMusicStepProps> = ({
  projectId,
  narrator,
  speakingStyle,
  musicStyle,
  voicePrompt,
  musicPrompt,
  musicUrl,
  musicTitle,
  onNarratorChange,
  onMusicPromptChange,
  onMusicStyleChange,
  onSpeakingStyleChange,
  onVoicePromptChange,
  onBack,
  onNext,
  onSkipToEditor,
  onMusicUrlChange,
}) => {
  const dispatch = useAppDispatch();
  const scenes = useAppSelector((s) => s.scenes.items);
  const characters = useAppSelector((s) => s.characters.items);

  const {
    narrators,
    loading: narratorsLoading,
    error: narratorsError,
    reload: reloadNarrators,
  } = useNarrators();

  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);

  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [musicGenerating, setMusicGenerating] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [sceneToDelete, setSceneToDelete] = useState<string | null>(null);

  // Faked, non-persisted voiceover markers keyed by scene id (TTS not built).
  const [fakeAudio, setFakeAudio] = useState<Record<string, string>>({});

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [musicModalOpen, setMusicModalOpen] = useState(false);

  useEffect(() => {
    if (!previewUrl) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setPreviewUrl(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewUrl]);

  useEffect(() => {
    return () => musicAudioRef.current?.pause();
  }, []);

  const hasVoiceoverFor = (sc: Scene) =>
    Boolean(sc.voiceoverUrl ?? fakeAudio[sc.id]);
  const doneCount = scenes.filter(hasVoiceoverFor).length;

  const voiceoverTextFor = (scene: Scene) => scene.voiceoverText ?? "";

  // ---------- Fake generation (local only) ----------
  const generateVoiceover = (id: string) => {
    setGeneratingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setFakeAudio((prev) => ({ ...prev, [id]: `fake-audio-${id}.mp3` }));
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1500);
  };

  const generateAllVoiceovers = () => {
    scenes.forEach((sc) => {
      if (!hasVoiceoverFor(sc)) generateVoiceover(sc.id);
    });
  };

  const generateMusic = () => {
    setMusicGenerating(true);
    setTimeout(() => setMusicGenerating(false), 2000);
  };

  const scrollCarousel = (dir: number) => {
    carouselRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  // ---------- Scene actions (API) ----------
  const handleSaveVoiceoverText = (scene: Scene, value: string) => {
    const trimmed = value.trim();
    const baseline = scene.voiceoverText ?? voiceoverTextFor(scene);
    // Only persist if changed; do NOT clear the existing voiceover (image rule).
    if (trimmed && trimmed !== baseline) {
      dispatch(
        updateScene({ projectId, id: scene.id, voiceoverText: trimmed }),
      );
    }
    setEditingSceneId(null);
  };

  const handleDeleteScene = (id: string) => {
    dispatch(deleteScene({ projectId, id }));
    setFakeAudio((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const previewNarrator = (url: string | null) => {
    if (!url) {
      toast.info("No preview available for this voice yet.");
      return;
    }
    new Audio(url).play().catch(() => {
      toast.error("Couldn't play the preview.");
    });
  };

  const toggleMusicPlayback = () => {
    if (!musicUrl) return;
    if (musicPlaying) {
      musicAudioRef.current?.pause();
      setMusicPlaying(false);
      return;
    }
    const audio = new Audio(musicUrl);
    musicAudioRef.current = audio;
    audio.play().catch(() => toast.error("Couldn't play the track."));
    audio.onended = () => setMusicPlaying(false);
    setMusicPlaying(true);
  };

  const handleSelectMusic = (url: string, title: string) => {
    onMusicUrlChange(url, title);
    toast.success("Background music set");
  };

  const handleRemoveMusic = () => {
    onMusicUrlChange(null, null);
    musicAudioRef.current?.pause();
    setMusicPlaying(false);
    toast.success("Background music removed");
  };

  // ============================================================
  return (
    <div>
      {/* ---------- Header ---------- */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-white">
            <Mic size={22} />
          </div>
          <div>
            <h2 className="m-0 text-2xl font-bold text-stone-800">
              Generate Voice & Music
            </h2>
            <span className="text-sm text-stone-500">
              {doneCount}/{scenes.length} voiceovers
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onBack}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-transparent px-4 py-2.5 font-semibold text-stone-500 hover:text-stone-700"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={onSkipToEditor}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-primary-200 bg-white px-5 py-2.5 font-semibold text-primary-600 hover:bg-primary-50"
          >
            <SkipForward size={16} /> Skip to Editor
          </button>
          <button
            onClick={onNext}
            className="flex cursor-pointer items-center gap-2.5 rounded-full border-0 bg-gradient-to-r from-primary-600 to-primary-700 py-3 pl-2 pr-6 font-bold text-white shadow-lg shadow-primary-600/30 hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
              <ArrowRight size={18} />
            </span>
            Next Step: Generate Videos
          </button>
        </div>
      </div>

      {/* ---------- Studio heading ---------- */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-300 to-primary-500 text-white">
          <Sparkles size={18} />
        </div>
        <div>
          <h3 className="m-0 text-lg font-bold text-stone-800">
            Voice & Music Studio
          </h3>
          <span className="text-sm text-stone-400">
            Configure AI narration and background music
          </span>
        </div>
      </div>

      {/* ---------- Narrator carousel ---------- */}
      <div className="mb-6 rounded-3xl border border-primary-100 bg-gradient-to-b from-primary-50/70 to-white p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-white">
            <Mic size={18} />
          </div>
          <div>
            <div className="font-bold text-stone-800">Choose Your Narrator</div>
            <div className="text-sm text-stone-400">
              Select the perfect voice for your story
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => scrollCarousel(-1)}
            className="absolute -left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-md"
          >
            <ChevronLeft size={18} />
          </button>

          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]"
          >
            {narratorsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-52 w-40 shrink-0 animate-pulse rounded-2xl bg-stone-100"
                />
              ))
            ) : narratorsError || narrators.length === 0 ? (
              <div className="flex w-full flex-col items-center gap-3 py-8 text-center">
                <span className="text-sm text-stone-400">
                  {narratorsError ?? "No narrators available."}
                </span>
                <button
                  onClick={reloadNarrators}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50"
                >
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            ) : (
              narrators.map((n) => {
                const isSel = narrator === n.slug;
                return (
                  <button
                    key={n.id}
                    onClick={() => onNarratorChange(n.slug)}
                    className={`relative flex w-40 shrink-0 cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 bg-white px-4 pb-5 pt-6 transition-all ${
                      isSel
                        ? "border-primary-400 shadow-lg shadow-primary-200/50"
                        : "border-stone-100 hover:border-primary-200"
                    }`}
                  >
                    {n.pack && (
                      <span className="absolute left-0 top-0 flex items-center gap-0.5 rounded-br-xl rounded-tl-2xl bg-primary-500 px-2.5 py-1 text-[9px] font-bold text-white">
                        <Headphones size={9} /> Voice Pack
                      </span>
                    )}
                    {isSel && (
                      <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white shadow-md">
                        <Check size={15} strokeWidth={3} />
                      </span>
                    )}

                    <div className="relative">
                      <div
                        className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-300 text-primary-600 ${
                          isSel ? "ring-2 ring-primary-300 ring-offset-2" : ""
                        }`}
                      >
                        <User size={36} />
                      </div>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          previewNarrator(n.previewUrl);
                        }}
                        className="absolute -bottom-2 left-1/2 flex h-8 w-8 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-white text-primary-500 shadow-md hover:bg-primary-50"
                      >
                        <Play size={13} />
                      </span>
                    </div>

                    <span
                      className={`mt-2 font-bold ${isSel ? "text-primary-600" : "text-stone-800"}`}
                    >
                      {n.name}
                    </span>
                    <span className="text-center text-xs leading-snug text-stone-400">
                      {n.description}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <button
            onClick={() => scrollCarousel(1)}
            className="absolute -right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-md"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* ---------- Speaking style + Music panels ---------- */}
      <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Speaking Style */}
        <div className="rounded-3xl border border-primary-100 bg-gradient-to-b from-primary-50/60 to-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-white">
              <Volume2 size={18} />
            </div>
            <div>
              <div className="font-bold text-stone-800">Speaking Style</div>
              <div className="text-sm text-stone-400">
                How should the narrator speak?
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {SPEAKING_STYLES.map((st) => {
              const isSel = speakingStyle === st.name;
              const Icon = st.icon;
              return (
                <button
                  key={st.name}
                  onClick={() => onSpeakingStyleChange(st.name)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    isSel
                      ? "border-primary-500 bg-primary-500 text-white"
                      : "border-primary-200 bg-white text-stone-600 hover:border-primary-400"
                  }`}
                >
                  <Icon size={14} /> {st.name}
                </button>
              );
            })}
          </div>

          <textarea
            defaultValue={voicePrompt}
            onBlur={(e) => {
              if (e.target.value !== voicePrompt)
                onVoicePromptChange(e.target.value);
            }}
            rows={3}
            placeholder="Describe the voice character..."
            className="mb-5 w-full resize-y rounded-2xl border border-stone-200 bg-white p-4 text-sm outline-none focus:border-primary-300"
          />

          <div className="flex justify-end">
            <button
              onClick={generateAllVoiceovers}
              disabled={generatingIds.size > 0 || scenes.length === 0}
              className="flex cursor-pointer items-center gap-2.5 rounded-full border-0 bg-gradient-to-r from-primary-600 to-primary-700 py-3 px-6 font-bold text-white shadow-lg shadow-primary-600/30 transition-opacity enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
                <Mic size={14} />
              </span>
              {generatingIds.size > 0
                ? "Generating…"
                : `Generate Voiceovers (${scenes.length})`}
            </button>
          </div>
        </div>

        {/* Background Music */}
        <div className="rounded-3xl border border-primary-100 bg-gradient-to-b from-primary-50/60 to-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-white">
              <Music size={18} />
            </div>
            <div>
              <div className="font-bold text-stone-800">Background Music</div>
              <div className="text-sm text-stone-400">
                AI-generated music for your video
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {MUSIC_STYLES.map((st) => {
              const isSel = musicStyle === st.name;
              const Icon = st.icon;
              return (
                <button
                  key={st.name}
                  onClick={() => onMusicStyleChange(st.name)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    isSel
                      ? "border-primary-500 bg-primary-500 text-white"
                      : "border-primary-200 bg-white text-stone-600 hover:border-primary-400"
                  }`}
                >
                  <Icon size={14} /> {st.name}
                </button>
              );
            })}
          </div>

          <textarea
            defaultValue={musicPrompt}
            onBlur={(e) => {
              if (e.target.value !== musicPrompt)
                onMusicPromptChange(e.target.value);
            }}
            rows={3}
            placeholder="Describe the music mood..."
            className="mb-5 w-full resize-y rounded-2xl border border-stone-200 bg-white p-4 text-sm outline-none focus:border-primary-300"
          />

          <div className="flex flex-wrap justify-end gap-2.5">
            <button
              onClick={() => setMusicModalOpen(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-primary-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary-600 hover:bg-primary-50"
            >
              <Library size={15} /> Browse Library
            </button>

            <div className="relative">
              <span className="absolute -right-1.5 -top-1.5 z-10 rounded-full bg-primary-500 px-2 py-0.5 text-[9px] font-bold text-white shadow">
                3 cr
              </span>
              <button
                onClick={generateMusic}
                disabled={musicGenerating}
                className="flex cursor-pointer items-center gap-2 rounded-full border-0 bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-600/30 transition-opacity enabled:hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
              >
                <Music size={15} />{" "}
                {musicGenerating ? "Generating…" : "Generate"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Scenes list ---------- */}
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-300 to-primary-500 text-white">
          <Clapperboard size={18} />
        </div>
        <span className="font-bold text-stone-800">Scenes</span>
      </div>
      {musicUrl ? (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-primary-200 bg-primary-50/60 p-4">
          <button
            onClick={toggleMusicPlayback}
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-md hover:opacity-90"
          >
            {musicPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
              <Music size={15} className="text-primary-500" />{" "}
              {musicTitle || "Background music"}
            </div>
            <div className="text-xs text-stone-400">
              Plays behind all scenes in your video
            </div>
          </div>
          <button
            onClick={() => setMusicModalOpen(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-primary-200 bg-white px-3.5 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-50"
          >
            <Library size={13} /> Change
          </button>
          <button
            onClick={handleRemoveMusic}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-50"
          >
            <Trash2 size={13} /> Remove
          </button>
        </div>
      ) : (
        <div className="mb-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 px-4 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-300">
            <Music size={22} />
          </span>
          <span className="text-sm font-semibold text-stone-500">
            No background music added yet
          </span>
          <span className="text-xs text-stone-400">
            Browse the library or generate a track to add music behind your
            scenes.
          </span>
          <button
            onClick={() => setMusicModalOpen(true)}
            className="mt-1 flex cursor-pointer items-center gap-1.5 rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50"
          >
            <Library size={14} /> Browse Library
          </button>
        </div>
      )}
      <div className="relative">
        {/* ---------- Background music playback / empty state ---------- */}
        <div className="absolute bottom-8 left-[22px] top-4 w-px bg-stone-200" />
        <div className="flex flex-col gap-5">
          {scenes.map((scene, i) => {
            const isGenerating = generatingIds.has(scene.id);
            const hasVoiceover = hasVoiceoverFor(scene);
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
                  <div className="group relative">
                    <button
                      onClick={() => generateVoiceover(scene.id)}
                      disabled={isGenerating}
                      className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-colors ${
                        hasVoiceover
                          ? "border-primary-300 bg-primary-50 text-primary-600"
                          : "border-primary-200 bg-primary-50 text-primary-500 hover:bg-primary-100"
                      }`}
                    >
                      {isGenerating ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-500" />
                      ) : hasVoiceover ? (
                        <Play size={13} />
                      ) : (
                        <Sparkles size={14} />
                      )}
                    </button>
                    <span className="pointer-events-none absolute left-11 top-1/2 z-20 -translate-y-1/2 whitespace-nowrap rounded-lg bg-stone-800 px-2.5 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {hasVoiceover
                        ? "Play voiceover"
                        : "Click to generate voiceover"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 gap-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
                  {scene.imageUrl ? (
                    <button
                      onClick={() => setPreviewUrl(scene.imageUrl!)}
                      className="group relative h-24 w-40 shrink-0 cursor-zoom-in overflow-hidden rounded-xl border-0 p-0"
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
                    <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50 text-stone-300">
                      <ImageIcon size={22} />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary-500">
                      <Volume2 size={12} /> Voiceover Text
                    </div>

                    {editingSceneId === scene.id ? (
                      <textarea
                        autoFocus
                        defaultValue={voiceoverTextFor(scene)}
                        rows={2}
                        onBlur={(e) =>
                          handleSaveVoiceoverText(scene, e.target.value)
                        }
                        className="w-full resize-y rounded-lg border border-primary-200 p-2 text-sm text-stone-700 outline-none"
                      />
                    ) : (
                      <p className="m-0 text-sm leading-relaxed text-stone-700">
                        {voiceoverTextFor(scene)}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                        Characters:
                      </span>
                      <div className="flex items-center -space-x-1.5">
                        {scene.characters.map(({ id: cid }) => {
                          const char = characters.find((c) => c.id === cid);
                          return char?.imageUrl ? (
                            <button
                              key={cid}
                              title={char.name}
                              onClick={() => setPreviewUrl(char.imageUrl!)}
                              className="h-8 w-8 cursor-zoom-in overflow-hidden rounded-full border-2 border-white bg-cover bg-center shadow-sm"
                              style={{
                                backgroundImage: `url(${char.imageUrl})`,
                              }}
                            />
                          ) : (
                            <span
                              key={cid}
                              title={char?.name}
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-stone-100 text-stone-500 shadow-sm"
                            >
                              <User size={14} />
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 text-stone-300">
                    <button
                      onClick={() => setEditingSceneId(scene.id)}
                      className="flex cursor-pointer items-center border-0 bg-transparent p-0 hover:text-primary-500"
                      title="Edit voiceover text"
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
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button
          onClick={onBack}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-200 bg-white px-6 py-3 font-semibold text-stone-500 hover:bg-stone-50"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={onSkipToEditor}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-primary-200 bg-white px-5 py-3 font-semibold text-primary-600 hover:bg-primary-50"
        >
          <SkipForward size={16} /> Skip to Editor
        </button>
        <button
          onClick={onNext}
          className="flex cursor-pointer items-center gap-2.5 rounded-full border-0 bg-gradient-to-r from-primary-600 to-primary-700 py-3 pl-2 pr-6 font-bold text-white shadow-lg shadow-primary-600/30 hover:opacity-90"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
            <ArrowRight size={18} />
          </span>
          Next Step: Generate Videos
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
            handleDeleteScene(sceneToDelete);
            setSceneToDelete(null);
          }
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

      <MusicLibraryModal
        open={musicModalOpen}
        onClose={() => setMusicModalOpen(false)}
        onSelect={handleSelectMusic}
        currentUrl={musicUrl}
      />
    </div>
  );
};

export default VoiceMusicStep;
