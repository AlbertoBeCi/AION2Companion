import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { creatorSupportUrl } from '../lib/siteConfig';
import type { Page } from '../stores/uiStore';

type LegalPage = Extract<Page, 'privacy' | 'fan-notice' | 'about'>;

const pageCopy = {
  es: {
    privacy: {
      eyebrow: 'PRIVACIDAD · DATOS LOCALES', title: 'Privacidad y almacenamiento',
      intro: 'El progreso del juego se guarda en este navegador y no se sincroniza con una cuenta. Algunas funciones externas, como los reportes de Gartua, sí realizan una consulta de red cuando las usas.',
      sections: [
        { title: 'Qué guarda este navegador', body: 'IndexedDB (base “aion2-companion”): personajes (nombre, clase, región y servidor), contadores personalizados (nombre, descripción, categoría, límite, alcance y reinicio), progreso (valor, periodo y fecha), preferencias (idioma, tema, vista compacta y orden), horarios guardados y configuración semanal. localStorage: tema, zona horaria de timers, servidor de Gartua elegido, avisos de sonido activados y marcas temporales para no repetir avisos. La app no utiliza sessionStorage ni crea o lee cookies propias. El service worker puede guardar en caché los archivos de la aplicación para abrirla sin conexión; no guarda el progreso del juego en esa caché.' },
        { title: 'Qué sale del navegador', body: 'Al abrir la app, el navegador solicita las páginas y recursos estáticos a Netlify. Como proveedor de alojamiento, Netlify puede recibir metadatos de solicitud, incluida la dirección IP y el agente de usuario, conforme a sus servicios y configuración. Al elegir un servidor para Gartua, el navegador consulta la ruta de Netlify /fbapi/api/fieldboss.php con el identificador del servidor; una función del sitio reenvía ese identificador al feed comunitario de www.aion2timers.com. El progreso, nombres de personajes y contadores locales no se incluyen en esa consulta. La conservación concreta de registros y la configuración de Netlify deben verificarse con el titular de la cuenta.' },
        { title: 'Fuentes externas y cookies', body: 'No se detectaron en el código analítica, publicidad, píxeles de seguimiento ni carga remota de fuentes. Los dominios aion2.plaync.com, api-global-community.plaync.com, promotion.plaync.com, developers.plaync.com, aion2data.com, shugo.gg, www.aion2timers.com, aion2.grimvane.app, github.com y ko-fi.com aparecen como fuentes o enlaces; solo se contactan si una función consulta el feed o si el usuario abre uno de esos enlaces. El botón opcional de Ko-fi abre su sitio en otra pestaña. Si realizas un pago, Ko-fi indica que puede compartir con el creador tu nombre visible y correo; PayPal o Stripe procesan el pago y aplican sus propias políticas. AION2Companion no incorpora el formulario ni procesa el pago. Consulta la política de privacidad de Ko-fi antes de continuar. El código de la app no crea ni lee cookies. No se muestra un banner de consentimiento porque no se detectó analítica ni publicidad; la calificación del almacenamiento local de preferencias bajo LSSI-CE art. 22.2 queda VERIFICAR con asesoría según el uso y la configuración final.' },
        { title: 'Exportar, importar y borrar', body: 'En Ajustes puedes exportar un JSON que incluye personajes, contadores, progreso, preferencias, horarios locales y opciones guardadas en localStorage. La importación valida el esquema y los campos antes de guardar; los datos se muestran como texto de React y no se ejecutan como código. “Borrar todos los datos” elimina las tablas de usuario y las claves locales de AION2Companion y restablece las preferencias básicas. También puedes borrar los datos del sitio desde los ajustes del navegador; eso elimina asimismo la caché offline.' },
        { title: 'Responsable y derechos', body: 'Responsable del proyecto: [COMPLETAR: nombre o identidad del titular]. Contacto: [COMPLETAR: correo de contacto]. VERIFICAR quién es el responsable a efectos del RGPD y qué derechos y vías de atención corresponden al diseño local-first y al proveedor de alojamiento. La información de Netlify está en su política de privacidad; su tratamiento por cuenta del titular debe revisarse en el acuerdo de tratamiento aplicable.' },
        { title: 'Menores', body: 'No se pide una cuenta ni una identidad real, pero un nombre de personaje puede ser un dato personal si identifica a alguien. Evita introducir nombres reales u otros datos innecesarios. En España, el art. 7 LOPDGDD fija en 14 años el umbral para que el consentimiento del menor pueda fundar por sí solo un tratamiento, con las excepciones legales indicadas en ese artículo; su aplicación concreta aquí queda VERIFICAR.' },
      ],
      laws: 'Referencias oficiales',
    },
    'fan-notice': {
      eyebrow: 'PROYECTO INDEPENDIENTE', title: 'Aviso y fuentes',
      intro: 'AION2Companion es una herramienta comunitaria de seguimiento manual. Es independiente y no está afiliada, patrocinada ni respaldada por NC ni por los titulares de AION 2.',
      sections: [
        { title: 'Uso del juego', body: 'La aplicación no se conecta al cliente de AION 2, no lee memoria, no automatiza acciones y no inicia sesión en cuentas del juego. Los contadores personales los actualiza el usuario. Esta afirmación describe el código de esta aplicación; la compatibilidad con el EULA y las reglas de herramientas de terceros debe VERIFICARSE antes de distribuirla.' },
        { title: 'Procedencia de la información', body: 'Los horarios recurrentes se atribuyen a Shugo.gg. Los reportes de Gartua proceden de Aion2Timers/AbyssLogs y dependen de reportes comunitarios. Parte de las listas de tareas se basa en referencias comunitarias del cliente. La app identifica esas referencias como comunitarias y los valores pueden cambiar con parches; no son datos oficiales de NC.' },
        { title: 'Marcas y licencias', body: 'AION 2, nombres del juego y demás marcas pertenecen a sus respectivos titulares. No se han encontrado en public/ logos, capturas, arte, iconos del juego ni música oficial: el favicon es un SVG propio y los iconos de interfaz proceden de Lucide. Los nombres y datos del juego se usan para identificar el objeto de seguimiento. La titularidad, licencias de bases de datos, condiciones de reutilización de cada fuente y los términos del juego quedan VERIFICAR. Si se identifica material de terceros con licencia incompatible, debe retirarse o sustituirse por un enlace.' },
        { title: 'Información orientativa', body: 'Los horarios comunitarios y estimaciones se ofrecen tal cual, sin garantía de exactitud o disponibilidad. Comprueba el estado y los anuncios del juego antes de tomar decisiones. Fecha de revisión técnica de este aviso: 18/10/2026.' },
      ],
      laws: 'Aviso de no afiliación',
    },
    about: {
      eyebrow: 'ACERCA DEL PROYECTO', title: 'Acerca de / Contacto',
      intro: 'AION2Companion ayuda a organizar actividades y temporizadores de AION 2. Está pensado para el seguimiento manual y local; no sustituye las fuentes del juego ni los anuncios de NC.',
      sections: [
        { title: 'Contacto', body: 'Correo: [COMPLETAR: correo de contacto]. Titular o nombre público del proyecto: [COMPLETAR: nombre o identidad que quieras publicar]. No introduzcas aquí información personal hasta completar y revisar esos datos.' },
        { title: 'Estado del proyecto y monetización', body: 'La app ofrece un enlace opcional a Ko-fi para recibir apoyo voluntario. El enlace abre la plataforma externa: AION2Companion no recoge datos de pago ni procesa donaciones. Ko-fi indica que puede compartir con el creador el nombre visible y el correo de quien apoya; PayPal o Stripe pueden compartir datos de la transacción según sus políticas. Antes de aceptar apoyo, VERIFICAR la aplicación de LSSI-CE art. 10 y art. 22.2, las obligaciones de información y privacidad, fiscalidad y condiciones de cada proveedor. Que el proyecto sea gratuito o sin ánimo de lucro no basta por sí solo para concluir que está exento; depende de cómo se presta y financia el servicio. La aplicación de la Ley 11/2023 también queda VERIFICAR según el tipo de servicio, actividad y posible exención de microempresa.' },
      ],
      laws: 'Base normativa para verificar',
    },
  },
  en: {
    privacy: {
      eyebrow: 'PRIVACY · LOCAL DATA', title: 'Privacy and local storage',
      intro: 'Game progress is stored in this browser and is not synced to an account. Some external features, such as Gartua reports, make a network request when you use them.',
      sections: [
        { title: 'What this browser stores', body: 'IndexedDB (database “aion2-companion”): characters (name, class, region, server), custom trackers (name, description, category, limit, scope, reset), progress (value, period, date), preferences (language, theme, compact view, order), saved schedules and weekly settings. localStorage: theme, timer time zone, selected Gartua server, enabled sound alerts and timestamps used to prevent duplicate alerts. The app does not use sessionStorage or create/read its own cookies. The service worker may cache app files for offline use; it does not store game progress in that cache.' },
        { title: 'What leaves the browser', body: 'When opened, the browser requests pages and static assets from Netlify. As the hosting provider, Netlify may receive request metadata, including IP address and user agent, according to its services and configuration. When you select a server for Gartua, the browser requests the Netlify route /fbapi/api/fieldboss.php with that server identifier; a site function forwards the identifier to the community feed at www.aion2timers.com. Local progress, character names and trackers are not included in that request. Exact log retention and the Netlify account settings must be verified with the account owner.' },
        { title: 'External sources and cookies', body: 'No analytics, advertising, tracking pixels or remotely loaded fonts were found in the code. aion2.plaync.com, api-global-community.plaync.com, promotion.plaync.com, developers.plaync.com, aion2data.com, shugo.gg, www.aion2timers.com, aion2.grimvane.app, github.com and ko-fi.com are used as sources or links; they are contacted only when a feature requests the feed or the user opens a link. The optional Ko-fi button opens its site in a new tab. If you make a payment, Ko-fi says it may share your display name and email with the creator; PayPal or Stripe processes the payment under its own policies. AION2Companion does not embed the payment form or process payments. Review Ko-fi’s privacy policy before continuing. The app code does not create or read cookies. No consent banner is shown because no analytics or ads were detected; whether local preference storage is exempt under LSSI-CE art. 22.2 must be VERIFIED with counsel for the final use and configuration.' },
        { title: 'Export, import and delete', body: 'In Settings you can export a JSON file containing characters, trackers, progress, preferences, local schedules and localStorage options. Import validates the schema and fields before saving; values are rendered as React text and are not executed as code. “Delete all data” removes user tables and AION2Companion local keys and resets basic preferences. You can also clear site data in your browser settings; that also removes the offline cache.' },
        { title: 'Controller and rights', body: 'Project controller: [COMPLETE: owner name or identity]. Contact: [COMPLETE: contact email]. VERIFY who is the controller under GDPR and which rights and contact routes apply to this local-first design and hosting provider. Netlify information is available in its privacy policy; its processing on the owner’s behalf should be checked against the applicable data processing agreement.' },
        { title: 'Children', body: 'No account or real identity is requested, but a character name may be personal data if it identifies someone. Avoid entering real names or unnecessary personal details. In Spain, art. 7 LOPDGDD sets 14 as the age at which a minor may independently consent as a basis for processing, subject to the exceptions in that article; how it applies here must be VERIFIED.' },
      ],
      laws: 'Official references',
    },
    'fan-notice': {
      eyebrow: 'INDEPENDENT FAN PROJECT', title: 'Notice and sources',
      intro: 'AION2Companion is a community tool for manual tracking. It is independent and is not affiliated with, sponsored by or endorsed by NC or the AION 2 rights holders.',
      sections: [
        { title: 'Game use', body: 'The application does not connect to the AION 2 client, read memory, automate actions or log in to game accounts. Users update their personal trackers themselves. This describes this application’s code; compatibility with the EULA and third-party tool rules must be VERIFIED before distribution.' },
        { title: 'Information sources', body: 'Recurring schedules are attributed to Shugo.gg. Gartua reports come from Aion2Timers/AbyssLogs and depend on community reports. Some activity lists rely on community references to the game client. The app labels these as community sources and values may change after patches; they are not official NC data.' },
        { title: 'Trademarks and licenses', body: 'AION 2, game names and other marks belong to their respective rights holders. No logos, screenshots, game art, game icons or official music were found under public/: the favicon is an original SVG and interface icons come from Lucide. Game names and data identify what is being tracked. Ownership, database rights, reuse terms for each source and game terms must be VERIFIED. If third-party material with an incompatible license is identified, remove it or replace it with a link.' },
        { title: 'Informational use', body: 'Community schedules and estimates are provided as is, without a guarantee of accuracy or availability. Check the game state and announcements before relying on them. Technical review date: 18 Oct 2026.' },
      ],
      laws: 'Non-affiliation notice',
    },
    about: {
      eyebrow: 'ABOUT THIS PROJECT', title: 'About / Contact',
      intro: 'AION2Companion helps organize AION 2 activities and timers. It is designed for manual, local tracking and does not replace in-game sources or NC announcements.',
      sections: [
        { title: 'Contact', body: 'Email: [COMPLETE: contact email]. Project owner or public name: [COMPLETE: name or identity you want to publish]. Do not publish until these details are completed and reviewed.' },
        { title: 'Project status and monetization', body: 'The app offers an optional Ko-fi link for voluntary support. It opens the external platform; AION2Companion does not collect payment details or process donations. Ko-fi says it may share a supporter’s display name and email with the creator; PayPal or Stripe may share transaction details under their own policies. Before accepting support, VERIFY how LSSI-CE art. 10 and art. 22.2 apply, along with privacy information duties, tax obligations and provider terms. Being free or non-profit alone does not establish an exemption; it depends on how the service is offered and funded. Whether Law 11/2023 applies must also be VERIFIED based on the service, activity and any microenterprise exemption.' },
      ],
      laws: 'Legal basis to verify',
    },
  },
} as const;

