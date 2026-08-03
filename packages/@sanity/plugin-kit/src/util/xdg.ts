import {homedir} from 'node:os'
import path from 'node:path'

/**
 * XDG config home directory (`$XDG_CONFIG_HOME` or `~/.config`).
 * Replaces the `xdg-basedir` package.
 */
export const xdgConfig = process.env.XDG_CONFIG_HOME?.trim() || path.join(homedir(), '.config')
