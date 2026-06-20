import React, { useState, useMemo } from "react";
import {
  LayoutDashboard, MessageSquare, Users, Calendar as CalendarIcon,
  Kanban, Megaphone, Zap, Search, Bell, Plus, TrendingUp,
  MoreHorizontal, ChevronRight, ArrowLeft, MoreVertical, X,
  Instagram, Facebook, Youtube, Clock, Mail, Phone,
  Edit3, CheckCircle, UserPlus, Trash2, Check, LogOut,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useGHLContacts } from "./useGHLContacts";
import { useGHLCalendar } from "./useGHLCalendar";
import { useGHLPipeline } from "./useGHLPipeline";

const INK = "#111110";
const RED = "#B91C1C";
const CREAM = "#F8F5F0";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inbox",     label: "Inbox",       icon: MessageSquare, badge: 3 },
  { id: "contacts",  label: "Contacts",    icon: Users },
  { id: "calendar",  label: "Calendar",    icon: CalendarIcon },
  { id: "pipeline",  label: "Pipeline",    icon: Kanban },
  { id: "social",    label: "Social Planner", icon: Megaphone },
  { id: "automations", label: "Automations", icon: Zap },
];
const PRIMARY = NAV.slice(0, 5);
const MORE     = NAV.slice(5);

const revenue = [
  { d:"Mon",v:1200},{d:"Tue",v:1900},{d:"Wed",v:1500},
  {d:"Thu",v:2400},{d:"Fri",v:2100},{d:"Sat",v:3200},{d:"Sun",v:2800},
];
const stats = [
  {label:"New Leads",    value:"42",    delta:"+12%"},
  {label:"Booked Sessions",value:"28",  delta:"+8%"},
  {label:"Active Members",value:"186",  delta:"+3%"},
  {label:"Revenue (wk)", value:"$15.1k",delta:"+18%"},
];
const messages = [
  {name:"Dean Romero",  text:"Can we move my session to Friday?", time:"2m",  unread:true},
  {name:"Lakisha Brown",text:"Just signed up — what's next?",     time:"18m", unread:true},
  {name:"Marcus Hill",  text:"Loved the workout plan 🔥",          time:"1h",  unread:true},
  {name:"Sara Kim",     text:"Thanks for the follow-up call!",     time:"3h",  unread:false},
  {name:"James Carter", text:"Is there a beginner class?",         time:"5h",  unread:false},
];

// Full contact roster — each has tag + status for bulk filtering
const ALL_CONTACTS = [
  {id:1, name:"Dean Romero",   tag:"Member", phone:"(951) 555-0142", status:"Active"},
  {id:2, name:"Lakisha Brown", tag:"Trial",  phone:"(951) 555-0188", status:"New"},
  {id:3, name:"Marcus Hill",   tag:"Member", phone:"(714) 555-0119", status:"Active"},
  {id:4, name:"Sara Kim",      tag:"Lead",   phone:"(657) 555-0173", status:"Warm"},
  {id:5, name:"James Carter",  tag:"Lead",   phone:"(951) 555-0204", status:"New"},
  {id:6, name:"Tasha Vaughn",  tag:"Member", phone:"(909) 555-0166", status:"Active"},
  {id:7, name:"Olivia Reed",   tag:"Lead",   phone:"(562) 555-0131", status:"New"},
  {id:8, name:"Tyler Boone",   tag:"Trial",  phone:"(714) 555-0177", status:"New"},
  {id:9, name:"Priya Nair",    tag:"Member", phone:"(951) 555-0199", status:"Active"},
  {id:10,name:"Carlos Ruiz",   tag:"Lead",   phone:"(657) 555-0144", status:"Warm"},
];

const pipeline = {
  "New Lead":        [{name:"James Carter",value:"$0"},{name:"Olivia Reed",value:"$0"}],
  "Consult Booked":  [{name:"Lakisha Brown",value:"$199"},{name:"Tyler Boone",value:"$199"}],
  "Trial Active":    [{name:"Sara Kim",value:"$49"}],
  "Closed — Member": [{name:"Dean Romero",value:"$249"},{name:"Marcus Hill",value:"$249"}],
};

