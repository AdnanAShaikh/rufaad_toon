/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from "react";
import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import Backdrop from "@mui/material/Backdrop";
import {
  Sparkles,
  Wand2,
  Zap,
  Check,
  Star,
  MessageSquare,
  Lightbulb,
  Pencil,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { useRefineQuestions } from "../../hooks/useRefineQuestions";
import { toast } from "react-toastify";

// ---------- Types ----------
export interface QuizQuestion {
  question: string;
  options: string[];
}

export interface RefineResult {
  mode: "refined" | "direct";
  answers: { question: string; answer: string }[];
  extraDetails: string;
  story: string;
}

interface RefineModalProps {
  open: boolean;
  story: string;
  onClose: () => void;
  /** Called when the flow finishes — either "Start Directly" or quiz completed */
  onComplete: (result: RefineResult) => void;
}

type Phase = "choice" | "loading" | "quiz";

const RefineModal: React.FC<RefineModalProps> = ({
  open,
  onClose,
  onComplete,
  story,
}) => {
  const { fetchQuestions } = useRefineQuestions();

  const [phase, setPhase] = useState<Phase>("choice");
  const [choice, setChoice] = useState<"refine" | "direct">("refine");

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [customAnswer, setCustomAnswer] = useState("");
  const [extraDetails, setExtraDetails] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const totalSteps = questions.length + 1; // + final details question
  const isFinalStep = qIndex === questions.length;

  // Reset when reopened
  useEffect(() => {
    if (open) {
      setPhase("choice");
      setChoice("refine");
      setQuestions([]);
      setQIndex(0);
      setAnswers({});
      setCustomAnswer("");
      setExtraDetails("");
      setFetchError(null);
    }
  }, [open]);

  // ---------- Fetch quiz questions ----------
  const loadQuestions = useCallback(async () => {
    setPhase("loading");
    setFetchError(null);
    try {
      const qs = await fetchQuestions(story);
      setQuestions(qs);
      setPhase("quiz");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load questions";
      setFetchError(msg);
      toast.error(msg);
      setPhase("choice"); // drop back so the user can retry or start directly
    }
  }, [story, fetchQuestions]);

  // ---------- Handlers ----------
  const handleContinue = () => {
    if (choice === "direct") {
      onComplete({ mode: "direct", answers: [], extraDetails: "", story });
      return;
    }
    loadQuestions();
  };

  const answerAndAdvance = (answer: string) => {
    setAnswers((a) => ({ ...a, [qIndex]: answer }));
    setCustomAnswer("");
    setQIndex((i) => i + 1);
  };

  const handleBack = () => {
    if (qIndex === 0) return;
    const prev = qIndex - 1;
    const prevAnswer = answers[prev];
    const wasCustom =
      prevAnswer && !questions[prev]?.options.includes(prevAnswer);
    setCustomAnswer(wasCustom ? prevAnswer : "");
    setQIndex(prev);
  };
  const handleGenerateScript = () => {
    onComplete({
      mode: "refined",
      answers: questions.map((q, i) => ({
        question: q.question,
        answer: answers[i] || "",
      })),
      extraDetails,
      story,
    });
  };

  // ============================================================
  return (
    <Modal
      open={open}
      onClose={phase === "loading" ? undefined : onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: { timeout: 300, className: "!bg-black/40 backdrop-blur-sm" },
      }}
    >
      <Fade in={open}>
        <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 outline-none">
          {/* ================= PHASE 1: CHOICE ================= */}
          {phase === "choice" && (
            <div className="relative rounded-3xl bg-white p-8 shadow-2xl">
              <button
                onClick={onClose}
                className="absolute right-5 top-4 flex cursor-pointer items-center border-0 bg-transparent text-stone-300 hover:text-stone-500"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg shadow-primary-500/30">
                <Sparkles size={28} />
              </div>

              <h2 className="mb-1 text-center text-2xl font-bold text-stone-800">
                How would you like to start?
              </h2>
              <p className="mb-6 text-center text-sm text-stone-400">
                Choose how to process your idea
              </p>

              <div className="mb-5 grid grid-cols-2 gap-3">
                {/* Refine card */}
                <button
                  onClick={() => setChoice("refine")}
                  className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 px-4 py-6 transition-all ${
                    choice === "refine"
                      ? "border-primary-400 bg-primary-50/60"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  {choice === "refine" && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white">
                    <Wand2 size={22} />
                  </div>
                  <span className="font-bold text-primary-600">
                    Refine & Improve
                  </span>
                  <span className="text-xs text-stone-400">
                    Answer a few questions
                  </span>
                </button>

                {/* Direct card */}
                <button
                  onClick={() => setChoice("direct")}
                  className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 px-4 py-6 transition-all ${
                    choice === "direct"
                      ? "border-primary-400 bg-primary-50/60"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  {choice === "direct" && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-400">
                    <Zap size={22} />
                  </div>
                  <span className="font-bold text-stone-700">
                    Start Directly
                  </span>
                  <span className="text-xs text-stone-400">Process as-is</span>
                </button>
              </div>

              {/* Recommendation banner */}
              <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
                <span className="flex items-center gap-1.5 text-sm font-bold text-primary-700">
                  <Star size={14} /> We recommend refining your idea
                </span>
                <p className="m-0 mt-0.5 text-sm text-primary-600">
                  Answering a few quick questions helps the AI understand your
                  vision and produce a much better script.
                </p>
              </div>

              {fetchError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                  {fetchError} — try again.
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="cursor-pointer border-0 bg-transparent px-4 py-2 font-semibold text-stone-500 hover:text-stone-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinue}
                  className="cursor-pointer rounded-xl border-0 bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-3 font-bold text-white shadow-lg shadow-primary-500/30 hover:opacity-90"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ================= PHASE 2: LOADER ================= */}
          {phase === "loading" && (
            <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="h-1 w-full animate-pulse bg-gradient-to-r from-primary-300 via-primary-500 to-primary-700" />
              <div className="flex flex-col items-center px-8 py-12">
                <div className="mb-5 flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg shadow-primary-500/40">
                  <Wand2 size={28} />
                </div>
                <h3 className="m-0 text-xl font-bold text-stone-800">
                  Analyzing your idea
                </h3>
                <p className="mb-4 mt-1 text-sm text-stone-400">
                  Preparing questions to enhance your story
                </p>
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary-300" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary-500 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary-700 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {/* ================= PHASE 3: QUIZ ================= */}
          {phase === "quiz" && (
            <div className="relative max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
              <button
                onClick={onClose}
                className="absolute right-5 top-4 flex cursor-pointer items-center border-0 bg-transparent text-stone-300 hover:text-stone-500"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              {/* Progress header */}
              <div className="mb-5 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                  {isFinalStep ? (
                    <MessageSquare size={18} />
                  ) : (
                    <Lightbulb size={18} />
                  )}
                </div>
                <span className="text-sm font-semibold text-stone-500">
                  {qIndex + 1} / {totalSteps}
                </span>
              </div>

              {!isFinalStep ? (
                <>
                  {/* Question */}
                  <h3 className="mb-5 text-lg font-bold leading-snug text-stone-800">
                    {questions[qIndex]?.question}
                  </h3>

                  {/* Options */}
                  <div className="mb-5 flex flex-col gap-3">
                    {questions[qIndex]?.options.map((opt, oi) => {
                      const letter = String.fromCharCode(65 + oi); // A, B, C, D
                      const isSelected = answers[qIndex] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => answerAndAdvance(opt)}
                          className={`flex cursor-pointer items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-all ${
                            isSelected
                              ? "border-primary-400 bg-primary-50"
                              : "border-stone-200 bg-stone-50/50 hover:border-primary-300 hover:bg-primary-50/40"
                          }`}
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                              isSelected
                                ? "border-primary-500 bg-primary-500 text-white"
                                : "border-stone-300 bg-white text-stone-500"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="text-sm text-stone-700">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom answer */}
                  <div className="border-t border-stone-100 pt-4">
                    <div className="mb-2 flex items-center gap-1 text-xs text-stone-400">
                      <Pencil size={12} /> Or type your own
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={customAnswer}
                        onChange={(e) => setCustomAnswer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && customAnswer.trim())
                            answerAndAdvance(customAnswer.trim());
                        }}
                        placeholder="Custom answer..."
                        className="flex-1 rounded-2xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                      />
                      <button
                        onClick={() =>
                          customAnswer.trim() &&
                          answerAndAdvance(customAnswer.trim())
                        }
                        disabled={!customAnswer.trim()}
                        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border-0 bg-primary-400 text-white transition-opacity enabled:hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>

                  {qIndex > 0 && (
                    <button
                      onClick={handleBack}
                      className="mt-4 flex cursor-pointer items-center gap-1 border-0 bg-transparent text-sm font-semibold text-stone-400 hover:text-stone-600"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* Final free-text step */}
                  <h3 className="mb-1 text-lg font-bold text-stone-800">
                    Any other important details?
                  </h3>
                  <p className="mb-4 text-sm text-stone-400">
                    Add special requirements or details for the final script.{" "}
                    <em>This is optional.</em>
                  </p>

                  <textarea
                    value={extraDetails}
                    onChange={(e) => setExtraDetails(e.target.value)}
                    rows={4}
                    placeholder="E.g., 'Focus on humor', 'Include a plot twist at the end', 'Keep the tone professional'..."
                    className="mb-6 w-full resize-y rounded-2xl border border-stone-200 p-4 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                  />

                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleBack}
                      className="flex cursor-pointer items-center gap-1 border-0 bg-transparent font-semibold text-stone-400 hover:text-stone-600"
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button
                      onClick={handleGenerateScript}
                      className="flex cursor-pointer items-center gap-2 rounded-full border-0 bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-3 font-bold text-white shadow-lg shadow-primary-500/30 hover:opacity-90"
                    >
                      <Sparkles size={18} /> Generate Script{" "}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Fade>
    </Modal>
  );
};

export default RefineModal;
