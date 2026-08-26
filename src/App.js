import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const SCOUTS = [
  "Alexander Mojica","Andrés Velasco","Bernardo Livramento","Cristian Franco",
  "Jacson Gabriel","Joan Cami","Manuel González","Nelson Roa","Santiago Riani"
];

const POSITIONS_FIELD = [
  { id:"POR", label:"POR", x:50, y:95 },
  { id:"LI",  label:"LI",  x:8,  y:80 },
  { id:"DFCI",label:"DFCI", x:30, y:83 },
  { id:"LIB", label:"LIB", x:50, y:86 },
  { id:"DFCD",label:"DFCD", x:70, y:83 },
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
  DFCI: "Defensa Central Izquierdo",
  DFCD: "Defensa Central Derecho",
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

function RadarChart({ values, size = 220, color = "#4ade80" }) {
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
        fill={`${color}40`} stroke={color} strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={4} fill={color} />
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

function ShieldImage({ equipo, size = 32 }) {
  const [errorCount, setErrorCount] = useState(0);
  if (!equipo) return null;

  const equipoClean = (equipo||"").trim().normalize("NFC");
  if (!equipoClean) return null;

  const variants = [
    equipoClean,
    equipoClean.normalize("NFD").replace(/[\u0300-\u036f]/g,""),
  ].filter((v,i,arr) => arr.indexOf(v)===i);

  if (errorCount >= variants.length) return null;

  return (
    <img
      src={`/escudos/${variants[errorCount]}.png`}
      alt={equipoClean}
      style={{width:size, height:size, objectFit:"contain", flexShrink:0}}
      onError={()=>setErrorCount(c=>c+1)}
    />
  );
}

function FieldShield({ equipo, posLabel }) {
  const [errorCount, setErrorCount] = useState(0);
  const equipoClean = (equipo||"").trim().normalize("NFC");

  if (!equipoClean || errorCount >= 2) return (
    <span style={{color:"rgba(255,255,255,0.7)",fontSize:7,fontWeight:700,fontFamily:"sans-serif",textAlign:"center"}}>{posLabel}</span>
  );

  const variants = [
    equipoClean,
    equipoClean.normalize("NFD").replace(/[\u0300-\u036f]/g,""),
  ];

  return (
    <img
      src={`/escudos/${variants[errorCount]}.png`}
      alt={equipoClean}
      width={32}
      height={32}
      style={{objectFit:"contain"}}
      onError={()=>setErrorCount(c=>c+1)}
    />
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
        const pData = playerData?.[pos.id] || playerData?.[(pos.id||"").trim()];
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
              width:36, height:36, borderRadius:"50%",
              background: playerName ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.5)",
              border: playerName ? "none" : "2px dashed rgba(255,255,255,0.4)",
              display:"flex", alignItems:"center", justifyContent:"center",
              backdropFilter: playerName ? "none" : "blur(4px)",
              transition:"all 0.2s", overflow:"hidden"
            }}>
              {playerName && pData ? (
                <FieldShield equipo={(pData.equipoPrestamo||pData.equipo||"").trim()} posLabel={pos.label}/>
              ) : !playerName ? (
                <span style={{color:"rgba(255,255,255,0.5)",fontSize:9,fontFamily:"'Barlow Condensed',sans-serif"}}>{pos.label}</span>
              ) : null}
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
  tactica:5, tecnica:5, mental:5, fisico:5, jornada:"", liga:"", agente:"", informeFinal:false, equipoPrestamo:""
};

const USERS = {
  "SantiagoTinajero":    "Santiago Tinajero",
  "PepeHanan":           "Pepe Hanan",
  "CristianFranco":      "Cristian Franco",
  "NelsonRoa":           "Nelson Roa",
  "ManuelGonzález":      "Manuel González",
  "JoanCami":            "Joan Cami",
  "SantiagoRiani":       "Santiago Riani",
  "JacsonGabriel":       "Jacson Gabriel",
  "AndrésVelasco":       "Andrés Velasco",
  "AlexanderMojica":     "Alexander Mojica",
  "GuillermoSantisteban":"Guillermo Santisteban",
};

function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      const userName = USERS[password];
      if (userName) {
        onLogin(userName);
      } else {
        setError("Contraseña incorrecta. Intenta de nuevo.");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div style={{
      minHeight:"100vh", background:"#0a0f0d",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Barlow',sans-serif"
    }}>
      <div style={{
        background:"#0d1a12", borderRadius:14,
        border:"1px solid rgba(74,222,128,0.2)",
        padding:"48px 40px", width:"100%", maxWidth:400,
        textAlign:"center"
      }}>
        {/* Logo */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:24}}>
          <img
            src="https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/229.png&cquality=40&h=144&scale=crop&w=144"
            alt="Necaxa"
            style={{width:72,height:72,objectFit:"contain"}}
          />
        </div>
        <p style={{color:"#e2e8f0",fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:700,letterSpacing:3,marginBottom:4}}>
          SCOUT PLATFORM
        </p>
        <p style={{color:"#475569",fontSize:13,marginBottom:32}}>
          Ingresa tu contraseña para continuar
        </p>

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e=>{setPassword(e.target.value);setError("");}}
          onKeyDown={e=>e.key==="Enter" && handleSubmit()}
          style={{
            width:"100%", background:"rgba(255,255,255,0.05)",
            border:`1px solid ${error?"#ef4444":"rgba(255,255,255,0.12)"}`,
            borderRadius:8, padding:"12px 16px", color:"#e2e8f0",
            fontSize:15, fontFamily:"'Barlow',sans-serif",
            outline:"none", boxSizing:"border-box", marginBottom:12,
            textAlign:"center", letterSpacing:2
          }}
        />

        {error && (
          <p style={{color:"#ef4444",fontSize:12,marginBottom:12}}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !password}
          style={{
            width:"100%", background:"linear-gradient(135deg,#16a34a,#15803d)",
            border:"none", color:"#fff", padding:"12px",
            borderRadius:8, fontFamily:"'Barlow Condensed',sans-serif",
            fontSize:15, letterSpacing:2, cursor: loading||!password?"default":"pointer",
            opacity: loading||!password ? 0.6 : 1, transition:"all 0.2s"
          }}>
          {loading ? "VERIFICANDO..." : "ENTRAR"}
        </button>
      </div>
    </div>
  );
}

