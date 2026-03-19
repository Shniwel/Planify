import { useState, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_APP_SUPABASE_URL,
  import.meta.env.VITE_APP_SUPABASE_ANON_KEY
);

const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const DAY_SHORT = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const HOURS = Array.from({length:24},(_,i)=>`${String(i).padStart(2,"0")}:00`);
const COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6","#14b8a6"];

const CATEGORIES = {
  "Production": {
    color: "#10b981",
    icon: "🏭",
    sub: ["Ligne 1", "Ligne 2"]
  },
  "Maintenance": {
    color: "#f59e0b",
    icon: "🔧",
    sub: ["Maintenance"]
  }
};

function timeToMin(t){const[h,m]=t.split(":").map(Number);return h*60+m;}
function duration(s,e){const d=timeToMin(e)-timeToMin(s);return d>0?`${Math.floor(d/60)}h${d%60?String(d%60).padStart(2,"0"):""}`:"—";}
function totalHours(list){return list.reduce((a,s)=>{const d=(timeToMin(s.end)-timeToMin(s.start))/60;return a+(d>0?d:0);},0).toFixed(1);}

async function sendEmail(employee, schedules, action, toast) {
  try {
    toast(`📧 Envoi de l'email à ${employee.name}…`, "info");
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee, schedules, action }),
    });
    const data = await res.json();
    if (res.ok) toast(`✅ Email envoyé à ${employee.email}`, "success");
    else toast(`⚠️ Erreur email : ${data.error || "inconnue"}`, "error");
  } catch { toast(`⚠️ Impossible de joindre le serveur email`, "error"); }
}

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

let _toastId = 0;
function useToasts(){
  const[toasts,setToasts]=useState([]);
  const add=useCallback((message,type="info")=>{
    const id=++_toastId;
    setToasts(p=>[...p,{id,message,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),4000);
  },[]);
  const remove=useCallback(id=>setToasts(p=>p.filter(t=>t.id!==id)),[]);
  return{toasts,add,remove};
}

function Modal({title,children,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,15,25,.65)",backdropFilter:"blur(6px)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:20,padding:"32px 36px",width:"100%",maxWidth:520,
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
  return <input {...props} style={{...inputStyle,...(props.style||{})}}
    onFocus={e=>e.target.style.borderColor="#6366f1"}
    onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>;
}

function Sel({children,...props}){
  return(
    <select {...props} style={{...inputStyle,appearance:"none",cursor:"pointer",...(props.style||{})}}
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
  return <button {...props} style={{...base,...styles[variant],...(props.disabled?{opacity:.5,cursor:"not-allowed"}:{})}}
    onMouseEnter={e=>!props.disabled&&(e.currentTarget.style.transform="translateY(-1px)")}
    onMouseLeave={e=>e.currentTarget.style.transform="none"}>{children}</button>;
}

// ── Category Badge ────────────────────────────────────────────────────────────
function CatBadge({category, subcategory, small}){
  const cat = CATEGORIES[category];
  if (!cat) return null;
  return(
    <div style={{display:"inline-flex",alignItems:"center",gap:4}}>
      <span style={{
        fontSize:small?10:11,padding:small?"2px 6px":"3px 10px",borderRadius:20,
        background:cat.color+"18",color:cat.color,fontWeight:700,
        border:`1px solid ${cat.color}30`
      }}>{cat.icon} {category}</span>
      {subcategory&&subcategory!==category&&(
        <span style={{
          fontSize:small?10:11,padding:small?"2px 6px":"3px 10px",borderRadius:20,
          background:"#f1f5f9",color:"#64748b",fontWeight:600
        }}>{subcategory}</span>
      )}
    </div>
  );
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
      else setErr("Identifiants incorrects.");
      setLoading(false);
    },800);
  };
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
      display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{position:"fixed",width:400,height:400,borderRadius:"50%",background:"rgba(99,102,241,.15)",filter:"blur(80px)",top:"-10%",left:"-10%",pointerEvents:"none"}}/>
      <div style={{position:"fixed",width:300,height:300,borderRadius:"50%",background:"rgba(139,92,246,.2)",filter:"blur(60px)",bottom:"5%",right:"5%",pointerEvents:"none"}}/>
      <div style={{background:"rgba(255,255,255,.05)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,.12)",borderRadius:24,padding:"48px 40px",width:"100%",maxWidth:420,boxShadow:"0 32px 64px rgba(0,0,0,.5)"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,boxShadow:"0 8px 24px rgba(99,102,241,.5)"}}>📅</div>
          <h1 style={{margin:0,color:"#fff",fontSize:28,fontFamily:"'Playfair Display',serif"}}>Planify</h1>
          <p style={{margin:"8px 0 0",color:"rgba(255,255,255,.5)",fontSize:14}}>Gestion des horaires</p>
        </div>
        <Field label={<span style={{color:"rgba(255,255,255,.7)"}}>Email</span>}>
          <Input value={email} onChange={e=>setEmail(e.target.value)} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"#fff"}} type="email"/>
        </Field>
        <Field label={<span style={{color:"rgba(255,255,255,.7)"}}>Mot de passe</span>}>
          <Input value={pass} onChange={e=>setPass(e.target.value)} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"#fff"}} type="password" onKeyDown={e=>e.key==="Enter"&&submit()}/>
        </Field>
        {err&&<p style={{color:"#fca5a5",fontSize:13,margin:"-8px 0 16px",textAlign:"center"}}>{err}</p>}
        <button onClick={submit} disabled={loading} style={{width:"100%",padding:"14px",border:"none",borderRadius:12,cursor:"pointer",background:loading?"rgba(99,102,241,.4)":"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontSize:15,fontWeight:700,fontFamily:"'DM Sans',sans-serif",boxShadow:"0 8px 24px rgba(99,102,241,.4)"}}>
          {loading?"Connexion…":"Se connecter"}
        </button>
        <p style={{textAlign:"center",color:"rgba(255,255,255,.35)",fontSize:12,marginTop:20}}>admin@planify.fr · admin123</p>
      </div>
    </div>
  );
}

