import type { QuizQuestion } from "./types";
import { FileText, Eye, Users, Image, Mic, Clapperboard } from "lucide-react";

export const STATIC_QUESTIONS: QuizQuestion[] = [
  {
    question:
      "What is the physical condition and personality of your main character?",
    options: [
      "A rusted iron housing with a cracked lens and a flickering orange flame",
      "A polished brass lantern with a warm, steady glow and a lonely aura",
      "A massive, ancient mechanical gear-system with a rotating crystal prism",
      "A weathered wooden frame holding a dim, magical blue ember",
    ],
  },
  {
    question: "What mood should the video convey?",
    options: [
      "Warm and nostalgic",
      "Dark and mysterious",
      "Playful and comedic",
      "Epic and dramatic",
    ],
  },
  {
    question: "Where does the story take place?",
    options: [
      "A remote coastal cliff at dusk",
      "A bustling futuristic city",
      "A quiet countryside village",
      "A surreal dreamlike landscape",
    ],
  },
  {
    question: "What time of day dominates the visuals?",
    options: [
      "Golden hour sunset",
      "Deep night with moonlight",
      "Bright midday sun",
      "Misty early morning",
    ],
  },
  {
    question: "How should the camera move?",
    options: [
      "Slow cinematic pans",
      "Fast dynamic tracking shots",
      "Static locked-off frames",
      "Handheld documentary feel",
    ],
  },
  {
    question: "What pacing fits your story?",
    options: [
      "Slow burn with quiet moments",
      "Steady and even",
      "Quick cuts, high energy",
      "Builds from calm to intense",
    ],
  },
  {
    question: "What should the color palette feel like?",
    options: [
      "Warm oranges and ambers",
      "Cool blues and teals",
      "Vibrant saturated colors",
      "Muted pastel tones",
    ],
  },
  {
    question: "How should the story end?",
    options: [
      "Happy and resolved",
      "Bittersweet and open",
      "Surprising twist",
      "Quiet fade-out",
    ],
  },
];

export const STEPS = [
  { id: 1, label: "Your Story", icon: FileText },
  { id: 2, label: "Review", icon: Eye },
  { id: 3, label: "Characters", icon: Users },
  { id: 4, label: "Images", icon: Image },
  { id: 5, label: "Voice & Music", icon: Mic },
  { id: 6, label: "Videos", icon: Clapperboard },
] as const;

export const STYLES_LIST = [
  { name: "3D Pixar", pro: false, bg: "from-emerald-300 to-emerald-600" },
  { name: "Paper Craft", pro: true, bg: "from-amber-200 to-amber-600" },
  { name: "Animated 3D", pro: false, bg: "from-violet-400 to-indigo-600" },
  { name: "Building Blocks", pro: true, bg: "from-sky-300 to-sky-600" },
  { name: "Low Poly", pro: true, bg: "from-lime-300 to-lime-700" },
  { name: "Urban Cartoon", pro: true, bg: "from-orange-300 to-orange-600" },
  { name: "Anime", pro: false, bg: "from-pink-300 to-pink-600" },
  { name: "Watercolor", pro: true, bg: "from-blue-200 to-blue-500" },
];

export const STYLE_FILTERS = [
  { name: "All Styles", count: 24 },
  { name: "Animated", count: 10 },
  { name: "Illustration", count: 4 },
  { name: "Fine Art", count: 5 },
  { name: "Contemporary", count: 5 },
];
