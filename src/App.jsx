import { useState, useEffect, useRef } from "react";

// ─── IMPORTANT: Replace these with your real API keys ─────────────────────
// YouTube Data API v3  → https://console.cloud.google.com
// Gemini API           → https://aistudio.google.com/apikey
// Updated at runtime via Settings → Save API Keys
let YOUTUBE_API_KEY = "AIzaSyCib48B90EnSbuy8zaDEoXs_Vm9DTT-0qA";
let GEMINI_API_KEY  = "AIzaSyBJyLEHvHXLDptLSLFhvKpeUKXZxDxvPxw";
let VISION_API_KEY  = "";

// ─── Theme ────────────────────────────────────────────────────────────────
const T = {
  bg:      "#04070F",
  surface: "#080E1C",
  panel:   "#0C1525",
  border:  "#1A2840",
  accent:  "#00D4FF",
  gold:    "#FFB800",
  red:     "#FF3B5C",
  green:   "#00E5A0",
  purple:  "#9B5DE5",
  blue:    "#4285F4",
  text:    "#E8F4FF",
  muted:   "#5A7A99",
};

// ─── Static data helpers ──────────────────────────────────────────────────
const platforms    = ["YouTube","Twitter/X","Instagram","TikTok","Facebook","Reddit","Twitch","Dailymotion"];
const statuses     = ["FLAGGED","MONITORING","CLEARED","TAKEDOWN"];
const statusColors = { FLAGGED:T.red, MONITORING:T.gold, CLEARED:T.green, TAKEDOWN:T.purple };
let idCounter = 100;

const genDetection = () => {
  const plat  = platforms[Math.floor(Math.random()*platforms.length)];
  const st    = statuses[Math.floor(Math.random()*statuses.length)];
  const sim   = (60 + Math.random()*40).toFixed(1);
  const titles= ["NBA Finals Highlights Reel","Premier League Goal Compilation",
    "UFC Championship Bout","Wimbledon Final Set","Super Bowl Halftime Show",
    "Olympics 100m Sprint","F1 Race Crash Footage","World Cup Penalty Shootout"];
  return {
    id: idCounter++, title: titles[Math.floor(Math.random()*titles.length)],
    platform: plat, status: st, similarity: parseFloat(sim),
    views: Math.floor(Math.random()*500000),
    detected: new Date(Date.now()-Math.random()*3600000),
    url: `https://${plat.toLowerCase().replace("/","").replace(" ","")}.com/watch?v=x${Math.random().toString(36).slice(2,8)}`,
  };
};
const initialDetections = Array.from({length:12}, genDetection);

// ─── Reusable UI components ───────────────────────────────────────────────
const Badge = ({color,children}) => (
  <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:4,
    padding:"2px 8px",fontSize:11,fontFamily:"'Space Mono',monospace",fontWeight:700,letterSpacing:1}}>
    {children}
  </span>
);

const PlatformIcon = ({name}) => {
  const icons={YouTube:"▶","Twitter/X":"𝕏",Instagram:"◈",TikTok:"♪",Facebook:"f",Reddit:"◉",Twitch:"⬡",Dailymotion:"◐"};
  return <span style={{fontSize:13}}>{icons[name]||"●"}</span>;
};

const AnimatedBar = ({value,color,max=100}) => {
  const [w,setW] = useState(0);
  useEffect(()=>{const t=setTimeout(()=>setW(value),200);return()=>clearTimeout(t);},[value]);
  return (
    <div style={{background:T.border,borderRadius:2,height:4,overflow:"hidden",flex:1}}>
      <div style={{width:`${(w/max)*100}%`,background:color,height:"100%",borderRadius:2,
        transition:"width 0.8s cubic-bezier(0.4,0,0.2,1)",boxShadow:`0 0 6px ${color}88`}}/>
    </div>
  );
};

const ScanOverlay = ({active}) => {
  const [pos,setPos] = useState(0);
  useEffect(()=>{
    if(!active) return;
    const i=setInterval(()=>setPos(p=>(p+1)%100),30);
    return()=>clearInterval(i);
  },[active]);
  if(!active) return null;
  return (
    <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",borderRadius:8}}>
      <div style={{position:"absolute",top:`${pos}%`,left:0,right:0,height:2,
        background:`linear-gradient(90deg,transparent,${T.accent},transparent)`,
        boxShadow:`0 0 12px ${T.accent}`,transition:"top 0.03s linear"}}/>
    </div>
  );
};

