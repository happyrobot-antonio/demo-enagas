import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import Emergencies from './pages/Emergencies'
import Searches from './pages/Searches'
import PRL from './pages/PRL'
import { SocketProvider } from './context/SocketContext'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/emergencies" element={<Emergencies />} />
              <Route path="/searches" element={<Searches />} />
              <Route path="/prl" element={<PRL />} />
            </Routes>
          </Layout>
        </Router>
      </SocketProvider>
    </ThemeProvider>
  )
}

export default App
