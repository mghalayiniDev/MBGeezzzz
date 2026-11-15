"use client";

import { Image as ImageIcon, Plus, Trophy, X } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { site } from "@/lib/site";
import { LIMITS } from "./limits";

export const SWATCHES = ["#7B6BFF", "#38BDF8", "#3DDC97", "#FBBF24", "#F472B6", "#E5E7EB"];

const BUTTON_TONES = {
  primary: "bg-brand text-white",
  secondary: "bg-white/10 text-fg",
};

// Text you can click and edit in place. Looks like plain text until hovered or focused.
const editable =
  "-mx-1.5 w-[calc(100%+0.75rem)] min-w-0 rounded-md bg-transparent px-1.5 py-0.5 outline-none transition hover:bg-white/[0.05] focus:bg-white/[0.06] focus:ring-1 focus:ring-brand/60";

let nextId = 0;
const newId = () => `b${Date.now()}-${(nextId += 1)}`;

/**
 * value = { author, title, description, color, thumbnail, fields: [{id,name,value}], buttons: [{id,label,style}] }
 * Controlled: the parent owns `value`.
 */

/** The Discord message itself. Click any text, including button labels, to edit it. */
export function InlineEmbedEditor({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const setField = (id, fieldValue) =>
    set({ fields: value.fields.map((f) => (f.id === id ? { ...f, value: fieldValue } : f)) });
  const setButton = (id, label) => set({ buttons: value.buttons.map((b) => (b.id === id ? { ...b, label } : b)) });

  return (
    <div className="flex gap-3 sm:gap-4">
      <LogoMark id="playground-avatar" className="size-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-semibold text-fg">{site.name}</span>
          <span className="rounded bg-brand px-1 py-px text-[9px] font-bold text-white">APP</span>
          <span className="text-[11px] text-dim">Today at 18:03</span>
        </p>

        <div
          className="mt-2 rounded-md border-l-4 bg-white/[0.035] p-4 transition-colors sm:p-5"
          style={{ borderLeftColor: value.color }}
        >
          <div className={value.thumbnail ? "grid grid-cols-[minmax(0,1fr)_auto] gap-3 sm:gap-5" : ""}>
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="size-5 shrink-0 rounded-full transition-colors" style={{ backgroundColor: value.color }} aria-hidden="true" />
                <input
                  aria-label="Author"
                  value={value.author}
                  maxLength={LIMITS.author}
                  onChange={(e) => set({ author: e.target.value })}
                  className={`${editable} text-xs font-semibold text-fg`}
                />
              </div>
              <input
                aria-label="Title"
                value={value.title}
                maxLength={LIMITS.title}
                onChange={(e) => set({ title: e.target.value })}
                className={`${editable} text-base font-semibold text-fg`}
              />
              <textarea
                aria-label="Description"
                rows={2}
                value={value.description}
                maxLength={LIMITS.description}
                onChange={(e) => set({ description: e.target.value })}
                className={`${editable} block field-sizing-content resize-none text-[13px] leading-relaxed text-muted`}
              />
              <dl className="grid grid-cols-3 gap-2 pt-2 sm:gap-3">
                {value.fields.map((f) => (
                  <div key={f.id} className="min-w-0">
                    <dt className="text-xs font-semibold text-fg">{f.name}</dt>
                    <dd>
                      <input
                        aria-label={`${f.name} value`}
                        value={f.value}
                        maxLength={LIMITS.fieldValue}
                        onChange={(e) => setField(f.id, e.target.value)}
                        className={`${editable} text-xs text-muted`}
                      />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            {value.thumbnail ? (
              <div
                className="grid size-12 place-items-center rounded-lg transition-colors sm:size-16"
                style={{ backgroundColor: `${value.color}33`, color: value.color }}
                aria-hidden="true"
              >
                <Trophy className="size-6 sm:size-8" />
              </div>
            ) : null}
          </div>
        </div>

        {value.buttons.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {value.buttons.map((b, i) => (
              <span
                key={b.id}
                className={`group/btn relative inline-flex items-center rounded-[4px] ${BUTTON_TONES[b.style]} focus-within:ring-1 focus-within:ring-white/60`}
              >
                <input
                  aria-label={`Button ${i + 1} label`}
                  value={b.label}
                  maxLength={LIMITS.buttonLabel}
                  size={Math.max(3, b.label.length)}
                  onChange={(e) => setButton(b.id, e.target.value)}
                  className="field-sizing-content min-w-[3ch] bg-transparent px-3 py-1.5 text-[13px] font-medium outline-none"
                />
                <button
                  type="button"
                  aria-label={`Remove button ${b.label || i + 1}`}
                  onClick={() => set({ buttons: value.buttons.filter((x) => x.id !== b.id) })}
                  className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full bg-raise text-muted opacity-0 ring-1 ring-edge-strong transition group-focus-within/btn:opacity-100 group-hover/btn:opacity-100 hover:text-bad focus:opacity-100"
                >
                  <X className="size-2.5" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Slim toolbar: color dots, image toggle and "add button". */
export function EmbedToolbar({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const canAdd = value.buttons.length < LIMITS.buttons;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div role="group" aria-label="Accent color" className="flex items-center gap-1.5">
        {SWATCHES.map((hex) => (
          <button
            key={hex}
            type="button"
            aria-label={`Use color ${hex}`}
            aria-pressed={value.color === hex}
            onClick={() => set({ color: hex })}
            className={`size-5 rounded-full transition ${value.color === hex ? "ring-2 ring-white ring-offset-2 ring-offset-raise" : "hover:scale-110"}`}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>

      <span className="hidden h-5 w-px bg-edge-strong sm:block" aria-hidden="true" />

      <button
        type="button"
        aria-pressed={value.thumbnail}
        onClick={() => set({ thumbnail: !value.thumbnail })}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
          value.thumbnail ? "bg-white/[0.08] text-fg" : "text-muted hover:text-fg"
        }`}
      >
        <ImageIcon className="size-3.5" aria-hidden="true" />
        Image
      </button>
      <button
        type="button"
        disabled={!canAdd}
        onClick={() => set({ buttons: [...value.buttons, { id: newId(), label: "New", style: "secondary" }] })}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition hover:text-fg disabled:opacity-40"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        Button
      </button>
    </div>
  );
}
