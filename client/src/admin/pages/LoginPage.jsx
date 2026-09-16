import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, errorMessage, setCsrfToken } from '@/lib/api';
import { adminUrl } from '@/lib/config';
import { useEntrance } from '@/lib/motion';
import { useBrand } from '@/lib/site';
import { meQuery } from '../lib/auth.jsx';

export default function LoginPage() {
  const brand = useBrand();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const ref = useRef(null);
  const me = useQuery(meQuery);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEntrance(ref, [Boolean(challenge)]);

  const destination = location.state?.from && location.state.from.startsWith(adminUrl('')) ? location.state.from : adminUrl('');
  if (me.data?.admin) return <Navigate to={destination} replace />;

  const finish = (data) => {
    setCsrfToken(data.csrfToken);
    queryClient.setQueryData(['admin-me'], data);
    navigate(data.mustEnroll2fa ? adminUrl('account') : destination, { replace: true });
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password }, { skipAuthRedirect: true });
      if (data.twoFactorRequired) {
        setChallenge(data.challenge);
        setPassword('');
      } else {
        finish(data);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/2fa/verify', { challenge, code }, { skipAuthRedirect: true });
      finish(data);
    } catch (err) {
      setError(errorMessage(err));
      if (err.status === 401 && /expired|sign in again/i.test(errorMessage(err))) setChallenge(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh bg-muted/40 lg:grid-cols-2">
      <meta name="robots" content="noindex,nofollow" />
      <title>Sign in · PMS Admin</title>
      <div className="relative hidden overflow-hidden bg-[#1b1d2a] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="bg-grid absolute inset-0 opacity-20" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-brand/40 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-14 place-items-center overflow-hidden rounded-2xl bg-white p-1">
            <img src={brand.logoSrc} alt="Passion Maths Study" className="size-full object-contain" />
          </span>
          <span className="font-heading text-xl font-extrabold">Passion Maths Study</span>
        </div>
        <div className="relative max-w-md">
          <p className="font-heading text-4xl leading-tight font-extrabold">
            Manage every अध्याय, प्रश्नावली and solution — <span className="text-saffron">without touching code.</span>
          </p>
          <p className="mt-4 text-white/70">Classes 6–12 · Questions · Step-by-step solutions · Diagrams · Videos · SEO</p>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-white/50">
          <ShieldCheck className="size-4" /> Protected area. All sign-in attempts are logged.
        </p>
      </div>

      <div className="flex items-center justify-center p-4 sm:p-8">
        <div ref={ref} className="w-full max-w-sm">
          <div data-enter className="mb-8 flex items-center gap-3 lg:hidden">
            <img src={brand.logoSrc} alt="" className="size-12 rounded-xl bg-white object-contain p-1" />
            <span className="font-heading text-lg font-extrabold">PMS Admin</span>
          </div>

          {!challenge ? (
            <form data-enter onSubmit={submitPassword} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm" noValidate>
              <div>
                <h1 className="text-xl font-extrabold">Sign in</h1>
                <p className="text-sm text-muted-foreground">Admin dashboard access</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="h-10 w-full" disabled={busy || !email || !password}>
                {busy && <Loader2 className="animate-spin" />} Sign in
              </Button>
            </form>
          ) : (
            <form data-enter onSubmit={submitCode} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                  <KeyRound className="size-5" />
                </span>
                <div>
                  <h1 className="text-xl font-extrabold">Two-factor verification</h1>
                  <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app.</p>
                </div>
              </div>
              <Input
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="h-12 text-center font-mono text-2xl tracking-[0.5em]"
                aria-label="Verification code"
              />
              {error && (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="h-10 w-full" disabled={busy || code.length !== 6}>
                {busy && <Loader2 className="animate-spin" />} Verify
              </Button>
              <button type="button" onClick={() => setChallenge(null)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
                Use a different account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
