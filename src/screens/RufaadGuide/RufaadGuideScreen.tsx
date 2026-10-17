/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useRef, useState } from "react";
import RefineModal, {
  type RefineResult,
} from "../../components/modals/RefineModal";
import { STEPS } from "../../utils/staticData";
import ReviewStep from "../../components/ReviewStep";
import CharactersStep from "../../components/CharactersStep";
import ImagesStep from "../../components/ImagesStep";
import VoiceMusicStep from "../../components/VoiceMusicStep";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchProjectById,
  updateProject,
  type UpdateProjectPayload,
} from "../../store/slices/projectSlice";
import { setCharacters } from "../../store/slices/characterSlice";
import { setScenes } from "../../store/slices/sceneSlice";
import VideosStep from "../../components/VideosStep";
import YourStoryStep from "../../components/YourStoryStep";
import RufaadStudioScreen from "../RufaadStudio/RufaadStudioScreen";

const RufaadGuideScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const projectId =
    id ?? (location.state as { projectId?: string } | null)?.projectId;

  const current = useAppSelector((s) => s.projects.current);
  const status = useAppSelector((s) => s.projects.status);
  const characters = useAppSelector((s) => s.characters.items);
  const scenes = useAppSelector((s) => s.scenes.items);

  const [title, setTitle] = useState("");

  // ---- Wizard state ----
  const [currentStep, setCurrentStep] = useState(1);
  // furthest step the user has unlocked (mirrors Project.progress, min 1)
  const [maxStep, setMaxStep] = useState(1);
  const [refineOpen, setRefineOpen] = useState(false);

  // ---- Step 1 state ----
  const [story, setStory] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">(
    "16:9",
  );
  const [numScenes, setNumScenes] = useState(7);
  const [styleFilter, setStyleFilter] = useState("All Styles");
  const [selectedStyle, setSelectedStyle] = useState("animated-3d");

  // ---- Step 5 (voice & music) config ----
  const [narrator, setNarrator] = useState("clara");
  const [speakingStyle, setSpeakingStyle] = useState("Standard");
  const [musicStyle, setMusicStyle] = useState("Standard");
  const [voicePrompt, setVoicePrompt] = useState("");
  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicTitle, setMusicTitle] = useState<string | null>(null);

  const hydratedFor = useRef<string | null>(null);

  // 1. Fetch on mount / id change
  useEffect(() => {
    if (projectId) dispatch(fetchProjectById(projectId));
  }, [projectId, dispatch]);

  // 2. Hydrate step-1 fields + seed slices + restore progress, once per project
  useEffect(() => {
    if (!current || current.id !== projectId) return;
    if (hydratedFor.current === current.id) return;
    hydratedFor.current = current.id;

    setAspectRatio((current.aspectRatio as "16:9" | "9:16" | "1:1") ?? "16:9");
    if (current.style) setSelectedStyle(current.style.slug);

    if (current.story) {
      setStory(current.story.finalPrompt ?? current.story.starterPrompt ?? "");
      setNumScenes(current.story.numScenes ?? 7);
    }

    setNarrator(current.narrator ?? "clara");
    setSpeakingStyle(current.speakingStyle ?? "Standard");
    setMusicStyle(current.musicStyle ?? "Standard");
    setVoicePrompt(current.voicePrompt ?? "");
    setTitle(current.title ?? "");
    setMusicPrompt(current.musicPrompt ?? "");
    setMusicUrl(current.musicUrl ?? null);
    setMusicTitle(current.musicTitle ?? null);
    dispatch(setCharacters(current.characters ?? []));
    dispatch(setScenes(current.scenes ?? []));

    // restore furthest-reached step (progress persisted on the project)
    const restored = Math.min(7, Math.max(1, current.progress ?? 1));
    setMaxStep(restored);
    // land the user on the furthest step they'd unlocked
    setCurrentStep(restored);
  }, [current, projectId, dispatch]);

  // ---------- Navigation ----------
  // Step 1 locks permanently once the user has advanced past it (maxStep > 1).
  // Since maxStep mirrors persisted progress (and only grows), this holds
  // across reloads too — "past step 1" means forever.
  const isStepLocked = (step: number) => {
    if (step > maxStep) return true; // not yet reached
    if (step === 1 && maxStep > 1) return true; // story locked once left
    return false;
  };

  // Only allow jumping to steps that are unlocked.
  const goToStep = (step: number) => {
    if (step < 1 || step > 6) return;
    if (isStepLocked(step)) return;
    setCurrentStep(step);
  };

  // Advance to the next step, unlocking + persisting progress if it grew.
  const advanceTo = (step: number) => {
    if (step < 1 || step > 7) return;
    setCurrentStep(step);
    if (step > maxStep) {
      setMaxStep(step);
      if (projectId) {
        // persist the new high-water mark; fire-and-forget is fine here
        dispatch(updateProject({ id: projectId, progress: step }));
      }
    }
  };

  const handleCreateVideo = () => {
    if (!story.trim()) return;
    setRefineOpen(true);
  };

  const persistStep1 = async (finalPrompt: string) => {
    if (!projectId) return;
    await dispatch(
      updateProject({
        id: projectId,
        title: title.trim() || "Untitled Project",
        aspectRatio,
        styleSlug: selectedStyle, // ← slug now, resolved to styleId on the backend
        starterPrompt: story,
        finalPrompt,
        numScenes,
      }),
    ).unwrap();
  };

  const handleRefineComplete = async (result: RefineResult) => {
    setRefineOpen(false);

    let finalPrompt = story;
    if (result.mode === "refined") {
      const details = result.answers
        .filter((a) => a.answer)
        .map((a) => `${a.question} → ${a.answer}`)
        .join(". ");
      finalPrompt = `${story}. Details: ${details}${
        result.extraDetails ? `. Additional notes: ${result.extraDetails}` : ""
      }`;
    }

    try {
      await persistStep1(finalPrompt);
    } catch (e) {
      console.error("Failed to save story:", e);
    }
    advanceTo(2);
  };

  // One small helper that persists a single field to the project.
  const saveToProject = (fields: Partial<UpdateProjectPayload>) => {
    if (projectId) dispatch(updateProject({ id: projectId, ...fields }));
  };

  const handleMusicUrlChange = (url: string | null, title: string | null) => {
    setMusicUrl(url);
    setMusicTitle(title);
    saveToProject({ musicUrl: url, musicTitle: title });
  };

  const handleNarratorChange = (value: string) => {
    setNarrator(value);
    saveToProject({ narrator: value });
  };

  const handleSpeakingStyleChange = (value: string) => {
    setSpeakingStyle(value);
    saveToProject({ speakingStyle: value });
  };

  const handleMusicStyleChange = (value: string) => {
    setMusicStyle(value);
    saveToProject({ musicStyle: value });
  };

  const handleVoicePromptChange = (value: string) => {
    setVoicePrompt(value);
    saveToProject({ voicePrompt: value });
  };

  const handleMusicPromptChange = (value: string) => {
    setMusicPrompt(value);
    saveToProject({ musicPrompt: value });
  };
  const loadingProject = status === "loading" && !current;

  // ============================================================

  if (currentStep === 7 && !loadingProject) {
    return (
      <RufaadStudioScreen
        projectId={projectId}
        scenes={scenes}
        characters={characters}
        projectTitle={title}
        musicUrl={musicUrl}
        onBack={() => goToStep(6)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6f0] px-4 pt-6 pb-12 font-sans">
      {currentStep === 7 ? null : (
        <div className="max-lg:mb-4 max-w-3xl">
          <button
            onClick={() => navigate("/")}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-500 shadow-sm hover:bg-stone-50 hover:text-primary-600"
          >
            <ArrowLeft size={16} /> Back to Projects
          </button>
        </div>
      )}

      {/* ---------- Stepper ---------- */}

      {currentStep === 7 ? null : (
        <div className="mx-auto mb-7 flex max-w-3xl items-start justify-center">
          {STEPS.map((step, i) => {
            const isActive = currentStep === step.id;
            const isLocked = isStepLocked(step.id);
            const Icon = step.icon;
            return (
              <React.Fragment key={step.id}>
                {i > 0 && (
                  <div
                    className={`mt-6 h-0.5 min-w-6 flex-1 ${
                      step.id <= maxStep ? "bg-primary-500" : "bg-stone-200"
                    }`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => goToStep(step.id)}
                  disabled={isLocked}
                  title={
                    !isLocked
                      ? step.label
                      : step.id === 1
                        ? "Your story is locked once you've moved on"
                        : "Complete the previous steps first"
                  }
                  className={`flex min-w-[76px] flex-col items-center gap-1.5 border-0 bg-transparent ${
                    isLocked ? "cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                        isActive
                          ? "bg-primary-600 text-white shadow-lg shadow-primary-500/40"
                          : isLocked
                            ? "bg-stone-100 text-stone-300 shadow-sm"
                            : step.id <= maxStep
                              ? "bg-primary-400 text-white shadow-sm"
                              : "bg-white text-stone-400 shadow-sm opacity-70"
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-stone-200 bg-white text-[10px] font-bold text-stone-400">
                      {isLocked ? <Lock size={9} /> : step.id}
                    </span>
                  </div>
                  <span
                    className={`text-xs ${
                      isActive
                        ? "font-bold text-primary-600"
                        : isLocked
                          ? "font-medium text-stone-300"
                          : "font-medium text-stone-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ---------- Card ---------- */}
      <div className="mx-auto max-w-4xl rounded-3xl bg-white px-8 py-7 shadow-xl shadow-black/5">
        {loadingProject ? (
          <div className="py-16 text-center text-stone-400">
            Loading project…
          </div>
        ) : (
          <>
            {currentStep === 1 && (
              <YourStoryStep
                title={title}
                onTitleChange={setTitle}
                story={story}
                onStoryChange={setStory}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                numScenes={numScenes}
                onNumScenesChange={setNumScenes}
                styleFilter={styleFilter}
                onStyleFilterChange={setStyleFilter}
                selectedStyle={selectedStyle}
                onSelectedStyleChange={setSelectedStyle}
                onCreateVideo={handleCreateVideo}
              />
            )}

            {currentStep === 2 && (
              <ReviewStep
                projectId={projectId!}
                onNext={() => advanceTo(3)}
                ideaText={story}
                scriptText={scenes
                  .map((sc, i) => `Scene ${i + 1}: ${sc.text ?? ""}`)
                  .join("\n")}
                onShowPrompts={() => console.log("show prompts")}
              />
            )}

            {currentStep === 3 && (
              <CharactersStep
                projectId={projectId!}
                onBack={() => goToStep(2)}
                onNext={() => advanceTo(4)}
              />
            )}

            {currentStep === 4 && (
              <ImagesStep
                projectId={projectId!}
                onBack={() => goToStep(3)}
                onNext={() => advanceTo(5)}
              />
            )}

            {currentStep === 5 && (
              <VoiceMusicStep
                projectId={projectId!}
                narrator={narrator}
                speakingStyle={speakingStyle}
                musicStyle={musicStyle}
                voicePrompt={voicePrompt}
                musicPrompt={musicPrompt}
                onNarratorChange={handleNarratorChange}
                onSpeakingStyleChange={handleSpeakingStyleChange}
                onMusicStyleChange={handleMusicStyleChange}
                onVoicePromptChange={handleVoicePromptChange}
                onMusicPromptChange={handleMusicPromptChange}
                onBack={() => goToStep(4)}
                onNext={() => advanceTo(6)}
                onSkipToEditor={() => advanceTo(7)}
                musicUrl={musicUrl}
                musicTitle={musicTitle}
                onMusicUrlChange={handleMusicUrlChange}
              />
            )}

            {currentStep === 6 && (
              <VideosStep
                projectId={projectId!}
                onBack={() => goToStep(5)}
                onNext={() => advanceTo(7)}
                onOpenEditor={() => advanceTo(7)}
              />
            )}
          </>
        )}
      </div>

      <RefineModal
        open={refineOpen}
        story={story}
        onClose={() => setRefineOpen(false)}
        onComplete={handleRefineComplete}
      />
    </div>
  );
};

export default RufaadGuideScreen;
