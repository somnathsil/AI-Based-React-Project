import type { IconSearchProvider, IconSource } from './types'
import { iconifyProvider } from './providers/iconify'
import { lucideProvider } from './providers/lucide'
import { magnificProvider } from './providers/magnific'
import { remixiconProvider } from './providers/remixicon'

/**
 * Central provider registry.
 *
 * To add a new provider:
 *   1. Create a new file in providers/ that implements IconSearchProvider
 *   2. Import it here
 *   3. Add it to the providerList array
 *
 * To disable a provider: set `enabled: false` in its meta, or remove from this list.
 * To remove a provider: delete the file and remove from this list.
 *
 * The UI (filters, result grouping) auto-adapts to whatever is registered here.
 */

const providerList: IconSearchProvider[] = [
  iconifyProvider,
  lucideProvider,
  remixiconProvider,
  magnificProvider,
]

/** Get all registered providers (including disabled ones). */
export function getAllProviders(): IconSearchProvider[] {
  return [...providerList]
}

/** Get only enabled providers. */
export function getEnabledProviders(): IconSearchProvider[] {
  return providerList.filter((p) => p.meta.enabled)
}

/** Get a specific provider by its source id. */
export function getProvider(source: IconSource): IconSearchProvider | undefined {
  return providerList.find((p) => p.meta.id === source)
}

/** Get enabled providers for search (excludes generation-only providers like Magnific for search). */
export function getSearchProviders(): IconSearchProvider[] {
  return providerList.filter((p) => p.meta.enabled && p.meta.supportsSearch)
}

/** Get metadata for all enabled providers (used to build UI filters). */
export function getEnabledProviderMetas() {
  return getEnabledProviders().map((p) => p.meta)
}
