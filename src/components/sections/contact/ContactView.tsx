"use client";

import { Fragment, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";
import { SITE } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Eyebrow } from "@/components/ui/SectionHead";

const PROJ_TYPES = ["Web App", "API & backend", "Consultoría", "Otro"];
const STEPS = ["Datos", "Proyecto", "Enviar"];
// Texto mostrable de una URL: sin protocolo ni "www." ni barra final.
const display = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

const CHANNELS: { ic: IconName; t: string; href: string }[] = [
  { ic: "mail", t: SITE.email, href: `mailto:${SITE.email}` },
  { ic: "linkedin", t: display(SITE.socials.linkedin), href: SITE.socials.linkedin },
  { ic: "github", t: display(SITE.socials.github), href: SITE.socials.github },
  { ic: "external-link", t: display(SITE.socials.web), href: SITE.socials.web },
];

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}

function Field({ label, value, onChange, type = "text", placeholder, error }: FieldProps) {
  return (
    <div className="ak-field">
      <label className="ak-label">{label}</label>
      <input
        className={`ak-input ${error ? "err" : ""}`.trim()}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && (
        <span className="ak-err-msg">
          <Icon name="alert-circle" size={13} />
          {error}
        </span>
      )}
    </div>
  );
}

interface UtmParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

interface FormData {
  name: string;
  email: string;
  type: string;
  message: string;
  consent: boolean;
  website: string; // honeypot
}

function MultiStepForm({ utms }: { utms: UtmParams }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>({
    name: "",
    email: "",
    type: "Web App",
    message: "",
    consent: false,
    website: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const validateStep = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!data.name.trim()) e.name = "Indica tu nombre.";
      if (!validEmail(data.email)) e.email = "Email no válido.";
    }
    if (step === 1 && !data.message.trim()) e.message = "Cuéntame algo del proyecto.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(2, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  async function submit() {
    if (!data.consent) {
      setErrors({ consent: "Debes aceptar la política." });
      return;
    }
    setSending(true);
    setErrors({});
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ...utms }),
      });
      if (res.ok) {
        setSent(true);
        track("lead_submitted", { utm_source: utms.utmSource ?? "direct" });
      } else {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setErrors({ submit: body?.error ?? "No se pudo enviar el mensaje. Inténtalo de nuevo." });
      }
    } catch {
      setErrors({ submit: "Error de red. Inténtalo de nuevo." });
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="ak-form-card">
        <div className="ak-success">
          <span className="ak-success-ic">
            <Icon name="check" size={28} />
          </span>
          <h3 style={{ margin: 0 }}>¡Mensaje enviado!</h3>
          <p className="ak-principle-body" style={{ margin: 0, maxWidth: "36ch" }}>
            Gracias, {data.name || "—"}. Te respondo en menos de 24h.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setSent(false);
              setStep(0);
              setData({
                name: "",
                email: "",
                type: "Web App",
                message: "",
                consent: false,
                website: "",
              });
            }}
          >
            Enviar otro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="ak-form-card">
      <div className="ak-steps">
        {STEPS.map((s, i) => (
          <Fragment key={s}>
            <div className={`ak-step ${i === step ? "on" : ""} ${i < step ? "done" : ""}`.trim()}>
              <span className="ak-step-dot">
                {i < step ? <Icon name="check" size={14} /> : i + 1}
              </span>
              <span className="ak-step-lbl">{s}</span>
            </div>
            {i < STEPS.length - 1 && <span className="ak-step-line" />}
          </Fragment>
        ))}
      </div>
      <div className="ak-progress">
        <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
      </div>

      {/* honeypot anti-spam (oculto para humanos) */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={data.website}
        onChange={(e) => set("website", e.target.value)}
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      <div className="ak-fields">
        {step === 0 && (
          <div className="ak-field-row">
            <Field
              label="Nombre"
              value={data.name}
              onChange={(v) => set("name", v)}
              placeholder="Tu nombre"
              error={errors.name}
            />
            <Field
              label="Email"
              type="email"
              value={data.email}
              onChange={(v) => set("email", v)}
              placeholder="tu@email.com"
              error={errors.email}
            />
          </div>
        )}
        {step === 1 && (
          <>
            <div className="ak-field">
              <label className="ak-label">Tipo de proyecto</label>
              <div className="ak-chips" style={{ marginLeft: 0 }}>
                {PROJ_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`ak-chip ${data.type === t ? "on" : ""}`.trim()}
                    onClick={() => set("type", t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="ak-field">
              <label className="ak-label">Cuéntame del proyecto</label>
              <textarea
                className={`ak-textarea ${errors.message ? "err" : ""}`.trim()}
                value={data.message}
                placeholder="Objetivo, alcance, plazos…"
                onChange={(e) => set("message", e.target.value)}
              />
              {errors.message && (
                <span className="ak-err-msg">
                  <Icon name="alert-circle" size={13} />
                  {errors.message}
                </span>
              )}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="ak-review">
              <div className="ak-review-row">
                <span className="lbl">Nombre</span>
                <span className="val">{data.name || "—"}</span>
              </div>
              <div className="ak-review-row">
                <span className="lbl">Email</span>
                <span className="val">{data.email || "—"}</span>
              </div>
              <div className="ak-review-row">
                <span className="lbl">Tipo</span>
                <span className="val">{data.type}</span>
              </div>
              <div className="ak-review-row">
                <span className="lbl">Mensaje</span>
                <span className="val" style={{ maxWidth: "60%" }}>
                  {data.message || "—"}
                </span>
              </div>
            </div>
            <label className="ak-consent">
              <input
                type="checkbox"
                checked={data.consent}
                onChange={(e) => set("consent", e.target.checked)}
              />
              Acepto la política de privacidad y el tratamiento de mis datos.
            </label>
            {errors.consent && (
              <span className="ak-err-msg">
                <Icon name="alert-circle" size={13} />
                {errors.consent}
              </span>
            )}
            {errors.submit && (
              <span className="ak-err-msg">
                <Icon name="alert-circle" size={13} />
                {errors.submit}
              </span>
            )}
          </>
        )}
      </div>

      <div className="ak-form-actions">
        {step > 0 ? (
          <Button variant="ghost" onClick={back}>
            <Icon name="arrow-left" size={15} style={{ marginRight: 6 }} />
            Atrás
          </Button>
        ) : (
          <span />
        )}
        {step < 2 ? (
          <Button variant="primary" onClick={next}>
            Siguiente <Icon name="arrow-right" size={15} style={{ marginLeft: 6 }} />
          </Button>
        ) : (
          <Button variant="primary" onClick={submit}>
            {sending ? "Enviando…" : "Enviar mensaje"}
          </Button>
        )}
      </div>
    </div>
  );
}

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function Calendar() {
  const [sel, setSel] = useState<number | null>(null);
  const avail = [4, 9, 10, 16, 17, 23, 24, 25];
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return (
    <div className="ak-cal">
      <div className="ak-cal-head">
        <span className="ak-label">Agenda una llamada</span>
        <span className="ak-cal-nav">
          <button aria-label="Mes anterior">
            <Icon name="chevron-left" size={15} />
          </button>
          <button aria-label="Mes siguiente">
            <Icon name="chevron-right" size={15} />
          </button>
        </span>
      </div>
      <div className="ak-byline-sub" style={{ marginBottom: 12 }}>
        {MONTHS[now.getMonth()]} {now.getFullYear()} · zona horaria detectada
      </div>
      <div className="ak-cal-dow">
        {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="ak-cal-grid">
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const av = avail.includes(day);
          return (
            <span
              key={i}
              className={`ak-cal-day ${av ? "av" : ""} ${sel === day ? "sel" : ""}`.trim()}
              onClick={() => av && setSel(day)}
            >
              {day}
            </span>
          );
        })}
      </div>
      <div className="ak-byline-sub" style={{ marginTop: 12 }}>
        {sel ? `Seleccionado: ${sel} · elige hora →` : "Reserva disponible · martes y jueves"}
      </div>
    </div>
  );
}

