import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import logoSirio from "./logo-sirio.png";
import { subscribeToData, saveData } from "./dataStore";

const LOGO_SIRIO = logoSirio;

const SENHA = "sirio123";
const FRASES = [
  "A água é o seu palco. Brilhe! 🌊",
  "Cada braçada te deixa mais forte 💪",
  "Campeões são feitos de treino e dedicação 🏆",
  "A piscina é onde heróis nascem 🦸",
  "Supere seus limites a cada aula! ⚡",
  "Persistência transforma água em vitória 🥇",
  "Seu esforço de hoje é sua medalha de amanhã 🎖️",
  "Nade com o coração, vença com a mente 🧠",
];

const BADGES_DEF = [
  { id: "presenca_perfeita", icon: "🔥", label: "Presença Perfeita", desc: "5 aulas seguidas", check: (s) => s.streak >= 5 },
  { id: "velocista", icon: "⚡", label: "Velocista", desc: "Menos de 20s nos 25m", check: (s) => s.best[25] && s.best[25] < 20 },
  { id: "maratonista", icon: "🌊", label: "Maratonista", desc: "1.000m acumulados", check: (s) => s.metros >= 1000 },
  { id: "centuriao", icon: "💯", label: "Centurião", desc: "100 pontos acumulados", check: (s) => s.pontos >= 100 },
  { id: "primeiro_tempo", icon: "⏱️", label: "Cronometrado", desc: "Primeiro tempo registrado", check: (s) => s.best[25] || s.best[50] || s.best[100] },
  { id: "dedicado", icon: "🎯", label: "Dedicado", desc: "10 aulas frequentadas", check: (s) => s.presencas >= 10 },
  { id: "super_nadador", icon: "🦈", label: "Tubarão", desc: "5.000m acumulados", check: (s) => s.metros >= 5000 },
  { id: "pontual", icon: "⏰", label: "Sempre Pontual", desc: "5 presenças pontuais", check: (s) => s.pontuais >= 5 },
];

const defaultState = { turma: "AP2", alunos: [], aulas: [] };

function getMedal(r) {
  if (r === 1) return { icon: "🥇", color: "from-yellow-500 to-amber-400", border: "border-yellow-400", text: "text-yellow-600" };
  if (r === 2) return { icon: "🥈", color: "from-slate-400 to-slate-300", border: "border-slate-400", text: "text-slate-500" };
  if (r === 3) return { icon: "🥉", color: "from-amber-700 to-amber-600", border: "border-amber-600", text: "text-amber-700" };
  return { icon: `${r}º`, color: "from-red-800 to-red-700", border: "border-red-200", text: "text-red-700" };
}

function calcStats(aulas, alunoId) {
  let pontos = 0, metros = 0, presencas = 0, pontuais = 0;
  const best = { 25: null, 50: null, 100: null };
  const evolucao = [];
  let streak = 0, maxStreak = 0, lastPresente = false;
  let newRecord = false;
  for (const aula of aulas) {
    const r = aula.registros?.[alunoId];
    if (!r) { if (lastPresente) { maxStreak = Math.max(maxStreak, streak); streak = 0; } lastPresente = false; continue; }
    if (r.frequencia) { pontos += 2; presencas++; streak++; lastPresente = true; }
    else { maxStreak = Math.max(maxStreak, streak); streak = 0; lastPresente = false; }
    if (r.pontualidade) { pontos += 2; pontuais++; }
    if (r.organizacao) pontos += 2;
    if (r.comportamento) pontos += 2;
    metros += r.metragem || 0;
    for (const d of [25, 50, 100]) {
      const t = r.tempos?.[d];
      if (t) { if (!best[d] || t < best[d]) { if (best[d]) newRecord = true; best[d] = t; } }
    }
    evolucao.push({ aula: aula.data?.slice(5) || "", pontos, metros });
  }
  maxStreak = Math.max(maxStreak, streak);
  return { pontos, metros, presencas, pontuais, best, streak, maxStreak, evolucao, newRecord };
}

function formatTempo(s) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(2).padStart(5, "0");
  return m > 0 ? `${m}:${sec}` : `${sec}s`;
}

