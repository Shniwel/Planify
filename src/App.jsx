import { useState, useCallback, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

// ── CONFIGURATION CLOUD ──────────────────────────────────────────────────────
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const DAY_SHORT = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const HOURS = Array.from({length:24},(_,i)=>`${String(i).padStart(2,"0")}:00`);
const COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6","#14b8a6"];

// ── UTILITAIRES ───────────────────────────────────────────────────────────────
let nextId = Date.now();
const uid = () => ++nextId;

function timeToMin(t){const[h,m]=t.split(":").map(Number);return h*60+m;}
function duration(s,e){const d=timeToMin(e)-timeToMin(s);return d>0?`${Math.floor(d/60)}h${d%60?String(d%60).padStart(2,"0"):""}`:"—";}
function totalHours(list){return list.reduce((a,s)=>{const d=(timeToMin(s.end)-timeToMin(s.start))/60;return a+(d>0?d:0);},0).toFixed(1);}

// ── COMPOSANTS UI (DESIGN ORIGINAL) ───────────────────────────────────────────

function Toast({toasts,remove}){
  const icons={success:"✓",error:"✕",info:"⋯"};
  const bg={success:"#10b981",error:"#ef4444",info:"#6366f1"};
  return(
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:10}}>
      {toasts.map(t=>(
        <div key={t.id} onClick={()=>remove(t.id)} style={{
          background:bg[t.type]||"#6366f1",color:"#fff",padding:"12px 18px",
          borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.2)",cursor:"pointer",
          display:"flex",alignItems:"center",gap:10,maxWidth:340,
          fontFamily:"'DM Sans',sans-serif",fontSize:14
        }}>
          <span style={{fontSize:16,fontWeight:700}}>{icons[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function Modal({title,children,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,15,25,.65)",backdropFilter:"blur(6px)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:20,padding:"32px 36px",width:"100%",maxWidth:480,
        boxShadow:"0 32px 64px rgba(0,0,0,.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h2 style={{margin:0,fontSize:20,fontWeight:700,color:"#1e1b4b",fontFamily:"'Playfair Display',serif"}}>{title}</h2>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:18,color:"#64748b"}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({label,children}){
  return(
    <div style={{marginBottom:16}}>
      <label style={{display:"block",marginBottom:6,fontSize:13,fontWeight:600,color:"#374151"}}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle={width:"100%",boxSizing:"border-box",padding:"10px 14px",border:"2px solid #e5e7eb",borderRadius:10,fontSize:14,color:"#1f2937",outline:"none",background:"#fafafa"};

function Input(props){ return <input {...props} style={inputStyle}/>; }
function Select({children,...props}){ return <select {...props} style={{...inputStyle,appearance:"none",cursor:"pointer"}}>{children}</select>; }

function Btn({children,variant="primary",small,...props}){
  const base={border:"none",borderRadius:small?8:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,padding:small?"6px 14px":"12px 22px",fontSize:small?12:14,display:"inline-flex",alignItems:"center",gap:6};
  const styles={
    primary:{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",boxShadow:"0 4px 14px rgba(99,102,241,.35)"},
    secondary:{background:"#f1f5f9",color:"#374151"},
    danger:{background:"#fee2e2",color:"#dc2626"},
    ghost:{background:"transparent",color:"#6366f1"},
  };
  return <button {...props} style={{...base,...styles[variant]}}>{children}</button>;
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function Login({onLogin}){
  const[email,setEmail]=useState("admin@planify.fr");
  const[pass,setPass]=useState("admin123");
  const submit=()=>{ if(email==="admin@planify.fr"&&pass==="admin123") onLogin(); };
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{background:"rgba(255,255,255,.05)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,.12)",borderRadius:24,padding:"48px 40px",width:"100%",maxWidth:420,boxShadow:"0 32px 64px rgba(0,0,0,.5)"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>📅</div>
          <h1 style={{margin:0,color:"#fff",fontSize:28,fontFamily:"'Playfair Display',serif"}}>Planify</h1>
          <p style={{color:"rgba(255,255,255,.5)",fontSize:14}}>Synchronisation Cloud</p>
        </div>
        <Field label={<span style={{color:"rgba(255,255,255,.7)"}}>Email</span>}>
          <Input value={email} onChange={e=>setEmail(e.target.value)} style={{...inputStyle,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"#fff"}}/>
        </Field>
        <Field label={<span style={{color:"rgba(255,255,255,.7)"}}>Mot de passe</span>}>
          <Input type="password" value={pass} onChange={e=>setPass(e.target.value)} style={{...inputStyle,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"#fff"}}/>
        </Field>
        <button onClick={submit} style={{width:"100%",padding:"14px",border:"none",borderRadius:12,cursor:"pointer",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontWeight:700}}>Connexion</button>
      </div>
    </div>
  );
}

// ── APP PRINCIPALE ────────────────────────────────────────────────────────────
export default function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [modals, setModals] = useState({ emp: null, sch: null, email: null });
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type="info") => {
    const id = Date.now();
    setToasts(p => [...p, {id, message, type}]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  // ── LOGIQUE CLOUD SUPABASE ──────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    const { data: emps } = await supabase.from('employees').select('*').order('name');
    const { data: schs } = await supabase.from('schedules').select('*');
    if (emps) setEmployees(emps);
    if (schs) setSchedules(schs);
    setLoading(false);
  };

  useEffect(() => { if(isLogged) fetchData(); }, [isLogged]);

  const saveEmployee = async (emp) => {
    const { error } = await supabase.from('employees').upsert(emp);
    if (!error) { fetchData(); addToast("Employé sauvegardé !"); setModals({emp:null}); }
  };

  const deleteEmployee = async (id) => {
    if (window.confirm("Supprimer définitivement cet employé ?")) {
      await supabase.from('employees').delete().eq('id', id);
      fetchData(); addToast("Supprimé", "error");
    }
  };

  const saveSchedule = async (sch) => {
    const { error } = await supabase.from('schedules').upsert(sch);
    if (!error) { fetchData(); addToast("Planning mis à jour !"); setModals({sch:null}); }
  };

  const deleteSchedule = async (id) => {
    await supabase.from('schedules').delete().eq('id', id);
    fetchData();
  };

  const handleSendEmail = async (emp, schs) => {
    addToast(`📧 Envoi à ${emp.name}...`);
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee: emp, schedules: schs }),
    });
    if (res.ok) addToast("✅ Email envoyé !");
    else addToast("❌ Erreur d'envoi", "error");
    setModals({email:null});
  };

  if (!isLogged) return <Login onLogin={() => setIsLogged(true)} />;
  if (loading) return <div style={{display:"flex",height:"100vh",alignItems:"center",justifyContent:"center",color:"#6366f1",fontFamily:"'DM Sans',sans-serif"}}>Synchronisation Cloud...</div>;

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",padding:20,fontFamily:"'DM Sans',sans-serif"}}>
      {/* HEADER */}
      <header style={{maxWidth:1200,margin:"0 auto 30px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h1 style={{margin:0,fontSize:32,fontWeight:900,color:"#1e1b4b",fontFamily:"'Playfair Display',serif"}}>Planify</h1>
          <p style={{margin:0,color:"#64748b"}}>Données synchronisées sur tous vos appareils</p>
        </div>
        <div style={{display:"flex",gap:12}}>
          <Btn onClick={() => setModals({emp:{}})}>+ Employé</Btn>
          <Btn variant="secondary" onClick={() => setModals({sch:{}})}>+ Créneau</Btn>
        </div>
      </header>

      {/* DASHBOARD STATS */}
      <div style={{maxWidth:1200,margin:"0 auto 30px",display:"flex",gap:20,flexWrap:"wrap"}}>
        <StatCard icon="👥" label="Employés" value={employees.length} color="#6366f1" />
        <StatCard icon="📅" label="Créneaux" value={schedules.length} color="#10b981" />
        <StatCard icon="⏱" label="Heures totales" value={totalHours(schedules)} color="#f59e0b" />
      </div>

      {/* MAIN CONTENT */}
      <main style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(380px, 1fr))",gap:25}}>
          {employees.map(emp => (
            <EmployeeCard 
              key={emp.id} 
              emp={emp} 
              schedules={schedules} 
              onEditEmp={() => setModals({emp:emp})}
              onDeleteEmp={() => deleteEmployee(emp.id)}
              onAddSch={() => setModals({sch:{employeeId:emp.id}})}
              onEmail={() => setModals({email:emp})}
              onDeleteSch={deleteSchedule}
            />
          ))}
        </div>
      </main>

      {/* MODALS */}
      {modals.emp && <EmployeeModal employee={modals.emp.id ? modals.emp : null} onSave={saveEmployee} onClose={() => setModals({emp:null})} />}
      {modals.sch && <ScheduleModal schedule={modals.sch.id ? modals.sch : modals.sch} employees={employees} onSave={saveSchedule} onClose={() => setModals({sch:null})} />}
      {modals.email && <EmailPreviewModal employee={modals.email} schedules={schedules} onSend={handleSendEmail} onClose={() => setModals({email:null})} />}
      
      <Toast toasts={toasts} remove={id => setToasts(p => p.filter(t => t.id !== id))} />
    </div>
  );
}

// ── COMPOSANTS SECONDAIRES ───────────────────────────────────────────────────

function EmployeeCard({emp, schedules, onEditEmp, onDeleteEmp, onAddSch, onEmail, onDeleteSch}){
  const empSch = schedules.filter(s => s.employeeId === emp.id);
  return (
    <div style={{background:"#fff",borderRadius:20,padding:25,boxShadow:"0 10px 25px -5px rgba(0,0,0,0.05)",borderTop:`5px solid ${emp.color||'#6366f1'}`}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
        <div style={{display:"flex",gap:15,alignItems:"center"}}>
          <div style={{width:45,height:45,borderRadius:14,background:emp.color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:18}}>{emp.name[0]}</div>
          <div><h3 style={{margin:0,fontSize:17,color:"#1e1b4b"}}>{emp.name}</h3><span style={{fontSize:12,color:"#94a3b8"}}>{emp.role}</span></div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={onEmail} style={iconBtn}>✉️</button>
          <button onClick={onEditEmp} style={iconBtn}>✏️</button>
          <button onClick={onDeleteEmp} style={iconBtnRed}>🗑️</button>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {DAYS.map(day => {
          const s = empSch.find(x => x.day === day);
          return (
            <div key={day} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"10px 12px",background:s?emp.color+"08":"#f8fafc",borderRadius:10,border:s?`1px solid ${emp.color}20`:"1px solid transparent"}}>
              <span style={{fontWeight:s?700:500,color:s?emp.color:"#64748b"}}>{day}</span>
              {s ? <div style={{display:"flex",gap:8,alignItems:"center"}}><span>{s.start} - {s.end}</span><button onClick={()=>onDeleteSch(s.id)} style={{border:"none",background:"none",color:"#ef4444",cursor:"pointer",fontSize:14}}>×</button></div> : <span style={{color:"#cbd5e1"}}>—</span>}
            </div>
          );
        })}
      </div>
      <Btn variant="ghost" style={{width:"100%",marginTop:15}} onClick={onAddSch}>+ Ajouter un créneau</Btn>
    </div>
  );
}

function EmployeeModal({employee, onSave, onClose}){
  const [f, setF] = useState(employee || {name:"", email:"", phone:"", role:""});
  return (
    <Modal title={employee?"Modifier l'employé":"Nouvel employé"} onClose={onClose}>
      <Field label="Nom complet"><Input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Ex: Jean Dupont"/></Field>
      <Field label="Email"><Input value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="jean@example.com"/></Field>
      <Field label="Téléphone"><Input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></Field>
      <Field label="Poste"><Input value={f.role} onChange={e=>setF({...f,role:e.target.value})}/></Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}>
        <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
        <Btn onClick={()=>onSave(f)}>{employee?"Mettre à jour":"Créer l'employé"}</Btn>
      </div>
    </Modal>
  );
}

function ScheduleModal({schedule, employees, onSave, onClose}){
  const [f, setF] = useState(schedule.id ? schedule : {employeeId:schedule.employeeId||employees[0]?.id, day:"Lundi", start:"08:00", end:"16:00"});
  return (
    <Modal title="Gestion du créneau" onClose={onClose}>
      <Field label="Employé">
        <Select value={f.employeeId} onChange={e=>setF({...f,employeeId:Number(e.target.value)})}>
          {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
      </Field>
      <Field label="Jour de la semaine">
        <Select value={f.day} onChange={e=>setF({...f,day:e.target.value})}>{DAYS.map(d=><option key={d}>{d}</option>)}</Select>
      </Field>
      <div style={{display:"flex",gap:12}}>
        <Field label="Heure début"><Select value={f.start} onChange={e=>setF({...f,start:e.target.value})}>{HOURS.map(h=><option key={h}>{h}</option>)}</Select></Field>
        <Field label="Heure fin"><Select value={f.end} onChange={e=>setF({...f,end:e.target.value})}>{HOURS.map(h=><option key={h}>{h}</option>)}</Select></Field>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={onClose}>Fermer</Btn>
        <Btn onClick={()=>onSave(f)}>Enregistrer le planning</Btn>
      </div>
    </Modal>
  );
}

function EmailPreviewModal({employee, schedules, onSend, onClose}){
  const empSch = schedules.filter(s => s.employeeId === employee.id);
  return (
    <Modal title="Aperçu du planning" onClose={onClose}>
      <div style={{background:"#f1f5f9",padding:20,borderRadius:15,fontSize:13,marginBottom:20,lineHeight:1.6}}>
        <p>Bonjour <strong>{employee.name}</strong>,</p>
        <p>Voici tes horaires pour la semaine :</p>
        {empSch.length === 0 ? <p>Aucun créneau prévu.</p> : empSch.map(s => <div key={s.id}>• {s.day} : <strong>{s.start} - {s.end}</strong></div>)}
      </div>
      <Btn style={{width:"100%"}} onClick={() => onSend(employee, empSch)}>📧 Envoyer l'email maintenant</Btn>
    </Modal>
  );
}

function StatCard({icon, label, value, color}){
  return (
    <div style={{background:"#fff",padding:"20px 24px",borderRadius:18,flex:"1 1 200px",display:"flex",alignItems:"center",gap:20,boxShadow:"0 4px 12px rgba(0,0,0,0.03)"}}>
      <div style={{fontSize:26,background:color+"15",width:54,height:54,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center"}}>{icon}</div>
      <div><p style={{margin:0,fontSize:13,color:"#94a3b8",fontWeight:600}}>{label}</p><h3 style={{margin:0,fontSize:24,color:"#1e1b4b"}}>{value}</h3></div>
    </div>
  );
}

const iconBtn = {background:"#f1f5f9", border:"none", borderRadius:10, padding:8, cursor:"pointer", transition:"0.2s"};
const iconBtnRed = {...iconBtn, color:"#ef4444"};
                   
