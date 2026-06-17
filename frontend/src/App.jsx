import './App.css'
import Main from './pages/Main.jsx'
import Register from './pages/Register'
import RegisterWorker from './pages/RegisterWorker'
import LoginUser from './pages/LoginUser'
import LoginWorker from './pages/LoginWorker'
import UserDashboard from './pages/UserDashboard'
import WorkerDashboard from './pages/WorkerDashboard'
import ManageJob from './pages/ManageJob'
import SeeJobs from './pages/SeeJobs'
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
              path="/manageJob/:jobId"
              element={
                  <ManageJob />
              }
            />
            <Route
              path="/workerDashboard"
              element={
                  <WorkerDashboard />
              }
            />
            <Route
              path="/workerJobs"
              element={
                  <SeeJobs />
              }
            />
      </Routes>
      </BrowserRouter>
      </div>
  )
}

export default App
