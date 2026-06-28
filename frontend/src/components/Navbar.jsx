import { Link } from "react-router-dom";

function Navbar() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const dashboardLink = token ? (role === 'worker' ? '/workerDashboard' : '/userDashboard') : null;
  const dashboardLabel = role === 'worker' ? 'Worker Dashboard' : 'Dashboard';

  return (
    <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-white/5 bg-[#07080a]/90 px-6 py-4 text-sm text-white backdrop-blur-xl sm:px-8 lg:px-16">
      <div className="font-black tracking-[0.12em] text-white">
        NEAR<em className="ml-1 font-normal text-[#C21A4B] not-italic">HIRE</em>
      </div>

      <div className="hidden items-center gap-8 text-[#d9d7d2] md:flex">
        <a className="transition hover:text-white" href="#how">How it works</a>
        <a className="transition hover:text-white" href="#features">Features</a>
        <a className="transition hover:text-white" href="#roles">For everyone</a>
        <a className="transition hover:text-white" href="#surge">Surge pricing</a>
      </div>

      <div className="flex items-center gap-3">
        {dashboardLink ? (
          <Link
            to={dashboardLink}
            className="rounded-full bg-[#C21A4B] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#A1133C]"
          >
            {dashboardLabel}
          </Link>
        ) : (
          <>
            <Link
              to="/signinUser"
              className="rounded-full border border-white/10 bg-transparent px-4 py-2 text-xs text-[#d9d7d2] transition hover:border-[#d9d7d2] hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/signinWorker"
              className="rounded-full bg-[#C21A4B] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#A1133C]"
            >
              Get to Work →
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar;