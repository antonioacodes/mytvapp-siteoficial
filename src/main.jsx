import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './brand.css'
import './channel-wall.css'
import './catalog.css'

function FeatureIcon({ type }) {
  if (type === 'live') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
  if (type === 'vod') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" /><path d="m10 9 5 3-5 3Z" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 15 5l3.3-.2.8 3.1 2.5 2.1-1.6 2.9.2 3.3-3.1.8-2.1 2.5-2.9-1.6-2.9 1.6-2.1-2.5-3.1-.8.2-3.3L2.4 10l2.5-2.1.8-3.1L9 5Z" /><path d="m9 8 6 8M15 8l-6 8" /></svg>
}
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
].map(([id, name], index) => ({
  id: `fallback-${id}`,
  name,
  poster: `https://embedcanaisdetv.com/images/${id}.png`,
  categories: index < 6 ? ['Canais abertos'] : index < 12 ? ['Esportes'] : ['Filmes e séries']
}))

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
    ['live', 'TV ao vivo', 'Canais organizados por categoria, com programação atual e navegação instantânea.', 'Explorar canais', 'violet'],
    ['vod', 'Filmes e séries', 'Encontre algo novo ou continue exatamente de onde parou.', 'Ver catálogo', 'blue'],
    ['sports', 'Esportes', 'Partidas, campeonatos e várias opções de transmissão quando disponíveis.', 'Ver agenda', 'orange']
  ]
  return <div className="feature-grid">{cards.map(([id, title, description, action, tone]) => <article className={`feature-card ${tone}`} key={id} onClick={() => onOpen(id)}><span className="feature-icon"><FeatureIcon type={id} /></span><h3>{title}</h3><p>{description}</p><button type="button" onClick={() => onOpen(id)}>{action} <span>→</span></button></article>)}</div>
}

function BrowsePage({ kind, onBack, officialPlans }) {
  const [channels, setChannels] = useState(fallbackChannels)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [query, setQuery] = useState('')
  const { catalog, sports } = useShowcaseData()
  useEffect(() => {
    if (kind !== 'live') return
    const controller = new AbortController()
    fetch(`${API_BASE}/site_channels.php`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(payload => { if (Array.isArray(payload?.channels) && payload.channels.length) setChannels(payload.channels) })
      .catch(() => {})
    return () => controller.abort()
  }, [kind])
  const goPlans = () => document.querySelector('#planos')?.scrollIntoView({ behavior: 'smooth' })
  if (kind === 'sports') return <><SportsAgenda /><section id="planos" className="plans section"><PlanGrid plans={officialPlans} onChoose={goPlans} /></section></>
  if (kind === 'live') {
    const categories = ['Todos', ...new Set(channels.flatMap(channel => channel.categories || []))]
    const visible = activeCategory === 'Todos' ? channels : channels.filter(channel => (channel.categories || []).includes(activeCategory))
    return <main className="browse-page"><p className="eyebrow">TV AO VIVO</p><h1>Escolha um canal<br />e aproveite a MyTV.</h1><div className="browse-tabs">{categories.slice(0, 14).map(category => <button className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)} key={category}>{category}</button>)}</div><div className="public-channel-grid">{visible.slice(0, 80).map(channel => <button className="public-channel" onClick={goPlans} key={channel.id}><img src={channel.poster} alt={channel.name} onError={(event) => { event.currentTarget.src = '/assets/mytv-logo.png' }} /></button>)}</div><section id="planos" className="plans section"><PlanGrid plans={officialPlans} onChoose={goPlans} /></section></main>
  }
  const sections = useMemo(() => [...Object.entries(catalog?.movies || {}), ...Object.entries(catalog?.series || {})]
    .sort(() => Math.random() - 0.5).slice(0, 7), [catalog])
  const platforms = ['Netflix', 'Prime Video', 'Disney+', 'Max', 'Apple TV+', 'Globoplay']
  return <main className="browse-page vod-browse"><p className="eyebrow">FILMES E SÉRIES</p><h1>Encontre o próximo<br />título para maratonar.</h1><button className="search-cta" onClick={goPlans}>⌕ Pesquise filmes, séries e muito mais <span>→</span></button><section className="platforms"><p>CATÁLOGO COMPLETO DISPONÍVEL DE</p><div>{platforms.map(platform => <button key={platform} onClick={goPlans}>{platform}</button>)}</div></section><div className="vod-collections">{sections.map(([key, items], index) => <section className="vod-row" key={`${key}-${index}`}><h2>{readableCollection(key)}</h2><div>{(items || []).slice(0, 10).map(item => <button className="vod-poster" key={`${key}-${item.id}`} onClick={goPlans}>{item.poster_url && <img src={item.poster_url} alt={item.title} />}<span>{item.title}</span></button>)}</div></section>)}</div><div className="catalog-fade"><button className="primary" onClick={goPlans}>Ver planos e assistir <span>→</span></button></div><section id="planos" className="plans section"><PlanGrid plans={officialPlans} onChoose={goPlans} /></section></main>
}

