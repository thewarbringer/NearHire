import Navbar from './components/Navbar'
import './App.css'
import Home from './pages/Home'
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen bg-[#07080a] text-[#f0ede8] overflow-x-hidden">
      
      <BrowserRouter>
      <Routes>
            <Route
              path="/"
              element={
                  <Home />
              }
            />
            <Route
              path="/registerUser"
              element={
                  <Home />
              }
            />
            <Route
              path="signinUser"
              element={
                  <Home />
              }
            />
            <Route
              path="/registerWorker"
              element={
                  <Home />
              }
            />
            <Route
              path="signinWorker"
              element={
                  <Home />
              }
            />
            <Route
              path="userDashboard"
              element={
                  <Home />
              }
            />
            <Route
              path="workerDasboard"
              element={
                  <Home />
              }
            />
      </Routes>
      </BrowserRouter>
      </div>
  )
}

export default App
