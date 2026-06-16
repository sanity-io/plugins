---
'sanity-plugin-mux-input': patch
---

author: @stipsan
author: @skogsmaskin
author: @rexxars
author: @erikpena
author: @R-Delfino95
author: @snorrees
author: @KimPaow
author: @hdoro
author: @dylanjha
author: @RitaDias
author: @bjoerge
author: @spuppo-mux
author: @Pintorado
author: @y-dpi
author: @sgulseth
author: @jonabc
author: @runeb
author: @robinpyon
author: @phmasek
author: @pedrobonamin
author: @ottob
author: @olivierverwoerd
author: @mariuslundgard
author: @larixk
author: @kmelve
author: @Jorflo
author: @JesperBry
author: @Jerricho93
author: @javangriff
author: @jaredsmith
author: @jakobsen
author: @israelroldan
author: @iJackWilson
author: @goellner
author: @edwin-mejia
author: @donalffons
author: @danilo-arioli
author: @amazinglalu

Move sanity-plugin-mux-input into the sanity-io/plugins monorepo

No API or behavioral changes — this patch release verifies the plugin can be published from the monorepo. The only dependency change is that `@mux/mux-player` and `use-device-pixel-ratio` are now declared explicitly (they were already used at runtime, previously resolved transitively). Exports, peer dependencies, supported engines, and the dual CJS+ESM build output are unchanged. Adopting monorepo conventions (ESM-only build, React Compiler, lint fixes) will follow in subsequent releases.
