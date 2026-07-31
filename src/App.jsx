import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Github, Linkedin, Twitter, Instagram, Globe, Mail, ExternalLink,
  Plus, Pencil, Trash2, X, ArrowUpRight, Copy, Check, MapPin, Sparkles, Loader2,
  Lock, Unlock
} from "lucide-react";
import {
  loadShared, saveShared, verifyPasscode,
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

const KEYS = { profile: "profile", socials: "socials", projects: "projects", certs: "certs" };

const DEFAULT_PROFILE = {
  name: "Ojas Shinde",
  role: "Software Engineer & Creative Developer",
  tagline:
    "I build interfaces that feel considered — where engineering rigor meets a bit of visual mischief. Currently shipping products, occasionally breaking them on purpose to see how they bend.",
  about:
    "I'm a developer who likes the seam between logic and craft — the part of a build where a good decision about spacing or timing matters as much as the algorithm underneath it. I care about fast, honest software: things that load quickly, explain themselves, and don't waste anyone's time.",
  email: "shindeojas17@gmail.com",
  location: "India",
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

function Tag({ children }) {
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs"
      style={{ fontFamily: "'IBM Plex Mono', monospace", color: THEME.sand, background: "rgba(233,196,106,0.1)", border: "1px solid rgba(233,196,106,0.25)" }}
    >
      {children}
    </span>
  );
}

function PrimaryButton({ children, onClick, type = "button", className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`group inline-flex items-center gap-2 rounded-full py-2.5 pl-5 pr-2.5 text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] ${className}`}
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

/* ============================ owner access gate ============================ */

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

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectModal, setProjectModal] = useState(null);
  const [certModal, setCertModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [copied, setCopied] = useState(false);

  const [isOwner, setIsOwner] = useState(false);
  const [ownerPasscode, setOwnerPasscode] = useState(null);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, s, pr, c] = await Promise.all([
        loadShared(KEYS.profile, DEFAULT_PROFILE),
        loadShared(KEYS.socials, DEFAULT_SOCIALS),
        loadShared(KEYS.projects, []),
        loadShared(KEYS.certs, []),
      ]);
      setProfile(p); setSocials(s); setProjects(pr); setCerts(c);

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

  const navItems = [
    { id: "about", label: "About" },
    { id: "projects", label: "Projects" },
    { id: "certifications", label: "Certifications" },
    { id: "connect", label: "Connect" },
    { id: "contact", label: "Contact" },
  ];

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

      {/* ============================= HERO ============================= */}
      <section className="relative min-h-screen w-full overflow-hidden">
        {!reducedMotion && (<><div className="blob blob-a" /><div className="blob blob-b" /><div className="blob blob-c" /></>)}
        <div className="grain" />
        <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(22,38,44,0.15), rgba(22,38,44,0.35) 55%, #16262c 96%)" }} />

        <nav className="absolute left-1/2 top-0 z-20 w-full max-w-[95vw] -translate-x-1/2 px-2 pt-3 sm:w-auto">
          <div className="flex items-center justify-center gap-3 rounded-full px-4 py-2.5 sm:gap-7 sm:px-7" style={{ background: "rgba(22,38,44,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(250,243,230,0.08)" }}>
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`} onClick={scrollTo(item.id)} className="whitespace-nowrap text-[11px] transition-colors sm:text-sm"
                style={{ color: "rgba(250,243,230,0.75)", fontFamily: "'Space Grotesk', sans-serif" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = THEME.sand)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(250,243,230,0.75)")}
              >{item.label}</a>
            ))}
          </div>
        </nav>

        <div className="relative z-10 flex min-h-screen w-full flex-col justify-end px-5 pb-14 sm:px-10 sm:pb-16">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] sm:text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace", color: THEME.coral }}>{profile.role}</p>
          <NameReveal text={profile.name} />
          <div className="mt-7 grid grid-cols-12 gap-6">
            <p className="col-span-12 text-sm leading-relaxed sm:text-base md:col-span-7" style={{ color: "rgba(250,243,230,0.68)" }}>{profile.tagline}</p>
            <div className="col-span-12 flex items-end md:col-span-5 md:justify-end">
              <PrimaryButton onClick={scrollTo("projects")}>
                See the work
                <span className="flex h-8 w-8 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5" style={{ background: THEME.ink, color: THEME.sand }}>
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </PrimaryButton>
            </div>
          </div>
        </div>
      </section>

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
            <div className="flex flex-col">
              {certs.map((cert, i) => (
                <CertRow key={cert.id} cert={cert} isLast={i === certs.length - 1} isOwner={isOwner}
                  onEdit={() => setCertModal(cert)}
                  onDelete={() => setConfirmDelete({ type: "cert", id: cert.id, name: cert.title })}
                />
              ))}
            </div>
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
            <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium" style={{ background: THEME.cream, color: THEME.ink }}>
              <Mail className="h-4 w-4" /> {profile.email}
            </a>
            <button onClick={copyEmail} className="inline-flex h-11 w-11 items-center justify-center rounded-full" style={{ border: "1px solid rgba(250,243,230,0.2)", color: THEME.sand }} title="Copy email">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </section>

      {/* ============================= FOOTER ============================= */}
      <footer className="flex flex-col items-center justify-between gap-3 px-5 py-8 text-xs sm:flex-row sm:px-10" style={{ color: "rgba(250,243,230,0.4)", fontFamily: "'IBM Plex Mono', monospace" }}>
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
          {isOwner ? "Editing as owner — sign out" : "Owner sign in"}
        </button>
      </footer>

      {/* ============================= MODALS ============================= */}
      <OwnerModal open={ownerModalOpen} onClose={() => setOwnerModalOpen(false)} onUnlock={unlockOwner} />
      <SettingsModal open={settingsOpen} profile={profile} socials={socials} onClose={() => setSettingsOpen(false)} onSave={saveProfile} />
      <ProjectModal open={!!projectModal} draft={projectModal} onClose={() => setProjectModal(null)} onSave={saveProject} />
      <CertModal open={!!certModal} draft={certModal} onClose={() => setCertModal(null)} onSave={saveCert} />
      <ConfirmModal
        open={!!confirmDelete}
        name={confirmDelete?.name}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => { if (!confirmDelete) return; confirmDelete.type === "project" ? deleteProject(confirmDelete.id) : deleteCert(confirmDelete.id); }}
      />
    </div>
  );
}

/* ============================== card pieces =============================== */

function ProjectCard({ project, isOwner, onEdit, onDelete }) {
  const cardRef = useRef(null);
  const handleMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty("--px", `${x}%`);
    cardRef.current.style.setProperty("--py", `${y}%`);
  };
  return (
    <div ref={cardRef} onMouseMove={handleMove} className="project-card group relative overflow-hidden rounded-2xl p-6" style={{ background: THEME.deepPurple, border: "1px solid rgba(250,243,230,0.08)" }}>
      <div className="project-glow" />
      <div className="relative z-10">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-xl font-medium" style={{ fontFamily: "'Fraunces', serif", color: THEME.cream }}>{project.title}</h3>
          {isOwner && (
            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <GhostIconButton onClick={onEdit} title="Edit"><Pencil className="h-3.5 w-3.5" /></GhostIconButton>
              <GhostIconButton onClick={onDelete} title="Delete"><Trash2 className="h-3.5 w-3.5" /></GhostIconButton>
            </div>
          )}
        </div>
        {project.description && <p className="mb-4 text-sm leading-relaxed" style={{ color: "rgba(250,243,230,0.68)" }}>{project.description}</p>}
        {project.tags?.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">{project.tags.map((t, i) => <Tag key={i}>{t}</Tag>)}</div>
        )}
        {project.link && (
          <a href={project.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: THEME.coral }}>
            View project <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function CertRow({ cert, isLast, isOwner, onEdit, onDelete }) {
  return (
    <div className="group flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4" style={{ borderBottom: isLast ? "none" : "1px solid rgba(250,243,230,0.08)" }}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
        <span className="text-xs shrink-0" style={{ fontFamily: "'IBM Plex Mono', monospace", color: THEME.coral }}>{cert.date || "—"}</span>
        <div>
          <h3 className="text-base font-medium sm:text-lg" style={{ fontFamily: "'Fraunces', serif", color: THEME.cream }}>{cert.title}</h3>
          {cert.issuer && <p className="text-sm" style={{ color: "rgba(250,243,230,0.55)" }}>{cert.issuer}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {cert.link && (
          <a href={cert.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium sm:text-sm" style={{ color: THEME.coral }}>
            Credential <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {isOwner && (
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <GhostIconButton onClick={onEdit} title="Edit"><Pencil className="h-3.5 w-3.5" /></GhostIconButton>
            <GhostIconButton onClick={onDelete} title="Delete"><Trash2 className="h-3.5 w-3.5" /></GhostIconButton>
          </div>
        )}
      </div>
    </div>
  );
}

/* =============================== modals impl =============================== */

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
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email"><TextInput value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
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

function ProjectModal({ open, draft, onClose, onSave }) {
  const [form, setForm] = useState({ title: "", description: "", tags: "", link: "" });
  useEffect(() => {
    if (open) setForm({ id: draft?.id, title: draft?.title || "", description: draft?.description || "", tags: draft?.tags ? draft.tags.join(", ") : "", link: draft?.link || "" });
  }, [open, draft]);
  if (!open) return null;

  const submit = () => {
    if (!form.title.trim()) return;
    onSave({ id: form.id, title: form.title.trim(), description: form.description.trim(), tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean), link: form.link.trim() });
  };

  return (
    <Modal open={open} title={form.id ? "Edit project" : "Add project"} onClose={onClose}>
      <Field label="Title"><TextInput autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Realtime order tracker" /></Field>
      <Field label="Description"><TextArea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What it does, and what made it interesting to build." /></Field>
      <Field label="Tags (comma separated)"><TextInput value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="React, Node, PostgreSQL" /></Field>
      <Field label="Link (optional)"><TextInput value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://" /></Field>
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-full px-4 py-2 text-sm" style={{ color: "rgba(250,243,230,0.6)" }}>Cancel</button>
        <PrimaryButton onClick={submit}>{form.id ? "Save changes" : "Add project"}</PrimaryButton>
      </div>
    </Modal>
  );
}

function CertModal({ open, draft, onClose, onSave }) {
  const [form, setForm] = useState({ title: "", issuer: "", date: "", link: "" });
  useEffect(() => {
    if (open) setForm({ id: draft?.id, title: draft?.title || "", issuer: draft?.issuer || "", date: draft?.date || "", link: draft?.link || "" });
  }, [open, draft]);
  if (!open) return null;

  const submit = () => {
    if (!form.title.trim()) return;
    onSave({ id: form.id, title: form.title.trim(), issuer: form.issuer.trim(), date: form.date.trim(), link: form.link.trim() });
  };

  return (
    <Modal open={open} title={form.id ? "Edit certification" : "Add certification"} onClose={onClose}>
      <Field label="Title"><TextInput autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. AWS Certified Developer" /></Field>
      <Field label="Issuer"><TextInput value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} placeholder="e.g. Amazon Web Services" /></Field>
      <Field label="Date (used for ordering)"><TextInput value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="e.g. 2026 or Mar 2026" /></Field>
      <Field label="Credential link (optional)"><TextInput value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://" /></Field>
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-full px-4 py-2 text-sm" style={{ color: "rgba(250,243,230,0.6)" }}>Cancel</button>
        <PrimaryButton onClick={submit}>{form.id ? "Save changes" : "Add certification"}</PrimaryButton>
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

      .social-chip { transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease; }
      .social-chip:hover { border-color: ${THEME.coral} !important; transform: translateY(-2px); background: rgba(231,111,81,0.08); }

      .project-card { transition: border-color 0.25s ease, transform 0.25s ease; }
      .project-card:hover { transform: translateY(-3px); border-color: rgba(231,111,81,0.35) !important; }
      .project-glow {
        position: absolute; inset: 0; opacity: 0; transition: opacity 0.4s ease;
        background: radial-gradient(320px circle at var(--px,50%) var(--py,50%), rgba(231,111,81,0.16), transparent 65%);
        pointer-events: none;
      }
      .project-card:hover .project-glow { opacity: 1; }

      *:focus-visible { outline: 2px solid ${THEME.sand}; outline-offset: 2px; }

      @media (prefers-reduced-motion: reduce) { .blob { animation: none !important; } }
    `}</style>
  );
}
