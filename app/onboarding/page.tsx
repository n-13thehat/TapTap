'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';

type Persona = {
  name: string;
  role: string;
  emoji: string;
  color: string;
  intro: string;
};

const PERSONAS: Persona[] = [
  { name: 'Muse', role: 'Creator Whisperer', emoji: '💜', color: 'from-purple-500 to-fuchsia-500', intro: "Let's get to know you. A few quick questions — answer however feels right." },
  { name: 'Fable', role: 'Story Weaver', emoji: '📖', color: 'from-amber-500 to-orange-500', intro: 'Here is a draft of your bio. Make it yours, or keep mine.' },
  { name: 'Harmony', role: 'Playlist Architect', emoji: '🎶', color: 'from-pink-500 to-rose-500', intro: "I've stocked your library with a starter set. Press play whenever you're ready." },
  { name: 'Hope', role: 'Listener Companion', emoji: '💙', color: 'from-blue-500 to-cyan-500', intro: "Welcome to TapTap. I'll be your guide as you explore." },
  { name: 'Merit', role: 'Reward Judge', emoji: '⚖️', color: 'from-slate-400 to-slate-600', intro: 'How do you want to show up here? You can change this any time.' },
  { name: 'Treasure', role: 'Economy Keeper', emoji: '💎', color: 'from-emerald-500 to-green-500', intro: "Your Tier-0 TapPass is live. Here's what you unlock as a beta pioneer." },
];

const MUSE_QUESTIONS = [
  'In one line, who are you on TapTap?',
  'What kind of music are you here for?',
  'Name a song or artist that shaped you.',
  'Are you here mostly to listen, create, or both?',
  'What feeling do you want your profile to give off?',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>(Array(MUSE_QUESTIONS.length).fill(''));
  const [bio, setBio] = useState<string>('');
  const [bioGenerated, setBioGenerated] = useState(false);
  const [role, setRole] = useState<'LISTENER' | 'CREATOR'>('LISTENER');

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login?callbackUrl=/onboarding');
  }, [status, router]);

  const persona = PERSONAS[step - 1];

  async function postStep(stepNum: number, payload: Record<string, any>) {
    const res = await fetch('/api/onboarding/step', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ step: stepNum, payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Step ${stepNum} failed`);
    return data;
  }

  async function handleNext() {
    setError(null);
    setBusy(true);
    try {
      if (step === 1) {
        const payload: Record<string, string> = {};
        MUSE_QUESTIONS.forEach((q, i) => { payload[`q${i + 1}`] = answers[i] || ''; });
        await postStep(1, payload);
        // Pre-generate the Fable draft so the next screen has it ready.
        try {
          const data = await postStep(2, {});
          if (data?.bio) { setBio(data.bio); setBioGenerated(true); }
        } catch (_err) { /* user can edit/save on the Fable screen anyway */ }
        setStep(2);
      } else if (step === 2) {
        await postStep(2, { bio, displayName: (session as any)?.user?.username });
        setStep(3);
      } else if (step === 3 || step === 4) {
        await postStep(step, {});
        setStep(step + 1);
      } else if (step === 5) {
        await postStep(5, { role });
        setStep(6);
      } else if (step === 6) {
        await postStep(6, {});
        const res = await fetch('/api/onboarding/complete', { method: 'POST' });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.error || 'Failed to finalize onboarding');
        }
        await update({ onboardingComplete: true, role });
        router.replace('/dashboard');
        return;
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  if (status === 'loading') {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white/60">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/40">
          <span>Step {step} of 6</span>
          <span>{persona.role}</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur p-8">
          <div className={`mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${persona.color} px-3 py-1 text-sm font-semibold text-white`}>
            <span>{persona.emoji}</span>
            <span>{persona.name}</span>
          </div>
          <p className="text-white/80 mb-6">{persona.intro}</p>

          <StepBody
            step={step}
            answers={answers}
            setAnswers={setAnswers}
            bio={bio}
            setBio={setBio}
            bioGenerated={bioGenerated}
            role={role}
            setRole={setRole}
          />

          {error && (
            <div className="mt-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 1 || busy}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex gap-1">
              {PERSONAS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i + 1 === step ? 'w-8 bg-teal-400' : i + 1 < step ? 'w-2 bg-teal-400/60' : 'w-2 bg-white/20'}`} />
              ))}
            </div>
            <button
              onClick={handleNext}
              disabled={busy}
              className="flex items-center gap-1 rounded-lg bg-teal-500 hover:bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 6 ? <Sparkles className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {step === 6 ? 'Finish' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBody(props: {
  step: number;
  answers: string[];
  setAnswers: (a: string[]) => void;
  bio: string;
  setBio: (s: string) => void;
  bioGenerated: boolean;
  role: 'LISTENER' | 'CREATOR';
  setRole: (r: 'LISTENER' | 'CREATOR') => void;
}) {
  const { step, answers, setAnswers, bio, setBio, bioGenerated, role, setRole } = props;
  if (step === 1) {
    return (
      <div className="space-y-4">
        {MUSE_QUESTIONS.map((q, i) => (
          <div key={i}>
            <label className="block text-sm text-white/70 mb-1">{q}</label>
            <input
              type="text"
              value={answers[i]}
              onChange={(e) => { const next = [...answers]; next[i] = e.target.value; setAnswers(next); }}
              className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        ))}
      </div>
    );
  }
  if (step === 2) {
    return (
      <div>
        {!bioGenerated && (
          <p className="text-sm text-white/60 mb-2">Drafting your bio…</p>
        )}
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
          placeholder="Your bio will appear here."
          className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
    );
  }
  if (step === 3) {
    return <p className="text-white/70">A starter library is being attached to your account in the background. You can browse it from the home screen as soon as you finish here.</p>;
  }
  if (step === 4) {
    return <p className="text-white/70">When you finish onboarding, Hope will drop a welcome message into your notifications with your first three picks.</p>;
  }
  if (step === 5) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(['LISTENER', 'CREATOR'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`text-left rounded-xl border p-4 transition ${role === r ? 'border-teal-400 bg-teal-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
          >
            <div className="text-lg font-semibold text-white">{r === 'LISTENER' ? 'Listener' : 'Creator'}</div>
            <div className="mt-1 text-sm text-white/60">{r === 'LISTENER' ? 'Discover, save, and share music.' : 'Upload tracks and build a profile.'}</div>
          </button>
        ))}
      </div>
    );
  }
  // step 6
  return (
    <ul className="space-y-2 text-white/80">
      <li>• Tier-0 TapPass active</li>
      <li>• Beta Pioneer badge on your profile</li>
      <li>• Early access to new agents and features</li>
      <li>• A say in what we build next</li>
    </ul>
  );
}
