// AppIcon — rounded tile + glyph/emoji/image. Mirrors design/project/kit.jsx
// AppIcon. See DESIGN.md §4 for the icon system.

import { SB_FILLS, SB_LIGHT, type FillName } from '../../lib/theme';
import type { IconType } from '../../lib/repo/types';

type Props = {
  size?: number;
  iconType: IconType;
  iconValue: string;
  iconFill?: string | null;
  mode?: 'light' | 'dark';
  className?: string;
};

export function AppIcon({
  size = 56,
  iconType,
  iconValue,
  iconFill,
  mode = 'light',
  className = '',
}: Props) {
  const radius = Math.round(size * 0.28);
  const fillKey = (iconFill && (iconFill as FillName) in SB_FILLS[mode] ? iconFill : 'default') as FillName;
  const bg = iconType === 'image' ? undefined : SB_FILLS[mode][fillKey];
  const fontSize = iconType === 'emoji' ? size * 0.52 : Math.max(10, size * 0.22);
  const fontFamily = iconType === 'emoji' ? 'system-ui' : '"JetBrains Mono", ui-monospace, monospace';

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        // Tile fills are always light pastels (mode defaults to 'light'), so the
        // border and glyph stay locked to the dark ink in both themes — otherwise
        // dark mode renders light-on-light and washes out.
        border: `1.5px solid ${SB_LIGHT.ink}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        fontSize,
        fontWeight: 600,
        letterSpacing: 0.5,
        color: SB_LIGHT.ink,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {iconType === 'image' ? (
        <img
          src={iconValue}
          alt=""
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        iconValue
      )}
    </div>
  );
}