const planBenefits = ['Canais de TV em 4K, UHD, FHD e HD', 'Mais de 200 mil filmes e séries', 'Principais eventos esportivos do mundo', 'Avaliações IMDb, Metacritic e muito mais', 'Catálogo completo das principais plataformas', 'Sistema anti-travamento', '2 telas simultâneas']

function PlanCard({ plan, onChoose }) { return <article className={`plan ${plan.featured ? 'featured' : ''}`}>{plan.featured && <span className="best">MAIS ESCOLHIDO</span>}<h3>{plan.name}</h3><p>{plan.note}</p><div className="price"><sup>R$</sup><b>{plan.price}</b></div><small>acesso MyTV</small><ul className="plan-benefits">{planBenefits.map(benefit => <li key={benefit}>✓ <span>{benefit}</span></li>)}</ul><button className={plan.featured ? 'primary' : 'outline'} onClick={() => onChoose(plan)}>Escolher plano <span>→</span></button></article> }

function PlanGrid({ plans, onChoose }) { return <><div className="section-heading centered"><p className="eyebrow">ESCOLHA SEU TEMPO</p><h2>Uma assinatura simples.</h2><p>Escolha o plano que funciona melhor para você.</p></div><div className="plan-grid">{plans.map(plan => <PlanCard plan={plan} onChoose={onChoose} key={plan.id || plan.name} />)}</div></> }

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
  const canonical = channels.filter(channel => !/^disney\s*\+?\s*\d+\s*$/iu.test(String(channel.name || '')) && imageUrl(channel))
  const catalog = useMemo(() => {
    const items = [...(canonical.length >= 3 ? canonical : fallbackChannels)]
    // Fisher–Yates: evita padrões visuais e preserva cada canal uma única vez
    // antes de a animação começar o próximo ciclo.
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1))
      ;[items[index], items[swapIndex]] = [items[swapIndex], items[index]]
    }
    return items
  }, [channels])
  // Cada trilha percorre a grade inteira, começando em pontos diferentes. Assim a
  // vitrine mostra a variedade real antes de repetir qualquer canal.
  const rows = [0, 1, 2].map(row => {
    const offset = Math.floor((catalog.length * row) / 3)
    return [...catalog.slice(offset), ...catalog.slice(0, offset)]
  })
  return <section className="channel-wall-section"><div className="channel-wall-heading"><p className="eyebrow">CANAIS QUE VOCÊ GOSTA</p><h2>Uma TV que nunca<br />fica parada.</h2><p>Uma seleção viva de canais, categorias e conteúdos para você explorar no seu ritmo.</p></div><div className="channel-wall" aria-label="Canais disponíveis na MyTV">{rows.map((row, index) => <div className={`channel-track row-${index + 1}`} key={index}>{[...row, ...row].map((channel, itemIndex) => <div className="channel-tile" key={`${channel.id}-${itemIndex}`}><img src={imageUrl(channel)} alt={channel.name} onError={(event) => { event.currentTarget.closest('.channel-tile')?.remove() }} /></div>)}</div>)}</div><button className="primary wall-cta" onClick={goToPlans}>Conhecer a MyTV <span>→</span></button></section>
}

