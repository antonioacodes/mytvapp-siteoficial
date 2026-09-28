import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './brand.css'
import './channel-wall.css'
import './catalog.css'

const Icon = ({ children }) => <span className="icon" aria-hidden="true">{children}</span>
const plans = [
  { name: 'Mensal', price: '19,90', note: 'Liberdade para renovar quando quiser.' },
  { name: 'Trimestral', price: '54,90', note: 'Mais tempo para curtir sem preocupação.', featured: true },
  { name: 'Anual', price: '199,90', note: 'A melhor escolha para o ano inteiro.' }
]

const API_BASE = (import.meta.env.VITE_MYT_API_BASE || 'https://acodes.pro/mytv_backend/api').replace(/\/$/, '')
const fallbackEvents = [
  { id: 'demo-1', leagueName: 'Futebol', sportCategory: 'Futebol', homeTeam: 'Partida em destaque', awayTeam: 'Ao vivo', timeStr: '19:30', isLive: true, broadcastChannel: 'MyTV' },
  { id: 'demo-2', leagueName: 'Agenda MyTV', sportCategory: 'Outros', homeTeam: 'Mais esportes', awayTeam: 'Hoje', timeStr: '21:00', isLive: false, broadcastChannel: 'MyTV' }
]
const fallbackChannels = [
  ['globo', 'Globo'], ['sbt', 'SBT'], ['record', 'Record'], ['band', 'Band'], ['redetv', 'RedeTV!'], ['cazetv', 'CazéTV'],
  ['espn', 'ESPN'], ['sportv', 'SporTV'], ['premiere', 'Premiere'], ['tntsports', 'TNT Sports'], ['bandsports', 'BandSports'], ['combate', 'Combate'],
  ['disneyplus', 'Disney+'], ['max', 'Max'], ['amazonprimevideo', 'Prime Video'], ['telecine', 'Telecine'], ['paramountplus', 'Paramount+'], ['appletv1', 'Apple TV+']
].map(([id, name]) => ({ id: `fallback-${id}`, name, poster: `https://embedcanaisdetv.com/images/${id}.png` }))

function Brand() { return <a className="brand" href="/" aria-label="MyTV"><img src="/assets/mytv-logo.png" alt="MyTV" /></a> }

function Header({ portal, setPortal }) {
  return <header className="topbar"><Brand /><nav><a href="#recursos">Recursos</a><a href="#esportes">Esportes</a><a href="#planos">Planos</a></nav><button className="outline" onClick={() => setPortal(!portal)}>{portal ? 'Voltar ao site' : 'Minha conta'} <span>↗</span></button></header>
}

function LiveMock() {
  return <div className="tv-mock"><div className="tv-nav"><Brand /><span>⌕</span><span>♡</span><span className="avatar">A</span></div><div className="screen-art"><div className="live-pill">● AO VIVO</div><div className="screen-copy"><small>EXPERIÊNCIA MYTV</small><h3>Tudo o que você gosta.<br />Em uma única tela.</h3><p>TV ao vivo, filmes, séries e eventos esportivos.</p><button>Assistir agora <b>→</b></button></div></div><div className="mini-row"><div><span className="mini-icon">◉</span><p><b>Programação atual</b><small>Saiba o que está passando</small></p></div><div><span className="mini-icon">⚽</span><p><b>Esportes ao vivo</b><small>Jogos e eventos do dia</small></p></div></div></div>
}

function goToPlans() { document.querySelector('#planos')?.scrollIntoView({ behavior: 'smooth' }) }

function useOfficialPlans() {
  const [officialPlans, setOfficialPlans] = useState(plans)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_BASE}/get_planos.php`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('planos indisponíveis')))
      .then(payload => {
        if (!Array.isArray(payload.planos) || !payload.planos.length) return
        setOfficialPlans(payload.planos.map((plan, index, all) => ({
          id: plan.id,
          name: plan.nome,
          price: Number(plan.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          note: plan.descricao || `${plan.prazo_dias} dias de acesso MyTV · ${plan.telas} telas`,
          featured: all.length > 1 && index === Math.floor(all.length / 2)
        })))
      }).catch(() => {})
    return () => controller.abort()
  }, [])
  return officialPlans
}

function useShowcaseData() {
  const [data, setData] = useState({ home: null, catalog: null, sports: [] })
  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      fetch(`${API_BASE}/home.php`, { signal: controller.signal }).then(response => response.ok ? response.json() : null),
      fetch(`${API_BASE}/get_tmdb.php`, { signal: controller.signal }).then(response => response.ok ? response.json() : null),
      fetch(`${API_BASE}/get_sports.php`, { signal: controller.signal }).then(response => response.ok ? response.json() : [])
    ]).then(([home, catalog, sports]) => setData({ home, catalog, sports: Array.isArray(sports) ? sports : [] })).catch(() => {})
    return () => controller.abort()
  }, [])
  return data
}

const readableCollection = (key) => ({ destaques: 'Em destaque', mais_assistidos: 'Mais assistidos', lancamentos: 'Lançamentos', acao: 'Ação', comedia: 'Comédia', populares: 'Populares', acao_aventura: 'Ação e aventura', drama: 'Drama', sci_fi: 'Sci-fi e fantasia', animacoes: 'Animações', familia: 'Para a família', tv: 'Séries para crianças' }[key] || key.replaceAll('_', ' '))

function FeatureCards({ onOpen }) {
  const cards = [
    ['live', '▣', 'TV ao vivo', 'Canais organizados por categoria, com programação atual e navegação instantânea.', 'Explorar canais', 'violet'],
    ['vod', '◉', 'Filmes e séries', 'Encontre algo novo ou continue exatamente de onde parou.', 'Ver catálogo', 'blue'],
    ['sports', '◈', 'Esportes', 'Partidas, campeonatos e várias opções de transmissão quando disponíveis.', 'Ver agenda', 'orange']
  ]
  return <div className="feature-grid">{cards.map(([id, icon, title, description, action, tone]) => <article className={`feature-card ${tone}`} key={id} onClick={() => onOpen(id)}><Icon>{icon}</Icon><h3>{title}</h3><p>{description}</p><button onClick={() => onOpen(id)}>{action} →</button></article>)}</div>
}

function BrowsePage({ kind, onBack, officialPlans }) {
  const [channels, setChannels] = useState([])
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [query, setQuery] = useState('')
  const { catalog, sports } = useShowcaseData()
  useEffect(() => {
    if (kind !== 'live') return
    const controller = new AbortController()
    fetch(`${API_BASE}/site_channels.php`, { signal: controller.signal }).then(response => response.ok ? response.json() : null).then(payload => setChannels(Array.isArray(payload?.channels) ? payload.channels : [])).catch(() => {})
    return () => controller.abort()
  }, [kind])
  const goPlans = () => document.querySelector('#planos')?.scrollIntoView({ behavior: 'smooth' })
  if (kind === 'sports') return <><SportsAgenda /><section id="planos" className="plans section"><PlanGrid plans={officialPlans} onChoose={goPlans} /></section></>
  if (kind === 'live') {
    const categories = ['Todos', ...new Set(channels.flatMap(channel => channel.categories || []))]
    const visible = activeCategory === 'Todos' ? channels : channels.filter(channel => (channel.categories || []).includes(activeCategory))
    return <main className="browse-page"><button className="back-browse" onClick={onBack}>← Voltar</button><p className="eyebrow">TV AO VIVO</p><h1>Escolha um canal<br />e aproveite a MyTV.</h1><div className="browse-tabs">{categories.slice(0, 14).map(category => <button className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)} key={category}>{category}</button>)}</div><div className="public-channel-grid">{visible.slice(0, 80).map(channel => <button className="public-channel" onClick={goPlans} key={channel.id}><img src={channel.poster} alt={channel.name} onError={(event) => { event.currentTarget.src = '/assets/mytv-logo.png' }} /></button>)}</div><section id="planos" className="plans section"><PlanGrid plans={officialPlans} onChoose={goPlans} /></section></main>
  }
  const sections = [...Object.entries(catalog?.movies || {}), ...Object.entries(catalog?.series || {})].slice(0, 7)
  const platforms = ['Netflix', 'Prime Video', 'Disney+', 'Max', 'Apple TV+', 'Globoplay']
  return <main className="browse-page vod-browse"><button className="back-browse" onClick={onBack}>← Voltar</button><p className="eyebrow">FILMES E SÉRIES</p><h1>Encontre o próximo<br />título para maratonar.</h1><button className="search-cta" onClick={goPlans}>⌕ Pesquise filmes, séries e muito mais <span>→</span></button><section className="platforms"><p>CATÁLOGO COMPLETO DISPONÍVEL DE</p><div>{platforms.map(platform => <button key={platform} onClick={goPlans}>{platform}</button>)}</div></section><div className="vod-collections">{sections.map(([key, items], index) => <section className="vod-row" key={`${key}-${index}`}><h2>{readableCollection(key)}</h2><div>{(items || []).slice(0, 10).map(item => <button className="vod-poster" key={`${key}-${item.id}`} onClick={goPlans}>{item.poster_url && <img src={item.poster_url} alt={item.title} />}<span>{item.title}</span></button>)}</div></section>)}</div><div className="catalog-fade"><button className="primary" onClick={goPlans}>Ver planos e assistir <span>→</span></button></div><section id="planos" className="plans section"><PlanGrid plans={officialPlans} onChoose={goPlans} /></section></main>
}

function PlanGrid({ plans, onChoose }) { return <><div className="section-heading centered"><p className="eyebrow">ESCOLHA SEU TEMPO</p><h2>Uma assinatura simples.</h2><p>Escolha o plano que funciona melhor para você.</p></div><div className="plan-grid">{plans.map(plan => <article className={`plan ${plan.featured ? 'featured' : ''}`} key={plan.id || plan.name}>{plan.featured && <span className="best">MAIS ESCOLHIDO</span>}<h3>{plan.name}</h3><p>{plan.note}</p><div className="price"><sup>R$</sup><b>{plan.price}</b></div><small>acesso MyTV</small><button className={plan.featured ? 'primary' : 'outline'} onClick={onChoose}>Escolher plano <span>→</span></button></article>)}</div></> }

function SportsAgenda() {
  const [events, setEvents] = useState(fallbackEvents)
  const [category, setCategory] = useState('Todos')

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_BASE}/get_sports.php`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('agenda indisponível')))
      .then(payload => { if (Array.isArray(payload) && payload.length) setEvents(payload) })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const categories = useMemo(() => ['Todos', ...new Set(events.map(event => event.sportCategory || 'Outros'))].slice(0, 6), [events])
  const visible = category === 'Todos' ? events : events.filter(event => (event.sportCategory || 'Outros') === category)

  return <section id="esportes" className="sports section sports-agenda"><div className="sports-top"><div><p className="eyebrow">AGENDA MYTV</p><h2>Esportes ao vivo.<br /><em>Do seu jeito.</em></h2><p className="sports-intro">Acompanhe os eventos disponíveis hoje e assista pelo aplicativo MyTV.</p></div><button className="outline" onClick={goToPlans}>Assinar para assistir <span>→</span></button></div><div className="sport-filters">{categories.map(item => <button key={item} className={item === category ? 'active' : ''} onClick={() => setCategory(item)}>{item === 'Todos' ? '◉' : item === 'Futebol' ? '⚽' : item === 'Tênis' ? '◌' : '✦'} {item}</button>)}</div><div className="live-events">{visible.slice(0, 6).map(event => <article className="live-event" key={event.id || `${event.homeTeam}-${event.awayTeam}`}><div className="event-top"><span className={event.isLive ? 'live-pill' : 'time-pill'}>{event.isLive ? '● AO VIVO' : event.timeStr || 'HOJE'}</span><small>{event.leagueName || event.sportCategory || 'Esportes'}</small></div><div className="event-teams"><div>{event.homeBadgeUrl ? <img src={event.homeBadgeUrl} alt="" /> : <span className="team-placeholder">{(event.homeTeam || '?').slice(0, 1)}</span>}<b>{event.homeTeam || 'A confirmar'}</b></div><strong>×</strong><div>{event.awayBadgeUrl ? <img src={event.awayBadgeUrl} alt="" /> : <span className="team-placeholder">{(event.awayTeam || '?').slice(0, 1)}</span>}<b>{event.awayTeam || 'A confirmar'}</b></div></div><footer><span>{event.broadcastChannel || 'Transmissão disponível na MyTV'}</span><button onClick={goToPlans}>Assistir →</button></footer></article>)}</div></section>
}

