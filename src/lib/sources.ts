export interface SourceRecord {
  id: string;
  title: string;
  url: string;
  type: 'official' | 'community';
  status: 'official-publication' | 'internal-undocumented' | 'community-reference';
  reviewed: string;
  region: string;
  scope: string;
  validity: string;
  note: string;
  noteEn: string;
  regionEn: string;
  scopeEn: string;
  validityEn: string;
}

export const sourceRecords: SourceRecord[] = [
  {
    id: 'aion2data-global-checklist', title: 'Comunidad — Aion2Data checklist Global',
    url: 'https://aion2data.com/checklist', type: 'community', status: 'community-reference', reviewed: '2026-10-16', region: 'Global · cliente comunitario 2.0.6.0 hotfix 1 (build 25800038)', scope: 'Cargas diarias/semanales, niveles de desbloqueo y reinicios', validity: 'Instantánea de cliente del 2026-10-09; confirmar actividad y reglas en el juego',
    note: 'Los apartados Diarias y Semanales precargan una selección de sus listas de actividad. Aion2Data indica que extrajo los contadores de archivos del cliente Global; es una fuente comunitaria, no una publicación oficial de NC.', noteEn: 'The preloaded Daily and Weekly sections use a selection of its activity lists. Aion2Data says it extracted counters from the Global client files; this is a community source, not an official NC publication.', regionEn: 'Global · community client 2.0.6.0 hotfix 1 (build 25800038)', scopeEn: 'Daily/weekly entries, unlock levels, and reset cadence', validityEn: 'Client snapshot from 2026-10-09; check activity availability and rules in game',
  },
  {
    id: 'shugo-timers', title: 'Comunidad — Shugo.GG AION 2 timers',
    url: 'https://shugo.gg/timers', type: 'community', status: 'community-reference', reviewed: '2026-10-16', region: 'Global (zonas de servidor seleccionables)', scope: 'Rifts, eventos, jefes y reinicio semanal', validity: 'Horarios revisados el 2026-10-09; pueden variar tras actualizaciones',
    note: 'Calendario comunitario precargado en la página de temporizadores. El propio Shugo.GG indica que NC no ha publicado los horarios de eventos Global; úsalo como referencia, no como regla oficial.', noteEn: 'Community calendar preloaded on the timers page. Shugo.GG states that NC has not published Global event schedules; use these as a reference, not as official rules.', regionEn: 'Global (selectable server time zones)', scopeEn: 'Rifts, events, bosses, and weekly reset', validityEn: 'Schedules reviewed 2026-10-09; may change after updates',
  },
  {
    id: 'aion2timers-fieldboss-feed', title: 'Comunidad — Aion2Timers / AbyssLogs field-boss feed',
    url: 'https://www.aion2timers.com/world-boss-timer/', type: 'community', status: 'community-reference', reviewed: '2026-10-18', region: 'Global · servidores seleccionables', scope: 'Última muerte reportada y reaparición de Gartua Eterno / Inmortal', validity: 'Feed comunitario en vivo; la cobertura depende de reportes recientes por servidor',
    note: 'Los estados llegan de reportes de jugadores del DPS meter AbyssLogs. Los ciclos de reaparición son comunitarios y pueden aparecer como estimados; sin un reporte reciente la aplicación no inventa una cuenta atrás. La consulta usa un proxy same-origin sin credenciales.', noteEn: 'States come from player reports submitted by the AbyssLogs DPS meter. Respawn cycles are community data and may be estimates; without a recent report the app does not invent a countdown. Requests use a same-origin proxy and no credentials.', regionEn: 'Global · selectable servers', scopeEn: 'Last reported kill and Gartua respawn for Eternal / Immortal Gartua', validityEn: 'Live community feed; coverage depends on recent reports per server',
  },
  {
    id: 'nc-global-board', title: 'NC — avisos y actualizaciones de AION 2',
    url: 'https://aion2.plaync.com/en-us/board/update/view?articleId=6acf20d007b77e214688a7ac', type: 'official', status: 'official-publication', reviewed: '2026-10-16', region: 'Global (aviso consultado)', scope: 'Compras de objeto por servidor/personaje, según aviso', validity: 'Período temporal de transferencia; comprobar publicación antes de reutilizar',
    note: 'Publicaciones oficiales para Global. Cada límite debe interpretarse según su servidor, personaje, región y vigencia; un aviso no equivale por sí solo a una API soportada.', noteEn: 'Official Global publications. Read each limit in its server, character, region, and validity context; a notice alone is not a supported API.', regionEn: 'Global (notice reviewed)', scopeEn: 'Purchases per server/character, according to notice', validityEn: 'Temporary transfer period; recheck notice before reuse',
  },
  {
    id: 'nc-developer-catalog', title: 'NC — catálogo oficial de APIs para desarrolladores',
    url: 'https://developers.plaync.com/', type: 'official', status: 'official-publication', reviewed: '2026-10-16', region: 'Catálogo global consultado', scope: 'Listado de APIs de desarrollador', validity: 'Revisar catálogo vigente',
    note: 'No se encontró una API pública documentada de AION 2 en el catálogo revisado. Las respuestas públicas del sitio comunitario de NC y de perfiles no forman un contrato de API para contadores personales.', noteEn: 'No documented public AION 2 API was found in the reviewed catalog. Public community-site and profile responses are not an API contract for personal counters.', regionEn: 'Global catalog reviewed', scopeEn: 'Developer API catalog', validityEn: 'Recheck current catalog',
  },
  {
    id: 'nc-global-community-json', title: 'NC — servicio JSON del sitio comunitario Global',
    url: 'https://api-global-community.plaync.com/aion2_global/board/update_en/article/6acf20d007b77e214688a7ac', type: 'official', status: 'internal-undocumented', reviewed: '2026-10-16', region: 'Global', scope: 'Contenido de publicaciones', validity: 'Endpoint observado; estabilidad y periodo dependen del aviso',
    note: 'Endpoint público observado para publicaciones. No está incluido como integración de producción porque NC no lo documenta como API estable.', noteEn: 'Public endpoint observed for notices. It is not used as a production integration because NC does not document it as a stable API.', regionEn: 'Global', scopeEn: 'Publication content', validityEn: 'Endpoint availability and notice validity can change',
  },
  {
    id: 'nc-promotions-json', title: 'NC — listado JSON de promociones',
    url: 'https://promotion.plaync.com/en-us/eventon/item?tag=MKT_PROMOTION%2CDOMAIN_AION2_GLOBAL%2CCOUNTRY_US%2C&status=RUNNING&pageSize=1&page=1', type: 'official', status: 'internal-undocumented', reviewed: '2026-10-16', region: 'Global / etiqueta COUNTRY_US del ejemplo consultado', scope: 'Fechas de promoción', validity: 'Cada respuesta incluye su ventana de promoción; no generalizar a ciclos recurrentes',
    note: 'Respuesta pública observada con promociones y fechas. Las fechas del evento no prueban ciclos de reinicio de tareas o temporizadores recurrentes.', noteEn: 'Public response observed with promotions and dates. Event dates do not establish task reset cycles or recurring timers.', regionEn: 'Global / example query tagged COUNTRY_US', scopeEn: 'Promotion dates', validityEn: 'Each promotion has its own window; not a recurring timer',
  },
  {
    id: 'nc-character-search', title: 'NC — perfiles públicos de personajes',
    url: 'https://aion2.plaync.com/en-us/characters/index', type: 'official', status: 'official-publication', reviewed: '2026-10-16', region: 'Europa (perfil muestreado)', scope: 'Perfil público individual', validity: 'Datos del perfil en el momento de consulta',
    note: 'El perfil público observado incluye datos del personaje, equipamiento y progreso de personaje como Daevanion. No se verificó un endpoint documentado para leer tareas o contadores personales.', noteEn: 'The public profile reviewed exposes character, equipment, and character progress such as Daevanion. No documented endpoint for tasks or personal counters was verified.', regionEn: 'Europe (sample profile)', scopeEn: 'Individual public profile', validityEn: 'Profile values as published at query time',
  },
  {
    id: 'community-api', title: 'Comunidad — aion2-api (nuriland)',
    url: 'https://github.com/nuriland/aion2-api', type: 'community', status: 'community-reference', reviewed: '2026-10-16', region: 'Múltiples regiones según cliente comunitario', scope: 'Perfiles y datos públicos', validity: 'Proyecto comunitario sujeto a cambios',
    note: 'Cliente comunitario de perfiles, equipamiento y datos de juego. Referencia para entender rutas públicas; no se utiliza como fuente de reglas ni de progreso personal.', noteEn: 'Community client for profiles, equipment, and game data. A reference for public routes; not used as a rule source or personal progress feed.', regionEn: 'Multiple regions per community client', scopeEn: 'Public profiles and game data', validityEn: 'Community project may change',
  },
  {
    id: 'community-notices', title: 'Comunidad — cliente de avisos y promociones',
    url: 'https://github.com/axsddlr/aion2_api', type: 'community', status: 'community-reference', reviewed: '2026-10-16', region: 'Global', scope: 'Avisos y promociones', validity: 'Proyecto comunitario sujeto a cambios',
    note: 'Ejemplo comunitario de lectura de endpoints no documentados de NC. Sirve para localización e investigación, no constituye una API mantenida por NC.', noteEn: 'Community example of reading undocumented NC endpoints. Useful for discovery and research, but not an API maintained by NC.', regionEn: 'Global', scopeEn: 'Notices and promotions', validityEn: 'Community project may change',
  },
  {
    id: 'grimvane', title: 'Comunidad — Grimvane timers API',
    url: 'https://aion2.grimvane.app/privacy', type: 'community', status: 'community-reference', reviewed: '2026-10-16', region: 'Global, cobertura comunitaria', scope: 'Temporizadores comunitarios', validity: 'Servicio beta de terceros; revisar vigencia con proveedor',
    note: 'Servicio de terceros expresamente no oficial, con horarios y temporizadores comunitarios. Excluido de las reglas precargadas del Companion.', noteEn: 'Explicitly unofficial third-party service with community schedules and timers. Excluded from Companion presets.', regionEn: 'Global/community coverage', scopeEn: 'Community timers', validityEn: 'Third-party beta; check provider for current status',
  },
];
