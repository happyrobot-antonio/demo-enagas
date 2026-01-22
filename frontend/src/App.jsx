import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import Emergencies from './pages/Emergencies'
import Calls from './pages/Calls'
import Searches from './pages/Searches'
import Transfers from './pages/Transfers'
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
              <Route path="/calls" element={<Calls />} />
              <Route path="/searches" element={<Searches />} />
              <Route path="/transfers" element={<Transfers />} />
            </Routes>
          </Layout>
        </Router>
      </SocketProvider>
    </ThemeProvider>
  )
}

export default App
