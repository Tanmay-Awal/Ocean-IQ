import './App.css';
import Main from './components/Sidebar/Main/Main';
import Sidebar from './components/Sidebar/Sidebar';
import { Routes, Route } from 'react-router-dom';
import UserProfileHeader from './components/UserHeader';
import Intro from './components/Intro';

function App() {
  return(
    <Routes>
      <Route path="/" element={<UserProfileHeader />} />
      <Route path="/chat" element={
        <div className="app-container">
          <Sidebar />
          <Main />
        </div>
      } />
      <Route path="/intro" element={<Intro />} />
    </Routes>
  )
}

export default App;