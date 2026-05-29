import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Mail, Lock, User, Sparkles, Copy, Check, ArrowRight, ArrowLeft, Smartphone, Hop as Home } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (userId: string, coupleId: string, email: string) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  // Tabs: 'welcome' | 'login' | 'register' | 'use-code' | 'code-success' | 'register-success'
  const [view, setView] = useState<'welcome' | 'login' | 'register' | 'use-code' | 'code-success' | 'register-success'>('welcome');
  
  // Registration form
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regPartnerNickname, setRegPartnerNickname] = useState("Meu Amor");
  const [regColor, setRegColor] = useState("#3B82F6");
  const [regAvatar, setRegAvatar] = useState("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Code entry forms
  const [inviteCode, setInviteCode] = useState("");
  const [foundCoupleId, setFoundCoupleId] = useState("");
  const [firstPartnerName, setFirstPartnerName] = useState("");

  // spouse signup details
  const [spouseEmail, setSpouseEmail] = useState("");
  const [spousePassword, setSpousePassword] = useState("");
  const [spouseName, setSpouseName] = useState("");
  const [spouseOwnNickname, setSpouseOwnNickname] = useState("Meu Bem");
  const [spouseAvatar, setSpouseAvatar] = useState("https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150");

  // Created couple information
  const [createdInviteCode, setCreatedInviteCode] = useState("");
  const [createdCoupleId, setCreatedCoupleId] = useState("");

  // UI States
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEmotionalAnimation, setShowEmotionalAnimation] = useState(false);

  // Social Login Modals
  const [socialModalType, setSocialModalType] = useState<"google" | "apple" | null>(null);
  const [socialEmailInput, setSocialEmailInput] = useState("");
  const [socialNameInput, setSocialNameInput] = useState("");

  // Built-in lists of beautiful preloaded avatars
  const avatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150", // Feminine profile
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150", // Masculine profile
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150", // Warm pink style
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150", // Blue corporate
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150", // Casual
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150"  // Casual curly
  ];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const clearStates = () => {
    setError(null);
    setLoading(false);
  };

  // Submit First Registration (User 1)
  const handleRegisterUser1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          name: regName,
          partner_nickname: regPartnerNickname,
          color: regColor,
          avatar_url: regAvatar
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao registrar conta");
      }

      setCreatedInviteCode(data.couple.invite_code);
      setCreatedCoupleId(data.coupleId);
      setView('register-success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "E-mail ou senha inválidos");
      }

      onAuthSuccess(data.userId, data.coupleId, data.email);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check Connection Code (User 2)
  const handleCheckCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/use-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Código do casal inválido");
      }

      setFoundCoupleId(data.coupleId);
      setFirstPartnerName(data.firstPartnerName);
      setSpouseOwnNickname("Amo do(a) " + data.firstPartnerName);
      setView('code-success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Complete Spouse Registration (User 2)
  const handleCompleteSpouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/complete-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupleId: foundCoupleId,
          email: spouseEmail,
          password: spousePassword,
          name: spouseName,
          nickname: spouseOwnNickname,
          avatar_url: spouseAvatar
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao conectar parceiro");
      }

      // Play beautiful emotional transition animation!
      setShowEmotionalAnimation(true);
      setTimeout(() => {
        onAuthSuccess("Kaisa", foundCoupleId, spouseEmail);
      }, 3500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Social Login Completion
  const handleCompleteSocial = async () => {
    if (!socialEmailInput || !socialNameInput) {
      setError("Por favor, informe seu nome e email para a ativação do login social.");
      return;
    }
    setSocialModalType(null);
    // Directly prefill the fields and submit or transition the registration
    setRegEmail(socialEmailInput);
    setRegName(socialNameInput);
    setRegPassword("OAuthSecureSignOn" + Date.now()); // safe auto generated
    setView('register');
  };

  return (
    <div 
      className="min-h-screen w-full text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none"
      style={{ background: "linear-gradient(135deg, #2b0b5a 0%, #17042a 50%, #440733 100%)" }}
    >
      {/* 3D-Like Drifting Background Spheres for Active Motor/Emotional Motion */}
      <motion.div
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -70, 40, 0],
          scale: [1, 1.25, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/6 left-1/5 w-[320px] h-[320px] rounded-full bg-purple-600/10 blur-[80px] pointer-events-none"
      />
      
      <motion.div
        animate={{
          x: [0, -60, 50, 0],
          y: [0, 40, -60, 0],
          scale: [1, 0.92, 1.2, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-1/5 right-1/4 w-[380px] h-[380px] rounded-full bg-pink-500/10 blur-[90px] pointer-events-none"
      />

      {/* Floating Sparkles and Hearts Array */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(14)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              y: "105vh", 
              x: `${8 + Math.random() * 84}vw`,
              scale: 0.4 + Math.random() * 0.7
            }}
            animate={{ 
              opacity: [0, 0.65, 0.65, 0],
              y: "-5vh",
              x: [null, `${(Math.random() - 0.5) * 60}px`]
            }}
            transition={{
              duration: 9 + Math.random() * 9,
              repeat: Infinity,
              delay: Math.random() * 6,
              ease: "linear"
            }}
            className="absolute text-purple-300/25 text-[11px] filter blur-[0.5px] select-none"
          >
            {i % 4 === 0 ? "💜" : i % 4 === 1 ? "✨" : i % 4 === 2 ? "🌸" : "💖"}
          </motion.div>
        ))}
      </div>

      {/* Extreme Screen-wide emotional lock success */}
      <AnimatePresence>
        {showEmotionalAnimation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gradient-to-tr from-violet-950 via-slate-900 to-pink-950 flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: [0.5, 1.2, 1], rotate: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="relative mb-6"
            >
              <Heart className="w-32 h-32 text-pink-500 fill-pink-500 shadow-xl" />
              <motion.div 
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 -z-10 bg-pink-500 rounded-full blur-xl scale-75 opacity-30"
              />
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-3xl sm:text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-pink-400 to-indigo-300 tracking-tight"
            >
              Agora vocês compartilham o mesmo lar 💜
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-slate-300 text-sm sm:text-base max-w-md mt-3 leading-relaxed"
            >
              Abraçando rotinas, colecionando memórias e sintonizando o afeto a cada segundo. O lar oficial está preparado para vocês!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        
        {error && (
          <div className="mb-5 bg-red-950/40 border border-red-500/30 text-red-200 p-3.5 rounded-2xl text-xs flex items-center gap-2 animate-shake w-full">
            <span className="font-bold">Aviso:</span> {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* TELA 1: WELCOME SCREEN (Identical replica of Image 1!) */}
          {view === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="w-full flex flex-col items-center text-center px-2"
            >
              {/* Logo / Badge */}
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="relative w-28 h-28 bg-gradient-to-tr from-[#a855f7] to-[#ec4899] rounded-[32px] shadow-2xl flex items-center justify-center p-6 mb-6 cursor-pointer group"
              >
                <span className="text-5xl select-none filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.25)]">🏡</span>
                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-pink-100 group-hover:scale-110 transition-transform">
                  <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                </div>
              </motion.div>

              {/* Title */}
              <h1 className="text-white text-4xl sm:text-[44px] font-black tracking-tight leading-none font-display">
                NósDois
              </h1>
              <p className="text-purple-200/80 text-sm sm:text-base font-semibold mt-2.5 select-none tracking-normal">
                O lar digital do casal
              </p>

              {/* Bento Box Columns - 3 slots */}
              <div className="grid grid-cols-3 gap-3 w-full my-8">
                {[
                  { emoji: "✅", title: "Os juntos" },
                  { emoji: "📅", title: "Agenda do casal" },
                  { emoji: "💰", title: "Finanças claras" },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, type: "spring", stiffness: 100, damping: 12 }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -4,
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderColor: "rgba(255, 255, 255, 0.18)"
                    }}
                    className="bg-white/5 border border-white/10 rounded-2xl py-4.5 px-1.5 flex flex-col items-center justify-center text-center backdrop-blur-md shadow-lg transition-all cursor-pointer select-none"
                  >
                    <span className="text-2xl mb-2 filter drop-shadow">{item.emoji}</span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-white tracking-tight leading-tight block">
                      {item.title}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3.5 w-full">
                <motion.button
                  key="btn-create"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  onClick={() => { clearStates(); setView('register'); }}
                  className="w-full py-4.5 px-6 rounded-[24px] text-sm font-black transition cursor-pointer select-none bg-gradient-to-r from-[#9c40f5] to-[#f43d99] hover:from-[#a74cfc] hover:to-[#f94ca5] text-white shadow-[0_8px_32px_rgba(156,64,245,0.35)] flex items-center justify-center gap-2 border-t border-white/20 active:scale-[0.98]"
                >
                  <Sparkles className="w-4.5 h-4.5 text-white fill-white/25 animate-pulse" />
                  Criar nosso lar
                </motion.button>

                <motion.button
                  key="btn-code"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  onClick={() => { clearStates(); setView('use-code'); }}
                  className="w-full py-4.5 px-6 rounded-[24px] text-sm font-black transition cursor-pointer select-none bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white flex items-center justify-center gap-2"
                >
                  <Home className="w-4.5 h-4.5 text-white" />
                  Entrar com código do casal
                </motion.button>
              </div>

              {/* Footer text */}
              <p className="text-[11px] text-purple-200/40 text-center font-semibold mt-10 tracking-wide">
                Seus dados ficam seguros e sincronizados só entre vocês dois. 🔒
              </p>

              {/* Demo Login Button */}
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("nosdois_userId", "Leandro");
                  localStorage.setItem("nosdois_coupleId", "couple_1");
                  localStorage.setItem("nosdois_email", "leandro@nosdois.com");
                  onAuthSuccess("Leandro", "couple_1", "leandro@nosdois.com");
                }}
                className="mt-4 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 font-bold transition cursor-pointer select-none hover:scale-105 active:scale-95 duration-200"
              >
                🚀 Entrar como demonstração
              </button>

              {/* Returning User Option Link */}
              <button
                type="button"
                onClick={() => { clearStates(); setView('login'); }}
                className="mt-3 text-[11px] text-purple-200/50 hover:text-white transition font-bold underline decoration-dotted decoration-purple-400 cursor-pointer select-none hover:scale-105 active:scale-95 duration-200"
              >
                Já possui uma conta? Entrar
              </button>
            </motion.div>
          )}

          {/* TELA 2: ENTER WITH CODE (matching Image 2 perfectly!) */}
          {view === 'use-code' && (
            <motion.form
              key="use-code"
              onSubmit={handleCheckCode}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="w-full flex flex-col items-center"
            >
              {/* Top Logo / Icon: violet outlined box containing the house outline icon */}
              <motion.div 
                whileHover={{ rotate: -5, scale: 1.05 }}
                className="w-20 h-20 bg-white/[0.04] border border-white/15 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-purple-950/20"
              >
                <Home className="w-8 h-8 text-white" />
              </motion.div>

              {/* Title & Subtitle */}
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight font-display mb-1.5">
                Entrar no lar
              </h2>
              <p className="text-purple-200/60 text-xs sm:text-sm font-semibold select-none max-w-xs leading-relaxed mb-6">
                Digite o código que seu parceiro gerou
              </p>

              {/* Glassmorphic card */}
              <div className="w-full bg-white/[0.02] border border-white/[0.08] rounded-[32px] p-6 sm:p-8 backdrop-blur-md shadow-2xl relative">
                {/* Floating shine gradient indicator */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />

                {/* Input Label */}
                <span className="text-[10px] text-purple-200/50 font-black tracking-widest block uppercase text-center mb-4 leading-none">
                  CÓDIGO DE RECONHECIMENTO DO CASAL
                </span>

                {/* Input Box with custom caret and wide character letter-spacing */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="EX: AMOR42"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full bg-white/[0.02] border-2 border-purple-400/20 font-black font-mono tracking-[0.2em] text-center text-xl sm:text-2xl text-white outline-none rounded-2xl py-4.5 px-4 uppercase transition focus:border-purple-400 placeholder-white/10"
                  />
                </div>

                {/* Prompt Text */}
                <p className="text-[11px] text-purple-200/40 font-bold text-center leading-relaxed mb-6">
                  Peça o código para seu parceiro no app deles
                </p>

                {/* Verification/Proceed Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4.5 px-6 rounded-[20px] text-sm font-black transition cursor-pointer select-none bg-gradient-to-r from-[#9c40f5] to-[#f43d99] hover:from-[#a74cfc] hover:to-[#f94ca5] text-white flex items-center justify-center gap-1.5 border-t border-white/20 shadow-[0_6px_24px_rgba(156,64,245,0.3)] disabled:opacity-50"
                >
                  {loading ? "Validando..." : "Código de verificação"}
                  <ArrowRight className="w-4.5 h-4.5 text-white" />
                </motion.button>

                {/* Return Button */}
                <button
                  type="button"
                  onClick={() => setView('welcome')}
                  className="text-xs text-purple-200/60 hover:text-white font-bold transition mt-5 flex items-center justify-center gap-1.5 mx-auto hover:scale-105 active:scale-95 duration-200"
                >
                  ← Voltar
                </button>
              </div>
            </motion.form>
          )}

          {/* OTHER SCREENS (wrapped in a beautiful matching luxury modal box for consistency) */}
          {(view !== 'welcome' && view !== 'use-code') && (
            <motion.div
              key="auth-forms-card animate-fade-in"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-[32px] p-6 sm:p-8 backdrop-blur-md shadow-2xl relative"
            >
              {/* Optional header indicators */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
              
              {view === 'login' && (
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div className="text-center mb-4">
                    <Heart className="w-8 h-8 text-pink-500 fill-pink-500 mx-auto mb-2 animate-pulse" />
                    <h3 className="text-xl font-extrabold text-white">Entrar no NósDois</h3>
                    <p className="text-xs text-purple-200/50 mt-1">Acesse sua conta para sintonizar sua parceira</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-200/60 font-black uppercase tracking-widest">Seu E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-purple-200/30" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-10 py-3 text-xs text-slate-100 outline-none focus:border-purple-400 transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-200/60 font-black uppercase tracking-widest">Sua Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-purple-200/30" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Sua senha secreta de acesso"
                        className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-10 py-3 text-xs text-slate-100 outline-none focus:border-purple-400 transition"
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 px-4 mt-2 bg-gradient-to-r from-[#9c40f5] to-[#f43d99] rounded-xl text-xs font-black cursor-pointer text-white shadow-md flex items-center justify-center gap-1.5"
                  >
                    {loading ? "Autenticando..." : "Prosseguir para o Lar"}
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setView('welcome')}
                    className="text-[11px] text-purple-200/60 hover:text-white font-bold flex items-center gap-1 max-w-max mx-auto mt-2 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                  </button>
                </form>
              )}

              {view === 'register' && (
                <form onSubmit={handleRegisterUser1} className="flex flex-col gap-4 max-h-[460px] overflow-y-auto pr-1 select-text">
                  <div className="text-center mb-2">
                    <Sparkles className="w-7 h-7 text-purple-400 mx-auto mb-2 animate-bounce" />
                    <h3 className="text-lg font-bold text-white">Criar Novo Lar</h3>
                    <p className="text-[11px] text-purple-200/50 mt-1">Configure o perfil inicial do casal</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-200/60 font-black uppercase tracking-widest">Seu Primeiro Nome</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-purple-200/30" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Seu nome"
                        className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-10 py-2.5 text-xs text-slate-100 outline-none focus:border-purple-400 transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-200/60 font-black uppercase tracking-widest">Seu E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-purple-200/30" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-10 py-2.5 text-xs text-slate-100 outline-none focus:border-purple-400 transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-200/60 font-black uppercase tracking-widest">Senha de Acesso</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-purple-200/30" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-10 py-2.5 text-xs text-slate-100 outline-none focus:border-purple-400 transition select-text"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-200/60 font-black uppercase tracking-widest">Apelido carinhoso para o parceiro</label>
                    <input
                      type="text"
                      required
                      value={regPartnerNickname}
                      onChange={(e) => setRegPartnerNickname(e.target.value)}
                      placeholder="Ex: Meu Bem, Amor, Minha Vida"
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none focus:border-purple-400 transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-200/60 font-black uppercase tracking-widest">Seu Tom de Destaque</label>
                    <div className="flex gap-2">
                      {["#a855f7", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setRegColor(color)}
                          className={`w-6 h-6 rounded-full border-2 transition ${regColor === color ? 'scale-115 border-white' : 'border-transparent opacity-70 hover:opacity-100'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-200/60 font-black uppercase tracking-widest">Sua Foto de Perfil</label>
                    <div className="flex items-center gap-4 bg-slate-950/40 border border-white/10 rounded-xl p-3">
                      <div className="w-14 h-14 rounded-full border border-purple-400/30 overflow-hidden relative group flex-shrink-0 bg-slate-900 flex items-center justify-center">
                        {regAvatar ? (
                          <img src={regAvatar} alt="Foto de perfil" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-purple-200/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 relative">
                        <div className="border border-dashed border-white/10 hover:border-purple-400/50 bg-white/[0.02] p-2 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition relative min-h-[60px]">
                          <input 
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files[0]) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const base64Str = event.target?.result as string;
                                  setRegAvatar(base64Str);
                                };
                                reader.readAsDataURL(files[0]);
                              }
                            }}
                          />
                          <span className="text-sm">📸</span>
                          <span className="text-[10px] font-bold text-purple-200/50">Carregar sua foto</span>
                          <span className="text-[8px] text-purple-200/30">Arraste ou clique aqui</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 px-4 mt-2 bg-gradient-to-r from-pink-600 to-violet-600 rounded-xl text-xs font-black cursor-pointer text-white shadow-md hover:opacity-95 transition"
                  >
                    {loading ? "Criando Espaço..." : "Criar Novo Lar ✨"}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setView('welcome')}
                    className="text-[11px] text-purple-200/60 hover:text-white font-bold flex items-center gap-1 max-w-max mx-auto mt-1 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Cancelar
                  </button>
                </form>
              )}

              {view === 'register-success' && (
                <div className="flex flex-col items-center text-center gap-5">
                  <div className="bg-emerald-500/10 p-3.5 rounded-full border border-emerald-500/20 text-emerald-400 animate-bounce">
                    <Sparkles className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight">Lar Criado! 🏡</h3>
                    <p className="text-xs text-purple-200/60 mt-1 max-w-xs leading-relaxed">
                      Compartilhe este código do lar com seu amor para sincronizar:
                    </p>
                  </div>

                  <div 
                    onClick={() => handleCopyCode(createdInviteCode)}
                    className="bg-slate-950/65 border border-white/10 rounded-2xl py-3.5 px-6 flex items-center gap-4 select-all cursor-pointer relative group transition hover:border-purple-400"
                  >
                    <span className="text-2xl font-black font-mono text-purple-400 tracking-widest">{createdInviteCode}</span>
                    <button
                      type="button"
                      className="bg-white/5 group-hover:bg-white/10 p-1.5 rounded-lg border border-white/5 hover:text-white transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-purple-200/50 leading-relaxed max-w-xs">
                    Seu parceiro deve selecionar <strong className="text-pink-500">“Entrar com código do casal”</strong> e usar o código de convite acima!
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAuthSuccess("Leandro", createdCoupleId, regEmail)}
                    className="w-full py-3 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    Entrar no Painel do Casal
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              )}

              {view === 'code-success' && (
                <form onSubmit={handleCompleteSpouse} className="flex flex-col gap-3.5 max-h-[460px] overflow-y-auto pr-1 select-text">
                  <div className="text-center mb-2 flex flex-col items-center">
                    <div className="bg-pink-500/15 p-3 rounded-full border border-pink-500/20 text-pink-500 mb-2 animate-bounce">
                      <Heart className="w-6 h-6 fill-pink-500" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-purple-400">Código Autêntico!</h3>
                    <h4 className="text-xs text-white max-w-xs mt-1 leading-relaxed">
                      Conectando ao lar de <strong className="text-pink-500">{firstPartnerName}</strong>. Defina seu perfil de amor:
                    </h4>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-200/60 font-black uppercase tracking-widest">Seu Nome</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-purple-200/30" />
                      <input
                        type="text"
                        required
                        value={spouseName}
                        onChange={(e) => setSpouseName(e.target.value)}
                        placeholder="Seu nome"
                        className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-10 py-2.5 text-xs text-slate-100 outline-none focus:border-purple-400 transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-200/60 font-black uppercase tracking-widest">Apelido que usará</label>
                    <input
                      type="text"
                      required
                      value={spouseOwnNickname}
                      onChange={(e) => setSpouseOwnNickname(e.target.value)}
                      placeholder="Ex: Meu Bem, Amor"
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none focus:border-purple-400 transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-200/60 font-black uppercase tracking-widest">E-mail para Acesso</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-purple-200/30" />
                      <input
                        type="email"
                        required
                        value={spouseEmail}
                        onChange={(e) => setSpouseEmail(e.target.value)}
                        placeholder="seu@parceiro.com"
                        className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-10 py-2.5 text-xs text-slate-100 outline-none focus:border-purple-400 transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-200/60 font-black uppercase tracking-widest">Sua Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-purple-200/30" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={spousePassword}
                        onChange={(e) => setSpousePassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-10 py-2.5 text-xs text-slate-100 outline-none focus:border-purple-400 transition select-text"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-200/60 font-black uppercase tracking-widest">Sua Foto de Perfil</label>
                    <div className="flex items-center gap-4 bg-slate-950/40 border border-white/10 rounded-xl p-3">
                      <div className="w-14 h-14 rounded-full border border-purple-400/30 overflow-hidden relative group flex-shrink-0 bg-slate-900 flex items-center justify-center">
                        {spouseAvatar ? (
                          <img src={spouseAvatar} alt="Foto de perfil" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-purple-200/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 relative">
                        <div className="border border-dashed border-white/10 hover:border-purple-400/50 bg-white/[0.02] p-2 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition relative min-h-[60px]">
                          <input 
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files[0]) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const base64Str = event.target?.result as string;
                                  setSpouseAvatar(base64Str);
                                };
                                reader.readAsDataURL(files[0]);
                              }
                            }}
                          />
                          <span className="text-sm">📸</span>
                          <span className="text-[10px] font-bold text-purple-200/50">Carregar sua foto</span>
                          <span className="text-[8px] text-purple-200/30">Arraste ou clique aqui</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-600 to-violet-600 rounded-xl text-xs font-black cursor-pointer text-white shadow-md transition"
                  >
                    {loading ? "Conectando..." : "Conectar Maravilhosamente! ✨💜"}
                  </motion.button>
                </form>
              )}

            </motion.div>
          )}

        </AnimatePresence>

      </div>

      {/* Dynamic Social Login Simulation Modals */}
      <AnimatePresence>
        {socialModalType && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[24px] p-6 shadow-2xl relative"
            >
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                {socialModalType === "google" ? "Faça login com Google" : "Iniciar sessão com ID Apple"}
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Associe seu endereço de cadastro rapidamente de forma segura para ativar a cumplicidade Nosotros.
              </p>
              
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  required
                  placeholder="Seu nome completo"
                  value={socialNameInput}
                  onChange={(e) => setSocialNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-purple-400 transition"
                />
                <input
                  type="email"
                  required
                  placeholder="seu.email@dispositivo.com"
                  value={socialEmailInput}
                  onChange={(e) => setSocialEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-purple-400 transition"
                />
                
                <div className="flex gap-2 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setSocialModalType(null)}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-750 rounded-lg text-xs text-slate-300 font-semibold cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteSocial}
                    className="py-1.5 px-3.5 bg-violet-600 hover:bg-violet-750 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Confirmar Login
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


export default AuthScreen