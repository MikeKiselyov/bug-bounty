import { LEVEL_LABELS } from '../lib/labels'
import type { Level } from '../lib/types'

export function LevelBadge({ level }: { level: Level }) {
  return <span className={'level-badge level-' + level}>{LEVEL_LABELS[level]}</span>
}
