// Icon picker — emoji + glyph + image-upload tabs.
// Stored as (iconType, iconValue, iconFill). See DESIGN.md §4.

import { useId, useRef, useState } from 'react';
import { AppIcon } from './ui/AppIcon';
import { Pill } from './ui/Pill';
import type { FillName } from '../lib/theme';
import type { IconType } from '../lib/repo/types';

const FILLS: FillName[] = ['default','sage','olive','sand','apricot','clay','rose','lilac','sky','mist','stone'];
const EMOJI_SUGGESTIONS = ['⭐','🍅','🎲','✎','☁','◐','€','$','♥','🎨','📐','📒','⚡','🌿','🔥','🍓'];

export type IconValue = { iconType: IconType; iconValue: string; iconFill: string | null };

export function IconPicker({
  value,
  onChange,
}: {
  value: IconValue;
  onChange: (v: IconValue) => void;
}) {
  const [tab, setTab] = useState<IconType>(value.iconType);
  const fileRef = useRef<HTMLInputElement>(null);
  const id = useId();

  function pickFill(fill: FillName) {
    onChange({ ...value, iconFill: fill === 'default' ? null : fill });
  }

  function pickEmoji(e: string) {
    onChange({ iconType: 'emoji', iconValue: e, iconFill: value.iconFill });
  }

  function pickGlyph(g: string) {
    const v = g.slice(0, 3).toUpperCase();
    onChange({ iconType: 'glyph', iconValue: v, iconFill: value.iconFill });
  }

  async function pickImage(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
    onChange({ iconType: 'image', iconValue: dataUrl, iconFill: null });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <AppIcon
          size={56}
          iconType={value.iconType}
          iconValue={value.iconValue}
          iconFill={value.iconFill}
        />
        <div className="flex flex-col gap-1">
          <Pill tone="neutral">Icon</Pill>
          <div className="font-mono text-[10px] text-ink-soft">{value.iconType}</div>
        </div>
      </div>

      <div className="flex gap-1 rounded-[10px] border border-border bg-paper-alt p-1">
        {(['emoji', 'glyph', 'image'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              'flex-1 rounded-[7px] py-1.5 text-xs font-medium capitalize',
              'focus:outline-none focus:ring-2 focus:ring-accent',
              tab === t ? 'bg-card text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
            ].join(' ')}
          >{t}</button>
        ))}
      </div>

      {tab === 'emoji' && (
        <>
          <div className="grid grid-cols-8 gap-1.5">
            {EMOJI_SUGGESTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => pickEmoji(e)}
                className={[
                  'flex h-9 items-center justify-center rounded-md border text-xl',
                  'focus:outline-none focus:ring-2 focus:ring-accent',
                  value.iconType === 'emoji' && value.iconValue === e
                    ? 'border-ink bg-paper-alt'
                    : 'border-transparent hover:border-border',
                ].join(' ')}
              >{e}</button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            <span>or any emoji:</span>
            <input
              type="text"
              maxLength={4}
              defaultValue={value.iconType === 'emoji' ? value.iconValue : ''}
              onChange={(e) => e.target.value && pickEmoji(e.target.value)}
              className="h-7 w-16 rounded-md border border-border bg-card px-2 text-center text-base"
            />
          </label>
        </>
      )}

      {tab === 'glyph' && (
        <label className="flex items-center gap-2 text-xs text-ink-soft">
          <span>1–3 chars:</span>
          <input
            id={`${id}-glyph`}
            type="text"
            maxLength={3}
            defaultValue={value.iconType === 'glyph' ? value.iconValue : 'PM'}
            onChange={(e) => pickGlyph(e.target.value || 'A')}
            className="h-8 w-20 rounded-md border border-border bg-card px-2 text-center font-mono text-sm uppercase tracking-wider"
          />
        </label>
      )}

      {tab === 'image' && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && pickImage(e.target.files[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border-[1.5px] border-dashed border-border bg-card px-3 py-2 text-xs text-ink-soft hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {value.iconType === 'image' ? 'Replace image…' : 'Upload an image…'}
          </button>
        </>
      )}

      {/* Fill swatches (not for image icons — they don't show fill) */}
      {value.iconType !== 'image' && (
        <div className="flex flex-col gap-1.5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Tile fill</div>
          <div className="flex flex-wrap gap-1.5">
            {FILLS.map((f) => {
              const active = (value.iconFill ?? 'default') === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => pickFill(f)}
                  title={f}
                  className={[
                    'flex h-7 w-7 items-center justify-center rounded-[8px] border-[1.5px]',
                    'focus:outline-none focus:ring-2 focus:ring-accent',
                    active ? 'border-ink' : 'border-border hover:border-ink-soft',
                  ].join(' ')}
                >
                  <span style={{ display: 'block', width: 16, height: 16, borderRadius: 4, background: fillHex(f) }} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function fillHex(f: FillName): string {
  const map: Record<FillName, string> = {
    default: '#ece8de', sage: '#d6e2c8', olive: '#cdd3a8', sand: '#ecdfb6',
    apricot: '#f3cf9d', clay: '#e3a98e', rose: '#eab6c0', lilac: '#d6c8e8',
    sky: '#bcd5ec', mist: '#cfd9d6', stone: '#c9c4b7',
  };
  return map[f];
}
