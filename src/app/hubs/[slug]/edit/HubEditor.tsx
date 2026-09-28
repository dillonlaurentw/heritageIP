"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteHub, removeCoverImage, updateHub, uploadCover } from "../../actions";
import { COVER_LAYOUTS, COVER_TONES, CoverArt, coverFor, type CoverLayout, type CoverTone } from "@/components/mosaic/CoverArt";
import { Button } from "@/components/ui/ArrowLink";
import { TextInput } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";

type Props = {
  hub: {
    id: string;
    slug: string;
    number: number;
    name: string;
    oneLiner: string;
    coverLayout: CoverLayout | null;
    coverTone: CoverTone | null;
    coverImageUrl: string | null;
  };
  uploads: boolean;
};

export function HubEditor({ hub, uploads }: Props) {
  const router = useRouter();
  const [name, setName] = useState(hub.name);
  const [oneLiner, setOneLiner] = useState(hub.oneLiner);
  const [layout, setLayout] = useState<CoverLayout | null>(hub.coverLayout);
  const [tone, setTone] = useState<CoverTone | null>(hub.coverTone);
  const [image, setImage] = useState(hub.coverImageUrl);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const auto = coverFor(name || hub.name);

  function save() {
    start(async () => {
      const res = await updateHub(hub.id, { name, oneLiner, coverLayout: layout, coverTone: tone });
      if (res.ok) router.push(`/hubs/${hub.slug}`);
      else setMsg(res.message);
    });
  }

  function upload(form: FormData) {
    start(async () => {
      const res = await uploadCover(hub.id, form);
      if (res.ok) {
        setImage(res.url);
        setMsg("Image uploaded.");
      } else setMsg(res.message);
    });
  }

  return (
    <div className="flex flex-col gap-16 pb-32">
      <section className="grid grid-cols-1 gap-8 md:grid-cols-[14rem_1fr]">
        <Label>01 · Name</Label>
        <div className="flex max-w-3xl flex-col gap-8">
          <TextInput scale="title" label="Hub name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextInput label="One line · What it is" value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-[14rem_1fr]">
        <div>
          <Label>02 · Cover</Label>
          <p className="mt-2 text-small text-smoke">Generated from the name, or your own image.</p>
        </div>
        <div className="flex flex-col gap-8">
          {image ? (
            <div className="flex flex-col gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- uploaded image preview */}
              <img src={image} alt="" className="aspect-[16/9] w-full max-w-3xl rounded-xs object-cover" />
              <div>
                <Button
                  variant="ghost"
                  onClick={() =>
                    start(async () => {
                      await removeCoverImage(hub.id);
                      setImage(null);
                    })
                  }
                  disabled={busy}
                >
                  Use generated art instead
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <Label>Layout</Label>
                <div className="mt-3 grid grid-cols-2 gap-gutter sm:grid-cols-4">
                  {COVER_LAYOUTS.map((l) => (
                    <Choice key={l} on={(layout ?? auto.layout) === l} onClick={() => setLayout(l)} label={l}>
                      <CoverArt name={name || hub.name} number={hub.number} spec={{ layout: l, tone: tone ?? auto.tone }} />
                    </Choice>
                  ))}
                </div>
              </div>
              <div>
                <Label>Tone</Label>
                <div className="mt-3 grid grid-cols-3 gap-gutter sm:max-w-xl">
                  {COVER_TONES.map((t) => (
                    <Choice key={t} on={(tone ?? auto.tone) === t} onClick={() => setTone(t)} label={t}>
                      <CoverArt name={name || hub.name} number={hub.number} spec={{ layout: layout ?? auto.layout, tone: t }} />
                    </Choice>
                  ))}
                </div>
              </div>
              {(layout || tone) && (
                <button
                  type="button"
                  className="self-start text-small font-medium text-smoke hover:text-bone"
                  onClick={() => {
                    setLayout(null);
                    setTone(null);
                  }}
                >
                  Back to automatic
                </button>
              )}
            </>
          )}
          {uploads && (
            <form action={upload} className="flex flex-wrap items-center gap-4">
              <input
                type="file"
                name="cover"
                accept="image/jpeg,image/png,image/webp"
                className="text-small text-smoke file:mr-4 file:rounded-xs file:border file:border-line file:bg-transparent file:px-4 file:py-2 file:text-bone"
              />
              <Button type="submit" variant="ghost" disabled={busy}>
                Upload image
              </Button>
            </form>
          )}
        </div>
      </section>

      {msg && <p className="label text-signal">{msg}</p>}

      <div className="flex flex-wrap items-center justify-between gap-6 border-t border-line pt-6">
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving" : "Save"}
        </Button>
        <button
          type="button"
          disabled={busy}
          className="text-small font-medium text-smoke hover:text-signal"
          onClick={() => {
            if (confirm(`Delete ${hub.name}? This removes its thesis and history. It can't be undone.`)) {
              start(() => deleteHub(hub.id));
            }
          }}
        >
          Delete this hub
        </button>
      </div>
    </div>
  );
}

function Choice({ on, onClick, label, children }: { on: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className="group text-left">
      <span
        className={`block aspect-[4/3] overflow-hidden rounded-xs ${on ? "outline-2 outline-offset-2 outline-signal" : ""}`}
      >
        {children}
      </span>
      <span className={`label mt-2 block ${on ? "text-bone" : "text-smoke"}`}>{label}</span>
    </button>
  );
}
