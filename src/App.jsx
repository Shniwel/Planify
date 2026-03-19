import { useState, useCallback, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

// ── CONFIGURATION CLOUD (VITE) ──────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const DAY_SHORT = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const HOURS = Array.from({length:24},(_,i)=>`${String(i).padStart(2,"0")}:00`);
const COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6","#14b8a6"];

// ── UTILITAIRES ───────────────────────────────────────────────────────────────
function timeToMin(t){ if(!t)return 0; const[h,m]=t.split(":").map(Number); return h*60+m; }
function duration(s,e){ const d=timeToMin(e)-timeToMin(s); return d>0?`${Math.floor(d/60)}h${d%60?String(d%60).padStart(2,"0"):""}`:"—"; }
function totalHours(list){ return list.reduce((a,s)=>{ const d=(timeToMin(s.end)-timeToMin(s.start))/60; return a+(d>0?d:0); },0).toFixed(1); }

// ── COMPOSANTS UI ─────────────────────────────────────────────────────────────
const inputStyle = { width: "100%", padding: "12px", border: "2px solid #e5e7eb", borderRadius: "12px", marginBottom: "15px", fontSize: "16px" };

// ── APPLICATION PRINCIPALE ────────────────────────────────────────────────────
export default function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [view, setView] = useState("dashboard"); // dashboard, employees, calendar
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data: emps } = await supabase.from('employees').select('*').order('name');
    const { data: schs } = await supabase.from('schedules').select('*');
    if (emps) setEmployees(emps);
    if (schs) setSchedules(schs);
    setLoading(false);
  };

  useEffect(() => { if(isLogged) fetchData(); }, [isLogged]);

  if (!isLogged) return (
    <div style={{ padding: "40px 20px", fontFamily: "sans-serif", textAlign: "center", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", minHeight: "100vh", color: "white" }}>
      <div style={{ background: "white", padding: "30px", borderRadius: "24px", color: "#333", maxWidth: "400px", margin: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
        <h2 style={{ marginBottom: "20px" }}>Planify Cloud</h2>
        <input style={inputStyle} type="email" placeholder="Admin Email" defaultValue="admin@planify.fr" id="logEmail" />
        <input style={inputStyle} type="password" placeholder="Mot de passe" defaultValue="admin123" id="logPass" />
        <button 
          onClick={() => setIsLogged(true)}
          style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "#6366f1", color: "white", fontWeight: "bold", fontSize: "16px" }}
        >
          Se connecter
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "sans-serif", background: "#f8fafc" }}>
      
      {/* MENU NAVIGATION (TON DESIGN) */}
      <nav style={{ background: "white", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
        <h1 style={{ margin: 0, fontSize: "20px", color: "#6366f1" }}>Planify</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setView("dashboard")} style={{ padding: "8px 12px", borderRadius: "8px", border: view === "dashboard" ? "none" : "1px solid #ddd", background: view === "dashboard" ? "#6366f1" : "white", color: view === "dashboard" ? "white" : "#666" }}>Dashboard</button>
          <button onClick={() => setView("employees")} style={{ padding: "8px 12px", borderRadius: "8px", border: view === "employees" ? "none" : "1px solid #ddd", background: view === "employees" ? "#6366f1" : "white", color: view === "employees" ? "white" : "#666" }}>Équipe</button>
        </div>
      </nav>

      {/* CONTENU PRINCIPAL */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        
        {view === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
              <div style={{ background: "white", padding: "20px", borderRadius: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: "14px", color: "#64748b" }}>Employés</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}>{employees.length}</div>
              </div>
              <div style={{ background: "white", padding: "20px", borderRadius: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: "14px", color: "#64748b" }}>Heures Totales</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}>{totalHours(schedules)}h</div>
              </div>
            </div>

            <h3 style={{ color: "#1e293b" }}>Planning du jour</h3>
            {employees.length === 0 ? (
              <p style={{ textAlign: "center", color: "#94a3b8", marginTop: "40px" }}>Aucun employé pour le moment.</p>
            ) : (
              employees.map(emp => (
                <div key={emp.id} style={{ background: "white", padding: "15px", borderRadius: "16px", marginBottom: "12px", borderLeft: `6px solid ${emp.color || '#6366f1'}` }}>
                  <div style={{ fontWeight: "bold" }}>{emp.name}</div>
                  <div style={{ fontSize: "14px", color: "#64748b" }}>{emp.role}</div>
                </div>
              ))
            )}
          </div>
        )}

        {view === "employees" && (
          <div>
            <button style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "2px dashed #cbd5e1", background: "white", color: "#64748b", marginBottom: "20px" }}>
              + Ajouter un membre
            </button>
            {employees.map(emp => (
              <div key={emp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "15px", borderRadius: "16px", marginBottom: "10px" }}>
                <span>{emp.name}</span>
                <button style={{ padding: "5px 10px", borderRadius: "8px", border: "1px solid #fee2e2", background: "#fef2f2", color: "#ef4444" }}>Suppr.</button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
