import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './brand.css'

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
    fetch(`${API_BASE}/channels.php?limit=30`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('canais indisponíveis')))
      .then(payload => { if (Array.isArray(payload.channels) && payload.channels.length) setChannels(payload.channels) })
      .catch(() => {})
    return () => controller.abort()
  }, [])
  const rows = [0, 1, 2].map(row => channels.filter((_, index) => index % 3 === row))
  const imageUrl = (channel) => {
    const value = String(channel.poster || '').trim()
    if (!value) return ''
    try { return new URL(value, `${API_BASE}/`).href } catch { return '' }
  }
  return <section className="channel-wall-section"><div className="channel-wall-heading"><p className="eyebrow">CANAIS QUE VOCÊ GOSTA</p><h2>Uma TV que nunca<br />fica parada.</h2><p>Uma seleção viva de canais, categorias e conteúdos para você explorar no seu ritmo.</p></div><div className="channel-wall" aria-label="Canais disponíveis na MyTV">{rows.map((row, index) => <div className={`channel-track row-${index + 1}`} key={index}>{[...row, ...row].map((channel, itemIndex) => <div className="channel-tile" key={`${channel.id}-${itemIndex}`}>{imageUrl(channel) ? <img src={imageUrl(channel)} alt={channel.name} onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.nextElementSibling.hidden = false }} /> : null}<span hidden={Boolean(imageUrl(channel))}>{channel.name}</span></div>)}</div>)}</div><button className="primary wall-cta" onClick={goToPlans}>Conhecer a MyTV <span>→</span></button></section>
}

function Landing({ setPortal }) {
  return <><section className="hero"><div className="hero-copy"><p className="eyebrow">MYTV · DO SEU JEITO</p><h1>Uma TV completa.<br /><em>Uma experiência só sua.</em></h1><p className="lead">Canais ao vivo, filmes, séries e esportes em uma experiência rápida, elegante e feita para a sua TV.</p><div className="hero-actions"><button className="primary" onClick={() => document.querySelector('#planos').scrollIntoView({ behavior: 'smooth' })}>Começar agora <span>→</span></button><button className="text-button" onClick={() => document.querySelector('#recursos').scrollIntoView({ behavior: 'smooth' })}>Conheça a MyTV <span>↓</span></button></div><div className="trust"><span>✦</span><p><b>Feito para TV</b><small>Experiência pensada para o controle remoto.</small></p></div></div><div className="hero-visual"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><LiveMock /></div></section>
  <section id="recursos" className="features section"><div className="section-heading"><p className="eyebrow">TUDO EM UM SÓ LUGAR</p><h2>Mais conteúdo.<br />Menos complicação.</h2><p>A MyTV organiza tudo que você gosta em uma navegação simples e rápida.</p></div><div className="feature-grid"><article className="feature-card violet"><Icon>▣</Icon><h3>TV ao vivo</h3><p>Canais organizados por categoria, com programação atual e navegação instantânea.</p><span>Explorar canais →</span></article><article className="feature-card blue"><Icon>◉</Icon><h3>Filmes e séries</h3><p>Encontre algo novo ou continue exatamente de onde parou.</p><span>Ver catálogo →</span></article><article className="feature-card orange"><Icon>◈</Icon><h3>Esportes</h3><p>Partidas, campeonatos e várias opções de transmissão quando disponíveis.</p><span>Ver agenda →</span></article></div></section>
  <ChannelWall />
  <SportsAgenda />
  <section id="planos" className="plans section"><div className="section-heading centered"><p className="eyebrow">ESCOLHA SEU TEMPO</p><h2>Uma assinatura simples.</h2><p>Escolha o plano que funciona melhor para você. Sem fidelidade e com renovação prática.</p></div><div className="plan-grid">{plans.map(plan => <article className={`plan ${plan.featured ? 'featured' : ''}`} key={plan.name}>{plan.featured && <span className="best">MAIS ESCOLHIDO</span>}<h3>{plan.name}</h3><p>{plan.note}</p><div className="price"><sup>R$</sup><b>{plan.price}</b></div><small>acesso MyTV</small><button className={plan.featured ? 'primary' : 'outline'} onClick={() => setPortal(true)}>Escolher plano <span>→</span></button></article>)}</div></section>
  <section className="cta section"><div><p className="eyebrow">PRONTO PARA COMEÇAR?</p><h2>Sua próxima tela favorita<br />começa aqui.</h2></div><button className="primary" onClick={() => setPortal(true)}>Acessar minha conta <span>→</span></button></section>
  <footer><Brand /><p>© {new Date().getFullYear()} MyTV. Todos os direitos reservados.</p><div><a href="#">Termos</a><a href="#">Privacidade</a><a href="#">Suporte</a></div></footer></>
}