function ChannelWall() {
  const [channels, setChannels] = useState(fallbackChannels)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_BASE}/site_channels.php`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('canais indisponíveis')))
      .then(payload => { if (Array.isArray(payload.channels) && payload.channels.length) setChannels(payload.channels) })
      .catch(() => {})
    return () => controller.abort()
  }, [])
  const imageUrl = (channel) => {
    const value = String(channel.poster || '').trim()
    if (!value) return ''
    try { return new URL(value, `${API_BASE}/`).href } catch { return '' }
  }
  const canonical = channels.filter(channel => !/(?:\+|\s)\d+\s*$/u.test(String(channel.name || '')) && imageUrl(channel))
  const catalog = canonical.length >= 3 ? canonical : fallbackChannels
  const rows = [0, 1, 2].map(row => catalog.filter((_, index) => index % 3 === row))
  return <section className="channel-wall-section"><div className="channel-wall-heading"><p className="eyebrow">CANAIS QUE VOCÊ GOSTA</p><h2>Uma TV que nunca<br />fica parada.</h2><p>Uma seleção viva de canais, categorias e conteúdos para você explorar no seu ritmo.</p></div><div className="channel-wall" aria-label="Canais disponíveis na MyTV">{rows.map((row, index) => <div className={`channel-track row-${index + 1}`} key={index}>{Array.from({ length: 8 }, () => row).flat().map((channel, itemIndex) => <div className="channel-tile" key={`${channel.id}-${itemIndex}`}><img src={imageUrl(channel)} alt={channel.name} onError={(event) => { event.currentTarget.closest('.channel-tile')?.remove() }} /></div>)}</div>)}</div><button className="primary wall-cta" onClick={goToPlans}>Conhecer a MyTV <span>→</span></button></section>
}

function Landing({ setPortal, officialPlans }) {
  const [browse, setBrowse] = useState('')
  if (browse) return <BrowsePage kind={browse} onBack={() => setBrowse('')} officialPlans={officialPlans} />
  return <><section className="hero"><div className="hero-copy"><p className="eyebrow">MYTV · DO SEU JEITO</p><h1>Uma TV completa.<br /><em>Uma experiência só sua.</em></h1><p className="lead">Canais ao vivo, filmes, séries e esportes em uma experiência rápida, elegante e feita para a sua TV.</p><div className="hero-actions"><button className="primary" onClick={() => document.querySelector('#planos').scrollIntoView({ behavior: 'smooth' })}>Começar agora <span>→</span></button><button className="text-button" onClick={() => document.querySelector('#recursos').scrollIntoView({ behavior: 'smooth' })}>Conheça a MyTV <span>↓</span></button></div><div className="trust"><span>✦</span><p><b>Feito para TV</b><small>Experiência pensada para o controle remoto.</small></p></div></div><div className="hero-visual"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><LiveMock /></div></section>
  <section id="recursos" className="features section"><div className="section-heading"><p className="eyebrow">TUDO EM UM SÓ LUGAR</p><h2>Mais conteúdo.<br />Menos complicação.</h2><p>A MyTV organiza tudo que você gosta em uma navegação simples e rápida.</p></div><FeatureCards onOpen={setBrowse} /></section>
  <ChannelWall />
  <SportsAgenda />
  <section id="planos" className="plans section"><div className="section-heading centered"><p className="eyebrow">ESCOLHA SEU TEMPO</p><h2>Uma assinatura simples.</h2><p>Escolha o plano que funciona melhor para você. Sem fidelidade e com renovação prática.</p></div><div className="plan-grid">{officialPlans.map(plan => <article className={`plan ${plan.featured ? 'featured' : ''}`} key={plan.id || plan.name}>{plan.featured && <span className="best">MAIS ESCOLHIDO</span>}<h3>{plan.name}</h3><p>{plan.note}</p><div className="price"><sup>R$</sup><b>{plan.price}</b></div><small>acesso MyTV</small><button className={plan.featured ? 'primary' : 'outline'} onClick={() => setPortal(true)}>Escolher plano <span>→</span></button></article>)}</div></section>
  <section className="cta section"><div><p className="eyebrow">PRONTO PARA COMEÇAR?</p><h2>Sua próxima tela favorita<br />começa aqui.</h2></div><button className="primary" onClick={() => setPortal(true)}>Acessar minha conta <span>→</span></button></section>
  <footer><Brand /><p>© {new Date().getFullYear()} MyTV. Todos os direitos reservados.</p><div><a href="#">Termos</a><a href="#">Privacidade</a><a href="#">Suporte</a></div></footer></>
}

function Portal({ setPortal, officialPlans }) {
  const [tab, setTab] = useState('inicio'); const [notice, setNotice] = useState('')
  const action = (message) => { setNotice(message); setTimeout(() => setNotice(''), 3500) }
  return <main className="portal"><aside className="portal-side"><Brand /><div className="account"><span className="avatar large">A</span><div><b>Olá, Antonio</b><small>ID MyTV #41758333</small></div></div>{[['inicio','Visão geral'],['planos','Planos e renovação'],['dados','Meus dados'],['ajuda','Ajuda e suporte']].map(([id, label]) => <button key={id} className={tab === id ? 'selected' : ''} onClick={() => setTab(id)}><span>{id === 'inicio' ? '⌂' : id === 'planos' ? '◇' : id === 'dados' ? '◌' : '?'}</span>{label}</button>)}<button className="back" onClick={() => setPortal(false)}>← Voltar ao site</button></aside><section className="portal-main"><header><div><p className="eyebrow">MINHA CONTA</p><h1>{tab === 'inicio' ? 'Olá, Antonio.' : tab === 'planos' ? 'Planos e renovação' : tab === 'dados' ? 'Meus dados' : 'Estamos aqui para ajudar'}</h1></div><span className="avatar">A</span></header>{notice && <div className="toast">✓ {notice}</div>}{tab === 'inicio' && <><section className="status-card"><div><span className="active-dot">● Acesso ativo</span><h2>Seu acesso vai até<br /><em>30 de setembro.</em></h2><p>Renove antes do vencimento para continuar aproveitando.</p></div><button className="primary" onClick={() => setTab('planos')}>Renovar agora →</button></section><div className="account-grid"><article><small>PLANO ATUAL</small><h3>MyTV Trimestral</h3><p>3 telas simultâneas</p><button className="text-button" onClick={() => setTab('planos')}>Gerenciar plano →</button></article><article><small>PRÓXIMO VENCIMENTO</small><h3>30 set. 2026</h3><p>Faltam 3 dias</p><button className="text-button" onClick={() => setTab('planos')}>Renovar acesso →</button></article></div></>}{tab === 'planos' && <div className="portal-plans">{officialPlans.map(plan => <article className={plan.featured ? 'featured' : ''} key={plan.id || plan.name}><h3>{plan.name}</h3><p>{plan.note}</p><b>R$ {plan.price}</b><button className="primary" onClick={() => action(`Pedido de ${plan.name} iniciado. Escolha o PIX na próxima etapa.`)}>Renovar com PIX →</button></article>)}</div>}{tab === 'dados' && <form className="profile-form" onSubmit={(event) => { event.preventDefault(); action('Dados salvos com segurança.') }}><label>Nome<input defaultValue="Antonio" /></label><label>E-mail<input type="email" defaultValue="antonio@email.com" /></label><label>Telefone<input defaultValue="(00) 00000-0000" /></label><button className="primary">Salvar alterações →</button></form>}{tab === 'ajuda' && <section className="support-card"><h2>Precisa de ajuda?</h2><p>Fale com a equipe MyTV para tirar dúvidas sobre acesso, renovação ou sua TV.</p><button className="primary" onClick={() => action('O atendimento será aberto pelo WhatsApp.')}>Abrir atendimento →</button></section>}</section></main>
}

function App() { const [portal, setPortal] = useState(location.pathname.startsWith('/minha-conta')); const officialPlans = useOfficialPlans(); return <><Header portal={portal} setPortal={setPortal} />{portal ? <Portal setPortal={setPortal} officialPlans={officialPlans} /> : <Landing setPortal={setPortal} officialPlans={officialPlans} />}</> }
createRoot(document.getElementById('root')).render(<App />)