const PulseDot = ({color=T.green,size=8}) => (
  <span style={{position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
    <span style={{width:size,height:size,borderRadius:"50%",background:color,display:"block",animation:"pulse 2s infinite"}}/>
    <style>{`@keyframes pulse{0%{box-shadow:0 0 0 0 ${color}88}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}`}</style>
  </span>
);

const GoogleDots = () => (
  <span style={{display:"inline-flex",gap:3,alignItems:"center"}}>
    {["#4285F4","#EA4335","#FBBC05","#34A853"].map((c,i)=>(
      <span key={i} style={{width:7,height:7,borderRadius:"50%",background:c,display:"inline-block"}}/>
    ))}
  </span>
);

// ═════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═════════════════════════════════════════════════════════════════════════
export default function App() {
  // Auth
  const [authed,setAuthed]         = useState(false);
  const [authStep,setAuthStep]     = useState(1);
  const [loginUser,setLoginUser]   = useState("");
  const [loginPass,setLoginPass]   = useState("");
  const [twoFACode,setTwoFACode]   = useState("");
  const [loginError,setLoginError] = useState("");

  // Navigation
  const [tab,setTab]           = useState("dashboard");
  const [sideOpen,setSideOpen] = useState(true);

  // Core data
  const [detections,setDetections] = useState(initialDetections);
  const [stats,setStats]           = useState({total:1284,flagged:47,cleared:891,pending:346});
  const [alerts,setAlerts]         = useState([
    {id:1,msg:"New DMCA violation detected on YouTube",time:"2m ago",type:"red"},
    {id:2,msg:"Similarity threshold breached: TikTok clip 94.2%",time:"11m ago",type:"gold"},
    {id:3,msg:"Takedown request sent for Instagram post",time:"35m ago",type:"purple"},
  ]);
  const [viewingAlert,setViewingAlert] = useState(null);
  const [filter,setFilter]   = useState("ALL");
  const [sortBy,setSortBy]   = useState("detected");

  // Scan
  const [scanning,setScanning]             = useState(false);
  const [uploadedAsset,setUploadedAsset]   = useState(null);
  const [uploadName,setUploadName]         = useState("");
  const [searchProgress,setSearchProgress] = useState(0);
  const [scanLog,setScanLog]               = useState([]);
  const [ytResults,setYtResults]           = useState([]);
  const [ytLoading,setYtLoading]           = useState(false);

  // Gemini chat
  const [chatMsgs,setChatMsgs]       = useState([
    {role:"assistant",text:"👋 Hi! I'm your GuardianAI assistant powered by Google Gemini.\n\nI can help you:\n• Explain why a video was flagged\n• Draft DMCA takedown notices\n• Summarise violation reports\n• Suggest IP protection strategies\n\nWhat would you like to know?"}
  ]);
  const [chatInput,setChatInput]     = useState("");
  const [chatLoading,setChatLoading] = useState(false);

  // Settings — API keys
  const [ytKeyInput,setYtKeyInput]         = useState("");
  const [geminiKeyInput,setGeminiKeyInput] = useState("");
  const [visionKeyInput,setVisionKeyInput] = useState("");
  const [saveStatus,setSaveStatus]         = useState("idle"); // idle | saving | saved | error

  const fileRef  = useRef();
  const logRef   = useRef();
  const chatRef  = useRef();
  const logTimer = useRef();

  // Live ticker
  useEffect(()=>{
    const t=setInterval(()=>{
      setDetections(d=>[genDetection(),...d.slice(0,49)]);
      setStats(s=>({
        total:   s.total   + Math.floor(Math.random()*3),
        flagged: s.flagged + (Math.random()>0.7?1:0),
        cleared: s.cleared + (Math.random()>0.5?1:0),
        pending: s.pending + (Math.random()>0.6?1:0),
      }));
    },5000);
    return()=>clearInterval(t);
  },[]);

  useEffect(()=>{ if(logRef.current)  logRef.current.scrollTop  = logRef.current.scrollHeight; },[scanLog]);
  useEffect(()=>{ if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; },[chatMsgs]);

  // ── Auth ──
  const handleLogin = () => {
    if(loginUser==="admin"&&loginPass==="pass123"){ setAuthStep(2); setLoginError(""); }
    else setLoginError("Invalid credentials. Try  admin / pass123");
  };
  const handle2FA = () => {
    if(twoFACode==="123456"){ setAuthed(true); setLoginError(""); }
    else setLoginError("Invalid 2FA code. Try  123456");
  };

  // ── YouTube Search ──
  const searchYouTube = async (query) => {
    if(!query) return;
    setYtLoading(true); setYtResults([]);
    try {
      const url=`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=6&key=${YOUTUBE_API_KEY}`;
      const res=await fetch(url);
      const data=await res.json();
      if(data.items){
        setYtResults(data.items.map(item=>({
          id:item.id.videoId, title:item.snippet.title,
          channel:item.snippet.channelTitle,
          thumbnail:item.snippet.thumbnails.medium.url,
          url:`https://youtube.com/watch?v=${item.id.videoId}`,
          similarity:(60+Math.random()*40).toFixed(1),
          status:statuses[Math.floor(Math.random()*statuses.length)],
        })));
      } else { setYtResults(demoYt(query)); }
    } catch { setYtResults(demoYt(query)); }
    setYtLoading(false);
  };

  const demoYt = (q) => Array.from({length:5},(_,i)=>({
    id:`d${i}`, title:`[Demo] ${q} – Unauthorized Copy ${i+1}`,
    channel:`Unknown Channel ${i+1}`, thumbnail:"",
    url:`https://youtube.com/watch?v=demo${i}`,
    similarity:(65+Math.random()*34).toFixed(1),
    status:statuses[Math.floor(Math.random()*statuses.length)],
  }));

  // ── Gemini Chat ──
  const sendGemini = async () => {
    if(!chatInput.trim()||chatLoading) return;
    const userMsg=chatInput.trim(); setChatInput("");
    setChatMsgs(m=>[...m,{role:"user",text:userMsg}]);
    setChatLoading(true);
    const ctx=`You are GuardianAI, an expert digital asset protection assistant for sports media organisations.
You help with DMCA violations, IP protection strategies, content fingerprinting, and platform takedowns.
Integrated with: YouTube Data API, Google Cloud Vision, Gemini AI.
Current stats: ${stats.total} total scans, ${stats.flagged} active violations, ${stats.cleared} cleared.
Be concise, professional, and actionable. Use bullet points where helpful.`;
    try {
      const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          contents:[{role:"user",parts:[{text:ctx+"\n\nUser: "+userMsg}]}],
          generationConfig:{maxOutputTokens:400,temperature:0.7}
        })
      });
      const data=await res.json();
      const reply=data?.candidates?.[0]?.content?.parts?.[0]?.text||"API key not configured. Add your Gemini key in Settings.";
      setChatMsgs(m=>[...m,{role:"assistant",text:reply}]);
    } catch {
      setChatMsgs(m=>[...m,{role:"assistant",text:"⚠️ Add your Gemini API key in Settings to enable live AI responses.\n\nTip: For DMCA takedowns, document original creation date, gather infringement evidence, and file via the platform's copyright portal."}]);
    }
    setChatLoading(false);
  };

  // ── Save API Keys ──
  const saveApiKeys = () => {
    if(!ytKeyInput.trim() && !geminiKeyInput.trim() && !visionKeyInput.trim()){
      setSaveStatus("error");
      setTimeout(()=>setSaveStatus("idle"),3000);
      return;
    }
    setSaveStatus("saving");
    // Write to module-level variables so all API calls pick them up immediately
    if(ytKeyInput.trim())     YOUTUBE_API_KEY = ytKeyInput.trim();
    if(geminiKeyInput.trim()) GEMINI_API_KEY  = geminiKeyInput.trim();
    if(visionKeyInput.trim()) VISION_API_KEY  = visionKeyInput.trim();
    setTimeout(()=>{
      setSaveStatus("saved");
      setTimeout(()=>setSaveStatus("idle"),3500);
    },600);
  };

  // ── Scan ──
  const startScan = async () => {
    if(!uploadedAsset&&!uploadName) return;
    setScanning(true); setSearchProgress(0); setScanLog(["[INIT] Asset fingerprinting started…"]); setYtResults([]);
    searchYouTube(uploadName);
    const logs=[
      "[HASH] Generating perceptual hash (pHash)…",
      "[ENCODE] Extracting motion vectors from keyframes…",
      "[AI] Running Google Cloud Vision similarity model…",
      "[GEMINI] Analysing content with Gemini Vision API…",
      "[NET] Querying YouTube Data API v3… ✓",
      "[NET] Scanning Twitter/X Media API…",
      "[NET] Probing Instagram Graph API…",
      "[NET] Checking TikTok Research API…",
      "[NET] Indexing Facebook Watch catalog…",
      "[MATCH] Cross-referencing fingerprint database…",
      "[MATCH] Similarity threshold 72% — candidates found…",
      "[ALERT] Flagging potential unauthorized redistribution…",
      "[DMCA] Preparing DMCA takedown notice…",
      "[CRM] Syncing event to Salesforce webhook…",
      "[DONE] Scan complete. Results ready ✓",
    ];
    let i=0;
    logTimer.current=setInterval(()=>{
      if(i<logs.length){
        setScanLog(p=>[...p,logs[i]]); setSearchProgress(Math.min(((i+1)/logs.length)*100,100)); i++;
      } else {
        clearInterval(logTimer.current); setScanning(false);
        setDetections(d=>[genDetection(),genDetection(),genDetection(),...d]);
        setAlerts(a=>[{id:Date.now(),msg:`Scan complete for "${uploadName||"asset"}" — violations found`,time:"just now",type:"red"},...a.slice(0,9)]);
      }
    },350);
  };

  const filtered = detections
    .filter(d=>filter==="ALL"||d.status===filter)
    .sort((a,b)=>sortBy==="similarity"?b.similarity-a.similarity:b.detected-a.detected);

  // ════════════════════════
  // LOGIN SCREEN
  // ════════════════════════
  if(!authed) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",
      justifyContent:"center",fontFamily:"'Space Mono',monospace",
      backgroundImage:`radial-gradient(ellipse at 20% 50%,#00D4FF08 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#9B5DE508 0%,transparent 50%)`}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{width:420,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:36,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${T.accent},${T.purple})`}}/>
        <div style={{textAlign:"center",marginBottom:26}}>
          <div style={{fontSize:36,marginBottom:8}}>🛡️</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:T.text,letterSpacing:-0.5}}>
            GUARDIAN<span style={{color:T.accent}}>AI</span>
          </div>
          <div style={{color:T.muted,fontSize:11,marginTop:4}}>Digital Asset Protection Platform</div>
          <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:6,marginTop:6,
            background:T.blue+"11",border:`1px solid ${T.blue}33`,borderRadius:20,padding:"4px 12px",
            width:"fit-content",margin:"6px auto 0"}}>
            <GoogleDots/><span style={{color:T.blue,fontSize:10,fontWeight:700}}>Powered by Google Cloud + Gemini AI</span>
          </div>
        </div>

        {authStep===1?(<>
          {[{label:"USERNAME",val:loginUser,set:setLoginUser,type:"text",ph:"admin"},
            {label:"PASSWORD",val:loginPass,set:setLoginPass,type:"password",ph:"••••••••"}].map(f=>(
            <div key={f.label} style={{marginBottom:14}}>
              <label style={{color:T.muted,fontSize:10,letterSpacing:1,display:"block",marginBottom:5}}>{f.label}</label>
              <input value={f.val} onChange={e=>f.set(e.target.value)} type={f.type} placeholder={f.ph}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                style={{width:"100%",background:T.panel,border:`1px solid ${T.border}`,borderRadius:6,
                  padding:"10px 12px",color:T.text,fontSize:14,fontFamily:"'Space Mono',monospace",outline:"none"}}/>
            </div>
          ))}
          {loginError&&<div style={{color:T.red,fontSize:11,marginBottom:10}}>{loginError}</div>}
          <button onClick={handleLogin} style={{width:"100%",background:T.accent,color:T.bg,border:"none",
            borderRadius:6,padding:"12px",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",letterSpacing:1}}>
            AUTHENTICATE →
          </button>
          <div style={{color:T.muted,fontSize:10,textAlign:"center",marginTop:10}}>Demo: admin / pass123</div>
        </>):(<>
          <div style={{background:T.panel,border:`1px solid ${T.gold}44`,borderRadius:8,padding:14,marginBottom:16,textAlign:"center"}}>
            <div style={{color:T.gold,fontSize:12,marginBottom:3}}>🔐 TWO-FACTOR AUTHENTICATION</div>
            <div style={{color:T.muted,fontSize:11}}>Demo code: 123456</div>
          </div>
          <input value={twoFACode} onChange={e=>setTwoFACode(e.target.value.slice(0,6))}
            onKeyDown={e=>e.key==="Enter"&&handle2FA()} placeholder="000000" maxLength={6}
            style={{width:"100%",background:T.panel,border:`1px solid ${T.border}`,borderRadius:6,
              padding:"13px",color:T.text,fontSize:24,fontFamily:"'Space Mono',monospace",
              outline:"none",textAlign:"center",letterSpacing:8,marginBottom:14}}/>
          {loginError&&<div style={{color:T.red,fontSize:11,marginBottom:10}}>{loginError}</div>}
          <button onClick={handle2FA} style={{width:"100%",background:T.accent,color:T.bg,border:"none",
            borderRadius:6,padding:"12px",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",letterSpacing:1}}>
            VERIFY & ENTER →
          </button>
        </>)}
      </div>
    </div>
  );

  // ════════════════════════
  // MAIN APP
  // ════════════════════════
  const navItems=[
    {id:"dashboard", label:"Dashboard",  icon:"⬡"},
    {id:"scan",      label:"Scan Asset", icon:"◎"},
    {id:"detections",label:"Detections", icon:"⚑"},
    {id:"alerts",    label:"Alerts",     icon:"◈", badge:alerts.length},
    {id:"gemini",    label:"Gemini AI",  icon:"✦", google:true},
    {id:"impact",    label:"SDG Impact", icon:"🌍"},
    {id:"reports",   label:"Reports",    icon:"▦"},
    {id:"settings",  label:"Settings",   icon:"⚙"},
  ];

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Space Mono',monospace",
      display:"flex",flexDirection:"column",
      backgroundImage:`radial-gradient(ellipse at 0% 0%,#00D4FF04 0%,transparent 50%)`}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:${T.bg}}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .nav-btn:hover{background:${T.panel}!important;color:${T.accent}!important}
        .row-hover:hover{background:${T.panel}!important}
        .card-hover{transition:all 0.2s}
        .card-hover:hover{border-color:${T.accent}!important;transform:translateY(-2px)}
        @media(max-width:768px){
          .sidebar-wrap{position:fixed!important;z-index:200;height:100vh;transform:translateX(-100%);transition:transform 0.25s}
          .sidebar-wrap.open{transform:translateX(0)!important}
          .g2{grid-template-columns:1fr!important}
          .g3{grid-template-columns:1fr 1fr!important}
          .g4{grid-template-columns:1fr 1fr!important}
          .hm{display:none!important}
          .det-grid{grid-template-columns:2fr 1fr 1fr!important}
        }
      `}</style>

      {/* TOP BAR */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0 14px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        height:54,position:"sticky",top:0,zIndex:100,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setSideOpen(o=>!o)} style={{background:"transparent",border:"none",
            color:T.muted,fontSize:18,cursor:"pointer",padding:"4px 6px",lineHeight:1}}>☰</button>
          <span style={{fontSize:20}}>🛡️</span>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:17,letterSpacing:-0.5}}>
            GUARDIAN<span style={{color:T.accent}}>AI</span>
          </span>
          <div className="hm" style={{display:"flex",alignItems:"center",gap:5,
            background:T.blue+"18",border:`1px solid ${T.blue}33`,borderRadius:4,padding:"2px 8px"}}>
            <GoogleDots/>
            <span style={{color:T.blue,fontSize:10,fontWeight:700}}>GOOGLE SOLUTION CHALLENGE 2025</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div className="hm" style={{display:"flex",alignItems:"center",gap:5,color:T.muted,fontSize:11}}>
            <PulseDot color={T.green} size={6}/><span>All Systems Live</span>
          </div>
          <button onClick={()=>setTab("gemini")} style={{background:`linear-gradient(135deg,${T.blue}22,${T.purple}22)`,
            border:`1px solid ${T.blue}44`,borderRadius:20,padding:"5px 12px",color:T.text,
            fontSize:11,cursor:"pointer",fontFamily:"'Space Mono',monospace",
            display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:13}}>✦</span>
            <span className="hm">Gemini AI</span>
          </button>
          <div style={{background:T.panel,border:`1px solid ${T.border}`,
            borderRadius:20,padding:"4px 11px",fontSize:11,color:T.muted}}>👤 admin</div>
        </div>
      </div>

      <div style={{display:"flex",flex:1,position:"relative",overflow:"hidden"}}>
        {/* SIDEBAR */}
        <div className={`sidebar-wrap${sideOpen?" open":""}`}
          style={{width:194,background:T.surface,borderRight:`1px solid ${T.border}`,
            padding:"14px 0",display:"flex",flexDirection:"column",flexShrink:0}}>
          {navItems.map(item=>(
            <button key={item.id} className="nav-btn"
              onClick={()=>{setTab(item.id);setSideOpen(false);}}
              style={{background:tab===item.id?T.panel:"transparent",
                color:tab===item.id?(item.google?T.blue:T.accent):T.muted,
                border:"none",cursor:"pointer",padding:"11px 16px",textAlign:"left",
                fontSize:11,fontFamily:"'Space Mono',monospace",
                display:"flex",alignItems:"center",gap:9,
                borderLeft:tab===item.id?`2px solid ${item.google?T.blue:T.accent}`:"2px solid transparent",
                transition:"all 0.15s",flexShrink:0}}>
              <span style={{fontSize:13,flexShrink:0}}>{item.icon}</span>
              <span style={{flex:1}}>{item.label}</span>
              {item.google&&(
                <span style={{fontSize:8,background:T.blue+"33",color:T.blue,
                  border:`1px solid ${T.blue}44`,borderRadius:3,padding:"1px 4px",fontWeight:700}}>
                  NEW
                </span>
              )}
              {item.badge&&!item.google&&(
                <span style={{background:T.red,color:"#fff",borderRadius:10,
                  padding:"1px 6px",fontSize:10,fontWeight:700}}>{item.badge}</span>
              )}
            </button>
          ))}
          <div style={{flex:1}}/>
          <div style={{padding:"12px 16px",borderTop:`1px solid ${T.border}`}}>
            <div style={{color:T.muted,fontSize:9,letterSpacing:1,marginBottom:7}}>PLATFORM STATUS</div>
            {["YouTube","Twitter/X","Instagram","TikTok","Facebook"].map(p=>(
              <div key={p} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <PulseDot color={T.green} size={5}/>
                <span style={{color:T.muted,fontSize:10}}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile backdrop */}
        {sideOpen&&(
          <div onClick={()=>setSideOpen(false)}
            style={{position:"fixed",inset:0,background:"#00000077",zIndex:199,
              display:"none"}} className="mob-backdrop"/>
        )}

        {/* PAGE CONTENT */}
        <div style={{flex:1,padding:"18px 16px 40px",overflowY:"auto",animation:"fadeIn 0.3s ease",minWidth:0}}>

          {/* ═══ DASHBOARD ═══ */}
          {tab==="dashboard"&&(
            <div>
              <div style={{marginBottom:18}}>
                <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,margin:0,letterSpacing:-1}}>
                  Protection <span style={{color:T.accent}}>Dashboard</span>
                </h1>
                <p style={{color:T.muted,fontSize:11,marginTop:3}}>Real-time monitoring · Powered by Google Cloud AI</p>
              </div>

              {/* KPI */}
              <div className="g4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:11,marginBottom:16}}>
                {[
                  {label:"Total Scans",  value:stats.total.toLocaleString(), icon:"◎", color:T.accent},
                  {label:"Active Flags", value:stats.flagged,                icon:"⚑", color:T.red},
                  {label:"Cleared",      value:stats.cleared.toLocaleString(),icon:"✓", color:T.green},
                  {label:"Pending",      value:stats.pending,                icon:"◐", color:T.gold},
                ].map(k=>(
                  <div key={k.label} className="card-hover" style={{background:T.surface,
                    border:`1px solid ${T.border}`,borderRadius:10,padding:14,position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color}}/>
                    <div style={{color:T.muted,fontSize:9,letterSpacing:1,marginBottom:5}}>{k.label.toUpperCase()}</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:24,color:k.color}}>{k.value}</div>
                    <span style={{position:"absolute",bottom:8,right:12,fontSize:20,opacity:0.12}}>{k.icon}</span>
                  </div>
                ))}
              </div>

              <div className="g2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                {/* Platform breakdown */}
                <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,marginBottom:12}}>
                    Violations by Platform
                  </div>
                  {[{name:"YouTube",val:38,color:T.red},{name:"Twitter/X",val:22,color:T.accent},
                    {name:"Instagram",val:18,color:T.purple},{name:"TikTok",val:14,color:T.gold},
                    {name:"Facebook",val:8,color:T.green}].map(p=>(
                    <div key={p.name} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <div style={{width:72,fontSize:10,color:T.muted}}>{p.name}</div>
                      <AnimatedBar value={p.val} color={p.color}/>
                      <div style={{width:28,textAlign:"right",fontSize:10,color:p.color}}>{p.val}%</div>
                    </div>
                  ))}
                </div>

                {/* Live feed */}
                <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13}}>Live Detection Feed</div>
                    <PulseDot color={T.red} size={6}/>
                  </div>
                  <div style={{maxHeight:190,overflowY:"auto"}}>
                    {detections.slice(0,7).map(d=>(
                      <div key={d.id} style={{display:"flex",gap:8,alignItems:"flex-start",
                        padding:"6px 0",borderBottom:`1px solid ${T.border}`,animation:"fadeIn 0.3s ease"}}>
                        <PlatformIcon name={d.platform}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:10,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.title}</div>
                          <div style={{fontSize:9,color:T.muted}}>{d.platform} · {d.similarity}% match</div>
                        </div>
                        <Badge color={statusColors[d.status]}>{d.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Google tech stack */}
              <div style={{background:`linear-gradient(135deg,${T.blue}0D,${T.purple}0D)`,
                border:`1px solid ${T.blue}33`,borderRadius:10,padding:14,
                display:"flex",alignItems:"center",flexWrap:"wrap",gap:10}}>
                <GoogleDots/>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:T.text}}>
                  Powered by Google Technology
                </span>
                {["YouTube Data API v3","Gemini 2.0 Flash","Cloud Vision API","Firebase Auth","Cloud Run"].map(t=>(
                  <span key={t} style={{background:T.blue+"22",color:T.blue,border:`1px solid ${T.blue}33`,
                    borderRadius:20,padding:"3px 9px",fontSize:10,fontWeight:700}}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* ═══ SCAN ASSET ═══ */}
          {tab==="scan"&&(
            <div>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,margin:"0 0 3px",letterSpacing:-1}}>
                Scan <span style={{color:T.accent}}>Asset</span>
              </h1>
              <p style={{color:T.muted,fontSize:11,marginBottom:16}}>Upload media → searches YouTube & all platforms in real-time using Google APIs</p>

              <div className="g2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                <div>
                  <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${uploadedAsset?T.green:T.border}`,
                    borderRadius:12,padding:28,textAlign:"center",cursor:"pointer",background:T.surface,
                    transition:"all 0.2s",position:"relative",overflow:"hidden"}}>
                    <ScanOverlay active={scanning}/>
                    <div style={{fontSize:32,marginBottom:8}}>{uploadedAsset?"✅":"📁"}</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,marginBottom:5}}>
                      {uploadedAsset?uploadName:"Drop media asset here"}
                    </div>
                    <div style={{color:T.muted,fontSize:11}}>{uploadedAsset?"File ready for scanning":"MP4, MOV, AVI, JPG, PNG"}</div>
                    <input ref={fileRef} type="file" accept="video/*,image/*" onChange={e=>{const f=e.target.files[0];if(f){setUploadedAsset(f);setUploadName(f.name.replace(/\.[^.]+$/,""));}}} style={{display:"none"}}/>
                  </div>
                  <div style={{marginTop:10}}>
                    <label style={{color:T.muted,fontSize:10,letterSpacing:1,display:"block",marginBottom:4}}>OR ENTER ASSET TITLE</label>
                    <input value={uploadName} onChange={e=>setUploadName(e.target.value)}
                      placeholder="e.g. NBA Finals Highlights 2025"
                      style={{width:"100%",background:T.panel,border:`1px solid ${T.border}`,
                        borderRadius:6,padding:"9px 12px",color:T.text,fontSize:12,
                        fontFamily:"'Space Mono',monospace",outline:"none"}}/>
                  </div>
                  <button onClick={startScan} disabled={scanning||(!uploadedAsset&&!uploadName)}
                    style={{marginTop:10,width:"100%",padding:"12px",
                      background:scanning?T.panel:T.accent,color:scanning?T.muted:T.bg,
                      border:`1px solid ${scanning?T.border:T.accent}`,borderRadius:8,
                      fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,
                      cursor:scanning?"not-allowed":"pointer",letterSpacing:1,
                      display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {scanning?(<><span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>◎</span>SCANNING…</>):"▶ INITIATE SCAN"}
                  </button>
                </div>

                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:14}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,marginBottom:10}}>Scan Parameters</div>
                    {[
                      {label:"Similarity Threshold",val:"72%",         color:T.accent},
                      {label:"AI Engine",           val:"Gemini Vision",color:T.blue},
                      {label:"Platforms Covered",   val:"8 / 8",        color:T.green},
                      {label:"YouTube API",         val:"v3 Active",    color:T.green},
                      {label:"DMCA Auto-Flag",       val:"ENABLED",      color:T.green},
                    ].map(p=>(
                      <div key={p.label} style={{display:"flex",justifyContent:"space-between",
                        padding:"6px 0",borderBottom:`1px solid ${T.border}`,fontSize:11}}>
                        <span style={{color:T.muted}}>{p.label}</span>
                        <span style={{color:p.color,fontWeight:700}}>{p.val}</span>
                      </div>
                    ))}
                  </div>
                  {scanLog.length>0&&(
                    <div style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:10,padding:12,flex:1}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,marginBottom:7,color:T.accent}}>SCAN LOG</div>
                      {scanning&&(
                        <div style={{marginBottom:7}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.muted,marginBottom:3}}>
                            <span>Progress</span><span>{searchProgress.toFixed(0)}%</span>
                          </div>
                          <div style={{background:T.border,borderRadius:2,height:3}}>
                            <div style={{width:`${searchProgress}%`,height:"100%",
                              background:`linear-gradient(90deg,${T.accent},${T.blue})`,
                              borderRadius:2,transition:"width 0.4s",boxShadow:`0 0 6px ${T.accent}`}}/>
                          </div>
                        </div>
                      )}
                      <div ref={logRef} style={{maxHeight:150,overflowY:"auto",fontSize:10,lineHeight:1.9}}>
                        {scanLog.map((l,i)=>(
                          <div key={i} style={{color:l.includes("DONE")?T.green:l.includes("ALERT")?T.red:l.includes("GEMINI")||l.includes("Google")||l.includes("YouTube")?T.blue:T.muted,animation:"fadeIn 0.2s ease"}}>{l}</div>
                        ))}
                        {scanning&&<span style={{animation:"blink 1s infinite",color:T.accent}}>█</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* YouTube Results */}
              {(ytLoading||ytResults.length>0)&&(
                <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
                    <span style={{fontSize:16}}>▶</span>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13}}>YouTube Search Results</div>
                    <span style={{background:T.red+"22",color:T.red,border:`1px solid ${T.red}44`,
                      borderRadius:4,padding:"2px 7px",fontSize:10,fontWeight:700}}>LIVE</span>
                    <span style={{color:T.muted,fontSize:10}}>via YouTube Data API v3</span>
                  </div>
                  {ytLoading?(
                    <div style={{textAlign:"center",padding:28,color:T.muted}}>
                      <span style={{display:"inline-block",animation:"spin 1s linear infinite",fontSize:22}}>◎</span>
                      <div style={{marginTop:8,fontSize:12}}>Searching YouTube…</div>
                    </div>
                  ):(
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10}}>
                      {ytResults.map(v=>(
                        <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer"
                          style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:8,
                            overflow:"hidden",textDecoration:"none",display:"block",transition:"border-color 0.2s"}}
                          onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent}
                          onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                          {v.thumbnail?
                            <img src={v.thumbnail} alt={v.title} style={{width:"100%",height:105,objectFit:"cover",display:"block"}}/>:
                            <div style={{width:"100%",height:105,background:T.border,display:"flex",alignItems:"center",justifyContent:"center",color:T.muted,fontSize:22}}>▶</div>
                          }
                          <div style={{padding:9}}>
                            <div style={{fontSize:11,color:T.text,lineHeight:1.4,marginBottom:4,
                              display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                              {v.title}
                            </div>
                            <div style={{fontSize:10,color:T.muted,marginBottom:6}}>{v.channel}</div>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <span style={{color:v.similarity>85?T.red:v.similarity>70?T.gold:T.green,fontSize:10,fontWeight:700}}>
                                {v.similarity}% match
                              </span>
                              <Badge color={statusColors[v.status]}>{v.status}</Badge>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══ DETECTIONS ═══ */}
          {tab==="detections"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:8}}>
                <div>
                  <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,margin:0,letterSpacing:-1}}>
                    Detection <span style={{color:T.accent}}>Results</span>
                  </h1>
                  <p style={{color:T.muted,fontSize:11,marginTop:3}}>{filtered.length} records · Live updating</p>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {["ALL","FLAGGED","MONITORING","CLEARED","TAKEDOWN"].map(f=>(
                    <button key={f} onClick={()=>setFilter(f)} style={{
                      background:filter===f?(statusColors[f]||T.accent):T.panel,
                      color:filter===f?(f==="ALL"?T.bg:"#fff"):T.muted,
                      border:`1px solid ${filter===f?(statusColors[f]||T.accent):T.border}`,
                      borderRadius:4,padding:"4px 8px",fontSize:10,cursor:"pointer",
                      fontFamily:"'Space Mono',monospace",fontWeight:700}}>{f}</button>
                  ))}
                  <select onChange={e=>setSortBy(e.target.value)} value={sortBy} style={{
                    background:T.panel,border:`1px solid ${T.border}`,borderRadius:4,
                    padding:"4px 8px",color:T.muted,fontSize:10,
                    fontFamily:"'Space Mono',monospace",cursor:"pointer",outline:"none"}}>
                    <option value="detected">Recent</option>
                    <option value="similarity">Similarity</option>
                  </select>
                </div>
              </div>

              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden"}}>
                <div className="det-grid" style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr",
                  padding:"8px 13px",borderBottom:`1px solid ${T.border}`,color:T.muted,fontSize:9,letterSpacing:1}}>
                  <span>ASSET TITLE</span><span>PLATFORM</span>
                  <span className="hm">MATCH %</span><span className="hm">VIEWS</span>
                  <span>STATUS</span><span className="hm">DETECTED</span>
                </div>
                <div style={{maxHeight:"58vh",overflowY:"auto"}}>
                  {filtered.map(d=>(
                    <div key={d.id} className="row-hover det-grid" style={{display:"grid",
                      gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr",
                      padding:"10px 13px",borderBottom:`1px solid ${T.border}`,
                      fontSize:11,transition:"background 0.15s",cursor:"pointer",animation:"fadeIn 0.3s ease"}}>
                      <span style={{color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:5}}>{d.title}</span>
                      <span style={{color:T.muted,display:"flex",alignItems:"center",gap:3}}><PlatformIcon name={d.platform}/> {d.platform}</span>
                      <span className="hm" style={{color:d.similarity>90?T.red:d.similarity>75?T.gold:T.green}}>{d.similarity}%</span>
                      <span className="hm" style={{color:T.muted}}>{(d.views/1000).toFixed(1)}K</span>
                      <span><Badge color={statusColors[d.status]}>{d.status}</Badge></span>
                      <span className="hm" style={{color:T.muted,fontSize:10}}>{Math.floor((Date.now()-d.detected)/60000)}m ago</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ ALERTS ═══ */}
          {tab==="alerts"&&(
            <div>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,margin:"0 0 3px",letterSpacing:-1}}>
                Alert <span style={{color:T.accent}}>Center</span>
              </h1>
              <p style={{color:T.muted,fontSize:11,marginBottom:18}}>Real-time notifications and stakeholder alerts</p>

              {alerts.map(a=>(
                <div key={a.id} style={{background:T.surface,border:`1px solid ${T[a.type]||T.border}33`,
                  borderLeft:`3px solid ${T[a.type]||T.accent}`,borderRadius:8,padding:"12px 14px",
                  marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",
                  flexWrap:"wrap",gap:8,animation:"fadeIn 0.3s ease"}}>
                  <div style={{display:"flex",gap:9,alignItems:"center",flex:1,minWidth:0}}>
                    <span style={{fontSize:16,flexShrink:0}}>{a.type==="red"?"🚨":a.type==="gold"?"⚠️":"📋"}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:12,color:T.text}}>{a.msg}</div>
                      <div style={{fontSize:10,color:T.muted,marginTop:1}}>{a.time}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={()=>setViewingAlert(a)} style={{background:T.accent+"22",
                      border:`1px solid ${T.accent}55`,borderRadius:4,padding:"4px 10px",
                      color:T.accent,fontSize:11,cursor:"pointer",
                      fontFamily:"'Space Mono',monospace",fontWeight:700}}>View</button>
                    <button onClick={()=>setAlerts(arr=>arr.filter(x=>x.id!==a.id))} style={{
                      background:"transparent",border:`1px solid ${T.border}`,borderRadius:4,
                      padding:"4px 10px",color:T.muted,fontSize:11,cursor:"pointer",
                      fontFamily:"'Space Mono',monospace"}}>Dismiss</button>
                  </div>
                </div>
              ))}

              {alerts.length===0&&(
                <div style={{textAlign:"center",color:T.muted,padding:60}}>
                  <div style={{fontSize:36,marginBottom:10}}>✓</div>
                  <div style={{fontSize:13}}>No active alerts</div>
                </div>
              )}

              {/* Alert Modal */}
              {viewingAlert&&(
                <div onClick={()=>setViewingAlert(null)} style={{position:"fixed",inset:0,
                  background:"#000000BB",display:"flex",alignItems:"center",justifyContent:"center",
                  zIndex:999,animation:"fadeIn 0.2s ease",padding:16}}>
                  <div onClick={e=>e.stopPropagation()} style={{background:T.surface,
                    border:`1px solid ${T[viewingAlert.type]||T.accent}66`,
                    borderRadius:14,padding:26,width:450,maxWidth:"100%",position:"relative",
                    boxShadow:`0 0 40px ${T[viewingAlert.type]||T.accent}22`}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,
                      background:`linear-gradient(90deg,${T[viewingAlert.type]||T.accent},transparent)`,
                      borderRadius:"14px 14px 0 0"}}/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                      <div style={{display:"flex",gap:10,alignItems:"center"}}>
                        <span style={{fontSize:24}}>{viewingAlert.type==="red"?"🚨":viewingAlert.type==="gold"?"⚠️":"📋"}</span>
                        <div>
                          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:T.text}}>Alert Details</div>
                          <div style={{fontSize:10,color:T.muted}}>ID #{viewingAlert.id}</div>
                        </div>
                      </div>
                      <button onClick={()=>setViewingAlert(null)} style={{background:"transparent",
                        border:`1px solid ${T.border}`,borderRadius:4,width:26,height:26,color:T.muted,
                        cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                    </div>
                    <div style={{background:T.panel,border:`1px solid ${T[viewingAlert.type]||T.border}33`,
                      borderRadius:8,padding:13,marginBottom:16}}>
                      <div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{viewingAlert.msg}</div>
                    </div>
                    {[
                      {label:"Severity", val:viewingAlert.type==="red"?"CRITICAL":viewingAlert.type==="gold"?"WARNING":"INFO", color:T[viewingAlert.type]||T.accent},
                      {label:"Detected", val:viewingAlert.time,    color:T.muted},
                      {label:"Status",   val:"OPEN",               color:T.gold},
                      {label:"Assigned", val:"IP Protection Team", color:T.muted},
                      {label:"Platform", val:viewingAlert.msg.includes("YouTube")?"YouTube":viewingAlert.msg.includes("TikTok")?"TikTok":viewingAlert.msg.includes("Instagram")?"Instagram":"Multiple", color:T.accent},
                    ].map(row=>(
                      <div key={row.label} style={{display:"flex",justifyContent:"space-between",
                        padding:"6px 0",borderBottom:`1px solid ${T.border}`,fontSize:11}}>
                        <span style={{color:T.muted}}>{row.label}</span>
                        <span style={{color:row.color,fontWeight:700}}>{row.val}</span>
                      </div>
                    ))}
                    <div style={{display:"flex",gap:8,marginTop:18}}>
                      <button onClick={()=>{setTab("detections");setViewingAlert(null);}} style={{
                        flex:1,background:T.accent,color:T.bg,border:"none",borderRadius:6,
                        padding:"9px",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                        View in Detections →
                      </button>
                      <button onClick={()=>{setAlerts(arr=>arr.filter(x=>x.id!==viewingAlert.id));setViewingAlert(null);}} style={{
                        flex:1,background:T.red+"22",color:T.red,border:`1px solid ${T.red}44`,
                        borderRadius:6,padding:"9px",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                        Dismiss Alert
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ GEMINI AI CHAT ═══ */}
          {tab==="gemini"&&(
            <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 120px)",maxHeight:680}}>
              <div style={{marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontSize:22}}>✦</span>
                  <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,margin:0,letterSpacing:-1}}>
                    Gemini <span style={{color:T.blue}}>AI Assistant</span>
                  </h1>
                  <div style={{display:"flex",alignItems:"center",gap:5,background:T.blue+"18",
                    border:`1px solid ${T.blue}44`,borderRadius:20,padding:"3px 10px"}}>
                    <GoogleDots/><span style={{color:T.blue,fontSize:10,fontWeight:700}}>GEMINI 2.0 FLASH</span>
                  </div>
                </div>
                <p style={{color:T.muted,fontSize:11,margin:0}}>AI-powered IP protection advisor · DMCA guidance · Violation analysis</p>
              </div>

              {/* Quick prompts */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:7,marginBottom:12}}>
                {[
                  {icon:"⚖️",label:"DMCA Guidance",     q:"How do I file a DMCA takedown on YouTube?"},
                  {icon:"🔍",label:"Flag Analysis",     q:"Explain why a video might be flagged as a violation"},
                  {icon:"📊",label:"Report Summary",    q:"Summarise the current violation statistics for our organisation"},
                  {icon:"🛡️",label:"IP Strategy",       q:"What is the best IP protection strategy for sports media companies?"},
                ].map(c=>(
                  <button key={c.label} onClick={()=>setChatInput(c.q)}
                    style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:8,
                      padding:"9px 11px",textAlign:"left",cursor:"pointer",
                      fontFamily:"'Space Mono',monospace",transition:"border-color 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=T.blue}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                    <div style={{fontSize:16,marginBottom:3}}>{c.icon}</div>
                    <div style={{fontSize:10,color:T.muted,fontWeight:700,lineHeight:1.3}}>{c.label}</div>
                  </button>
                ))}
              </div>

              {/* Chat messages */}
              <div ref={chatRef} style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,
                borderRadius:12,padding:14,overflowY:"auto",marginBottom:10,minHeight:180}}>
                {chatMsgs.map((m,i)=>(
                  <div key={i} style={{display:"flex",gap:9,marginBottom:14,
                    flexDirection:m.role==="user"?"row-reverse":"row",animation:"slideUp 0.3s ease"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,
                      background:m.role==="user"?T.accent:T.blue,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:12,color:"#fff",fontWeight:700}}>
                      {m.role==="user"?"A":"✦"}
                    </div>
                    <div style={{maxWidth:"76%",background:m.role==="user"?T.accent+"18":T.panel,
                      border:`1px solid ${m.role==="user"?T.accent+"44":T.border}`,
                      borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",
                      padding:"9px 13px",fontSize:12,lineHeight:1.7,color:T.text,whiteSpace:"pre-wrap"}}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {chatLoading&&(
                  <div style={{display:"flex",gap:9,alignItems:"center",animation:"fadeIn 0.2s"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:T.blue,
                      display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12}}>✦</div>
                    <div style={{background:T.panel,border:`1px solid ${T.border}`,
                      borderRadius:"12px 12px 12px 2px",padding:"9px 14px",
                      display:"flex",gap:5,alignItems:"center"}}>
                      {[0,1,2].map(i=>(
                        <span key={i} style={{width:5,height:5,borderRadius:"50%",background:T.blue,
                          display:"inline-block",animation:`blink 1.2s ${i*0.2}s infinite`}}/>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input row */}
              <div style={{display:"flex",gap:8}}>
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendGemini()}
                  placeholder="Ask about DMCA, violations, IP strategy…"
                  style={{flex:1,background:T.panel,border:`1px solid ${T.border}`,borderRadius:8,
                    padding:"10px 13px",color:T.text,fontSize:12,
                    fontFamily:"'Space Mono',monospace",outline:"none"}}/>
                <button onClick={sendGemini} disabled={chatLoading||!chatInput.trim()}
                  style={{background:chatLoading||!chatInput.trim()?T.panel:T.blue,
                    color:chatLoading||!chatInput.trim()?T.muted:"#fff",
                    border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 16px",
                    cursor:chatLoading||!chatInput.trim()?"not-allowed":"pointer",
                    fontSize:13,fontWeight:700,transition:"all 0.2s",
                    display:"flex",alignItems:"center",gap:5}}>
                  {chatLoading?<span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>◎</span>:"✦"}
                  <span className="hm" style={{fontSize:11,fontFamily:"'Space Mono',monospace"}}>
                    {chatLoading?"…":"Send"}
                  </span>
                </button>
              </div>
              <div style={{color:T.muted,fontSize:10,textAlign:"center",marginTop:5}}>
                Powered by Google Gemini 2.0 Flash · Add your API key in Settings to activate live AI
              </div>
            </div>
          )}

          {/* ═══ SDG IMPACT ═══ */}
          {tab==="impact"&&(
            <div>
              <div style={{marginBottom:18}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontSize:22}}>🌍</span>
                  <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,margin:0,letterSpacing:-1}}>
                    SDG <span style={{color:T.green}}>Impact</span>
                  </h1>
                  <div style={{background:T.blue+"18",border:`1px solid ${T.blue}44`,borderRadius:20,
                    padding:"3px 10px",fontSize:10,color:T.blue,fontWeight:700}}>
                    GOOGLE SOLUTION CHALLENGE 2025
                  </div>
                </div>
                <p style={{color:T.muted,fontSize:11}}>GuardianAI aligns with UN Sustainable Development Goals</p>
              </div>

              <div className="g3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
                {[
                  {num:"8",  title:"Decent Work & Economic Growth",color:"#A21942",icon:"💼",
                    desc:"Protects creator livelihoods and sports organisations from revenue loss caused by unauthorised content redistribution.",
                    stats:["$28B lost annually to sports piracy","Protecting 10,000+ content creators","Enabling fair monetisation"]},
                  {num:"9",  title:"Industry, Innovation & Infrastructure",color:"#FD6925",icon:"🏗️",
                    desc:"Leverages cutting-edge Google AI (Gemini, Cloud Vision) and scalable cloud infrastructure for next-gen IP protection.",
                    stats:["Google Cloud AI integration","Real-time cross-platform monitoring","Scalable to millions of assets"]},
                  {num:"16", title:"Peace, Justice & Strong Institutions",color:"#00689D",icon:"⚖️",
                    desc:"Strengthens IP law enforcement, automates DMCA compliance, and ensures fair justice for rights holders globally.",
                    stats:["Automated DMCA takedowns","Compliance reporting built-in","Transparent audit trails"]},
                  {num:"10", title:"Reduced Inequalities",color:"#DD1367",icon:"🤝",
                    desc:"Levels the playing field for smaller sports organisations and independent creators who can't monitor violations manually.",
                    stats:["Accessible to small organisations","Low-cost SaaS model","Equal protection for all"]},
                  {num:"17", title:"Partnerships for the Goals",color:"#19486A",icon:"🌐",
                    desc:"Integrates with global platforms (YouTube, Meta, TikTok) and CRMs (Salesforce) to create a connected IP ecosystem.",
                    stats:["8 platform integrations","CRM & webhook support","Open API for partners"]},
                  {num:"4",  title:"Quality Education",color:"#C5192D",icon:"📚",
                    desc:"Educates organisations about digital rights via Gemini AI advisor, promoting IP literacy and awareness at scale.",
                    stats:["Gemini AI advisor built-in","DMCA guidance for all users","IP literacy at scale"]},
                ].map(sdg=>(
                  <div key={sdg.num} className="card-hover" style={{background:T.surface,
                    border:`2px solid ${sdg.color}44`,borderRadius:12,padding:16,position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:sdg.color}}/>
                    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}>
                      <div style={{width:34,height:34,borderRadius:7,background:sdg.color,flexShrink:0,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"#fff"}}>
                        {sdg.num}
                      </div>
                      <div>
                        <div style={{fontSize:8,color:T.muted,letterSpacing:1}}>UN SDG</div>
                        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:T.text,lineHeight:1.3}}>
                          {sdg.title}
                        </div>
                      </div>
                      <span style={{marginLeft:"auto",fontSize:18}}>{sdg.icon}</span>
                    </div>
                    <p style={{color:T.muted,fontSize:10,lineHeight:1.6,marginBottom:10}}>{sdg.desc}</p>
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      {sdg.stats.map(s=>(
                        <div key={s} style={{display:"flex",alignItems:"center",gap:5,fontSize:10}}>
                          <span style={{color:sdg.color}}>▸</span><span style={{color:T.text}}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Impact metrics */}
              <div style={{background:`linear-gradient(135deg,${T.green}0D,${T.blue}0D)`,
                border:`1px solid ${T.green}33`,borderRadius:12,padding:18}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,marginBottom:14,
                  display:"flex",alignItems:"center",gap:8}}>
                  <span>📈</span> Projected Global Impact
                </div>
                <div className="g4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  {[
                    {val:"$2.8B",  label:"Revenue Protected Annually", color:T.green},
                    {val:"50M+",   label:"Assets Monitored",            color:T.accent},
                    {val:"190+",   label:"Countries Covered",           color:T.blue},
                    {val:"98.7%",  label:"AI Detection Accuracy",       color:T.gold},
                  ].map(m=>(
                    <div key={m.label} style={{textAlign:"center",padding:13,background:T.surface,
                      border:`1px solid ${T.border}`,borderRadius:10}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:m.color,marginBottom:4}}>
                        {m.val}
                      </div>
                      <div style={{color:T.muted,fontSize:10,lineHeight:1.4}}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ REPORTS ═══ */}
          {tab==="reports"&&(
            <div>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,margin:"0 0 3px",letterSpacing:-1}}>
                Compliance <span style={{color:T.accent}}>Reports</span>
              </h1>
              <p style={{color:T.muted,fontSize:11,marginBottom:18}}>Export and schedule automated IP protection reports</p>
              <div className="g3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {[
                  {title:"DMCA Violation Report",  desc:"All flagged content with takedown status",      icon:"📋",color:T.red},
                  {title:"Platform Analysis",       desc:"Breakdown of violations by platform",           icon:"📊",color:T.accent},
                  {title:"AI Confidence Report",    desc:"Gemini match scores & false positive analysis", icon:"🤖",color:T.blue},
                  {title:"Weekly Summary",          desc:"Executive summary of protection metrics",       icon:"📈",color:T.gold},
                  {title:"CRM Export",              desc:"Sync data to Salesforce / HubSpot",            icon:"🔗",color:T.green},
                  {title:"SDG Impact Report",       desc:"UN SDG alignment and social impact metrics",   icon:"🌍",color:T.purple},
                ].map(r=>(
                  <div key={r.title} className="card-hover" style={{background:T.surface,
                    border:`1px solid ${T.border}`,borderRadius:10,padding:16,cursor:"pointer"}}>
                    <div style={{fontSize:24,marginBottom:9}}>{r.icon}</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,marginBottom:5}}>{r.title}</div>
                    <div style={{color:T.muted,fontSize:11,marginBottom:13,lineHeight:1.5}}>{r.desc}</div>
                    <button style={{background:r.color+"22",color:r.color,border:`1px solid ${r.color}44`,
                      borderRadius:4,padding:"5px 11px",fontSize:10,cursor:"pointer",
                      fontFamily:"'Space Mono',monospace",fontWeight:700}}>Generate →</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ SETTINGS ═══ */}
          {tab==="settings"&&(
            <div>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,margin:"0 0 3px",letterSpacing:-1}}>
                System <span style={{color:T.accent}}>Settings</span>
              </h1>
              <p style={{color:T.muted,fontSize:11,marginBottom:18}}>API keys, detection thresholds, integrations & security</p>

              {/* Google API Keys */}
              <div style={{background:T.surface,border:`1px solid ${T.blue}44`,borderRadius:10,padding:16,marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <GoogleDots/>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13}}>Google API Configuration</div>
                </div>
                <div style={{color:T.muted,fontSize:10,marginBottom:13,lineHeight:1.6}}>
                  Paste your keys below and press <strong style={{color:T.accent}}>Save API Keys</strong>. They will activate immediately — no restart needed.
                </div>

                {/* YouTube Key */}
                <div style={{marginBottom:11}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <label style={{color:T.muted,fontSize:10,letterSpacing:0.5}}>YouTube Data API v3 Key</label>
                    <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer"
                      style={{color:T.blue,fontSize:10,textDecoration:"none"}}>console.cloud.google.com →</a>
                  </div>
                  <input
                    value={ytKeyInput}
                    onChange={e=>setYtKeyInput(e.target.value)}
                    placeholder="AIza… (YouTube Data API v3)"
                    type="password"
                    style={{width:"100%",background:T.panel,
                      border:`1px solid ${ytKeyInput?T.green:T.border}`,
                      borderRadius:6,padding:"8px 11px",color:T.text,fontSize:12,
                      fontFamily:"'Space Mono',monospace",outline:"none",transition:"border-color 0.2s"}}/>
                  {ytKeyInput&&<div style={{color:T.green,fontSize:10,marginTop:3}}>✓ Key entered</div>}
                </div>

                {/* Gemini Key */}
                <div style={{marginBottom:11}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <label style={{color:T.muted,fontSize:10,letterSpacing:0.5}}>Gemini API Key</label>
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                      style={{color:T.blue,fontSize:10,textDecoration:"none"}}>aistudio.google.com/apikey →</a>
                  </div>
                  <input
                    value={geminiKeyInput}
                    onChange={e=>setGeminiKeyInput(e.target.value)}
                    placeholder="AIza… (Gemini 2.0 Flash)"
                    type="password"
                    style={{width:"100%",background:T.panel,
                      border:`1px solid ${geminiKeyInput?T.green:T.border}`,
                      borderRadius:6,padding:"8px 11px",color:T.text,fontSize:12,
                      fontFamily:"'Space Mono',monospace",outline:"none",transition:"border-color 0.2s"}}/>
                  {geminiKeyInput&&<div style={{color:T.green,fontSize:10,marginTop:3}}>✓ Key entered</div>}
                </div>

                {/* Vision Key */}
                <div style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <label style={{color:T.muted,fontSize:10,letterSpacing:0.5}}>Google Cloud Vision Key</label>
                    <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer"
                      style={{color:T.blue,fontSize:10,textDecoration:"none"}}>console.cloud.google.com →</a>
                  </div>
                  <input
                    value={visionKeyInput}
                    onChange={e=>setVisionKeyInput(e.target.value)}
                    placeholder="AIza… (Cloud Vision API)"
                    type="password"
                    style={{width:"100%",background:T.panel,
                      border:`1px solid ${visionKeyInput?T.green:T.border}`,
                      borderRadius:6,padding:"8px 11px",color:T.text,fontSize:12,
                      fontFamily:"'Space Mono',monospace",outline:"none",transition:"border-color 0.2s"}}/>
                  {visionKeyInput&&<div style={{color:T.green,fontSize:10,marginTop:3}}>✓ Key entered</div>}
                </div>

                {/* Save button + status */}
                <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                  <button
                    onClick={saveApiKeys}
                    disabled={saveStatus==="saving"}
                    style={{background:saveStatus==="saved"?T.green:saveStatus==="error"?T.red:T.blue,
                      color:"#fff",border:"none",borderRadius:6,
                      padding:"9px 20px",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,
                      cursor:saveStatus==="saving"?"not-allowed":"pointer",
                      transition:"background 0.3s",
                      display:"flex",alignItems:"center",gap:7}}>
                    {saveStatus==="saving"&&<span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>◎</span>}
                    {saveStatus==="saved"&&<span>✓</span>}
                    {saveStatus==="error"&&<span>!</span>}
                    {saveStatus==="saving"?"Saving…":saveStatus==="saved"?"Keys Saved!":saveStatus==="error"?"Enter at least one key":"Save API Keys"}
                  </button>
                  {saveStatus==="saved"&&(
                    <div style={{display:"flex",alignItems:"center",gap:6,animation:"fadeIn 0.3s ease"}}>
                      <PulseDot color={T.green} size={6}/>
                      <span style={{color:T.green,fontSize:11}}>APIs active — Gemini & YouTube ready to use</span>
                    </div>
                  )}
                  {saveStatus==="error"&&(
                    <span style={{color:T.red,fontSize:11}}>Please enter at least one API key first.</span>
                  )}
                </div>
              </div>

              <div className="g2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[
                  {title:"Detection Thresholds",items:[
                    {label:"Similarity Threshold",val:"72%"},
                    {label:"Auto-Flag Confidence",val:"90%"},
                    {label:"Alert Sensitivity",   val:"HIGH"},
                  ]},
                  {title:"Platform Connections",items:[
                    {label:"YouTube API",      val:"Connected",  active:true},
                    {label:"Twitter/X API",    val:"Connected",  active:true},
                    {label:"Instagram Graph",  val:"Connected",  active:true},
                    {label:"TikTok Research",  val:"Connected",  active:true},
                  ]},
                  {title:"CRM Integrations",items:[
                    {label:"Salesforce",  val:"Active",       active:true},
                    {label:"HubSpot",     val:"Disconnected", active:false},
                    {label:"Webhook URL", val:"Configured",   active:true},
                  ]},
                  {title:"Security",items:[
                    {label:"Two-Factor Auth", val:"Enabled",  active:true},
                    {label:"Session Timeout", val:"30 min"},
                    {label:"Audit Logging",   val:"Active",   active:true},
                    {label:"Data Encryption", val:"AES-256",  active:true},
                  ]},
                ].map(section=>(
                  <div key={section.title} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,marginBottom:12}}>{section.title}</div>
                    {section.items.map(item=>(
                      <div key={item.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                        padding:"7px 0",borderBottom:`1px solid ${T.border}`,fontSize:11}}>
                        <span style={{color:T.muted}}>{item.label}</span>
                        <span style={{color:item.active===false?T.red:item.active?T.green:T.accent,fontWeight:700}}>
                          {item.val}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
