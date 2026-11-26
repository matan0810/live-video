import type { ReactNode } from 'react';

interface IconProps {
  isFilled?: boolean;
}

function Icon({ children, isFilled = false }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={isFilled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function StarIcon({ isFilled }: IconProps) {
  return (
    <Icon isFilled={isFilled}>
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z" />
    </Icon>
  );
}

export function CloseIcon() {
  return (
    <Icon>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function PlusIcon() {
  return (
    <Icon>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function ShareIcon() {
  return (
    <Icon>
      <path d="M12 15V3m0 0L8 7m4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </Icon>
  );
}

export function CheckIcon() {
  return (
    <Icon>
      <path d="m5 12 5 5 9-10" />
    </Icon>
  );
}

export function TheaterIcon() {
  return (
    <Icon>
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </Icon>
  );
}

export function FlagIcon() {
  return (
    <Icon>
      <path d="M5 21V4m0 0h11l-2 4 2 4H5" />
    </Icon>
  );
}

export function MoreIcon() {
  return (
    <Icon isFilled>
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </Icon>
  );
}

export function InfoIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </Icon>
  );
}

export function GridIcon() {
  return (
    <Icon>
      <rect x="3" y="4" width="8" height="7" rx="1.5" />
      <rect x="13" y="4" width="8" height="7" rx="1.5" />
      <rect x="3" y="13" width="8" height="7" rx="1.5" />
      <rect x="13" y="13" width="8" height="7" rx="1.5" />
    </Icon>
  );
}

export function ExpandIcon() {
  return (
    <Icon>
      <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
    </Icon>
  );
}

export function SpeakerIcon() {
  return (
    <Icon isFilled>
      <path d="M4 9h4l5-4v14l-5-4H4z" />
    </Icon>
  );
}

export function TvIcon() {
  return (
    <Icon>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M8 21h8M9 3l3 3 3-3" />
    </Icon>
  );
}

export function RadioIcon() {
  return (
    <Icon>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <circle cx="15.5" cy="14" r="2.5" />
      <path d="M7 12h3M7 16h3M5 8l11-5" />
    </Icon>
  );
}

export function MoonIcon() {
  return (
    <Icon>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </Icon>
  );
}

export function GearIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </Icon>
  );
}
