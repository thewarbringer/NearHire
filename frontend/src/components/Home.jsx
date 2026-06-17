import { Link } from "react-router-dom";
function Main() {
  return (
    <main className="relative bg-zinc-50 text-zinc-800 min-h-screen">
      <section className="relative overflow-hidden px-6 pt-28 pb-20 lg:px-16 xl:px-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(194,26,75,0.04),transparent_36%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(9,9,11,0.03)_1px,transparent_1px)] bg-[length:60px_60px]" />

        <div className="mx-auto flex max-w-[1200px] flex-col gap-16 lg:flex-row lg:items-center">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#C21A4B2a] bg-[#C21A4B0F] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#C21A4B]">
              <span className="h-2 w-2 rounded-full bg-[#C21A4B] animate-pulse" />
              Now live in beta — join 2,400+ workers
            </div>

            <h1 className="font-[DMSerifDisplay] text-5xl leading-[1.02] tracking-[-0.03em] text-zinc-950 sm:text-6xl lg:text-[4.75rem]">
              Book a skilled worker<br />
              <span className="text-[#C21A4B] italic">in minutes,</span><br />
              <span>not days.</span>
            </h1>

            <p className="max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
              NearHire connects you with verified, nearby workers in real time — powered by geospatial matching, smart surge pricing, and easy booking.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/registerUser" className="rounded-xl bg-[#C21A4B] px-8 py-4 text-sm font-semibold text-white transition hover:bg-[#A1133C] shadow-md hover:shadow-lg">
                Post a job →
              </Link>
              <Link to="/registerWorker" className="rounded-xl border border-zinc-200 bg-white px-8 py-4 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950 shadow-xs">
                Become a worker
              </Link>
            </div>

            <div className="flex flex-wrap gap-12 pt-10 text-sm text-zinc-600 sm:gap-14">
              <div>
                <div className="font-[DMSerifDisplay] text-4xl leading-none text-zinc-950">2.4k<span className="text-[#C21A4B]">+</span></div>
                <div className="mt-2 uppercase tracking-[0.14em] text-zinc-500 font-semibold text-xs">Verified workers</div>
              </div>
              <div>
                <div className="font-[DMSerifDisplay] text-4xl leading-none text-zinc-950">98<span className="text-[#C21A4B]">%</span></div>
                <div className="mt-2 uppercase tracking-[0.14em] text-zinc-500 font-semibold text-xs">Jobs completed</div>
              </div>
              <div>
                <div className="font-[DMSerifDisplay] text-4xl leading-none text-zinc-950">&lt;4<span className="text-[#C21A4B]">min</span></div>
                <div className="mt-2 uppercase tracking-[0.14em] text-zinc-500 font-semibold text-xs">Avg match time</div>
              </div>
            </div>
          </div>

          <div className="relative hidden xl:block xl:w-[400px]">
            <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)]">
              <div className="mx-auto mb-6 h-1.5 w-16 rounded-full bg-zinc-200" />
              <div className="rounded-[24px] bg-zinc-50/50 border border-zinc-100 p-5">
                <div className="relative overflow-hidden rounded-3xl bg-zinc-100 border border-zinc-200/50 p-4">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(194,26,75,0.06)_20%,transparent_40%)] opacity-40" />
                  <div className="h-40 rounded-3xl bg-white border border-zinc-200/40" />
                  <div className="absolute left-16 top-11 h-2 w-2 rounded-full bg-[#C21A4B]" />
                  <div className="absolute left-32 top-16 h-2 w-2 rounded-full bg-[#C21A4B]" />
                  <div className="absolute left-20 top-24 h-2 w-2 rounded-full bg-zinc-400" />
                  <svg className="absolute inset-0 opacity-25" viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="60" y1="55" x2="100" y2="62" stroke="#C21A4B" strokeWidth="1.5" />
                    <line x1="100" y1="62" x2="135" y2="77" stroke="#C21A4B" strokeWidth="1.5" />
                  </svg>
                </div>

                <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs">
                  <div className="mb-4 flex items-center justify-between text-sm text-zinc-700">
                    <span className="font-semibold text-zinc-950">Rajan M. — Plumber</span>
                    <span className="rounded-full bg-[#C21A4B]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C21A4B]">En route</span>
                  </div>
                  <div className="mb-3 text-[11px] text-zinc-500 font-medium">⭐ 4.9 · 312 jobs · 97% on time</div>
                  <div className="mb-2 flex items-center gap-2 text-[11px] text-zinc-500 font-medium"><span className="h-2 w-2 rounded-full bg-[#C21A4B]" />ETA: 8–12 min away</div>
                  <div className="flex items-center justify-between rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-3 text-[11px] text-zinc-700 font-semibold">
                    <span>₹480</span>
                    <span className="rounded-full bg-[#C21A4B]/10 px-3 py-1 text-[#C21A4B]">1.2× surge</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-zinc-200 px-6 py-16 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-[1200px] space-y-10">
          <div className="space-y-4 text-center text-zinc-600">
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#C21A4B]">How it works</div>
            <h2 className="text-4xl font-[DMSerifDisplay] text-zinc-950 sm:text-[3rem]">From request to<br />arrival in minutes</h2>
            <p className="mx-auto max-w-2xl text-base leading-8">No calls, no waiting. Post a job, get matched, track live.</p>
          </div>

          <div className="grid gap-5 border border-zinc-200 bg-zinc-100 p-px md:grid-cols-3 rounded-2xl overflow-hidden shadow-xs">
            {[
              {
                number: '01',
                icon: '📋',
                title: 'Describe your job',
                description: 'Type freely — "my boiler is making a banging noise". Our AI understands what you need and finds the right specialist.',
              },
              {
                number: '02',
                icon: '📍',
                title: 'We find the best nearby worker',
                description: 'Geospatial matching + semantic AI ranks workers by skills, rating, response rate, and distance.',
              },
              {
                number: '03',
                icon: '🎯',
                title: 'Track them live, pay securely',
                description: 'Watch your worker on the map in real time. Payment is held securely and released on completion.',
              },
            ].map((step) => (
              <div key={step.number} className="relative bg-white p-10">
                <div className="text-[56px] font-[DMSerifDisplay] text-zinc-150 leading-none select-none">{step.number}</div>
                <div className="absolute right-8 top-8 text-2xl opacity-60">{step.icon}</div>
                <h3 className="mt-8 text-lg font-bold text-zinc-950">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-zinc-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-zinc-200 px-6 py-16 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-[1200px] space-y-10">
          <div className="space-y-4 text-center text-zinc-600">
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#C21A4B]">Platform features</div>
            <h2 className="text-4xl font-[DMSerifDisplay] text-zinc-950 sm:text-[3rem]">Everything smart,<br />nothing bloated</h2>
            <p className="mx-auto max-w-2xl text-base leading-8">Six intelligent systems that make NearHire different from every other booking app.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: '🧠', title: 'Semantic job matching', description: 'Type anything naturally. We embed your query and run a vector search to find the right specialist.' },
              { icon: '📡', title: 'Live GPS tracking', description: 'Workers emit location every few seconds. You watch them move on the map in real time.' },
              { icon: '⚡', title: 'Smart surge pricing', description: 'Supply/demand recalculated every 60 seconds per zone. Fair for everyone, transparent upfront.' },
              { icon: '🕐', title: 'ETA predictor', description: 'Model trained on trip history predicts arrival time from distance, time of day, and traffic.' },
              { icon: '🛡️', title: 'Worker trust score', description: 'Rolling score from cancellations, arrival, reviews, and verification — visible on every booking.' },
              { icon: '⚖️', title: 'Dispute protection', description: 'Raise a dispute, freeze funds, and resolve with audit-safe workflow and admin oversight.' },
            ].map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-zinc-200 bg-white p-8 transition hover:border-[#C21A4B]/20 hover:shadow-lg">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C21A4B]/10 text-2xl text-[#C21A4B]">{feature.icon}</div>
                <h3 className="text-xl font-bold text-zinc-950">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{feature.description}</p>
                <span className="mt-5 inline-block rounded-full bg-[#C21A4B]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C21A4B]">AI-powered</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 px-6 py-16 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-[1200px] grid gap-10 xl:gap-16">
          <div className="space-y-8">
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#C21A4B]">Job lifecycle</div>
            <h2 className="text-4xl font-[DMSerifDisplay] text-zinc-950 sm:text-[3rem]">Built for zero race conditions</h2>
            <p className="max-w-xl text-base leading-8 text-zinc-600">Every job transition is atomic. Redis distributed locks prevent double-booking. MongoDB optimistic concurrency protects wallet balances.</p>
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xs">
              {[
                { step: '1', title: 'Open', detail: 'Job posted, visible to nearby workers. Geospatial cache queried instantly.' },
                { step: '2', title: 'Locked', detail: 'Worker claims the job. Distributed Redlock ensures only one claim succeeds.' },
                { step: '3', title: 'Active', detail: 'Worker accepted. Live GPS tracking begins. User sees real-time position.' },
                { step: '4', title: 'Completed', detail: 'Job done. Final location snapshotted. Wallet updated with optimistic concurrency.' },
              ].map((item, index, arr) => (
                <div key={item.step} className={`relative flex gap-6 py-6 ${index < arr.length - 1 ? 'border-b border-zinc-200' : ''}`}>
                  <div className="relative">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] font-bold ${item.step === '2' || item.step === '3' ? 'bg-[#C21A4B]/10 text-[#C21A4B]' : 'bg-zinc-100 text-zinc-600'}`}>{item.step}</div>
                    {index < arr.length - 1 ? <div className="absolute left-5 top-14 h-full w-0.5 bg-zinc-200" /> : null}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-950">{item.title}</h4>
                    <p className="mt-2 text-sm leading-7 text-zinc-600">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="surge" className="border-t border-zinc-200 px-6 py-16 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-[1200px] space-y-10">
          <div className="space-y-4 text-center text-zinc-600">
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#C21A4B]">AI surge pricing</div>
            <h2 className="text-4xl font-[DMSerifDisplay] text-zinc-950 sm:text-[3rem]">Fair prices, always transparent</h2>
            <p className="mx-auto max-w-2xl text-base leading-8">Every 60 seconds, our system recalculates supply and demand across 5km grid zones. When demand is high, workers earn more — and you always know the multiplier before you book.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xs">
              <div className="relative overflow-hidden rounded-3xl bg-zinc-100 border border-zinc-200/50 p-6">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />
                <div className="absolute left-10 top-10 rounded-full border border-red-200 bg-red-100/50 h-24 w-24" />
                <div className="absolute left-36 top-24 rounded-full border border-amber-200 bg-amber-100/50 h-16 w-16" />
                <div className="absolute left-24 top-44 rounded-full border border-zinc-350 bg-zinc-200/50 h-12 w-12" />
                <div className="relative h-64 rounded-3xl bg-white border border-zinc-200/60" />
                <div className="absolute left-8 top-8 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-[10px] font-bold text-red-600 shadow-xs">2.1× surge</div>
                <div className="absolute left-40 top-20 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-bold text-amber-700 shadow-xs">1.5× surge</div>
                <div className="absolute left-24 top-44 rounded-full bg-zinc-100 border border-zinc-200 px-3 py-1 text-[10px] font-bold text-zinc-600 shadow-xs">1.0× normal</div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-center shadow-xs">
                  <div className="text-3xl font-[DMSerifDisplay] text-red-650">2.1×</div>
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Peak zone</div>
                </div>
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-center shadow-xs">
                  <div className="text-3xl font-[DMSerifDisplay] text-amber-600">1.5×</div>
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Busy zone</div>
                </div>
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-center shadow-xs">
                  <div className="text-3xl font-[DMSerifDisplay] text-[#C21A4B]">60s</div>
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Update cycle</div>
                </div>
              </div>
              <div className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-3 text-sm text-zinc-700 font-medium"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#C21A4B]/10 text-[#C21A4B] font-bold shrink-0">01</span>Count open jobs vs available workers per grid zone</div>
                <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-3 text-sm text-zinc-700 font-medium"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#C21A4B]/10 text-[#C21A4B] font-bold shrink-0">02</span>If ratio &gt; 1.5 threshold → set surge key in Redis with 5-min TTL</div>
                <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-3 text-sm text-zinc-700 font-medium"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#C21A4B]/10 text-[#C21A4B] font-bold shrink-0">03</span>Price shown to user upfront — no hidden fees after booking</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 px-6 py-16 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-[1200px] space-y-8 text-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#C21A4B]">Call to action</div>
          <h2 className="text-5xl font-[DMSerifDisplay] text-zinc-950 leading-tight">Ready to get work<br />done?</h2>
          <p className="mx-auto max-w-2xl text-base leading-8 text-zinc-600">Join thousands of users who've stopped waiting and started doing.</p>
          <div className="mx-auto flex flex-wrap justify-center gap-4">
            <Link to="/registerUser" className="rounded-xl bg-[#C21A4B] px-10 py-4 text-sm font-semibold text-white transition hover:bg-[#A1133C] shadow-md hover:shadow-lg">Post your first job →</Link>
            <Link to="/registerWorker" className="rounded-xl border border-zinc-200 bg-white px-10 py-4 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950 shadow-xs">Join as a worker</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 px-6 py-10 lg:px-16 xl:px-24">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <div className="font-black tracking-[0.1em] text-zinc-950">NEAR<em className="text-[#C21A4B] not-italic">HIRE</em></div>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#" className="transition hover:text-zinc-950">Privacy</a>
            <a href="#" className="transition hover:text-zinc-950">Terms</a>
            <a href="#" className="transition hover:text-zinc-950">Support</a>
            <a href="#" className="transition hover:text-zinc-950">API docs</a>
          </div>
          <div>© 2026 NearHire. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
export default Main;