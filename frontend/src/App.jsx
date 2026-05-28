import './App.css'
import Main from './pages/Main.jsx'
import Register from './pages/Register'
import RegisterWorker from './pages/RegisterWorker'
import LoginUser from './pages/LoginUser'
import LoginWorker from './pages/LoginWorker'
import UserDashboard from './pages/UserDashboard'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="min-h-screen bg-[#07080a] text-[#f0ede8] overflow-x-hidden">
      
      <BrowserRouter>
      <Routes>
            <Route
              path="/"
              element={
                  <Main />
              }
            />
            <Route
              path="/registerUser"
              element={
                <>
                  <Navbar />
                  <Register />
                </>
              }
            />
            <Route
              path="/signinUser"
              element={
                <LoginUser />
              }
            />
            <Route
              path="/registerWorker"
              element={
                  <RegisterWorker />
              }
            />
            <Route
              path="/signinWorker"
              element={
                  <LoginWorker />
              }
            />
            <Route
              path="/userDashboard"
              element={
                  <UserDashboard />
              }
            />
            <Route
              path="workerDasboard"
              element={
                  < Main/>
              }
            />
      </Routes>
      </BrowserRouter>
      </div>
  )
}

export default App
