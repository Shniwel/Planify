import { useState, useCallback } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const DAY_SHORT = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const HOURS = Array.from({length:24},(_,i)=>`${String(i).padStart(2,"0")}:00`);
const COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6","#14b8a6"];

const INITIAL_EMPLOYEES = [
  {id:1,name:"Sophie Martin",email:"sophie@example.com",phone:"06 12 34 56 78",color:COLORS[0],role:"Caissière"},
  {id:2,name:"Luc Bernard",  email:"luc@example.com",  phone:"06 23 45 67 89",color:COLORS[1],role:"Gérant"},
  {id:3,name:"Emma Dubois",  email:"emma@example.com", phone:"06 34 56 78 90",color:COLORS[2],role:"Vendeuse"},
];
const INITIAL_SCHEDULES = [
  {id:1,employeeId:1,day:"Lundi",   start:"08:00",end:"16:00"},
  {id:2,employeeId:1,day:"Mardi",   start:"08:00",end:"16:00"},
  {id:3,employeeId:1,day:"Mercredi",start:"10:00",end:"18:00"},
  {id:4,employeeId:2,day:"Lundi",   start:"09:00",end:"17:00"},
  {id:5,employeeId:2,day:"Mercredi",start:"09:00",end:"17:00"},
  {id:6,employeeId:2,day:"Vendredi",start:"09:00",end:"17:00"},
  {id:7,employeeId:3,day:"Jeudi",   start:"12:00",end:"20:00"},
  {id:8,employeeId:3,day:"Vendredi",start:"12:00",end:"20:00"},
];

let nextId = 100;
const uid = () => ++nextId;

function timeToMin(t){const[h,m]=t.split(":").map(Number);return h*60+m;}
function duration(s,e){const d=timeToMin(e)-timeToMin(s);return d>0?`${Math.floor(d/60)}h${d%60?String(d%60).padStart(2,"0"):""}`:"—";}
function totalHours(list){return list.reduce((a,s)=>{const d=(timeToMin(s.end)-timeToMin(s.start))/60;return a+(d>0?d:0);},0).toFixed(1);}

