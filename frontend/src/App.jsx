import './App.css'
import Main from './pages/Main';
import Register from './pages/Register'
import RegisterWorker from './pages/RegisterWorker'
import LoginUser from './pages/LoginUser'
import LoginWorker from './pages/LoginWorker'
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
              path="/LoginUser"
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
                  <Main />
              }
            />
            <Route
              path="workerDasboard"
              element={
                  <Main/>
              }
            />
      </Routes>
      </BrowserRouter>
      </div>
  )
}

export default App