const PLATFORMS = {Instagram:Instagram, Facebook:Facebook, YouTube:Youtube};
const socialPosts = [
  {day:"Mon",time:"8:00 AM", platform:"Instagram",status:"Scheduled",caption:"5 AM club check-in — who's in? 💪"},
  {day:"Tue",time:"12:00 PM",platform:"Facebook", status:"Scheduled",caption:"Member spotlight: Dean's 90-day transformation"},
  {day:"Wed",time:"6:00 PM", platform:"Instagram",status:"Draft",    caption:"3 mobility drills before you squat"},
  {day:"Thu",time:"9:00 AM", platform:"YouTube",  status:"Draft",    caption:"Full lower-body session (follow along)"},
  {day:"Fri",time:"5:00 PM", platform:"Instagram",status:"Scheduled",caption:"Weekend challenge: 100 reps, your pace"},
  {day:"Sat",time:"10:00 AM",platform:"Facebook", status:"Posted",   caption:"Open gym is live — drop in anytime today"},
];
const socialStat = [{label:"Scheduled",value:4},{label:"Drafts",value:2},{label:"Posted (wk)",value:7}];

const initAutomations = [
  {id:1,name:"Missed-Call Text-Back",trigger:"Missed call",      active:true, enrolledIds:[1,3,6,9],
   steps:[{type:"sms",delay:"Immediately",label:"Text message",
    content:"Hey {{first_name}}! Sorry we missed your call. We'd love to connect — reply here or grab a time: {{booking_link}}"}]},
  {id:2,name:"New Lead Nurture",     trigger:"Form submitted",   active:true, enrolledIds:[2,4,5,7,8,10],
   steps:[
    {type:"email",delay:"Immediately",     label:"Welcome email",   subject:"Welcome to Manifest Fitness, {{first_name}}!",
     content:"Hey {{first_name}},\n\nWe're fired up you reached out. Here's what happens next:\n\n1. Book your free consult below\n2. We'll map out your first 30 days\n3. You show up — we handle the rest.\n\n{{booking_link}}\n\nLet's get to work.\n— The Manifest Team"},
    {type:"sms", delay:"After 24 hours",  label:"Follow-up text",
     content:"Hey {{first_name}}, did you get a chance to book your consult? Spots fill fast: {{booking_link}}"},
    {type:"email",delay:"After 3 days",   label:"Value email",     subject:"What most people get wrong about training",
     content:"Hey {{first_name}},\n\nMost people start strong and fade by week three — not because of effort, but system.\n\nWe build the system for you.\n\n{{booking_link}}\n\n— The Manifest Team"},
  ]},
  {id:3,name:"Trial → Member",       trigger:"Trial started",    active:true, enrolledIds:[2,8],
   steps:[
    {type:"email",delay:"Day 3 of trial",label:"Check-in email", subject:"How's it going, {{first_name}}?",
     content:"Hey {{first_name}},\n\nThree days in — how are you feeling? Reply here if you need anything.\n\n— The Manifest Team"},
    {type:"sms", delay:"Day 6 of trial",label:"Membership offer",
     content:"Hey {{first_name}}, your trial ends soon! Lock in your member rate — reply YES and we'll set it up."},
  ]},
  {id:4,name:"Birthday Message",      trigger:"Contact birthday", active:true, enrolledIds:[1,3,9],
   steps:[{type:"sms",delay:"Day of birthday",label:"Birthday text",
    content:"Happy birthday {{first_name}}! 🎉 Come in for a free session on us this week — just show this text."}]},
  {id:5,name:"Win-Back (14-day)",     trigger:"No visit in 14 days",active:false,enrolledIds:[],
   steps:[
    {type:"sms", delay:"Day 14",label:"Check-in text",
     content:"Hey {{first_name}}, we haven't seen you in a bit — everything good? Come back this week."},
    {type:"email",delay:"Day 17",label:"Win-back email",subject:"We miss you, {{first_name}}",
     content:"Hey {{first_name}},\n\nLife gets busy — we get it. But consistency is where results live.\n\nCome back this week. Your spot's waiting.\n\n{{booking_link}}\n\n— The Manifest Team"},
  ]},
  {id:6,name:"Review Request",        trigger:"Session completed",active:false,enrolledIds:[],
   steps:[{type:"sms",delay:"2 hours after session",label:"Review request",
    content:"Hey {{first_name}}, great session today! A quick Google review means everything to us: {{review_link}} — The Manifest Team"}]},
];

