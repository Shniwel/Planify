import { useState, useCallback, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

// ── CONFIGURATION CLOUD ──────────────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const DAY_SHORT = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const HOURS = Array.from({length:24},(_,i)=>`${String(i).padStart(2,"0")}:00`);
const COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6","#14b8a6"];

// ── UTILITAIRES ───────────────────────────────────────────────────────────────
function timeToMin(t){if(!t)return 0; const[h,m]=t.split(":").map(Number);return h*60+m;}
function duration(s,e){const d=timeToMin(e)-timeToMin(s);return d>0?`${Math.floor(d/60)}h${d%60?String(d%60).padStart(2,"0"):""}`:"—";}
function totalHours(list){return list.reduce((a,s)=>{const d=(timeToMin(s.end)-timeToMin(s.start))/60;return a+(d>0?d:0);},0).toFixed(1);}

// ── ENVOI EMAIL ──────────────────────────────────────────────────────────────
async function sendEmail(employee, schedules, action, toast) {
  try {
    toast(`📧 Envoi de l'email à ${employee.name}…`, "info");
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee, schedules, action }),
    });
    if (res.ok) toast(`✅ Email envoyé à ${employee.email}`, "success");
    else toast(`⚠️ Erreur lors de l'envoi`, "error");
  } catch (err) {
    toast(`⚠️ Serveur email indisponible`, "error");
  }
}

// ── COMPOSANTS UI (Toast, Modal, Btn, etc. - GARDÉS TEL QUEL) ────────────────
function Toast({toasts,remove}){
  const icons={success:"✓",error:"✕",info:"⋯"};
  const bg={success:"#10b981",error:"#ef4444",info:"#6366f1"};
  return(
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:10}}>
      {toasts.map(t=>(
        <div key={t.id} onClick={()=>remove(t.id)} style={{background:bg[t.type]||"#6366f1",color:"#fff",padding:"12px 18px",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.2)",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontSize:14}}>
          <span style={{fontSize:16,fontWeight:700}}>{icons[t.type]}</span>{t.message}
        </div>
      ))}
    </div>
  );
}

function useToasts(){
  const[toasts,setToasts]=useState([]);
  const add=useCallback((message,type="info")=>{
    const id=Date.now();
    setToasts(p=>[...p,{id,message,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),4000);
  },[]);
  return{toasts,add,remove:id=>setToasts(p=>p.filter(t=>t.id!==id))};
}

// ... [Tes composants Modal, Field, Input, Select, Btn, Login, StatCard, CalendarView, EmployeeCard, Sidebar restent identiques ici] ...
// (Je saute la réécriture visuelle pour garder le message lisible, mais utilise bien tes versions)

// ── APPLICATION PRINCIPALE ────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [sideCollapsed, setSideCollapsed] = useState(false);
  
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [empModal, setEmpModal] = useState(null);
  const [schModal, setSchModal] = useState(null);
  const [emailModal, setEmailModal] = useState(null);
  const {toasts, add: toast, remove: removeToast} = useToasts();

  // 1. CHARGEMENT CLOUD
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

  // 2. SAUVEGARDE EMPLOYÉ (CLOUD)
  const saveEmployee = async (emp) => {
    // Si l'ID est un nombre très élevé (généré par uid()), on le supprime pour laisser Supabase créer un vrai ID
    const isNew = !employees.find(e => e.id === emp.id) || emp.id > 10000;
    const { id, ...dataToSave } = emp;

    if (isNew) {
      const { data } = await supabase.from('employees').insert([dataToSave]).select();
      if (data) setEmployees(p => [...p, data[0]]);
      toast(`${emp.name} ajouté au Cloud`, "success");
    } else {
      await supabase.from('employees').update(emp).eq('id', emp.id);
      setEmployees(p => p.map(e => e.id === emp.id ? emp : e));
      toast(`${emp.name} mis à jour`, "success");
    }
    setEmpModal(null);
  };

  // 3. SUPPRESSION EMPLOYÉ (CLOUD)
  const deleteEmployee = async (id) => {
    if(confirm("Supprimer cet employé ?")) {
      await supabase.from('employees').delete().eq('id', id);
      setEmployees(p => p.filter(e => e.id !== id));
      setSchedules(p => p.filter(s => s.employeeId !== id));
      toast("Employé supprimé", "info");
    }
  };

  // 4. SAUVEGARDE HORAIRE (CLOUD)
  const saveSchedule = async (sch) => {
    const isNew = !schedules.find(s => s.id === sch.id) || sch.id > 10000;
    const { id, ...dataToSave } = sch;

    if (isNew) {
      const { data } = await supabase.from('schedules').insert([dataToSave]).select();
      if (data) {
        setSchedules(p => [...p, data[0]]);
        const emp = employees.find(e => e.id === sch.employeeId);
        if(emp) await sendEmail(emp, [...schedules, data[0]].filter(s=>s.employeeId===emp.id), "creation", toast);
      }
    } else {
      await supabase.from('schedules').update(sch).eq('id', sch.id);
      setSchedules(p => p.map(s => s.id === sch.id ? sch : s));
    }
    setSchModal(null);
    toast("Planning synchronisé", "success");
  };

  const deleteSchedule = async (id) => {
    await supabase.from('schedules').delete().eq('id', id);
    setSchedules(p => p.filter(s => s.id !== id));
    toast("Créneau supprimé", "info");
  };

  if (loading) return <div style={{padding:50, textAlign:"center", color:"#6366f1", fontWeight:700}}>Connexion Planify Cloud...</div>;
  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  // ... [Tout le reste de ton code de rendu JSX (Sidebar, Header, Dashboard, etc.)] ...
  // (Utilise bien tout le bloc de return que tu as déjà écrit)
  
  return (
      <div style={{display:"flex",minHeight:"100vh",background:"#f8faff",fontFamily:"'DM Sans',sans-serif"}}>
         {/* ... Ton JSX complet ici ... */}
      </div>
  );
}
