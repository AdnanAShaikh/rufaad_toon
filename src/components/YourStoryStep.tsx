import React, { useRef } from "react";
import {
  Sparkles,
  Wand2,
  ClipboardList,
  Star,
  Zap,
  RectangleHorizontal,
  Monitor,
  Smartphone,
  Square,
  Crown,
  Clapperboard,
  Palette,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Film,
  RefreshCw,
} from "lucide-react";
import { useQuickStoryIdeas } from "../hooks/useQuickStoryIdeas";
import { useStyles } from "../hooks/useStyles";
import { toast } from "react-toastify";
import { useGenerateTitle } from "../hooks/useGenerateTitle";

type AspectRatio = "16:9" | "9:16" | "1:1";

interface YourStoryProps {
  title: string;
  onTitleChange: (v: string) => void;
  story: string;
  onStoryChange: (v: string) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (v: AspectRatio) => void;
  numScenes: number;
  onNumScenesChange: (v: number) => void;
  styleFilter: string;
  onStyleFilterChange: (v: string) => void;
  selectedStyle: string;
  onSelectedStyleChange: (v: string) => void;
  onCreateVideo: () => void;
}

const RATIOS = [
  { value: "16:9", label: "Landscape", icon: Monitor, pro: false },
  { value: "9:16", label: "Portrait", icon: Smartphone, pro: true },
  { value: "1:1", label: "Square", icon: Square, pro: true },
] as const;