// ── Real email sender (calls Vercel API) ──────────────────────────────────────
async function sendEmail(employee, schedules, action, toast) {
  try {
    toast(`📧 Envoi de l'email à ${employee.name}…`, "info");
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee, schedules, action }),
    });
    const data = await res.json();
    if (res.ok) {
      toast(`✅ Email envoyé à ${employee.email}`, "success");
    } else {
      toast(`⚠️ Erreur email : ${data.error || "inconnue"}`, "error");
    }
  } catch (err) {
    toast(`⚠️ Impossible de joindre le serveur email`, "error");
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
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
          animation:"slideIn .3s cubic-bezier(.34,1.56,.64,1)",
          fontFamily:"'DM Sans',sans-serif",fontSize:14
        }}>
          <span style={{fontSize:16,fontWeight:700}}>{icons[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function useToasts(){
  const[toasts,setToasts]=useState([]);
  const add=useCallback((message,type="info")=>{
    const id=uid();
    setToasts(p=>[...p,{id,message,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),4000);
  },[]);
  const remove=useCallback(id=>setToasts(p=>p.filter(t=>t.id!==id)),[]);
  return{toasts,add,remove};
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({title,children,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,15,25,.65)",backdropFilter:"blur(6px)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:20,padding:"32px 36px",width:"100%",maxWidth:480,
        boxShadow:"0 32px 64px rgba(0,0,0,.18)",animation:"popIn .25s cubic-bezier(.34,1.56,.64,1)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h2 style={{margin:0,fontSize:20,fontWeight:700,color:"#1e1b4b",fontFamily:"'Playfair Display',serif"}}>{title}</h2>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:8,width:32,height:32,
            cursor:"pointer",fontSize:18,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({label,children}){
  return(
    <div style={{marginBottom:16}}>
      <label style={{display:"block",marginBottom:6,fontSize:13,fontWeight:600,color:"#374151",fontFamily:"'DM Sans',sans-serif"}}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle={width:"100%",boxSizing:"border-box",padding:"10px 14px",border:"2px solid #e5e7eb",
  borderRadius:10,fontSize:14,color:"#1f2937",outline:"none",transition:"border .2s",
  fontFamily:"'DM Sans',sans-serif",background:"#fafafa"};

function Input(props){
  return <input {...props} style={inputStyle}
    onFocus={e=>e.target.style.borderColor="#6366f1"}
    onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>;
}

function Select({children,...props}){
  return(
    <select {...props} style={{...inputStyle,appearance:"none",cursor:"pointer"}}
      onFocus={e=>e.target.style.borderColor="#6366f1"}
      onBlur={e=>e.target.style.borderColor="#e5e7eb"}>
      {children}
    </select>
  );
}

function Btn({children,variant="primary",small,...props}){
  const base={border:"none",borderRadius:small?8:12,cursor:"pointer",
    fontFamily:"'DM Sans',sans-serif",fontWeight:600,transition:"all .15s",
    padding:small?"6px 14px":"12px 22px",fontSize:small?12:14,
    display:"inline-flex",alignItems:"center",gap:6};
  const styles={
    primary:{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",boxShadow:"0 4px 14px rgba(99,102,241,.35)"},
    secondary:{background:"#f1f5f9",color:"#374151"},
    danger:{background:"#fee2e2",color:"#dc2626"},
    ghost:{background:"transparent",color:"#6366f1"},
  };
  return <button {...props} style={{...base,...styles[variant]}}
    onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"}
    onMouseLeave={e=>e.currentTarget.style.transform="none"}>{children}</button>;
}

// ── Login ─────────────────────────────────────────────────────────────────────
function Login({onLogin}){
  const[email,setEmail]=useState("admin@planify.fr");
  const[pass,setPass]=useState("admin123");
  const[err,setErr]=useState("");
  const[loading,setLoading]=useState(false);
  const submit=()=>{
    setLoading(true);
    setTimeout(()=>{
      if(email==="admin@planify.fr"&&pass==="admin123")onLogin();
      else setErr("Identifiants incorrects. Essayez admin@planify.fr / admin123");
      setLoading(false);
    },800);
  };
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
      display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{position:"fixed",width:400,height:400,borderRadius:"50%",background:"rgba(99,102,241,.15)",
        filter:"blur(80px)",top:"-10%",left:"-10%",pointerEvents:"none"}}/>
      <div style={{position:"fixed",width:300,height:300,borderRadius:"50%",background:"rgba(139,92,246,.2)",
        filter:"blur(60px)",bottom:"5%",right:"5%",pointerEvents:"none"}}/>
      <div style={{background:"rgba(255,255,255,.05)",backdropFilter:"blur(20px)",
        border:"1px solid rgba(255,255,255,.12)",borderRadius:24,padding:"48px 40px",
        width:"100%",maxWidth:420,boxShadow:"0 32px 64px rgba(0,0,0,.5)"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
            margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,
            boxShadow:"0 8px 24px rgba(99,102,241,.5)"}}>📅</div>
          <h1 style={{margin:0,color:"#fff",fontSize:28,fontFamily:"'Playfair Display',serif"}}>Planify</h1>
          <p style={{margin:"8px 0 0",color:"rgba(255,255,255,.5)",fontSize:14}}>Gestion des horaires</p>
        </div>
        <Field label={<span style={{color:"rgba(255,255,255,.7)"}}>Email</span>}>
          <Input value={email} onChange={e=>setEmail(e.target.value)}
            style={{...inputStyle,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"#fff"}}
            type="email"/>
        </Field>
        <Field label={<span style={{color:"rgba(255,255,255,.7)"}}>Mot de passe</span>}>
          <Input value={pass} onChange={e=>setPass(e.target.value)}
            style={{...inputStyle,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"#fff"}}
            type="password" onKeyDown={e=>e.key==="Enter"&&submit()}/>
        </Field>
        {err&&<p style={{color:"#fca5a5",fontSize:13,margin:"-8px 0 16px",textAlign:"center"}}>{err}</p>}
        <button onClick={submit} disabled={loading} style={{width:"100%",padding:"14px",border:"none",
          borderRadius:12,cursor:"pointer",background:loading?"rgba(99,102,241,.4)":"linear-gradient(135deg,#6366f1,#8b5cf6)",
          color:"#fff",fontSize:15,fontWeight:700,fontFamily:"'DM Sans',sans-serif",
          boxShadow:"0 8px 24px rgba(99,102,241,.4)"}}>
          {loading?"Connexion…":"Se connecter"}
        </button>
        <p style={{textAlign:"center",color:"rgba(255,255,255,.35)",fontSize:12,marginTop:20}}>
          admin@planify.fr · admin123
        </p>
      </div>
    </div>
  );
}

// ── Employee Modal ────────────────────────────────────────────────────────────
function EmployeeModal({employee,onSave,onClose}){
  const[form,setForm]=useState(employee||{name:"",email:"",phone:"",role:""});
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const valid=form.name.trim()&&form.email.includes("@");
  return(
    <Modal title={employee?"Modifier l'employé":"Nouvel employé"} onClose={onClose}>
      <Field label="Nom complet"><Input value={form.name} onChange={set("name")} placeholder="Marie Dupont"/></Field>
      <Field label="Email"><Input type="email" value={form.email} onChange={set("email")} placeholder="marie@example.com"/></Field>
      <Field label="Téléphone"><Input value={form.phone} onChange={set("phone")} placeholder="06 XX XX XX XX"/></Field>
      <Field label="Poste">
        <Select value={form.role} onChange={set("role")}>
          <option value="">— Sélectionner —</option>
          {["Manager","Caissier(ère)","Vendeur(se)","Gérant(e)","Technicien(ne)","Assistant(e)"].map(r=><option key={r}>{r}</option>)}
        </Select>
      </Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
        <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
        <Btn disabled={!valid} onClick={()=>valid&&onSave({...form,id:employee?.id||uid(),color:employee?.color||COLORS[uid()%COLORS.length]})}>
          {employee?"Enregistrer":"Ajouter"}
        </Btn>
      </div>
    </Modal>
  );
}

// ── Schedule Modal ────────────────────────────────────────────────────────────
function ScheduleModal({schedule,employees,onSave,onClose}){
  const[form,setForm]=useState(schedule||{employeeId:employees[0]?.id||"",day:"Lundi",start:"08:00",end:"16:00"});
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const valid=form.employeeId&&form.start<form.end;
  return(
    <Modal title={schedule?"Modifier le créneau":"Nouveau créneau"} onClose={onClose}>
      <Field label="Employé">
        <Select value={form.employeeId} onChange={e=>setForm(p=>({...p,employeeId:Number(e.target.value)}))}>
          {employees.map(emp=><option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </Select>
      </Field>
      <Field label="Jour">
        <Select value={form.day} onChange={set("day")}>
          {DAYS.map(d=><option key={d}>{d}</option>)}
        </Select>
      </Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Début"><Select value={form.start} onChange={set("start")}>{HOURS.map(h=><option key={h}>{h}</option>)}</Select></Field>
        <Field label="Fin"><Select value={form.end} onChange={set("end")}>{HOURS.map(h=><option key={h}>{h}</option>)}</Select></Field>
      </div>
      {!valid&&form.start>=form.end&&<p style={{color:"#ef4444",fontSize:12,margin:"-8px 0 8px"}}>L'heure de fin doit être après le début</p>}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
        <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
        <Btn disabled={!valid} onClick={()=>valid&&onSave({...form,id:schedule?.id||uid(),employeeId:Number(form.employeeId)})}>
          {schedule?"Enregistrer":"Ajouter"}
        </Btn>
      </div>
    </Modal>
  );
}

// ── Email Preview Modal ───────────────────────────────────────────────────────
function EmailPreviewModal({employee,schedules,onClose,onSendNow}){
  const empSchedules=schedules.filter(s=>s.employeeId===employee.id);
  const[sending,setSending]=useState(false);
  return(
    <Modal title="Aperçu & envoi de l'email" onClose={onClose}>
      <div style={{background:"#f8fafc",borderRadius:12,padding:20,fontFamily:"monospace",fontSize:13,lineHeight:1.7,maxHeight:320,overflowY:"auto"}}>
        <p style={{margin:0,color:"#64748b"}}>À : <strong style={{color:"#1e1b4b"}}>{employee.email}</strong></p>
        <p style={{margin:0,color:"#64748b"}}>Objet : <strong style={{color:"#1e1b4b"}}>📅 Votre planning de la semaine</strong></p>
        <hr style={{border:"none",borderTop:"1px solid #e5e7eb",margin:"12px 0"}}/>
        <p>Bonjour <strong>{employee.name.split(" ")[0]}</strong>,</p>
        <p>Voici votre planning pour la semaine :</p>
        {empSchedules.length===0
          ?<p style={{color:"#94a3b8"}}>Aucun créneau assigné.</p>
          :empSchedules.map(s=>(
            <div key={s.id} style={{padding:"4px 0",borderLeft:"3px solid #6366f1",paddingLeft:10,marginBottom:6}}>
              📅 <strong>{s.day}</strong> : {s.start} – {s.end} <span style={{color:"#64748b"}}>({duration(s.start,s.end)})</span>
            </div>
          ))
        }
        <p>⏱ Total : <strong>{totalHours(empSchedules)}h</strong></p>
        <p>Cordialement,<br/><strong>L'équipe RH — Planify</strong></p>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
        <Btn variant="secondary" onClick={onClose}>Fermer</Btn>
        <Btn disabled={sending} onClick={async()=>{
          setSending(true);
          await onSendNow(employee,empSchedules,"envoi_manuel");
          setSending(false);
          onClose();
        }}>
          {sending?"Envoi…":"📧 Envoyer maintenant"}
        </Btn>
      </div>
    </Modal>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({icon,label,value,color}){
  return(
    <div style={{background:"#fff",borderRadius:16,padding:"20px 24px",
      boxShadow:"0 2px 12px rgba(0,0,0,.06)",display:"flex",alignItems:"center",gap:16,flex:"1 1 180px"}}>
      <div style={{width:48,height:48,borderRadius:14,background:color+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{icon}</div>
      <div>
        <p style={{margin:0,fontSize:13,color:"#94a3b8",fontWeight:500}}>{label}</p>
        <p style={{margin:0,fontSize:26,fontWeight:800,color:"#1e1b4b"}}>{value}</p>
      </div>
    </div>
  );
}

// ── Calendar view ─────────────────────────────────────────────────────────────
function CalendarView({employees,schedules,onEdit,onDelete}){
  return(
    <div style={{overflowX:"auto"}}>
      <div style={{minWidth:700}}>
        <div style={{display:"grid",gridTemplateColumns:"80px repeat(7,1fr)",gap:4,marginBottom:4}}>
          <div/>
          {DAY_SHORT.map(d=>(
            <div key={d} style={{textAlign:"center",fontSize:13,fontWeight:700,color:"#6366f1",padding:"8px 0",
              background:"#eef2ff",borderRadius:10}}>{d}</div>
          ))}
        </div>
        {employees.map(emp=>{
          const empSch=schedules.filter(s=>s.employeeId===emp.id);
          return(
            <div key={emp.id} style={{display:"grid",gridTemplateColumns:"80px repeat(7,1fr)",gap:4,marginBottom:4,alignItems:"stretch"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 4px"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:emp.color,flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:600,color:"#475569",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {emp.name.split(" ")[0]}
                </span>
              </div>
              {DAYS.map(day=>{
                const slot=empSch.find(s=>s.day===day);
                return(
                  <div key={day} style={{minHeight:60,borderRadius:10,position:"relative",
                    background:slot?emp.color+"18":"#f8fafc",
                    border:slot?`1.5px solid ${emp.color}40`:"1.5px solid #f1f5f9"}}>
                    {slot&&(
                      <div style={{padding:"8px 10px"}}>
                        <p style={{margin:0,fontSize:11,fontWeight:700,color:emp.color}}>{slot.start}–{slot.end}</p>
                        <p style={{margin:"2px 0 0",fontSize:10,color:"#94a3b8"}}>{duration(slot.start,slot.end)}</p>
                        <div style={{position:"absolute",top:6,right:6,display:"flex",gap:3}}>
                          <button onClick={()=>onEdit(slot)} style={{background:"#fff",border:"none",borderRadius:5,width:20,height:20,cursor:"pointer",fontSize:10,color:"#6366f1"}}>✏</button>
                          <button onClick={()=>onDelete(slot.id)} style={{background:"#fff",border:"none",borderRadius:5,width:20,height:20,cursor:"pointer",fontSize:10,color:"#ef4444"}}>✕</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Employee card ─────────────────────────────────────────────────────────────
function EmployeeCard({emp,schedules,onEdit,onDelete,onEmailPreview}){
  const empSch=schedules.filter(s=>s.employeeId===emp.id);
  return(
    <div style={{background:"#fff",borderRadius:16,padding:20,boxShadow:"0 2px 12px rgba(0,0,0,.06)",
      border:`2px solid ${emp.color}25`,transition:"transform .2s,box-shadow .2s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.1)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.06)";}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:46,height:46,borderRadius:14,background:emp.color,display:"flex",alignItems:"center",
            justifyContent:"center",color:"#fff",fontWeight:800,fontSize:18,fontFamily:"'Playfair Display',serif"}}>
            {emp.name[0]}
          </div>
          <div>
            <p style={{margin:0,fontWeight:700,color:"#1e1b4b",fontSize:15}}>{emp.name}</p>
            <p style={{margin:0,fontSize:12,color:"#94a3b8"}}>{emp.role||"—"}</p>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <Btn small
