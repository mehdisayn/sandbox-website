// Row — settings/details row: tile · label · value · chevron.
// Mirrors design/project/kit.jsx Row. See DESIGN.md §5.

import type { ReactNode } from 'react';
import { AppIcon } from './AppIcon';
import type { IconType } from '../../lib/repo/types';

type Props = {
  iconType?: IconType;
  iconValue?: string;
  iconFill?: string | null;
  tileSize?: number;
  label: ReactNode;
  value?: ReactNode;
  chevron?: ReactNode | false;
  danger?: boolean;
  last?: boolean;
  onClick?: () => void;
  href?: string;
  asChild?: never;
};

export function Row({
  iconType, iconValue, iconFill,
  tileSize = 26,
  label, value,
  chevron = '›',
  danger = false,
  last = false,
  onClick,
}: Props) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={[
        'w-full flex items-center gap-3 px-3.5 py-3 text-left',
        last ? '' : 'border-b border-divider',
        onClick ? 'hover:bg-paper-alt transition-colors focus:outline-none focus:bg-paper-alt' : '',
      ].join(' ')}
    >
      {iconType && iconValue && (
        <AppIcon size={tileSize} iconType={iconType} iconValue={iconValue} iconFill={iconFill ?? null} />
      )}
      <span className={['flex-1 text-sm font-medium', danger ? 'text-destructive' : 'text-ink'].join(' ')}>
        {label}
      </span>
      {value && <span className="font-mono text-[11px] text-ink-soft">{value}</span>}
      {chevron && <span className="text-ink-faint text-lg leading-none">{chevron}</span>}
    </Comp>
  );
}
