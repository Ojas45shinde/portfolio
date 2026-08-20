import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Github, Linkedin, Twitter, Instagram, Globe, Mail, ExternalLink,
  Plus, Pencil, Trash2, X, ArrowUpRight, Copy, Check, MapPin, Sparkles, Loader2,
  Lock, Unlock, FileText, Download, Phone, Code2, Upload, ChevronDown, Repeat2, ArrowRight, ArrowUp
} from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import {
  loadShared, saveShared, verifyPasscode, uploadFile,
  getStoredPasscode, storePasscode, clearStoredPasscode,
} from "./lib/db";

/* =========================================================================
   THEME — Sunset Boulevard, re-tuned for a dark canvas, custom typography
   ========================================================================= */

const THEME = {
  ink: "#16262c",
  deepPurple: "#264653",
  burntOrange: "#e76f51",
  coral: "#f4a261",
  sand: "#e9c46a",
  cream: "#faf3e6",
};

const KEYS = { profile: "profile", socials: "socials", projects: "projects", certs: "certs", skills: "skills", experience: "experience" };

/** Generated once at module load — a fixed starfield so it doesn't
    reshuffle on every re-render. */
const STARS = Array.from({ length: 90 }).map((_, i) => ({
  id: i,
  top: Math.random() * 100,
  left: Math.random() * 100,
  size: 1 + Math.random() * 2.2,
  minOp: 0.15 + Math.random() * 0.2,
  maxOp: 0.6 + Math.random() * 0.4,
  duration: 2.5 + Math.random() * 3.5,
  delay: -(Math.random() * 6),
}));

const DEFAULT_PROFILE = {
  name: "Ojas Shinde",
  role: "Software Engineer & Creative Developer",
  tagline:
    "I build interfaces that feel considered — where engineering rigor meets a bit of visual mischief. Currently shipping products, occasionally breaking them on purpose to see how they bend.",
  about:
    "I'm a developer who likes the seam between logic and craft — the part of a build where a good decision about spacing or timing matters as much as the algorithm underneath it. I care about fast, honest software: things that load quickly, explain themselves, and don't waste anyone's time.",
  email: "hello@ojasshinde.dev",
  phone: "",
  location: "India",
  resumeUrl: "",
};

const SOCIAL_PLATFORMS = [
  { id: "github", label: "GitHub", icon: Github },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "twitter", label: "Twitter / X", icon: Twitter },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "website", label: "Website", icon: Globe },
];

const DEFAULT_SOCIALS = [
  { id: "s1", platform: "github", url: "https://github.com/" },
  { id: "s2", platform: "linkedin", url: "https://linkedin.com/in/" },
  { id: "s3", platform: "twitter", url: "https://x.com/" },
];

function iconFor(platform) {
  return (SOCIAL_PLATFORMS.find((p) => p.id === platform) || {}).icon || Globe;
}
function labelFor(platform) {
  return (SOCIAL_PLATFORMS.find((p) => p.id === platform) || {}).label || "Link";
}
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* --------------------------------- hooks --------------------------------- */

/** Tracks which section id is currently centered in the viewport, so the
    nav can highlight the active item as the person scrolls. */
function useActiveSection(ids, ready = true) {
  const [active, setActive] = useState(ids[0]);
  const idsKey = ids.join(",");
  useEffect(() => {
    if (!ready) return;
    const targets = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, ready]);
  return active;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler);
    };
  }, []);
  return reduced;
}

function useInView(threshold = 0.3) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ------------------------------ small pieces ----------------------------- */