const legalSources = [
  { label: 'RGPD · Reglamento (UE) 2016/679', href: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679' },
  { label: 'LSSI-CE · Ley 34/2002, arts. 10 y 22.2', href: 'https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758' },
  { label: 'LOPDGDD · Ley Orgánica 3/2018, art. 7', href: 'https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673' },
  { label: 'Ley 11/2023 · accesibilidad', href: 'https://www.boe.es/buscar/act.php?id=BOE-A-2023-11022' },
  { label: 'AEPD · Guía sobre el uso de cookies', href: 'https://www.aepd.es/guias/guia-cookies.pdf' },
  { label: 'Netlify · Privacy Policy', href: 'https://www.netlify.com/privacy/' },
  { label: 'Ko-fi · Privacy Policy', href: 'https://more.ko-fi.com/privacy' },
];

export function LegalPage({ page }: { page: LegalPage }) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'es';
  const copy = pageCopy[language][page];
  const legalLabel = page === 'about' ? (language === 'es' ? 'Base normativa para verificar' : 'Legal basis to verify') : pageCopy[language].privacy.laws;

  return <article className="legal-page content-section">
    <header className="legal-page-heading"><div className="eyebrow">{copy.eyebrow}</div><h1 tabIndex={-1}>{copy.title}</h1><p>{copy.intro}</p></header>
    <div className="legal-section-list">{copy.sections.map((section) => <section className="legal-card" key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}</div>
    {page === 'about' && creatorSupportUrl && <a className="button button-primary support-creator" href={creatorSupportUrl} target="_blank" rel="noopener noreferrer">{language === 'es' ? 'Invítame a un café en Ko-fi' : 'Buy me a coffee on Ko-fi'} <ExternalLink size={14} aria-hidden="true" /></a>}
    <section className="legal-reference" aria-labelledby="legal-reference-title"><h2 id="legal-reference-title">{legalLabel}</h2><ul>{legalSources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer">{source.label} <ExternalLink size={12} aria-hidden="true" /></a></li>)}</ul></section>
  </article>;
}