function Landing({ setPortal, officialPlans, onChoosePlan }) {
  const [browse, setBrowse] = useState('')
  if (browse) return <BrowsePage kind={browse} onBack={() => setBrowse('')} officialPlans={officialPlans} />
  return <><section className="hero"><div className="hero-copy"><p className="eyebrow">MYTV · DO SEU JEITO</p><h1>Uma TV completa.<br /><em>Uma experiência só sua.</em></h1><p className="lead">Canais ao vivo, filmes, séries e esportes em uma experiência rápida, elegante e feita para a sua TV.</p><div className="hero-actions"><button className="primary" onClick={() => document.querySelector('#planos').scrollIntoView({ behavior: 'smooth' })}>Começar agora <span>→</span></button><button className="text-button" onClick={() => document.querySelector('#recursos').scrollIntoView({ behavior: 'smooth' })}>Conheça a MyTV <span>↓</span></button></div><div className="trust"><span>✦</span><p><b>Feito para TV</b><small>Experiência pensada para o controle remoto.</small></p></div></div><div className="hero-visual"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><LiveMock /></div></section>
  <section id="recursos" className="features section"><div className="section-heading"><p className="eyebrow">TUDO EM UM SÓ LUGAR</p><h2>Mais conteúdo.<br />Menos complicação.</h2><p>A MyTV organiza tudo que você gosta em uma navegação simples e rápida.</p></div><FeatureCards onOpen={setBrowse} /></section>
  <ChannelWall />
  <SportsAgenda />
  <section id="planos" className="plans section"><PlanGrid plans={officialPlans} onChoose={onChoosePlan} /></section>
  <section className="cta section"><div><p className="eyebrow">PRONTO PARA COMEÇAR?</p><h2>Sua próxima tela favorita<br />começa aqui.</h2></div><button className="primary" onClick={() => setPortal(true)}>Acessar minha conta <span>→</span></button></section>
  <footer><Brand /><p>© {new Date().getFullYear()} MyTV. Todos os direitos reservados.</p><div><a href="#">Termos</a><a href="#">Privacidade</a><a href="#">Suporte</a></div></footer></>
}

async function siteAccount(action, payload = {}, token = '') {
  const response = await fetch(`${API_BASE}/site_account.php`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ action, ...payload })
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.success) throw new Error(data.message || 'Não foi possível concluir esta ação agora.')
  return data
}

