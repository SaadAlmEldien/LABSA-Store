'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import type { AdminAuthConfigMode } from '@/lib/admin-auth';
import { LabsaCompactWordmark } from '@/components/brand/LabsaLogo';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  Terminal,
} from 'lucide-react';

export default function AdminLoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('Admin');

  const BackArrow = locale === 'ar' ? ArrowRight : ArrowLeft;

  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [configMode, setConfigMode] =
    useState<AdminAuthConfigMode>('setup_required');
  const [canUseStage2LocalDemoFallback, setCanUseStage2LocalDemoFallback] =
    useState(false);

  // Sign-In Form State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [demoOperatorInput, setDemoOperatorInput] = useState(
    'admin@labsa-store.local'
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  const checkExistingSession = useCallback(async () => {
    setIsLoadingSession(true);
    try {
      const res = await fetch('/api/admin/session', {
        method: 'GET',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setConfigMode(data.configMode);
        setCanUseStage2LocalDemoFallback(
          Boolean(data.canUseStage2LocalDemoFallback)
        );
        if (data.authenticated && data.session) {
          router.replace('/admin');
          return;
        }
      }
    } catch {
      // Keep on login screen if session check fails
    } finally {
      setIsLoadingSession(false);
    }
  }, [router]);

  useEffect(() => {
    checkExistingSession();
  }, [checkExistingSession]);

  async function handleCredentialSignIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);

    if (!emailInput.trim() || !passwordInput) {
      setAuthError(t('auth.errorMissingCredentials'));
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'credentials',
          email: emailInput.trim(),
          password: passwordInput,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAuthError(
          data.errorCode === 'setup_required'
            ? t('auth.errorSetupRequired')
            : t('auth.errorInvalidCredentials')
        );
        return;
      }
      setPasswordInput('');
      router.replace('/admin');
    } catch {
      setAuthError(t('auth.errorInvalidCredentials'));
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  async function handleEnterLocalDemoSession(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setIsSubmittingAuth(true);
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'local_demo',
          demoOperatorLabel: demoOperatorInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAuthError(t('auth.errorSetupRequired'));
        return;
      }
      router.replace('/admin');
    } catch {
      setAuthError(t('auth.errorSetupRequired'));
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-labsa-canvas px-4 py-6 sm:px-6 lg:px-8">
      {/* Standalone Minimal Top Bar */}
      <header className="mx-auto flex w-full max-w-md items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-labsa-cream bg-labsa-white px-3 py-2 text-xs font-bold text-labsa-charcoal transition hover:border-labsa-terracotta"
        >
          <BackArrow className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t('nav.backToStorefront')}</span>
        </Link>
        <LanguageSwitcher />
      </header>

      {/* Main Standalone Login Card */}
      <main className="mx-auto my-8 w-full max-w-md">
        <div className="rounded-3xl border border-labsa-cream bg-labsa-white p-6 shadow-craft sm:p-8">
          <div className="flex flex-col items-center text-center">
            <LabsaCompactWordmark />
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-labsa-surface px-3 py-1 text-[11px] font-extrabold tracking-wide text-labsa-charcoal uppercase">
              <Lock className="h-3 w-3 text-labsa-terracotta" aria-hidden="true" />
              <span>LABSA Admin</span>
            </span>
            <h1 className="mt-3 text-xl font-extrabold text-labsa-charcoal sm:text-2xl">
              {t('auth.signInTitle')}
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-labsa-charcoal-muted sm:text-sm">
              {t('auth.signInSubtitle')}
            </p>
          </div>

          {isLoadingSession ? (
            <div className="mt-8 flex items-center justify-center gap-2.5 rounded-2xl border border-labsa-cream bg-labsa-canvas px-4 py-6 text-xs font-bold text-labsa-charcoal">
              <Clock className="h-4 w-4 animate-spin text-labsa-terracotta" />
              <span>{t('auth.checkingSession')}</span>
            </div>
          ) : (
            <>
              {authError && (
                <div
                  role="alert"
                  className="mt-5 flex items-center gap-2 rounded-2xl border border-labsa-status-danger/40 bg-labsa-status-danger/10 p-3.5 text-xs font-extrabold text-labsa-status-danger"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Primary Email & Password Form (Always rendered clearly, or submits in configured_credentials mode) */}
              <form
                onSubmit={handleCredentialSignIn}
                noValidate
                className="mt-6 space-y-4"
              >
                <div>
                  <label
                    htmlFor="admin-login-email"
                    className="block text-xs font-bold text-labsa-charcoal"
                  >
                    {t('auth.emailLabel')}
                  </label>
                  <input
                    id="admin-login-email"
                    type="email"
                    dir="ltr"
                    autoComplete="username"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3.5 py-2.5 text-sm text-labsa-charcoal focus:border-labsa-terracotta focus:bg-labsa-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-login-password"
                    className="block text-xs font-bold text-labsa-charcoal"
                  >
                    {t('auth.passwordLabel')}
                  </label>
                  <input
                    id="admin-login-password"
                    type="password"
                    dir="ltr"
                    autoComplete="current-password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-labsa-cream bg-labsa-canvas px-3.5 py-2.5 text-sm text-labsa-charcoal focus:border-labsa-terracotta focus:bg-labsa-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-labsa-charcoal px-6 py-3 text-sm font-extrabold text-labsa-white shadow-craft transition hover:bg-labsa-terracotta disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {isSubmittingAuth
                      ? t('auth.signingIn')
                      : t('auth.signInButton')}
                  </span>
                </button>
              </form>

              {/* Environment Setup / Local Development Session Notice when ADMIN_EMAIL & ADMIN_PASSWORD are not configured */}
              {configMode !== 'configured_credentials' && (
                <div className="mt-6 space-y-4 border-t border-labsa-cream pt-5">
                  <div className="rounded-2xl border border-labsa-cream bg-labsa-surface/70 p-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-labsa-charcoal px-2.5 py-0.5 text-[10px] font-extrabold text-labsa-white">
                      <Terminal className="h-3 w-3" aria-hidden="true" />
                      <span>{t('auth.setupRequiredBadge')}</span>
                    </span>
                    <h2 className="mt-2 text-xs font-extrabold text-labsa-charcoal">
                      {t('auth.setupRequiredTitle')}
                    </h2>
                    <p className="mt-1 text-[11px] leading-relaxed text-labsa-charcoal-muted">
                      {t('auth.setupRequiredDescription')}
                    </p>
                  </div>

                  {(configMode === 'local_demo_enabled' ||
                    canUseStage2LocalDemoFallback) && (
                    <form
                      onSubmit={handleEnterLocalDemoSession}
                      className="rounded-2xl border border-labsa-olive/50 bg-labsa-canvas p-4"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-labsa-olive-dark">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t('auth.localDemoFallbackTitle')}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-labsa-charcoal-muted">
                        {t('auth.localDemoFallbackDesc')}
                      </p>

                      <div className="mt-3">
                        <label
                          htmlFor="demo-operator-id"
                          className="block text-[11px] font-bold text-labsa-charcoal"
                        >
                          {t('auth.operatorLabelInput')}
                        </label>
                        <input
                          id="demo-operator-id"
                          type="text"
                          dir="ltr"
                          value={demoOperatorInput}
                          onChange={(e) => setDemoOperatorInput(e.target.value)}
                          placeholder={t('auth.operatorLabelPlaceholder')}
                          className="mt-1 min-h-[38px] w-full rounded-xl border border-labsa-cream bg-labsa-white px-3 py-1.5 font-mono text-xs text-labsa-charcoal focus:border-labsa-olive focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingAuth}
                        className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-labsa-olive-dark px-4 py-2 text-xs font-extrabold text-labsa-white shadow-craft transition hover:bg-labsa-charcoal disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t('auth.enterLocalDemoButton')}</span>
                      </button>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Minimal Standalone Footer Note */}
      <footer className="mx-auto w-full max-w-md text-center text-[11px] text-labsa-charcoal-muted">
        © {new Date().getFullYear()} LABSA | لَبسة
      </footer>
    </div>
  );
}
