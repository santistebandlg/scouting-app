import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const SCOUTS = [
  "Andrés Velasco","Bernardo Livramento","Cristian Franco",
  "Jacson Gabriel","Joan Cami","Manuel González","Santiago Riani"
];

const POSITIONS_FIELD = [
  { id:"POR", label:"POR", x:50, y:95 },
  { id:"LI",  label:"LI",  x:8,  y:80 },
  { id:"DFC1",label:"DFC", x:30, y:83 },
  { id:"LIB", label:"LIB", x:50, y:86 },
  { id:"DFC2",label:"DFC", x:70, y:83 },
  { id:"LD",  label:"LD",  x:92, y:80 },
  { id:"CAI", label:"CAI", x:8,  y:68 },
  { id:"MDP", label:"MDP", x:50, y:68 },
  { id:"CAD", label:"CAD", x:92, y:68 },
  { id:"MI",  label:"MI",  x:8,  y:56 },
  { id:"MCI", label:"MCI", x:30, y:56 },
  { id:"MCD", label:"MCD", x:70, y:56 },
  { id:"MD",  label:"MD",  x:92, y:56 },
  { id:"INTI",label:"INTI",x:30, y:44 },
  { id:"INTD",label:"INTD",x:70, y:44 },
  { id:"EI",  label:"EI",  x:8,  y:32 },
  { id:"MPI", label:"MPI", x:28, y:32 },
  { id:"MP",  label:"MP",  x:50, y:32 },
  { id:"MPD", label:"MPD", x:72, y:32 },
  { id:"ED",  label:"ED",  x:92, y:32 },
  { id:"DCI", label:"DCI", x:30, y:10 },
  { id:"DC",  label:"DC",  x:50, y:8  },
  { id:"DCD", label:"DCD", x:70, y:10 },
];

const RADAR_CATEGORIES = ["Táctica","Técnica","Mental","Físico"];

const POSITION_NAMES = {
  POR:  "Portero",
  LI:   "Lateral Izquierdo",
  LD:   "Lateral Derecho",
  DFC1: "Defensa Central",
  DFC2: "Defensa Central",
  LIB:  "Líbero",
  CAI:  "Carrilero Izquierdo",
  CAD:  "Carrilero Derecho",
  MDP:  "Medio Defensivo",
  MI:   "Medio Izquierdo",
  MD:   "Medio Derecho",
  MCI:  "Mediocentro Izquierdo",
  MCD:  "Mediocentro Derecho",
  INTI: "Interior Izquierdo",
  INTD: "Interior Derecho",
  EI:   "Extremo Izquierdo",
  ED:   "Extremo Derecho",
  MPI:  "Media Punta Izquierda",
  MPD:  "Media Punta Derecha",
  MP:   "Media Punta",
  DCI:  "Delantero Izquierdo",
  DC:   "Delantero Centro",
  DCD:  "Delantero Derecho",
};

function RadarChart({ values, size = 220 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const n = RADAR_CATEGORIES.length;
  const angles = RADAR_CATEGORIES.map((_, i) => (Math.PI * 2 * i) / n - Math.PI / 2);
  const levels = [0.25, 0.5, 0.75, 1];

  const pts = (vals) =>
    angles.map((a, i) => {
      const ratio = (vals[i] || 0) / 10;
      return [cx + r * ratio * Math.cos(a), cy + r * ratio * Math.sin(a)];
    });

  const gridPts = (ratio) =>
    angles.map((a) => [cx + r * ratio * Math.cos(a), cy + r * ratio * Math.sin(a)]);

  const dataPoints = pts(values);
  const pathD = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + "Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {levels.map((lv) => {
        const gp = gridPts(lv);
        return (
          <polygon
            key={lv}
            points={gp.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        );
      })}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy}
          x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)}
          stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      ))}
      <polygon points={dataPoints.map((p) => p.join(",")).join(" ")}
        fill="rgba(74,222,128,0.25)" stroke="#4ade80" strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={4} fill="#4ade80" />
      ))}
      {angles.map((a, i) => {
        const lx = cx + (r + 22) * Math.cos(a);
        const ly = cy + (r + 22) * Math.sin(a);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fill="#94a3b8" fontSize="11" fontFamily="'Barlow Condensed', sans-serif">
            {RADAR_CATEGORIES[i]}
          </text>
        );
      })}
    </svg>
  );
}