function Portal({ setPortal, officialPlans, selectedPlan, onChoosePlan }) {
  const [step, setStep] = useState('id')
  const [accountId, setAccountId] = useState('')
  const [password, setPassword] = useState('')
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', password: '' })
  const [cpf, setCpf] = useState('')
  const [token, setToken] = useState(() => sessionStorage.getItem('mytv_site_token') || '')
  const [account, setAccount] = useState(null)
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const plan = selectedPlan || officialPlans.find(item => item.featured) || officialPlans[0]

  const run = async (task) => { setLoading(true); setError(''); try { await task() } catch (err) { setError(err.message) } finally { setLoading(false) } }
  const saveToken = (value) => { sessionStorage.setItem('mytv_site_token', value); setToken(value) }
  const continueAfterAuth = async (value) => {
    saveToken(value)
    const response = await siteAccount('me', {}, value)
    setAccount(response.account)
    setStep(plan?.id ? 'payment' : 'plans')
  }
  useEffect(() => { if (!token) return; run(() => siteAccount('me', {}, token).then(response => { setAccount(response.account); setStep(plan?.id ? 'payment' : 'plans') })) }, [])

  const lookup = () => run(async () => {
    const response = await siteAccount('lookup', { account_id: accountId })
    setStep(response.needs_completion ? 'complete' : 'login')
  })
  const complete = () => run(async () => {
    const response = await siteAccount('complete_profile', { account_id: accountId, ...profile })
    await continueAfterAuth(response.token)
  })
  const login = () => run(async () => {
    const response = await siteAccount('login', { account_id: accountId, password })
    await continueAfterAuth(response.token)
  })
  const createPix = () => run(async () => {
    const response = await siteAccount('create_pix', { plan_id: plan?.id, cpf }, token)
    setPayment(response.payment)
    setStep('pix')
  })
  const choose = (item) => { onChoosePlan(item); setPayment(null); setStep('payment') }
  const copyPix = async () => { try { await navigator.clipboard.writeText(payment.pix_code); setError('Código PIX copiado.') } catch { setError('Copie o código PIX manualmente.') } }

  return <main className="checkout-page"><section className="checkout-shell"><Brand /><div className="checkout-progress"><span className={step === 'id' || step === 'login' || step === 'complete' ? 'active' : ''}>1. Conta</span><i /><span className={step === 'plans' || step === 'payment' ? 'active' : ''}>2. Pagamento</span><i /><span className={step === 'pix' ? 'active' : ''}>3. PIX</span></div>
    {error && <div className={error === 'Código PIX copiado.' ? 'checkout-notice success' : 'checkout-notice'}>{error}</div>}
    {step === 'id' && <section className="checkout-card"><p className="eyebrow">ACESSAR OU ASSINAR</p><h1>Digite o ID da sua TV.</h1><p>Você encontra esse número na tela de configurações do aplicativo MyTV.</p><label>ID MyTV<input value={accountId} onChange={event => setAccountId(event.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Ex.: 41758333" autoFocus /></label><button className="primary" disabled={loading} onClick={lookup}>{loading ? 'Verificando…' : 'Continuar'} <span>→</span></button></section>}
    {step === 'login' && <section className="checkout-card"><p className="eyebrow">BEM-VINDO DE VOLTA</p><h1>Digite sua senha.</h1><p>Conta MyTV #{accountId}</p><label>Senha<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoFocus /></label><button className="primary" disabled={loading} onClick={login}>{loading ? 'Entrando…' : 'Entrar e continuar'} <span>→</span></button><button className="link-action" onClick={() => setStep('id')}>Usar outro ID</button></section>}
    {step === 'complete' && <section className="checkout-card"><p className="eyebrow">COMPLETE SEU CADASTRO</p><h1>Proteja sua conta MyTV.</h1><p>Crie a senha e informe seus dados para vincular esta TV à sua conta.</p><div className="checkout-fields"><label>Nome completo<input value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} autoComplete="name" /></label><label>E-mail<input type="email" value={profile.email} onChange={event => setProfile({ ...profile, email: event.target.value })} autoComplete="email" /></label><label>Telefone com DDD<input value={profile.phone} onChange={event => setProfile({ ...profile, phone: event.target.value })} inputMode="tel" autoComplete="tel" /></label><label>Crie uma senha<input type="password" value={profile.password} onChange={event => setProfile({ ...profile, password: event.target.value })} autoComplete="new-password" /></label></div><button className="primary" disabled={loading} onClick={complete}>{loading ? 'Salvando…' : 'Salvar e continuar'} <span>→</span></button></section>}
    {step === 'plans' && <section className="checkout-card checkout-plans"><p className="eyebrow">ESCOLHA O SEU PLANO</p><h1>Qual plano funciona melhor para você?</h1>{officialPlans.map(item => <button className={item.featured ? 'checkout-plan featured' : 'checkout-plan'} key={item.id || item.name} onClick={() => choose(item)}><span><b>{item.name}</b><small>{item.note}</small></span><strong>R$ {item.price} →</strong></button>)}</section>}
    {step === 'payment' && <section className="checkout-card"><p className="eyebrow">FORMA DE PAGAMENTO</p><h1>Finalize com PIX.</h1><div className="selected-plan"><span>PLANO SELECIONADO</span><b>{plan?.name}</b><strong>R$ {plan?.price}</strong></div><button className="payment-method selected"><span className="pix-mark">PIX</span><span><b>PIX</b><small>Liberação automática após a confirmação.</small></span><i>✓</i></button><label>CPF do pagador<input value={cpf} onChange={event => setCpf(event.target.value)} inputMode="numeric" placeholder="000.000.000-00" /></label><button className="primary" disabled={loading} onClick={createPix}>{loading ? 'Gerando PIX…' : 'Gerar PIX'} <span>→</span></button></section>}
    {step === 'pix' && <section className="checkout-card pix-result"><p className="eyebrow">PIX GERADO</p><h1>Faça o pagamento para liberar.</h1><p>Use o QR Code no seu banco ou copie o código abaixo. A assinatura é atualizada automaticamente após a confirmação.</p>{payment?.qr_code_url && <img className="pix-qr" src={payment.qr_code_url} alt="QR Code PIX" />}<textarea value={payment?.pix_code || ''} readOnly aria-label="Código copia e cola PIX" /><button className="outline copy-pix" onClick={copyPix}>Copiar código PIX</button><small>Pagamento processado por {payment?.provider === 'veopag' ? 'VeoPag' : 'PixUp'}.</small></section>}
    <button className="checkout-back" onClick={() => setPortal(false)}>← Voltar ao site</button>
  </section></main>
}

function App() { const [portal, setPortal] = useState(location.pathname.startsWith('/minha-conta')); const [selectedPlan, setSelectedPlan] = useState(null); const officialPlans = useOfficialPlans(); const choosePlan = (plan) => { setSelectedPlan(plan); setPortal(true) }; return <><Header portal={portal} setPortal={setPortal} />{portal ? <Portal setPortal={setPortal} officialPlans={officialPlans} selectedPlan={selectedPlan} onChoosePlan={choosePlan} /> : <Landing setPortal={setPortal} officialPlans={officialPlans} onChoosePlan={choosePlan} />}</> }
createRoot(document.getElementById('root')).render(<App />)