const YourStoryStep: React.FC<YourStoryProps> = ({
  title,
  onTitleChange,
  story,
  onStoryChange,
  aspectRatio,
  onAspectRatioChange,
  numScenes,
  onNumScenesChange,
  styleFilter,
  onStyleFilterChange,
  selectedStyle,
  onSelectedStyleChange,
  onCreateVideo,
}) => {
  const { ideas, loading, reload } = useQuickStoryIdeas(6);
  const { styles, filters, styleLoading } = useStyles();
  const { generate: generateTitle, loading: titleLoading } = useGenerateTitle();

  const styleScrollRef = useRef<HTMLDivElement | null>(null);
  const estDuration = numScenes * 7; // ~7s per scene

  const visibleStyles =
    styleFilter === "All Styles"
      ? styles
      : styles.filter((s) => s.category === styleFilter);

  const scrollStyles = (dir: number) => {
    styleScrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  const handleGenerateTitle = async () => {
    if (story.trim().length < 50) {
      toast.error("Write at least 50 characters of description first.");
      return;
    }
    try {
      const t = await generateTitle(story.trim());
      if (t) {
        onTitleChange(t);
        toast.success("Title generated");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate title");
    }
  };

  const handleReloadIdeas = async () => {
    try {
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't load story ideas");
    }
  };
  return (
    <>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-400 text-white">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="m-0 text-2xl font-bold text-secondary-700">
              Tell us your <span className="text-primary-500">story</span>
            </h1>
            <p className="m-0 flex items-center gap-1 text-sm text-stone-400">
              We'll create the magic{" "}
              <Sparkles size={13} className="text-primary-400" />
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            defaultValue="en"
            className="cursor-pointer rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-secondary-700"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="es">Spanish</option>
          </select>
          <div className="flex gap-1 rounded-2xl bg-stone-100 p-1">
            <button className="flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white">
              <Wand2 size={15} /> Generate
            </button>
            <button className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-white">
              <ClipboardList size={15} /> Paste
            </button>
          </div>
        </div>
      </div>

      {/* Project title */}
      <div className="mb-4">
        <label className="mb-2 flex items-center gap-1.5 text-[0.95rem] font-bold text-secondary-600">
          <Film size={16} className="text-primary-500" /> Project Title
        </label>
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value.slice(0, 80))}
            placeholder="Untitled Project"
            className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          />
          <button
            onClick={handleGenerateTitle}
            disabled={titleLoading}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-500 hover:border-primary-200 hover:text-primary-600 disabled:opacity-50"
          >
            {titleLoading ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Wand2 size={15} />
            )}
            Generate
          </button>
        </div>
      </div>

      {/* Story textarea */}
      <div className="relative mb-4">
        <textarea
          value={story}
          onChange={(e) => onStoryChange(e.target.value.slice(0, 3000))}
          placeholder="Describe your video idea... What's the story? Who are the characters? What's the mood?"
          rows={6}
          className="w-full resize-y rounded-2xl border border-stone-200 bg-white p-4 pb-9 text-[0.95rem] outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
        />
        <span className="absolute bottom-3 right-3.5 rounded-lg bg-stone-100 px-2.5 py-0.5 text-xs text-stone-400">
          {story.length}/3000
        </span>
      </div>

      {/* Tip banner */}
      <div className="mb-6 flex flex-col gap-0.5 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
        <span className="flex items-center gap-1.5 font-bold text-secondary-600">
          <Star size={15} /> Add more characters
        </span>
        <span className="text-sm text-secondary-500">
          Describe who, where, and what happens for best results.
        </span>
      </div>

      {/* Quick ideas */}
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[0.95rem] font-bold text-secondary-600">
          <Zap size={16} className="text-primary-500" /> Quick story ideas
        </span>
        <button
          onClick={handleReloadIdeas}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-500 hover:border-primary-200 hover:text-primary-600 disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          {ideas.length === 0 ? "Generate" : "Refresh"}
        </button>
      </div>
      <div className="mb-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[46px] animate-pulse rounded-xl border border-stone-100 bg-stone-100"
            />
          ))
        ) : ideas.length === 0 ? (
          <button
            onClick={handleReloadIdeas}
            className="col-span-full flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-stone-200 bg-stone-50/50 px-4 py-5 text-sm text-stone-400 hover:border-primary-200 hover:text-primary-600"
          >
            <Sparkles size={15} /> Tap to generate story ideas
          </button>
        ) : (
          ideas.map((idea) => (
            <button
              key={idea.text}
              onClick={() => onStoryChange(idea.text)}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-stone-100 bg-stone-50 px-3.5 py-3 text-left text-sm text-stone-600 hover:border-primary-200 hover:bg-primary-50"
            >
              <span>{idea.emoji}</span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {idea.text}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Aspect ratio */}
      <div className="mb-3 flex items-center gap-1.5 text-[0.95rem] font-bold text-secondary-600">
        <RectangleHorizontal size={16} className="text-primary-500" /> Aspect
        Ratio
      </div>
      <div className="mb-7 flex gap-3">
        {RATIOS.map((r) => {
          const isSel = aspectRatio === r.value;
          const Icon = r.icon;
          return (
            <button
              key={r.value}
              onClick={() => onAspectRatioChange(r.value)}
              className={`relative flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 px-3 py-4 transition-all ${
                isSel
                  ? "border-primary-500 bg-primary-50"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              {r.pro && (
                <span className="absolute right-2 top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-secondary-400 text-white">
                  <Crown size={12} />
                </span>
              )}
              <Icon
                size={24}
                className={isSel ? "text-primary-500" : "text-stone-500"}
              />
              <span
                className={`font-semibold ${isSel ? "text-primary-600" : "text-stone-600"}`}
              >
                {r.label}
              </span>
              <span className="text-xs text-stone-400">{r.value}</span>
            </button>
          );
        })}
      </div>

      {/* Scenes slider */}
      <div className="mb-3 flex items-center gap-1.5 text-[0.95rem] font-bold text-secondary-600">
        <Clapperboard size={16} className="text-primary-500" /> Number of Scenes
        (~{estDuration}s)
      </div>
      <div className="mb-7 flex items-center gap-5">
        <div className="flex-1">
          <input
            type="range"
            min={1}
            max={50}
            value={numScenes}
            onChange={(e) => onNumScenesChange(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer accent-primary-500"
          />
          <div className="mt-1 flex justify-between text-xs text-stone-300">
            <span>1</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-primary-200 px-3 py-1.5">
          <button
            onClick={() => onNumScenesChange(Math.max(1, numScenes - 1))}
            className="cursor-pointer border-0 bg-transparent px-1 text-xl font-bold text-primary-500"
          >
            −
          </button>
          <span className="min-w-6 text-center text-lg font-bold text-primary-600">
            {numScenes}
          </span>
          <button
            onClick={() => onNumScenesChange(Math.min(50, numScenes + 1))}
            className="cursor-pointer border-0 bg-transparent px-1 text-xl font-bold text-primary-500"
          >
            +
          </button>
        </div>
      </div>

      {/* Styles */}
      <div className="mb-7 rounded-2xl border border-stone-100 bg-stone-50 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 text-white">
            <Palette size={18} />
          </div>
          <div>
            <div className="font-bold text-secondary-700">
              Choose Your Style
            </div>
            <div className="text-xs text-stone-400">
              {styles.length} styles available
            </div>{" "}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map((f) => {
            const isSel = styleFilter === f.name;
            return (
              <button
                key={f.name}
                onClick={() => onStyleFilterChange(f.name)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                  isSel
                    ? "border-secondary-500 bg-secondary-500 text-white"
                    : "border-stone-200 bg-white text-stone-500 hover:border-secondary-300"
                }`}
              >
                {f.name}
                <span className="rounded-full bg-black/10 px-1.5 py-px text-xs">
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <button
            onClick={() => scrollStyles(-1)}
            className="absolute -left-3.5 top-[40%] z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-md"
          >
            <ChevronLeft size={18} />
          </button>
          <div
            ref={styleScrollRef}
            className="flex gap-3 overflow-x-auto px-0.5 pb-3 pt-1 [scrollbar-width:thin]"
          >
            {styleLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[110px] min-w-[110px] shrink-0 animate-pulse rounded-2xl bg-stone-200"
                  />
                ))
              : visibleStyles.map((st) => {
                  const isSel = selectedStyle === st.slug;
                  return (
                    <button
                      key={st.id}
                      onClick={() => onSelectedStyleChange(st.slug)}
                      style={
                        st.imageUrl
                          ? {
                              backgroundImage: `url(${st.imageUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                      className={`relative flex h-[110px] min-w-[110px] shrink-0 cursor-pointer items-end justify-center overflow-hidden rounded-2xl border-0 p-0 ${
                        st.imageUrl ? "" : `bg-gradient-to-br ${st.gradient}`
                      } ${
                        isSel
                          ? "outline outline-[3px] outline-offset-2 outline-secondary-500"
                          : ""
                      }`}
                    >
                      {st.pro && (
                        <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-lg bg-secondary-500 px-1.5 py-0.5 text-[0.62rem] font-bold text-white">
                          <Crown size={9} /> PRO
                        </span>
                      )}
                      {isSel && (
                        <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-secondary-500">
                          <Check size={13} strokeWidth={3} />
                        </span>
                      )}
                      <span className="w-full bg-black/45 px-1 py-1.5 text-center text-xs font-semibold text-white">
                        {st.name}
                      </span>
                    </button>
                  );
                })}
          </div>
          <button
            onClick={() => scrollStyles(1)}
            className="absolute -right-3.5 top-[40%] z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-md"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onCreateVideo}
        disabled={!story.trim()}
        className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-full border-0 bg-gradient-to-r from-primary-500 to-primary-400 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-primary-500/35 transition-opacity enabled:cursor-pointer enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Sparkles size={20} /> Create Video
      </button>

      {/* Footer pills */}
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-sm font-medium text-stone-500 shadow-sm">
          <Film size={14} className="text-primary-500" /> {numScenes} scenes
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-sm font-medium text-stone-500 shadow-sm">
          <Clock size={14} className="text-primary-500" /> Video duration ~
          {estDuration}s
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-sm font-medium text-stone-500 shadow-sm">
          <Star size={14} className="text-primary-500" /> Consistent characters
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-sm font-medium text-stone-500 shadow-sm">
          <Zap size={14} className="text-primary-500" /> Ready in ~3 min
        </span>
      </div>
    </>
  );
};

export default YourStoryStep;
