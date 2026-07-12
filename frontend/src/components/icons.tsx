import type { SVGProps } from 'react'

// Shared inline SVG icon set — currentColor, 1.3px stroke, 16px grid.
// design.md: emoji glyphs are banned in chrome; every icon lives here.
// (Window-control icons stay local to TitleBar.tsx.)

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 14, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  )
}

export function PlusIcon(p: IconProps) {
  return <Icon {...p}><path d="M8 3.5v9M3.5 8h9" /></Icon>
}

export function SearchIcon(p: IconProps) {
  return <Icon {...p}><circle cx="7" cy="7" r="4.2" /><path d="m13.2 13.2-3.2-3.2" /></Icon>
}

export function HistoryIcon(p: IconProps) {
  return <Icon {...p}><circle cx="8" cy="8" r="5.4" /><path d="M8 5.2V8l1.9 1.2" /></Icon>
}

export function StarIcon({ filled, ...p }: IconProps & { filled?: boolean }) {
  return (
    <Icon {...p} fill={filled ? 'currentColor' : 'none'}>
      <path d="m8 2.2 1.8 3.6 4 .6-2.9 2.8.7 4L8 11.3l-3.6 1.9.7-4-2.9-2.8 4-.6L8 2.2Z" />
    </Icon>
  )
}

export function ListIcon(p: IconProps) {
  return <Icon {...p}><path d="M2.5 4h11M2.5 8h11M2.5 12h11" /></Icon>
}

export function GearIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="8" cy="8" r="2.2" />
      <path d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.7 3.7l1.4 1.4M10.9 10.9l1.4 1.4M12.3 3.7l-1.4 1.4M5.1 10.9l-1.4 1.4" />
    </Icon>
  )
}

export function FolderIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M1.8 4.2c0-.7.6-1.2 1.2-1.2h3l1.5 1.6h5.5c.7 0 1.2.5 1.2 1.2v5.6c0 .7-.5 1.2-1.2 1.2H3c-.6 0-1.2-.5-1.2-1.2V4.2Z" />
    </Icon>
  )
}

export function BranchIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="4.5" cy="3.5" r="1.5" />
      <circle cx="4.5" cy="12.5" r="1.5" />
      <circle cx="11.5" cy="5" r="1.5" />
      <path d="M4.5 5v6M11.5 6.5c0 2.6-3.5 2.3-6 3.6" />
    </Icon>
  )
}

export function MessageIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M13.5 9.3c0 .7-.5 1.2-1.2 1.2H6.2l-2.9 2.6v-2.6h-.6c-.7 0-1.2-.5-1.2-1.2V4c0-.7.5-1.2 1.2-1.2h9.6c.7 0 1.2.5 1.2 1.2v5.3Z" />
    </Icon>
  )
}

export function PencilIcon(p: IconProps) {
  return <Icon {...p}><path d="m10 3 3 3-7.4 7.4-3.4.4.4-3.4L10 3Z" /></Icon>
}

export function XIcon(p: IconProps) {
  return <Icon {...p}><path d="m4 4 8 8M12 4l-8 8" /></Icon>
}

export function ChevronRightIcon(p: IconProps) {
  return <Icon {...p}><path d="m6 4 4 4-4 4" /></Icon>
}

export function ChevronDownIcon(p: IconProps) {
  return <Icon {...p}><path d="m4 6 4 4 4-4" /></Icon>
}

export function DotsIcon(p: IconProps) {
  return (
    <Icon {...p} fill="currentColor" stroke="none">
      <circle cx="8" cy="3.5" r="1.1" />
      <circle cx="8" cy="8" r="1.1" />
      <circle cx="8" cy="12.5" r="1.1" />
    </Icon>
  )
}

export function ArrowRightIcon(p: IconProps) {
  return <Icon {...p}><path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5" /></Icon>
}

export function HexIcon(p: IconProps) {
  return <Icon {...p}><path d="M8 1.8 13.4 5v6L8 14.2 2.6 11V5L8 1.8Z" /></Icon>
}

export function SparkIcon(p: IconProps) {
  return (
    <Icon {...p} fill="currentColor" stroke="none">
      <path d="M8 1.8c.5 3.2 1.7 4.7 5 5.2-3.3.5-4.5 2-5 5.2-.5-3.2-1.7-4.7-5-5.2 3.3-.5 4.5-2 5-5.2Z" />
    </Icon>
  )
}
