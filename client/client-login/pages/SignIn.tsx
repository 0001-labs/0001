import { useEffect, useRef, useState } from "react";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { isConvexConfigured } from "../lib/convex";
import { normalizeEmail } from "../../../shared/adminEmails";

type Step = "email" | "code";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUEST_TIMEOUT_MS = 15000;
const MISSING_CONVEX_MESSAGE =
  "Local Link auth is not configured. Set VITE_CONVEX_URL in .env.local and connect this repo to the correct Convex project.";

function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out. Check the local Convex setup and try again.`));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

export function SignIn() {
  const { signIn } = useAuthActions();
  const convex = useConvex();
  const token = useAuthToken();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const pendingErrorRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (token && pendingErrorRef.current) {
      pendingErrorRef.current = null;
      setError(null);
    }
  }, [token]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!isConvexConfigured) {
      setError(MISSING_CONVEX_MESSAGE);
      return;
    }

    const trimmedEmail = normalizeEmail(email);
    if (!trimmedEmail) {
      setError("Email is required");
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const canRequestOtp = await withTimeout(
        convex.query(api.portalAccess.canRequestOtp, { email: trimmedEmail }),
        "Access check",
      );
      if (!canRequestOtp) {
        setError("This email does not have Link access yet.");
        return;
      }
      await withTimeout(signIn("resend-otp", { email: trimmedEmail }), "OTP request");
      setEmail(trimmedEmail);
      setCode("");
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!isConvexConfigured) {
      setError(MISSING_CONVEX_MESSAGE);
      return;
    }

    const trimmedEmail = normalizeEmail(email);
    const normalizedCode = code.replace(/\D/g, "").slice(0, 6);
    if (!normalizedCode) {
      setError("Verification code is required");
      return;
    }

    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await withTimeout(signIn("resend-otp", { email: trimmedEmail, code: normalizedCode }), "Code verification");
    } catch (err) {
      pendingErrorRef.current =
        err instanceof Error ? err.message : "Invalid or expired code. Please try again.";
      window.setTimeout(() => {
        if (isMountedRef.current && pendingErrorRef.current) {
          setError(pendingErrorRef.current);
          pendingErrorRef.current = null;
        }
      }, 500);
    } finally {
      setBusy(false);
    }
  }

  async function handleResendCode() {
    if (!isConvexConfigured) {
      setError(MISSING_CONVEX_MESSAGE);
      return;
    }

    const trimmedEmail = normalizeEmail(email);
    if (!trimmedEmail) {
      setError("Email is required");
      return;
    }

    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const canRequestOtp = await withTimeout(
        convex.query(api.portalAccess.canRequestOtp, { email: trimmedEmail }),
        "Access check",
      );
      if (!canRequestOtp) {
        setError("This email does not have Link access yet.");
        return;
      }
      await withTimeout(signIn("resend-otp", { email: trimmedEmail }), "OTP resend");
      setCode("");
      setInfo("A new code was sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-login-shell">
      <div className="portal-login">
        <h1 className="sr-only">0001</h1>
        <div className="portal-login__surface">
          {step === "email" ? (
            <form className="portal-login__strip" onSubmit={handleSendCode}>
              <div className="portal-login__band">
                <div className="portal-login__brand">
                  0001
                </div>
                <p className="portal-login__prompt">Sign in to Link</p>
                <label className="portal-login__field">
                  <span className="sr-only">Email</span>
                  <input
                    className="portal-login__input"
                    type="email"
                    value={email}
                    required
                    autoFocus
                    autoComplete="email"
                    enterKeyHint="go"
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    placeholder="Enter your email"
                  />
                </label>
                <button className="portal-login__submit" type="submit" disabled={busy || !isConvexConfigured}>
                  {busy ? "Sending…" : "Continue"}
                </button>
              </div>
            </form>
          ) : (
            <form className="portal-login__strip" onSubmit={handleVerify}>
              <div className="portal-login__band">
                <div className="portal-login__brand">
                  0001
                </div>
                <p className="portal-login__prompt">Enter the code we sent you</p>
                <label className="portal-login__field">
                  <span className="sr-only">Verification code</span>
                  <input
                    className="portal-login__input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    autoFocus
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                  />
                </label>
                <button className="portal-login__submit" type="submit" disabled={busy || !isConvexConfigured}>
                  {busy ? "Verifying…" : "Sign in"}
                </button>
              </div>
            </form>
          )}

          <div className="portal-login__canvas">
            <div className="portal-login__panel">
              {!isConvexConfigured ? (
                <div className="portal-login__message portal-login__message--error" role="alert">
                  {MISSING_CONVEX_MESSAGE}
                </div>
              ) : null}

              {error ? (
                <div className="portal-login__message portal-login__message--error" role="alert">
                  {error}
                </div>
              ) : null}

              {info ? (
                <div className="portal-login__message portal-login__message--info" role="status" aria-live="polite">
                  {info}
                </div>
              ) : null}

              <div className="portal-login__content">
                <p className="portal-login__eyebrow">Access</p>
                {step === "email" ? (
                  <>
                    <p className="portal-login__note">Need access or have a new project inquiry?</p>
                    <p className="portal-login__copy">
                      Request access or get in touch about a new project via{" "}
                      <a className="portal-login__contact-link" href="/contact.html">
                        contact
                      </a>
                      .
                    </p>
                  </>
                ) : (
                  <>
                    <p className="portal-login__note">
                      We sent a 6-digit code to <strong>{email}</strong>.
                    </p>
                    <div className="portal-login__actions">
                      <button
                        type="button"
                        className="portal-login__link"
                        disabled={busy}
                        onClick={() => void handleResendCode()}
                      >
                        Resend code
                      </button>
                      <button
                        type="button"
                        className="portal-login__link"
                        disabled={busy}
                        onClick={() => {
                          setStep("email");
                          setCode("");
                          setInfo(null);
                          setError(null);
                        }}
                      >
                        Use a different email
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
