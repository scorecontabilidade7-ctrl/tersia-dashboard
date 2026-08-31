import { useState } from "react";
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export function AuthView() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Por favor, informe seu e-mail e sua senha.");
      return;
    }

    const res = await signIn(email.trim(), password);
    if (!res.success) {
      setErrorMessage(
        res.error === "Invalid login credentials"
          ? "E-mail ou senha incorretos. Verifique suas credenciais de acesso."
          : res.error || "Não foi possível efetuar o login. Tente novamente.",
      );
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-8 bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Elemento decorativo de fundo sutil */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-[450px] w-[450px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-3xl border border-border/80 bg-card p-7 shadow-2xl backdrop-blur-sm sm:p-9 transition-all">
        {/* Header com Logo Dra. Térsia */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2.5 shadow-md ring-1 ring-border/80 transition hover:scale-105">
            <img
              src="/logo-dra-tersia.jpeg"
              alt="Logo Dra. Térsia"
              className="h-full w-full rounded-xl object-contain"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Dra. Térsia
          </h1>
          <p className="mt-1 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Dashboard Financeiro Executivo
          </p>
        </div>

        {/* Formulário de Login Exclusivo */}
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              E-mail de Acesso
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="seu.email@score.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3.5 text-sm text-foreground transition placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Senha</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm text-foreground transition placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer transition p-1"
                title={showPassword ? "Ocultar senha" : "Exibir senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Feedback de Erro */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-xl bg-danger-soft p-3 text-xs text-destructive border border-destructive/20 animate-in fade-in duration-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Botão de Entrar */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full gap-2 rounded-xl py-5 text-sm font-bold shadow-md cursor-pointer transition hover:shadow-lg mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Autenticando...
              </>
            ) : (
              <>
                Entrar no Dashboard <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Rodapé Seguro */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground border-t border-border/50 pt-4">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Acesso seguro Score Tech & Contabilidade</span>
        </div>
      </div>
    </div>
  );
}
