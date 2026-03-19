// api/send-email.js — Vercel Serverless Function
const nodemailer = require("nodemailer");

// Créer le transporteur Gmail
function createTransporter() {
  return nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,   // ex: moncompte@gmail.com
      pass: process.env.GMAIL_PASS,   // Mot de passe d'application Google
    },
  });
}

// Template HTML de l'email
function buildEmailHTML(employee, schedules, action) {
  const dayOrder = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
  const sorted = [...schedules].sort(
    (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  );

  const totalMinutes = schedules.reduce((acc, s) => {
    const [sh, sm] = s.start.split(":").map(Number);
    const [eh, em] = s.end.split(":").map(Number);
    return acc + (eh * 60 + em) - (sh * 60 + sm);
  }, 0);
  const totalH = Math.floor(totalMinutes / 60);
  const totalM = totalMinutes % 60;
  const totalStr = totalM ? `${totalH}h${String(totalM).padStart(2,"0")}` : `${totalH}h`;

  const rows = sorted.map(s => {
    const [sh, sm] = s.start.split(":").map(Number);
    const [eh, em] = s.end.split(":").map(Number);
    const dur = (eh * 60 + em) - (sh * 60 + sm);
    const durStr = dur > 0 ? `${Math.floor(dur/60)}h${dur%60 ? String(dur%60).padStart(2,"0") : ""}` : "—";
    return `
      <tr>
        <td style="padding:12px 16px;font-weight:600;color:#1e1b4b;">${s.day}</td>
        <td style="padding:12px 16px;color:#374151;">${s.start} – ${s.end}</td>
        <td style="padding:12px 16px;color:#6366f1;font-weight:600;">${durStr}</td>
      </tr>`;
  }).join("");

  const actionLabel = action === "creation" ? "créé" : "mis à jour";
  const firstName = employee.name.split(" ")[0];

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8faff;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);padding:36px 40px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">📅</div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Planify</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,.6);font-size:13px;">Gestion des horaires</p>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;">
      <p style="margin:0 0 8px;font-size:16px;color:#1e1b4b;">Bonjour <strong>${firstName}</strong> 👋</p>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
        Votre planning de la semaine vient d'être <strong style="color:#6366f1;">${actionLabel}</strong>. 
        Voici le détail de vos créneaux :
      </p>

      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <thead>
          <tr style="background:#f8faff;">
            <th style="padding:12px 16px;text-align:left;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Jour</th>
            <th style="padding:12px 16px;text-align:left;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Horaire</th>
            <th style="padding:12px 16px;text-align:left;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Durée</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="3" style="padding:20px;text-align:center;color:#94a3b8;font-style:italic;">Aucun créneau cette semaine</td></tr>`}
        </tbody>
      </table>

      <!-- Total -->
      <div style="margin-top:16px;padding:14px 20px;background:linear-gradient(135deg,#eef2ff,#e0e7ff);border-radius:12px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;color:#6366f1;font-weight:600;">⏱ Total de la semaine</span>
        <span style="font-size:18px;font-weight:800;color:#4f46e5;">${totalStr}</span>
      </div>

      <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.6;">
        Si vous avez des questions concernant votre planning, contactez directement votre responsable.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8faff;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#cbd5e1;">
        Cet email a été envoyé automatiquement par <strong>Planify</strong>.<br>
        Merci de ne pas répondre à cet email.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// Handler principal
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { employee, schedules, action } = req.body;

  // Validation
  if (!employee?.email || !employee?.name) {
    return res.status(400).json({ error: "Données employé manquantes" });
  }
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    return res.status(500).json({ error: "Variables d'environnement Gmail non configurées" });
  }

  try {
    const transporter = createTransporter();
    const html = buildEmailHTML(employee, schedules || [], action || "creation");

    const actionLabel = action === "modification" ? "mis à jour" : "créé";

    await transporter.sendMail({
      from: `"Planify RH" <${process.env.GMAIL_USER}>`,
      to: employee.email,
      subject: `📅 Votre planning a été ${actionLabel} — Planify`,
      html,
    });

    console.log(`✅ Email envoyé à ${employee.email}`);
    return res.status(200).json({ success: true, message: `Email envoyé à ${employee.email}` });

  } catch (err) {
    console.error("❌ Erreur envoi email:", err.message);
    return res.status(500).json({ error: "Échec de l'envoi", details: err.message });
  }
};
