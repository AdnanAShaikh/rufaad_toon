import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog } from "@mui/material";
import {
  Sparkles,
  Crown,
  MessageSquare,
  Headphones,
  FolderOpen,
  Wand2,
  Bell,
  ChevronDown,
  Search,
  Plus,
  User,
  Power,
  Check,
  Film,
  Monitor,
  Smartphone,
  Square,
  Palette,
  ArrowUpRight,
  MoreHorizontal,
  Clapperboard,
  X,
  Trash2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchProjects,
  createProject,
  type Project,
  deleteProject,
} from "../store/slices/projectSlice";
import { logoutUser, type AuthUser } from "../store/slices/authSlice";
import DeleteModal from "../components/modals/DeleteModal";
import { useProfile } from "../hooks/useProfile";

const ADDONS = [
  { name: "RufaadToon", icon: Sparkles, color: "text-blue-500" },
  { name: "RufaadToon PRO", icon: Crown, color: "text-primary" },
  {
    name: "RufaadToon Captions",
    icon: MessageSquare,
    color: "text-violet-500",
  },
  { name: "Voice Pack", icon: Headphones, color: "text-stone-500" },
];

const NAV_TABS = [{ name: "Projects", icon: FolderOpen, url: "/" }];

const DashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const projects = useAppSelector((s) => s.projects.items);
  const status = useAppSelector((s) => s.projects.status);
  const error = useAppSelector((s) => s.projects.error);
  const { profile } = useProfile();

  const userName = profile?.name || profile?.email || "there";

  const [activeTab, setActiveTab] = useState("Projects");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const visibleProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#fdfbf8] font-sans">
      {/* ================= TOP NAV ================= */}
      <div className="flex items-center justify-between border-b border-stone-100 bg-white px-6 py-3">
        <div className="text-2xl font-extrabold">
          <span className="text-primary">Rufaad</span>
          <span className="text-secondary-700">Studio</span>
        </div>

        <div className="hidden gap-1 rounded-full border border-stone-200 bg-stone-50 p-1 md:flex">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.name}
                onClick={() => {
                  setActiveTab(tab.name);
                  navigate(tab.url);
                }}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border-0 px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab.name
                    ? "bg-white text-stone-800 shadow-sm"
                    : "bg-transparent text-stone-500 hover:text-stone-700"
                }`}
              >
                <Icon size={16} /> {tab.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <button className="flex cursor-pointer items-center border-0 bg-transparent text-stone-400 hover:text-stone-600">
            <Bell size={20} />
          </button>
          <UserMenu userName={userName} user={profile} />
        </div>
      </div>

      {/* ================= HEADER ================= */}
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="m-0 text-3xl font-extrabold">
                <span className="text-primary">Your </span>
                <span className="text-secondary">Projects</span>
              </h1>
              <span className="flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700">
                <Sparkles size={12} /> {projects.length} projects
              </span>
            </div>
            <p className="mt-1 text-sm text-emerald-700/70">
              Create stunning AI-powered videos in minutes. Your creative studio
              awaits.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex cursor-pointer items-center gap-2.5 rounded-full border-0 bg-gradient-to-r from-primary-400 to-primary-600 py-3 pl-2 pr-6 text-base font-bold text-white shadow-lg shadow-primary-500/30 hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
              <Plus size={20} />
            </span>
            New Project
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="flex flex-wrap gap-1 rounded-full border border-stone-100 bg-white p-1.5 shadow-sm">
            {ADDONS.map((a) => {
              const Icon = a.icon;
              return (
                <span
                  key={a.name}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${a.color}`}
                >
                  <Icon size={14} /> {a.name}
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check size={10} strokeWidth={3} />
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex max-w-md items-center gap-2 rounded-full border border-stone-100 bg-white px-5 py-3 shadow-sm">
          <Search size={18} className="text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
        </div>

        {/* ================= PROJECT GRID ================= */}
        <div className="grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 lg:grid-cols-3">
          {status === "loading" && projects.length === 0 && (
            <div className="col-span-full py-16 text-center text-stone-400">
              Loading your projects…
            </div>
          )}

          {status === "failed" && (
            <div className="col-span-full py-16 text-center text-red-500">
              {error ?? "Something went wrong."}{" "}
              <button
                onClick={() => dispatch(fetchProjects())}
                className="ml-1 cursor-pointer border-0 bg-transparent font-semibold text-primary underline"
              >
                Retry
              </button>
            </div>
          )}

          {status === "succeeded" && projects.length === 0 && (
            <div className="col-span-full py-16 text-center text-stone-400">
              No projects yet. Hit{" "}
              <span className="font-semibold text-primary">New Project</span> to
              start your first one.
            </div>
          )}

          {visibleProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onOpen={() => navigate(`/generate/${p.id}`)}
            />
          ))}

          {status === "succeeded" &&
            projects.length > 0 &&
            visibleProjects.length === 0 && (
              <div className="col-span-full py-16 text-center text-stone-400">
                No projects match "{search}"
              </div>
            )}
        </div>
      </div>

      {/* ================= CREATE PROJECT MODAL ================= */}
      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