function Reveal({ text, as: As = "span", className = "", style = {}, delayBase = 0 }) {
  const [ref, inView] = useInView(0.4);
  const words = text.split(" ");
  return (
    <As ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((w, i) => (
        <span
          key={i}
          className="reveal-word"
          style={{
            transitionDelay: `${delayBase + i * 70}ms`,
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(0.6em)",
          }}
        >
          {w}
          {i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </As>
  );
}

function NameReveal({ text }) {
  const wrapRef = useRef(null);
  const hovering = useRef(false);
  const reducedMotion = usePrefersReducedMotion();
  const [pos, setPos] = useState({ x: 32, y: 50 });

  useEffect(() => {
    if (reducedMotion) return;
    let raf;
    let t = 0;
    const loop = () => {
      if (!hovering.current) {
        t += 0.006;
        setPos({ x: 50 + 34 * Math.sin(t), y: 50 + 20 * Math.cos(t * 0.85) });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  const handleMove = useCallback((e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    setPos({
      x: ((point.clientX - rect.left) / rect.width) * 100,
      y: ((point.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  return (
    <div
      ref={wrapRef}
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => (hovering.current = false)}
      onMouseMove={handleMove}
      onTouchStart={() => (hovering.current = true)}
      onTouchMove={handleMove}
      onTouchEnd={() => (hovering.current = false)}
      className="relative inline-block select-none max-w-full"
    >
      <h1 className="hero-name hero-name-base">{text}</h1>
      <h1 className="hero-name hero-name-glow" style={{ "--gx": `${pos.x}%`, "--gy": `${pos.y}%` }} aria-hidden="true">
        {text}
      </h1>
    </div>
  );
}

/** A second, smaller starfield for the footer. */
const FOOTER_STARS = Array.from({ length: 40 }).map((_, i) => ({
  id: i,
  top: Math.random() * 100,
  left: Math.random() * 100,
  size: 1 + Math.random() * 2,
  minOp: 0.1 + Math.random() * 0.15,
  maxOp: 0.5 + Math.random() * 0.35,
  duration: 2.5 + Math.random() * 3.5,
  delay: -(Math.random() * 6),
}));

/** A themed, looping typewriter reveal of the name — types out, holds,
    erases, repeats. Pure JS timers (not CSS steps()) so the timing is
    exactly right for any name length. Respects reduced-motion by just
    showing the name statically. */
function TypewriterName({ text }) {
  const reducedMotion = usePrefersReducedMotion();
  const [display, setDisplay] = useState(reducedMotion ? text : "");
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(text);
      return;
    }
    let cancelled = false;
    const TYPE_MS = 110;
    const ERASE_MS = 55;
    const HOLD_MS = 1400;
    const GAP_MS = 500;

    function cycle() {
      let i = 0;
      const typeStep = () => {
        if (cancelled) return;
        i++;
        setDisplay(text.slice(0, i));
        if (i < text.length) {
          timeoutRef.current = setTimeout(typeStep, TYPE_MS);
        } else {
          timeoutRef.current = setTimeout(eraseStep, HOLD_MS);
        }
      };
      const eraseStep = () => {
        if (cancelled) return;
        i--;
        setDisplay(text.slice(0, Math.max(i, 0)));
        if (i > 0) {
          timeoutRef.current = setTimeout(eraseStep, ERASE_MS);
        } else {
          timeoutRef.current = setTimeout(cycle, GAP_MS);
        }
      };
      timeoutRef.current = setTimeout(typeStep, TYPE_MS);
    }

    cycle();
    return () => {
      cancelled = true;
      clearTimeout(timeoutRef.current);
    };
  }, [text, reducedMotion]);

  return (
    <span className="intro-typewriter">
      {display}
      <span className="intro-cursor" aria-hidden="true" />
    </span>
  );
}


function SectionEyebrow({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="h-px w-8" style={{ background: THEME.burntOrange }} />
      <span className="uppercase text-xs tracking-[0.25em]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: THEME.coral }}>
        {children}
      </span>
    </div>
  );
}

function PrimaryButton({ children, onClick, type = "button", className = "", disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex items-center gap-2 rounded-full py-2.5 pl-5 pr-2.5 text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${className}`}
      style={{ background: THEME.cream, color: THEME.ink }}
    >
      {children}
    </button>
  );
}

function GhostIconButton({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors"
      style={{ color: THEME.sand, background: "rgba(250,243,230,0.06)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(250,243,230,0.14)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(250,243,230,0.06)")}
    >
      {children}
    </button>
  );
}

function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10 sm:items-center">
      <div className="absolute inset-0" style={{ background: "rgba(10,16,19,0.7)", backdropFilter: "blur(3px)" }} onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl p-6 sm:p-8" style={{ background: THEME.deepPurple, border: "1px solid rgba(250,243,230,0.1)" }}>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-medium" style={{ fontFamily: "'Fraunces', serif", color: THEME.cream }}>{title}</h3>
          <GhostIconButton onClick={onClose} title="Close"><X className="h-4 w-4" /></GhostIconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: THEME.coral }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = { fontFamily: "'Space Grotesk', sans-serif", color: THEME.cream, background: "rgba(22,38,44,0.6)", border: "1px solid rgba(250,243,230,0.15)" };

function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 ${props.className || ""}`}
      style={{ ...inputStyle, ...(props.style || {}) }}
      onFocus={(e) => (e.currentTarget.style.borderColor = THEME.burntOrange)}
      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(250,243,230,0.15)")}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
      style={{ ...inputStyle, resize: "vertical", ...(props.style || {}) }}
      onFocus={(e) => (e.currentTarget.style.borderColor = THEME.burntOrange)}
      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(250,243,230,0.15)")}
    />
  );
}

function EmptyState({ label, onAdd, addLabel }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-14 text-center" style={{ border: "1px dashed rgba(250,243,230,0.2)" }}>
      <Sparkles className="h-5 w-5" style={{ color: THEME.coral }} />
      <p className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "rgba(250,243,230,0.6)" }}>{label}</p>
      <button onClick={onAdd} className="mt-1 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium" style={{ background: THEME.burntOrange, color: THEME.ink }}>
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
    </div>
  );
}

function Tooltip({ label, children }) {
  return (
    <div className="group/tip relative inline-flex">
      {children}
      <span
        className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2.5 py-1 text-xs opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100"
        style={{ background: THEME.ink, color: THEME.cream, border: "1px solid rgba(250,243,230,0.15)", fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {label}
      </span>
    </div>
  );
}



function OwnerModal({ open, onClose, onUnlock }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setPass(""); setError(""); setBusy(false); }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!pass) return;
    setError(""); setBusy(true);
    const ok = await onUnlock(pass);
    setBusy(false);
    if (!ok) setError("That passcode isn't right.");
  };

  return (
    <Modal open={open} title="Owner sign in" onClose={onClose}>
      <p className="mb-4 text-sm" style={{ color: "rgba(250,243,230,0.65)" }}>
        Enter your passcode to switch this device into edit mode.
      </p>
      <Field label="Passcode">
        <TextInput autoFocus type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
      </Field>
      {error && <p className="mb-3 text-sm" style={{ color: THEME.burntOrange }}>{error}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-full px-4 py-2 text-sm" style={{ color: "rgba(250,243,230,0.6)" }}>Cancel</button>
        <PrimaryButton onClick={submit}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}</PrimaryButton>
      </div>
    </Modal>
  );
}

/* =============================== main app ================================ */

export default function App() {
  const reducedMotion = usePrefersReducedMotion();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [socials, setSocials] = useState(DEFAULT_SOCIALS);
  const [projects, setProjects] = useState([]);
  const [certs, setCerts] = useState([]);
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState([]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectModal, setProjectModal] = useState(null);
  const [certModal, setCertModal] = useState(null);
  const [skillModal, setSkillModal] = useState(null);
  const [experienceModal, setExperienceModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [copied, setCopied] = useState(false);

  const [isOwner, setIsOwner] = useState(false);
  const [ownerPasscode, setOwnerPasscode] = useState(null);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, s, pr, c, sk, ex] = await Promise.all([
        loadShared(KEYS.profile, DEFAULT_PROFILE),
        loadShared(KEYS.socials, DEFAULT_SOCIALS),
        loadShared(KEYS.projects, []),
        loadShared(KEYS.certs, []),
        loadShared(KEYS.skills, []),
        loadShared(KEYS.experience, []),
      ]);
      setProfile(p); setSocials(s); setProjects(pr); setCerts(c); setSkills(sk); setExperience(ex);

      const stored = getStoredPasscode();
      if (stored) {
        const ok = await verifyPasscode(stored);
        if (ok) { setIsOwner(true); setOwnerPasscode(stored); }
        else clearStoredPasscode();
      }
      setLoading(false);
    })();
  }, []);

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { /* clipboard blocked — ignore */ }
  };

  const unlockOwner = async (passcode) => {
    const ok = await verifyPasscode(passcode);
    if (ok) {
      storePasscode(passcode);
      setOwnerPasscode(passcode);
      setIsOwner(true);
      setOwnerModalOpen(false);
    }
    return ok;
  };

  const signOutOwner = () => {
    clearStoredPasscode();
    setOwnerPasscode(null);
    setIsOwner(false);
  };

  const saveProfile = async (nextProfile, nextSocials) => {
    setProfile(nextProfile); setSocials(nextSocials);
    await Promise.all([
      saveShared(KEYS.profile, nextProfile, ownerPasscode),
      saveShared(KEYS.socials, nextSocials, ownerPasscode),
    ]);
    setSettingsOpen(false);
  };

  const saveProject = async (draft) => {
    const next = draft.id ? projects.map((p) => (p.id === draft.id ? draft : p)) : [...projects, { ...draft, id: uid() }];
    setProjects(next);
    await saveShared(KEYS.projects, next, ownerPasscode);
    setProjectModal(null);
  };
  const deleteProject = async (id) => {
    const next = projects.filter((p) => p.id !== id);
    setProjects(next);
    await saveShared(KEYS.projects, next, ownerPasscode);
    setConfirmDelete(null);
  };

  const saveCert = async (draft) => {
    const next = draft.id ? certs.map((c) => (c.id === draft.id ? draft : c)) : [...certs, { ...draft, id: uid() }];
    next.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    setCerts(next);
    await saveShared(KEYS.certs, next, ownerPasscode);
    setCertModal(null);
  };
  const deleteCert = async (id) => {
    const next = certs.filter((c) => c.id !== id);
    setCerts(next);
    await saveShared(KEYS.certs, next, ownerPasscode);
    setConfirmDelete(null);
  };

  const saveSkill = async (draft) => {
    const next = draft.id ? skills.map((s) => (s.id === draft.id ? draft : s)) : [...skills, { ...draft, id: uid() }];
    setSkills(next);
    await saveShared(KEYS.skills, next, ownerPasscode);
    setSkillModal(null);
  };
  const deleteSkill = async (id) => {
    const next = skills.filter((s) => s.id !== id);
    setSkills(next);
    await saveShared(KEYS.skills, next, ownerPasscode);
    setConfirmDelete(null);
  };

  const saveExperience = async (draft) => {
    const next = draft.id ? experience.map((x) => (x.id === draft.id ? draft : x)) : [...experience, { ...draft, id: uid() }];
    next.sort((a, b) => (b.start || "").localeCompare(a.start || ""));
    setExperience(next);
    await saveShared(KEYS.experience, next, ownerPasscode);
    setExperienceModal(null);
  };
  const deleteExperience = async (id) => {
    const next = experience.filter((x) => x.id !== id);
    setExperience(next);
    await saveShared(KEYS.experience, next, ownerPasscode);
    setConfirmDelete(null);
  };

  const navItems = [
    { id: "about", label: "About" },
    { id: "experience", label: "Experience" },
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
    { id: "certifications", label: "Certifications" },
    { id: "connect", label: "Connect" },
    { id: "contact", label: "Contact" },
  ];
  const activeSection = useActiveSection(navItems.map((n) => n.id), !loading);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ background: THEME.ink }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: THEME.coral }} />
      </div>
    );
  }

  return (
    <div style={{ background: THEME.ink, color: THEME.cream, fontFamily: "'Space Grotesk', sans-serif" }}>
      <GlobalStyle />

      {/* ============================= INTRO ============================= */}
      <section className="relative flex h-screen w-full items-center justify-center overflow-hidden" style={{ background: THEME.ink }}>
        <div className="intro-bokeh intro-bokeh-a" />
        <div className="starfield">
          {STARS.map((s) => (
            <span
              key={s.id}
              className="star"
              style={{
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                "--min-op": s.minOp,
                "--max-op": s.maxOp,
                animationDuration: `${s.duration}s`,
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(22,38,44,0) 0%, rgba(22,38,44,0.5) 75%, #16262c 100%)" }} />

        <h1 className="relative z-10 px-6 text-center" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, letterSpacing: "-0.02em", fontSize: "clamp(2.2rem, 8vw, 5.5rem)" }}>
          <TypewriterName text={profile.name} />
        </h1>

        <button
          onClick={scrollTo("hero")}
          className="absolute bottom-11 z-10 flex flex-col items-center gap-1 text-xs uppercase tracking-[0.25em] transition-opacity hover:opacity-80"
          style={{ color: THEME.cream, fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Scroll
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </button>
      </section>

      {/* ============================= HERO ============================= */}
      <section id="hero" className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "url(/hero-bg.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(22,38,44,0.55), rgba(22,38,44,0.45) 45%, #16262c 96%)" }} />

        <nav className="absolute left-1/2 top-0 z-20 w-full max-w-[95vw] -translate-x-1/2 px-2 pt-3 sm:w-auto">
          <div className="flex items-center justify-center rounded-full px-1.5 py-1.5" style={{ background: "rgba(22,38,44,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(250,243,230,0.08)" }}>
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={scrollTo(item.id)}
                  className={`whitespace-nowrap text-[11px] transition-all duration-300 sm:text-sm ${isActive ? "mx-0.5 rounded-full font-semibold sm:mx-1" : ""}`}
                  style={{
                    padding: "6px 10px",
                    color: isActive ? THEME.ink : "rgba(250,243,230,0.75)",
                    background: isActive ? THEME.cream : "transparent",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = THEME.sand; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "rgba(250,243,230,0.75)"; }}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </nav>

        <div className="relative z-10 flex w-full max-w-3xl flex-col items-center px-5 py-28 text-center sm:px-10">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] sm:text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace", color: THEME.coral }}>{profile.role}</p>
          <NameReveal text={profile.name} />
          {profile.resumeUrl && (
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="mt-4 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors sm:text-sm"
              style={{ border: `1px solid rgba(250,243,230,0.25)`, color: THEME.sand }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = THEME.coral; e.currentTarget.style.color = THEME.cream; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(250,243,230,0.25)"; e.currentTarget.style.color = THEME.sand; }}
            >
              <FileText className="h-3.5 w-3.5" /> View / download résumé <Download className="h-3.5 w-3.5" />
            </a>
          )}
          {!profile.resumeUrl && isOwner && (
            <button
              onClick={() => setSettingsOpen(true)}
              className="mt-4 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs"
              style={{ border: "1px dashed rgba(250,243,230,0.25)", color: "rgba(250,243,230,0.45)" }}
            >
              <FileText className="h-3.5 w-3.5" /> Add a résumé link in Edit profile
            </button>
          )}
          <p className="mt-7 text-sm leading-relaxed sm:text-base" style={{ color: "rgba(250,243,230,0.68)" }}>{profile.tagline}</p>
          <div className="mt-7">
            <PrimaryButton onClick={scrollTo("projects")}>
              See the work
              <span className="flex h-8 w-8 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5" style={{ background: THEME.ink, color: THEME.sand }}>
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </PrimaryButton>
          </div>
        </div>
      </section>

      {/* ============================= MAIN CONTENT (About → Contact) ============================= */}
      <div className="cosmic-bg">
        {/* ============================= ABOUT ============================= */}
        <section id="about" className="px-5 py-24 sm:px-10 md:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-start justify-between gap-4">
              <SectionEyebrow>About</SectionEyebrow>
              {isOwner && (
                <GhostIconButton onClick={() => setSettingsOpen(true)} title="Edit profile & socials"><Pencil className="h-3.5 w-3.5" /></GhostIconButton>
              )}
            </div>
            <div className="grid grid-cols-12 gap-8 md:gap-14">
              <div className="col-span-12 md:col-span-8">
                <Reveal as="h2" text="A little about how I work." className="mb-6 text-3xl font-medium leading-[1.15] sm:text-4xl md:text-5xl" style={{ fontFamily: "'Fraunces', serif", color: THEME.cream }} />
                <p className="text-base leading-relaxed sm:text-lg" style={{ color: "rgba(250,243,230,0.72)" }}>{profile.about}</p>
              </div>
              <div className="col-span-12 md:col-span-4">
                <div className="rounded-2xl p-6" style={{ background: THEME.deepPurple, border: "1px solid rgba(250,243,230,0.08)" }}>
                  <div className="mb-4 flex items-center gap-2 text-sm" style={{ color: "rgba(250,243,230,0.6)" }}>
                    <MapPin className="h-4 w-4" style={{ color: THEME.coral }} />
                    {profile.location}
                  </div>
                  <div className="h-px w-full" style={{ background: "rgba(250,243,230,0.1)" }} />
                  <p className="mt-4 text-xs uppercase tracking-[0.2em]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: THEME.coral }}>Currently</p>
                  <p className="mt-2 text-sm" style={{ color: "rgba(250,243,230,0.75)" }}>Open to interesting problems, collaborations, and the occasional detour.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================= EXPERIENCE ============================= */}
        <section id="experience" className="px-5 py-24 sm:px-10 md:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionEyebrow>Experience</SectionEyebrow>
                <Reveal as="h2" text="Where I've worked." className="text-3xl font-medium sm:text-4xl md:text-5xl" style={{ fontFamily: "'Fraunces', serif", color: THEME.cream }} />
              </div>
              {isOwner && (
                <button onClick={() => setExperienceModal({})} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-medium sm:text-sm" style={{ background: THEME.burntOrange, color: THEME.ink }}>
                  <Plus className="h-4 w-4" /> Add role
                </button>
              )}
            </div>

            {experience.length === 0 ? (
              isOwner ? (
                <EmptyState label="No experience added yet." addLabel="Add your first role" onAdd={() => setExperienceModal({})} />
              ) : (
                <p className="text-sm" style={{ color: "rgba(250,243,230,0.5)" }}>Experience is coming soon.</p>
              )
            ) : (
              <div className="grid grid-cols-12 gap-10 md:gap-14">
                <div className="col-span-12 md:col-span-4">
                  <ExperiencePath items={experience} />
                </div>
                <div className="col-span-12 flex flex-col md:col-span-8">
                  {experience.map((exp, i) => (
                    <ExperienceRow key={exp.id} exp={exp} isLast={i === experience.length - 1} isOwner={isOwner}
                      onEdit={() => setExperienceModal(exp)}
                      onDelete={() => setConfirmDelete({ type: "experience", id: exp.id, name: exp.role })}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============================= SKILLS ============================= */}
        <section id="skills" className="px-5 py-24 sm:px-10 md:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionEyebrow>Skills</SectionEyebrow>
                <Reveal as="h2" text="Tools & technologies." className="text-3xl font-medium sm:text-4xl md:text-5xl" style={{ fontFamily: "'Fraunces', serif", color: THEME.cream }} />
              </div>
              {isOwner && (
                <button onClick={() => setSkillModal({})} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-medium sm:text-sm" style={{ background: THEME.burntOrange, color: THEME.ink }}>
                  <Plus className="h-4 w-4" /> Add skill
                </button>
              )}
            </div>

            {skills.length === 0 ? (
              isOwner ? (
                <EmptyState label="No tools added yet — this is your stack, at a glance." addLabel="Add your first skill" onAdd={() => setSkillModal({})} />
              ) : (
                <p className="text-sm" style={{ color: "rgba(250,243,230,0.5)" }}>Skills are coming soon.</p>
              )
            ) : (
              <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
                {skills.map((skill) => (
                  <SkillTile key={skill.id} skill={skill} isOwner={isOwner}
                    onEdit={() => setSkillModal(skill)}
                    onDelete={() => setConfirmDelete({ type: "skill", id: skill.id, name: skill.name })}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ============================= PROJECTS ============================= */}
        <section id="projects" className="px-5 py-24 sm:px-10 md:py-32" style={{ background: "rgba(250,243,230,0.02)" }}>
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionEyebrow>Projects</SectionEyebrow>
                <Reveal as="h2" text="Things I've built." className="text-3xl font-medium sm:text-4xl md:text-5xl" style={{ fontFamily: "'Fraunces', serif", color: THEME.cream }} />
              </div>
              {isOwner && (
                <button onClick={() => setProjectModal({})} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-medium sm:text-sm" style={{ background: THEME.burntOrange, color: THEME.ink }}>
                  <Plus className="h-4 w-4" /> Add project
                </button>
              )}
            </div>

            {projects.length === 0 ? (
              isOwner ? (
                <EmptyState label="No projects yet — this is where your work will live." addLabel="Add your first project" onAdd={() => setProjectModal({})} />
              ) : (
                <p className="text-sm" style={{ color: "rgba(250,243,230,0.5)" }}>Projects are coming soon.</p>
              )
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {projects.map((proj) => (
                  <ProjectCard key={proj.id} project={proj} isOwner={isOwner}
                    onEdit={() => setProjectModal(proj)}
                    onDelete={() => setConfirmDelete({ type: "project", id: proj.id, name: proj.title })}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ============================= CERTIFICATIONS ============================= */}
        <section id="certifications" className="px-5 py-24 sm:px-10 md:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionEyebrow>Certifications</SectionEyebrow>
                <Reveal as="h2" text="Credentials, in order." className="text-3xl font-medium sm:text-4xl md:text-5xl" style={{ fontFamily: "'Fraunces', serif", color: THEME.cream }} />
              </div>
              {isOwner && (
                <button onClick={() => setCertModal({})} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-medium sm:text-sm" style={{ background: THEME.burntOrange, color: THEME.ink }}>
                  <Plus className="h-4 w-4" /> Add certification
                </button>
              )}
            </div>

            {certs.length === 0 ? (
              isOwner ? (
                <EmptyState label="No certifications added yet." addLabel="Add your first certification" onAdd={() => setCertModal({})} />
              ) : (
                <p className="text-sm" style={{ color: "rgba(250,243,230,0.5)" }}>Certifications are coming soon.</p>
              )
            ) : (
              <CertStack
                certs={certs}
                isOwner={isOwner}
                onEdit={(cert) => setCertModal(cert)}
                onDelete={(cert) => setConfirmDelete({ type: "cert", id: cert.id, name: cert.title })}
              />
            )}
          </div>
        </section>

        {/* ============================= CONNECT ============================= */}
        <section id="connect" className="px-5 py-24 sm:px-10 md:py-32" style={{ background: "rgba(250,243,230,0.02)" }}>
          <div className="mx-auto max-w-5xl">
            <SectionEyebrow>Connect</SectionEyebrow>
            <Reveal as="h2" text="Find me elsewhere." className="mb-10 text-3xl font-medium sm:text-4xl md:text-5xl" style={{ fontFamily: "'Fraunces', serif", color: THEME.cream }} />
            {socials.length === 0 ? (
              <p className="text-sm" style={{ color: "rgba(250,243,230,0.55)" }}>No social links yet.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {socials.map((s) => {
                  const Icon = iconFor(s.platform);
                  return (
                    <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="social-chip inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm" style={{ border: "1px solid rgba(250,243,230,0.15)", color: THEME.cream }}>
                      <Icon className="h-4 w-4" style={{ color: THEME.coral }} />
                      {labelFor(s.platform)}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ============================= CONTACT ============================= */}
        <section id="contact" className="px-5 py-24 sm:px-10 md:py-32">
          <div className="mx-auto max-w-5xl text-center">
            <SectionEyebrow>Contact</SectionEyebrow>
            <Reveal as="h2" text="Got something worth building?" className="mx-auto mb-6 max-w-2xl text-3xl font-medium leading-tight sm:text-4xl md:text-5xl" style={{ fontFamily: "'Fraunces', serif", color: THEME.cream }} />
            <p className="mx-auto mb-8 max-w-lg text-sm sm:text-base" style={{ color: "rgba(250,243,230,0.65)" }}>The best way to reach me is email — I read everything, and I reply to the interesting ones fastest.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
                style={{ background: THEME.cream, color: THEME.ink }}
              >
                <Mail className="h-4 w-4" /> {profile.email}
              </a>
              <button
                onClick={copyEmail}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                style={{ border: "1px solid rgba(250,243,230,0.2)", color: THEME.sand }}
                title="Copy email"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
              {profile.phone && (
                <a
                  href={`tel:${profile.phone.replace(/[^+\d]/g, "")}`}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
                  style={{ background: THEME.burntOrange, color: THEME.ink }}
                >
                  <Phone className="h-4 w-4" /> {profile.phone}
                </a>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ============================= FOOTER ============================= */}
      <footer className="relative overflow-hidden px-5 py-16 sm:px-10" style={{ background: THEME.ink }}>
        <div className="starfield">
          {FOOTER_STARS.map((s) => (
            <span
              key={s.id}
              className="star"
              style={{
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                "--min-op": s.minOp,
                "--max-op": s.maxOp,
                animationDuration: `${s.duration}s`,
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 500px 260px at 50% 0%, rgba(231,111,81,0.08), transparent 70%)" }} />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
          <button
            onClick={scrollTo("hero")}
            className="footer-launch flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:-translate-y-1"
            style={{ border: "1px solid rgba(250,243,230,0.2)", color: THEME.sand }}
            title="Back to top"
          >
            <ArrowUp className="h-4 w-4" />
          </button>

          <div>
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: "1.05rem", color: THEME.cream }}>{profile.name}</p>
            <p className="mt-1 text-xs" style={{ color: "rgba(250,243,230,0.45)" }}>Thanks for stopping by — see you out there.</p>
          </div>

          <div className="h-px w-16" style={{ background: "rgba(250,243,230,0.12)" }} />

          <div className="flex flex-col items-center gap-3 text-xs sm:w-full sm:flex-row sm:justify-between" style={{ color: "rgba(250,243,230,0.4)", fontFamily: "'IBM Plex Mono', monospace" }}>
            <span>© {new Date().getFullYear()} {profile.name}</span>
            <button
              onClick={isOwner ? signOutOwner : () => setOwnerModalOpen(true)}
              className="inline-flex items-center gap-1.5 transition-colors"
              style={{ color: "rgba(250,243,230,0.3)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = THEME.coral)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(250,243,230,0.3)")}
              title={isOwner ? "Sign out of edit mode" : "Owner sign in"}
            >
              {isOwner ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {isOwner ? "Editing as owner — sign out" : "Owner "}
            </button>
          </div>
        </div>
      </footer>

      {/* ============================= MODALS ============================= */}
      <OwnerModal open={ownerModalOpen} onClose={() => setOwnerModalOpen(false)} onUnlock={unlockOwner} />
      <SettingsModal open={settingsOpen} profile={profile} socials={socials} onClose={() => setSettingsOpen(false)} onSave={saveProfile} />
      <ProjectModal open={!!projectModal} draft={projectModal} onClose={() => setProjectModal(null)} onSave={saveProject} ownerPasscode={ownerPasscode} />
      <CertModal open={!!certModal} draft={certModal} onClose={() => setCertModal(null)} onSave={saveCert} ownerPasscode={ownerPasscode} />
      <SkillModal open={!!skillModal} draft={skillModal} onClose={() => setSkillModal(null)} onSave={saveSkill} />
      <ExperienceModal open={!!experienceModal} draft={experienceModal} onClose={() => setExperienceModal(null)} onSave={saveExperience} />
      <ConfirmModal
        open={!!confirmDelete}
        name={confirmDelete?.name}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          if (confirmDelete.type === "project") deleteProject(confirmDelete.id);
          else if (confirmDelete.type === "cert") deleteCert(confirmDelete.id);
          else if (confirmDelete.type === "skill") deleteSkill(confirmDelete.id);
          else if (confirmDelete.type === "experience") deleteExperience(confirmDelete.id);
        }}
      />
    </div>
  );
}

/* ============================== card pieces =============================== */

function ProjectCard({ project, isOwner, onEdit, onDelete }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const subtitle = project.tags?.length ? project.tags.slice(0, 2).join(" · ") : "Project";

  return (
    <div
      className="group relative h-[320px] w-full [perspective:2000px]"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      {isOwner && (
        <div className="absolute left-3 top-3 z-30 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <GhostIconButton onClick={onEdit} title="Edit"><Pencil className="h-3.5 w-3.5" /></GhostIconButton>
          <GhostIconButton onClick={onDelete} title="Delete"><Trash2 className="h-3.5 w-3.5" /></GhostIconButton>
        </div>
      )}
      <div
        className="relative h-full w-full [transform-style:preserve-3d] transition-transform duration-500 motion-reduce:transition-none"
        style={{
          transitionTimingFunction: "cubic-bezier(0.77,0,0.175,1)",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 h-full w-full overflow-hidden rounded-2xl transition-shadow duration-500 [backface-visibility:hidden] group-hover:shadow-xl"
          style={{
            transform: "rotateY(0deg)",
            background: project.imageUrl
              ? `linear-gradient(180deg, rgba(22,38,44,0.25) 0%, rgba(22,38,44,0.55) 55%, rgba(22,38,44,0.94) 100%), url(${project.imageUrl})`
              : `linear-gradient(180deg, ${THEME.deepPurple}, ${THEME.ink})`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            border: "1px solid rgba(250,243,230,0.08)",
          }}
        >
          <div aria-hidden="true" className="absolute inset-0 flex items-start justify-center pt-20">
            <div className="relative flex h-[100px] w-[200px] items-center justify-center">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-[50px] w-[50px] rounded-[140px] opacity-0 [animation:cardGlow_3s_linear_infinite] motion-reduce:animate-none group-hover:[animation:cardGlow_2s_linear_infinite]"
                  style={{ animationDelay: `${i * 0.3}s`, boxShadow: `0 0 50px ${THEME.burntOrange}80` }}
                />
              ))}
            </div>
          </div>

          <div className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "rgba(22,38,44,0.6)", border: "1px solid rgba(250,243,230,0.15)" }} title="Hover to flip">
            <Repeat2 className="h-3.5 w-3.5" style={{ color: THEME.coral }} />
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5">
            <h3 className="text-lg font-medium leading-snug transition-transform duration-500 group-hover:-translate-y-1" style={{ fontFamily: "'Fraunces', serif", color: THEME.cream }}>
              {project.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm transition-transform delay-75 duration-500 group-hover:-translate-y-1" style={{ color: "rgba(250,243,230,0.62)" }}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex h-full w-full flex-col rounded-2xl p-6 transition-shadow duration-500 [backface-visibility:hidden] group-hover:shadow-xl"
          style={{ transform: "rotateY(180deg)", background: THEME.deepPurple, border: "1px solid rgba(250,243,230,0.1)" }}
        >
          <div className="flex-1 space-y-4 overflow-hidden">
            <div>
              <h3 className="text-lg font-medium leading-snug" style={{ fontFamily: "'Fraunces', serif", color: THEME.cream }}>{project.title}</h3>
              {project.description && (
                <p className="mt-1.5 line-clamp-3 text-sm" style={{ color: "rgba(250,243,230,0.65)" }}>{project.description}</p>
              )}
            </div>
            {project.tags?.length > 0 && (
              <div className="space-y-1.5">
                {project.tags.slice(0, 4).map((tag, index) => (
                  <div
                    key={tag}
                    className="flex items-center gap-2 text-sm transition-[transform,opacity] duration-300"
                    style={{
                      color: "rgba(250,243,230,0.75)",
                      transform: isFlipped ? "translateX(0)" : "translateX(-10px)",
                      opacity: isFlipped ? 1 : 0,
                      transitionDelay: `${index * 50 + 150}ms`,
                    }}
                  >
                    <ArrowRight className="h-3 w-3" style={{ color: THEME.coral }} />
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(250,243,230,0.1)" }}>
            {project.link ? (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group/start flex items-center justify-between rounded-xl p-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "rgba(250,243,230,0.06)" }}
              >
                <span className="text-sm font-medium" style={{ color: THEME.cream }}>View project</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover/start:translate-x-0.5 group-hover/start:scale-110" style={{ color: THEME.coral }} />
              </a>
            ) : (
              <p className="text-xs" style={{ color: "rgba(250,243,230,0.4)" }}>No link added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Matches a skill name against common tool/tech logos served by a public
   icon CDN (no npm dependency, so nothing to break the build if a slug
   is slightly off — it just falls back to the initials tile below). */
const SKILL_ICON_RULES = [
  { test: /html/i, slug: "html5" },
  { test: /css/i, slug: "css3" },
  { test: /javascript|(?:^|\W)js(?:$|\W)/i, slug: "javascript" },
  { test: /typescript|(?:^|\W)ts(?:$|\W)/i, slug: "typescript" },
  { test: /react/i, slug: "react" },
  { test: /next\.?js/i, slug: "nextdotjs" },
  { test: /vue/i, slug: "vuedotjs" },
  { test: /angular/i, slug: "angular" },
  { test: /node/i, slug: "nodedotjs" },
  { test: /flutter/i, slug: "flutter" },
  { test: /dart/i, slug: "dart" },
  { test: /python/i, slug: "python" },
  { test: /django/i, slug: "django" },
  { test: /flask/i, slug: "flask" },
  { test: /\.net|dotnet/i, slug: "dotnet" },
  { test: /frappe/i, slug: "frappe" },
  { test: /mongo/i, slug: "mongodb" },
  { test: /mysql/i, slug: "mysql" },
  { test: /postgres/i, slug: "postgresql" },
  { test: /redis/i, slug: "redis" },
  { test: /firebase/i, slug: "firebase" },
  { test: /supabase/i, slug: "supabase" },
  { test: /aws|amazon/i, slug: "amazonaws" },
  { test: /docker/i, slug: "docker" },
  { test: /kubernetes|k8s/i, slug: "kubernetes" },
  { test: /ubuntu/i, slug: "ubuntu" },
  { test: /linux/i, slug: "linux" },
  { test: /github/i, slug: "github" },
  { test: /\bgit\b/i, slug: "git" },
  { test: /figma/i, slug: "figma" },
  { test: /tailwind/i, slug: "tailwindcss" },
  { test: /graphql/i, slug: "graphql" },
  { test: /php/i, slug: "php" },
  { test: /\bjava\b/i, slug: "openjdk" },
  { test: /c\+\+/i, slug: "cplusplus" },
  { test: /c#/i, slug: "csharp" },
];

function resolveSkillIcons(name) {
  const matches = [];
  for (const rule of SKILL_ICON_RULES) {
    if (rule.test.test(name)) matches.push(rule.slug);
  }
  return [...new Set(matches)].slice(0, 2); // e.g. "HTML & CSS" → two icons
}

function SkillTile({ skill, isOwner, onEdit, onDelete }) {
  const slugs = resolveSkillIcons(skill.name);
  const [failed, setFailed] = useState({});
  const showFallback = slugs.length === 0 || slugs.every((s) => failed[s]);

  return (
    <div
      className="group/skill relative flex w-[124px] flex-col items-center gap-3 rounded-2xl px-3 py-5 text-center transition-transform hover:-translate-y-1"
      style={{ background: THEME.deepPurple, border: "1px solid rgba(250,243,230,0.08)" }}
    >
      {isOwner && (
        <div className="absolute -right-1.5 -top-1.5 flex gap-0.5 opacity-0 transition-opacity group-hover/skill:opacity-100">
          <button onClick={onEdit} title="Edit" className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: THEME.ink, color: THEME.sand, border: "1px solid rgba(250,243,230,0.2)" }}>
            <Pencil className="h-2.5 w-2.5" />
          </button>
          <button onClick={onDelete} title="Delete" className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: THEME.ink, color: THEME.sand, border: "1px solid rgba(250,243,230,0.2)" }}>
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
      <div className="flex h-12 items-center justify-center gap-1.5">
        {!showFallback ? (
          slugs.map(
            (slug) =>
              !failed[slug] && (
                <img
                  key={slug}
                  src={`https://cdn.simpleicons.org/${slug}`}
                  alt={skill.name}
                  className="h-9 w-9 object-contain"
                  onError={() => setFailed((f) => ({ ...f, [slug]: true }))}
                />
              )
          )
        ) : (
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-medium"
            style={{ background: "rgba(233,196,106,0.12)", color: THEME.sand, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {skill.name.trim().slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <span className="text-xs font-medium leading-snug" style={{ color: THEME.cream, fontFamily: "'Space Grotesk', sans-serif" }}>
        {skill.name}
      </span>
    </div>
  );
}


function CertStack({ certs, isOwner, onEdit, onDelete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = certs.length;
  const current = certs[Math.min(currentIndex, total - 1)];

  return (
    <div className="flex flex-col items-center">
      <ul className="cert-stack">
        {certs.map((cert, index) => (
          <CertStackCard
            key={cert.id}
            cert={cert}
            index={index}
            currentIndex={currentIndex}
            totalCerts={total}
            onNext={() => setCurrentIndex((i) => (i + 1) % total)}
          />
        ))}
      </ul>

      <p className="cert-stack-instructions">
        {total > 1 ? "Drag the top card left or right to browse" : "Your certification"}
      </p>

      {current && (isOwner || current.link) && (
        <div className="mt-3 flex items-center justify-center gap-3">
          {current.link && (
            <a href={current.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium sm:text-sm" style={{ color: THEME.coral }}>
              Credential <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {isOwner && (
            <div className="flex gap-1">
              <GhostIconButton onClick={() => onEdit(current)} title="Edit"><Pencil className="h-3.5 w-3.5" /></GhostIconButton>
              <GhostIconButton onClick={() => onDelete(current)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></GhostIconButton>
            </div>
          )}
        </div>
      )}

      {isOwner && total > 1 && (
        <div className="mt-8 w-full max-w-sm">
          <p className="mb-2 text-center text-xs uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: THEME.coral }}>
            Manage all certifications
          </p>
          <div className="flex flex-col rounded-xl" style={{ border: "1px solid rgba(250,243,230,0.08)" }}>
            {certs.map((cert, i) => (
              <div
                key={cert.id}
                className="flex items-center justify-between gap-2 px-3 py-2"
                style={{ borderBottom: i === certs.length - 1 ? "none" : "1px solid rgba(250,243,230,0.06)" }}
              >
                <button
                  onClick={() => setCurrentIndex(i)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                  style={{ color: i === currentIndex ? THEME.sand : "rgba(250,243,230,0.7)", fontFamily: "'Space Grotesk', sans-serif" }}
                  title="Bring to front"
                >
                  <span className="truncate">{cert.title}</span>
                </button>
                <div className="flex shrink-0 gap-1">
                  <GhostIconButton onClick={() => onEdit(cert)} title="Edit"><Pencil className="h-3.5 w-3.5" /></GhostIconButton>
                  <GhostIconButton onClick={() => onDelete(cert)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></GhostIconButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CertStackCard({ cert, index, currentIndex, totalCerts, onNext }) {
  const position = (index - currentIndex + totalCerts) % totalCerts;
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const isVisible = position < 3;
  if (!isVisible) return null;

  const scale = 1 - position * 0.05;
  const y = position * 10;
  const opacity = 1 - position * 0.15;

  function handleDragEnd(event, info) {
    const offsetX = info.offset.x;
    const velocityX = info.velocity.x;
    const swipe = Math.abs(offsetX) > 100 || Math.abs(velocityX) > 500;
    if (swipe) {
      const direction = offsetX > 0 ? 1 : -1;
      animate(x, direction * 1000, { type: "spring", stiffness: 400, damping: 30 });
      setTimeout(() => {
        onNext();
        x.set(0);
      }, 150);
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  }

  return (
    <motion.li
      className="cert-stack-card"
      style={{ x, rotate, scale, y, opacity, zIndex: totalCerts - position }}
      drag={position === 0 ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={position === 0 ? handleDragEnd : undefined}
      whileTap={position === 0 ? { scale: 1.02 } : undefined}
    >
      {cert.fileUrl && cert.fileType !== "pdf" ? (
        <img src={cert.fileUrl} alt="" draggable="false" />
      ) : (
        <div className="cert-stack-card-fallback">
          <FileText className="h-10 w-10" style={{ color: THEME.coral }} />
        </div>
      )}
      <div className="cert-stack-card-info">
        <span>{cert.date || "—"}</span>
        <h3>{cert.title}</h3>
        {cert.issuer && <p>{cert.issuer}</p>}
      </div>
    </motion.li>
  );
}

/* =============================== modals impl =============================== */

/** A vertical "journey" roadmap — oldest role at top, dotted line down to
    the most recent, each stop pinned with role + dates. Purely a second
    view of the same experience data; the detailed list stays untouched. */
function ExperiencePath({ items }) {
  const chronological = [...items].sort((a, b) => (a.start || "").localeCompare(b.start || ""));

  return (
    <div className="flex flex-col">
      {chronological.map((exp, i) => {
        const isLast = i === chronological.length - 1;
        const duration = [exp.start, exp.end || "Present"].filter(Boolean).join(" – ");
        return (
          <div key={exp.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                style={{
                  background: isLast ? THEME.burntOrange : THEME.sand,
                  boxShadow: isLast ? `0 0 0 5px rgba(231,111,81,0.22)` : "none",
                }}
              />
              {!isLast && <span className="w-0 flex-1" style={{ borderLeft: "2px dashed rgba(250,243,230,0.22)", minHeight: 36 }} />}
            </div>
            <div className={isLast ? "pb-1" : "pb-8"}>
              {duration && (
                <span className="text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace", color: THEME.coral }}>{duration}</span>
              )}
              <p className="mt-0.5 text-sm font-medium leading-snug" style={{ fontFamily: "'Fraunces', serif", color: THEME.cream }}>{exp.role}</p>
              {exp.company && <p className="text-xs" style={{ color: "rgba(250,243,230,0.5)" }}>{exp.company}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}


function ExperienceRow({ exp, isLast, isOwner, onEdit, onDelete }) {
  const duration = [exp.start, exp.end || "Present"].filter(Boolean).join(" – ");
  return (
    <div className="group flex flex-col gap-2 py-6" style={{ borderBottom: isLast ? "none" : "1px solid rgba(250,243,230,0.08)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium sm:text-xl" style={{ fontFamily: "'Fraunces', serif", color: THEME.cream }}>{exp.role}</h3>
          {exp.company && <p className="text-sm" style={{ color: THEME.coral }}>{exp.company}</p>}
        </div>
        <div className="flex items-center gap-2">
          {duration && (
            <span className="text-xs shrink-0" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "rgba(250,243,230,0.5)" }}>{duration}</span>
          )}
          {isOwner && (
            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <GhostIconButton onClick={onEdit} title="Edit"><Pencil className="h-3.5 w-3.5" /></GhostIconButton>
              <GhostIconButton onClick={onDelete} title="Delete"><Trash2 className="h-3.5 w-3.5" /></GhostIconButton>
            </div>
          )}
        </div>
      </div>
      {exp.description && <p className="max-w-3xl text-sm leading-relaxed" style={{ color: "rgba(250,243,230,0.65)" }}>{exp.description}</p>}
    </div>
  );
}


function SettingsModal({ open, profile, socials, onClose, onSave }) {
  const [form, setForm] = useState(profile);
  const [socialList, setSocialList] = useState(socials);

  useEffect(() => { if (open) { setForm(profile); setSocialList(socials); } }, [open, profile, socials]);
  if (!open) return null;

  const updateSocial = (id, key, value) => setSocialList((list) => list.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  const addSocial = () => setSocialList((list) => [...list, { id: uid(), platform: "website", url: "" }]);
  const removeSocial = (id) => setSocialList((list) => list.filter((s) => s.id !== id));

  return (
    <Modal open={open} title="Edit profile" onClose={onClose}>
      <Field label="Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Role / title"><TextInput value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></Field>
      <Field label="Hero tagline"><TextArea rows={3} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></Field>
      <Field label="About paragraph"><TextArea rows={4} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} /></Field>
      <Field label="Résumé link (Google Drive, Dropbox, etc. — set sharing to “anyone with the link”)">
        <TextInput value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })} placeholder="https://drive.google.com/..." />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email"><TextInput value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Phone (optional, shown with a Call button)"><TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 90000 00000" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Location"><TextInput value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
      </div>

      <div className="mt-2 mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: THEME.coral }}>Social links</span>
        <button onClick={addSocial} className="inline-flex items-center gap-1 text-xs" style={{ color: THEME.sand }}><Plus className="h-3 w-3" /> Add link</button>
      </div>
      <div className="mb-6 flex flex-col gap-2">
        {socialList.map((s) => (
          <div key={s.id} className="flex gap-2">
            <select value={s.platform} onChange={(e) => updateSocial(s.id, "platform", e.target.value)} className="rounded-lg px-2 py-2 text-xs" style={inputStyle}>
              {SOCIAL_PLATFORMS.map((p) => <option key={p.id} value={p.id} style={{ background: THEME.deepPurple }}>{p.label}</option>)}
            </select>
            <TextInput placeholder="https://" value={s.url} onChange={(e) => updateSocial(s.id, "url", e.target.value)} className="flex-1" />
            <GhostIconButton onClick={() => removeSocial(s.id)} title="Remove"><Trash2 className="h-3.5 w-3.5" /></GhostIconButton>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-full px-4 py-2 text-sm" style={{ color: "rgba(250,243,230,0.6)" }}>Cancel</button>
        <PrimaryButton onClick={() => onSave(form, socialList)}>Save changes</PrimaryButton>
      </div>
    </Modal>
  );
}

function ProjectModal({ open, draft, onClose, onSave, ownerPasscode }) {
  const [form, setForm] = useState({ title: "", description: "", tags: "", link: "", imageUrl: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        id: draft?.id,
        title: draft?.title || "",
        description: draft?.description || "",
        tags: draft?.tags ? draft.tags.join(", ") : "",
        link: draft?.link || "",
        imageUrl: draft?.imageUrl || "",
      });
      setUploadError("");
    }
  }, [open, draft]);
  if (!open) return null;

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("That image is over 8MB — try a smaller export.");
      return;
    }
    setUploadError("");
    setUploading(true);
    const result = await uploadFile(file, ownerPasscode);
    setUploading(false);
    if (!result) {
      setUploadError("Upload failed — check your passcode is still valid and try again.");
      return;
    }
    setForm((f) => ({ ...f, imageUrl: result.url }));
  };

  const submit = () => {
    if (!form.title.trim()) return;
    onSave({
      id: form.id,
      title: form.title.trim(),
      description: form.description.trim(),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      link: form.link.trim(),
      imageUrl: form.imageUrl,
    });
  };

  return (
    <Modal open={open} title={form.id ? "Edit project" : "Add project"} onClose={onClose}>
      <Field label="Title"><TextInput autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Realtime order tracker" /></Field>
      <Field label="Description"><TextArea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What it does, and what made it interesting to build." /></Field>
      <Field label="Tags (comma separated)"><TextInput value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="React, Node, PostgreSQL" /></Field>
      <Field label="Link (optional)"><TextInput value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://" /></Field>
      <Field label="Card background image (optional)">
        <div className="flex items-center gap-3">
          {form.imageUrl ? (
            <img src={form.imageUrl} alt="Card background preview" className="h-14 w-14 rounded-xl object-cover shrink-0" style={{ border: "1px solid rgba(250,243,230,0.15)" }} />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0" style={{ border: "1px dashed rgba(250,243,230,0.2)" }}>
              <Upload className="h-4 w-4" style={{ color: "rgba(250,243,230,0.3)" }} />
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium" style={{ border: "1px solid rgba(250,243,230,0.2)", color: THEME.sand }}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {form.imageUrl ? "Replace image" : "Upload image"}
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} disabled={uploading} />
          </label>
          {form.imageUrl && !uploading && (
            <button onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))} className="text-xs" style={{ color: "rgba(250,243,230,0.45)" }}>Remove</button>
          )}
        </div>
        {uploadError && <p className="mt-2 text-xs" style={{ color: THEME.burntOrange }}>{uploadError}</p>}
      </Field>
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-full px-4 py-2 text-sm" style={{ color: "rgba(250,243,230,0.6)" }}>Cancel</button>
        <PrimaryButton onClick={submit} disabled={uploading}>{form.id ? "Save changes" : "Add project"}</PrimaryButton>
      </div>
    </Modal>
  );
}

function CertModal({ open, draft, onClose, onSave, ownerPasscode }) {
  const [form, setForm] = useState({ title: "", issuer: "", date: "", link: "", fileUrl: "", fileType: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        id: draft?.id,
        title: draft?.title || "",
        issuer: draft?.issuer || "",
        date: draft?.date || "",
        link: draft?.link || "",
        fileUrl: draft?.fileUrl || "",
        fileType: draft?.fileType || "",
      });
      setUploadError("");
    }
  }, [open, draft]);

  if (!open) return null;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setUploadError("Please choose an image or a PDF.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("That file is over 8MB — try a smaller scan or export.");
      return;
    }
    setUploadError("");
    setUploading(true);
    const result = await uploadFile(file, ownerPasscode);
    setUploading(false);
    if (!result) {
      setUploadError("Upload failed — check your passcode is still valid and try again.");
      return;
    }
    setForm((f) => ({ ...f, fileUrl: result.url, fileType: result.fileType }));
  };

  const submit = () => {
    if (!form.title.trim()) return;
    onSave({
      id: form.id,
      title: form.title.trim(),
      issuer: form.issuer.trim(),
      date: form.date.trim(),
      link: form.link.trim(),
      fileUrl: form.fileUrl,
      fileType: form.fileType,
    });
  };

  return (
    <Modal open={open} title={form.id ? "Edit certification" : "Add certification"} onClose={onClose}>
      <Field label="Title">
        <TextInput autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. AWS Certified Developer" />
      </Field>
      <Field label="Issuer">
        <TextInput value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} placeholder="e.g. Amazon Web Services" />
      </Field>
      <Field label="Date (used for ordering)">
        <TextInput value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="e.g. 2026 or Mar 2026" />
      </Field>
      <Field label="Credential link (optional)">
        <TextInput value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://" />
      </Field>
      <Field label="Certificate file (image or PDF)">
        <div className="flex items-center gap-3">
          {form.fileUrl ? (
            form.fileType === "pdf" ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0" style={{ background: "rgba(22,38,44,0.6)", border: "1px solid rgba(250,243,230,0.15)" }}>
                <FileText className="h-5 w-5" style={{ color: THEME.coral }} />
              </div>
            ) : (
              <img src={form.fileUrl} alt="Certificate preview" className="h-14 w-14 rounded-xl object-cover shrink-0" style={{ border: "1px solid rgba(250,243,230,0.15)" }} />
            )
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0" style={{ border: "1px dashed rgba(250,243,230,0.2)" }}>
              <FileText className="h-4 w-4" style={{ color: "rgba(250,243,230,0.3)" }} />
            </div>
          )}
          <label
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium"
            style={{ border: "1px solid rgba(250,243,230,0.2)", color: THEME.sand }}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {form.fileUrl ? "Replace file" : "Upload file"}
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
          {form.fileUrl && !uploading && (
            <button onClick={() => setForm((f) => ({ ...f, fileUrl: "", fileType: "" }))} className="text-xs" style={{ color: "rgba(250,243,230,0.45)" }}>
              Remove
            </button>
          )}
        </div>
        {uploadError && <p className="mt-2 text-xs" style={{ color: THEME.burntOrange }}>{uploadError}</p>}
      </Field>
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-full px-4 py-2 text-sm" style={{ color: "rgba(250,243,230,0.6)" }}>Cancel</button>
        <PrimaryButton onClick={submit} disabled={uploading}>{form.id ? "Save changes" : "Add certification"}</PrimaryButton>
      </div>
    </Modal>
  );
}

function SkillModal({ open, draft, onClose, onSave }) {
  const [form, setForm] = useState({ name: "" });
  useEffect(() => {
    if (open) setForm({ id: draft?.id, name: draft?.name || "" });
  }, [open, draft]);
  if (!open) return null;

  const submit = () => {
    if (!form.name.trim()) return;
    onSave({ id: form.id, name: form.name.trim() });
  };

  return (
    <Modal open={open} title={form.id ? "Edit skill" : "Add skill"} onClose={onClose}>
      <Field label="Tool or technology">
        <TextInput autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. React, Figma, PostgreSQL" onKeyDown={(e) => e.key === "Enter" && submit()} />
      </Field>
      <p className="mb-4 text-xs" style={{ color: "rgba(250,243,230,0.45)" }}>
        We'll try to match a real logo automatically; unmatched names fall back to initials.
      </p>
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-full px-4 py-2 text-sm" style={{ color: "rgba(250,243,230,0.6)" }}>Cancel</button>
        <PrimaryButton onClick={submit}>{form.id ? "Save changes" : "Add skill"}</PrimaryButton>
      </div>
    </Modal>
  );
}

function ExperienceModal({ open, draft, onClose, onSave }) {
  const [form, setForm] = useState({ role: "", company: "", start: "", end: "", description: "" });
  useEffect(() => {
    if (open) {
      setForm({
        id: draft?.id,
        role: draft?.role || "",
        company: draft?.company || "",
        start: draft?.start || "",
        end: draft?.end || "",
        description: draft?.description || "",
      });
    }
  }, [open, draft]);
  if (!open) return null;

  const submit = () => {
    if (!form.role.trim() || !form.company.trim()) return;
    onSave({
      id: form.id,
      role: form.role.trim(),
      company: form.company.trim(),
      start: form.start.trim(),
      end: form.end.trim(),
      description: form.description.trim(),
    });
  };

  return (
    <Modal open={open} title={form.id ? "Edit role" : "Add role"} onClose={onClose}>
      <Field label="Role / title">
        <TextInput autoFocus value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Software Engineer Intern" />
      </Field>
      <Field label="Company">
        <TextInput value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. Acme Corp" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start (used for ordering)">
          <TextInput value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} placeholder="e.g. Jan 2025" />
        </Field>
        <Field label="End (blank = Present)">
          <TextInput value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} placeholder="e.g. Jun 2025" />
        </Field>
      </div>
      <Field label="Description (optional)">
        <TextArea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What you worked on, in a line or two." />
      </Field>
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-full px-4 py-2 text-sm" style={{ color: "rgba(250,243,230,0.6)" }}>Cancel</button>
        <PrimaryButton onClick={submit}>{form.id ? "Save changes" : "Add role"}</PrimaryButton>
      </div>
    </Modal>
  );
}

function ConfirmModal({ open, name, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <Modal open={open} title="Remove this entry?" onClose={onCancel}>
      <p className="mb-6 text-sm" style={{ color: "rgba(250,243,230,0.7)" }}>"{name}" will be removed for good. This can't be undone.</p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-full px-4 py-2 text-sm" style={{ color: "rgba(250,243,230,0.6)" }}>Keep it</button>
        <button onClick={onConfirm} className="rounded-full px-5 py-2 text-sm font-medium" style={{ background: THEME.burntOrange, color: THEME.ink }}>Remove</button>
      </div>
    </Modal>
  );
}

/* ================================ global css =============================== */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

      .reveal-word { display: inline-block; transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1); }

      .hero-name { margin: 0; font-family: 'Fraunces', serif; font-weight: 600; letter-spacing: -0.03em; font-size: clamp(2.6rem, 12vw, 8rem); line-height: 0.98; }
      .hero-name-base { color: ${THEME.cream}; position: relative; }
      .hero-name-glow {
        position: absolute; inset: 0; color: transparent;
        background: radial-gradient(circle at var(--gx) var(--gy), #ffe9c4 0%, ${THEME.coral} 24%, ${THEME.burntOrange} 46%, transparent 70%);
        -webkit-background-clip: text; background-clip: text; pointer-events: none;
      }

      .blob { position: absolute; border-radius: 9999px; filter: blur(90px); opacity: 0.55; pointer-events: none; }
      .blob-a { width: 42vw; height: 42vw; top: -10%; left: -8%; background: ${THEME.burntOrange}; animation: driftA 22s ease-in-out infinite; }
      .blob-b { width: 34vw; height: 34vw; top: 8%; right: -10%; background: ${THEME.sand}; animation: driftB 26s ease-in-out infinite; }
      .blob-c { width: 30vw; height: 30vw; bottom: -14%; left: 22%; background: ${THEME.coral}; animation: driftC 30s ease-in-out infinite; }
      @keyframes driftA { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(4vw, 6vh) scale(1.08); } }
      @keyframes driftB { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-5vw, 4vh) scale(0.95); } }
      @keyframes driftC { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(3vw, -5vh) scale(1.1); } }

      .grain {
        position: absolute; inset: 0; opacity: 0.05; mix-blend-mode: overlay; pointer-events: none;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
      }

      .cosmic-bg {
        background:
          radial-gradient(ellipse 900px 500px at 12% 4%, rgba(245,196,105,0.10), transparent 60%),
          radial-gradient(ellipse 700px 480px at 88% 22%, rgba(214,229,245,0.055), transparent 62%),
          radial-gradient(ellipse 850px 600px at 55% 55%, rgba(193,68,60,0.075), transparent 65%),
          radial-gradient(ellipse 900px 700px at 15% 95%, rgba(94,58,112,0.10), transparent 65%),
          radial-gradient(ellipse 750px 550px at 92% 88%, rgba(245,196,105,0.06), transparent 60%),
          ${THEME.ink};
        background-repeat: no-repeat;
      }

      .footer-launch { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; }
      .footer-launch:hover { border-color: ${THEME.coral} !important; box-shadow: 0 0 24px rgba(231,111,81,0.35); }

      .social-chip { transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease; }
      .social-chip:hover { border-color: ${THEME.coral} !important; transform: translateY(-2px); background: rgba(231,111,81,0.08); }

      @keyframes cardGlow {
        0% { transform: scale(2); opacity: 0; }
        50% { transform: translate(0px, -5px) scale(1); opacity: 1; }
        100% { transform: translate(0px, 5px) scale(0.1); opacity: 0; }
      }

      .cert-stack { position: relative; width: 320px; height: 420px; margin: 0; padding: 0; list-style: none; }
      .cert-stack-card {
        position: absolute; top: 0; left: 0; width: 320px; height: 420px; margin: 0;
        overflow: hidden; border-radius: 20px;
        background: ${THEME.deepPurple};
        border: 1px solid rgba(250,243,230,0.1);
        box-shadow: 0 20px 45px rgba(0,0,0,0.45);
        cursor: grab; user-select: none; touch-action: pan-y;
        transform-origin: center bottom; will-change: transform;
        display: flex; flex-direction: column;
      }
      .cert-stack-card:active { cursor: grabbing; }
      .cert-stack-card img {
        position: absolute; inset: 0; width: 100%; height: 100%;
        object-fit: cover; pointer-events: none; user-select: none;
      }
      .cert-stack-card-fallback {
        position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
        background: linear-gradient(160deg, ${THEME.deepPurple}, ${THEME.ink});
      }
      .cert-stack-card-info {
        position: absolute; inset-inline: 0; bottom: 0; padding: 18px 20px 20px;
        background: linear-gradient(to top, rgba(22,38,44,0.96) 0%, rgba(22,38,44,0.75) 55%, transparent 100%);
      }
      .cert-stack-card-info span {
        font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.05em; color: ${THEME.coral};
      }
      .cert-stack-card-info h3 {
        margin: 4px 0 0; font-family: 'Fraunces', serif; font-weight: 500; font-size: 1.15rem; color: ${THEME.cream};
      }
      .cert-stack-card-info p { margin: 2px 0 0; font-size: 0.85rem; color: rgba(250,243,230,0.6); }

      .cert-stack-instructions {
        margin-top: 22px; font-family: 'Space Grotesk', sans-serif; font-size: 13px; color: rgba(250,243,230,0.45); text-align: center;
      }

      @media (max-width: 480px) {
        .cert-stack, .cert-stack-card { width: 260px; height: 360px; }
      }

      *:focus-visible { outline: 2px solid ${THEME.sand}; outline-offset: 2px; }

      .intro-bokeh { position: absolute; border-radius: 9999px; filter: blur(70px); pointer-events: none; }
      .intro-bokeh-a { width: 46vw; height: 46vw; top: -12%; left: -14%; background: radial-gradient(circle, ${THEME.burntOrange} 0%, transparent 70%); opacity: 0.18; animation: driftA 30s ease-in-out infinite; }

      .starfield { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
      .star {
        position: absolute; border-radius: 9999px; background: ${THEME.cream};
        opacity: var(--min-op);
        animation-name: starTwinkle; animation-timing-function: ease-in-out; animation-iteration-count: infinite;
      }
      @keyframes starTwinkle {
        0%, 100% { opacity: var(--min-op); transform: scale(1); }
        50% { opacity: var(--max-op); transform: scale(1.6); }
      }

      .intro-typewriter {
        background: linear-gradient(90deg, ${THEME.sand}, ${THEME.cream} 45%, ${THEME.coral});
        -webkit-background-clip: text; background-clip: text; color: transparent;
      }
      .intro-cursor {
        display: inline-block; width: 0.05em; height: 0.9em; margin-left: 0.08em;
        background: ${THEME.sand}; vertical-align: -0.1em;
        animation: introCursorBlink 1s steps(1) infinite;
      }
      @keyframes introCursorBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }

      @media (prefers-reduced-motion: reduce) { .blob, .intro-bokeh, .star { animation: none !important; } }
    `}</style>
  );
}
