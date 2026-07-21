import type {ReactNode} from 'react'

import NetlifyWidget from './components/NetlifyWidget'
import type {Site, SiteWidgetOption, WidgetOptions} from './types'

const DEFAULT_TITLE = 'Netlify sites'

function toSite(option: SiteWidgetOption): Site {
  const {apiId, name, title, buildHookId, url, branch} = option

  return {
    id: apiId,
    name,
    title,
    buildHookId,
    url:
      url ||
      (branch && name ? `https://${branch}--${name}.netlify.app/` : undefined) ||
      (name ? `https://${name}.netlify.app/` : undefined),
    adminUrl: name ? `https://app.netlify.com/sites/${name}` : undefined,
    branch,
  }
}

function deploy(site: Site): void {
  if (!site.buildHookId) {
    return
  }

  fetch(`https://api.netlify.com/build_hooks/${site.buildHookId}`, {method: 'POST'}).catch(() => {
    // Build hook failures are intentionally ignored; the deploy badge will
    // keep reflecting the actual deploy status of the site.
  })
}

export default function Widget(options: WidgetOptions): ReactNode {
  const sites = (options.sites || []).map(toSite)

  return (
    <NetlifyWidget
      title={options.title || DEFAULT_TITLE}
      description={options.description}
      sites={sites}
      isLoading={false}
      onDeploy={deploy}
    />
  )
}