// ── Employee Modal ─────────────────────────────────────────────────────────────
function EmployeeModal({employee,onSave,onClose}){
  const[form,setForm]=useState(employee||{name:"",email:"",phone:"",role:"",category:"",subcategory:""});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const valid=form.name.trim()&&form.email.includes("@");
  const subOptions = form.category ? CATEGORIES[form.category]?.sub || [] : [];

  return(
    <Modal title={employee?"Modifier l'employé":"Nouvel employé"} onClose={onClose}>
      <Field label="Nom complet"><Input value={form.name} onChange={set("name")} placeholder="Marie Dupont"/></Field>
      <Field label="Email"><Input type="email" value={form.email} onChange={set("email")} placeholder="marie@example.com"/></Field>
      <Field label="Téléphone"><Input value={form.phone||""} onChange={set("phone")} placeholder="06 XX XX XX XX"/></Field>
      <Field label="Poste">
        <Sel value={form.role||""} onChange={set("role")}>
          <option value="">— Sélectionner —</option>
          {["Manager","Opérateur","Technicien","Chef d'équipe","Agent de maintenance","Superviseur"].map(r=><option key={r}>{r}</option>)}
        </Sel>
      </Field>

      {/* Séparateur catégorie */}
      <div style={{borderTop:"1px solid #f1f5f9",margin:"8px 0 16px",paddingTop:16}}>
        <p style={{margin:"0 0 12px",fontSize:12,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em"}}>Classification</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Catégorie">
            <Sel value={form.category||""} onChange={e=>{
              setForm(p=>({...p,category:e.target.value,subcategory:CATEGORIES[e.target.value]?.sub[0]||""}));
            }}>
              <option value="">— Aucune —</option>
              {Object.entries(CATEGORIES).map(([k,v])=>(
                <option key={k} value={k}>{v.icon} {k}</option>
              ))}
            </Sel>
          </Field>
          <Field label="Sous-catégorie">
            <Sel value={form.subcategory||""} onChange={set("subcategory")} disabled={!form.category}>
              <option value="">— Aucune —</option>
              {subOptions.map(s=><option key={s} value={s}>{s}</option>)}
            </Sel>
          </Field>
        </div>
      </div>

      {/* Aperçu catégorie */}
      {form.category&&(
        <div style={{background:CATEGORIES[form.category]?.color+"10",border:`1px solid ${CATEGORIES[form.category]?.color}30`,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>{CATEGORIES[form.category]?.icon}</span>
          <div>
            <p style={{margin:0,fontSize:13,fontWeight:700,color:CATEGORIES[form.category]?.color}}>{form.category}</p>
            {form.subcategory&&<p style={{margin:0,fontSize:11,color:"#64748b"}}>{form.subcategory}</p>}
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
        <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
        <Btn disabled={!valid||saving} onClick={async()=>{setSaving(true);await onSave(form);setSaving(false);}}>
          {saving?"Sauvegarde…":employee?"Enregistrer":"Ajouter"}
        </Btn>
      </div>
    </Modal>
  );
}

// ── Schedule Modal ────────────────────────────────────────────────────────────
function ScheduleModal({schedule,employees,onSave,onClose}){
  const[form,setForm]=useState(schedule||{employee_id:employees[0]?.id||"",day:"Lundi",start:"08:00",end:"16:00"});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const valid=form.employee_id&&form.start<form.end;
  return(
    <Modal title={schedule?"Modifier le créneau":"Nouveau créneau"} onClose={onClose}>
      <Field label="Employé">
        <Sel value={form.employee_id} onChange={e=>setForm(p=>({...p,employee_id:e.target.value}))}>
          {employees.map(emp=><option key={emp.id} value={emp.id}>{emp.name}{emp.category?` — ${emp.category}`:""}</option>)}
        </Sel>
      </Field>
      <Field label="Jour"><Sel value={form.day} onChange={set("day")}>{DAYS.map(d=><option key={d}>{d}</option>)}</Sel></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Début"><Sel value={form.start} onChange={set("start")}>{HOURS.map(h=><option key={h}>{h}</option>)}</Sel></Field>
        <Field label="Fin"><Sel value={form.end} onChange={set("end")}>{HOURS.map(h=><option key={h}>{h}</option>)}</Sel></Field>
      </div>
      {!valid&&form.start>=form.end&&<p style={{color:"#ef4444",fontSize:12,margin:"-8px 0 8px"}}>L'heure de fin doit être après le début</p>}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
        <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
        <Btn disabled={!valid||saving} onClick={async()=>{setSaving(true);await onSave(form);setSaving(false);}}>
          {saving?"Sauvegarde…":schedule?"Enregistrer":"Ajouter"}
        </Btn>
      </div>
    </Modal>
  );
}

function EmailPreviewModal({employee,schedules,onClose,onSendNow}){
  const empSchedules=schedules.filter(s=>s.employee_id===employee.id);
  const[sending,setSending]=useState(false);
  return(
    <Modal title="Aperçu & envoi de l'email" onClose={onClose}>
      <div style={{background:"#f8fafc",borderRadius:12,padding:20,fontFamily:"monospace",fontSize:13,lineHeight:1.7,maxHeight:320,overflowY:"auto"}}>
        <p style={{margin:0,color:"#64748b"}}>À : <strong style={{color:"#1e1b4b"}}>{employee.email}</strong></p>
        <p style={{margin:0,color:"#64748b"}}>Objet : <strong style={{color:"#1e1b4b"}}>📅 Votre planning</strong></p>
        <hr style={{border:"none",borderTop:"1px solid #e5e7eb",margin:"12px 0"}}/>
        <p>Bonjour <strong>{employee.name.split(" ")[0]}</strong>,</p>
        {empSchedules.length===0?<p style={{color:"#94a3b8"}}>Aucun créneau assigné.</p>
          :empSchedules.map(s=>(
            <div key={s.id} style={{padding:"4px 0",borderLeft:"3px solid #6366f1",paddingLeft:10,marginBottom:6}}>
              📅 <strong>{s.day}</strong> : {s.start} – {s.end} ({duration(s.start,s.end)})
            </div>
          ))
        }
        <p>⏱ Total : <strong>{totalHours(empSchedules)}h</strong></p>
        <p>Cordialement,<br/><strong>L'équipe RH — Planify</strong></p>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
        <Btn variant="secondary" onClick={onClose}>Fermer</Btn>
        <Btn disabled={sending} onClick={async()=>{setSending(true);await onSendNow(employee,empSchedules,"envoi_manuel");setSending(false);onClose();}}>
          {sending?"Envoi…":"📧 Envoyer maintenant"}
        </Btn>
      </div>
    </Modal>
  );
}

function StatCard({icon,label,value,color}){
  return(
    <div style={{background:"#fff",borderRadius:16,padding:"20px 24px",boxShadow:"0 2px 12px rgba(0,0,0,.06)",display:"flex",alignItems:"center",gap:16,flex:"1 1 160px"}}>
      <div style={{width:48,height:48,borderRadius:14,background:color+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{icon}</div>
      <div>
        <p style={{margin:0,fontSize:13,color:"#94a3b8",fontWeight:500}}>{label}</p>
        <p style={{margin:0,fontSize:26,fontWeight:800,color:"#1e1b4b"}}>{value}</p>
      </div>
    </div>
  );
}

function CalendarView({employees,schedules,onEdit,onDelete}){
  return(
    <div style={{overflowX:"auto"}}>
      <div style={{minWidth:700}}>
        <div style={{display:"grid",gridTemplateColumns:"90px repeat(7,1fr)",gap:4,marginBottom:4}}>
          <div/>
          {DAY_SHORT.map(d=><div key={d} style={{textAlign:"center",fontSize:13,fontWeight:700,color:"#6366f1",padding:"8px 0",background:"#eef2ff",borderRadius:10}}>{d}</div>)}
        </div>
        {employees.map(emp=>{
          const empSch=schedules.filter(s=>s.employee_id===emp.id);
          const catColor = emp.category ? CATEGORIES[emp.category]?.color : emp.color;
          return(
            <div key={emp.id} style={{display:"grid",gridTemplateColumns:"90px repeat(7,1fr)",gap:4,marginBottom:4,alignItems:"stretch"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 4px"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:catColor||emp.color,flexShrink:0}}/>
                <div>
                  <span style={{fontSize:10,fontWeight:700,color:"#475569",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{emp.name.split(" ")[0]}</span>
                  {emp.subcategory&&<span style={{fontSize:9,color:"#94a3b8"}}>{emp.subcategory}</span>}
                </div>
              </div>
              {DAYS.map(day=>{
                const slot=empSch.find(s=>s.day===day);
                const c=catColor||emp.color;
                return(
                  <div key={day} style={{minHeight:60,borderRadius:10,position:"relative",background:slot?c+"18":"#f8fafc",border:slot?`1.5px solid ${c}40`:"1.5px solid #f1f5f9"}}>
                    {slot&&(
                      <div style={{padding:"8px 10px"}}>
                        <p style={{margin:0,fontSize:11,fontWeight:700,color:c}}>{slot.start}–{slot.end}</p>
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

function EmployeeCard({emp,schedules,onEdit,onDelete,onEmailPreview}){
  const empSch=schedules.filter(s=>s.employee_id===emp.id);
  const catColor = emp.category ? CATEGORIES[emp.category]?.color : emp.color;
  return(
    <div style={{background:"#fff",borderRadius:16,padding:20,boxShadow:"0 2px 12px rgba(0,0,0,.06)",border:`2px solid ${catColor}25`,transition:"transform .2s,box-shadow .2s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.1)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.06)";}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:46,height:46,borderRadius:14,background:catColor,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:18}}>{emp.name[0]}</div>
          <div>
            <p style={{margin:0,fontWeight:700,color:"#1e1b4b",fontSize:15}}>{emp.name}</p>
            <p style={{margin:0,fontSize:12,color:"#94a3b8"}}>{emp.role||"—"}</p>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <Btn small variant="ghost" onClick={()=>onEmailPreview(emp)}>📧</Btn>
          <Btn small variant="secondary" onClick={()=>onEdit(emp)}>✏</Btn>
          <Btn small variant="danger" onClick={()=>onDelete(emp.id)}>🗑</Btn>
        </div>
      </div>

      {/* Catégorie badge */}
      {emp.category&&(
        <div style={{marginTop:10}}>
          <CatBadge category={emp.category} subcategory={emp.subcategory}/>
        </div>
      )}

      <div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:6}}>
        <span style={{fontSize:12,color:"#64748b"}}>📩 {emp.email}</span>
        {emp.phone&&<span style={{fontSize:12,color:"#64748b"}}>📞 {emp.phone}</span>}
      </div>
      <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
        {empSch.length===0?<span style={{fontSize:11,color:"#cbd5e1",fontStyle:"italic"}}>Aucun créneau</span>
          :empSch.map(s=><span key={s.id} style={{fontSize:11,padding:"3px 8px",borderRadius:20,background:catColor+"18",color:catColor,fontWeight:600}}>{s.day.slice(0,3)} {s.start}–{s.end}</span>)}
      </div>
      <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between"}}>
        <span style={{fontSize:12,color:"#94a3b8"}}>{empSch.length} créneau{empSch.length!==1?"x":""}</span>
        <span style={{fontSize:12,fontWeight:700,color:catColor}}>{totalHours(empSch)}h / semaine</span>
      </div>
    </div>
  );
}

const NAV=[
  {id:"dashboard",icon:"◉",label:"Tableau de bord"},
  {id:"employees",icon:"👥",label:"Employés"},
  {id:"calendar",icon:"📅",label:"Calendrier"},
  {id:"schedules",icon:"🕐",label:"Horaires"},
];

function Sidebar({active,onNav,onLogout,collapsed,toggleCollapsed}){
  return(
    <div style={{width:collapsed?68:220,background:"linear-gradient(180deg,#1e1b4b,#312e81)",height:"100vh",display:"flex",flexDirection:"column",transition:"width .3s cubic-bezier(.4,0,.2,1)",boxShadow:"4px 0 20px rgba(0,0,0,.15)",flexShrink:0,position:"sticky",top:0}}>
      <div style={{padding:"24px 16px 20px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(255,255,255,.08)"}}>
        <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📅</div>
        {!collapsed&&<span style={{color:"#fff",fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700}}>Planify</span>}
      </div>
      <nav style={{flex:1,padding:"12px 10px"}}>
        {NAV.map(item=>{
          const isActive=active===item.id;
          return(
            <button key={item.id} onClick={()=>onNav(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"11px 12px",borderRadius:12,border:"none",cursor:"pointer",marginBottom:4,transition:"all .15s",background:isActive?"rgba(99,102,241,.3)":"transparent",color:isActive?"#a5b4fc":"rgba(255,255,255,.55)",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:isActive?600:400,textAlign:"left"}}
              onMouseEnter={e=>!isActive&&(e.currentTarget.style.background="rgba(255,255,255,.06)")}
              onMouseLeave={e=>!isActive&&(e.currentTarget.style.background="transparent")}>
              <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
              {!collapsed&&<span style={{whiteSpace:"nowrap"}}>{item.label}</span>}
            </button>
          );
        })}

        {/* Catégories dans sidebar */}
        {!collapsed&&(
          <div style={{marginTop:16,padding:"0 4px"}}>
            <p style={{margin:"0 0 8px",fontSize:10,fontWeight:700,color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:".08em"}}>Catégories</p>
            {Object.entries(CATEGORIES).map(([k,v])=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:8,marginBottom:2}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:v.color,flexShrink:0}}/>
                <span style={{fontSize:12,color:"rgba(255,255,255,.5)"}}>{v.icon} {k}</span>
              </div>
            ))}
          </div>
        )}
      </nav>
      <div style={{padding:"12px 10px",borderTop:"1px solid rgba(255,255,255,.08)"}}>
        <button onClick={toggleCollapsed} style={{width:"100%",padding:"9px 12px",borderRadius:10,border:"none",cursor:"pointer",background:"transparent",color:"rgba(255,255,255,.4)",display:"flex",alignItems:"center",gap:10,fontSize:13,fontFamily:"'DM Sans',sans-serif",marginBottom:6}}>
          <span>{collapsed?"▶":"◀"}</span>{!collapsed&&"Réduire"}
        </button>
        <button onClick={onLogout} style={{width:"100%",padding:"9px 12px",borderRadius:10,border:"none",cursor:"pointer",background:"rgba(239,68,68,.12)",color:"#fca5a5",display:"flex",alignItems:"center",gap:10,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>
          <span>⏻</span>{!collapsed&&"Déconnexion"}
        </button>
      </div>
    </div>
  );
}

export default function App(){
  const[authed,setAuthed]=useState(false);
  const[page,setPage]=useState("dashboard");
  const[sideCollapsed,setSideCollapsed]=useState(false);
  const[employees,setEmployees]=useState([]);
  const[schedules,setSchedules]=useState([]);
  const[loading,setLoading]=useState(true);
  const[filterCat,setFilterCat]=useState("all");
  const{toasts,add:toast,remove:removeToast}=useToasts();
  const[empModal,setEmpModal]=useState(null);
  const[schModal,setSchModal]=useState(null);
  const[emailModal,setEmailModal]=useState(null);

  const loadData=useCallback(async()=>{
    setLoading(true);
    const[{data:emps},{data:schs}]=await Promise.all([
      supabase.from("employees").select("*").order("name"),
      supabase.from("schedules").select("*"),
    ]);
    if(emps)setEmployees(emps);
    if(schs)setSchedules(schs);
    setLoading(false);
  },[]);

  useEffect(()=>{if(authed)loadData();},[authed,loadData]);

  const saveEmployee=async(form)=>{
    const colorIndex=employees.length%COLORS.length;
    const catColor = form.category ? CATEGORIES[form.category]?.color : COLORS[colorIndex];
    if(form.id){
      await supabase.from("employees").update({
        name:form.name,email:form.email,phone:form.phone,role:form.role,
        category:form.category||null,subcategory:form.subcategory||null,color:catColor
      }).eq("id",form.id);
      toast(`${form.name} mis à jour ✅`,"success");
    }else{
      await supabase.from("employees").insert({
        name:form.name,email:form.email,phone:form.phone,role:form.role,
        category:form.category||null,subcategory:form.subcategory||null,color:catColor
      });
      toast(`${form.name} ajouté ✅`,"success");
    }
    await loadData();
    setEmpModal(null);
  };

  const deleteEmployee=async(id)=>{
    const emp=employees.find(e=>e.id===id);
    await supabase.from("schedules").delete().eq("employee_id",id);
    await supabase.from("employees").delete().eq("id",id);
    toast(`${emp?.name} supprimé`,"info");
    await loadData();
  };

  const saveSchedule=async(form)=>{
    const isEdit=!!form.id;
    const emp=employees.find(e=>e.id===form.employee_id);
    if(isEdit){
      await supabase.from("schedules").update({employee_id:form.employee_id,day:form.day,start:form.start,end:form.end}).eq("id",form.id);
    }else{
      await supabase.from("schedules").insert({employee_id:form.employee_id,day:form.day,start:form.start,end:form.end});
    }
    toast(`Créneau ${isEdit?"modifié":"ajouté"} pour ${emp?.name} ✅`,"success");
    await loadData();
    setSchModal(null);
    if(emp){
      const empScheds=schedules.filter(s=>s.employee_id===emp.id);
      setTimeout(()=>sendEmail(emp,empScheds,isEdit?"modification":"creation",toast),500);
    }
  };

  const deleteSchedule=async(id)=>{
    const sch=schedules.find(s=>s.id===id);
    const emp=employees.find(e=>e.id===sch?.employee_id);
    await supabase.from("schedules").delete().eq("id",id);
    toast(`Créneau supprimé${emp?` (${emp.name})`:""}`,"info");
    await loadData();
  };

  const filteredEmployees = filterCat==="all" ? employees : employees.filter(e=>e.category===filterCat);

  const totalHoursAll=schedules.reduce((a,s)=>{const d=(timeToMin(s.end)-timeToMin(s.start))/60;return a+(d>0?d:0);},0).toFixed(0);
  const busyDay=(()=>{const cnt={};schedules.forEach(s=>{cnt[s.day]=(cnt[s.day]||0)+1;});return Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]?.[0]||"—";})();
  const prodCount=employees.filter(e=>e.category==="Production").length;
  const maintCount=employees.filter(e=>e.category==="Maintenance").length;

  if(!authed)return <Login onLogin={()=>setAuthed(true)}/>;

  return(
    <div style={{display:"flex",minHeight:"100vh",background:"#f8faff",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
        @keyframes popIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        body{margin:0;}
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-track{background:#f1f5f9;}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px;}
      `}</style>

      <Sidebar active={page} onNav={setPage} onLogout={()=>setAuthed(false)} collapsed={sideCollapsed} toggleCollapsed={()=>setSideCollapsed(p=>!p)}/>

      <main style={{flex:1,overflow:"auto"}}>
        <header style={{background:"#fff",borderBottom:"1px solid #f1f5f9",padding:"16px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10,boxShadow:"0 1px 8px rgba(0,0,0,.04)"}}>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:"#1e1b4b",fontFamily:"'Playfair Display',serif"}}>{NAV.find(n=>n.id===page)?.label}</h1>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {page==="employees"&&<Btn onClick={()=>setEmpModal({mode:"add"})}>+ Ajouter un employé</Btn>}
            {(page==="schedules"||page==="calendar")&&<Btn onClick={()=>setSchModal({mode:"add"})}>+ Nouveau créneau</Btn>}
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:700}}>A</div>
          </div>
        </header>

        {loading?(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",flexDirection:"column",gap:16}}>
            <div style={{width:40,height:40,border:"4px solid #e5e7eb",borderTop:"4px solid #6366f1",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
            <p style={{color:"#94a3b8",fontSize:14}}>Chargement…</p>
          </div>
        ):(
        <div style={{padding:"28px 32px",animation:"fadeUp .35s ease"}}>

          {/* DASHBOARD */}
          {page==="dashboard"&&(
            <div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:28}}>
                <StatCard icon="👥" label="Total employés" value={employees.length} color="#6366f1"/>
                <StatCard icon="🏭" label="Production" value={prodCount} color="#10b981"/>
                <StatCard icon="🔧" label="Maintenance" value={maintCount} color="#f59e0b"/>
                <StatCard icon="⏱" label="Heures/semaine" value={`${totalHoursAll}h`} color="#0ea5e9"/>
                <StatCard icon="📆" label="Jour chargé" value={busyDay} color="#ec4899"/>
              </div>

              {/* Résumé par catégorie */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,marginBottom:24}}>
                {Object.entries(CATEGORIES).map(([catName,cat])=>{
                  const catEmps=employees.filter(e=>e.category===catName);
                  const catSchs=schedules.filter(s=>catEmps.some(e=>e.id===s.employee_id));
                  return(
                    <div key={catName} style={{background:"#fff",borderRadius:16,padding:20,boxShadow:"0 2px 12px rgba(0,0,0,.06)",borderLeft:`4px solid ${cat.color}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                        <span style={{fontSize:24}}>{cat.icon}</span>
                        <div>
                          <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#1e1b4b"}}>{catName}</h3>
                          <p style={{margin:0,fontSize:12,color:"#94a3b8"}}>{catEmps.length} employé{catEmps.length!==1?"s":""}</p>
                        </div>
                      </div>
                      {/* Sous-catégories */}
                      {cat.sub.map(sub=>{
                        const subEmps=catEmps.filter(e=>e.subcategory===sub);
                        return(
                          <div key={sub} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",borderRadius:8,background:cat.color+"08",marginBottom:4}}>
                            <span style={{fontSize:13,color:"#374151",fontWeight:500}}>{sub}</span>
                            <span style={{fontSize:12,fontWeight:700,color:cat.color}}>{subEmps.length} pers.</span>
                          </div>
                        );
                      })}
                      <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between"}}>
                        <span style={{fontSize:12,color:"#94a3b8"}}>{catSchs.length} créneaux</span>
                        <span style={{fontSize:12,fontWeight:700,color:cat.color}}>{totalHours(catSchs)}h total</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
                <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <h3 style={{margin:0,fontSize:15,fontWeight:700,color:"#1e1b4b"}}>Équipe</h3>
                    <Btn small variant="ghost" onClick={()=>setPage("employees")}>Voir tout →</Btn>
                  </div>
                  {employees.map(emp=>{
                    const h=totalHours(schedules.filter(s=>s.employee_id===emp.id));
                    const c=emp.category?CATEGORIES[emp.category]?.color:emp.color;
                    return(<div key={emp.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #f8fafc"}}>
                      <div style={{width:36,height:36,borderRadius:10,background:c,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:15}}>{emp.name[0]}</div>
                      <div style={{flex:1}}>
                        <p style={{margin:0,fontSize:13,fontWeight:600,color:"#374151"}}>{emp.name}</p>
                        <div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}>
                          {emp.category&&<CatBadge category={emp.category} subcategory={emp.subcategory} small/>}
                        </div>
                      </div>
                      <span style={{fontSize:12,fontWeight:700,color:c}}>{h}h</span>
                    </div>);
                  })}
                </div>
                <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <h3 style={{margin:0,fontSize:15,fontWeight:700,color:"#1e1b4b"}}>Cette semaine</h3>
                    <Btn small variant="ghost" onClick={()=>setPage("calendar")}>Calendrier →</Btn>
                  </div>
                  {DAYS.map(day=>{
                    const slots=schedules.filter(s=>s.day===day);
                    if(!slots.length)return null;
                    return(<div key={day} style={{marginBottom:10}}>
                      <p style={{margin:"0 0 4px",fontSize:12,fontWeight:700,color:"#6366f1"}}>{day}</p>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                        {slots.map(s=>{const emp=employees.find(e=>e.id===s.employee_id);const c=emp?.category?CATEGORIES[emp.category]?.color:emp?.color;return emp?(<span key={s.id} style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:c+"18",color:c,fontWeight:600}}>{emp.name.split(" ")[0]} · {s.start}–{s.end}</span>):null;})}
                      </div>
                    </div>);
                  })}
                </div>
              </div>
            </div>
          )}

          {/* EMPLOYEES */}
          {page==="employees"&&(
            <div>
              {/* Filtres catégorie */}
              <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
                {["all",...Object.keys(CATEGORIES)].map(cat=>(
                  <button key={cat} onClick={()=>setFilterCat(cat)} style={{
                    padding:"8px 16px",borderRadius:20,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,transition:"all .15s",fontFamily:"'DM Sans',sans-serif",
                    background:filterCat===cat?"linear-gradient(135deg,#6366f1,#8b5cf6)":"#fff",
                    color:filterCat===cat?"#fff":"#64748b",
                    boxShadow:filterCat===cat?"0 4px 14px rgba(99,102,241,.35)":"0 1px 4px rgba(0,0,0,.06)"
                  }}>
                    {cat==="all"?"👥 Tous":`${CATEGORIES[cat]?.icon} ${cat}`}
                    <span style={{marginLeft:6,fontSize:11,opacity:.8}}>
                      ({cat==="all"?employees.length:employees.filter(e=>e.category===cat).length})
                    </span>
                  </button>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
                {filteredEmployees.map(emp=>(<EmployeeCard key={emp.id} emp={emp} schedules={schedules} onEdit={e=>setEmpModal({mode:"edit",data:e})} onDelete={deleteEmployee} onEmailPreview={e=>setEmailModal(e)}/>))}
                {filteredEmployees.length===0&&(<div style={{gridColumn:"1/-1",textAlign:"center",padding:60,color:"#94a3b8"}}><div style={{fontSize:48,marginBottom:12}}>👥</div><p>Aucun employé{filterCat!=="all"?` dans "${filterCat}"`:""}</p></div>)}
              </div>
            </div>
          )}

          {/* CALENDAR */}
          {page==="calendar"&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                {["all",...Object.keys(CATEGORIES)].map(cat=>(
                  <button key={cat} onClick={()=>setFilterCat(cat)} style={{padding:"7px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",background:filterCat===cat?"linear-gradient(135deg,#6366f1,#8b5cf6)":"#fff",color:filterCat===cat?"#fff":"#64748b",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                    {cat==="all"?"Tous":`${CATEGORIES[cat]?.icon} ${cat}`}
                  </button>
                ))}
              </div>
              <div style={{background:"#fff",borderRadius:20,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
                <CalendarView employees={filteredEmployees} schedules={schedules} onEdit={s=>setSchModal({mode:"edit",data:s})} onDelete={deleteSchedule}/>
              </div>
            </div>
          )}

          {/* SCHEDULES */}
          {page==="schedules"&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
                {["all",...Object.keys(CATEGORIES)].map(cat=>(
                  <button key={cat} onClick={()=>setFilterCat(cat)} style={{padding:"7px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",background:filterCat===cat?"linear-gradient(135deg,#6366f1,#8b5cf6)":"#fff",color:filterCat===cat?"#fff":"#64748b",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                    {cat==="all"?"Tous":`${CATEGORIES[cat]?.icon} ${cat}`}
                  </button>
                ))}
              </div>
              {/* Grouper par catégorie */}
              {Object.entries(CATEGORIES).map(([catName,cat])=>{
                const catEmps=filteredEmployees.filter(e=>e.category===catName);
                if(filterCat!=="all"&&filterCat!==catName)return null;
                if(catEmps.length===0&&filterCat==="all")return null;
                return(
                  <div key={catName}>
                    {filterCat==="all"&&(
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,marginTop:8}}>
                        <span style={{fontSize:20}}>{cat.icon}</span>
                        <h3 style={{margin:0,fontSize:16,fontWeight:700,color:cat.color}}>{catName}</h3>
                        <div style={{flex:1,height:1,background:cat.color+"20"}}/>
                      </div>
                    )}
                    {catEmps.map(emp=>{
                      const empSch=schedules.filter(s=>s.employee_id===emp.id);
                      const c=cat.color;
                      return(<div key={emp.id} style={{background:"#fff",borderRadius:16,padding:20,boxShadow:"0 2px 12px rgba(0,0,0,.06)",marginBottom:12,borderLeft:`3px solid ${c}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:38,height:38,borderRadius:10,background:c,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700}}>{emp.name[0]}</div>
                            <div>
                              <p style={{margin:0,fontWeight:700,color:"#1e1b4b"}}>{emp.name}</p>
                              <div style={{display:"flex",gap:4,marginTop:2}}><CatBadge category={emp.category} subcategory={emp.subcategory} small/></div>
                            </div>
                          </div>
                          <div style={{display:"flex",gap:8}}>
                            <Btn small variant="ghost" onClick={()=>setSchModal({mode:"add",preselect:emp.id})}>+ Créneau</Btn>
                            <Btn small variant="ghost" onClick={()=>setEmailModal(emp)}>📧</Btn>
                          </div>
                        </div>
                        {empSch.length===0?<p style={{color:"#cbd5e1",fontSize:13,fontStyle:"italic",margin:0}}>Aucun créneau assigné</p>:(
                          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                            {empSch.sort((a,b)=>DAYS.indexOf(a.day)-DAYS.indexOf(b.day)).map(s=>(
                              <div key={s.id} style={{padding:"8px 14px",borderRadius:12,background:c+"12",border:`1.5px solid ${c}30`,display:"flex",alignItems:"center",gap:10}}>
                                <span style={{fontSize:12,fontWeight:700,color:c}}>{s.day}</span>
                                <span style={{fontSize:12,color:"#64748b"}}>{s.start} – {s.end}</span>
                                <span style={{fontSize:11,color:"#94a3b8"}}>({duration(s.start,s.end)})</span>
                                <button onClick={()=>setSchModal({mode:"edit",data:s})} style={{background:"none",border:"none",cursor:"pointer",color:"#6366f1",fontSize:12,padding:0}}>✏</button>
                                <button onClick={()=>deleteSchedule(s.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:12,padding:0}}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>);
                    })}
                    {/* Employés sans sous-catégorie connue */}
                    {filterCat==="all"&&employees.filter(e=>!e.category).map(emp=>{
                      const empSch=schedules.filter(s=>s.employee_id===emp.id);
                      return null; // handled below
                    })}
                  </div>
                );
              })}
              {/* Employés sans catégorie */}
              {(filterCat==="all")&&employees.filter(e=>!e.category).map(emp=>{
                const empSch=schedules.filter(s=>s.employee_id===emp.id);
                return(<div key={emp.id} style={{background:"#fff",borderRadius:16,padding:20,boxShadow:"0 2px 12px rgba(0,0,0,.06)",marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:38,height:38,borderRadius:10,background:emp.color||"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700}}>{emp.name[0]}</div>
                      <div><p style={{margin:0,fontWeight:700,color:"#1e1b4b"}}>{emp.name}</p><p style={{margin:0,fontSize:12,color:"#94a3b8"}}>Non classifié</p></div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <Btn small variant="ghost" onClick={()=>setSchModal({mode:"add",preselect:emp.id})}>+ Créneau</Btn>
                      <Btn small variant="ghost" onClick={()=>setEmailModal(emp)}>📧</Btn>
                    </div>
                  </div>
                  {empSch.length===0?<p style={{color:"#cbd5e1",fontSize:13,fontStyle:"italic",margin:0}}>Aucun créneau</p>:(
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {empSch.sort((a,b)=>DAYS.indexOf(a.day)-DAYS.indexOf(b.day)).map(s=>(
                        <div key={s.id} style={{padding:"8px 14px",borderRadius:12,background:"#f1f5f9",border:"1.5px solid #e5e7eb",display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:12,fontWeight:700,color:"#64748b"}}>{s.day}</span>
                          <span style={{fontSize:12,color:"#64748b"}}>{s.start} – {s.end}</span>
                          <button onClick={()=>setSchModal({mode:"edit",data:s})} style={{background:"none",border:"none",cursor:"pointer",color:"#6366f1",fontSize:12,padding:0}}>✏</button>
                          <button onClick={()=>deleteSchedule(s.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:12,padding:0}}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>);
              })}
            </div>
          )}

        </div>
        )}
      </main>

      {empModal&&<EmployeeModal employee={empModal.mode==="edit"?empModal.data:null} onSave={saveEmployee} onClose={()=>setEmpModal(null)}/>}
      {schModal&&<ScheduleModal schedule={schModal.mode==="edit"?schModal.data:schModal.preselect?{employee_id:schModal.preselect,day:"Lundi",start:"08:00",end:"16:00"}:null} employees={employees} onSave={saveSchedule} onClose={()=>setSchModal(null)}/>}
      {emailModal&&<EmailPreviewModal employee={emailModal} schedules={schedules} onClose={()=>setEmailModal(null)} onSendNow={async(e,s,a)=>sendEmail(e,s,a,toast)}/>}
      <Toast toasts={toasts} remove={removeToast}/>
    </div>
  );
}
