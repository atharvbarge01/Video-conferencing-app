
import './App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Authentication from './pages/Authentication';
import { AuthProvider } from './contexts/AuthContext';
import VideoMeeting from './pages/VideoMeeting';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <div className="App">

      <Router>

        <AuthProvider>

          <Routes>

            <Route path='/' element={<LandingPage />} />
            <Route path='/auth' element={<Authentication />} />

            <Route path='/dashboard' element={<Dashboard />} />

            <Route path='/:url' element={<VideoMeeting />} />

          </Routes>
        </AuthProvider>

      </Router>
    </div>
  );
}

export default App;