function FootballField({ positions, assignments, playerData={}, onSlotClick, interactive = false }) {
  return (
    <div style={{
      position:"relative", width:"100%", paddingBottom:"135%",
      background:"linear-gradient(180deg, #15803d 0%, #166534 50%, #15803d 100%)",
      borderRadius:8, overflow:"hidden", border:"2px solid rgba(255,255,255,0.15)"
    }}>
      {/* Field lines */}
      <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%"}} viewBox="0 0 100 135" preserveAspectRatio="none">
        <rect x="5" y="3" width="90" height="129" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
        <line x1="5" y1="67.5" x2="95" y2="67.5" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
        <circle cx="50" cy="67.5" r="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
        <circle cx="50" cy="67.5" r="0.8" fill="rgba(255,255,255,0.5)"/>
        <rect x="22" y="3" width="56" height="20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
        <rect x="35" y="3" width="30" height="10" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
        <rect x="22" y="112" width="56" height="20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
        <rect x="35" y="122" width="30" height="10" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
        {[0,1,2,3,4,5,6,7].map(i=>(
          <rect key={i} x="5" y={3+i*15.75} width="90" height="7.875" fill={i%2===0?"rgba(0,0,0,0.05)":"none"}/>
        ))}
      </svg>
      {/* Player positions */}
      {positions.map((pos) => {
        const playerName = assignments?.[pos.id];
        const pData = playerData?.[pos.id];
        return (
          <div key={pos.id}
            onClick={() => interactive && onSlotClick && onSlotClick(pos.id)}
            style={{
              position:"absolute",
              left:`${pos.x}%`, top:`${pos.y}%`,
              transform:"translate(-50%,-50%)",
              cursor: interactive ? "pointer" : "default",
              zIndex:2, textAlign:"center"
            }}>
            <div style={{
              width:34, height:34, borderRadius:"50%",
              background: playerName ? "linear-gradient(135deg,#4ade80,#16a34a)" : "rgba(0,0,0,0.5)",
              border: playerName ? "2px solid #86efac" : "2px dashed rgba(255,255,255,0.4)",
              display:"flex", alignItems:"center", justifyContent:"center",
              backdropFilter:"blur(4px)",
              boxShadow: playerName ? "0 0 12px rgba(74,222,128,0.5)" : "none",
              transition:"all 0.2s"
            }}>
              {playerName ? (
                <span style={{color:"#fff",fontSize:7,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1,textAlign:"center",padding:2}}>
                  {pData?.posicion || pos.label}
                </span>
              ) : (
                <span style={{color:"rgba(255,255,255,0.5)",fontSize:9,fontFamily:"'Barlow Condensed',sans-serif"}}>{pos.label}</span>
              )}
            </div>
            {playerName && (
              <div style={{
                position:"absolute",
                top:"100%", left:"50%",
                transform:"translateX(-50%)",
                marginTop:3, background:"rgba(0,0,0,0.82)",
                borderRadius:4, padding:"2px 7px",
                fontSize:13, color:"#fff",
                fontFamily:"'Barlow Condensed',sans-serif",
                whiteSpace:"nowrap",
                letterSpacing:0.5, fontWeight:600,
                pointerEvents:"none"
              }}>
                {playerName}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Slider component
function RatingSlider({ label, value, onChange }) {
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{color:"#94a3b8",fontSize:13,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{label.toUpperCase()}</span>
        <span style={{color:"#4ade80",fontSize:13,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif"}}>{value}</span>
      </div>
      <input type="range" min={0} max={10} step={1} value={value}
        onChange={e=>onChange(Number(e.target.value))}
        style={{width:"100%",accentColor:"#4ade80",cursor:"pointer"}}/>
    </div>
  );
}

const defaultForm = {
  nombre:"", apellido:"", scout:"", posicion:"", equipo:"",
  perfil:"", fechaNac:"", nacionalidad:"", altura:"", peso:"",
  categoria:"", proyeccion:"", rango:"", transferencia:"", descripcion:"",
  tactica:5, tecnica:5, mental:5, fisico:5, jornada:"", liga:""
};

export default function ScoutingApp() {
  const [activeTab, setActiveTab] = useState("registrar");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedRecordIndex, setSelectedRecordIndex] = useState(0);
  const [perfilFilterScout, setPerfilFilterScout] = useState("");
  const [idealXI, setIdealXI] = useState({});
  const [assigningSlot, setAssigningSlot] = useState(null);
  const [sheetsUrl, setSheetsUrl] = useState("https://script.google.com/macros/s/AKfycbyuVDCmpWbKcTfYejco5AShNy5pZD-QPo9cF8wiudi2jE7ySBRR_fE8JgfjQlRZrX9Hzg/exec");
  const [sheetsConnected, setSheetsConnected] = useState(true);
  const [notification, setNotification] = useState(null);
  const [selectingPos, setSelectingPos] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar jugadores desde Google Sheets al iniciar
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const url = "https://script.google.com/macros/s/AKfycbyuVDCmpWbKcTfYejco5AShNy5pZD-QPo9cF8wiudi2jE7ySBRR_fE8JgfjQlRZrX9Hzg/exec?action=read";
        const res = await fetch(url, { method: "GET" });
        const data = await res.json();
        if (data.success && data.players.length > 0) {
          const withIds = data.players
            .filter(p => p.nombre || p.apellido)
            .map((p, i) => ({ ...p, id: Date.now() + i }));
          setPlayers(withIds);
        }
      } catch(err) {
        console.error("Error cargando jugadores:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPlayers();
  }, []);
  const [xiFilterScout, setXiFilterScout] = useState("");
  const [xiFilterJornada, setXiFilterJornada] = useState("");
  const [xiFilterLiga, setXiFilterLiga] = useState("");
  const xiRef = useRef(null);
  const perfilRef = useRef(null);

  const exportXIToPDF = (filteredPlayers, scout, jornada, liga) => {
    const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" });
    const W = 297, H = 210;
    const green = [74, 222, 128];
    const darkGreen = [13, 71, 35];
    const bg = [10, 15, 13];
    const cardBg = [17, 28, 22];
    const textMain = [226, 232, 240];
    const textMuted = [100, 116, 139];

    // Fondo
    doc.setFillColor(...bg);
    doc.rect(0, 0, W, H, "F");

    // Header
    doc.setFillColor(...darkGreen);
    doc.rect(0, 0, W, 18, "F");
    doc.setTextColor(...green);
    doc.setFont("helvetica","bold");
    doc.setFontSize(14);
    doc.text("11 IDEAL — SCOUT PLATFORM", 10, 12);
    doc.setFontSize(9);
    doc.setTextColor(...textMuted);
    const subtitle = [scout, jornada, liga].filter(Boolean).join("  ·  ");
    doc.text(subtitle, 10, 17);
    doc.setTextColor(...textMain);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString("es-ES"), W-10, 12, {align:"right"});

    // Cancha
    const fieldX = 8, fieldY = 22, fieldW = 100, fieldH = 180;

    // Construir posMap aquí para usarlo tanto en cancha como en lista
    const posMap = {};
    filteredPlayers.forEach(p => { if(p.posicion && !posMap[p.posicion]) posMap[p.posicion] = p; });
    const fieldPlayers = Object.values(posMap);

    doc.setFillColor(21, 128, 61);
    doc.roundedRect(fieldX, fieldY, fieldW, fieldH, 3, 3, "F");
    doc.setDrawColor(255,255,255);
    doc.setLineWidth(0.3);
    doc.rect(fieldX+3, fieldY+2, fieldW-6, fieldH-4);
    doc.line(fieldX+3, fieldY+fieldH/2, fieldX+fieldW-3, fieldY+fieldH/2);
    doc.circle(fieldX+fieldW/2, fieldY+fieldH/2, 10);
    doc.rect(fieldX+3+(fieldW-6)*0.22, fieldY+2, (fieldW-6)*0.56, (fieldH-4)*0.17);
    doc.rect(fieldX+3+(fieldW-6)*0.22, fieldY+fieldH-2-(fieldH-4)*0.17, (fieldW-6)*0.56, (fieldH-4)*0.17);

    // Jugadores en la cancha
    POSITIONS_FIELD.forEach(pos => {
      const p = posMap[pos.id];
      const cx = fieldX + (pos.x/100)*fieldW;
      const cy = fieldY + (pos.y/100)*fieldH;
      if (p) {
        doc.setFillColor(...green);
        doc.circle(cx, cy, 3.5, "F");
        doc.setTextColor(0,0,0);
        doc.setFont("helvetica","bold");
        doc.setFontSize(5);
        doc.text(pos.label, cx, cy+0.8, {align:"center"});
        doc.setFillColor(0,0,0);
        const name = `${p.nombre} ${p.apellido}`;
        const nameW = doc.getTextWidth(name)+3;
        doc.roundedRect(cx-nameW/2, cy+4, nameW, 4, 1, 1, "F");
        doc.setTextColor(255,255,255);
        doc.setFontSize(5);
        doc.text(name, cx, cy+7, {align:"center"});
      } else {
        doc.setDrawColor(...textMuted);
        doc.setLineWidth(0.3);
        doc.circle(cx, cy, 3.5);
        doc.setTextColor(...textMuted);
        doc.setFontSize(5);
        doc.setFont("helvetica","normal");
        doc.text(pos.label, cx, cy+0.8, {align:"center"});
      }
    });

    // Solo jugadores que aparecen en la cancha (uno por posición)
    // Lista de jugadores - dos columnas
    const listX = 115, colW = 85, col2X = 207;
    let y1 = 24, y2 = 24;
    const half = Math.ceil(fieldPlayers.length / 2);

    // Título
    doc.setFontSize(8);
    doc.setTextColor(...green);
    doc.setFont("helvetica","bold");
    doc.text(`JUGADORES (${fieldPlayers.length})`, listX, y1);
    y1 += 6; y2 += 6;

    fieldPlayers.forEach((p, i) => {
      const isCol2 = i >= half;
      const x = isCol2 ? col2X : listX;
      let y = isCol2 ? y2 : y1;
      if (y > H - 14) return;

      doc.setFillColor(...cardBg);
      doc.roundedRect(x, y, colW, 26, 2, 2, "F");
      doc.setDrawColor(...green);
      doc.setLineWidth(0.15);
      doc.roundedRect(x, y, colW, 26, 2, 2);

      // Nombre
      doc.setTextColor(...green);
      doc.setFont("helvetica","bold");
      doc.setFontSize(9);
      doc.text(`${p.nombre} ${p.apellido}`, x+3, y+6);

      // Posición
      doc.setTextColor(...green);
      doc.setFont("helvetica","normal");
      doc.setFontSize(7);
      doc.text(POSITION_NAMES[p.posicion]||p.posicion||"—", x+3, y+11);

      // Proyección badge
      if (p.proyeccion) {
        doc.setFillColor(...darkGreen);
        const bw = doc.getTextWidth(p.proyeccion)+4;
        doc.roundedRect(x+colW-bw-3, y+2, bw, 5, 1, 1, "F");
        doc.setTextColor(...green);
        doc.setFontSize(6);
        doc.text(p.proyeccion, x+colW-3-bw/2, y+5.5, {align:"center"});
      }

      // Datos
      const c1=x+3, c2=x+colW/2;
      doc.setFontSize(6);
      doc.setTextColor(...textMuted); doc.text("EQUIPO", c1, y+16);
      doc.setTextColor(...textMain); doc.text(p.equipo||"—", c1, y+20);
      doc.setTextColor(...textMuted); doc.text("ALTURA", c2, y+16);
      doc.setTextColor(...textMain); doc.text(p.altura?`${p.altura} cm`:"—", c2, y+20);
      doc.setTextColor(...textMuted); doc.text("NACIONALIDAD", c1, y+24);
      doc.setTextColor(...textMain); doc.text(p.nacionalidad||"—", c1+20, y+24);
      doc.setTextColor(...textMuted); doc.text("F. NAC.", c2, y+24);
      doc.setTextColor(...textMain); doc.text(p.fechaNac||"—", c2+10, y+24);

      if (isCol2) y2 += 29; else y1 += 29;
    });

    doc.save(`11-ideal-${scout||"todos"}-${jornada||"jornada"}.pdf`);
    showNotif("✓ PDF exportado correctamente.");
  };

  const showNotif = (msg, type="success") => {
    setNotification({msg,type});
    setTimeout(()=>setNotification(null),4000);
  };

  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleRegister = async () => {
    if (!form.nombre || !form.apellido || !form.scout) {
      showNotif("Por favor completa nombre, apellido y scout.", "error"); return;
    }
    const player = { ...form, id: Date.now(), edad: age(form.fechaNac) };
    setPlayers(p=>[...p,player]);
    setForm(defaultForm);

    // Enviar a Google Sheets
    if (sheetsUrl) {
      setSyncing(true);
      try {
        const params = new URLSearchParams({
          nombre: player.nombre,
          apellido: player.apellido,
          scout: player.scout,
          posicion: player.posicion || "",
          equipo: player.equipo || "",
          perfil: player.perfil || "",
          fechaNac: player.fechaNac || "",
          nacionalidad: player.nacionalidad || "",
          edad: String(age(player.fechaNac)),
          altura: String(player.altura || ""),
          peso: String(player.peso || ""),
          categoria: player.categoria || "",
          proyeccion: player.proyeccion || "",
          rango: player.rango || "",
          transferencia: player.transferencia || "",
          descripcion: player.descripcion || "",
          tactica: String(player.tactica),
          tecnica: String(player.tecnica),
          mental: String(player.mental),
          fisico: String(player.fisico),
          jornada: String(player.jornada || ""),
          liga: String(player.liga || ""),
        });
        fetch(`${sheetsUrl}?${params.toString()}`, { method: "GET", mode: "no-cors" });
        console.log("URL enviada:", `${sheetsUrl}?${params.toString()}`);
        showNotif(`✓ ${player.nombre} ${player.apellido} registrado y enviado a Google Sheets.`);
      } catch(err) {
        showNotif(`${player.nombre} ${player.apellido} guardado. Error: ${err.message}`, "error");
      } finally {
        setSyncing(false);
      }
    } else {
      showNotif(`${player.nombre} ${player.apellido} registrado correctamente.`);
    }
  };

  const age = (dob) => {
    if(!dob) return "—";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000*60*60*24*365.25));
  };

  const inputStyle = {
    width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)",
    borderRadius:6, padding:"9px 12px", color:"#e2e8f0", fontSize:14,
    fontFamily:"'Barlow',sans-serif", outline:"none", boxSizing:"border-box"
  };
  const selectStyle = {...inputStyle};
  const labelStyle = {
    display:"block", color:"#64748b", fontSize:11, fontFamily:"'Barlow Condensed',sans-serif",
    letterSpacing:1.5, textTransform:"uppercase", marginBottom:5
  };
  const sectionTitle = {
    color:"#4ade80", fontSize:12, fontFamily:"'Barlow Condensed',sans-serif",
    letterSpacing:2, textTransform:"uppercase", marginBottom:12, marginTop:20,
    borderBottom:"1px solid rgba(74,222,128,0.2)", paddingBottom:6
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;900&family=Barlow:wght@300;400;500;600&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#0a0f0d; color:#e2e8f0; font-family:'Barlow',sans-serif; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:#0f1712; }
        ::-webkit-scrollbar-thumb { background:#1e3a2a; border-radius:2px; }
        input[type=range] { height:4px; border-radius:2px; }
        .nav-item:hover { background:rgba(74,222,128,0.08) !important; }
        .btn-primary { background:linear-gradient(135deg,#16a34a,#15803d); border:none; color:#fff; padding:12px 24px; border-radius:6px; font-family:'Barlow Condensed',sans-serif; font-size:15px; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
        .btn-primary:hover { background:linear-gradient(135deg,#22c55e,#16a34a); box-shadow:0 0 20px rgba(74,222,128,0.3); }
        .btn-sec { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:#94a3b8; padding:8px 16px; border-radius:6px; font-family:'Barlow Condensed',sans-serif; font-size:13px; letter-spacing:1px; cursor:pointer; transition:all 0.2s; }
        .btn-sec:hover { background:rgba(255,255,255,0.1); color:#e2e8f0; }
        .player-card:hover { background:rgba(255,255,255,0.07) !important; border-color:rgba(74,222,128,0.3) !important; }
        select option { background:#1a2820; }
        .pos-btn { background:rgba(74,222,128,0.1); border:1px solid rgba(74,222,128,0.3); color:#4ade80; padding:5px 10px; border-radius:4px; font-size:12px; font-family:'Barlow Condensed',sans-serif; cursor:pointer; transition:all 0.2s; }
        .pos-btn:hover { background:rgba(74,222,128,0.25); }
        .pos-btn.active { background:rgba(74,222,128,0.3); border-color:#4ade80; }
        input:focus, select:focus { border-color:rgba(74,222,128,0.5) !important; box-shadow:0 0 0 2px rgba(74,222,128,0.1); }
        .sys-btn { padding:6px 14px; border-radius:20px; font-size:13px; font-family:'Barlow Condensed',sans-serif; letter-spacing:1px; cursor:pointer; transition:all 0.2s; border:1px solid rgba(255,255,255,0.15); background:transparent; color:#64748b; }
        .sys-btn.active { background:linear-gradient(135deg,#16a34a,#15803d); border-color:#16a34a; color:#fff; }
      `}</style>

      {/* Notification */}
      {notification && (
        <div style={{
          position:"fixed", top:20, right:20, zIndex:9999,
          background: notification.type==="error" ? "#7f1d1d" : "#14532d",
          border:`1px solid ${notification.type==="error"?"#ef4444":"#4ade80"}`,
          color:"#e2e8f0", padding:"12px 20px", borderRadius:8,
          fontFamily:"'Barlow',sans-serif", fontSize:14,
          boxShadow:"0 4px 20px rgba(0,0,0,0.5)", animation:"slideIn 0.3s ease"
        }}>
          {notification.msg}
        </div>
      )}

      {/* Modal: assign player to slot */}
      {assigningSlot && (
        <div style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:1000,
          display:"flex",alignItems:"center",justifyContent:"center"
        }} onClick={()=>setAssigningSlot(null)}>
          <div style={{
            background:"#111c16", border:"1px solid rgba(74,222,128,0.3)",
            borderRadius:12, padding:24, minWidth:300, maxHeight:"70vh", overflowY:"auto"
          }} onClick={e=>e.stopPropagation()}>
            <p style={{color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,letterSpacing:2,marginBottom:16}}>
              ASIGNAR JUGADOR — {assigningSlot}
            </p>
            {players.length === 0 && <p style={{color:"#64748b",fontSize:13}}>No hay jugadores registrados.</p>}
            {players
              .filter(p=>
                (!xiFilterScout || p.scout===xiFilterScout) &&
                (!xiFilterJornada || p.jornada===xiFilterJornada) &&
                (!xiFilterLiga || p.liga===xiFilterLiga)
              )
              .map(p=>(
              <div key={p.id}
                onClick={()=>{ setIdealXI(x=>({...x,[assigningSlot]:`${p.nombre} ${p.apellido}`})); setAssigningSlot(null); }}
                style={{
                  padding:"10px 14px", borderRadius:6, cursor:"pointer",
                  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                  marginBottom:6, transition:"all 0.15s"
                }}
                className="player-card"
              >
                <p style={{color:"#e2e8f0",fontSize:14,fontFamily:"'Barlow',sans-serif"}}>{p.nombre} {p.apellido}</p>
                <p style={{color:"#64748b",fontSize:11,marginTop:2}}>{p.posicion} · {p.equipo}</p>
              </div>
            ))}
            <button className="btn-sec" style={{marginTop:12,width:"100%"}} onClick={()=>{
              const newXI = {...idealXI}; delete newXI[assigningSlot]; setIdealXI(newXI); setAssigningSlot(null);
            }}>Quitar jugador</button>
          </div>
        </div>
      )}

      <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
        {/* SIDEBAR */}
        <div style={{
          width: sidebarOpen ? 240 : 60, minWidth: sidebarOpen ? 240 : 60,
          background:"#0d1a12", borderRight:"1px solid rgba(255,255,255,0.07)",
          transition:"width 0.3s, min-width 0.3s", overflow:"hidden",
          display:"flex", flexDirection:"column"
        }}>
          {/* Logo area */}
          <div style={{padding:"20px 16px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{
                width:36,height:36,borderRadius:6,flexShrink:0,
                display:"flex",alignItems:"center",justifyContent:"center",
                overflow:"hidden"
              }}>
                <img
                  src="https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/229.png&cquality=40&h=144&scale=crop&w=144"
                  alt="Necaxa"
                  style={{width:34,height:34,objectFit:"contain"}}
                  onError={e=>{e.target.style.display="none"}}
                />
              </div>
              {sidebarOpen && (
                <div>
                  <p style={{color:"#e2e8f0",fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,letterSpacing:2,lineHeight:1}}>SCOUT</p>
                  <p style={{color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",fontSize:10,letterSpacing:3,marginTop:2}}>PLATFORM</p>
                </div>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav style={{flex:1,padding:"16px 8px"}}>
            {[
              {id:"registrar",icon:"⊕",label:"Registrar Jugador"},
              {id:"xi",icon:"◈",label:"11 Ideal"},
              {id:"perfil",icon:"◉",label:"Perfil del Jugador"},
            ].map(item=>(
              <div key={item.id}
                className="nav-item"
                onClick={()=>setActiveTab(item.id)}
                style={{
                  display:"flex", alignItems:"center", gap:12, padding:"11px 12px",
                  borderRadius:7, cursor:"pointer", marginBottom:4,
                  background: activeTab===item.id ? "rgba(74,222,128,0.12)" : "transparent",
                  borderLeft: activeTab===item.id ? "3px solid #4ade80" : "3px solid transparent",
                  transition:"all 0.15s"
                }}>
                <span style={{fontSize:16,flexShrink:0,color: activeTab===item.id?"#4ade80":"#64748b"}}>{item.icon}</span>
                {sidebarOpen && <span style={{
                  color: activeTab===item.id?"#e2e8f0":"#94a3b8",
                  fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,letterSpacing:1,whiteSpace:"nowrap"
                }}>{item.label}</span>}
              </div>
            ))}
          </nav>

          {/* Toggle */}
          <div style={{padding:12,borderTop:"1px solid rgba(255,255,255,0.07)"}}>
            <button onClick={()=>setSidebarOpen(o=>!o)} className="btn-sec" style={{width:"100%",padding:"8px"}}>
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div style={{flex:1,overflow:"auto",background:"#0a0f0d"}}>
          {/* Header */}
          <div style={{
            padding:"18px 28px",borderBottom:"1px solid rgba(255,255,255,0.07)",
            display:"flex",alignItems:"center",justifyContent:"space-between",
            background:"rgba(13,26,18,0.8)",backdropFilter:"blur(10px)",
            position:"sticky",top:0,zIndex:10
          }}>
            <div>
              <p style={{color:"#e2e8f0",fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:700,letterSpacing:2}}>
                {activeTab==="registrar"?"REGISTRAR JUGADOR":activeTab==="xi"?"11 IDEAL":"PERFIL DEL JUGADOR"}
              </p>
              <p style={{color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,letterSpacing:3,marginTop:2}}>
                {loading ? "CARGANDO JUGADORES..." : `${players.length} JUGADORES REGISTRADOS`}
              </p>
            </div>
            {/* Google Sheets connect */}
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {sheetsConnected ? (
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"#4ade80",boxShadow:"0 0 6px #4ade80"}}/>
                  <span style={{color:"#4ade80",fontSize:12,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>SHEETS CONECTADO</span>
                  <button className="btn-sec" style={{fontSize:11}} onClick={()=>window.open(sheetsUrl,"_blank")}>Abrir ↗</button>
                </div>
              ) : (
                <div style={{display:"flex",gap:8}}>
                  <input
                    placeholder="URL de Google Sheets..."
                    value={sheetsUrl}
                    onChange={e=>setSheetsUrl(e.target.value)}
                    style={{...inputStyle,width:220,padding:"7px 12px",fontSize:12}}
                  />
                  <button className="btn-primary" style={{padding:"7px 14px",fontSize:12}}
                    onClick={()=>{ if(sheetsUrl){setSheetsConnected(true);showNotif("Google Sheets conectado.")}else showNotif("Ingresa una URL válida.","error") }}>
                    Conectar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CONTENT */}
          <div style={{padding:"28px 32px",maxWidth:1100,margin:"0 auto"}}>

            {/* === REGISTRAR JUGADOR === */}
            {activeTab==="registrar" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:32}}>
                {/* Left column */}
                <div>
                  <p style={sectionTitle}>Datos del Jugador</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                    <div>
                      <label style={labelStyle}>Nombre</label>
                      <input style={inputStyle} value={form.nombre} onChange={e=>setF("nombre",e.target.value)} placeholder="Ej. Carlos"/>
                    </div>
                    <div>
                      <label style={labelStyle}>Apellido</label>
                      <input style={inputStyle} value={form.apellido} onChange={e=>setF("apellido",e.target.value)} placeholder="Ej. García"/>
                    </div>
                  </div>

                  <div style={{marginBottom:12}}>
                    <label style={labelStyle}>Scout</label>
                    <select style={selectStyle} value={form.scout} onChange={e=>setF("scout",e.target.value)}>
                      <option value="">Seleccionar scout</option>
                      {SCOUTS.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div style={{marginBottom:12}}>
                    <label style={labelStyle}>Equipo</label>
                    <input style={inputStyle} value={form.equipo} onChange={e=>setF("equipo",e.target.value)} placeholder="Club actual"/>
                  </div>

                  <p style={sectionTitle}>Posición en Cancha</p>
                  <div style={{width:"100%",maxWidth:300,margin:"0 auto 16px"}}>
                    <FootballField
                      positions={POSITIONS_FIELD}
                      assignments={form.posicion ? {[form.posicion]:form.posicion} : {}}
                      interactive={true}
                      onSlotClick={(id)=>setF("posicion",id)}
                    />
                  </div>
                  {form.posicion && (
                    <p style={{textAlign:"center",color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,letterSpacing:2,marginTop:-8,marginBottom:12}}>
                      POSICIÓN: {form.posicion}
                    </p>
                  )}

                  <p style={sectionTitle}>Perfil</p>
                  <div style={{display:"flex",gap:8}}>
                    {["Derecho","Izquierdo","Ambidiestro"].map(p=>(
                      <button key={p} className={`pos-btn${form.perfil===p?" active":""}`}
                        onClick={()=>setF("perfil",p)}>{p}</button>
                    ))}
                  </div>
                </div>

                {/* Right column */}
                <div>
                  <p style={sectionTitle}>Datos Personales</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                    <div>
                      <label style={labelStyle}>Fecha de Nacimiento</label>
                      <input type="date" style={inputStyle} value={form.fechaNac} onChange={e=>setF("fechaNac",e.target.value)}/>
                    </div>
                    <div>
                      <label style={labelStyle}>Edad</label>
                      <input style={{...inputStyle,color:"#4ade80"}} value={form.fechaNac ? age(form.fechaNac)+" años" : ""} readOnly placeholder="Auto"/>
                    </div>
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={labelStyle}>Nacionalidad</label>
                    <input style={inputStyle} value={form.nacionalidad} onChange={e=>setF("nacionalidad",e.target.value)} placeholder="Ej. Española"/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                    <div>
                      <label style={labelStyle}>Altura (cm)</label>
                      <input type="number" style={inputStyle} value={form.altura} onChange={e=>setF("altura",e.target.value)} placeholder="180"/>
                    </div>
                    <div>
                      <label style={labelStyle}>Peso (kg)</label>
                      <input type="number" style={inputStyle} value={form.peso} onChange={e=>setF("peso",e.target.value)} placeholder="75"/>
                    </div>
                  </div>

                  <p style={sectionTitle}>Clasificación</p>
                  <div style={{marginBottom:12}}>
                    <label style={labelStyle}>Categoría</label>
                    <select style={selectStyle} value={form.categoria} onChange={e=>setF("categoria",e.target.value)}>
                      <option value="">Seleccionar</option>
                      {["Primer equipo","S23","S19","S17"].map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={labelStyle}>Proyección</label>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {["Apuesta","Rotación","Solución","Talento emergente"].map(p=>(
                        <button key={p} className={`pos-btn${form.proyeccion===p?" active":""}`}
                          onClick={()=>setF("proyeccion",p)}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={labelStyle}>Rango de Precio (M€)</label>
                    <select style={selectStyle} value={form.rango} onChange={e=>setF("rango",e.target.value)}>
                      <option value="">Seleccionar</option>
                      {["0","< 1.2","1.2 - 2.5","> 2.5"].map(r=><option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div style={{marginBottom:16}}>
                    <label style={labelStyle}>Tipo de Transferencia</label>
                    <select style={selectStyle} value={form.transferencia} onChange={e=>setF("transferencia",e.target.value)}>
                      <option value="">Seleccionar</option>
                      {["N/A","Cesión","Cesión + Opción de compra","Libre","Oportunidad de Mercado (cesión)","Oportunidad de Mercado (venta)"].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>

                  <div style={{marginBottom:16}}>
                    <label style={labelStyle}>Jornada</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={form.jornada}
                      onChange={e=>setF("jornada",e.target.value)}
                      placeholder="Ej. Jornada 30"
                    />
                  </div>

                  <div style={{marginBottom:16}}>
                    <label style={labelStyle}>Liga</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={form.liga}
                      onChange={e=>setF("liga",e.target.value)}
                      placeholder="Ej. Liga MX"
                    />
                  </div>

                  <p style={sectionTitle}>Rendimiento</p>
                  {[["tactica","Táctica"],["tecnica","Técnica"],["mental","Mental"],["fisico","Físico"]].map(([k,l])=>(
                    <RatingSlider key={k} label={l} value={form[k]} onChange={v=>setF(k,v)}/>
                  ))}

                  <p style={sectionTitle}>Descripción</p>
                  <textarea
                    rows={4}
                    style={{...inputStyle,resize:"vertical",lineHeight:1.6}}
                    value={form.descripcion}
                    onChange={e=>setF("descripcion",e.target.value)}
                    placeholder="Observaciones del scout sobre el jugador..."
                  />

                  <button className="btn-primary" style={{width:"100%",marginTop:20,opacity:syncing?0.7:1}}
                    onClick={handleRegister} disabled={syncing}>
                    {syncing ? "⟳ SINCRONIZANDO..." : "✦ REGISTRAR JUGADOR"}
                  </button>
                </div>
              </div>
            )}

            {/* === 11 IDEAL === */}
            {activeTab==="xi" && (() => {
              const filteredPlayers = players.filter(p=>
                (!xiFilterScout || p.scout===xiFilterScout) &&
                (!xiFilterJornada || p.jornada===xiFilterJornada) &&
                (!xiFilterLiga || p.liga===xiFilterLiga)
              );
              // Build assignments from filtered players: posicion -> "Nombre Apellido"
              const autoAssignments = {};
              filteredPlayers.forEach(p => {
                if (p.posicion && !autoAssignments[p.posicion]) {
                  autoAssignments[p.posicion] = `${p.nombre} ${p.apellido}`;
                }
              });
              return (
              <div>
                {/* Filtros */}
                <div style={{display:"flex",gap:12,marginBottom:24,alignItems:"flex-end"}}>
                  <div style={{flex:1}}>
                    <label style={labelStyle}>Scout</label>
                    <select style={selectStyle} value={xiFilterScout} onChange={e=>setXiFilterScout(e.target.value)}>
                      <option value="">Todos los scouts</option>
                      {SCOUTS.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{flex:1}}>
                    <label style={labelStyle}>Jornada</label>
                    <select style={selectStyle} value={xiFilterJornada} onChange={e=>setXiFilterJornada(e.target.value)}>
                      <option value="">Todas las jornadas</option>
                      {[...new Set(players.map(p=>p.jornada).filter(Boolean))].sort().map(j=>(
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{flex:1}}>
                    <label style={labelStyle}>Liga</label>
                    <select style={selectStyle} value={xiFilterLiga} onChange={e=>setXiFilterLiga(e.target.value)}>
                      <option value="">Todas las ligas</option>
                      {[...new Set(players.map(p=>p.liga).filter(Boolean))].sort().map(l=>(
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  {(xiFilterScout || xiFilterJornada || xiFilterLiga) && (
                    <button className="btn-sec" onClick={()=>{setXiFilterScout("");setXiFilterJornada("");setXiFilterLiga("");}}>
                      Limpiar ×
                    </button>
                  )}
                </div>

                {/* Info filtro activo */}
                {(xiFilterScout || xiFilterJornada || xiFilterLiga) && (
                  <div style={{
                    background:"rgba(74,222,128,0.06)", border:"1px solid rgba(74,222,128,0.2)",
                    borderRadius:8, padding:"10px 16px", marginBottom:20,
                    display:"flex", alignItems:"center", gap:12
                  }}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",flexShrink:0}}/>
                    <span style={{color:"#94a3b8",fontSize:13,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>
                      {xiFilterScout && <span style={{color:"#4ade80"}}>{xiFilterScout}</span>}
                      {xiFilterJornada && <span style={{color:"#e2e8f0"}}> · {xiFilterJornada}</span>}
                      {xiFilterLiga && <span style={{color:"#e2e8f0"}}> · {xiFilterLiga}</span>}
                      <span style={{color:"#64748b"}}> — {filteredPlayers.length} jugadores</span>
                    </span>
                  </div>
                )}

                {filteredPlayers.length === 0 && (xiFilterScout || xiFilterJornada || xiFilterLiga) && (
                  <div style={{textAlign:"center",padding:"40px 0",color:"#475569"}}>
                    <p style={{fontSize:32,marginBottom:8}}>◎</p>
                    <p style={{fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:2,fontSize:14}}>SIN JUGADORES PARA ESTOS FILTROS</p>
                  </div>
                )}

                {filteredPlayers.length > 0 && (
                  <div ref={xiRef} style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:32}}>
                    {/* Cancha */}
                    <div>
                      <FootballField
                        positions={POSITIONS_FIELD}
                        assignments={autoAssignments}
                        playerData={Object.fromEntries(
                          filteredPlayers
                            .filter(p=>p.posicion)
                            .map(p=>[p.posicion, p])
                        )}
                        interactive={false}
                      />
                    </div>
                    {/* Lista de jugadores */}
                    <div style={{overflowY:"auto",maxHeight:"80vh"}}>
                      <p style={sectionTitle}>Jugadores ({filteredPlayers.length})</p>
                      {filteredPlayers.map(p=>(
                        <div key={p.id} style={{
                          padding:"14px 16px", borderRadius:8, marginBottom:8,
                          background:"rgba(255,255,255,0.03)",
                          border:"1px solid rgba(74,222,128,0.15)",
                        }}>
                          {/* Nombre y posición */}
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                            <div>
                              <p style={{color:"#e2e8f0",fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,letterSpacing:1}}>
                                {p.nombre} {p.apellido}
                              </p>
                              <p style={{color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,letterSpacing:2,marginTop:2}}>
                                {POSITION_NAMES[p.posicion] || p.posicion || "—"}
                              </p>
                            </div>
                            <div style={{
                              background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.25)",
                              borderRadius:4,padding:"3px 8px",flexShrink:0
                            }}>
                              <span style={{color:"#4ade80",fontSize:11,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>
                                {p.proyeccion||"—"}
                              </span>
                            </div>
                          </div>
                          {/* Datos */}
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 12px"}}>
                            {[
                              ["Equipo", p.equipo||"—"],
                              ["Altura", p.altura?`${p.altura} cm`:"—"],
                              ["Fecha Nac.", p.fechaNac||"—"],
                              ["Nacionalidad", p.nacionalidad||"—"],
                            ].map(([k,v])=>(
                              <div key={k}>
                                <span style={{color:"#475569",fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{k.toUpperCase()} </span>
                                <span style={{color:"#94a3b8",fontSize:12}}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botón exportar 11 Ideal */}
                {players.length > 0 && (
                  <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
                    <button className="btn-primary" style={{padding:"10px 20px",fontSize:13}}
                      onClick={()=>exportXIToPDF(filteredPlayers, xiFilterScout, xiFilterJornada, xiFilterLiga)}>
                      ↓ Exportar PDF
                    </button>
                  </div>
                )}
              </div>
              );
            })()}

            {/* === PERFIL DEL JUGADOR === */}
            {activeTab==="perfil" && (() => {
              // Agrupar jugadores por nombre+apellido
              const grouped = {};
              players.forEach(p => {
                const key = `${p.nombre}|${p.apellido}`;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(p);
              });

              // Filtrar por scout si hay filtro activo
              const uniquePlayers = Object.values(grouped).filter(records =>
                !perfilFilterScout || records.some(r => r.scout === perfilFilterScout)
              );

              // Registros del jugador seleccionado
              const selectedKey = selectedPlayer ? `${selectedPlayer.nombre}|${selectedPlayer.apellido}` : null;
              const selectedRecords = selectedKey ? grouped[selectedKey] : [];
              const currentRecord = selectedRecords[selectedRecordIndex] || selectedRecords[0];

              return (
              <div>
                <p style={sectionTitle}>Jugadores Registrados</p>

                {/* Filtro de scout */}
                <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"flex-end"}}>
                  <div style={{maxWidth:260}}>
                    <label style={labelStyle}>Filtrar por Scout</label>
                    <select style={selectStyle} value={perfilFilterScout} onChange={e=>{setPerfilFilterScout(e.target.value);setSelectedPlayer(null);}}>
                      <option value="">Todos los scouts</option>
                      {SCOUTS.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {perfilFilterScout && (
                    <button className="btn-sec" onClick={()=>{setPerfilFilterScout("");setSelectedPlayer(null);}}>
                      Limpiar ×
                    </button>
                  )}
                  <span style={{color:"#64748b",fontSize:12,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,paddingBottom:2}}>
                    {uniquePlayers.length} JUGADOR{uniquePlayers.length!==1?"ES":""}
                  </span>
                </div>
                {uniquePlayers.length===0 && (
                  <div style={{textAlign:"center",padding:"60px 0",color:"#475569"}}>
                    <p style={{fontSize:40,marginBottom:12}}>◎</p>
                    <p style={{fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:2,fontSize:16}}>NO HAY JUGADORES REGISTRADOS</p>
                    <p style={{fontSize:13,marginTop:8}}>Ve a "Registrar Jugador" para comenzar.</p>
                  </div>
                )}

                {/* Tarjetas — una por jugador único */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12,marginBottom:32}}>
                  {uniquePlayers.map(records => {
                    const p = records[0];
                    const key = `${p.nombre}|${p.apellido}`;
                    const isSelected = selectedKey === key;
                    return (
                      <div key={key}
                        onClick={()=>{ setSelectedPlayer(p); setSelectedRecordIndex(0); }}
                        className="player-card"
                        style={{
                          padding:"14px 16px",borderRadius:8,cursor:"pointer",
                          background: isSelected ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)",
                          border:`1px solid ${isSelected?"rgba(74,222,128,0.4)":"rgba(255,255,255,0.08)"}`,
                          transition:"all 0.15s", position:"relative"
                        }}>
                        <p style={{color:"#e2e8f0",fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:700}}>{p.nombre} {p.apellido}</p>
                        <p style={{color:"#64748b",fontSize:12,marginTop:3}}>{p.posicion} · {p.equipo || "—"}</p>
                        <p style={{color:"#4ade80",fontSize:11,marginTop:4,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{p.scout}</p>
                        {records.length > 1 && (
                          <div style={{
                            position:"absolute",top:10,right:10,
                            background:"rgba(74,222,128,0.2)",border:"1px solid rgba(74,222,128,0.4)",
                            borderRadius:10,padding:"1px 7px",fontSize:11,
                            color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"
                          }}>{records.length}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Perfil expandido */}
                {selectedPlayer && currentRecord && (
                  <div ref={perfilRef} style={{
                    background:"rgba(255,255,255,0.03)",borderRadius:12,
                    border:"1px solid rgba(74,222,128,0.15)",padding:28,
                    animation:"fadeIn 0.3s ease"
                  }}>
                    <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

                    {/* Navegador de registros */}
                    {selectedRecords.length > 1 && (
                      <div style={{
                        display:"flex",alignItems:"center",justifyContent:"space-between",
                        marginBottom:20,padding:"10px 16px",
                        background:"rgba(74,222,128,0.06)",border:"1px solid rgba(74,222,128,0.2)",
                        borderRadius:8
                      }}>
                        <button
                          onClick={()=>setSelectedRecordIndex(i=>Math.max(0,i-1))}
                          disabled={selectedRecordIndex===0}
                          style={{background:"none",border:"none",color:selectedRecordIndex===0?"#475569":"#4ade80",fontSize:20,cursor:selectedRecordIndex===0?"default":"pointer"}}>
                          ◀
                        </button>
                        <div style={{textAlign:"center"}}>
                          <p style={{color:"#e2e8f0",fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,letterSpacing:1}}>
                            REGISTRO {selectedRecordIndex+1} DE {selectedRecords.length}
                          </p>
                          <p style={{color:"#4ade80",fontSize:12,marginTop:2}}>
                            {currentRecord.jornada||"—"} · {currentRecord.liga||"—"}
                          </p>
                        </div>
                        <button
                          onClick={()=>setSelectedRecordIndex(i=>Math.min(selectedRecords.length-1,i+1))}
                          disabled={selectedRecordIndex===selectedRecords.length-1}
                          style={{background:"none",border:"none",color:selectedRecordIndex===selectedRecords.length-1?"#475569":"#4ade80",fontSize:20,cursor:selectedRecordIndex===selectedRecords.length-1?"default":"pointer"}}>
                          ▶
                        </button>
                      </div>
                    )}

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:32}}>
                      {/* Col 1: datos */}
                      <div>
                        <div style={{marginBottom:20}}>
                          <p style={{color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:900,letterSpacing:2,lineHeight:1}}>
                            {currentRecord.nombre.toUpperCase()}
                          </p>
                          <p style={{color:"#e2e8f0",fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:400,letterSpacing:2}}>
                            {currentRecord.apellido.toUpperCase()}
                          </p>
                        </div>
                        {[
                          ["Scout",currentRecord.scout],
                          ["Equipo",currentRecord.equipo||"—"],
                          ["Posición",currentRecord.posicion||"—"],
                          ["Perfil",currentRecord.perfil||"—"],
                          ["Nacionalidad",currentRecord.nacionalidad||"—"],
                          ["Fecha Nac.",currentRecord.fechaNac||"—"],
                          ["Edad",currentRecord.fechaNac?age(currentRecord.fechaNac)+" años":"—"],
                          ["Altura",currentRecord.altura?`${currentRecord.altura} cm`:"—"],
                          ["Peso",currentRecord.peso?`${currentRecord.peso} kg`:"—"],
                          ["Jornada",currentRecord.jornada||"—"],
                          ["Liga",currentRecord.liga||"—"],
                          ["Ocasiones en 11 ideal", selectedRecords.length],
                        ].map(([k,v])=>(
                          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                            <span style={{color: k==="Ocasiones en 11 ideal"?"#4ade80":"#475569",fontSize:12,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{k.toUpperCase()}</span>
                            <span style={{color: k==="Ocasiones en 11 ideal"?"#4ade80":"#e2e8f0",fontSize:13,fontWeight: k==="Ocasiones en 11 ideal"?700:400}}>{v}</span>
                          </div>
                        ))}
                      </div>
                      {/* Col 2: clasificación */}
                      <div>
                        <p style={sectionTitle}>Clasificación</p>
                        {[
                          ["Categoría",currentRecord.categoria],
                          ["Proyección",currentRecord.proyeccion],
                          ["Rango",currentRecord.rango],
                          ["Transferencia",currentRecord.transferencia],
                        ].map(([k,v])=>(
                          <div key={k} style={{marginBottom:14}}>
                            <p style={{color:"#475569",fontSize:11,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,marginBottom:4}}>{k.toUpperCase()}</p>
                            <div style={{background:"rgba(74,222,128,0.08)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:5,padding:"6px 12px",display:"inline-block"}}>
                              <span style={{color:"#4ade80",fontSize:13,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{v||"—"}</span>
                            </div>
                          </div>
                        ))}
                        <p style={{...sectionTitle,marginTop:20}}>Descripción</p>
                        <p style={{color:"#94a3b8",fontSize:13,lineHeight:1.7}}>{currentRecord.descripcion||"Sin descripción."}</p>
                      </div>
                      {/* Col 3: radar */}
                      <div>
                        <p style={sectionTitle}>Rendimiento</p>
                        <div style={{display:"flex",justifyContent:"center"}}>
                          <RadarChart values={[currentRecord.tactica,currentRecord.tecnica,currentRecord.mental,currentRecord.fisico]}/>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
                          {[["Táctica",currentRecord.tactica],["Técnica",currentRecord.tecnica],["Mental",currentRecord.mental],["Físico",currentRecord.fisico]].map(([k,v])=>(
                            <div key={k} style={{background:"rgba(255,255,255,0.03)",borderRadius:6,padding:"8px 12px",textAlign:"center",border:"1px solid rgba(255,255,255,0.06)"}}>
                              <p style={{color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:700}}>{v}</p>
                              <p style={{color:"#64748b",fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{k.toUpperCase()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              );
            })()}
          </div>
        </div>
      </div>
    </>
  );
}