function Portal({ setPortal }) {
  const [tab, setTab] = useState('inicio'); const [notice, setNotice] = useState('')
  const action = (message) => { setNotice(message); setTimeout(() => setNotice(''), 3500) }
  return <main className="portal"><aside className="portal-side"><Brand /><div className="account"><span className="avatar large">A</span><div><b>Olá, Antonio</b><small>ID MyTV #41758333</small></div></div>{[['inicio','Visão geral'],['planos','Planos e renovação'],['dados','Meus dados'],['ajuda','Ajuda e suporte']].map(([id, label]) => <button key={id} className={tab === id ? 'selected' : ''} onClick={() => setTab(id)}><span>{id === 'inicio' ? '⌂' : id === 'planos' ? '◇' : id === 'dados' ? '◌' : '?'}</span>{label}</button>)}<button className="back" onClick={() => setPortal(false)}>← Voltar ao site</button></aside><section className="portal-main"><header><div><p className="eyebrow">MINHA CONTA</p><h1>{tab === 'inicio' ? 'Olá, Antonio.' : tab === 'planos' ? 'Planos e renovação' : tab === 'dados' ? 'Meus dados' : 'Estamos aqui para ajudar'}</h1></div><span className="avatar">A</span></header>{notice && <div className="toast">✓ {notice}</div>}{tab === 'inicio' && <><section className="status-card"><div><span className="active-dot">● Acesso ativo</span><h2>Seu acesso vai até<br /><em>30 de setembro.</em></h2><p>Renove antes do vencimento para continuar aproveitando.</p></div><button className="primary" onClick={() => setTab('planos')}>Renovar agora →</button></section><div className="account-grid"><article><small>PLANO ATUAL</small><h3>MyTV Trimestral</h3><p>3 telas simultâneas</p><button className="text-button" onClick={() => setTab('planos')}>Gerenciar plano →</button></article><article><small>PRÓXIMO VENCIMENTO</small><h3>30 set. 2026</h3><p>Faltam 3 dias</p><button className="text-button" onClick={() => setTab('planos')}>Renovar acesso →</button></article></div></>}{tab === 'planos' && <div className="portal-plans">{plans.map(plan => <article className={plan.featured ? 'featured' : ''} key={plan.name}><h3>{plan.name}</h3><p>{plan.note}</p><b>R$ {plan.price}</b><button className="primary" onClick={() => action(`Pedido de ${plan.name} iniciado. Escolha o PIX na próxima etapa.`)}>Renovar com PIX →</button></article>)}</div>}{tab === 'dados' && <form className="profile-form" onSubmit={(event) => { event.preventDefault(); action('Dados salvos com segurança.') }}><label>Nome<input defaultValue="Antonio" /></label><label>E-mail<input type="email" defaultValue="antonio@email.com" /></label><label>Telefone<input defaultValue="(00) 00000-0000" /></label><button className="primary">Salvar alterações →</button></form>}{tab === 'ajuda' && <section className="support-card"><h2>Precisa de ajuda?</h2><p>Fale com a equipe MyTV para tirar dúvidas sobre acesso, renovação ou sua TV.</p><button className="primary" onClick={() => action('O atendimento será aberto pelo WhatsApp.')}>Abrir atendimento →</button></section>}</section></main>
}

function App() { const [portal, setPortal] = useState(location.pathname.startsWith('/minha-conta')); return <><Header portal={portal} setPortal={setPortal} />{portal ? <Portal setPortal={setPortal} /> : <Landing setPortal={setPortal} />}</> }
createRoot(document.getElementById('root')).render(<App />)