function ContactViewInner() {
  const searchParams = useSearchParams();
  const utms: UtmParams = {
    utmSource: searchParams.get("utm_source") ?? undefined,
    utmMedium: searchParams.get("utm_medium") ?? undefined,
    utmCampaign: searchParams.get("utm_campaign") ?? undefined,
    utmTerm: searchParams.get("utm_term") ?? undefined,
    utmContent: searchParams.get("utm_content") ?? undefined,
  };

  return (
    <div className="ak-container">
      <section className="ak-contact-hero" data-screen-label="header">
        <Eyebrow>contacto</Eyebrow>
        <h1 className="ak-page-title">¿Empezamos?</h1>
        <p className="ak-page-lead">¿Tienes un proyecto o reto técnico? Hablamos.</p>
        <span className="ak-note" style={{ marginTop: 16 }}>
          <span className="ak-status-dot" />
          Disponible · respondo en ~24h
        </span>
      </section>
      <section className="ak-section" style={{ paddingTop: 24 }}>
        <div className="ak-contact-grid">
          <MultiStepForm utms={utms} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Calendar />
            <div className="ak-panel">
              <div className="ak-side-group-t">Otros canales</div>
              <div className="ak-channels">
                {CHANNELS.map((c) => (
                  <a key={c.t} className="ak-channel" href={c.href}>
                    <span className="ak-channel-ic">
                      <Icon name={c.ic} size={17} />
                    </span>
                    <span className="mono">{c.t}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ContactView() {
  return (
    <Suspense fallback={null}>
      <ContactViewInner />
    </Suspense>
  );
}