const initials   = (n) => n.split(" ").map(x=>x[0]).join("");
const scColor    = (s) => ({Scheduled:RED,Draft:"#8a8a85",Posted:INK}[s]||"#8a8a85");
const stepIcon   = (t) => t==="email" ? Mail : Phone;
const stepColor  = (t) => t==="email" ? INK  : RED;
const tagColor   = (s) => ({Active:INK,New:RED,Warm:"#8a8a85"}[s]||"#8a8a85");

// ── Shell ────────────────────────────────────────────────────────────
export default function App({ onSignOut } = {}) {
  const [active,   setActive]   = useState("dashboard");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE.some(m=>m.id===active);
  const go = (id) => { setActive(id); setMoreOpen(false); };

  return (
    <div className="flex h-screen w-full flex-col font-sans text-[#111110] md:flex-row" style={{background:CREAM}}>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-col md:flex" style={{background:INK}}>
        <div className="flex items-center gap-2 px-6 py-6">
          <span className="block h-6 w-1.5 rounded-full" style={{background:RED}}/>
          <span className="text-[15px] font-extrabold uppercase tracking-[0.2em] text-white">Manifest</span>
        </div>
        <nav className="mt-2 flex-1 px-3">
          {NAV.map(item=>{
            const Icon=item.icon; const on=active===item.id;
            return(
              <button key={item.id} onClick={()=>go(item.id)}
                className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
                style={{background:on?"rgba(255,255,255,0.06)":"transparent",color:on?"#fff":"rgba(255,255,255,0.55)"}}>
                <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{background:on?RED:"transparent"}}><Icon size={16}/></span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge&&<span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{background:RED}}>{item.badge}</span>}
              </button>
            );
          })}
        </nav>
        <div className="m-3 rounded-xl p-4" style={{background:"rgba(255,255,255,0.04)"}}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white" style={{background:RED}}>JM</div>
            <div className="leading-tight"><p className="text-xs font-semibold text-white">Jay M.</p><p className="text-[11px] text-white/40">Owner</p></div>
            {onSignOut && (
              <button
                onClick={onSignOut}
                title="Sign out"
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-white/40 hover:bg-white/5 hover:text-white"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5" style={{background:INK}}>
          <div>
            <h1 className="text-base font-extrabold uppercase tracking-[0.15em] text-white md:text-lg">Manifest Fitness</h1>
            <p className="text-[10px] uppercase tracking-widest text-white/40">{NAV.find(n=>n.id===active)?.label}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg bg-white/5 px-3 py-2 sm:flex">
              <Search size={15} className="text-white/40"/>
              <input placeholder="Search…" className="w-32 bg-transparent text-sm text-white placeholder-white/30 outline-none md:w-40"/>
            </div>
            <button className="relative rounded-lg bg-white/5 p-2 text-white/60">
              <Bell size={17}/>
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full" style={{background:RED}}/>
            </button>
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{background:RED}}>
              <Plus size={16}/><span className="hidden sm:inline">New</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
          {active==="dashboard"   && <Dashboard/>}
          {active==="inbox"       && <Inbox/>}
          {active==="contacts"    && <Contacts/>}
          {active==="calendar"    && <CalendarView/>}
          {active==="pipeline"    && <Pipeline/>}
          {active==="social"      && <Social/>}
          {active==="automations" && <Automations/>}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-white/10 px-1 py-1.5 md:hidden" style={{background:INK}}>
        {PRIMARY.map(item=>{
          const Icon=item.icon; const on=active===item.id;
          return(
            <button key={item.id} onClick={()=>go(item.id)}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold"
              style={{color:on?"#fff":"rgba(255,255,255,0.45)"}}>
              <span className="relative">
                <Icon size={20} style={{color:on?RED:"inherit"}}/>
                {item.badge&&<span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white" style={{background:RED}}>{item.badge}</span>}
              </span>
              {item.label}
            </button>
          );
        })}
        <button onClick={()=>setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold"
          style={{color:moreActive?"#fff":"rgba(255,255,255,0.45)"}}>
          <MoreVertical size={20} style={{color:moreActive?RED:"inherit"}}/>More
        </button>
      </nav>

      {moreOpen&&(
        <div className="fixed inset-0 z-30 md:hidden" onClick={()=>setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40"/>
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-6" onClick={e=>e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold">More</p>
              <button onClick={()=>setMoreOpen(false)} className="rounded-md p-1 text-black/40"><X size={18}/></button>
            </div>
            {MORE.map(item=>{
              const Icon=item.icon; const on=active===item.id;
              return(
                <button key={item.id} onClick={()=>go(item.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold"
                  style={{background:on?CREAM:"transparent"}}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{background:on?RED:INK}}><Icon size={17}/></span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({children,className=""}){
  return <div className={`rounded-2xl border border-black/5 bg-white shadow-sm ${className}`}>{children}</div>;
}

// ── Dashboard ────────────────────────────────────────────────────────
function Dashboard(){
  return(
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {stats.map(s=>(
          <Card key={s.label} className="p-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-black/40">{s.label}</p>
            <p className="mt-1.5 text-xl font-extrabold tracking-tight md:text-2xl">{s.value}</p>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold" style={{color:RED}}><TrendingUp size={13}/>{s.delta}</p>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold">Revenue this week</h3>
            <span className="text-xs font-semibold text-black/40">$15,100</span>
          </div>
          <div className="h-48 md:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue} margin={{top:5,right:0,left:0,bottom:0}}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={RED} stopOpacity={0.25}/><stop offset="100%" stopColor={RED} stopOpacity={0}/>
                </linearGradient></defs>
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#9b9b96"}}/>
                <Tooltip cursor={{stroke:RED,strokeWidth:1}} contentStyle={{borderRadius:10,border:"none",boxShadow:"0 4px 16px rgba(0,0,0,.12)",fontSize:12}}/>
                <Area type="monotone" dataKey="v" stroke={RED} strokeWidth={2.5} fill="url(#g)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-bold">Today's schedule</h3>
          <div className="space-y-3">
            {[{t:"9:00",n:"Dean Romero",k:"1:1 Strength"},{t:"11:30",n:"Group HIIT",k:"6 booked"},{t:"2:00",n:"Lakisha Brown",k:"Consult"},{t:"5:30",n:"Evening Bootcamp",k:"12 booked"}].map((e,i)=>(
              <div key={i} className="flex items-center gap-3 border-b border-black/5 pb-3 last:border-0 last:pb-0">
                <span className="w-12 text-xs font-bold tabular-nums" style={{color:RED}}>{e.t}</span>
                <div className="leading-tight"><p className="text-sm font-semibold">{e.n}</p><p className="text-xs text-black/40">{e.k}</p></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Inbox ────────────────────────────────────────────────────────────
function Inbox(){
  const [sel,setSel]=useState(null);
  const List=(
    <Card className="p-0">
      {messages.map((m,i)=>(
        <button key={i} onClick={()=>setSel(i)}
          className="flex w-full items-start gap-3 border-b border-black/5 p-4 text-left last:border-0"
          style={{background:sel===i?CREAM:"transparent"}}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{background:INK}}>{initials(m.name)}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold">{m.name}</p><span className="shrink-0 text-[11px] text-black/30">{m.time}</span></div>
            <p className="truncate text-xs text-black/50">{m.text}</p>
          </div>
          {m.unread&&<span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{background:RED}}/>}
        </button>
      ))}
    </Card>
  );
  const Thread=sel!==null&&(
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-center gap-2 border-b border-black/5 pb-3">
        <button onClick={()=>setSel(null)} className="rounded-md p-1 text-black/50 md:hidden"><ArrowLeft size={18}/></button>
        <p className="flex-1 font-bold">{messages[sel].name}</p>
        <MoreHorizontal size={18} className="text-black/30"/>
      </div>
      <div className="flex-1 space-y-3 py-5">
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#F1EFEA] px-4 py-2.5 text-sm">{messages[sel].text}</div>
        <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white" style={{background:RED}}>Absolutely — let me check the calendar and get back to you.</div>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2">
        <input placeholder="Type a reply…" className="flex-1 bg-transparent text-sm outline-none"/>
        <button className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{background:INK}}>Send</button>
      </div>
    </Card>
  );
  return(
    <div className="mx-auto max-w-5xl">
      <div className="md:hidden">{sel===null?List:Thread}</div>
      <div className="hidden gap-4 md:grid md:grid-cols-[320px_1fr]">
        {List}
        {sel!==null?Thread:<Card className="flex items-center justify-center p-5 text-sm text-black/30">Select a conversation</Card>}
      </div>
    </div>
  );
}

// ── Contacts ─────────────────────────────────────────────────────────
function Contacts(){
  const { contacts, loading, error } = useGHLContacts();

  const rows = contacts.map(c => ({
    id: c.id,
    name: [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email || "Unnamed contact",
    phone: c.phone || "—",
    tag: (c.tags && c.tags.length) ? c.tags[0] : "Contact",
  }));

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="p-10 text-center text-sm text-black/40">Loading contacts from GHL…</Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="p-10 text-center text-sm text-red-600">Couldn't load contacts: {error}</Card>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="p-10 text-center text-sm text-black/40">No contacts found in GHL yet.</Card>
      </div>
    );
  }

  return(
    <div className="mx-auto max-w-5xl">
      <div className="space-y-3 md:hidden">
        {rows.map(c=>(
          <Card key={c.id} className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{background:INK}}>{initials(c.name)}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{c.name}</p><p className="text-xs text-black/40">{c.phone}</p></div>
            <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{background:"#8a8a85"}}>{c.tag}</span>
          </Card>
        ))}
      </div>
      <Card className="hidden p-0 md:block">
        <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-black/5 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-black/40">
          <span>Name</span><span>Phone</span><span>Tag</span>
        </div>
        {rows.map(c=>(
          <div key={c.id} className="grid grid-cols-[1.5fr_1fr_1fr] items-center border-b border-black/5 px-5 py-3.5 text-sm last:border-0 hover:bg-[#F8F5F0]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{background:INK}}>{initials(c.name)}</div>
              <span className="font-semibold">{c.name}</span>
            </div>
            <span className="tabular-nums text-black/50">{c.phone}</span>
            <span><span className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{background:"#8a8a85"}}>{c.tag}</span></span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function CalendarView(){
  const { events, loading, error } = useGHLCalendar();
  const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="p-10 text-center text-sm text-black/40">Loading calendar from GHL…</Card>
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="p-10 text-center text-sm text-red-600">Couldn't load calendar: {error}</Card>
      </div>
    );
  }

  const buckets = {0:[],1:[],2:[],3:[],4:[],5:[],6:[]};
  events.forEach(e=>{
    const start = new Date(e.startTime);
    const dayIndex = (start.getDay() + 6) % 7; // Sun=0..Sat=6  ->  Mon=0..Sun=6
    const time = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    buckets[dayIndex].push(`${time} ${e.title || "Appointment"}`);
  });

  return(
    <div className="mx-auto max-w-5xl">
      <Card className="overflow-x-auto p-5">
        <div className="grid min-w-[640px] grid-cols-7 gap-3">
          {days.map((d,i)=>(
            <div key={d}>
              <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-black/40">{d}</p>
              <div className="min-h-44 rounded-xl border border-black/5 p-2" style={{background:CREAM}}>
                {buckets[i].length===0 && <p className="px-1 py-2 text-center text-[11px] text-black/25">—</p>}
                {buckets[i].map((e,j)=>(
                  <div key={j} className="mb-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-white" style={{background:j%2?INK:RED}}>{e}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Pipeline(){
  const { stages, loading, error } = useGHLPipeline();

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card className="p-10 text-center text-sm text-black/40">Loading pipeline from GHL…</Card>
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card className="p-10 text-center text-sm text-red-600">Couldn't load pipeline: {error}</Card>
      </div>
    );
  }
  if (stages.length===0) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card className="p-10 text-center text-sm text-black/40">No pipeline found in GHL yet.</Card>
      </div>
    );
  }

  return(
    <div className="mx-auto max-w-6xl overflow-x-auto pb-2">
      <div className="grid gap-4" style={{gridTemplateColumns:`repeat(${stages.length}, minmax(220px, 1fr))`, minWidth: stages.length*220}}>
        {stages.map((stage)=>(
          <div key={stage.id}>
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-xs font-bold uppercase tracking-wider text-black/50">{stage.name}</p>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-bold text-black/50">{stage.opportunities.length}</span>
            </div>
            <div className="space-y-3">
              {stage.opportunities.length===0 && <p className="px-1 text-xs text-black/25">No opportunities</p>}
              {stage.opportunities.map((c)=>(
                <Card key={c.id} className="p-4">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <div className="mt-2 flex items-center justify-between"><span className="text-sm font-bold" style={{color:RED}}>{c.value}</span><ChevronRight size={15} className="text-black/30"/></div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Social(){
  return(
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {socialStat.map(s=>(<Card key={s.label} className="p-5"><p className="text-[11px] font-medium uppercase tracking-wider text-black/40">{s.label}</p><p className="mt-1.5 text-2xl font-extrabold">{s.value}</p></Card>))}
      </div>
      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-3">
          <h3 className="text-sm font-bold">This week's content</h3>
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{background:RED}}><Plus size={14}/>New post</button>
        </div>
        {socialPosts.map((p,i)=>{
          const Plat=PLATFORMS[p.platform];
          return(
            <div key={i} className="flex items-center gap-3 border-b border-black/5 px-5 py-4 last:border-0">
              <div className="flex w-10 shrink-0 flex-col items-center"><span className="text-[11px] font-bold uppercase text-black/40">{p.day}</span><span className="text-[10px] text-black/30">{p.time.replace(":00","")}</span></div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style={{background:INK}}>{Plat&&<Plat size={16}/>}</div>
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{p.caption}</p>
              <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{background:scColor(p.status)}}>{p.status}</span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ── Automations ──────────────────────────────────────────────────────
function Automations(){
  const [items,   setItems]   = useState(initAutomations);
  const [editing, setEditing] = useState(null);   // index → edit messages
  const [enrolling,setEnrolling]=useState(null);  // index → manage contacts

  const toggle = (i) => setItems(prev=>prev.map((a,idx)=>idx===i?{...a,active:!a.active}:a));

  const updateStep=(ai,si,field,val)=>
    setItems(prev=>prev.map((a,i)=>i!==ai?a:{...a,steps:a.steps.map((s,j)=>j!==si?s:{...s,[field]:val})}));

  const setEnrolledIds=(ai,ids)=>
    setItems(prev=>prev.map((a,i)=>i!==ai?a:{...a,enrolledIds:ids}));

  // ── Editor ──────────────────────────────────────────────────────
  if(editing!==null){
    const a=items[editing];
    return(
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={()=>setEditing(null)} className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-black/50">
            <ArrowLeft size={16}/>Back
          </button>
          <div className="flex-1"><h2 className="text-base font-extrabold">{a.name}</h2><p className="text-xs text-black/40">Trigger: {a.trigger}</p></div>
          <button onClick={()=>setEditing(null)} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{background:RED}}>
            <CheckCircle size={15}/>Save
          </button>
        </div>
        <div className="mb-5 rounded-xl border border-black/5 bg-white px-4 py-3 text-xs text-black/50">
          Use <span className="font-mono font-semibold text-black/70">{"{{first_name}}"}</span>, <span className="font-mono font-semibold text-black/70">{"{{booking_link}}"}</span>, or <span className="font-mono font-semibold text-black/70">{"{{review_link}}"}</span> to personalize.
        </div>
        <div className="space-y-4">
          {a.steps.map((step,si)=>{
            const Icon=stepIcon(step.type);
            return(
              <Card key={si} className="overflow-hidden p-0">
                <div className="flex items-center gap-3 border-b border-black/5 px-5 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{background:stepColor(step.type)}}><Icon size={15}/></span>
                  <div className="flex-1"><p className="text-sm font-bold">{step.label}</p><p className="flex items-center gap-1 text-[11px] text-black/40"><Clock size={11}/>{step.delay}</p></div>
                  <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold capitalize text-black/50">{step.type}</span>
                </div>
                <div className="space-y-3 p-5">
                  {step.type==="email"&&(
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-black/40">Subject line</label>
                      <input value={step.subject||""} onChange={e=>updateStep(editing,si,"subject",e.target.value)}
                        className="w-full rounded-xl border border-black/10 bg-[#F8F5F0] px-4 py-2.5 text-sm outline-none focus:border-black/30" placeholder="Email subject…"/>
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-black/40">{step.type==="email"?"Email body":"Message text"}</label>
                    <textarea value={step.content} onChange={e=>updateStep(editing,si,"content",e.target.value)}
                      rows={step.type==="email"?8:4}
                      className="w-full resize-none rounded-xl border border-black/10 bg-[#F8F5F0] px-4 py-2.5 text-sm leading-relaxed outline-none focus:border-black/30"/>
                    <p className="mt-1 text-right text-[11px] text-black/30">{step.content.length} chars</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <button onClick={()=>setEditing(null)} className="mt-6 w-full rounded-2xl py-3.5 text-sm font-bold text-white" style={{background:INK}}>Save automation</button>
      </div>
    );
  }

  // ── Enrollment manager ─────────────────────────────────────────
  if(enrolling!==null){
    return(
      <EnrollmentPanel
        automation={items[enrolling]}
        autoIndex={enrolling}
        onBack={()=>setEnrolling(null)}
        onSave={(ids)=>{setEnrolledIds(enrolling,ids);setEnrolling(null);}}
      />
    );
  }

  // ── List ────────────────────────────────────────────────────────
  return(
    <div className="mx-auto max-w-3xl space-y-3">
      {items.map((a,i)=>(
        <Card key={a.id} className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{background:a.active?RED:"#E8E5E0",color:a.active?"#fff":"#9b9b96"}}>
              <Zap size={18}/>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{a.name}</p>
              <p className="text-xs text-black/40">{a.steps.length} step{a.steps.length!==1?"s":""} · Trigger: {a.trigger}</p>
            </div>
            <button onClick={()=>setEditing(i)} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-black/60 hover:border-black/20 hover:text-black">
              <Edit3 size={13}/>Edit
            </button>
            <button onClick={()=>toggle(i)} className="relative h-6 w-11 shrink-0 rounded-full transition-colors" style={{background:a.active?RED:"#D6D3CE"}}>
              <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{left:a.active?"22px":"2px"}}/>
            </button>
          </div>

          {/* Enrolled strip */}
          <div className="mt-3 flex items-center justify-between rounded-xl px-4 py-2.5" style={{background:CREAM}}>
            <div className="flex items-center gap-2">
              {/* Avatar stack */}
              <div className="flex -space-x-2">
                {a.enrolledIds.slice(0,4).map(id=>{
                  const c=ALL_CONTACTS.find(x=>x.id===id);
                  if(!c) return null;
                  return(
                    <div key={id} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white" style={{background:INK}}>
                      {initials(c.name)}
                    </div>
                  );
                })}
                {a.enrolledIds.length>4&&(
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white" style={{background:"#8a8a85"}}>
                    +{a.enrolledIds.length-4}
                  </div>
                )}
              </div>
              <span className="text-xs text-black/50">
                {a.enrolledIds.length===0?"No contacts enrolled":`${a.enrolledIds.length} enrolled`}
              </span>
            </div>
            <button onClick={()=>setEnrolling(i)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{background:INK}}>
              <UserPlus size={13}/>Manage
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Enrollment Panel ─────────────────────────────────────────────────
function EnrollmentPanel({automation,onBack,onSave}){
  const [tab,       setTab]       = useState("add");       // "add" | "enrolled"
  const [search,    setSearch]    = useState("");
  const [tagFilter, setTagFilter] = useState("All");
  const [selected,  setSelected]  = useState(new Set(automation.enrolledIds));
  const [saved,     setSaved]     = useState(false);

  const tags = ["All","Member","Trial","Lead"];

  const visible = useMemo(()=>
    ALL_CONTACTS.filter(c=>{
      const matchTag = tagFilter==="All" || c.tag===tagFilter;
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      return matchTag && matchSearch;
    })
  ,[search,tagFilter]);

  const enrolled = ALL_CONTACTS.filter(c=>selected.has(c.id));

  const toggleContact=(id)=>{
    setSelected(prev=>{
      const next=new Set(prev);
      next.has(id)?next.delete(id):next.add(id);
      return next;
    });
  };

  const bulkSelect=()=>{
    setSelected(prev=>{
      const next=new Set(prev);
      const allVisible=visible.every(c=>next.has(c.id));
      if(allVisible) visible.forEach(c=>next.delete(c.id));
      else           visible.forEach(c=>next.add(c.id));
      return next;
    });
  };

  const handleSave=()=>{
    setSaved(true);
    setTimeout(()=>onSave([...selected]),600);
  };

  const allVisibleSelected = visible.length>0 && visible.every(c=>selected.has(c.id));

  return(
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-black/50">
          <ArrowLeft size={16}/>Back
        </button>
        <div className="flex-1">
          <h2 className="text-base font-extrabold">{automation.name}</h2>
          <p className="text-xs text-black/40">Manage who's enrolled in this automation</p>
        </div>
        <button onClick={handleSave}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
          style={{background:saved?"#16a34a":RED}}>
          {saved?<><Check size={15}/>Saved!</>:<><CheckCircle size={15}/>Save ({selected.size})</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex rounded-xl p-1" style={{background:"#E8E5E0"}}>
        {[["add","Add contacts"],["enrolled",`Enrolled (${enrolled.length})`]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            className="flex-1 rounded-lg py-2 text-sm font-semibold transition-colors"
            style={{background:tab===id?"white":"transparent",color:tab===id?INK:"#8a8a85",boxShadow:tab===id?"0 1px 4px rgba(0,0,0,.08)":"none"}}>
            {label}
          </button>
        ))}
      </div>

      {/* ADD tab */}
      {tab==="add"&&(
        <div className="space-y-3">
          {/* Search + filter */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5">
              <Search size={15} className="shrink-0 text-black/30"/>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search contacts…"
                className="flex-1 bg-transparent text-sm outline-none"/>
              {search&&<button onClick={()=>setSearch("")}><X size={14} className="text-black/30"/></button>}
            </div>
            <div className="flex gap-1.5">
              {tags.map(t=>(
                <button key={t} onClick={()=>setTagFilter(t)}
                  className="rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                  style={{background:tagFilter===t?INK:"white",color:tagFilter===t?"white":"#8a8a85",border:"1px solid",borderColor:tagFilter===t?INK:"#e5e2dd"}}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk select bar */}
          <div className="flex items-center justify-between rounded-xl border border-black/5 bg-white px-4 py-2.5">
            <span className="text-xs text-black/40">{visible.length} contact{visible.length!==1?"s":""} shown</span>
            <button onClick={bulkSelect}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{background:allVisibleSelected?RED:INK,color:"white"}}>
              {allVisibleSelected?<><X size={12}/>Deselect all</>:<><Check size={12}/>Select all</>}
            </button>
          </div>

          {/* Contact list */}
          <Card className="p-0">
            {visible.length===0&&(
              <p className="px-5 py-8 text-center text-sm text-black/30">No contacts match your filter</p>
            )}
            {visible.map(c=>{
              const on=selected.has(c.id);
              return(
                <button key={c.id} onClick={()=>toggleContact(c.id)}
                  className="flex w-full items-center gap-3 border-b border-black/5 px-5 py-3.5 text-left last:border-0 transition-colors"
                  style={{background:on?CREAM:"white"}}>
                  {/* Checkbox */}
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors"
                    style={{background:on?RED:"white",borderColor:on?RED:"#d1cec9"}}>
                    {on&&<Check size={12} color="white"/>}
                  </span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{background:INK}}>
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-black/40">{c.tag} · {c.phone}</p>
                  </div>
                  <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{background:tagColor(c.status)}}>{c.status}</span>
                </button>
              );
            })}
          </Card>
        </div>
      )}

      {/* ENROLLED tab */}
      {tab==="enrolled"&&(
        <Card className="p-0">
          {enrolled.length===0&&(
            <p className="px-5 py-10 text-center text-sm text-black/30">No contacts enrolled yet.<br/>Go to "Add contacts" to enroll some.</p>
          )}
          {enrolled.map(c=>(
            <div key={c.id} className="flex items-center gap-3 border-b border-black/5 px-5 py-3.5 last:border-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{background:INK}}>
                {initials(c.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-black/40">{c.tag} · {c.phone}</p>
              </div>
              <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{background:tagColor(c.status)}}>{c.status}</span>
              <button onClick={()=>toggleContact(c.id)} className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-black/30 hover:bg-red-50 hover:text-red-500">
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
        </Card>
      )}

      <button onClick={handleSave}
        className="mt-5 w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-colors"
        style={{background:saved?"#16a34a":INK}}>
        {saved?"Saved!":` Save — ${selected.size} contact${selected.size!==1?"s":""} enrolled`}
      </button>
    </div>
  );
}
