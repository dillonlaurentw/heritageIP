"use client";

import { ImageIcon, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { savePage, uploadImage } from "@/app/actions/pages";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageIcon } from "@/components/ui/PageIcon";
import { Popover } from "@/components/ui/Popover";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { COVER_COLORS, coverStyle, ICONS } from "./covers";

/** Cover, icon and title of a page. Saves as you type. */
export function PageHeader({
  pageId,
  title: initialTitle,
  icon: initialIcon,
  cover: initialCover,
  editable,
  placeholder = "Untitled",
  onEnter,
  onTitleChange,
  widthClass = "max-w-page",
}: {
  pageId: string;
  title: string;
  icon: string | null;
  cover: string | null;
  editable: boolean;
  placeholder?: string;
  onEnter?: () => void;
  onTitleChange?: (t: string) => void;
  widthClass?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [icon, setIcon] = useState(initialIcon);
  const [cover, setCover] = useState(initialCover);
  const [customIcon, setCustomIcon] = useState("");
  const toast = useToast();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [title]);

  const save = async (patch: Parameters<typeof savePage>[1]) => {
    const res = await savePage(pageId, patch);
    if (!res.ok) toast(res.message, "danger");
  };

  const pickIcon = (i: string | null) => {
    setIcon(i);
    void save({ icon: i });
  };
  const pickCover = (c: string | null) => {
    setCover(c);
    void save({ coverUrl: c });
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    const res = await uploadImage(form);
    if (res.ok) pickCover(res.url);
    else toast(res.message, "danger");
  };

  const coverPicker = (trigger: React.ReactElement) => (
    <Popover trigger={trigger} className="w-72">
      <p className="px-1 pb-2 text-xs font-medium text-fg-subtle">Color</p>
      <div className="grid grid-cols-9 gap-1">
        {COVER_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            onClick={() => pickCover(`color:${c}`)}
            className="size-6 rounded-sm ring-1 ring-border hover:ring-fg-subtle"
            style={{ background: `var(--tag-${c}-bg)` }}
          />
        ))}
      </div>
      <label className="mt-3 flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md border border-border text-sm hover:bg-bg-hover">
        <ImageIcon className="size-4" /> Upload an image
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => void upload(e.target.files?.[0])} />
      </label>
      {cover && (
        <button type="button" onClick={() => pickCover(null)} className="mt-1 h-8 w-full rounded-md text-sm text-fg-muted hover:bg-bg-hover">
          Remove cover
        </button>
      )}
    </Popover>
  );

  const iconPicker = (trigger: React.ReactElement) => (
    <Popover trigger={trigger} className="w-72">
      <div className="grid grid-cols-9 gap-0.5">
        {ICONS.map((i) => (
          <button key={i} type="button" onClick={() => pickIcon(i)} className="flex size-7 items-center justify-center rounded-md text-lg hover:bg-bg-hover">
            {i}
          </button>
        ))}
      </div>
      <form
        className="mt-2 flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (customIcon.trim()) pickIcon(customIcon.trim().slice(0, 4));
          setCustomIcon("");
        }}
      >
        <Input value={customIcon} onChange={(e) => setCustomIcon(e.target.value)} placeholder="Or type one" className="h-7 text-sm" maxLength={4} />
        <Button type="submit" size="sm">
          Use
        </Button>
      </form>
      {icon && (
        <button type="button" onClick={() => pickIcon(null)} className="mt-1 h-7 w-full rounded-md text-sm text-fg-muted hover:bg-bg-hover">
          Remove icon
        </button>
      )}
    </Popover>
  );

  const style = coverStyle(cover);

  return (
    <div className="group/header">
      {style && (
        <div className="relative h-44 w-full md:h-56" style={style}>
          {editable &&
            coverPicker(
              <button
                type="button"
                className="absolute right-3 bottom-3 rounded-md bg-bg/90 px-2 py-1 text-xs font-medium opacity-0 shadow-popover transition-opacity group-hover/header:opacity-100"
              >
                Change cover
              </button>,
            )}
        </div>
      )}
      <div className={cn("mx-auto w-full px-6 md:px-12", widthClass, style ? (icon ? "-mt-10" : "pt-6") : "pt-12")}>
        {icon && (
          <div className="relative z-10 mb-2">
            {editable ? (
              iconPicker(
                <button type="button" aria-label="Change icon" className="rounded-md hover:bg-bg-hover">
                  <PageIcon icon={icon} size="xl" />
                </button>,
              )
            ) : (
              <PageIcon icon={icon} size="xl" />
            )}
          </div>
        )}
        {editable && (
          <div className="mb-1 flex h-7 gap-1 opacity-0 transition-opacity group-hover/header:opacity-100 focus-within:opacity-100">
            {!icon &&
              iconPicker(
                <Button variant="ghost" size="xs">
                  <Smile className="size-3.5" /> Add icon
                </Button>,
              )}
            {!cover &&
              coverPicker(
                <Button variant="ghost" size="xs">
                  <ImageIcon className="size-3.5" /> Add cover
                </Button>,
              )}
          </div>
        )}
        <textarea
          ref={ref}
          rows={1}
          value={title}
          readOnly={!editable}
          placeholder={placeholder}
          aria-label="Page title"
          onChange={(e) => {
            const t = e.target.value.replace(/\n/g, "");
            setTitle(t);
            onTitleChange?.(t);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => void save({ title: t }), 500);
          }}
          onBlur={() => {
            if (timer.current) {
              clearTimeout(timer.current);
              timer.current = null;
              void save({ title });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter?.();
            }
          }}
          className="w-full resize-none overflow-hidden bg-transparent text-title font-bold tracking-tight text-fg outline-none placeholder:text-fg-subtle/60"
        />
      </div>
    </div>
  );
}