function EscudoSirio({ size = 32, white = false }) {
  return (
    <img
      src={LOGO_SIRIO}
      alt="Esporte Clube Sírio"
      width={size}
      style={{ 
        height: "auto", 
        filter: white ? "brightness(0) invert(1)" : "none",
        objectFit: "contain"
      }}
    />
  );
}

// SVG nadador simplificado
function IconNadador({ size = 28, color = "#ffffff" }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60" fill="none">
      <circle cx="72" cy="14" r="10" fill={color}/>
      <path d="M10 38 Q30 18 55 22 Q70 26 80 20" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none"/>
      <path d="M5 50 Q25 38 50 42 Q70 46 95 38" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.6"/>
    </svg>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${checked ? "bg-red-600" : "bg-gray-300"}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function StarRow({ value, max = 2 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`text-base ${i < value ? "text-yellow-500" : "text-gray-300"}`}>★</span>
      ))}
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(false);
  const [modo, setModo] = useState("ranking");
  const [senhaInput, setSenhaInput] = useState("");
  const [senhaOk, setSenhaOk] = useState(false);
  const [senhaErro, setSenhaErro] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [aulaData, setAulaData] = useState(() => new Date().toISOString().slice(0, 10));
  const [registrosTemp, setRegistrosTemp] = useState({});
  const [temposTemp, setTemposTemp] = useState({});
  const [distSel, setDistSel] = useState({});
  const [alunoDetalhe, setAlunoDetalhe] = useState(null);
  const [toast, setToast] = useState(null);
  const [frase] = useState(() => FRASES[Math.floor(Math.random() * FRASES.length)]);
  const [animIn, setAnimIn] = useState(false);
  const isRemoteUpdate = useRef(false);

  // Escuta o Firestore em tempo real: qualquer mudança feita por outro
  // professor/aparelho chega aqui automaticamente.
  useEffect(() => {
    const unsubscribe = subscribeToData((remoteData, error) => {
      if (error) {
        setSyncError(true);
        setLoading(false);
        return;
      }
      isRemoteUpdate.current = true;
      setData(remoteData || defaultState);
      setLoading(false);
      setTimeout(() => setAnimIn(true), 100);
    });
    return () => unsubscribe();
  }, []);

  // Sempre que o estado local mudar (por uma ação do usuário local),
  // envia para o Firestore — exceto quando a mudança veio do próprio listener.
  useEffect(() => {
    if (!data) return;
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    saveData(data);
  }, [data]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2800); }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#CC2200" }}>
      <div className="text-white text-lg animate-pulse font-bold flex flex-col items-center gap-3">
        <EscudoSirio size={48} white />
        <span>Conectando...</span>
      </div>
    </div>
  );

  if (syncError) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#CC2200" }}>
      <div className="bg-white rounded-2xl p-6 max-w-sm text-center shadow-xl">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="font-bold text-gray-800 mb-2">Não foi possível conectar</h2>
        <p className="text-gray-500 text-sm">Verifique sua conexão com a internet e atualize a página. Se o problema continuar, confira as regras do Firestore.</p>
      </div>
    </div>
  );

  const ranking = [...data.alunos]
    .map((a) => ({ ...a, ...calcStats(data.aulas, a.id) }))
    .sort((a, b) => b.pontos - a.pontos || b.metros - a.metros);
  const maxPontos = ranking.length > 0 ? Math.max(...ranking.map((r) => r.pontos), 1) : 1;

  function handleSenha() {
    if (senhaInput === SENHA) { setSenhaOk(true); setSenhaErro(false); setModo("professor"); }
    else setSenhaErro(true);
  }
  function addAluno() {
    if (!novoNome.trim()) return;
    const novo = { id: Date.now().toString(), nome: novoNome.trim() };
    setData((d) => ({ ...d, alunos: [...d.alunos, novo] }));
    setNovoNome("");
    showToast(`${novo.nome} adicionado! 🎉`);
  }
  function removeAluno(id) {
    if (!confirm("Remover este aluno?")) return;
    setData((d) => ({ ...d, alunos: d.alunos.filter((a) => a.id !== id) }));
  }
  function initAula() {
    const regs = {}; const temps = {}; const dists = {};
    data.alunos.forEach((a) => {
      regs[a.id] = { frequencia: false, pontualidade: false, organizacao: false, comportamento: false, metragem: 0 };
      temps[a.id] = { 25: "", 50: "", 100: "" };
      dists[a.id] = null;
    });
    setRegistrosTemp(regs); setTemposTemp(temps); setDistSel(dists); setModo("aula");
  }
  function salvarAula() {
    const registros = {};
    data.alunos.forEach((a) => {
      const r = registrosTemp[a.id] || {};
      const tempos = {};
      [25, 50, 100].forEach((d) => { const v = parseFloat(temposTemp[a.id]?.[d]); if (!isNaN(v) && v > 0) tempos[d] = v; });
      registros[a.id] = { ...r, tempos };
    });
    const novaAula = { id: Date.now().toString(), data: aulaData, registros };
    setData((d) => ({ ...d, aulas: [...d.aulas, novaAula] }));
    setModo("professor");
    showToast("Aula salva com sucesso! 💾");
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "#f5f5f5" }}>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 text-white px-5 py-2 rounded-full shadow-xl text-sm font-bold" style={{ background: "#CC2200" }}>
          {toast}
        </div>
      )}

      {/* HEADER - vermelho Sírio */}
      <header className="sticky top-0 z-40 shadow-lg" style={{ background: "#CC2200" }}>
        {/* Banner com logos */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <EscudoSirio size={36} white />
            <div>
              <div className="text-white font-extrabold text-base leading-tight tracking-wide">ESPORTE CLUBE SÍRIO</div>
              <div className="flex items-center gap-1.5">
                <IconNadador size={22} color="rgba(255,255,255,0.85)" />
                <span className="text-white/80 text-xs font-semibold tracking-widest uppercase">Natação</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <select value={data.turma} onChange={(e) => setData((d) => ({ ...d, turma: e.target.value }))}
              className="text-xs rounded-lg px-2 py-1.5 border border-white/30 outline-none font-bold"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
              <option value="AP2" style={{ color: "#333" }}>Aperfeiç. 2</option>
              <option value="AP3" style={{ color: "#333" }}>Aperfeiç. 3</option>
            </select>
            {modo === "ranking"
              ? <button onClick={() => setModo("login")} className="text-xs px-3 py-1.5 rounded-lg font-bold border border-white/30 text-white" style={{ background: "rgba(255,255,255,0.15)" }}>Professor</button>
              : <button onClick={() => { setModo("ranking"); setSenhaOk(false); setSenhaInput(""); }} className="text-xs px-3 py-1.5 rounded-lg font-bold border border-white/30 text-white" style={{ background: "rgba(0,0,0,0.2)" }}>Sair</button>
            }
          </div>
        </div>
        {/* Faixa branca decorativa com as 3 listras */}
        <div className="flex h-2">
          <div className="flex-1" style={{ background: "#CC2200" }}/>
          <div className="w-3 bg-white/60"/>
          <div className="w-2" style={{ background: "#CC2200" }}/>
          <div className="w-3 bg-white/60"/>
          <div className="w-2" style={{ background: "#CC2200" }}/>
          <div className="w-3 bg-white/60"/>
          <div className="flex-1" style={{ background: "#CC2200" }}/>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 py-4">

        {/* LOGIN */}
        {modo === "login" && (
          <div className="bg-white rounded-2xl p-6 mt-8 max-w-xs mx-auto shadow-xl border border-red-100">
            <div className="flex justify-center mb-3"><EscudoSirio size={44} /></div>
            <h2 className="font-bold text-center mb-4 text-gray-800">Acesso do Professor</h2>
            <input type="password" placeholder="Senha" value={senhaInput}
              onChange={(e) => setSenhaInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSenha()}
              className="w-full rounded-xl px-3 py-2 text-sm mb-3 border border-gray-300 outline-none focus:border-red-500 bg-gray-50" />
            {senhaErro && <p className="text-red-500 text-xs mb-2 text-center">Senha incorreta</p>}
            <button onClick={handleSenha} className="w-full text-white font-bold py-2 rounded-xl text-sm transition-colors" style={{ background: "#CC2200" }}>Entrar</button>
          </div>
        )}

        {/* PAINEL PROFESSOR */}
        {modo === "professor" && senhaOk && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow border border-red-100">
              <h2 className="font-bold mb-3 text-gray-800">👥 Gerenciar Alunos</h2>
              <div className="flex gap-2 mb-3">
                <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAluno()}
                  placeholder="Nome do aluno"
                  className="flex-1 rounded-xl px-3 py-2 text-sm border border-gray-300 outline-none focus:border-red-500 bg-gray-50" />
                <button onClick={addAluno} className="text-white px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "#CC2200" }}>+ Adicionar</button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.alunos.length === 0 && <p className="text-gray-400 text-sm text-center py-2">Nenhum aluno cadastrado</p>}
                {data.alunos.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                    <span className="text-gray-800 text-sm">{a.nome}</span>
                    <button onClick={() => removeAluno(a.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={initAula} disabled={data.alunos.length === 0}
              className="w-full text-white font-bold py-3 rounded-2xl disabled:opacity-40 transition-colors shadow"
              style={{ background: "#CC2200" }}>
              📋 Registrar Nova Aula
            </button>
            {data.aulas.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow border border-red-100">
                <h3 className="font-bold mb-3 text-gray-800">📅 Histórico ({data.aulas.length} aulas)</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[...data.aulas].reverse().map((aula) => {
                    const p = Object.values(aula.registros || {}).filter((r) => r.frequencia).length;
                    return (
                      <div key={aula.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                        <div>
                          <span className="text-gray-800 text-sm">{aula.data}</span>
                          <span className="text-gray-400 text-xs ml-2">{p} presentes</span>
                        </div>
                        <button onClick={() => { if (!confirm("Excluir?")) return; setData((d) => ({ ...d, aulas: d.aulas.filter((a) => a.id !== aula.id) })); }}
                          className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REGISTRAR AULA */}
        {modo === "aula" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setModo("professor")} className="text-gray-500 hover:text-gray-800 text-sm">← Voltar</button>
              <h2 className="font-bold text-gray-800">📋 Nova Aula</h2>
            </div>
            <div className="bg-white rounded-xl px-4 py-3 shadow border border-red-100 flex items-center gap-3">
              <span className="text-gray-500 text-sm">Data:</span>
              <input type="date" value={aulaData} onChange={(e) => setAulaData(e.target.value)}
                className="bg-gray-50 text-gray-800 rounded-lg px-2 py-1 text-sm border border-gray-300 outline-none" />
            </div>
            {data.alunos.map((aluno) => {
              const r = registrosTemp[aluno.id] || {};
              const t = temposTemp[aluno.id] || {};
              const d = distSel[aluno.id];
              const pts = (r.frequencia ? 2 : 0) + (r.pontualidade ? 2 : 0) + (r.organizacao ? 2 : 0) + (r.comportamento ? 2 : 0);
              return (
                <div key={aluno.id} className="bg-white rounded-2xl p-4 shadow border border-red-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-800">{aluno.nome}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pts >= 6 ? "bg-green-100 text-green-700" : pts > 0 ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-400"}`}>
                      {pts} pts hoje
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { key: "frequencia", label: "✅ Frequência" },
                      { key: "pontualidade", label: "⏰ Pontualidade" },
                      { key: "organizacao", label: "🎒 Organização" },
                      { key: "comportamento", label: "😊 Comportamento" },
                    ].map(({ key, label }) => (
                      <Toggle key={key} checked={!!r[key]} label={label}
                        onChange={(v) => setRegistrosTemp((prev) => ({ ...prev, [aluno.id]: { ...prev[aluno.id], [key]: v } }))} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-gray-500 text-sm">🏊 Metragem:</span>
                    <input type="number" min="0" step="25" value={r.metragem || ""}
                      onChange={(e) => setRegistrosTemp((prev) => ({ ...prev, [aluno.id]: { ...prev[aluno.id], metragem: parseInt(e.target.value) || 0 } }))}
                      placeholder="0" className="w-20 bg-gray-50 text-gray-800 rounded-lg px-2 py-1 text-sm border border-gray-300 outline-none" />
                    <span className="text-gray-500 text-sm">m</span>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-2">⏱ Registrar tempo (opcional)</p>
                    <div className="flex gap-2 mb-2">
                      {[25, 50, 100].map((dist) => (
                        <button key={dist}
                          onClick={() => setDistSel((prev) => ({ ...prev, [aluno.id]: prev[aluno.id] === dist ? null : dist }))}
                          className={`flex-1 py-1.5 rounded-xl text-sm font-bold border transition-colors ${d === dist ? "text-white border-transparent" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                          style={d === dist ? { background: "#CC2200" } : {}}>
                          {dist}m
                        </button>
                      ))}
                    </div>
                    {d && (
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" step="0.01" value={t[d] || ""}
                          onChange={(e) => setTemposTemp((prev) => ({ ...prev, [aluno.id]: { ...prev[aluno.id], [d]: e.target.value } }))}
                          placeholder="segundos (ex: 45.30)"
                          className="flex-1 bg-gray-50 text-gray-800 rounded-lg px-2 py-1 text-sm border border-gray-300 outline-none" />
                        <span className="text-gray-400 text-xs">seg</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <button onClick={salvarAula}
              className="w-full text-white font-bold py-3 rounded-2xl transition-colors shadow mt-2"
              style={{ background: "#CC2200" }}>
              💾 Salvar Aula
            </button>
          </div>
        )}

        {/* RANKING PÚBLICO */}
        {modo === "ranking" && (
          <div className={`space-y-3 transition-all duration-500 ${animIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

            {/* Frase motivacional */}
            <div className="rounded-2xl px-4 py-3 text-center shadow" style={{ background: "#CC2200" }}>
              <p className="text-white text-sm font-medium italic">{frase}</p>
            </div>

            {/* Título */}
            <div className="text-center py-2 bg-white rounded-2xl shadow border border-red-100">
              <div className="flex justify-center mb-1">
                <EscudoSirio size={28} />
              </div>
              <div className="text-xs uppercase tracking-widest font-bold mb-0.5" style={{ color: "#CC2200" }}>
                {data.turma === "AP2" ? "Aperfeiçoamento 2" : "Aperfeiçoamento 3"}
              </div>
              <div className="text-gray-800 text-xl font-extrabold">🏆 Ranking da Turma</div>
              <div className="text-gray-400 text-xs mt-0.5">{data.aulas.length} aulas registradas</div>
            </div>

            {ranking.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl shadow">
                <div className="flex justify-center mb-3"><EscudoSirio size={48} /></div>
                <p className="text-gray-500">Nenhum aluno cadastrado ainda.</p>
                <p className="text-gray-300 text-sm mt-1">Acesse como professor para começar.</p>
              </div>
            )}

            {ranking.map((aluno, i) => {
              const medal = getMedal(i + 1);
              const badges = BADGES_DEF.filter((b) => b.check(aluno));
              const pct = maxPontos > 0 ? Math.round((aluno.pontos / maxPontos) * 100) : 0;
              const isOpen = alunoDetalhe?.id === aluno.id;
              const lastAula = data.aulas[data.aulas.length - 1];
              const lastReg = lastAula?.registros?.[aluno.id];
              const stars = {
                frequencia: lastReg?.frequencia ? 2 : 0,
                pontualidade: lastReg?.pontualidade ? 2 : 0,
                organizacao: lastReg?.organizacao ? 2 : 0,
                comportamento: lastReg?.comportamento ? 2 : 0,
              };

              return (
                <div key={aluno.id}
                  onClick={() => setAlunoDetalhe(isOpen ? null : aluno)}
                  className={`bg-white rounded-2xl border cursor-pointer transition-all duration-300 overflow-hidden shadow-md ${medal.border}`}>

                  {/* Topo colorido */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${medal.color}`} />

                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Posição */}
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br ${medal.color} shadow flex-shrink-0`}>
                        {medal.icon.includes("º")
                          ? <span className="text-white font-black text-sm">{medal.icon}</span>
                          : <span className="text-xl">{medal.icon}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-gray-800 font-bold">{aluno.nome}</span>
                          {aluno.streak >= 3 && (
                            <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold">🔥 {aluno.streak}</span>
                          )}
                          {aluno.newRecord && (
                            <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-semibold">⚡ Recorde!</span>
                          )}
                        </div>
                        <div className="mt-1.5 mb-0.5">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span className="font-bold" style={{ color: "#CC2200" }}>{aluno.pontos} pts</span>
                            <span>{aluno.metros.toLocaleString()}m nadados</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${medal.color} rounded-full transition-all duration-700`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-300 text-xs">{isOpen ? "▲" : "▼"}</div>
                    </div>

                    {badges.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2 pl-14">
                        {badges.map((b) => (
                          <span key={b.id} title={`${b.label}: ${b.desc}`} className="text-lg">{b.icon}</span>
                        ))}
                      </div>
                    )}

                    {/* DETALHE */}
                    {isOpen && (
                      <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">

                        {/* Estrelas */}
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">⭐ Última aula</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { key: "frequencia", label: "Frequência" },
                              { key: "pontualidade", label: "Pontualidade" },
                              { key: "organizacao", label: "Organização" },
                              { key: "comportamento", label: "Comportamento" },
                            ].map(({ key, label }) => (
                              <div key={key} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                                <div className="text-gray-500 text-xs mb-1">{label}</div>
                                <StarRow value={stars[key]} max={2} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Melhores tempos */}
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">⏱ Melhores tempos</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[25, 50, 100].map((dist) => (
                              <div key={dist} className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
                                <div className="text-gray-400 text-xs">{dist}m</div>
                                <div className="font-bold text-sm mt-1" style={{ color: "#CC2200" }}>{formatTempo(aluno.best[dist])}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
                            <div className="text-gray-400 text-xs">Presenças</div>
                            <div className="text-gray-800 font-bold text-sm mt-0.5">{aluno.presencas}/{data.aulas.length}</div>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
                            <div className="text-gray-400 text-xs">Sequência</div>
                            <div className="text-orange-500 font-bold text-sm mt-0.5">🔥 {aluno.streak}</div>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
                            <div className="text-gray-400 text-xs">Melhor seq.</div>
                            <div className="text-amber-500 font-bold text-sm mt-0.5">⭐ {aluno.maxStreak}</div>
                          </div>
                        </div>

                        {/* Gráfico */}
                        {aluno.evolucao.length > 1 && (
                          <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">📈 Evolução de pontos</p>
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                              <ResponsiveContainer width="100%" height={90}>
                                <LineChart data={aluno.evolucao}>
                                  <XAxis dataKey="aula" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                                  <YAxis hide />
                                  <Tooltip
                                    contentStyle={{ background: "#fff", border: "1px solid #fee2e2", borderRadius: 8, fontSize: 11 }}
                                    labelStyle={{ color: "#6b7280" }}
                                    itemStyle={{ color: "#CC2200" }}
                                    formatter={(v) => [`${v} pts`, "Pontos"]}
                                  />
                                  <Line type="monotone" dataKey="pontos" stroke="#CC2200" strokeWidth={2.5} dot={{ r: 3, fill: "#CC2200" }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {/* Conquistas desbloqueadas */}
                        {badges.length > 0 && (
                          <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">🎖 Conquistas desbloqueadas</p>
                            <div className="space-y-1.5">
                              {badges.map((b) => (
                                <div key={b.id} className="flex items-center gap-3 bg-red-50 rounded-xl px-3 py-2.5 border border-red-100">
                                  <span className="text-2xl">{b.icon}</span>
                                  <div>
                                    <div className="text-gray-800 text-sm font-semibold">{b.label}</div>
                                    <div className="text-gray-400 text-xs">{b.desc}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Conquistas bloqueadas */}
                        {BADGES_DEF.filter((b) => !b.check(aluno)).length > 0 && (
                          <div>
                            <p className="text-gray-300 text-xs uppercase tracking-wider mb-2">🔒 Ainda por conquistar</p>
                            <div className="flex gap-2 flex-wrap">
                              {BADGES_DEF.filter((b) => !b.check(aluno)).map((b) => (
                                <span key={b.id} title={`${b.label}: ${b.desc}`} className="text-2xl opacity-20 grayscale">{b.icon}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Footer */}
            <div className="text-center py-3 flex items-center justify-center gap-2">
              <EscudoSirio size={16} />
              <span className="text-gray-300 text-xs">Esporte Clube Sírio · Natação</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