// ---------- User menu (corner dropdown + logout confirm) ----------
const UserMenu: React.FC<{ userName: string; user: AuthUser | null }> = ({
  userName,
  user,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleProfile = () => {
    setOpen(false);
    navigate("/profile");
  };

  const handleLogoutClick = () => {
    setOpen(false);
    setConfirmOpen(true);
  };

  const confirmLogout = async () => {
    await dispatch(logoutUser());
    setConfirmOpen(false);
    navigate("/login");
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2 border-0 bg-transparent"
      >
        {user?.imageUrl ? (
          <span
            className="h-8 w-8 rounded-full bg-cover bg-center"
            style={{ backgroundImage: `url(${user.imageUrl})` }}
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-500 text-sm font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </span>
        )}
        <ChevronDown size={16} className="text-stone-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-xl border border-stone-100 bg-white py-1 shadow-lg">
          <button
            onClick={handleProfile}
            className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-4 py-2.5 text-left text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <User size={16} /> Profile
          </button>
          <button
            onClick={handleLogoutClick}
            className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Power size={16} /> Logout
          </button>
        </div>
      )}

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { className: "rounded-2xl overflow-hidden" } }}
      >
        <div className="px-7 pb-7 pt-7 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <Power size={26} />
          </span>
          <h2 className="mt-4 text-xl font-bold text-stone-900">Log out?</h2>
          <p className="mt-1 text-sm text-stone-500">
            You'll need to sign in again to get back to your projects.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setConfirmOpen(false)}
              className="flex-1 cursor-pointer rounded-full border border-stone-200 bg-white py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmLogout}
              className="flex-1 cursor-pointer rounded-full border-0 bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600"
            >
              Log out
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

// ---------- Create Project Modal ----------
const CreateProjectModal: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setSubmitting(false);
    onClose();
  };

  const handleCreate = async () => {
    setSubmitting(true);
    const result = await dispatch(
      createProject({
        title: "Untitled Project",
        aspectRatio: "16:9", // placeholder — Step 1 sets the real ratio
        isRufaadGuide: true,
        frame: "orange",
      }),
    );
    setSubmitting(false);

    if (createProject.fulfilled.match(result)) {
      const newId = result.payload.id;
      handleClose();
      navigate(`/generate/${newId}`);
    }
  };

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
      <div className="relative px-8 pb-8 pt-8">
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 flex cursor-pointer items-center border-0 bg-transparent text-stone-400 hover:text-stone-600"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg shadow-primary-500/30">
            <Sparkles size={26} />
          </span>
        </div>

        <h2 className="mt-4 text-center text-2xl font-extrabold text-stone-900">
          Create New Project
        </h2>
        <p className="mt-1 text-center text-sm text-stone-500">
          Start a new AI-powered video with RufaadGuide
        </p>

        {/* Inline mode card (informational — RufaadGuide is the only mode) */}
        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-primary-200 bg-primary-50/60 p-5 ring-1 ring-primary-100">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white">
            <Wand2 size={22} />
          </span>
          <div>
            <div className="text-base font-bold text-primary-600">
              RufaadGuide
            </div>
            <div className="text-xs text-stone-500">
              A guided, step-by-step flow — from story to finished video.
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="cursor-pointer border-0 bg-transparent px-4 py-2 text-sm font-semibold text-stone-500 hover:text-stone-700"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className={`rounded-full border-0 bg-gradient-to-r from-primary-400 to-primary-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/30 transition-opacity ${
              submitting
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:opacity-90"
            }`}
          >
            {submitting ? "Creating…" : "Create Project"}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

