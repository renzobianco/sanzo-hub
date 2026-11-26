import { useEffect, useMemo, useState } from 'react'
import { useApp } from './context/AppContext.jsx'
import { Sidebar, BottomNav, TopBar, BackupBanner, UserPicker, useDocumentTitle } from './components/layout/Layout.jsx'
import { Toast } from './components/ui/Primitives.jsx'
import { IconHome, IconTag, IconReceipt, IconBox, IconChart, IconShip, IconTarget, IconUsers, IconCalendar, IconSettings, IconNote, IconSend, IconTrendUp } from './components/ui/Icons.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Ventas from './pages/Ventas.jsx'
import Gastos from './pages/Gastos.jsx'
import Productos from './pages/Productos.jsx'
import Graficos from './pages/Graficos.jsx'
import Pedidos from './pages/Pedidos.jsx'
import Objetivos from './pages/Objetivos.jsx'
import Clientes from './pages/Clientes.jsx'
import Calendario from './pages/Calendario.jsx'
import Ajustes from './pages/Ajustes.jsx'
import Notas from './pages/Notas.jsx'
import PedidosWeb from './pages/PedidosWeb.jsx'
import Ads from './pages/Ads.jsx'
import { applyMenuLayout } from './lib/menu.js'
import { MenuEditor } from './components/layout/MenuEditor.jsx'

const NAV = [
  { key: 'dashboard', label: 'Inicio', icon: IconHome, page: Dashboard },
  { key: 'ventas', label: 'Ventas', icon: IconTag, page: Ventas },
  { key: 'web', label: 'Pedidos web', short: 'Web', icon: IconSend, page: PedidosWeb },
  { key: 'gastos', label: 'Gastos', icon: IconReceipt, page: Gastos },
  { key: 'productos', label: 'Productos y stock', short: 'Stock', icon: IconBox, page: Productos },
  { key: 'calendario', label: 'Calendario', icon: IconCalendar, page: Calendario },
  { key: 'notas', label: 'Notas', icon: IconNote, page: Notas },
  { key: 'ads', label: 'Ads y estadísticas', short: 'Ads', icon: IconTrendUp, page: Ads },
  { key: 'graficos', label: 'Gráficos', icon: IconChart, page: Graficos },
  { key: 'pedidos', label: 'Pedidos a China', short: 'Pedidos', icon: IconShip, page: Pedidos },
  { key: 'objetivos', label: 'Objetivos y fases', short: 'Objetivos', icon: IconTarget, page: Objetivos },
  { key: 'clientes', label: 'Clientes', icon: IconUsers, page: Clientes },
  { key: 'ajustes', label: 'Ajustes', icon: IconSettings, page: Ajustes },
]

function readHash() {
  const h = window.location.hash.replace('#', '')
  return NAV.some((n) => n.key === h) ? h : 'dashboard'
}

export default function App() {
  const { state, toast } = useApp()
  const [current, setCurrent] = useState(readHash)
  const [editMenu, setEditMenu] = useState(false)
  const user = state.settings.currentUser
  const layout = state.settings.navLayout?.[user]
  const nav = useMemo(() => applyMenuLayout(NAV, layout), [layout])

  useEffect(() => {
    const onHash = () => setCurrent(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = (key) => {
    window.location.hash = key
    setCurrent(key)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const item = nav.find((n) => n.key === current) || nav[0]
  useDocumentTitle(item.label)

  if (!state.settings.currentUser) {
    return (
      <>
        <UserPicker />
        <Toast toast={toast} />
      </>
    )
  }

  const Page = item.page
  return (
    <div className="app-shell">
      <Sidebar items={nav} current={current} onNavigate={navigate} onEditMenu={() => setEditMenu(true)} />
      <div className="main">
        <TopBar title={item.label} accent={item.color} />
        <main className="page" key={current}>
          <BackupBanner />
          <Page navigate={navigate} />
        </main>
      </div>
      <BottomNav items={nav} current={current} onNavigate={navigate} onEditMenu={() => setEditMenu(true)} />
      <MenuEditor open={editMenu} onClose={() => setEditMenu(false)} baseItems={NAV} />
      <Toast toast={toast} />
    </div>
  )
}
