import { useState, useCallback, useEffect } from "react";

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const DAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"];

const INITIAL_EMPLOYEES = [
  { id: 1, name: "Sophie Martin", email: "sophie@example.com", phone: "06 12 34 56 78", color: COLORS[0], role: "Caissière" },
  { id: 2, name: "Luc Bernard", email: "luc@example.com", phone: "06 23 45 67 89", color: COLORS[1], role: "Gérant" },
  { id: 3, name: "Emma Dubois", email: "emma@example.com", phone: "06 34 56 78 90", color: COLORS[2], role: "Vendeuse" },
];

const INITIAL_SCHEDULES = [
  { id: 1, employeeId: 1, day: "Lundi", start: "08:00", end: "16:00" },
];

// ── COMPOSANTS ET UTILITAIRES ──────────────────────────────────────────────────
const duration = (s, e) => {
  const [sh, sm] = s.split(":").map(Number);
  const [eh, em] = e.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
};

// ... (Gardez ici vos composants Toast, EmployeeModal, ScheduleModal, EmailPreviewModal si vous les avez en bas de fichier)

export default function App() {
  // ── ÉTATS (STATES) AVEC RÉCUPÉRATION DU STOCKAGE ─────────────────────────────
  // On regarde si des données existent déjà dans le navigateur, sinon on prend INITIAL
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem("planify_employees");
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [schedules, setSchedules] = useState(() => {
    const saved = localStorage.getItem("planify_schedules");
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
  });

  const [view, setView] = useState("grid"); // 'grid' ou 'calendar'
  const [empModal, setEmpModal] = useState(null);
  const [schModal, setSchModal] = useState(null);
  const [emailModal, setEmailModal] = useState(null);
  const [toasts, setToasts] = useState([]);

  // ── SAUVEGARDE AUTOMATIQUE (L'AJOUT CRUCIAL) ────────────────────────────────
  // À chaque fois que 'employees' ou 'schedules' change, on enregistre dans le navigateur
  useEffect(() => {
    localStorage.setItem("planify_employees", JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem("planify_schedules", JSON.stringify(schedules));
  }, [schedules]);

  // ── LOGIQUE DE GESTION ──────────────────────────────────────────────────────
  const addToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const saveEmployee = (data) => {
    if (data.id) {
      setEmployees(prev => prev.map(e => (e.id === data.id ? data : e)));
      addToast("Employé mis à jour");
    } else {
      const newEmp = { ...data, id: Date.now(), color: COLORS[employees.length % COLORS.length] };
      setEmployees(prev => [...prev, newEmp]);
      addToast("Employé ajouté");
    }
    setEmpModal(null);
  };

  const deleteEmployee = (id) => {
    if (window.confirm("Supprimer cet employé ?")) {
      setEmployees(prev => prev.filter(e => e.id !== id));
      setSchedules(prev => prev.filter(s => s.employeeId !== id));
      addToast("Employé supprimé", "error");
    }
  };

  const saveSchedule = (data) => {
    if (data.id) {
      setSchedules(prev => prev.map(s => (s.id === data.id ? data : s)));
      addToast("Horaire modifié");
    } else {
      const newSch = { ...data, id: Date.now() };
      setSchedules(prev => [...prev, newSch]);
      addToast("Horaire ajouté");
    }
    setSchModal(null);
  };

  const deleteSchedule = (id) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    addToast("Horaire supprimé", "error");
  };

  const handleSendNow = async (emp, schs) => {
    addToast(`Envoi à ${emp.name}...`);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee: emp, schedules: schs }),
      });
      if (res.ok) addToast("✅ Email envoyé !");
      else throw new Error();
    } catch {
      addToast("❌ Erreur d'envoi", "error");
    }
    setEmailModal(null);
  };

  // ── RENDU (VOTRE DESIGN ORIGINAL) ───────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f1f5f9", padding: "20px" }}>
      {/* Header */}
      <header style={{ maxWidth: "1200px", margin: "0 auto 30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-1px" }}>Planify</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Gestion d'équipe & Planning</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => setEmpModal({ mode: "add" })} style={btnAction("#6366f1")}>+ Employé</button>
          <button onClick={() => setSchModal({ mode: "add" })} style={btnAction("#0ea5e9")}>+ Horaire</button>
        </div>
      </header>

      {/* Main Grid */}
      <main style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "25px" }}>
          {employees.map(emp => {
            const empSchedules = schedules.filter(s => s.employeeId === emp.id);
            return (
              <div key={emp.id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
                    <div style={{ width: 45, height: 45, borderRadius: "50%", backgroundColor: emp.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: 18 }}>
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, color: "#1e293b" }}>{emp.name}</h3>
                      <span style={{ fontSize: 12, color: "#64748b", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: 10 }}>{emp.role}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setEmailModal(emp)} style={iconBtn}>✉️</button>
                    <button onClick={() => setEmpModal({ mode: "edit", data: emp })} style={iconBtn}>✏️</button>
                    <button onClick={() => deleteEmployee(emp.id)} style={iconBtnRed}>🗑️</button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {DAYS.map(day => {
                    const s = empSchedules.find(sch => sch.day === day);
                    return (
                      <div key={day} style={dayRowStyle(!!s)}>
                        <span style={{ width: 80, fontWeight: 600, fontSize: 13 }}>{day}</span>
                        {s ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                            <span style={{ fontSize: 13, color: "#334155" }}>{s.start} — {s.end}</span>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>({duration(s.start, s.end)})</span>
                            <button onClick={() => setSchModal({ mode: "edit", data: s })} style={editInlineBtn}>✏</button>
                            <button onClick={() => deleteSchedule(s.id)} style={deleteInlineBtn}>✕</button>
                          </div>
                        ) : (
                          <span style={{ color: "#cbd5e1", fontSize: 13, fontStyle: "italic" }}>Repos</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modales (Assurez-vous que ces composants existent dans votre projet) */}
      {/* ... (Code des modales ici) ... */}

      {/* Toast Notifications */}
      <div style={{ position: "fixed", bottom: 25, right: 25, display: "flex", flexDirection: "column", gap: 10, zIndex: 1000 }}>
        {toasts.map(t => (
          <div key={t.id} style={toastStyle(t.type)}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}

// ── STYLES ──────────────────────────────────────────────────────────────────
const btnAction = (bg) => ({
  backgroundColor: bg, color: "white", border: "none", padding: "12px 24px",
  borderRadius: "12px", fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 14px ${bg}44`
});

const cardStyle = {
  backgroundColor: "white", padding: "25px", borderRadius: "20px",
  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0"
};

const dayRowStyle = (active) => ({
  display: "flex", padding: "8px 12px", borderRadius: "10px",
  backgroundColor: active ? "#f8fafc" : "transparent",
  border: active ? "1px solid #e2e8f0" : "1px solid transparent",
  alignItems: "center"
});

const iconBtn = { background: "#f1f5f9", border: "none", padding: "8px", borderRadius: "10px", cursor: "pointer", fontSize: 16 };
const iconBtnRed = { ...iconBtn, color: "#ef4444" };
const editInlineBtn = { background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: 12, marginLeft: "auto" };
const deleteInlineBtn = { background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 12 };

const toastStyle = (type) => ({
  padding: "15px 25px", borderRadius: "12px", color: "white", fontWeight: 600,
  backgroundColor: type === "error" ? "#ef4444" : "#10b981", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
});