export default function ScoutingApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");

  const [activeTab, setActiveTab] = useState("registrar");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedRecordIndex, setSelectedRecordIndex] = useState(0);
  const [perfilFilterScout, setPerfilFilterScout] = useState("");
  const [perfilSearch, setPerfilSearch] = useState("");
  const [showEquipoSuggestions, setShowEquipoSuggestions] = useState(false);
  const [showEquipoPrestSuggestions, setShowEquipoPrestSuggestions] = useState(false);
  const [idealXI, setIdealXI] = useState({});
  const [assigningSlot, setAssigningSlot] = useState(null);
  const [sheetsUrl, setSheetsUrl] = useState("https://script.google.com/macros/s/AKfycbxVQ8LJKvACT5u2abphHnRojIjEoUFzhuJ8KBuJIi7J-wp_HPiGATLgLcKnYrqHQmvcTw/exec");
  const [sheetsConnected, setSheetsConnected] = useState(true);
  const [notification, setNotification] = useState(null);
  const [selectingPos, setSelectingPos] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar jugadores desde Google Sheets al iniciar
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const url = "https://script.google.com/macros/s/AKfycbxVQ8LJKvACT5u2abphHnRojIjEoUFzhuJ8KBuJIi7J-wp_HPiGATLgLcKnYrqHQmvcTw/exec?action=read";
        const res = await fetch(url, { method: "GET" });
        const data = await res.json();
        if (data.success && data.players.length > 0) {
          const positionMap = { "DFC1": "DFCI", "DFC2": "DFCD" };
          const withIds = data.players
            .filter(p => p.nombre || p.apellido)
            .map((p, i) => ({
              ...p,
              posicion: positionMap[p.posicion] || p.posicion,
              agente: p.agente || "",
              equipoPrestamo: p.equipoPrestamo || "",
              fechaRegistro: p.fechaRegistro || "",
              informeFinal: p.informeFinal === true || p.informeFinal === "Sí" || p.informeFinal === true,
              id: Date.now() + i
            }));
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
  const [listas, setListas] = useState([]);
  const [listaActiva, setListaActiva] = useState(null);
  const [showNuevaLista, setShowNuevaLista] = useState(false);
  const [showNuevaLista2, setShowNuevaLista2] = useState(false);
  const [nuevaListaNombre, setNuevaListaNombre] = useState("");
  const [showAddJugador, setShowAddJugador] = useState(false);
  const [favSearch, setFavSearch] = useState("");
  const [favPosFilter, setFavPosFilter] = useState("");
  const [favEquipoFilter, setFavEquipoFilter] = useState("");
  const [showRegForm, setShowRegForm] = useState(false);
  const [listaNombre, setListaNombre] = useState("");
  const [selectedForList, setSelectedForList] = useState([]);
  const [shortList, setShortList] = useState([]);
  const [editingListaId, setEditingListaId] = useState(null);
  const [favForm, setFavForm] = useState({
    nombre:"", apellido:"", equipo:"", equipoPrestamo:"",
    fechaNac:"", nacionalidad:"", finContrato:"", finContratoMes:"", posicion:""
  });
  const FAVORITOS_URL = "https://script.google.com/macros/s/AKfycbxVQ8LJKvACT5u2abphHnRojIjEoUFzhuJ8KBuJIi7J-wp_HPiGATLgLcKnYrqHQmvcTw/exec";

  useEffect(() => {
    const loadFavoritos = async () => {
      try {
        const res = await fetch(`${FAVORITOS_URL}?action=readFavoritos`);
        const data = await res.json();
        if (data.success) setListas(data.listas || []);
      } catch(err) { console.error("Error cargando favoritos:", err); }
    };
    loadFavoritos();
  }, []);

  const saveLista = async (lista) => {
    try {
      const params = new URLSearchParams({
        action: "saveFavorito",
        id: lista.id, nombre: lista.nombre,
        fecha: lista.fecha, jugadores: JSON.stringify(lista.jugadores)
      });
      fetch(`${FAVORITOS_URL}?${params.toString()}`, { method:"GET", mode:"no-cors" });
    } catch(err) { console.error("Error guardando favorito:", err); }
  };
  const [dts, setDts] = useState([]);
  const [selectedDT, setSelectedDT] = useState(null);
  const [selectedDTIndex, setSelectedDTIndex] = useState(0);
  const [dtFilterScout, setDtFilterScout] = useState("");
  const [dtSearch, setDtSearch] = useState("");
  const [showDTForm, setShowDTForm] = useState(false);
  const DT_URL = "https://script.google.com/macros/s/AKfycbxVQ8LJKvACT5u2abphHnRojIjEoUFzhuJ8KBuJIi7J-wp_HPiGATLgLcKnYrqHQmvcTw/exec";
  const defaultDTForm = {
    nombre:"", estilo:"", formacion:"", agente:"", scout:"",
    fechaNac:"", nacionalidad:"", equipoActual:"", formaJuego:"",
    personal:"", entrenamiento:"", cuerpoTecnico:""
  };
  const [dtForm, setDtForm] = useState(defaultDTForm);
  const setDF = (k,v) => setDtForm(f=>({...f,[k]:v}));

  useEffect(() => {
    const loadDTs = async () => {
      try {
        const res = await fetch(`${DT_URL}?action=readDTs`);
        const data = await res.json();
        if (data.success) {
          const withIds = (data.dts||[]).map((d,i)=>({...d, id: `dt_${i}_${d.nombre}`}));
          setDts(withIds);
        }
      } catch(err) { console.error("Error cargando DTs:", err); }
    };
    loadDTs();
  }, []);

  const handleRegisterDT = () => {
    if (!dtForm.nombre || !dtForm.scout) {
      showNotif("Por favor completa nombre y scout.", "error"); return;
    }
    const dt = { ...dtForm, id: `dt_${Date.now()}`, fechaRegistro: new Date().toLocaleDateString("es-ES") };
    setDts(prev => [...prev, dt]);
    const params = new URLSearchParams({
      action: "saveDT",
      nombre: dt.nombre, estilo: dt.estilo, formacion: dt.formacion,
      agente: dt.agente, scout: dt.scout, fechaNac: dt.fechaNac,
      nacionalidad: dt.nacionalidad, equipoActual: dt.equipoActual,
      formaJuego: dt.formaJuego, personal: dt.personal,
      entrenamiento: dt.entrenamiento, cuerpoTecnico: dt.cuerpoTecnico
    });
    fetch(`${DT_URL}?${params.toString()}`, { method:"GET", mode:"no-cors" });
    showNotif(`✓ ${dt.nombre} registrado correctamente.`);
    setDtForm(defaultDTForm);
    setShowDTForm(false);
  };

  const crearLista = () => {
    if (!nuevaListaNombre.trim()) return;
    const nueva = {
      id: Date.now().toString(),
      nombre: nuevaListaNombre.trim(),
      fecha: new Date().toLocaleDateString("es-ES"),
      jugadores: []
    };
    const nuevasListas = [...listas, nueva];
    setListas(nuevasListas);
    setListaActiva(nueva);
    setNuevaListaNombre("");
    setShowNuevaLista(false);
    saveLista(nueva);
  };

  const agregarJugadorFav = () => {
    if (!favForm.nombre || !listaActiva) return;
    const jugador = { ...favForm, id: Date.now().toString() };
    const listaActualizada = { ...listaActiva, jugadores: [...listaActiva.jugadores, jugador] };
    setListaActiva(listaActualizada);
    setListas(listas.map(l => l.id === listaActiva.id ? listaActualizada : l));
    saveLista(listaActualizada);
    setFavForm({ nombre:"", apellido:"", equipo:"", equipoPrestamo:"", fechaNac:"", nacionalidad:"", finContrato:"", finContratoMes:"" });
    setShowAddJugador(false);
    showNotif("Jugador agregado a la lista.");
  };

  const eliminarJugadorFav = (jugadorId) => {
    const listaActualizada = { ...listaActiva, jugadores: listaActiva.jugadores.filter(j => j.id !== jugadorId) };
    setListaActiva(listaActualizada);
    setListas(listas.map(l => l.id === listaActiva.id ? listaActualizada : l));
    saveLista(listaActualizada);
  };

  const getContratoColor = (finContrato, finContratoMes) => {
    if (!finContrato) return null;
    const now = new Date();
    const year = parseInt(finContrato);
    const month = finContratoMes === "Junio" ? 5 : 11;
    const fecha = new Date(year, month, 30);
    const diffMs = fecha - now;
    const diffMeses = diffMs / (1000 * 60 * 60 * 24 * 30);
    if (diffMeses < 0) return "#ef4444"; // vencido
    if (diffMeses <= 6) return "#f59e0b"; // próximo a vencer
    return "#4ade80"; // OK
  };

  const getNacionalidadCode = (nacionalidad) => {
    const map = {
      "España":"es","México":"mx","Argentina":"ar","Brasil":"br","Colombia":"co",
      "Uruguay":"uy","Chile":"cl","Perú":"pe","Ecuador":"ec","Paraguay":"py",
      "Bolivia":"bo","Venezuela":"ve","Francia":"fr","Alemania":"de","Italia":"it",
      "Portugal":"pt","Inglaterra":"gb-eng","Holanda":"nl","Bélgica":"be","Croacia":"hr",
      "Serbia":"rs","Polonia":"pl","Suiza":"ch","Austria":"at","Dinamarca":"dk",
      "Suecia":"se","Noruega":"no","Escocia":"gb-sct","Estados Unidos":"us",
      "Canadá":"ca","Costa Rica":"cr","Honduras":"hn","Guatemala":"gt","Panamá":"pa",
      "Jamaica":"jm","Trinidad y Tobago":"tt","Senegal":"sn","Nigeria":"ng",
      "Ghana":"gh","Costa de Marfil":"ci","Camerún":"cm","Marruecos":"ma",
      "Argelia":"dz","Egipto":"eg","Sudáfrica":"za","Japón":"jp","Corea del Sur":"kr",
      "Australia":"au","China":"cn","Turquía":"tr","Grecia":"gr","Rumania":"ro",
      "Hungría":"hu","República Checa":"cz","Eslovaquia":"sk","Ucrania":"ua",
      "Rusia":"ru","Georgia":"ge","Armenia":"am","Israel":"il","Arabia Saudita":"sa",
      "Irán":"ir","Irak":"iq","Haití":"ht","República Dominicana":"do",
      "Cuba":"cu","Puerto Rico":"pr","El Salvador":"sv","Nicaragua":"ni",
    };
    return map[nacionalidad] || "un";
  };

  const exportFavoritosPDF = async (lista, shortListIds=[]) => {
    showNotif("Generando PDF...");
    const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
    const W = 210, H = 297;
    const jugadores = lista.jugadores || [];
    const shortListJugadores = jugadores.filter(j=>shortListIds.includes(j.id));
    const mainJugadores = jugadores.filter(j=>!shortListIds.includes(j.id));

    // Precargar logos
    const logoCache = {};
    await Promise.all(jugadores.map(async j => {
      const eq = (j.equipoPrestamo||j.equipo||"").trim();
      if (eq && !logoCache[eq]) logoCache[eq] = await loadImageForPDF(eq);
      const eq2 = (j.equipo||"").trim();
      if (eq2 && !logoCache[eq2]) logoCache[eq2] = await loadImageForPDF(eq2);
    }));

    // Fondo blanco
    doc.setFillColor(255,255,255);
    doc.rect(0,0,W,H,"F");

    // Logo Necaxa centrado
    const necaxaLogo = logoCache["Necaxa"] || await loadImageForPDF("Necaxa");
    if (necaxaLogo) addLogoToPDF(doc, necaxaLogo, W/2, 16, 18);

    // Header texto
    doc.setTextColor(0,0,0);
    doc.setFont("helvetica","bold");
    doc.setFontSize(8);
    doc.text("DEPARTAMENTO DE INTELIGENCIA DEPORTIVA", W/2, 28, {align:"center"});
    doc.text("SCOUTING", W/2, 33, {align:"center"});
    doc.text("CLUB NECAXA", W/2, 38, {align:"center"});
    doc.setFontSize(10);
    doc.text(lista.nombre.toUpperCase(), W/2, 44, {align:"center"});

    // Leyenda contratos arriba derecha
    doc.setFontSize(6.5);
    doc.setTextColor(220,0,0);
    doc.text("TERMINO DE CONTRATO JUN", W-7, 10, {align:"right"});
    doc.setTextColor(0,80,180);
    doc.text("TERMINO DE CONTRATO DIC", W-7, 15, {align:"right"});

    // Línea separadora
    doc.setDrawColor(0,0,0);
    doc.setLineWidth(0.5);
    doc.line(8, 48, W-8, 48);

    // Helper para normalizar texto con caracteres especiales para jsPDF
    const pdfText = (str) => (str||"").normalize("NFC");

    // Función para renderizar un jugador
    const renderJugador = (j, x, y, colW) => {
      const contratoColor = getContratoColor(j.finContrato, j.finContratoMes);
      const logo = logoCache[(j.equipoPrestamo||j.equipo||"").trim()];
      const logoOwner = j.equipoPrestamo ? logoCache[j.equipo?.trim()] : null;
      const edad = j.fechaNac ? Math.floor((Date.now()-new Date(j.fechaNac).getTime())/(1000*60*60*24*365.25)) : null;

      // Logos del mismo tamaño, lado a lado
      if (logo && logoOwner) {
        addLogoToPDF(doc, logoOwner, x+3, y+3, 5);
        addLogoToPDF(doc, logo, x+9, y+3, 5);
      } else if (logo) {
        addLogoToPDF(doc, logo, x+3, y+3, 5);
      }

      // Color nombre según contrato
      if (contratoColor==="#ef4444") doc.setTextColor(220,0,0);
      else if (contratoColor==="#f59e0b") doc.setTextColor(0,80,180);
      else doc.setTextColor(0,0,0);

      doc.setFont("helvetica","bold");
      doc.setFontSize(6.5);
      const nac = j.nacionalidad ? ` (${pdfText(j.nacionalidad).substring(0,3).toUpperCase()})` : "";
      const yr = edad ? ` / ${edad}` : "";
      const pos = j.posicion ? ` [${pdfText(j.posicion)}]` : "";
      doc.text(pdfText(`${j.nombre.trim()} ${j.apellido.trim()}${nac}${yr}${pos}`), x+16, y+3.5, {maxWidth:colW-17});

      doc.setFont("helvetica","normal");
      doc.setTextColor(80,80,80);
      doc.setFontSize(6);
      const eqText = j.equipoPrestamo ? pdfText(`${j.equipoPrestamo} (${j.equipo})`) : pdfText(j.equipo||"");
      doc.text(eqText, x+16, y+7, {maxWidth:colW-17});

      doc.setTextColor(0,0,0);
      return j.equipoPrestamo ? 10 : 8;
    };

    // Columnas principales
    const startY = 52;
    const colCount = 3;
    const colW = (W-16)/colCount;
    let cols = [[],[],[]];
    mainJugadores.forEach((j,i)=>cols[i%colCount].push(j));

    let yPos = [startY, startY, startY];
    cols.forEach((col,ci)=>{
      const x = 8 + ci*colW;
      col.forEach(j=>{
        const h = renderJugador(j, x, yPos[ci], colW);
        yPos[ci] += h;
      });
    });

    // Short list
    if (shortListJugadores.length > 0) {
      const maxY = Math.max(...yPos) + 6;
      doc.setLineWidth(0.5);
      doc.setDrawColor(0,0,0);
      doc.line(8, maxY, W-8, maxY);

      doc.setFont("helvetica","bold");
      doc.setFontSize(10);
      doc.setTextColor(0,0,0);
      doc.text("SHORT LIST", W/2, maxY+7, {align:"center"});
      doc.setLineWidth(0.8);
      doc.line(W/2-18, maxY+8.5, W/2+18, maxY+8.5);

      const slCols = [[],[]];
      shortListJugadores.forEach((j,i)=>slCols[i%2].push(j));
      const slColW = (W-16)/2;
      let slY = [maxY+13, maxY+13];

      slCols.forEach((col,ci)=>{
        const x = 8+ci*slColW;
        col.forEach(j=>{
          const contratoColor = getContratoColor(j.finContrato, j.finContratoMes);
          const logo = logoCache[(j.equipoPrestamo||j.equipo||"").trim()];
          const logoOwner = j.equipoPrestamo ? logoCache[j.equipo?.trim()] : null;
          const edad = j.fechaNac?Math.floor((Date.now()-new Date(j.fechaNac).getTime())/(1000*60*60*24*365.25)):null;

          // Card con borde amarillo
          doc.setFillColor(255,252,235);
          doc.roundedRect(x, slY[ci], slColW-3, 16, 1, 1, "F");
          doc.setDrawColor(245,158,11);
          doc.setLineWidth(0.5);
          doc.roundedRect(x, slY[ci], slColW-3, 16, 1, 1);

          // Logos mismo tamaño
          if (logo && logoOwner) {
            addLogoToPDF(doc, logoOwner, x+4, slY[ci]+8, 8);
            addLogoToPDF(doc, logo, x+13, slY[ci]+8, 8);
          } else if (logo) {
            addLogoToPDF(doc, logo, x+6, slY[ci]+8, 10);
          }

          // Posición badge
          if (j.posicion) {
            doc.setFillColor(245,158,11);
            const pw = doc.getTextWidth(pdfText(j.posicion))+3;
            doc.roundedRect(x+slColW-pw-6, slY[ci]+1.5, pw, 4, 1,1,"F");
            doc.setTextColor(255,255,255);
            doc.setFontSize(5.5);
            doc.text(pdfText(j.posicion), x+slColW-pw/2-6, slY[ci]+4, {align:"center"});
          }

          // Nombre
          if (contratoColor==="#ef4444") doc.setTextColor(220,0,0);
          else if (contratoColor==="#f59e0b") doc.setTextColor(0,80,180);
          else doc.setTextColor(0,0,0);
          doc.setFont("helvetica","bold");
          doc.setFontSize(7.5);
          const nac = j.nacionalidad?` (${pdfText(j.nacionalidad).substring(0,3).toUpperCase()})`:""
          const yr = edad?` / ${edad}`:""
          doc.text(pdfText(`${j.nombre.trim()} ${j.apellido.trim()}${nac}${yr}`), x+23, slY[ci]+5.5, {maxWidth:slColW-30});

          doc.setFont("helvetica","normal");
          doc.setTextColor(80,80,80);
          doc.setFontSize(6.5);
          const eqText = j.equipoPrestamo?pdfText(`${j.equipoPrestamo} (${j.equipo})`):pdfText(j.equipo||"");
          doc.text(eqText, x+23, slY[ci]+10, {maxWidth:slColW-30});

          if (j.finContratoMes&&j.finContrato) {
            const cColor=contratoColor==="#ef4444"?[220,0,0]:contratoColor==="#f59e0b"?[0,80,180]:[0,120,0];
            doc.setTextColor(...cColor);
            doc.setFontSize(5.5);
            doc.text(`Cont. ${j.finContratoMes} ${j.finContrato}`, x+17, slY[ci]+14);
          }

          doc.setTextColor(0,0,0);
          doc.setDrawColor(0,0,0);
          slY[ci] += 18;
        });
      });
    }

    // Fecha pie
    doc.setFont("helvetica","normal");
    doc.setFontSize(6);
    doc.setTextColor(150,150,150);
    doc.text(new Date().toLocaleDateString("es-ES"), W/2, H-4, {align:"center"});

    doc.save(`favoritos-${lista.nombre}.pdf`);
    showNotif("✓ PDF exportado correctamente.");
  };
  const xiRef = useRef(null);
  const perfilRef = useRef(null);

  const loadImageForPDF = (equipo) => {
    return new Promise((resolve) => {
      if (!equipo) return resolve(null);
      const equipoClean = equipo.trim().normalize("NFC");
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        try {
          resolve({
            data: canvas.toDataURL("image/png"),
            ratio: img.width / img.height
          });
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = `/escudos/${equipoClean}.png`;
    });
  };

  // Helper para agregar logo con proporciones correctas
  const addLogoToPDF = (doc, logo, cx, cy, maxSize) => {
    if (!logo) return;
    const ratio = logo.ratio || 1;
    let w, h;
    if (ratio >= 1) { w = maxSize; h = maxSize / ratio; }
    else { h = maxSize; w = maxSize * ratio; }
    doc.addImage(logo.data, "PNG", cx - w/2, cy - h/2, w, h);
  };

  const exportXIToPDF = async (filteredPlayers, scout, jornada, liga) => {
    showNotif("Generando PDF...");
    const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" });
    const W = 297, H = 210;
    const green = [74, 222, 128];
    const darkGreen = [13, 71, 35];
    const bg = [10, 15, 13];
    const cardBg = [17, 28, 22];
    const textMain = [226, 232, 240];
    const textMuted = [100, 116, 139];

    // Precargar todos los logos
    const posMap = {};
    filteredPlayers.forEach(p => { if(p.posicion && !posMap[p.posicion]) posMap[p.posicion] = p; });
    const fieldPlayers = Object.values(posMap);

    const logoCache = {};
    await Promise.all(fieldPlayers.map(async p => {
      const eq = (p.equipoPrestamo || p.equipo || "").trim();
      if (eq && !logoCache[eq]) {
        logoCache[eq] = await loadImageForPDF(eq);
      }
    }));

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
    doc.setTextColor(...textMain);
    const subtitle = [scout, jornada, liga].filter(Boolean).join("  ·  ");
    doc.text(subtitle, 10, 17);
    doc.setTextColor(...textMain);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString("es-ES"), W-10, 12, {align:"right"});

    // Cancha
    const fieldX = 8, fieldY = 22, fieldW = 100, fieldH = 180;
    doc.setFillColor(21, 128, 61);
    doc.roundedRect(fieldX, fieldY, fieldW, fieldH, 3, 3, "F");

    // Franjas alternadas
    const stripeH = fieldH / 8;
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) {
        doc.setFillColor(0, 0, 0);
        doc.setGState(doc.GState({opacity: 0.05}));
        doc.rect(fieldX, fieldY + i * stripeH, fieldW, stripeH, "F");
        doc.setGState(doc.GState({opacity: 1}));
      }
    }

    // Líneas del campo
    doc.setDrawColor(255,255,255);
    doc.setLineWidth(0.3);
    doc.rect(fieldX+3, fieldY+2, fieldW-6, fieldH-4);
    doc.line(fieldX+3, fieldY+fieldH/2, fieldX+fieldW-3, fieldY+fieldH/2);
    doc.circle(fieldX+fieldW/2, fieldY+fieldH/2, 10);
    doc.circle(fieldX+fieldW/2, fieldY+fieldH/2, 0.8, "F");
    doc.rect(fieldX+3+(fieldW-6)*0.22, fieldY+2, (fieldW-6)*0.56, (fieldH-4)*0.17);
    doc.rect(fieldX+3+(fieldW-6)*0.35, fieldY+2, (fieldW-6)*0.30, (fieldH-4)*0.08);
    doc.rect(fieldX+3+(fieldW-6)*0.22, fieldY+fieldH-2-(fieldH-4)*0.17, (fieldW-6)*0.56, (fieldH-4)*0.17);
    doc.rect(fieldX+3+(fieldW-6)*0.35, fieldY+fieldH-2-(fieldH-4)*0.08, (fieldW-6)*0.30, (fieldH-4)*0.08);

    // Jugadores en la cancha
    POSITIONS_FIELD.forEach(pos => {
      const p = posMap[pos.id];
      const cx = fieldX + (pos.x/100)*fieldW;
      const cy = fieldY + (pos.y/100)*fieldH;
      if (p) {
        const eq = (p.equipoPrestamo || p.equipo || "").trim();
        const logo = logoCache[eq];
        if (logo) {
          addLogoToPDF(doc, logo, cx, cy, 10);
        } else {
          doc.setFillColor(239, 68, 68);
          doc.circle(cx, cy, 3.8, "F");
          doc.setTextColor(255,255,255);
          doc.setFont("helvetica","bold");
          doc.setFontSize(4.5);
          doc.text(pos.label, cx, cy+0.8, {align:"center"});
        }
        // Etiqueta nombre
        doc.setFillColor(0,0,0);
        const name = `${p.nombre} ${p.apellido}`;
        const nameW = doc.getTextWidth(name)+3;
        doc.roundedRect(cx-nameW/2, cy+4.5, nameW, 4.5, 1, 1, "F");
        doc.setTextColor(255,255,255);
        doc.setFontSize(5);
        doc.text(name, cx, cy+7.5, {align:"center"});
      } else {
        doc.setDrawColor(150,150,150);
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([0.5,0.5], 0);
        doc.circle(cx, cy, 3.5);
        doc.setLineDashPattern([], 0);
        doc.setTextColor(150,150,150);
        doc.setFontSize(4.5);
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

      // Logo equipo (quitar del top)
      const eqCard = (p.equipoPrestamo || p.equipo || "").trim();
      const logoCard = logoCache[eqCard];

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

      // Logo debajo del badge de proyección
      if (logoCard) {
        addLogoToPDF(doc, logoCard, x+colW-7, y+12, 9);
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
      doc.setTextColor(...textMain); doc.text((p.fechaNac||"—").toString().substring(0,10), c2+10, y+24);

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
          scout: player.informeFinal ? "Informe final" : player.scout,
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
          agente: String(player.agente || ""),
          informeFinal: String(player.informeFinal || false),
          equipoPrestamo: String(player.equipoPrestamo || ""),
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

  const handleLogin = (userName) => {
    setLoggedIn(true);
    setCurrentUser(userName);
  };

  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

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
              {id:"dts",icon:"▲",label:"DTs Scouteados"},
              {id:"favoritos",icon:"★",label:"Favoritos"},
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
                {activeTab==="registrar"?"REGISTRAR JUGADOR":activeTab==="xi"?"11 IDEAL":activeTab==="dts"?"DTs SCOUTEADOS":activeTab==="favoritos"?"FAVORITOS":"PERFIL DEL JUGADOR"}
              </p>
              <p style={{color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,letterSpacing:3,marginTop:2}}>
                {loading ? "CARGANDO JUGADORES..." : `${players.length} JUGADORES REGISTRADOS`}
              </p>
              {currentUser && (
                <p style={{color:"#475569",fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,letterSpacing:1,marginTop:2}}>
                  {currentUser}
                </p>
              )}
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

                  <div style={{marginBottom:12, position:"relative"}}>
                    <label style={labelStyle}>Equipo</label>
                    <input
                      style={inputStyle}
                      value={form.equipo}
                      onChange={e=>{setF("equipo",e.target.value);setShowEquipoSuggestions(true);}}
                      onFocus={()=>setShowEquipoSuggestions(true)}
                      onBlur={()=>setTimeout(()=>setShowEquipoSuggestions(false),150)}
                      placeholder="Club actual"
                      autoComplete="off"
                    />
                    {showEquipoSuggestions && form.equipo.length > 0 && (() => {
                      const equipos = [...new Set(players.map(p=>p.equipo).filter(Boolean))].sort();
                      const filtered = equipos.filter(e=>e.toLowerCase().includes(form.equipo.toLowerCase()) && e.toLowerCase()!==form.equipo.toLowerCase());
                      if (filtered.length === 0) return null;
                      return (
                        <div style={{
                          position:"absolute", top:"100%", left:0, right:0, zIndex:100,
                          background:"#111c16", border:"1px solid rgba(74,222,128,0.3)",
                          borderRadius:6, maxHeight:180, overflowY:"auto",
                          boxShadow:"0 8px 24px rgba(0,0,0,0.5)"
                        }}>
                          {filtered.map(e=>(
                            <div key={e}
                              onMouseDown={()=>{setF("equipo",e);setShowEquipoSuggestions(false);}}
                              style={{
                                padding:"9px 14px", cursor:"pointer",
                                color:"#e2e8f0", fontSize:13,
                                fontFamily:"'Barlow',sans-serif",
                                borderBottom:"1px solid rgba(255,255,255,0.05)",
                                transition:"background 0.1s"
                              }}
                              onMouseEnter={e=>e.currentTarget.style.background="rgba(74,222,128,0.1)"}
                              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                            >
                              {e}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{marginBottom:12, position:"relative"}}>
                    <label style={labelStyle}>Equipo de préstamo</label>
                    <input
                      style={inputStyle}
                      value={form.equipoPrestamo}
                      onChange={e=>{setF("equipoPrestamo",e.target.value);setShowEquipoSuggestions(false);}}
                      onFocus={()=>setShowEquipoPrestSuggestions(true)}
                      onBlur={()=>setTimeout(()=>setShowEquipoPrestSuggestions(false),150)}
                      placeholder="Solo si está prestado"
                      autoComplete="off"
                    />
                    {showEquipoPrestSuggestions && form.equipoPrestamo.length > 0 && (() => {
                      const equipos = [...new Set(players.map(p=>p.equipo).filter(Boolean))].sort();
                      const filtered = equipos.filter(e=>e.toLowerCase().includes(form.equipoPrestamo.toLowerCase()) && e.toLowerCase()!==form.equipoPrestamo.toLowerCase());
                      if (filtered.length === 0) return null;
                      return (
                        <div style={{
                          position:"absolute", top:"100%", left:0, right:0, zIndex:100,
                          background:"#111c16", border:"1px solid rgba(74,222,128,0.3)",
                          borderRadius:6, maxHeight:180, overflowY:"auto",
                          boxShadow:"0 8px 24px rgba(0,0,0,0.5)"
                        }}>
                          {filtered.map(e=>(
                            <div key={e}
                              onMouseDown={()=>{setF("equipoPrestamo",e);setShowEquipoPrestSuggestions(false);}}
                              style={{
                                padding:"9px 14px", cursor:"pointer",
                                color:"#e2e8f0", fontSize:13,
                                fontFamily:"'Barlow',sans-serif",
                                borderBottom:"1px solid rgba(255,255,255,0.05)",
                                transition:"background 0.1s"
                              }}
                              onMouseEnter={e=>e.currentTarget.style.background="rgba(74,222,128,0.1)"}
                              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                            >
                              {e}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
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
                    <input style={inputStyle} value={form.nacionalidad} onChange={e=>setF("nacionalidad",e.target.value)} placeholder="Ej. España"/>
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
                      {["N/A","Cesión","Cesión + Opción de compra","Libre","Venta","Oportunidad de Mercado (cesión)","Oportunidad de Mercado (venta)"].map(t=><option key={t}>{t}</option>)}
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

                  <div style={{marginBottom:16}}>
                    <label style={labelStyle}>Agente</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={form.agente}
                      onChange={e=>setF("agente",e.target.value)}
                      placeholder="Ej. Gestifute"
                    />
                  </div>

                  <p style={sectionTitle}>Descripción</p>
                  <textarea
                    rows={4}
                    style={{...inputStyle,resize:"vertical",lineHeight:1.6}}
                    value={form.descripcion}
                    onChange={e=>setF("descripcion",e.target.value)}
                    placeholder="Observaciones del scout sobre el jugador..."
                  />

                  {/* Botón Informe Final */}
                  <div style={{
                    display:"flex", alignItems:"center", gap:12,
                    marginTop:16, padding:"12px 16px", borderRadius:8,
                    background: form.informeFinal ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${form.informeFinal ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.08)"}`,
                    cursor:"pointer", transition:"all 0.2s"
                  }} onClick={()=>setF("informeFinal",!form.informeFinal)}>
                    <div style={{
                      width:20, height:20, borderRadius:4,
                      background: form.informeFinal ? "#f59e0b" : "transparent",
                      border: `2px solid ${form.informeFinal ? "#f59e0b" : "rgba(255,255,255,0.2)"}`,
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                      transition:"all 0.2s"
                    }}>
                      {form.informeFinal && <span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span>}
                    </div>
                    <div>
                      <p style={{color: form.informeFinal ? "#f59e0b" : "#94a3b8", fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, letterSpacing:1}}>
                        {form.informeFinal ? "INFORME FINAL" : "11 IDEAL SEMANAL"}
                      </p>
                      <p style={{color:"#475569", fontSize:11, marginTop:2}}>
                        {form.informeFinal ? "Se guardará en la información de los informes finales" : "Se guardará en la información del 11 ideal"}
                      </p>
                    </div>
                  </div>

                  <button className="btn-primary" style={{width:"100%",marginTop:16,opacity:syncing?0.7:1}}
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
              // Build assignments from filtered players: posicion -> player data
              const autoAssignments = {};
              const autoPlayerData = {};
              filteredPlayers.forEach(p => {
                const pos = (p.posicion||"").trim();
                if (pos && !autoAssignments[pos]) {
                  autoAssignments[pos] = `${p.nombre} ${p.apellido}`;
                  autoPlayerData[pos] = p;
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
                        playerData={autoPlayerData}
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
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              {p.equipoPrestamo ? (
                                <>
                                  <ShieldImage equipo={p.equipo.trim()} size={28}/>
                                  <span style={{color:"#475569",fontSize:12}}>›</span>
                                  <ShieldImage equipo={p.equipoPrestamo.trim()} size={28}/>
                                </>
                              ) : (
                                <ShieldImage equipo={(p.equipo||"").trim()} size={32}/>
                              )}
                            </div>
                              <div>
                                <p style={{color:"#e2e8f0",fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,letterSpacing:1}}>
                                  {p.nombre} {p.apellido}
                                </p>
                              <p style={{color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,letterSpacing:2,marginTop:2}}>
                                {POSITION_NAMES[p.posicion] || p.posicion || "—"}
                              </p>
                              </div>
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
                              ["Fecha Nac.", (p.fechaNac||"—").toString().substring(0,10)],
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

              // Filtrar por scout y búsqueda, ordenar del más reciente al más antiguo
              const uniquePlayers = Object.values(grouped).filter(records => {
                const matchScout = !perfilFilterScout || records.some(r => r.scout === perfilFilterScout);
                const matchSearch = !perfilSearch || records.some(r =>
                  `${r.nombre} ${r.apellido}`.toLowerCase().includes(perfilSearch.toLowerCase()) ||
                  (r.equipo||"").toLowerCase().includes(perfilSearch.toLowerCase()) ||
                  (r.posicion||"").toLowerCase().includes(perfilSearch.toLowerCase())
                );
                return matchScout && matchSearch;
              }).sort((a, b) => {
                const maxA = Math.max(...a.map(r => r.id || 0));
                const maxB = Math.max(...b.map(r => r.id || 0));
                return maxB - maxA;
              });

              // Registros del jugador seleccionado
              const selectedKey = selectedPlayer ? `${selectedPlayer.nombre}|${selectedPlayer.apellido}` : null;
              const selectedRecords = selectedKey ? grouped[selectedKey] : [];
              const currentRecord = selectedRecords[selectedRecordIndex] || selectedRecords[0];

              return (
              <div>
                <p style={sectionTitle}>Jugadores Registrados</p>

                {/* Filtros */}
                <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"flex-end",flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:200}}>
                    <label style={labelStyle}>Buscar jugador</label>
                    <input
                      style={inputStyle}
                      placeholder="Nombre, equipo o posición..."
                      value={perfilSearch}
                      onChange={e=>{setPerfilSearch(e.target.value);setSelectedPlayer(null);}}
                    />
                  </div>
                  <div style={{maxWidth:220}}>
                    <label style={labelStyle}>Filtrar por Scout</label>
                    <select style={selectStyle} value={perfilFilterScout} onChange={e=>{setPerfilFilterScout(e.target.value);setSelectedPlayer(null);}}>
                      <option value="">Todos los scouts</option>
                      {SCOUTS.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {(perfilFilterScout || perfilSearch) && (
                    <button className="btn-sec" onClick={()=>{setPerfilFilterScout("");setPerfilSearch("");setSelectedPlayer(null);}}>
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
                        <p style={{color:"#64748b",fontSize:12,marginTop:3}}>
                          {p.posicion} · {p.equipoPrestamo ? `${p.equipoPrestamo} (préstamo de ${p.equipo})` : p.equipo || "—"}
                        </p>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
                          <p style={{color:"#4ade80",fontSize:11,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>
                            {records.find(r=>!r.informeFinal)?.scout || records[0].scout}
                          </p>
                        </div>
                        {(() => {
                          const lastRecord = [...records].sort((a,b)=>b.id-a.id)[0];
                          return lastRecord?.fechaRegistro ? (
                            <p style={{color:"#475569",fontSize:10,marginTop:3,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:0.5}}>
                              Último registro: {(lastRecord.fechaRegistro||"").toString().substring(0,10)}
                            </p>
                          ) : null;
                        })()}
                        <div style={{position:"absolute",top:10,right:10,display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                          {records.filter(r=>!r.informeFinal).length > 0 && (
                            <div style={{
                              background:"rgba(74,222,128,0.2)",border:"1px solid rgba(74,222,128,0.4)",
                              borderRadius:10,padding:"1px 7px",fontSize:11,
                              color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"
                            }}>{records.filter(r=>!r.informeFinal).length}</div>
                          )}
                          {records.filter(r=>r.informeFinal).length > 0 && (
                            <div style={{
                              background:"rgba(251,191,36,0.2)",border:"1px solid rgba(251,191,36,0.4)",
                              borderRadius:10,padding:"1px 7px",fontSize:11,
                              color:"#f59e0b",fontFamily:"'Barlow Condensed',sans-serif"
                            }}>{records.filter(r=>r.informeFinal).length}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Modal perfil emergente */}
                {selectedPlayer && currentRecord && (
                  <div style={{
                    position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",
                    zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",
                    padding:20,overflowY:"auto"
                  }} onClick={()=>setSelectedPlayer(null)}>
                    <div ref={perfilRef} onClick={e=>e.stopPropagation()} style={{
                      background: currentRecord.informeFinal ? "#1a1400" : "#0d1a12",
                      borderRadius:14,
                      border:`1px solid ${currentRecord.informeFinal?"rgba(251,191,36,0.5)":"rgba(74,222,128,0.2)"}`,
                      padding:28, width:"100%", maxWidth:1000,
                      maxHeight:"90vh", overflowY:"auto",
                      animation:"fadeIn 0.25s ease", position:"relative"
                    }}>
                      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}`}</style>

                      {/* Botón cerrar */}
                      <button onClick={()=>setSelectedPlayer(null)} style={{
                        position:"absolute",top:16,right:16,
                        background:"rgba(255,255,255,0.06)",border:"none",
                        color:"#94a3b8",fontSize:20,cursor:"pointer",
                        width:32,height:32,borderRadius:"50%",
                        display:"flex",alignItems:"center",justifyContent:"center"
                      }}>×</button>

                      {/* Badge informe final */}
                      {currentRecord.informeFinal && (
                        <div style={{
                          display:"inline-flex",alignItems:"center",gap:6,
                          background:"rgba(251,191,36,0.12)",border:"1px solid rgba(251,191,36,0.4)",
                          borderRadius:6,padding:"4px 12px",marginBottom:16
                        }}>
                          <span style={{color:"#f59e0b",fontSize:12,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:2,fontWeight:700}}>
                            ★ INFORME FINAL
                          </span>
                        </div>
                      )}

                      {/* Navegador de registros */}
                    {selectedRecords.length > 1 && (
                      <div style={{
                        display:"flex",alignItems:"center",justifyContent:"space-between",
                        marginBottom:20,padding:"10px 16px",
                        background: currentRecord.informeFinal ? "rgba(251,191,36,0.06)" : "rgba(74,222,128,0.06)",
                        border: `1px solid ${currentRecord.informeFinal ? "rgba(251,191,36,0.2)" : "rgba(74,222,128,0.2)"}`,
                        borderRadius:8
                      }}>
                        <button
                          onClick={()=>setSelectedRecordIndex(i=>Math.max(0,i-1))}
                          disabled={selectedRecordIndex===0}
                          style={{background:"none",border:"none",color:selectedRecordIndex===0?"#475569":currentRecord.informeFinal?"#f59e0b":"#4ade80",fontSize:20,cursor:selectedRecordIndex===0?"default":"pointer"}}>
                          ◀
                        </button>
                        <div style={{textAlign:"center"}}>
                          <p style={{color:"#e2e8f0",fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,letterSpacing:1}}>
                            REGISTRO {selectedRecordIndex+1} DE {selectedRecords.length}
                          </p>
                          <p style={{color: currentRecord.informeFinal ? "#f59e0b" : "#4ade80",fontSize:12,marginTop:2}}>
                            {currentRecord.jornada||"—"} · {currentRecord.liga||"—"}
                          </p>
                        </div>
                        <button
                          onClick={()=>setSelectedRecordIndex(i=>Math.min(selectedRecords.length-1,i+1))}
                          disabled={selectedRecordIndex===selectedRecords.length-1}
                          style={{background:"none",border:"none",color:selectedRecordIndex===selectedRecords.length-1?"#475569":currentRecord.informeFinal?"#f59e0b":"#4ade80",fontSize:20,cursor:selectedRecordIndex===selectedRecords.length-1?"default":"pointer"}}>
                          ▶
                        </button>
                      </div>
                    )}

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:32}}>
                      {/* Col 1: datos */}
                      <div>
                        <div style={{marginBottom:20}}>
                          <p style={{color: currentRecord.informeFinal ? "#f59e0b" : "#4ade80",fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:900,letterSpacing:2,lineHeight:1}}>
                            {currentRecord.nombre.toUpperCase()}
                          </p>
                          <p style={{color:"#e2e8f0",fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:400,letterSpacing:2}}>
                            {currentRecord.apellido.toUpperCase()}
                          </p>
                        </div>
                        {[
                          ["Scout",currentRecord.scout],
                          ["Equipo",currentRecord.equipo||"—"],
                          ["Equipo de préstamo",currentRecord.equipoPrestamo||"—"],
                          ["Posición",currentRecord.posicion||"—"],
                          ["Perfil",currentRecord.perfil||"—"],
                          ["Nacionalidad",currentRecord.nacionalidad||"—"],
                          ["Fecha Nac.",(currentRecord.fechaNac||"—").toString().substring(0,10)],
                          ["Edad",currentRecord.fechaNac?age(currentRecord.fechaNac)+" años":"—"],
                          ["Altura",currentRecord.altura?`${currentRecord.altura} cm`:"—"],
                          ["Peso",currentRecord.peso?`${currentRecord.peso} kg`:"—"],
                          ["Jornada",currentRecord.jornada||"—"],
                          ["Liga",currentRecord.liga||"—"],
                          ["Agente",currentRecord.agente||"—"],
                          ["Fecha de registro",(currentRecord.fechaRegistro||"—").toString().substring(0,10)],
                          ["Ocasiones en 11 ideal", selectedRecords.filter(r=>!r.informeFinal).length],
                          ["Informes finales", selectedRecords.filter(r=>r.informeFinal).length],
                        ].map(([k,v])=>(
                          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                            <span style={{
                              color: k==="Informes finales" ? "#f59e0b"
                                : k==="Ocasiones en 11 ideal" ? "#4ade80"
                                : "#475569",
                              fontSize:12,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1
                            }}>{k.toUpperCase()}</span>
                            <span style={{
                              color: k==="Informes finales" ? "#f59e0b"
                                : k==="Ocasiones en 11 ideal" ? "#4ade80"
                                : "#e2e8f0",
                              fontSize:13,
                              fontWeight: k==="Ocasiones en 11 ideal" || k==="Informes finales" ? 700 : 400
                            }}>{v}</span>
                          </div>
                        ))}
                      </div>
                      {/* Col 2: clasificación */}
                      <div>
                        <p style={{...sectionTitle, color: currentRecord.informeFinal ? "#f59e0b" : "#4ade80"}}>Clasificación</p>
                        {[
                          ["Categoría",currentRecord.categoria],
                          ["Proyección",currentRecord.proyeccion],
                          ["Rango",currentRecord.rango],
                          ["Transferencia",currentRecord.transferencia],
                        ].map(([k,v])=>(
                          <div key={k} style={{marginBottom:14}}>
                            <p style={{color:"#475569",fontSize:11,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,marginBottom:4}}>{k.toUpperCase()}</p>
                            <div style={{
                              background: currentRecord.informeFinal ? "rgba(251,191,36,0.08)" : "rgba(74,222,128,0.08)",
                              border: `1px solid ${currentRecord.informeFinal ? "rgba(251,191,36,0.2)" : "rgba(74,222,128,0.2)"}`,
                              borderRadius:5,padding:"6px 12px",display:"inline-block"
                            }}>
                              <span style={{color: currentRecord.informeFinal ? "#f59e0b" : "#4ade80",fontSize:13,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{v||"—"}</span>
                            </div>
                          </div>
                        ))}
                        <p style={{...sectionTitle,marginTop:20, color: currentRecord.informeFinal ? "#f59e0b" : "#4ade80"}}>Descripción</p>
                        <p style={{color:"#94a3b8",fontSize:13,lineHeight:1.7}}>{currentRecord.descripcion||"Sin descripción."}</p>
                      </div>
                      {/* Col 3: radar */}
                      <div>
                        <p style={{...sectionTitle, color: currentRecord.informeFinal ? "#f59e0b" : "#4ade80"}}>Rendimiento</p>
                        <div style={{display:"flex",justifyContent:"center"}}>
                          <RadarChart values={[currentRecord.tactica,currentRecord.tecnica,currentRecord.mental,currentRecord.fisico]} color={currentRecord.informeFinal ? "#f59e0b" : "#4ade80"}/>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
                          {[["Táctica",currentRecord.tactica],["Técnica",currentRecord.tecnica],["Mental",currentRecord.mental],["Físico",currentRecord.fisico]].map(([k,v])=>(
                            <div key={k} style={{background:"rgba(255,255,255,0.03)",borderRadius:6,padding:"8px 12px",textAlign:"center",border:"1px solid rgba(255,255,255,0.06)"}}>
                              <p style={{color: currentRecord.informeFinal ? "#f59e0b" : "#4ade80",fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:700}}>{v}</p>
                              <p style={{color:"#64748b",fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{k.toUpperCase()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>
              );
            })()}
            {/* === DTs SCOUTEADOS === */}
            {activeTab==="dts" && (() => {
              // Agrupar DTs por nombre
              const groupedDTs = {};
              dts.forEach(d => {
                if (!groupedDTs[d.nombre]) groupedDTs[d.nombre] = [];
                groupedDTs[d.nombre].push(d);
              });

              const uniqueDTs = Object.values(groupedDTs).filter(records => {
                const matchScout = !dtFilterScout || records.some(r=>r.scout===dtFilterScout);
                const matchSearch = !dtSearch || records[0].nombre.toLowerCase().includes(dtSearch.toLowerCase()) ||
                  (records[0].equipoActual||"").toLowerCase().includes(dtSearch.toLowerCase());
                return matchScout && matchSearch;
              }).sort((a,b) => {
                const maxA = Math.max(...a.map(r=>new Date(r.fechaRegistro||0)));
                const maxB = Math.max(...b.map(r=>new Date(r.fechaRegistro||0)));
                return maxB - maxA;
              });

              const selectedRecords = selectedDT ? (groupedDTs[selectedDT.nombre]||[]) : [];
              const currentDT = selectedRecords[selectedDTIndex] || selectedRecords[0];

              return (
                <div>
                  {/* Filtros + botón registrar */}
                  <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"flex-end",flexWrap:"wrap"}}>
                    <div style={{flex:2,minWidth:200}}>
                      <label style={labelStyle}>Buscar DT</label>
                      <input style={inputStyle} placeholder="Nombre o equipo..."
                        value={dtSearch} onChange={e=>setDtSearch(e.target.value)}/>
                    </div>
                    <div style={{maxWidth:220}}>
                      <label style={labelStyle}>Filtrar por Scout</label>
                      <select style={selectStyle} value={dtFilterScout} onChange={e=>setDtFilterScout(e.target.value)}>
                        <option value="">Todos los scouts</option>
                        {SCOUTS.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    {(dtFilterScout||dtSearch) && (
                      <button className="btn-sec" onClick={()=>{setDtFilterScout("");setDtSearch("");}}>Limpiar ×</button>
                    )}
                    <button className="btn-primary" style={{padding:"8px 16px",fontSize:13}}
                      onClick={()=>setShowDTForm(v=>!v)}>
                      {showDTForm?"✕ Cerrar":"⊕ Registrar DT"}
                    </button>
                    <span style={{color:"#64748b",fontSize:12,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,paddingBottom:2}}>
                      {uniqueDTs.length} DT{uniqueDTs.length!==1?"s":""}
                    </span>
                  </div>

                  {/* Formulario registro DT */}
                  {showDTForm && (
                    <div style={{background:"#0d1a12",borderRadius:10,border:"1px solid rgba(74,222,128,0.2)",padding:20,marginBottom:24}}>
                      <p style={{color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,letterSpacing:2,marginBottom:16}}>REGISTRAR DIRECTOR TÉCNICO</p>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
                        <div>
                          <label style={labelStyle}>Nombre DT</label>
                          <input style={inputStyle} placeholder="Nombre completo" value={dtForm.nombre} onChange={e=>setDF("nombre",e.target.value)}/>
                        </div>
                        <div>
                          <label style={labelStyle}>Scout</label>
                          <select style={selectStyle} value={dtForm.scout} onChange={e=>setDF("scout",e.target.value)}>
                            <option value="">Seleccionar scout</option>
                            {SCOUTS.map(s=><option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Equipo Actual</label>
                          <input style={inputStyle} placeholder="Club actual" value={dtForm.equipoActual} onChange={e=>setDF("equipoActual",e.target.value)}/>
                        </div>
                        <div>
                          <label style={labelStyle}>Estilo</label>
                          <select style={selectStyle} value={dtForm.estilo} onChange={e=>setDF("estilo",e.target.value)}>
                            <option value="">Seleccionar</option>
                            {["Ofensivo","Defensivo","Equilibrado","Estratega","Posesión","Transiciones"].map(o=><option key={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Forma de Juego</label>
                          <textarea rows={4} style={{...inputStyle,resize:"vertical",lineHeight:1.6}}
                            placeholder="Descripción de la forma de juego del DT..."
                            value={dtForm.formaJuego} onChange={e=>setDF("formaJuego",e.target.value)}/>
                        </div>
                        <div>
                          <label style={labelStyle}>Formación Predominante</label>
                          <input style={inputStyle} placeholder="Ej. 4-3-3" value={dtForm.formacion} onChange={e=>setDF("formacion",e.target.value)}/>
                        </div>
                        <div>
                          <label style={labelStyle}>Agente</label>
                          <input style={inputStyle} placeholder="Agencia o representante" value={dtForm.agente} onChange={e=>setDF("agente",e.target.value)}/>
                        </div>
                        <div>
                          <label style={labelStyle}>Fecha de Nacimiento</label>
                          <input type="date" style={inputStyle} value={dtForm.fechaNac} onChange={e=>setDF("fechaNac",e.target.value)}/>
                        </div>
                        <div>
                          <label style={labelStyle}>Nacionalidad</label>
                          <input style={inputStyle} placeholder="Ej. Argentina" value={dtForm.nacionalidad} onChange={e=>setDF("nacionalidad",e.target.value)}/>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                        <div>
                          <label style={labelStyle}>Personal</label>
                          <textarea rows={4} style={{...inputStyle,resize:"vertical",lineHeight:1.6}}
                            placeholder="Descripción del perfil personal del DT..."
                            value={dtForm.personal} onChange={e=>setDF("personal",e.target.value)}/>
                        </div>
                        <div>
                          <label style={labelStyle}>Entrenamiento</label>
                          <textarea rows={4} style={{...inputStyle,resize:"vertical",lineHeight:1.6}}
                            placeholder="Metodología y estilo de entrenamiento..."
                            value={dtForm.entrenamiento} onChange={e=>setDF("entrenamiento",e.target.value)}/>
                        </div>
                        <div>
                          <label style={labelStyle}>Cuerpo Técnico</label>
                          <textarea rows={4} style={{...inputStyle,resize:"vertical",lineHeight:1.6}}
                            placeholder="Información sobre su cuerpo técnico..."
                            value={dtForm.cuerpoTecnico} onChange={e=>setDF("cuerpoTecnico",e.target.value)}/>
                        </div>
                        <div>
                          <label style={labelStyle}>Forma de Juego</label>
                          <textarea rows={4} style={{...inputStyle,resize:"vertical",lineHeight:1.6}}
                            placeholder="Descripción de la forma de juego del DT..."
                            value={dtForm.formaJuego} onChange={e=>setDF("formaJuego",e.target.value)}/>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button className="btn-primary" style={{padding:"10px 24px"}} onClick={handleRegisterDT}>✦ REGISTRAR DT</button>
                        <button className="btn-sec" style={{padding:"10px 16px"}} onClick={()=>{setShowDTForm(false);setDtForm(defaultDTForm);}}>Cancelar</button>
                      </div>
                    </div>
                  )}

                  {/* Tarjetas DTs */}
                  <p style={sectionTitle}>Directores Técnicos Scouteados</p>
                  {uniqueDTs.length===0 && (
                    <div style={{textAlign:"center",padding:"60px 0",color:"#475569"}}>
                      <p style={{fontSize:40,marginBottom:12}}>▲</p>
                      <p style={{fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:2,fontSize:16}}>NO HAY DTs REGISTRADOS</p>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12,marginBottom:32}}>
                    {uniqueDTs.map(records => {
                      const d = records[0];
                      const isSelected = selectedDT?.nombre === d.nombre;
                      return (
                        <div key={d.nombre}
                          onClick={()=>{setSelectedDT(d);setSelectedDTIndex(0);}}
                          className="player-card"
                          style={{
                            padding:"14px 16px",borderRadius:8,cursor:"pointer",position:"relative",
                            background: isSelected?"rgba(74,222,128,0.1)":"rgba(255,255,255,0.04)",
                            border:`1px solid ${isSelected?"rgba(74,222,128,0.4)":"rgba(255,255,255,0.08)"}`,
                            transition:"all 0.15s"
                          }}>
                          <p style={{color:"#e2e8f0",fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700}}>{d.nombre}</p>
                          <p style={{color:"#64748b",fontSize:12,marginTop:3}}>{d.equipoActual||"—"} · {d.estilo||"—"}</p>
                          <p style={{color:"#4ade80",fontSize:11,marginTop:4,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{d.scout}</p>
                          {records.length > 1 && (
                            <div style={{position:"absolute",top:10,right:10,background:"rgba(74,222,128,0.2)",border:"1px solid rgba(74,222,128,0.4)",borderRadius:10,padding:"1px 7px",fontSize:11,color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif"}}>
                              {records.length}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Modal perfil DT */}
                  {selectedDT && currentDT && (
                    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}
                      onClick={()=>setSelectedDT(null)}>
                      <div onClick={e=>e.stopPropagation()} style={{
                        background:"#0d1a12",borderRadius:14,border:"1px solid rgba(74,222,128,0.2)",
                        padding:28,width:"100%",maxWidth:900,maxHeight:"90vh",overflowY:"auto",
                        animation:"fadeIn 0.25s ease",position:"relative"
                      }}>
                        <button onClick={()=>setSelectedDT(null)} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.06)",border:"none",color:"#94a3b8",fontSize:20,cursor:"pointer",width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>

                        {/* Navegador de informes */}
                        {selectedRecords.length > 1 && (
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,padding:"10px 16px",background:"rgba(74,222,128,0.06)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:8}}>
                            <button onClick={()=>setSelectedDTIndex(i=>Math.max(0,i-1))} disabled={selectedDTIndex===0}
                              style={{background:"none",border:"none",color:selectedDTIndex===0?"#475569":"#4ade80",fontSize:20,cursor:selectedDTIndex===0?"default":"pointer"}}>◀</button>
                            <div style={{textAlign:"center"}}>
                              <p style={{color:"#e2e8f0",fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,letterSpacing:1}}>INFORME {selectedDTIndex+1} DE {selectedRecords.length}</p>
                              <p style={{color:"#4ade80",fontSize:12,marginTop:2}}>{currentDT.fechaRegistro||"—"}</p>
                            </div>
                            <button onClick={()=>setSelectedDTIndex(i=>Math.min(selectedRecords.length-1,i+1))} disabled={selectedDTIndex===selectedRecords.length-1}
                              style={{background:"none",border:"none",color:selectedDTIndex===selectedRecords.length-1?"#475569":"#4ade80",fontSize:20,cursor:selectedDTIndex===selectedRecords.length-1?"default":"pointer"}}>▶</button>
                          </div>
                        )}

                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:28}}>
                          {/* Columna izquierda — datos */}
                          <div>
                            <p style={{color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:900,letterSpacing:2,lineHeight:1,marginBottom:4}}>{currentDT.nombre.toUpperCase()}</p>
                            <p style={{color:"#94a3b8",fontSize:13,marginBottom:20}}>{currentDT.equipoActual||"—"}</p>
                            {[
                              ["Scout",currentDT.scout],
                              ["Estilo",currentDT.estilo||"—"],
                              ["Forma de Juego",currentDT.formaJuego||"—"],
                              ["Formación",currentDT.formacion||"—"],
                              ["Agente",currentDT.agente||"—"],
                              ["Fecha Nac.",(currentDT.fechaNac||"—").toString().substring(0,10)],
                              ["Edad",currentDT.fechaNac?age(currentDT.fechaNac)+" años":"—"],
                              ["Nacionalidad",currentDT.nacionalidad||"—"],
                              ["Fecha Registro",(currentDT.fechaRegistro||"—").toString().substring(0,10)],
                              ["Informes totales",selectedRecords.length],
                            ].map(([k,v])=>(
                              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                                <span style={{color: k==="Informes totales"?"#4ade80":"#475569",fontSize:12,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{k.toUpperCase()}</span>
                                <span style={{color: k==="Informes totales"?"#4ade80":"#e2e8f0",fontSize:13,fontWeight: k==="Informes totales"?700:400}}>{v}</span>
                              </div>
                            ))}
                          </div>

                          {/* Columna derecha — textos */}
                          <div>
                            {[
                              ["Personal",currentDT.personal],
                              ["Entrenamiento",currentDT.entrenamiento],
                              ["Cuerpo Técnico",currentDT.cuerpoTecnico],
                            ].map(([k,v])=>(
                              <div key={k} style={{marginBottom:16}}>
                                <p style={{...sectionTitle,marginTop:0}}>{k}</p>
                                <p style={{color:"#94a3b8",fontSize:13,lineHeight:1.7}}>{v||"Sin información."}</p>
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

            {/* === FAVORITOS === */}
            {activeTab==="favoritos" && (() => {
              const favInputStyle = {width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,padding:"7px 10px",color:"#e2e8f0",fontSize:13,fontFamily:"'Barlow',sans-serif",outline:"none",boxSizing:"border-box"};
              const favLabelStyle = {display:"block",color:"#64748b",fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1.5,textTransform:"uppercase",marginBottom:4};
              const dropdownStyle = {position:"absolute",top:"100%",left:0,right:0,zIndex:200,background:"#111c16",border:"1px solid rgba(74,222,128,0.3)",borderRadius:6,maxHeight:160,overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,0.5)"};

              // Base de datos de jugadores favoritos (de todas las listas)
              const allFavPlayers = {};
              listas.forEach(l => (l.jugadores||[]).forEach(j => { allFavPlayers[j.id] = j; }));
              const favPlayersDB = Object.values(allFavPlayers);

              // Jugadores únicos del sistema para autocompletado
              const grouped = {};
              players.forEach(p => {
                const key = `${p.nombre.trim()} ${p.apellido.trim()}`;
                if (!grouped[key]) grouped[key] = p;
              });
              const uniquePlayersList = Object.values(grouped);
              const equiposUnicos = [...new Set(players.map(p=>p.equipo).filter(Boolean).map(e=>e.trim()))].sort();

              const posicionesUnicas = [...new Set(favPlayersDB.map(p=>p.posicion).filter(Boolean))].sort();
              const equiposFavUnicos = [...new Set(favPlayersDB.map(p=>(p.equipoPrestamo||p.equipo||"")).filter(Boolean))].sort();

              const filteredFavPlayers = favPlayersDB.filter(p => {
                const matchName = !favSearch || `${p.nombre} ${p.apellido}`.toLowerCase().includes(favSearch.toLowerCase());
                const matchPos = !favPosFilter || p.posicion === favPosFilter;
                const matchEq = !favEquipoFilter || (p.equipo||"").includes(favEquipoFilter) || (p.equipoPrestamo||"").includes(favEquipoFilter);
                return matchName && matchPos && matchEq;
              });

              const isSelected = (id) => selectedForList.some(j=>j.id===id);

              const toggleSelect = (j) => {
                if (isSelected(j.id)) setSelectedForList(s=>s.filter(x=>x.id!==j.id));
                else setSelectedForList(s=>[...s,j]);
              };

              const guardarLista = () => {
                if (!listaNombre.trim() || selectedForList.length===0) return;
                if (editingListaId) {
                  // Editar lista existente
                  const actualizada = {
                    id: editingListaId,
                    nombre: listaNombre.trim(),
                    fecha: new Date().toLocaleDateString("es-ES"),
                    jugadores: selectedForList
                  };
                  setListas(prev=>prev.map(l=>l.id===editingListaId?actualizada:l));
                  saveLista(actualizada);
                  setEditingListaId(null);
                  setSelectedForList([]);
                  setShortList([]);
                  setListaNombre("");
                  showNotif(`Lista "${actualizada.nombre}" actualizada.`);
                } else {
                  // Nueva lista
                  const nueva = {
                    id: Date.now().toString(),
                    nombre: listaNombre.trim(),
                    fecha: new Date().toLocaleDateString("es-ES"),
                    jugadores: selectedForList
                  };
                  setListas(prev=>[...prev.filter(l=>l.nombre!=="__db__"),nueva,...prev.filter(l=>l.nombre==="__db__")]);
                  saveLista(nueva);
                  setSelectedForList([]);
                  setShortList([]);
                  setListaNombre("");
                  showNotif(`Lista "${nueva.nombre}" guardada.`);
                }
              };

              const cargarListaParaEditar = (lista) => {
                setEditingListaId(lista.id);
                setListaNombre(lista.nombre);
                setSelectedForList(lista.jugadores||[]);
                setShortList([]);
                showNotif(`Editando "${lista.nombre}"`);
              };

              // Nombre sugerencias para autocompletado en registro
              const nombreQuery = favForm.nombre.trim();
              const playerSuggestions = nombreQuery.length > 1 && !favForm._closeSuggestions
                ? uniquePlayersList.filter(p=>{
                    const fullName = `${p.nombre.trim()} ${p.apellido.trim()}`.toLowerCase();
                    const query = `${favForm.nombre.trim()} ${favForm.apellido.trim()}`.toLowerCase().trim();
                    return fullName.includes(query) || p.nombre.trim().toLowerCase().includes(nombreQuery.toLowerCase());
                  }).slice(0,6)
                : [];
              const equipoSug = favForm.equipo.length > 0
                ? equiposUnicos.filter(e=>e.toLowerCase().includes(favForm.equipo.toLowerCase()) && e.toLowerCase()!==favForm.equipo.toLowerCase()).slice(0,5)
                : [];
              const equipoPrestSug = favForm.equipoPrestamo.length > 0
                ? equiposUnicos.filter(e=>e.toLowerCase().includes(favForm.equipoPrestamo.toLowerCase()) && e.toLowerCase()!==favForm.equipoPrestamo.toLowerCase()).slice(0,5)
                : [];

              return (
                <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20,height:"calc(100vh - 130px)"}}>

                  {/* Panel izquierdo — base de jugadores + registro */}
                  <div style={{display:"flex",flexDirection:"column",gap:12,overflow:"hidden"}}>

                    {/* Header con buscador y botón registrar */}
                    <div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
                      <div style={{flex:2,minWidth:160}}>
                        <label style={favLabelStyle}>Buscar jugador</label>
                        <input style={favInputStyle} placeholder="Nombre o apellido..."
                          value={favSearch} onChange={e=>setFavSearch(e.target.value)}/>
                      </div>
                      <div style={{flex:1,minWidth:120}}>
                        <label style={favLabelStyle}>Posición</label>
                        <select style={favInputStyle} value={favPosFilter} onChange={e=>setFavPosFilter(e.target.value)}>
                          <option value="">Todas</option>
                          {posicionesUnicas.map(p=><option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div style={{flex:1,minWidth:120}}>
                        <label style={favLabelStyle}>Equipo</label>
                        <select style={favInputStyle} value={favEquipoFilter} onChange={e=>setFavEquipoFilter(e.target.value)}>
                          <option value="">Todos</option>
                          {equiposFavUnicos.map(e=><option key={e}>{e}</option>)}
                        </select>
                      </div>
                      <button className="btn-primary" style={{padding:"7px 14px",fontSize:12,whiteSpace:"nowrap"}}
                        onClick={()=>setShowRegForm(v=>!v)}>
                        {showRegForm ? "✕ Cerrar" : "+ Registrar jugador"}
                      </button>
                    </div>

                    {/* Formulario de registro */}
                    {showRegForm && (
                      <div style={{background:"#0d1a12",borderRadius:10,border:"1px solid rgba(74,222,128,0.2)",padding:16}}>
                        <p style={{color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,letterSpacing:2,marginBottom:12}}>REGISTRAR JUGADOR EN FAVORITOS</p>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:8}}>

                          {/* Nombre */}
                          <div style={{position:"relative"}}>
                            <label style={favLabelStyle}>Nombre</label>
                            <input style={favInputStyle} placeholder="Ej. Pedro"
                              value={favForm.nombre}
                              onChange={e=>setFavForm(f=>({...f,nombre:e.target.value,_closeSuggestions:null}))}
                              onKeyDown={e=>{ if(e.key==="Escape") setFavForm(f=>({...f,_closeSuggestions:Date.now()})); }}
                              autoComplete="off"/>
                            {playerSuggestions.length > 0 && (
                              <div style={{...dropdownStyle, minWidth:320}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 10px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
                                  <span style={{color:"#64748b",fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>SUGERENCIAS DEL SISTEMA</span>
                                  <button
                                    onMouseDown={e=>{e.preventDefault();setFavForm(f=>({...f,_closeSuggestions:Date.now()}));}}
                                    style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:14,padding:"0 2px",lineHeight:1}}>✕</button>
                                </div>
                                {playerSuggestions.map((p,i)=>(
                                  <div key={i} style={{padding:"7px 10px",cursor:"pointer",color:"#e2e8f0",fontSize:12,borderBottom:"1px solid rgba(255,255,255,0.05)"}}
                                    onMouseDown={()=>setFavForm(f=>({...f,nombre:p.nombre.trim(),apellido:p.apellido.trim(),equipo:(p.equipo||"").trim(),equipoPrestamo:(p.equipoPrestamo||"").trim(),fechaNac:(p.fechaNac||"").toString().substring(0,10),nacionalidad:p.nacionalidad||"",posicion:p.posicion||""}))}
                                    onMouseEnter={e=>e.currentTarget.style.background="rgba(74,222,128,0.1)"}
                                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                    <span style={{fontWeight:700}}>{p.nombre.trim()} {p.apellido.trim()}</span>
                                    <span style={{color:"#64748b",marginLeft:6,fontSize:10}}>{(p.equipo||"").trim()} · {p.posicion}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Apellido */}
                          <div>
                            <label style={favLabelStyle}>Apellido (opcional)</label>
                            <input style={favInputStyle} placeholder="Ej. Santos"
                              value={favForm.apellido}
                              onChange={e=>setFavForm(f=>({...f,apellido:e.target.value}))}
                              autoComplete="off"/>
                          </div>

                          {/* Posición */}
                          <div>
                            <label style={favLabelStyle}>Posición</label>
                            <input style={favInputStyle} placeholder="Ej. MCI"
                              value={favForm.posicion||""}
                              onChange={e=>setFavForm(f=>({...f,posicion:e.target.value}))}/>
                          </div>

                          {/* Nacionalidad */}
                          <div>
                            <label style={favLabelStyle}>Nacionalidad</label>
                            <input style={favInputStyle} placeholder="Ej. Colombia"
                              value={favForm.nacionalidad}
                              onChange={e=>setFavForm(f=>({...f,nacionalidad:e.target.value}))}/>
                          </div>

                          {/* Equipo */}
                          <div style={{position:"relative"}}>
                            <label style={favLabelStyle}>Equipo</label>
                            <input style={favInputStyle} placeholder="Club dueño"
                              value={favForm.equipo} onChange={e=>setFavForm(f=>({...f,equipo:e.target.value}))}
                              onBlur={()=>setTimeout(()=>setFavForm(f=>({...f})),150)}
                              autoComplete="off"/>
                            {equipoSug.length>0&&(
                              <div style={dropdownStyle}>
                                {equipoSug.map((e,i)=>(
                                  <div key={i} style={{padding:"6px 10px",cursor:"pointer",color:"#e2e8f0",fontSize:12,display:"flex",alignItems:"center",gap:6,borderBottom:"1px solid rgba(255,255,255,0.05)"}}
                                    onMouseDown={()=>setFavForm(f=>({...f,equipo:e}))}
                                    onMouseEnter={ev=>ev.currentTarget.style.background="rgba(74,222,128,0.1)"}
                                    onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                                    <ShieldImage equipo={e} size={16}/>{e}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Equipo préstamo */}
                          <div style={{position:"relative"}}>
                            <label style={favLabelStyle}>Equipo préstamo</label>
                            <input style={favInputStyle} placeholder="Si está prestado"
                              value={favForm.equipoPrestamo} onChange={e=>setFavForm(f=>({...f,equipoPrestamo:e.target.value}))} autoComplete="off"/>
                            {equipoPrestSug.length>0&&(
                              <div style={dropdownStyle}>
                                {equipoPrestSug.map((e,i)=>(
                                  <div key={i} style={{padding:"6px 10px",cursor:"pointer",color:"#e2e8f0",fontSize:12,display:"flex",alignItems:"center",gap:6,borderBottom:"1px solid rgba(255,255,255,0.05)"}}
                                    onMouseDown={()=>setFavForm(f=>({...f,equipoPrestamo:e}))}
                                    onMouseEnter={ev=>ev.currentTarget.style.background="rgba(74,222,128,0.1)"}
                                    onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                                    <ShieldImage equipo={e} size={16}/>{e}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Fecha nac */}
                          <div>
                            <label style={favLabelStyle}>Fecha Nac.</label>
                            <input style={favInputStyle} placeholder="YYYY-MM-DD"
                              value={favForm.fechaNac} onChange={e=>setFavForm(f=>({...f,fechaNac:e.target.value}))}/>
                          </div>

                          {/* Fin contrato */}
                          <div>
                            <label style={favLabelStyle}>Fin contrato</label>
                            <div style={{display:"flex",gap:4}}>
                              <select style={{...favInputStyle,flex:1}} value={favForm.finContratoMes} onChange={e=>setFavForm(f=>({...f,finContratoMes:e.target.value}))}>
                                <option value="">Mes</option>
                                <option>Junio</option>
                                <option>Diciembre</option>
                              </select>
                              <input style={{...favInputStyle,width:56}} placeholder="Año" value={favForm.finContrato} onChange={e=>setFavForm(f=>({...f,finContrato:e.target.value}))}/>
                            </div>
                          </div>
                        </div>

                        <div style={{display:"flex",gap:8}}>
                          <button className="btn-primary" style={{padding:"7px 16px",fontSize:12}} onClick={()=>{
                            if(!favForm.nombre) return;
                            const nuevo = {...favForm, id:Date.now().toString()};
                            // Guardar en todas las listas no — solo en la DB general (lista temporal)
                            const listaTemp = listas.find(l=>l.nombre==="__db__") || {id:"__db__",nombre:"__db__",fecha:new Date().toLocaleDateString("es-ES"),jugadores:[]};
                            const listaActualizada = {...listaTemp, jugadores:[...listaTemp.jugadores, nuevo]};
                            setListas(prev=>{
                              const existe = prev.find(l=>l.nombre==="__db__");
                              return existe ? prev.map(l=>l.nombre==="__db__"?listaActualizada:l) : [...prev, listaActualizada];
                            });
                            saveLista(listaActualizada);
                            setFavForm({nombre:"",apellido:"",equipo:"",equipoPrestamo:"",fechaNac:"",nacionalidad:"",finContrato:"",finContratoMes:"",posicion:""});
                            showNotif("Jugador registrado en favoritos.");
                          }}>Registrar</button>
                          <button className="btn-sec" style={{padding:"7px 12px",fontSize:12}} onClick={()=>setShowRegForm(false)}>Cancelar</button>
                        </div>
                      </div>
                    )}

                    {/* Grid de jugadores */}
                    <div style={{overflowY:"auto",flex:1}}>
                      {favPlayersDB.length === 0 && (
                        <div style={{textAlign:"center",padding:"40px",color:"#475569"}}>
                          <p style={{fontSize:13}}>Registra jugadores para comenzar.</p>
                        </div>
                      )}
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8}}>
                        {filteredFavPlayers.map(j=>{
                          const contratoColor = getContratoColor(j.finContrato, j.finContratoMes);
                          const edad = j.fechaNac ? Math.floor((Date.now()-new Date(j.fechaNac).getTime())/(1000*60*60*24*365.25)) : null;
                          const sel = isSelected(j.id);
                          return (
                            <div key={j.id}
                              onClick={()=>toggleSelect(j)}
                              style={{
                                background: sel?"rgba(74,222,128,0.1)":"rgba(255,255,255,0.03)",
                                borderRadius:8, padding:12, cursor:"pointer",
                                border:`1px solid ${sel?"rgba(74,222,128,0.5)":"rgba(255,255,255,0.07)"}`,
                                transition:"all 0.15s", position:"relative"
                              }}>
                              {sel && <div style={{position:"absolute",top:8,right:8,background:"#4ade80",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center"}}>
                                <span style={{color:"#000",fontSize:10,fontWeight:700}}>✓</span>
                              </div>}

                              {/* Nombre y posición */}
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                                {j.posicion && <span style={{background:"rgba(74,222,128,0.15)",color:"#4ade80",fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,padding:"2px 6px",borderRadius:4}}>{j.posicion}</span>}
                                <p style={{color:"#e2e8f0",fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700}}>{j.nombre} {j.apellido}</p>
                              </div>

                              {/* Equipos */}
                              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                                <ShieldImage equipo={(j.equipoPrestamo||j.equipo||"").trim()} size={20}/>
                                <span style={{color:"#94a3b8",fontSize:11}}>{j.equipoPrestamo?`${j.equipoPrestamo} (pr. ${j.equipo})`:j.equipo||"—"}</span>
                              </div>

                              {/* Info */}
                              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                                {j.nacionalidad && (
                                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                                    <img src={`https://flagcdn.com/24x18/${getNacionalidadCode(j.nacionalidad)}.png`} alt="" style={{width:16,height:12,objectFit:"cover",borderRadius:1}} onError={e=>e.target.style.display="none"}/>
                                    <span style={{color:"#64748b",fontSize:11}}>{j.nacionalidad}</span>
                                  </div>
                                )}
                                {edad && <span style={{color:"#64748b",fontSize:11}}>{edad} años</span>}
                                {contratoColor && j.finContratoMes && (
                                  <span style={{color:contratoColor,fontSize:10,fontFamily:"'Barlow Condensed',sans-serif"}}>
                                    {contratoColor==="#ef4444"?"⚠ ":""}{j.finContratoMes} {j.finContrato}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Panel derecho — constructor de lista */}
                  <div style={{background:"#0d1a12",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)",padding:16,display:"flex",flexDirection:"column",gap:12,overflow:"hidden"}}>
                    <p style={{color:"#4ade80",fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,letterSpacing:2}}>CONSTRUIR LISTA</p>

                    {/* Nombre de lista y guardar */}
                    <div>
                      <label style={favLabelStyle}>Nombre de la lista</label>
                      <input style={favInputStyle} placeholder="Ej. Mediocampistas enero..."
                        value={listaNombre} onChange={e=>setListaNombre(e.target.value)}/>
                    </div>

                    {selectedForList.length === 0 ? (
                      <div style={{textAlign:"center",padding:"20px 0",color:"#475569",flex:1}}>
                        <p style={{fontSize:12}}>Haz clic en jugadores del panel izquierdo para agregarlos.</p>
                      </div>
                    ) : (
                      <div style={{flex:1,overflowY:"auto"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <p style={{color:"#64748b",fontSize:11}}>{selectedForList.length} jugadores · {shortList.length} en short list</p>
                        </div>
                        {selectedForList.map(j=>{
                          const contratoColor = getContratoColor(j.finContrato, j.finContratoMes);
                          const isShort = shortList.includes(j.id);
                          return (
                            <div key={j.id} style={{
                              display:"flex",alignItems:"center",gap:8,padding:"8px 0",
                              borderBottom:"1px solid rgba(255,255,255,0.05)",
                              background: isShort?"rgba(251,191,36,0.04)":"transparent",
                              borderRadius: isShort?4:0
                            }}>
                              {/* Estrella short list */}
                              <button
                                onClick={e=>{e.stopPropagation();setShortList(s=>isShort?s.filter(x=>x!==j.id):[...s,j.id]);}}
                                style={{background:"none",border:"none",cursor:"pointer",fontSize:16,flexShrink:0,padding:0,lineHeight:1}}
                                title={isShort?"Quitar de short list":"Agregar a short list"}>
                                <span style={{color:isShort?"#f59e0b":"#475569"}}>★</span>
                              </button>
                              <ShieldImage equipo={(j.equipoPrestamo||j.equipo||"").trim()} size={22}/>
                              <div style={{flex:1,minWidth:0}}>
                                <p style={{color: isShort?"#fbbf24":"#e2e8f0",fontSize:12,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                                  {j.posicion && <span style={{color:isShort?"#f59e0b":"#4ade80",marginRight:4}}>{j.posicion}</span>}
                                  {j.nombre} {j.apellido}
                                </p>
                                <p style={{color:"#475569",fontSize:10}}>{j.equipoPrestamo||j.equipo||"—"}</p>
                              </div>
                              {contratoColor && <span style={{color:contratoColor,fontSize:10,flexShrink:0}}>{j.finContratoMes?.substring(0,3)} {j.finContrato}</span>}
                              <button onClick={e=>{e.stopPropagation();setSelectedForList(s=>s.filter(x=>x.id!==j.id));setShortList(s=>s.filter(x=>x!==j.id));}}
                                style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:14,flexShrink:0}}
                                onMouseEnter={e=>e.target.style.color="#ef4444"}
                                onMouseLeave={e=>e.target.style.color="#475569"}>×</button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div style={{display:"flex",flexDirection:"column",gap:8,borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:12}}>
                      <button className="btn-primary" style={{width:"100%",padding:"9px",fontSize:13}}
                        disabled={selectedForList.length===0||!listaNombre.trim()}
                        onClick={guardarLista}>
                        {editingListaId ? "✓ Actualizar lista" : "★ Guardar lista"}
                      </button>
                      {editingListaId && (
                        <button className="btn-sec" style={{width:"100%",padding:"7px",fontSize:12}}
                          onClick={()=>{setEditingListaId(null);setSelectedForList([]);setShortList([]);setListaNombre("");}}>
                          Cancelar edición
                        </button>
                      )}
                      {selectedForList.length > 0 && listaNombre.trim() && (
                        <button className="btn-sec" style={{width:"100%",padding:"7px",fontSize:12}}
                          onClick={()=>exportFavoritosPDF({nombre:listaNombre,jugadores:selectedForList,fecha:new Date().toLocaleDateString("es-ES")},shortList)}>
                          ↓ Exportar PDF
                        </button>
                      )}
                      {listas.filter(l=>l.nombre!=="__db__").length > 0 && (
                        <div style={{marginTop:4}}>
                          <p style={{color:"#64748b",fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,marginBottom:6}}>LISTAS GUARDADAS</p>
                          {listas.filter(l=>l.nombre!=="__db__").map(l=>(
                            <div key={l.id} style={{
                              display:"flex",justifyContent:"space-between",alignItems:"center",
                              padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",
                              background: editingListaId===l.id?"rgba(74,222,128,0.06)":"transparent",
                              borderRadius:4,paddingLeft: editingListaId===l.id?4:0
                            }}>
                              <div>
                                <p style={{color: editingListaId===l.id?"#4ade80":"#94a3b8",fontSize:12}}>{l.nombre}</p>
                                <p style={{color:"#475569",fontSize:10}}>{l.fecha} · {l.jugadores?.length||0} jug.</p>
                              </div>
                              <div style={{display:"flex",gap:4}}>
                                <button className="btn-sec" style={{padding:"3px 8px",fontSize:10}}
                                  onClick={()=>cargarListaParaEditar(l)}
                                  title="Editar lista">✏</button>
                                <button className="btn-sec" style={{padding:"3px 8px",fontSize:10}}
                                  onClick={()=>exportFavoritosPDF(l,[])}
                                  title="Exportar PDF">↓</button>
                                <button style={{padding:"3px 8px",fontSize:10,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:4,color:"#ef4444",cursor:"pointer"}}
                                  onClick={()=>{
                                    if(window.confirm(`¿Eliminar la lista "${l.nombre}"?`)) {
                                      setListas(prev=>prev.filter(x=>x.id!==l.id));
                                      if(editingListaId===l.id){setEditingListaId(null);setSelectedForList([]);setListaNombre("");}
                                      // Eliminar del Sheets
                                      const params = new URLSearchParams({ action:"deleteFavorito", id: l.id });
                                      fetch(`${FAVORITOS_URL}?${params.toString()}`, { method:"GET", mode:"no-cors" });
                                    }
                                  }}
                                  title="Eliminar lista">🗑</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      </div>
    </>
  );
}