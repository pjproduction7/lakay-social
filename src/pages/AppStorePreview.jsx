import React from "react";

const FEATURES = [
  "Chat and private messages for the Haitian community",
  "Local news, events, and community updates",
  "Music, games, and social feed in one place",
  "Profiles, friends, and memorials",
  "Multilingual experience (English, Kreyol, French)",
];

const SCREENSHOTS = [
  {
    title: "Home",
    subtitle: "Quick access to news, chat, and friends",
    theme: "from-indigo-600 via-slate-800 to-slate-900",
    accent: "bg-indigo-400",
    chip: "Home",
  },
  {
    title: "Feed",
    subtitle: "Share updates, photos, and reactions",
    theme: "from-emerald-600 via-slate-800 to-slate-900",
    accent: "bg-emerald-400",
    chip: "Feed",
  },
  {
    title: "Chat",
    subtitle: "Public chat and private messages",
    theme: "from-sky-600 via-slate-800 to-slate-900",
    accent: "bg-sky-400",
    chip: "Chat",
    onlineUsers: ["Mireille D.", "Jean-Luc P.", "Sabrina L.", "Katia R."],
  },
  {
    title: "Events",
    subtitle: "Discover local events and gatherings",
    theme: "from-amber-500 via-slate-800 to-slate-900",
    accent: "bg-amber-300",
    chip: "Events",
  },
];

function PhoneFrame({ title, subtitle, theme, accent, chip, onlineUsers = [] }) {
  return (
    <div className="w-full max-w-[220px]">
      <div className="rounded-[28px] border border-white/15 bg-black/30 p-3 shadow-2xl">
        <div className="rounded-[22px] bg-black/70 p-2">
          <div className="rounded-[18px] bg-gradient-to-b from-black/50 to-black/80 p-3">
            <div className={`rounded-[14px] bg-gradient-to-br ${theme} p-3`}>
              <div className="flex items-center justify-between">
                <div className="h-2 w-16 rounded-full bg-white/30" />
                <div className="h-2 w-10 rounded-full bg-white/20" />
              </div>
              <div className="mt-3 space-y-2">
                <div className={`inline-flex items-center gap-2 rounded-full ${accent} px-2 py-1 text-xs font-semibold text-slate-900`}>
                  {chip}
                </div>
                <div className="space-y-1">
                  <div className="h-3 w-28 rounded-full bg-white/80" />
                  <div className="h-2 w-20 rounded-full bg-white/50" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="h-12 rounded-xl bg-white/10" />
                  <div className="h-12 rounded-xl bg-white/15" />
                  <div className="h-12 rounded-xl bg-white/20" />
                  <div className="h-12 rounded-xl bg-white/10" />
                </div>
                {title === "Chat" ? (
                  <div className="mt-3 space-y-2 rounded-xl bg-black/30 p-2">
                    {onlineUsers.map((name) => (
                      <div key={name} className="flex items-center gap-2 text-[10px] text-white/80">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.65)]" />
                        <span className="truncate">{name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 h-20 rounded-xl bg-white/10" />
                )}
              </div>
            </div>
            <div className="mt-3 space-y-1 text-white/80">
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-white/60">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppStorePreview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 shadow-lg" />
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">App Store Preview</p>
                <h1 className="text-4xl font-semibold">Lakay Social</h1>
                <p className="mt-1 text-white/70">Home for the Haitian community worldwide</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Rating</p>
                <p className="mt-2 text-2xl font-semibold">4.8</p>
                <p className="text-xs text-white/60">2.1K Ratings</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Age</p>
                <p className="mt-2 text-2xl font-semibold">12+</p>
                <p className="text-xs text-white/60">Infrequent mild content</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Category</p>
                <p className="mt-2 text-2xl font-semibold">Social</p>
                <p className="text-xs text-white/60">Community and chat</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold">About</h2>
              <p className="mt-2 text-white/70">
                Lakay Social brings together friends, family, and community across Haiti and the diaspora. Share updates,
                discover local events, and stay connected with real-time chat.
              </p>
              <div className="mt-4 space-y-2 text-sm text-white/70">
                {FEATURES.map((item) => (
                  <p key={item}>- {item}</p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">What is New</h2>
                <span className="text-xs text-white/60">Version 1.0.0</span>
              </div>
              <p className="mt-2 text-white/70">
                Refined onboarding, improved community feeds, and updated events hub for faster discovery.
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/40">Updated Feb 26, 2026</p>
            </div>
          </div>

          <div className="flex-1">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Preview</h2>
                <span className="text-xs text-white/60">4 Screens</span>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {SCREENSHOTS.map((shot) => (
                  <PhoneFrame key={shot.title} {...shot} />
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold">Privacy</h2>
              <p className="mt-2 text-white/70">
                Data may be used to provide core features like profiles, messaging, and community updates.
              </p>
              <div className="mt-4 grid gap-3 text-sm text-white/70">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="font-semibold">Contact Info</p>
                  <p className="text-white/60">Email, phone number (optional)</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="font-semibold">User Content</p>
                  <p className="text-white/60">Posts, photos, and comments</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="font-semibold">Usage Data</p>
                  <p className="text-white/60">In-app interactions and diagnostics</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold">Ratings and Reviews</h2>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="font-semibold">Community Focused</p>
                  <p className="text-white/60">Love the events hub and the local news. Keeps me connected.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="font-semibold">Feels like home</p>
                  <p className="text-white/60">The chat and friends feed are smooth and easy to use.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