const ProjectCard: React.FC<{ project: Project; onOpen: () => void }> = ({
  project,
  onOpen,
}) => {
  const dispatch = useAppDispatch();

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteProject(project.id)).unwrap();
      // success: card disappears as the slice removes it from the list
    } catch {
      // slice records the error; keep the modal so the user can retry/cancel
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const frameBg = "bg-gradient-to-br from-primary to-amber-400";

  const thumb = project.thumb || "linear-gradient(135deg, #99BC85, #626F47)";

  const RatioIcon =
    project.aspectRatio === "9:16"
      ? Smartphone
      : project.aspectRatio === "1:1"
        ? Square
        : Monitor;

  return (
    <div
      className={`overflow-hidden rounded-3xl ${frameBg} shadow-lg transition-transform hover:-translate-y-1`}
    >
      <button
        onClick={onOpen}
        className="relative block w-full cursor-pointer border-0 bg-transparent p-4 pb-2"
      >
        <div className="absolute inset-x-8 top-2.5 h-4 rounded-t-xl bg-white/20" />
        <div className="absolute inset-x-6 top-3.5 h-4 rounded-t-xl bg-white/30" />

        <div
          className="relative aspect-video w-full overflow-hidden rounded-xl bg-cover bg-center shadow-md"
          style={{ background: thumb, backgroundSize: "cover" }}
        >
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
            <Film size={12} /> {project.sceneCount}
          </span>
        </div>

        <span className="absolute right-2 top-2 z-10">
          <ProgressRing value={project.progress} />
        </span>
      </button>

      <div className="mx-1.5 mb-1.5 rounded-2xl bg-white px-4 pb-3.5 pt-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onOpen}
            className="cursor-pointer border-0 bg-transparent p-0 text-left text-[15px] font-bold text-stone-800 hover:text-primary"
          >
            {project.title}
          </button>
          <div className="flex gap-2.5 text-stone-300">
            <button
              onClick={onOpen}
              className="flex cursor-pointer items-center border-0 bg-transparent p-0 hover:text-stone-500"
              title="Open"
            >
              <ArrowUpRight size={16} />
            </button>

            {/* 3-dots menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex cursor-pointer items-center border-0 bg-transparent p-0 hover:text-stone-500"
                title="More"
              >
                <MoreHorizontal size={16} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-6 z-20 w-40 overflow-hidden rounded-xl border border-stone-100 bg-white py-1 shadow-xl">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpen();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-3 py-2 text-left text-sm font-medium text-stone-600 hover:bg-stone-50"
                  >
                    <ArrowUpRight size={15} /> Open
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmOpen(true);
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-500">
            <RatioIcon size={12} /> {project.aspectRatio}
          </span>
          {project.style && (
            <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
              <Palette size={12} /> {project.style?.name}
            </span>
          )}
          {project.isRufaadGuide && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 px-3 py-1 text-[11px] font-bold text-white">
              <Wand2 size={12} /> RufaadGuide
            </span>
          )}
        </div>

        <div className="my-2.5 h-px bg-stone-100" />

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-stone-400">
            <Clapperboard size={12} /> {project.sceneCount} scenes
          </span>
          <span className="text-xs text-stone-400">
            {project.progress}% done
          </span>
        </div>
      </div>

      {/* Delete confirmation */}
      <DeleteModal
        open={confirmOpen}
        title="Delete project?"
        message={`"${project.title}" and all its scenes, characters, and generated media will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete project"
        loading={deleting}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

// ---------- Progress ring ----------
const ProgressRing: React.FC<{ value: number }> = ({ value }) => {
  const r = 14;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md">
      <svg width="36" height="36" className="-rotate-90">
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="#e4ecdb"
          strokeWidth="3.5"
        />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={value >= 100 ? "#587446" : "#99BC85"}
          strokeWidth="3.5"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[8px] font-bold text-stone-600">
        {value}%
      </span>
    </span>
  );
};

export default DashboardScreen;
