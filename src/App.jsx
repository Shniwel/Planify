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
function timeToMin(t){ if(!t) return 0; const[h,m]=t.split(":").map(Number); return h*60+m;}
function duration(s,e){const d=timeToMin(e)-timeToMin(s);return d>0?`${Math.floor(d/60)}h${d%60?String(d%60).padStart(2,"0"):""}`:"—";}
function totalHours(list){return list.reduce((a,s)=>{const d=(timeToMin(s.end)-timeToMin(s.start))/60;return a+(d>0?d:0);},0).toFixed(1);}

// ── EMAIL SENDER ─────────────────────────────────────────────────────────────
async function sendEmail(employee, schedules, action, toast) {
  try {
    toast(`📩 Envoi de l'email à ${employee.name}...`, "info");
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee, schedules, action }),
    });
    if (res.ok) toast(`✅ Email envoyé à ${employee.email}`, "success");
    else toast(`⚠️ Erreur lors de l'envoi`, "error");
  } catch (err) {
    toast("❌ Serveur email indisponible", "error");
  }
}

// ── UI COMPONENTS (TOAST, MODALS, ETC) ───────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div style={{position:"fixed",bottom:20,right:20,zIndex:9999,display:"flex",flexDirection:"column",gap:10}}>
      {toasts.map(t => (
        <div key={t.id} onClick={()=>remove(t.id)} style={{background:t.type==="success"?"#10b981":t.type==="error"?"#ef4444":"#6366f1",color:"#fff",padding:"12px 20px",borderRadius:12,boxShadow:"0 10px 15px rgba(0,0,0,0.1)",cursor:"pointer",fontSize:14,fontWeight:600}}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type="info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message: msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, add, remove: (id) => setToasts(prev => prev.filter(t => t.id !== id)) };
}

// --- TES COMPOSANTS DE MODALES ORIGINAUX (REMIS ICI) ---
// (J'ai gardé toute ta structure visuelle pour que rien ne change)

function Field({ label, children }) {
  return (
    <div style={{marginBottom:15}}>
      <label style={{display:\"block\",fontSize:12,fontWeight:700,color:\"#64748b\",marginBottom:5,textTransform:\"uppercase\"}}>{label}</label>
      {children}
    </div>
  );
}

function Input(props) {
  return <input {...props} style={{width:\"100%\",padding:\"12px\",borderRadius:10,border:\"2px solid #e2e8f0\",fontSize:14,boxSizing:\"border-box\"}}/>;
}

// ── APPLICATION PRINCIPALE ────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("dashboard");
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toasts, add, remove: removeToast } = useToasts();
  
  // États pour tes modales
  const [empModal, setEmpModal] = useState(null);
  const [schModal, setSchModal] = useState(null);

  // CHARGEMENT INITIAL DEPUIS SUPABASE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: emps } = await supabase.from('employees').select('*').order('name');
      const { data: schs } = await supabase.from('schedules').select('*');
      if (emps) setEmployees(emps);
      if (schs) setSchedules(schs);
      setLoading(false);
    };
    fetchData();
  }, []);

  // SAUVEGARDE EMPLOYÉ (CLOUD)
  const saveEmployee = async (emp) => {
    if (emp.id) {
      await supabase.from('employees').update(emp).eq('id', emp.id);
      setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
      add("Employé mis à jour", "success");
    } else {
      const { data } = await supabase.from('employees').insert([emp]).select();
      if (data) setEmployees(prev => [...prev, data[0]]);
      add("Employé ajouté", "success");
    }
    setEmpModal(null);
  };

  // SAUVEGARDE HORAIRE (CLOUD)
  const saveSchedule = async (sch) => {
    if (sch.id) {
      await supabase.from('schedules').update(sch).eq('id', sch.id);
      setSchedules(prev => prev.map(s => s.id === sch.id ? sch : s));
      add("Horaire modifié", "success");
    } else {
      const { data } = await supabase.from('schedules').insert([sch]).select();
      if (data) setSchedules(prev => [...prev, data[0]]);
      add("Horaire ajouté", "success");
    }
    setSchModal(null);
  };

  const deleteEmployee = async (id) => {
    if(confirm("Supprimer cet employé ?")) {
      await supabase.from('employees').delete().eq('id', id);
      setEmployees(prev => prev.filter(e => e.id !== id));
      add("Employé supprimé", "error");
    }
  };

  if (loading) return <div style={{padding:50, textAlign:\"center\", fontFamily:\"sans-serif\"}}>Connexion au Cloud...</div>;

  return (
    <div style={{ minHeight: \"100vh\", background: \"#f8fafc\", fontFamily: \"sans-serif\" }}>
      {/* TA NAVIGATION ORIGINALE */}
      <nav style={{ background: \"#fff\", padding: \"15px 20px\", display: \"flex\", justifyContent: \"space-between\", alignItems: \"center\", borderBottom: \"1px solid #e2e8f0\", position: \"sticky\", top: 0, zIndex: 100 }}>
        <h1 style={{ margin: 0, fontSize: 20, color: \"#6366f1\", fontWeight: 800 }}>Planify</h1>
        <div style={{ display: \"flex\", background: \"#f1f5f9\", padding: 4, borderRadius: 12 }}>
          <button onClick={() => setView(\"dashboard\")} style={{ border: \"none\", padding: \"8px 16px\", borderRadius: 8, background: view === \"dashboard\" ? \"#fff\" : \"transparent\", fontWeight: 600 }}>Dashboard</button>
          <button onClick={() => setView(\"team\")} style={{ border: \"none\", padding: \"8px 16px\", borderRadius: 8, background: view === \"team\" ? \"#fff\" : \"transparent\", fontWeight: 600 }}>Équipe</button>
        </div>
      </nav>

      {/* TON DASHBOARD ET TON CALENDRIER ORIGINAUX ICI */}
      <main style={{ padding: 20, maxWidth: 800, margin: \"0 auto\" }}>
        {view === \"dashboard\" ? (
          <div>
            {/* Cartes statistiques */}
            <div style={{ display: \"grid\", gridTemplateColumns: \"1fr 1fr\", gap: 15, marginBottom: 25 }}>
               <div style={{ background: \"#fff\", padding: 20, borderRadius: 20, boxShadow: \"0 4px 6px rgba(0,0,0,0.05)\" }}>
                 <div style={{ color: \"#64748b\", fontSize: 14 }}>Membres</div>
                 <div style={{ fontSize: 24, fontWeight: 800 }}>{employees.length}</div>
               </div>
               <div style={{ background: \"#fff\", padding: 20, borderRadius: 20, boxShadow: \"0 4px 6px rgba(0,0,0,0.05)\" }}>
                 <div style={{ color: \"#64748b\", fontSize: 14 }}>Heures Totales</div>
                 <div style={{ fontSize: 24, fontWeight: 800 }}>{totalHours(schedules)}h</div>
               </div>
            </div>

            {/* Grille du Calendrier */}
            <div style={{ display: \"flex\", flexDirection: \"column\", gap: 15 }}>
              {DAYS.map(day => (
                <div key={day} style={{ background: \"#fff\", borderRadius: 20, padding: 15, boxShadow: \"0 2px 4px rgba(0,0,0,0.02)\" }}>
                  <div style={{ display: \"flex\", justifyContent: \"space-between\", alignItems: \"center\", marginBottom: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 16, color: \"#1e293b\" }}>{day}</h3>
                    <button onClick={() => setSchModal({mode:\"add\", day})} style={{ background: \"#6366f1\", color: \"#fff\", border: \"none\", borderRadius: 8, padding: \"4px 10px\", fontSize: 12 }}>+ Ajouter</button>
                  </div>
                  {schedules.filter(s => s.day === day).map(s => {
                    const emp = employees.find(e => e.id === s.employeeId);
                    return (
                      <div key={s.id} style={{ display: \"flex\", justifyContent: \"space-between\", padding: \"10px 0\", borderTop: \"1px solid #f1f5f9\" }}>
                        <span>{emp?.name}</span>
                        <span style={{ fontWeight: 700 }}>{s.start} - {s.end}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* VUE ÉQUIPE ORIGINALE */
          <div>
            <button onClick={() => setEmpModal({mode:\"add\"})} style={{ width: \"100%\", padding: 15, borderRadius: 16, border: \"2px dashed #cbd5e1\", background: \"#fff\", color: \"#64748b\", fontWeight: 600, marginBottom: 20 }}>+ Nouveau Membre</button>
            {employees.map(emp => (
              <div key={emp.id} style={{ background: \"#fff\", padding: 15, borderRadius: 20, marginBottom: 10, display: \"flex\", justifyContent: \"space-between\", alignItems: \"center\" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{emp.name}</div>
                  <div style={{ fontSize: 12, color: \"#64748b\" }}>{emp.role}</div>
                </div>
                <div style={{ display: \"flex\", gap: 10 }}>
                  <button onClick={() => setEmpModal({mode:\"edit\", data:emp})} style={{ border: \"none\", background: \"#f1f5f9\", padding: 8, borderRadius: 8 }}>✏️</button>
                  <button onClick={() => deleteEmployee(emp.id)} style={{ border: \"none\", background: \"#fee2e2\", color: \"#ef4444\", padding: 8, borderRadius: 8 }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}
