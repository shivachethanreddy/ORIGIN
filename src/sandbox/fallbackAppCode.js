export function fallbackAppCode(blueprint = {}, prompt = "") {
  const name = blueprint.name || titleFrom(prompt) || "Generated Workspace";
  const description =
    blueprint.description || "A focused component-level React app generated from a plain-English request.";
  const interactions = blueprint.interactions || ["Review metrics", "Add record", "Track progress"];

  return `import React, { useMemo, useState } from 'react';

const seedItems = [
  { name: 'Asha Patel', status: 'On track', score: 94, owner: 'Mentor A' },
  { name: 'Noah Chen', status: 'Needs review', score: 72, owner: 'Mentor B' },
  { name: 'Mira Singh', status: 'Improving', score: 84, owner: 'Mentor C' },
  { name: 'Leo Grant', status: 'Excellent', score: 98, owner: 'Mentor A' }
];

function App() {
  const [items, setItems] = useState(seedItems);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [score, setScore] = useState(88);
  const average = Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length);
  const filtered = useMemo(
    () => items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()) || item.status.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );

  function addItem(event) {
    event.preventDefault();
    if (!name.trim()) return;
    setItems([{ name, status: score > 89 ? 'Excellent' : score > 75 ? 'On track' : 'Needs review', score: Number(score), owner: 'New owner' }, ...items]);
    setName('');
    setScore(88);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium text-zinc-300">AI-generated React app</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white">${escapeForTemplate(name)}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">${escapeForTemplate(description)}</p>
          </div>
          <button className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-black/40">
            Export snapshot
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ['Total records', items.length],
            ['Average score', average + '%'],
            ['Needs review', items.filter((item) => item.status === 'Needs review').length],
            ['Top score', Math.max(...items.map((item) => item.score)) + '%']
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <section className="rounded-lg border border-slate-800 bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Workspace</h2>
                <p className="text-sm text-slate-500">${escapeForTemplate(interactions.slice(0, 3).join(' • '))}</p>
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter records"
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-white/40 focus:ring-2"
              />
            </div>
            <div className="divide-y divide-slate-800">
              {filtered.map((item) => (
                <div key={item.name} className="grid gap-3 p-4 sm:grid-cols-[1fr_150px_120px] sm:items-center">
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.owner}</p>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-white" style={{ width: item.score + '%' }} />
                  </div>
                  <span className="rounded-md border border-slate-700 px-3 py-1 text-center text-sm text-slate-300">{item.status}</span>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-lg font-semibold text-white">Quick add</h2>
            <form onSubmit={addItem} className="mt-4 space-y-4">
              <label className="block text-sm text-slate-400">
                Name
                <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-white/40 focus:ring-2" />
              </label>
              <label className="block text-sm text-slate-400">
                Score
                <input type="range" min="40" max="100" value={score} onChange={(event) => setScore(event.target.value)} className="mt-3 w-full accent-white" />
                <span className="mt-2 block text-white">{score}%</span>
              </label>
              <button className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950">Add record</button>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default App;`;
}

function titleFrom(value) {
  const words = String(value || "Generated Workspace").match(/[a-z0-9]+/gi) || [];
  return words.slice(0, 5).map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

function escapeForTemplate(value) {
  return String(value || "").replace(/[`$\\]/g, "");
}
