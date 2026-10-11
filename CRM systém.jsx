import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus, Search, LayoutGrid, List as ListIcon, Building2, MapPin,
  Banknote, X, Trash2, Pencil, Link as LinkIcon, Loader2, Layers,
  Warehouse, CalendarClock, Tag as TagIcon, Sparkles,
  Calendar, ChevronLeft, ChevronRight, UserCircle2, Phone, Mail, Share2, Copy,
  Contact as ContactIcon, Inbox, Table2, ArrowUp, ArrowDown, CalendarPlus, Clock,
  CheckSquare, Square, Download, Upload, Move, Send, MailOpen, Wand2, AlertTriangle,
} from "lucide-react";

const STAGES = [
  { id: "novy", label: "Nový kontakt", color: "#64748B" },
  { id: "rokovanie", label: "Rokovanie", color: "#3D5A73" },
  { id: "due", label: "Due diligence", color: "#B5622D" },
  { id: "ponuka", label: "Ponuka odoslaná", color: "#C08A3E" },
  { id: "uzavrete", label: "Uzavreté", color: "#4F7A5B" },
  { id: "zamietnute", label: "Zamietnuté", color: "#A6453A" },
];

const CATEGORIES = [
  { id: "pozemok", label: "Pozemok", icon: MapPin },
  { id: "budova", label: "Budova / Hala / Sklad", icon: Warehouse },
  { id: "projekt", label: "Developerský projekt", icon: Building2 },
  { id: "financovanie", label: "Financovanie", icon: Banknote },
  { id: "dopyt", label: "Dopyt", icon: Inbox },
];

const DOPYT_SUBTYPES = [
  { id: "hladapozemok", label: "Hľadá pozemok" },
  { id: "hladabudovu", label: "Hľadá budovu / halu / sklad" },
  { id: "hladaprojekt", label: "Hľadá developerský projekt / kúpu" },
  { id: "hladafinancovanie", label: "Hľadá financovanie" },
  { id: "ine", label: "Iné" },
];

const LAND_SUBTYPES = [
  { id: "developersky", label: "Developerský projekt (byty)" },
  { id: "vacsie_uzemie", label: "Väčšie územie pre developerský projekt (land bank, etapy)" },
  { id: "komercny", label: "Komerčné (obchody, kancelárie)" },
  { id: "priemyselny", label: "Priemyselné / logistické" },
  { id: "obcianska", label: "Občianska vybavenosť" },
  { id: "zmiesane", label: "Zmiešané využitie" },
  { id: "polnohospodarsky", label: "Poľnohospodárska pôda" },
  { id: "rekreacny", label: "Rekreačné / turistické" },
  { id: "ostatny", label: "Ostatné / nezaradené" },
];

const FINANCING_TYPES = [
  { id: "banka", label: "Banka" },
  { id: "nebankova", label: "Nebanková spoločnosť" },
  { id: "equity", label: "Investor / Equity partner" },
  { id: "mezanine", label: "Mezanínové financovanie" },
  { id: "sukromny", label: "Súkromný investor" },
];

const LAND_USE_STATUSES = [
  { id: "v_sulade", label: "V súlade s ÚP", color: "#4F7A5B" },
  { id: "vyzaduje_zmenu", label: "Vyžaduje zmenu ÚP", color: "#A6453A" },
  { id: "prebieha_zmena", label: "Prebieha zmena ÚP", color: "#C08A3E" },
  { id: "nezistene", label: "Nezistené", color: "#7C8B95" },
];

const PRIORITIES = [
  { id: "vysoka", label: "Vysoká priorita", color: "#A6453A" },
  { id: "stredna", label: "Stredná priorita", color: "#C08A3E" },
  { id: "nizka", label: "Nízka priorita", color: "#7C8B95" },
];

const COMPANY_TYPES = [
  { id: "developer", label: "Developer" },
  { id: "banka", label: "Banka" },
  { id: "nebankova_financna", label: "Nebanková finančná spoločnosť" },
  { id: "equity_partner", label: "Equity partner" },
  { id: "konkurencia", label: "Konkurencia" },
  { id: "sprostredkovatel", label: "Sprostredkovateľ" },
  { id: "ine", label: "Iné" },
];

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const gridStart = new Date(year, month, 1 - startOffset);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}
const WEEKDAY_LABELS = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];

function CalendarView({ offers, events, comms, contacts, companies, onOpenOffer, onAddEvent, onOpenEvent, onDeleteEvent, onMoveEvent, onOpenComm }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState(null);
  const [movingEventId, setMovingEventId] = useState(null);
  const [expandedEventId, setExpandedEventId] = useState(null);

  const offersByDay = useMemo(() => {
    const map = {};
    offers.forEach((o) => {
      if (!o.followUpDate) return;
      if (!map[o.followUpDate]) map[o.followUpDate] = [];
      map[o.followUpDate].push(o);
    });
    return map;
  }, [offers]);

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      if (!e.date) return;
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const commsByDay = useMemo(() => {
    const map = {};
    comms.forEach((c) => {
      if (!c.replyByDate) return;
      if (!map[c.replyByDate]) map[c.replyByDate] = [];
      map[c.replyByDate].push(c);
    });
    return map;
  }, [comms]);

  const days = buildMonthGrid(cursor.getFullYear(), cursor.getMonth());
  const todayKey = dateKey(today);
  const monthLabel = cursor.toLocaleDateString("sk-SK", { month: "long", year: "numeric" });
  const selectedOffers = selectedKey ? (offersByDay[selectedKey] || []) : [];
  const selectedEvents = selectedKey ? (eventsByDay[selectedKey] || []).sort((a, b) => (a.time || "").localeCompare(b.time || "")) : [];
  const selectedComms = selectedKey ? (commsByDay[selectedKey] || []) : [];

  return (
    <section className="calendar-view">
      <div className="calendar-head">
        <button className="icon-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Predchádzajúci mesiac"><ChevronLeft size={18} /></button>
        <h3>{monthLabel}</h3>
        <button className="icon-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Nasledujúci mesiac"><ChevronRight size={18} /></button>
      </div>
      <div className="calendar-grid calendar-weekdays">
        {WEEKDAY_LABELS.map((w) => <div key={w} className="calendar-weekday">{w}</div>)}
      </div>
      <div className="calendar-grid">
        {days.map((d) => {
          const key = dateKey(d);
          const inMonth = d.getMonth() === cursor.getMonth();
          const dayOffers = offersByDay[key] || [];
          const dayEvents = eventsByDay[key] || [];
          const dayComms = commsByDay[key] || [];
          const dayCount = dayOffers.length + dayEvents.length + dayComms.length;
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          return (
            <button
              key={key}
              className={`calendar-day${inMonth ? "" : " calendar-day-out"}${isToday ? " calendar-day-today" : ""}${isSelected ? " calendar-day-selected" : ""}`}
              onClick={() => setSelectedKey(isSelected ? null : key)}
            >
              <span className="calendar-day-num">{d.getDate()}</span>
              {dayCount > 0 && <span className="calendar-day-dot">{dayCount}</span>}
            </button>
          );
        })}
      </div>

      <div className="panel calendar-list-panel">
        <div className="calendar-list-head">
          <h3>{selectedKey ? `${new Date(selectedKey).toLocaleDateString("sk-SK")}` : "Klikni na deň"}</h3>
          {selectedKey && (
            <button className="btn btn-ghost btn-add-event" onClick={() => onAddEvent(selectedKey)}>
              <CalendarPlus size={14} /> Pridať udalosť
            </button>
          )}
        </div>
        {selectedKey && selectedOffers.length === 0 && selectedEvents.length === 0 && selectedComms.length === 0 && <p className="muted">V tento deň nie sú žiadne termíny, udalosti ani odpovede.</p>}

        {selectedEvents.length > 0 && (
          <ul className="recent-list">
            {selectedEvents.map((e) => {
              const contact = contacts.find((k) => k.id === e.contactId);
              const company = companies.find((c) => c.id === e.companyId);
              const offer = offers.find((o) => o.id === e.offerId);
              const tm = eventTypeMeta(e.type);
              const isMoving = movingEventId === e.id;
              const isOpen = expandedEventId === e.id;
              return (
                <li key={e.id} className={`event-item${isOpen ? " event-item-open" : ""}`}>
                  <div className="clickable event-item-row" onClick={() => !isMoving && setExpandedEventId(isOpen ? null : e.id)}>
                    <span className="dot" style={{ background: tm.color }} />
                    {e.time && <span className="event-time"><Clock size={11} /> {formatEventTime(e)}</span>}
                    <span className="recent-title">{e.title || tm.label}</span>
                    <span className="recent-meta">
                      {tm.label}{e.location ? ` · ${e.location}` : ""}
                      {company ? ` · ${company.name}` : ""}
                      {contact ? ` · ${contact.name}` : ""}
                      {offer ? ` · ${offer.title}` : ""}
                    </span>
                    {isMoving ? (
                      <input
                        type="date"
                        autoFocus
                        className="event-move-input"
                        defaultValue={e.date}
                        onClick={(ev) => ev.stopPropagation()}
                        onChange={(ev) => { const v = ev.target.value; if (v) { onMoveEvent(e.id, v); setMovingEventId(null); } }}
                        onBlur={() => setMovingEventId(null)}
                      />
                    ) : (
                      <button className="icon-btn event-move" onClick={(ev) => { ev.stopPropagation(); setMovingEventId(e.id); }} aria-label="Presunúť na iný deň"><Move size={13} /></button>
                    )}
                    <button className="icon-btn event-delete" onClick={(ev) => { ev.stopPropagation(); onDeleteEvent(e); }} aria-label="Vymazať"><Trash2 size={13} /></button>
                  </div>
                  {isOpen && (
                    <div className="event-detail-expand">
                      <p><strong>Typ:</strong> {tm.label}</p>
                      <p><strong>Dátum:</strong> {new Date(e.date).toLocaleDateString("sk-SK")}{e.time ? ` · ${formatEventTime(e)}` : ""}</p>
                      {e.location && <p><strong>Miesto:</strong> {e.location}</p>}
                      {company && <p><strong>Firma:</strong> {company.name}</p>}
                      {contact && <p><strong>Kontakt:</strong> {contact.name}</p>}
                      {offer && <p><strong>Ponuka:</strong> {offer.title}</p>}
                      {e.notes && <p><strong>Poznámky:</strong> {e.notes}</p>}
                      <button className="btn btn-primary btn-edit-detail" onClick={() => onOpenEvent(e)}><Pencil size={13} /> Upraviť</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {selectedOffers.length > 0 && (
          <ul className="recent-list">
            {selectedOffers.map((o) => {
              const contact = contacts.find((k) => k.id === o.contactId);
              const company = companies.find((c) => c.id === o.companyId);
              return (
                <li key={o.id} className="clickable" onClick={() => onOpenOffer(o)}>
                  <span className="dot" style={{ background: stageMeta(o.stage).color }} />
                  <span className="recent-title">{o.title || "Bez názvu"}</span>
                  <span className="recent-meta">
                    {catMeta(o.category).label}{o.location ? ` · ${o.location}` : ""}
                    {company ? ` · ${company.name}` : ""}
                    {contact ? ` · ${contact.name}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {selectedComms.length > 0 && (
          <ul className="recent-list">
            {selectedComms.map((c) => {
              const contact = contacts.find((k) => k.id === c.contactId);
              const company = companies.find((x) => x.id === c.companyId);
              const st = commStatusMeta(c.status);
              return (
                <li key={c.id} className="clickable" onClick={() => onOpenComm(c)}>
                  <span className="dot" style={{ background: st.color }} />
                  <span className="recent-title">{c.subject || "Bez predmetu"}</span>
                  <span className="recent-meta">
                    Odpovedať · {st.label}{company ? ` · ${company.name}` : ""}{contact ? ` · ${contact.name}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
const stageMeta = (id) => STAGES.find((s) => s.id === id) || STAGES[0];
const catMeta = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
const subTypeLabel = (offer) => {
  if (offer.category === "pozemok") return LAND_SUBTYPES.find((s) => s.id === offer.subType)?.label;
  if (offer.category === "financovanie") return FINANCING_TYPES.find((s) => s.id === offer.subType)?.label;
  if (offer.category === "dopyt") return DOPYT_SUBTYPES.find((s) => s.id === offer.subType)?.label;
  return null;
};
const priorityMeta = (id) => PRIORITIES.find((p) => p.id === id);
const landUseMeta = (id) => LAND_USE_STATUSES.find((s) => s.id === id);
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function parseNum(str) {
  if (!str) return null;
  const digits = String(str).replace(/[^\d.,]/g, "").replace(/[.,]/g, "");
  if (!digits) return null;
  const n = parseFloat(digits);
  return isNaN(n) ? null : n;
}
function pricePerM2(offer) {
  if (!["pozemok", "budova"].includes(offer.category)) return null;
  const p = parseNum(offer.price);
  const a = parseNum(offer.area);
  if (!p || !a) return null;
  const val = Math.round(p / a);
  if (!isFinite(val) || val <= 0) return null;
  return `${val.toLocaleString("sk-SK")} €/m²`;
}
function isDueSoon(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const in3days = new Date();
  in3days.setDate(in3days.getDate() + 3);
  in3days.setHours(23, 59, 59, 999);
  return d <= in3days;
}
function isOverdue(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}
function matchByName(name, list) {
  if (!name) return null;
  const n = String(name).trim().toLowerCase();
  if (!n) return null;
  return list.find((item) => (item.name || "").trim().toLowerCase() === n)
    || list.find((item) => {
      const itemName = (item.name || "").trim().toLowerCase();
      return itemName && (itemName.includes(n) || n.includes(itemName));
    })
    || null;
}

function findDuplicate(list, data) {
  const phone = (data.phone || "").trim();
  const email = (data.email || "").trim().toLowerCase();
  if (!phone && !email) return null;
  return list.find((item) => item.id !== data.id && (
    (phone && (item.phone || "").trim() === phone) ||
    (email && (item.email || "").trim().toLowerCase() === email)
  )) || null;
}

function parseTags(str) {
  return String(str || "").split(",").map((t) => t.trim()).filter(Boolean);
}

const DEMO_TAG = "ukážka";

const DEMO_TIMEFRAMES = [
  { id: "2w", label: "Posledné 2 týždne", days: 14 },
  { id: "1m", label: "Posledný mesiac", days: 30 },
  { id: "3m", label: "Posledné 3 mesiace", days: 90 },
  { id: "1y", label: "Posledný rok", days: 365 },
];

function randomPastISO(maxDaysBack) {
  const offset = Math.floor(Math.random() * (maxDaysBack + 1));
  const d = new Date();
  d.setDate(d.getDate() - offset);
  d.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}
function randomFollowUpDateStr(minDaysOffset, maxDaysOffset) {
  const offset = minDaysOffset + Math.floor(Math.random() * (maxDaysOffset - minDaysOffset + 1));
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return dateKey(d);
}

const DEMO_COMPANY_SEEDS = {
  developer: { name: "Ukážka Development s.r.o.", contactPerson: "Ján Vzor" },
  banka: { name: "Ukážka Banka a.s.", contactPerson: "Eva Vzorová" },
  nebankova_financna: { name: "Ukážka Kapitál, nebanková s.r.o.", contactPerson: "Peter Vzor" },
  equity_partner: { name: "Ukážka Equity Partners", contactPerson: "Michal Vzor" },
  konkurencia: { name: "Konkurent Reality s.r.o.", contactPerson: "—" },
  sprostredkovatel: { name: "Ukážka Reality Maklér", contactPerson: "Zuzana Vzorová" },
  ine: { name: "Ukážka Partner s.r.o.", contactPerson: "Tomáš Vzor" },
};

function makeDemoCompanies() {
  return COMPANY_TYPES.map((t) => {
    const seed = DEMO_COMPANY_SEEDS[t.id];
    return {
      id: uid(),
      name: seed.name,
      type: t.id,
      contactPerson: seed.contactPerson,
      phone: "+421 900 000 000",
      email: "kontakt@ukazka.sk",
      website: "",
      notes: "Ukážkový záznam — voľne uprav alebo vymaž.",
      isDemo: true,
      dateAdded: new Date().toISOString(),
    };
  });
}

function makeDemoOffers(demoCompanies, timeframeDays) {
  const byType = Object.fromEntries(demoCompanies.map((c) => [c.type, c.id]));
  const base = {
    followUpDate: "",
    tags: [DEMO_TAG],
    source: "Ukážkový zdroj",
    contactName: "Ján Vzor",
    contactInfo: "0900 000 000",
    link: "",
    notes: "Ukážková poznámka — voľne uprav alebo vymaž.",
  };

  const land = [
    { subType: "developersky", title: "Pozemok Košice - Ťahanovce, 3 800 m²", location: "Košice - Ťahanovce", price: "780 000 €", area: "3 800 m²", landUsePlan: "v_sulade" },
    { subType: "vacsie_uzemie", title: "Rozsiahle územie Košice - Barca, 4,2 ha (viac etáp)", location: "Košice - Barca", price: "6 200 000 €", area: "42 000 m²", landUsePlan: "prebieha_zmena" },
    { subType: "komercny", title: "Pozemok pri OC, Košice - Nad jazerom", location: "Košice - Nad jazerom", price: "1 450 000 €", area: "5 200 m²", landUsePlan: "v_sulade" },
    { subType: "priemyselny", title: "Priemyselný areál Košice - Šaca", location: "Košice - Šaca", price: "2 100 000 €", area: "11 000 m²", landUsePlan: "vyzaduje_zmenu" },
    { subType: "obcianska", title: "Pozemok pre občiansku vybavenosť, Košice - Sever", location: "Košice - Sever", price: "620 000 €", area: "2 900 m²", landUsePlan: "nezistene" },
    { subType: "zmiesane", title: "Zmiešaná zóna Košice - Furča", location: "Košice - Furča", price: "980 000 €", area: "4 100 m²", landUsePlan: "prebieha_zmena" },
    { subType: "polnohospodarsky", title: "Poľnohospodárska pôda Košice - Krásna", location: "Košice - Krásna", price: "310 000 €", area: "18 500 m²", landUsePlan: "vyzaduje_zmenu" },
    { subType: "rekreacny", title: "Rekreačný pozemok Košice - Alpinka", location: "Košice - Alpinka", price: "245 000 €", area: "6 000 m²", landUsePlan: "nezistene" },
    { subType: "ostatny", title: "Nezaradený pozemok, okolie Košíc", location: "okolie Košíc", price: "150 000 €", area: "3 000 m²", landUsePlan: "nezistene" },
  ].map((e, i) => ({
    ...base, id: uid(), category: "pozemok", subType: e.subType, landUsePlan: e.landUsePlan,
    title: e.title, location: e.location, price: e.price, area: e.area,
    stage: STAGES[i % STAGES.length].id, priority: PRIORITIES[i % PRIORITIES.length].id,
    companyId: (e.subType === "developersky" || e.subType === "vacsie_uzemie") ? (byType["developer"] || "") : "",
    description: "Ukážkový popis — sem sa dá skopírovať text z inzerátu.",
    followUpDate: i % 3 === 0 ? randomFollowUpDateStr(-10, -1) : i % 3 === 1 ? randomFollowUpDateStr(0, 3) : randomFollowUpDateStr(5, 20),
    dateAdded: randomPastISO(timeframeDays),
  }));

  const buildingAndProject = [
    { category: "budova", title: "Skladová hala Košice - Barca, 2 400 m²", location: "Košice - Barca", price: "1 250 000 €", area: "2 400 m²", stage: "rokovanie", priority: "stredna" },
    { category: "projekt", title: "Developerský projekt „Rezidencia Ťahanovce“, 120 bytov", location: "Košice - Ťahanovce", price: "18 000 000 €", area: "", stage: "due", priority: "vysoka" },
  ].map((e) => ({
    ...base, id: uid(), category: e.category, subType: "", landUsePlan: "",
    title: e.title, location: e.location, price: e.price, area: e.area,
    stage: e.stage, priority: e.priority, companyId: byType["developer"] || "",
    description: "Ukážkový popis — sem sa dá skopírovať text z inzerátu.",
    followUpDate: randomFollowUpDateStr(1, 10),
    dateAdded: randomPastISO(timeframeDays),
  }));

  const financing = [
    { subType: "banka", title: "Úverové financovanie výstavby - Ukážka Banka", price: "60 % LTV, do 15 000 000 €", companyType: "banka" },
    { subType: "nebankova", title: "Preklenovacie financovanie - nebanková spoločnosť", price: "od 500 000 €, 12 % p.a.", companyType: "nebankova_financna" },
    { subType: "equity", title: "Equity investícia do developerského projektu", price: "kapitálový vstup 30–50 %", companyType: "equity_partner" },
    { subType: "mezanine", title: "Mezanínové financovanie doplnkového kapitálu", price: "do 20 % z rozpočtu projektu", companyType: "equity_partner" },
    { subType: "sukromny", title: "Súkromný investor - krátkodobý kapitál", price: "1 000 000 €, splatnosť 18 mes.", companyType: "ine" },
  ].map((e, i) => ({
    ...base, id: uid(), category: "financovanie", subType: e.subType, landUsePlan: "",
    title: e.title, location: "", price: e.price, area: "",
    stage: STAGES[(i + 2) % STAGES.length].id, priority: PRIORITIES[i % PRIORITIES.length].id,
    companyId: byType[e.companyType] || "",
    description: "Ukážkový popis ponuky financovania.",
    followUpDate: i % 2 === 0 ? randomFollowUpDateStr(-5, 2) : "",
    dateAdded: randomPastISO(timeframeDays),
  }));

  const inquiries = [
    { subType: "hladapozemok", title: "Dopyt: hľadá pozemok na rezidenčný projekt do 5 000 m², Košice", location: "Košice (okolie)" },
    { subType: "hladafinancovanie", title: "Dopyt: hľadá financovanie pre menší developerský projekt (15 bytov)", location: "" },
  ].map((e, i) => ({
    ...base, id: uid(), category: "dopyt", subType: e.subType, landUsePlan: "",
    title: e.title, location: e.location, price: "", area: "",
    stage: STAGES[i % STAGES.length].id, priority: PRIORITIES[(i + 1) % PRIORITIES.length].id,
    companyId: "",
    description: "Ukážkový popis dopytu — čo presne klient hľadá a za akých podmienok.",
    followUpDate: randomFollowUpDateStr(0, 7),
    dateAdded: randomPastISO(timeframeDays),
  }));

  return [...land, ...buildingAndProject, ...financing, ...inquiries];
}

const emptyOffer = {
  category: "pozemok",
  subType: "developersky",
  landUsePlan: "",
  title: "",
  location: "",
  price: "",
  area: "",
  stage: "novy",
  priority: "stredna",
  followUpDate: "",
  tags: [],
  source: "",
  contactName: "",
  contactInfo: "",
  companyId: "",
  contactId: "",
  sharedWith: [],
  link: "",
  description: "",
  notes: "",
};

const emptyCompany = {
  name: "",
  type: "developer",
  contactPerson: "",
  phone: "",
  email: "",
  website: "",
  notes: "",
};

const emptyUser = { name: "", phone: "", email: "" };

const CONTACT_CATEGORIES = [
  { id: "developer", label: "Developer", color: "#3D5A73" },
  { id: "developersky_projekt", label: "Developerský projekt", color: "#5B7FA6" },
  { id: "financovanie", label: "Financovanie", color: "#4F7A5B" },
  { id: "sprostredkovatel", label: "Sprostredkovateľ", color: "#C08A3E" },
  { id: "konkurencia", label: "Konkurencia", color: "#A6453A" },
  { id: "ine", label: "Iné", color: "#7C8B95" },
];
const contactCategoryMeta = (id) => CONTACT_CATEGORIES.find((c) => c.id === id) || CONTACT_CATEGORIES[CONTACT_CATEGORIES.length - 1];

const emptyContact = { name: "", role: "", category: "ine", phone: "", email: "", companyId: "", notes: "" };

const EVENT_TYPES = [
  { id: "stretnutie", label: "Stretnutie", color: "#3D5A73" },
  { id: "hovor", label: "Telefonát", color: "#4F7A5B" },
  { id: "obhliadka", label: "Obhliadka", color: "#B5622D" },
  { id: "termin", label: "Termín / deadline", color: "#A6453A" },
  { id: "pripomienka", label: "Pripomienka — osloviť znova", color: "#C08A3E" },
  { id: "ine", label: "Iné", color: "#7C8B95" },
];
const eventTypeMeta = (id) => EVENT_TYPES.find((t) => t.id === id) || EVENT_TYPES[0];
function formatEventTime(e) {
  if (e.time && e.endTime) return `${e.time}–${e.endTime}`;
  return e.time || "";
}

const COMM_DIRECTIONS = [
  { id: "odoslane", label: "Odoslané (ja → im)" },
  { id: "prijate", label: "Prijaté (oni → mne)" },
];
const commDirectionMeta = (id) => COMM_DIRECTIONS.find((d) => d.id === id) || COMM_DIRECTIONS[0];

const COMM_CHANNELS = [
  { id: "email", label: "Email" },
  { id: "telefon", label: "Telefonicky" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "sms", label: "SMS" },
  { id: "facebook", label: "Facebook / Messenger" },
  { id: "osobne", label: "Osobne" },
  { id: "ine", label: "Iné" },
];
const commChannelMeta = (id) => COMM_CHANNELS.find((c) => c.id === id) || COMM_CHANNELS[0];

const COMM_STATUSES = [
  { id: "caka_na_mna", label: "Čaká sa na moju odpoveď", color: "#A6453A" },
  { id: "caka_na_nich", label: "Čaká sa na ich odpoveď", color: "#C08A3E" },
  { id: "vybavene", label: "Vybavené", color: "#4F7A5B" },
];
const commStatusMeta = (id) => COMM_STATUSES.find((s) => s.id === id) || COMM_STATUSES[0];

const emptyComm = {
  date: "", subject: "", direction: "odoslane", channel: "email", status: "caka_na_nich",
  replyByDate: "", summary: "", tags: [], companyId: "", contactId: "", offerId: "", notes: "",
};

const emptyEvent = {
  title: "", date: "", time: "", endTime: "", type: "stretnutie",
  offerId: "", companyId: "", contactId: "", location: "", notes: "",
};

function CornerMarks() {
  return (
    <>
      <span className="corner-mark corner-tl" />
      <span className="corner-mark corner-br" />
    </>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Zavrieť"><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function IdentityGate({ initial, onSave, onCancel }) {
  const [data, setData] = useState(initial || emptyUser);
  const set = (k) => (e) => setData({ ...data, [k]: e.target.value });
  return (
    <div className="identity-overlay">
      <div className="identity-card">
        <div className="identity-icon"><UserCircle2 size={30} strokeWidth={1.4} /></div>
        <h2>Kto pracuje s CRM?</h2>
        <p className="muted">Nepovinné — pomôže to sledovať, kto pridal ktorú ponuku, ak s CRM pracuje viac ľudí. Údaje ostávajú len na tomto zariadení. Môžeš to pokojne preskočiť.</p>
        <div className="form-grid">
          <Field label="Meno a priezvisko">
            <input value={data.name} onChange={set("name")} autoFocus />
          </Field>
          <Field label="Telefón">
            <input value={data.phone} onChange={set("phone")} placeholder="+421…" />
          </Field>
          <Field label="Email">
            <input type="email" value={data.email} onChange={set("email")} placeholder="meno@firma.sk" />
          </Field>
          <div className="modal-actions">
            {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Zrušiť</button>}
            <button type="button" className="btn btn-primary" onClick={() => onSave(data)}>Uložiť</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [events, setEvents] = useState([]);
  const [comms, setComms] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [tab, setTab] = useState("prehlad");
  const [viewMode, setViewMode] = useState("list");
  const [tableSort, setTableSort] = useState({ key: "dateAdded", dir: "desc" });
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedOfferIds, setSelectedOfferIds] = useState([]);
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [offerDetail, setOfferDetail] = useState(null);
  const [restorePending, setRestorePending] = useState(null);
  const [restoreError, setRestoreError] = useState("");
  const fileInputRef = useRef(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSubType, setFilterSubType] = useState("all");
  const [filterLandUse, setFilterLandUse] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterTags, setFilterTags] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [filterContactCategory, setFilterContactCategory] = useState("all");
  const [contactViewMode, setContactViewMode] = useState("cards");
  const [contactSort, setContactSort] = useState({ key: "name", dir: "asc" });
  const [offerModal, setOfferModal] = useState(null);
  const [companyModal, setCompanyModal] = useState(null);
  const [contactModal, setContactModal] = useState(null);
  const [eventModal, setEventModal] = useState(null);
  const [commModal, setCommModal] = useState(null);
  const [filterCommStatus, setFilterCommStatus] = useState("all");
  const [filterCommTags, setFilterCommTags] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [toast, setToast] = useState("");
  const [demoTimeframe, setDemoTimeframe] = useState("1m");
  const [currentUser, setCurrentUser] = useState(null);
  const [showIdentityEdit, setShowIdentityEdit] = useState(false);
  const [exportCompany, setExportCompany] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        let o = [];
        let c = [];
        try {
          const r = await window.storage.get("offers", true);
          if (r?.value) o = JSON.parse(r.value);
        } catch {}
        try {
          const r = await window.storage.get("companies", true);
          if (r?.value) c = JSON.parse(r.value);
        } catch {}
        let k = [];
        try {
          const r = await window.storage.get("contacts", true);
          if (r?.value) k = JSON.parse(r.value);
        } catch {}
        setContacts(k);
        let ev = [];
        try {
          const r = await window.storage.get("events", true);
          if (r?.value) ev = JSON.parse(r.value);
        } catch {}
        setEvents(ev);
        let cm = [];
        try {
          const r = await window.storage.get("comms", true);
          if (r?.value) cm = JSON.parse(r.value);
        } catch {}
        setComms(cm);
        let dl = [];
        try {
          const r = await window.storage.get("dailyLogs", true);
          if (r?.value) dl = JSON.parse(r.value);
        } catch {}
        setDailyLogs(dl);
        try {
          const r = await window.storage.get("currentUser", false);
          setCurrentUser(r?.value ? JSON.parse(r.value) : { ...emptyUser });
        } catch {
          setCurrentUser({ ...emptyUser });
        }
        setOffers(o);
        setCompanies(c);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function persist(key, value) {
    try {
      const res = await window.storage.set(key, JSON.stringify(value), true);
      if (!res) setSaveError("Uloženie zlyhalo, skús to znova.");
      else setSaveError("");
    } catch {
      setSaveError("Uloženie zlyhalo, skús to znova.");
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function saveOffers(next) { setOffers(next); persist("offers", next); }
  function saveCompanies(next) { setCompanies(next); persist("companies", next); }
  function saveContacts(next) { setContacts(next); persist("contacts", next); }
  function saveEvents(next) { setEvents(next); persist("events", next); }
  function saveComms(next) { setComms(next); persist("comms", next); }
  function saveDailyLogs(next) { setDailyLogs(next); persist("dailyLogs", next); }

  function saveIdentity(data) {
    setCurrentUser(data);
    setShowIdentityEdit(false);
    try { window.storage.set("currentUser", JSON.stringify(data), false); } catch {}
  }
  function upsertOffer(data) {
    if (data.id) {
      saveOffers(offers.map((o) => (o.id === data.id ? data : o)));
    } else {
      saveOffers([{ ...data, id: uid(), createdBy: currentUser?.name || "", dateAdded: new Date().toISOString() }, ...offers]);
    }
    setOfferModal(null);
    showToast("Ponuka uložená ✓");
  }

  function upsertCompany(data) {
    if (data.id) {
      saveCompanies(companies.map((c) => (c.id === data.id ? data : c)));
    } else {
      saveCompanies([{ ...data, id: uid(), createdBy: currentUser?.name || "", dateAdded: new Date().toISOString() }, ...companies]);
    }
    setCompanyModal(null);
    showToast("Firma uložená ✓");
  }

  function upsertContact(data) {
    if (data.id) {
      saveContacts(contacts.map((k) => (k.id === data.id ? data : k)));
    } else {
      saveContacts([{ ...data, id: uid(), createdBy: currentUser?.name || "", dateAdded: new Date().toISOString() }, ...contacts]);
    }
    setContactModal(null);
    showToast("Kontakt uložený ✓");
  }

  function upsertEvent(data) {
    if (data.id) {
      saveEvents(events.map((e) => (e.id === data.id ? data : e)));
    } else {
      saveEvents([{ ...data, id: uid(), createdBy: currentUser?.name || "", dateAdded: new Date().toISOString() }, ...events]);
    }
    setEventModal(null);
    showToast("Udalosť uložená ✓");
  }

  function upsertComm(data) {
    if (data.id) {
      saveComms(comms.map((c) => (c.id === data.id ? data : c)));
    } else {
      saveComms([{ ...data, id: uid(), createdBy: currentUser?.name || "", dateAdded: new Date().toISOString() }, ...comms]);
    }
    setCommModal(null);
    showToast("Komunikácia uložená ✓");
  }

  function commitDailyExtraction(extraction, checked) {
    let newCompanies = [...companies];
    const companyIdByName = {};
    companies.forEach((c) => { companyIdByName[c.name.trim().toLowerCase()] = c.id; });

    (extraction.companies || []).forEach((c, i) => {
      if (!checked.companies?.[i]) return;
      const match = matchByName(c.name, newCompanies);
      if (match) { companyIdByName[c.name.trim().toLowerCase()] = match.id; return; }
      const id = uid();
      newCompanies = [{
        id, name: c.name, type: COMPANY_TYPES.some((t) => t.id === c.type) ? c.type : "ine",
        contactPerson: "", phone: c.phone || "", email: c.email || "", website: "", notes: c.notes || "",
        createdBy: currentUser?.name || "", dateAdded: new Date().toISOString(),
      }, ...newCompanies];
      companyIdByName[c.name.trim().toLowerCase()] = id;
    });

    let newContacts = [...contacts];
    const contactIdByName = {};
    contacts.forEach((k) => { contactIdByName[k.name.trim().toLowerCase()] = k.id; });

    (extraction.contacts || []).forEach((k, i) => {
      if (!checked.contacts?.[i]) return;
      const match = matchByName(k.name, newContacts);
      if (match) { contactIdByName[k.name.trim().toLowerCase()] = match.id; return; }
      const companyId = k.companyName ? (companyIdByName[k.companyName.trim().toLowerCase()] || "") : "";
      const id = uid();
      newContacts = [{
        id, name: k.name, role: k.role || "", category: "ine",
        phone: k.phone || "", email: k.email || "", companyId, notes: k.notes || "",
        createdBy: currentUser?.name || "", dateAdded: new Date().toISOString(),
      }, ...newContacts];
      contactIdByName[k.name.trim().toLowerCase()] = id;
    });

    let newEvents = [...events];
    (extraction.events || []).forEach((e, i) => {
      if (!checked.events?.[i]) return;
      const companyId = e.companyName ? (companyIdByName[e.companyName.trim().toLowerCase()] || "") : "";
      const contactId = e.contactName ? (contactIdByName[e.contactName.trim().toLowerCase()] || "") : "";
      newEvents = [{
        ...emptyEvent, id: uid(), title: e.title || "", date: e.date || "", time: e.time || "",
        type: EVENT_TYPES.some((t) => t.id === e.type) ? e.type : "ine",
        location: e.location || "", companyId, contactId, notes: e.notes || "",
        createdBy: currentUser?.name || "", dateAdded: new Date().toISOString(),
      }, ...newEvents];
    });

    let newComms = [...comms];
    (extraction.comms || []).forEach((c, i) => {
      if (!checked.comms?.[i]) return;
      const companyId = c.companyName ? (companyIdByName[c.companyName.trim().toLowerCase()] || "") : "";
      const contactId = c.contactName ? (contactIdByName[c.contactName.trim().toLowerCase()] || "") : "";
      newComms = [{
        ...emptyComm, id: uid(), subject: c.subject || "",
        direction: COMM_DIRECTIONS.some((d) => d.id === c.direction) ? c.direction : "prijate",
        channel: COMM_CHANNELS.some((ch) => ch.id === c.channel) ? c.channel : "email",
        date: c.date || dateKey(new Date()),
        status: COMM_STATUSES.some((s) => s.id === c.status) ? c.status : "caka_na_mna",
        replyByDate: c.replyByDate || "", summary: c.summary || "", tags: [], companyId, contactId,
        createdBy: currentUser?.name || "", dateAdded: new Date().toISOString(),
      }, ...newComms];
    });

    let newOffers = [...offers];
    (extraction.offers || []).forEach((o, i) => {
      if (!checked.offers?.[i]) return;
      const companyId = o.companyName ? (companyIdByName[o.companyName.trim().toLowerCase()] || "") : "";
      const contactId = o.contactName ? (contactIdByName[o.contactName.trim().toLowerCase()] || "") : "";
      const category = CATEGORIES.some((c) => c.id === o.category) ? o.category : "dopyt";
      newOffers = [{
        ...emptyOffer, id: uid(), category, subType: o.subType || "",
        title: o.title || "", location: o.location || "", price: o.price || "", area: o.area || "",
        description: o.description || "", companyId, contactId,
        createdBy: currentUser?.name || "", dateAdded: new Date().toISOString(),
      }, ...newOffers];
    });

    saveCompanies(newCompanies);
    saveContacts(newContacts);
    saveEvents(newEvents);
    saveComms(newComms);
    saveOffers(newOffers);

    const n = (key) => (extraction[key] || []).filter((_, i) => checked[key]?.[i]).length;
    showToast(`Uložené: ${n("contacts")} kontaktov, ${n("companies")} firiem, ${n("events")} udalostí, ${n("comms")} komunikácie, ${n("offers")} ponúk ✓`);
  }

  function moveEventDate(eventId, newDate) {
    saveEvents(events.map((e) => (e.id === eventId ? { ...e, date: newDate } : e)));
    showToast("Udalosť presunutá ✓");
  }

  function moveStage(offerId, stageId) {
    saveOffers(offers.map((o) => (o.id === offerId ? { ...o, stage: stageId } : o)));
  }

  function toggleSelectOffer(id) {
    setSelectedOfferIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function selectAllVisible(ids) {
    setSelectedOfferIds((prev) => Array.from(new Set([...prev, ...ids])));
  }
  function clearSelection() { setSelectedOfferIds([]); }
  function exitBulkMode() { setBulkMode(false); setSelectedOfferIds([]); setBulkTagInput(""); }

  function bulkSetStage(stageId) {
    saveOffers(offers.map((o) => (selectedOfferIds.includes(o.id) ? { ...o, stage: stageId } : o)));
    showToast(`Štádium zmenené pre ${selectedOfferIds.length} ponúk ✓`);
  }
  function bulkAddTag() {
    const tag = bulkTagInput.trim();
    if (!tag) return;
    saveOffers(offers.map((o) => (selectedOfferIds.includes(o.id) ? { ...o, tags: Array.from(new Set([...(o.tags || []), tag])) } : o)));
    setBulkTagInput("");
    showToast(`Tag pridaný k ${selectedOfferIds.length} ponukám ✓`);
  }
  function downloadBackup() {
    const backup = { exportedAt: new Date().toISOString(), offers, companies, contacts, events };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pozemkovy-crm-zaloha-${dateKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Záloha stiahnutá ✓");
  }

  function handleBackupFileSelected(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object") throw new Error("invalid");
        setRestoreError("");
        setRestorePending(parsed);
      } catch {
        setRestoreError("Súbor sa nepodarilo prečítať — nie je to platná záloha.");
      }
    };
    reader.readAsText(file);
  }

  function confirmRestore() {
    if (!restorePending) return;
    const b = restorePending;
    if (Array.isArray(b.offers)) saveOffers(b.offers);
    if (Array.isArray(b.companies)) saveCompanies(b.companies);
    if (Array.isArray(b.contacts)) saveContacts(b.contacts);
    if (Array.isArray(b.events)) saveEvents(b.events);
    setRestorePending(null);
    showToast("Záloha obnovená ✓");
  }

  function bulkDelete() {
    saveOffers(offers.filter((o) => !selectedOfferIds.includes(o.id)));
    showToast(`Vymazané: ${selectedOfferIds.length} ponúk`);
    exitBulkMode();
  }

  const exportJson = useMemo(() => {
    if (!exportCompany) return "";
    const shared = offers.filter((o) => (o.sharedWith || []).includes(exportCompany.id));
    const sanitized = shared.map((o) => ({
      kategoria: catMeta(o.category).label,
      podtyp: subTypeLabel(o) || undefined,
      nazov: o.title,
      lokalita: o.location || undefined,
      cena: o.price || undefined,
      vymera: o.area || undefined,
      stavUP: o.category === "pozemok" ? (landUseMeta(o.landUsePlan)?.label || undefined) : undefined,
      popis: o.description || undefined,
      odkaz: o.link || undefined,
    }));
    return JSON.stringify({ firma: exportCompany.name, vygenerovane: new Date().toISOString(), ponuky: sanitized }, null, 2);
  }, [exportCompany, offers]);

  const hasDemo = useMemo(() => offers.some((o) => (o.tags || []).includes(DEMO_TAG)), [offers]);

  function seedDemoData() {
    const demoCompanies = makeDemoCompanies();
    const timeframeDays = DEMO_TIMEFRAMES.find((t) => t.id === demoTimeframe)?.days || 30;
    const demoOffers = makeDemoOffers(demoCompanies, timeframeDays);
    saveCompanies([...demoCompanies, ...companies]);
    saveOffers([...demoOffers, ...offers]);
  }

  function clearDemoData() {
    saveOffers(offers.filter((o) => !(o.tags || []).includes(DEMO_TAG)));
    saveCompanies(companies.filter((c) => !c.isDemo));
  }

  function doDelete() {
    if (!confirmDelete) return;
    if (confirmDelete.kind === "offer") saveOffers(offers.filter((o) => o.id !== confirmDelete.id));
    if (confirmDelete.kind === "company") saveCompanies(companies.filter((c) => c.id !== confirmDelete.id));
    if (confirmDelete.kind === "contact") saveContacts(contacts.filter((k) => k.id !== confirmDelete.id));
    if (confirmDelete.kind === "event") saveEvents(events.filter((e) => e.id !== confirmDelete.id));
    if (confirmDelete.kind === "comm") saveComms(comms.filter((c) => c.id !== confirmDelete.id));
    if (confirmDelete.kind === "bulk-offers") { bulkDelete(); setConfirmDelete(null); return; }
    setConfirmDelete(null);
  }

  function toggleTagFilter(tag) {
    setFilterTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  const allTags = useMemo(() => {
    const set = new Set();
    offers.forEach((o) => (o.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [offers]);

  const allCommTags = useMemo(() => {
    const set = new Set();
    comms.forEach((c) => (c.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [comms]);

  function toggleCommTagFilter(tag) {
    setFilterCommTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  const filteredComms = useMemo(() => {
    return comms.filter((c) => {
      if (filterCommStatus !== "all" && c.status !== filterCommStatus) return false;
      if (filterCommTags.length > 0 && !(c.tags || []).some((t) => filterCommTags.includes(t))) return false;
      if (search) {
        const s = search.toLowerCase();
        const companyName = companies.find((x) => x.id === c.companyId)?.name || "";
        const contactName = contacts.find((x) => x.id === c.contactId)?.name || "";
        if (!(`${c.subject} ${c.summary} ${companyName} ${contactName} ${(c.tags || []).join(" ")}`.toLowerCase().includes(s))) return false;
      }
      return true;
    }).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [comms, companies, contacts, search, filterCommStatus, filterCommTags]);

  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      if (filterCategory !== "all" && o.category !== filterCategory) return false;
      if (filterCategory !== "all" && filterSubType !== "all" && o.subType !== filterSubType) return false;
      if (filterCategory === "pozemok" && filterLandUse !== "all" && o.landUsePlan !== filterLandUse) return false;
      if (filterStage !== "all" && o.stage !== filterStage) return false;
      if (filterPriority !== "all" && o.priority !== filterPriority) return false;
      if (filterTags.length > 0 && !(o.tags || []).some((t) => filterTags.includes(t))) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = `${o.title} ${o.location} ${o.notes} ${(o.tags || []).join(" ")}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [offers, filterCategory, filterSubType, filterLandUse, filterStage, filterPriority, filterTags, search]);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (filterType !== "all" && c.type !== filterType) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!(`${c.name} ${c.contactPerson} ${c.notes}`.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [companies, filterType, search]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((k) => {
      if (filterContactCategory !== "all" && k.category !== filterContactCategory) return false;
      if (search) {
        const s = search.toLowerCase();
        const companyName = companies.find((c) => c.id === k.companyId)?.name || "";
        if (!(`${k.name} ${k.role} ${companyName} ${k.notes}`.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [contacts, companies, search, filterContactCategory]);

  const stats = useMemo(() => {
    const byCat = {};
    CATEGORIES.forEach((c) => (byCat[c.id] = offers.filter((o) => o.category === c.id).length));
    const byStage = {};
    STAGES.forEach((s) => (byStage[s.id] = offers.filter((o) => o.stage === s.id).length));
    return { byCat, byStage, total: offers.length, companies: companies.length, contacts: contacts.length, comms: comms.length };
  }, [offers, companies, contacts, comms]);

  const agenda = useMemo(() => {
    const todayStr = dateKey(new Date());
    const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = dateKey(weekEnd);

    const offerItems = offers
      .filter((o) => o.followUpDate && !["uzavrete", "zamietnute"].includes(o.stage))
      .map((o) => ({
        kind: "offer", id: o.id, date: o.followUpDate, time: "",
        title: o.title || "Bez názvu",
        meta: `${catMeta(o.category).label}${o.location ? " · " + o.location : ""}`,
        color: stageMeta(o.stage).color, raw: o,
      }));
    const eventItems = events.map((e) => {
      const tm = eventTypeMeta(e.type);
      return {
        kind: "event", id: e.id, date: e.date, time: formatEventTime(e),
        title: e.title || tm.label,
        meta: `${tm.label}${e.location ? " · " + e.location : ""}`,
        color: tm.color, raw: e,
      };
    });
    const all = [...offerItems, ...eventItems].filter((it) => it.date);

    const overdue = all.filter((it) => it.date < todayStr).sort((a, b) => a.date.localeCompare(b.date));
    const today = all.filter((it) => it.date === todayStr).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    const week = all.filter((it) => it.date > todayStr && it.date <= weekEndStr).sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));

    const waiting = comms.filter((c) => c.status === "caka_na_mna").map((c) => ({
      kind: "comm", id: c.id, date: c.date, time: "",
      title: c.subject || "Bez predmetu",
      meta: `${commDirectionMeta(c.direction).label}${c.summary ? " · " + c.summary : ""}`,
      color: commStatusMeta(c.status).color, raw: c,
    })).sort((a, b) => (a.date || "").localeCompare(b.date || ""));

    return { overdue, today, week, waiting };
  }, [offers, events, comms]);

  if (loading) {
    return (
      <div className="app-shell center">
        <StyleSheet />
        <Loader2 className="spin" size={28} />
        <p className="muted">Načítavam dáta…</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <FontLoader />
      <header className="topbar">
        <div className="topo-bg" aria-hidden="true" />
        <div className="topbar-inner">
          <div className="brand">
            <Layers size={22} strokeWidth={1.6} />
            <div>
              <h1>Off-market CRM</h1>
              <p>Pozemky, budovy, developerské projekty a financovanie mimo verejného trhu</p>
            </div>
            <button className="user-badge" onClick={() => setShowIdentityEdit(true)}>
              <UserCircle2 size={16} />
              <span>{currentUser?.name || "Nastaviť meno"}</span>
            </button>
          </div>
          <nav className="tabs">
            <button className={tab === "prehlad" ? "tab active" : "tab"} onClick={() => setTab("prehlad")}>Prehľad</button>
            <button className={tab === "dennyzapis" ? "tab active" : "tab"} onClick={() => setTab("dennyzapis")}>Denný zápis</button>
            <button className={tab === "ponuky" ? "tab active" : "tab"} onClick={() => setTab("ponuky")}>Ponuky</button>
            <button className={tab === "kalendar" ? "tab active" : "tab"} onClick={() => setTab("kalendar")}>Kalendár</button>
            <button className={tab === "firmy" ? "tab active" : "tab"} onClick={() => setTab("firmy")}>Firmy</button>
            <button className={tab === "kontakty" ? "tab active" : "tab"} onClick={() => setTab("kontakty")}>Kontakty</button>
            <button className={tab === "komunikacia" ? "tab active" : "tab"} onClick={() => setTab("komunikacia")}>Komunikácia</button>
          </nav>
        </div>
      </header>

      {saveError && <div className="error-banner">{saveError}</div>}

      <main className="content">
        {tab === "prehlad" && (
          <Dashboard stats={stats} offers={offers} agenda={agenda}
            hasDemo={hasDemo} onSeedDemo={seedDemoData} onClearDemo={clearDemoData}
            demoTimeframe={demoTimeframe} setDemoTimeframe={setDemoTimeframe}
            onGoto={(c) => { setTab("ponuky"); setFilterCategory(c); setFilterSubType("all"); }}
            onGotoTab={(t) => setTab(t)}
            onOpenOffer={(o) => setOfferDetail(o)}
            onOpenEvent={(e) => setEventModal({ mode: "edit", data: e })}
            onOpenComm={(c) => setCommModal({ mode: "edit", data: c })}
            onDownloadBackup={downloadBackup}
            onRestoreClick={() => fileInputRef.current?.click()} />
        )}

        {tab === "ponuky" && (
          <section>
            <Toolbar
              search={search} setSearch={setSearch}
              placeholder="Hľadať podľa názvu, lokality, tagu, poznámky…"
              onAdd={() => setOfferModal({ mode: "add", data: { ...emptyOffer } })}
              addLabel="Pridať ponuku"
            >
              <div className="chip-row">
                <button className={filterCategory === "all" ? "chip active" : "chip"} onClick={() => { setFilterCategory("all"); setFilterSubType("all"); setFilterLandUse("all"); }}>Všetky</button>
                {CATEGORIES.map((c) => (
                  <button key={c.id} className={filterCategory === c.id ? "chip active" : "chip"} onClick={() => { setFilterCategory(c.id); setFilterSubType("all"); setFilterLandUse("all"); }}>
                    <c.icon size={13} /> {c.label}
                  </button>
                ))}
              </div>

              {filterCategory === "pozemok" && (
                <div className="chip-row">
                  <button className={filterSubType === "all" ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterSubType("all")}>Všetky typy pozemkov</button>
                  {LAND_SUBTYPES.map((s) => (
                    <button key={s.id} className={filterSubType === s.id ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterSubType(s.id)}>{s.label}</button>
                  ))}
                </div>
              )}
              {filterCategory === "pozemok" && (
                <div className="chip-row">
                  <button className={filterLandUse === "all" ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterLandUse("all")}>Všetky stavy ÚP</button>
                  {LAND_USE_STATUSES.map((s) => (
                    <button key={s.id} className={filterLandUse === s.id ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterLandUse(s.id)}>
                      <span className="dot" style={{ background: s.color }} />{s.label}
                    </button>
                  ))}
                </div>
              )}
              {filterCategory === "financovanie" && (
                <div className="chip-row">
                  <button className={filterSubType === "all" ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterSubType("all")}>Všetky typy financovania</button>
                  {FINANCING_TYPES.map((s) => (
                    <button key={s.id} className={filterSubType === s.id ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterSubType(s.id)}>{s.label}</button>
                  ))}
                </div>
              )}
              {filterCategory === "dopyt" && (
                <div className="chip-row">
                  <button className={filterSubType === "all" ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterSubType("all")}>Všetky typy dopytov</button>
                  {DOPYT_SUBTYPES.map((s) => (
                    <button key={s.id} className={filterSubType === s.id ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterSubType(s.id)}>{s.label}</button>
                  ))}
                </div>
              )}

              <div className="chip-row">
                <button className={filterStage === "all" ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterStage("all")}>Všetky štádiá</button>
                {STAGES.map((s) => (
                  <button key={s.id} className={filterStage === s.id ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterStage(s.id)}>
                    <span className="dot" style={{ background: s.color }} />{s.label}
                  </button>
                ))}
              </div>

              <div className="chip-row">
                <button className={filterPriority === "all" ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterPriority("all")}>Všetky priority</button>
                {PRIORITIES.map((p) => (
                  <button key={p.id} className={filterPriority === p.id ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterPriority(p.id)}>
                    <span className="dot" style={{ background: p.color }} />{p.label}
                  </button>
                ))}
              </div>

              {allTags.length > 0 && (
                <div className="chip-row">
                  {allTags.map((t) => (
                    <button key={t} className={filterTags.includes(t) ? "chip chip-tag active" : "chip chip-tag"} onClick={() => toggleTagFilter(t)}>
                      <TagIcon size={11} /> {t}
                    </button>
                  ))}
                </div>
              )}

              <div className="view-toggle">
                <button className={viewMode === "list" ? "icon-btn active" : "icon-btn"} onClick={() => setViewMode("list")} aria-label="Zoznam"><ListIcon size={16} /></button>
                {!bulkMode && <button className={viewMode === "kanban" ? "icon-btn active" : "icon-btn"} onClick={() => setViewMode("kanban")} aria-label="Kanban"><LayoutGrid size={16} /></button>}
                <button className={viewMode === "tabulka" ? "icon-btn active" : "icon-btn"} onClick={() => setViewMode("tabulka")} aria-label="Tabuľka"><Table2 size={16} /></button>
              </div>
              <button
                className={bulkMode ? "chip chip-ghost active" : "chip chip-ghost"}
                onClick={() => { const next = !bulkMode; setBulkMode(next); if (next && viewMode === "kanban") setViewMode("list"); if (!next) clearSelection(); }}
              >
                <CheckSquare size={13} /> Hromadné akcie
              </button>
            </Toolbar>

            {bulkMode && (
              <BulkActionBar
                count={selectedOfferIds.length}
                visibleIds={filteredOffers.map((o) => o.id)}
                onSelectAllVisible={selectAllVisible}
                onClearSelection={clearSelection}
                onSetStage={bulkSetStage}
                tagInput={bulkTagInput}
                setTagInput={setBulkTagInput}
                onAddTag={bulkAddTag}
                onDelete={() => setConfirmDelete({ kind: "bulk-offers", id: null, label: `${selectedOfferIds.length} vybraných ponúk` })}
              />
            )}

            {filteredOffers.length === 0 ? (
              <EmptyState text="Zatiaľ tu nie sú žiadne ponuky. Pridaj prvú a začni budovať prehľad." />
            ) : viewMode === "list" ? (
              <div className="card-grid">
                {filteredOffers.map((o) => (
                  <OfferCard key={o.id} offer={o} company={companies.find((c) => c.id === o.companyId)}
                    contact={contacts.find((k) => k.id === o.contactId)}
                    onEdit={() => setOfferModal({ mode: "edit", data: o })}
                    onDelete={() => setConfirmDelete({ kind: "offer", id: o.id, label: o.title || "túto ponuku" })}
                    onMoveStage={(s) => moveStage(o.id, s)}
                    onOpenDetail={() => setOfferDetail(o)}
                    bulkMode={bulkMode} selected={selectedOfferIds.includes(o.id)} onToggleSelect={() => toggleSelectOffer(o.id)} />
                ))}
              </div>
            ) : viewMode === "kanban" ? (
              <KanbanBoard offers={filteredOffers} companies={companies}
                onEdit={(o) => setOfferModal({ mode: "edit", data: o })}
                onDelete={(o) => setConfirmDelete({ kind: "offer", id: o.id, label: o.title || "túto ponuku" })}
                onMoveStage={moveStage}
                onOpenDetail={(o) => setOfferDetail(o)} />
            ) : (
              <TableView offers={filteredOffers} companies={companies}
                sortKey={tableSort.key} sortDir={tableSort.dir}
                onSort={(key) => setTableSort((prev) => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }))}
                onOpenOffer={(o) => setOfferDetail(o)}
                bulkMode={bulkMode} selectedIds={selectedOfferIds} onToggleSelect={toggleSelectOffer} />
            )}
          </section>
        )}

        {tab === "kalendar" && (
          <CalendarView offers={offers} events={events} comms={comms} contacts={contacts} companies={companies}
            onOpenOffer={(o) => setOfferDetail(o)}
            onAddEvent={(dateStr) => setEventModal({ mode: "add", data: { ...emptyEvent, date: dateStr } })}
            onOpenEvent={(e) => setEventModal({ mode: "edit", data: e })}
            onDeleteEvent={(e) => setConfirmDelete({ kind: "event", id: e.id, label: e.title || "túto udalosť" })}
            onMoveEvent={moveEventDate}
            onOpenComm={(c) => setCommModal({ mode: "edit", data: c })} />
        )}

        {tab === "firmy" && (
          <section>
            <Toolbar
              search={search} setSearch={setSearch}
              placeholder="Hľadať podľa názvu, kontaktu, poznámky…"
              onAdd={() => setCompanyModal({ mode: "add", data: { ...emptyCompany } })}
              addLabel="Pridať firmu"
            >
              <div className="chip-row">
                <button className={filterType === "all" ? "chip active" : "chip"} onClick={() => setFilterType("all")}>Všetky</button>
                {COMPANY_TYPES.map((t) => (
                  <button key={t.id} className={filterType === t.id ? "chip active" : "chip"} onClick={() => setFilterType(t.id)}>{t.label}</button>
                ))}
              </div>
            </Toolbar>

            {filteredCompanies.length === 0 ? (
              <EmptyState text="Zatiaľ žiadne firmy. Pridaj developerov, banky, equity partnerov, sprostredkovateľov alebo konkurenciu." />
            ) : (
              <div className="card-grid">
                {filteredCompanies.map((c) => (
                  <CompanyCard key={c.id} company={c} offerCount={offers.filter((o) => o.companyId === c.id).length}
                    sharedCount={offers.filter((o) => (o.sharedWith || []).includes(c.id)).length}
                    linkedContacts={contacts.filter((k) => k.companyId === c.id)}
                    onEdit={() => setCompanyModal({ mode: "edit", data: c })}
                    onDelete={() => setConfirmDelete({ kind: "company", id: c.id, label: c.name || "túto firmu" })}
                    onExport={(company) => setExportCompany(company)}
                    onOpenContact={(k) => setContactModal({ mode: "edit", data: k })} />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "kontakty" && (
          <section>
            <div className="stat-grid contact-stat-grid">
              <button className={filterContactCategory === "all" ? "stat-card stat-clickable stat-active" : "stat-card stat-clickable"} onClick={() => setFilterContactCategory("all")}>
                <span className="stat-num">{contacts.length}</span>
                <span className="stat-label">Všetky kontakty</span>
              </button>
              {CONTACT_CATEGORIES.map((cat) => (
                <button key={cat.id} className={filterContactCategory === cat.id ? "stat-card stat-clickable stat-active" : "stat-card stat-clickable"} onClick={() => setFilterContactCategory(cat.id)}>
                  <span className="dot" style={{ background: cat.color }} />
                  <span className="stat-num">{contacts.filter((k) => k.category === cat.id).length}</span>
                  <span className="stat-label">{cat.label}</span>
                </button>
              ))}
            </div>
            <Toolbar
              search={search} setSearch={setSearch}
              placeholder="Hľadať podľa mena, firmy, poznámky…"
              onAdd={() => setContactModal({ mode: "add", data: { ...emptyContact } })}
              addLabel="Pridať kontakt"
            >
              <div className="chip-row">
                <button className={filterContactCategory === "all" ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterContactCategory("all")}>Všetky kategórie</button>
                {CONTACT_CATEGORIES.map((cat) => (
                  <button key={cat.id} className={filterContactCategory === cat.id ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterContactCategory(cat.id)}>
                    <span className="dot" style={{ background: cat.color }} />{cat.label}
                  </button>
                ))}
              </div>
              <div className="view-toggle">
                <button className={contactViewMode === "cards" ? "icon-btn active" : "icon-btn"} onClick={() => setContactViewMode("cards")} aria-label="Karty"><LayoutGrid size={16} /></button>
                <button className={contactViewMode === "table" ? "icon-btn active" : "icon-btn"} onClick={() => setContactViewMode("table")} aria-label="Tabuľka"><Table2 size={16} /></button>
              </div>
            </Toolbar>
            {filteredContacts.length === 0 ? (
              <EmptyState text="Zatiaľ žiadne kontakty. Pridaj ľudí, s ktorými komunikuješ pri ponukách aj vo firmách." />
            ) : contactViewMode === "cards" ? (
              <div className="card-grid">
                {filteredContacts.map((k) => (
                  <ContactCard key={k.id} contact={k}
                    company={companies.find((c) => c.id === k.companyId)}
                    offerCount={offers.filter((o) => o.contactId === k.id).length}
                    onEdit={() => setContactModal({ mode: "edit", data: k })}
                    onDelete={() => setConfirmDelete({ kind: "contact", id: k.id, label: k.name || "tento kontakt" })} />
                ))}
              </div>
            ) : (
              <ContactTableView contacts={filteredContacts} companies={companies} offers={offers}
                sortKey={contactSort.key} sortDir={contactSort.dir}
                onSort={(key) => setContactSort((prev) => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }))}
                onOpenContact={(k) => setContactModal({ mode: "edit", data: k })} />
            )}
          </section>
        )}

        {tab === "komunikacia" && (
          <section>
            <div className="stat-grid contact-stat-grid">
              <button className={filterCommStatus === "all" ? "stat-card stat-clickable stat-active" : "stat-card stat-clickable"} onClick={() => setFilterCommStatus("all")}>
                <span className="stat-num">{comms.length}</span>
                <span className="stat-label">Všetka komunikácia</span>
              </button>
              {COMM_STATUSES.map((s) => (
                <button key={s.id} className={filterCommStatus === s.id ? "stat-card stat-clickable stat-active" : "stat-card stat-clickable"} onClick={() => setFilterCommStatus(s.id)}>
                  <span className="dot" style={{ background: s.color }} />
                  <span className="stat-num">{comms.filter((c) => c.status === s.id).length}</span>
                  <span className="stat-label">{s.label}</span>
                </button>
              ))}
            </div>
            <Toolbar
              search={search} setSearch={setSearch}
              placeholder="Hľadať podľa predmetu, zhrnutia, firmy, kontaktu…"
              onAdd={() => setCommModal({ mode: "add", data: { ...emptyComm, date: dateKey(new Date()) } })}
              addLabel="Pridať komunikáciu"
            >
              <div className="chip-row">
                <button className={filterCommStatus === "all" ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterCommStatus("all")}>Všetky stavy</button>
                {COMM_STATUSES.map((s) => (
                  <button key={s.id} className={filterCommStatus === s.id ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setFilterCommStatus(s.id)}>
                    <span className="dot" style={{ background: s.color }} />{s.label}
                  </button>
                ))}
              </div>
              {allCommTags.length > 0 && (
                <div className="chip-row">
                  {allCommTags.map((t) => (
                    <button key={t} className={filterCommTags.includes(t) ? "chip chip-tag active" : "chip chip-tag"} onClick={() => toggleCommTagFilter(t)}>
                      <TagIcon size={11} /> {t}
                    </button>
                  ))}
                </div>
              )}
            </Toolbar>
            {filteredComms.length === 0 ? (
              <EmptyState text="Zatiaľ žiadna zaznamenaná komunikácia. Pridaj email alebo správu, aby si nezabudol, komu máš čo odpovedať." />
            ) : (
              <div className="card-grid">
                {filteredComms.map((c) => (
                  <CommCard key={c.id} comm={c}
                    company={companies.find((x) => x.id === c.companyId)}
                    contact={contacts.find((x) => x.id === c.contactId)}
                    offer={offers.find((x) => x.id === c.offerId)}
                    onEdit={() => setCommModal({ mode: "edit", data: c })}
                    onDelete={() => setConfirmDelete({ kind: "comm", id: c.id, label: c.subject || "túto komunikáciu" })} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {offerDetail && (
        <OfferDetailModal
          offer={offerDetail}
          company={companies.find((c) => c.id === offerDetail.companyId)}
          contact={contacts.find((k) => k.id === offerDetail.contactId)}
          onClose={() => setOfferDetail(null)}
          onEdit={() => { setOfferModal({ mode: "edit", data: offerDetail }); setOfferDetail(null); }}
        />
      )}

      {offerModal && (
        <OfferForm
          initial={offerModal.data}
          companies={companies}
          contacts={contacts}
          onCancel={() => setOfferModal(null)}
          onSave={upsertOffer}
        />
      )}

      {companyModal && (
        <CompanyForm
          initial={companyModal.data}
          companies={companies}
          onCancel={() => setCompanyModal(null)}
          onSave={upsertCompany}
        />
      )}

      {contactModal && (
        <ContactForm
          initial={contactModal.data}
          companies={companies}
          contacts={contacts}
          onCancel={() => setContactModal(null)}
          onSave={upsertContact}
        />
      )}

      {eventModal && (
        <EventForm
          initial={eventModal.data}
          offers={offers}
          companies={companies}
          contacts={contacts}
          onCancel={() => setEventModal(null)}
          onSave={upsertEvent}
        />
      )}

      {commModal && (
        <CommForm
          initial={commModal.data}
          offers={offers}
          companies={companies}
          contacts={contacts}
          onCancel={() => setCommModal(null)}
          onSave={upsertComm}
        />
      )}

      {confirmDelete && (
        <Modal title="Potvrdiť vymazanie" onClose={() => setConfirmDelete(null)}>
          <p className="confirm-text">Naozaj chceš natrvalo vymazať <strong>{confirmDelete.label}</strong>?</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Zrušiť</button>
            <button className="btn btn-danger" onClick={doDelete}>Vymazať</button>
          </div>
        </Modal>
      )}

      <input ref={fileInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={handleBackupFileSelected} />

      {restoreError && (
        <Modal title="Chyba pri načítaní zálohy" onClose={() => setRestoreError("")}>
          <p className="confirm-text">{restoreError}</p>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setRestoreError("")}>Zavrieť</button>
          </div>
        </Modal>
      )}

      {restorePending && (
        <Modal title="Obnoviť zálohu?" onClose={() => setRestorePending(null)}>
          <p className="confirm-text">
            Toto <strong>prepíše všetky aktuálne dáta</strong> obsahom zálohy
            {restorePending.exportedAt ? ` (vytvorenej ${new Date(restorePending.exportedAt).toLocaleString("sk-SK")})` : ""}:
            {" "}{(restorePending.offers || []).length} ponúk, {(restorePending.companies || []).length} firiem,{" "}
            {(restorePending.contacts || []).length} kontaktov, {(restorePending.events || []).length} udalostí.
            Túto akciu nemožno vrátiť späť.
          </p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setRestorePending(null)}>Zrušiť</button>
            <button className="btn btn-danger" onClick={confirmRestore}>Obnoviť a prepísať</button>
          </div>
        </Modal>
      )}

      {exportCompany && (
        <Modal title={`Export ponúk pre: ${exportCompany.name}`} onClose={() => setExportCompany(null)}>
          <p className="muted" style={{ marginBottom: 10 }}>
            Toto obsahuje len ponuky označené ako zdieľané s touto firmou, bez interných poznámok, kontaktov a priorít. Skopíruj tento text a pošli mi ho — postavím z neho samostatný artefakt/odkaz len pre túto firmu.
          </p>
          <textarea className="export-textarea" readOnly value={exportJson} rows={12} onFocus={(e) => e.target.select()} />
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setExportCompany(null)}>Zavrieť</button>
            <button
              className="btn btn-primary"
              onClick={async () => {
                try { await navigator.clipboard.writeText(exportJson); } catch {}
              }}
            >
              <Copy size={14} /> Kopírovať
            </button>
          </div>
        </Modal>
      )}

      {showIdentityEdit && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setShowIdentityEdit(false)}>
          <div className="modal-panel">
            <div className="modal-head">
              <h3>Zmeniť identitu</h3>
              <button className="icon-btn" onClick={() => setShowIdentityEdit(false)} aria-label="Zavrieť"><X size={18} /></button>
            </div>
            <div className="modal-body">
              <IdentityGate initial={currentUser} onSave={saveIdentity} onCancel={() => setShowIdentityEdit(false)} />
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      <StyleSheet />
    </div>
  );
}

function Toolbar({ search, setSearch, placeholder, onAdd, addLabel, children }) {
  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <div className="search-box">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={placeholder} />
        </div>
        <button className="btn btn-primary" onClick={onAdd}><Plus size={16} /> {addLabel}</button>
      </div>
      {children}
    </div>
  );
}

function BulkActionBar({ count, visibleIds, onSelectAllVisible, onClearSelection, onSetStage, tagInput, setTagInput, onAddTag, onDelete }) {
  return (
    <div className="bulk-bar">
      <div className="bulk-bar-row">
        <span className="bulk-count">{count} vybraných</span>
        <button className="chip chip-ghost" onClick={() => onSelectAllVisible(visibleIds)}>Vybrať všetky viditeľné ({visibleIds.length})</button>
        <button className="chip chip-ghost" onClick={onClearSelection}>Zrušiť výber</button>
      </div>
      {count > 0 && (
        <>
          <div className="bulk-bar-row">
            <span className="bulk-label">Zmeniť štádium na:</span>
            {STAGES.map((s) => (
              <button key={s.id} className="chip chip-ghost" style={{ borderColor: s.color, color: s.color }} onClick={() => onSetStage(s.id)}>{s.label}</button>
            ))}
          </div>
          <div className="bulk-bar-row">
            <span className="bulk-label">Pridať tag:</span>
            <input className="bulk-tag-input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="napr. rýchly predaj" />
            <button className="btn btn-ghost" onClick={onAddTag}>Pridať</button>
            <button className="btn btn-danger bulk-delete-btn" onClick={onDelete}><Trash2 size={14} /> Vymazať vybrané</button>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <div className="empty-frame"><CornerMarks /></div>
      <p>{text}</p>
    </div>
  );
}

function openAgendaItem(item, { onOpenOffer, onOpenEvent, onOpenComm }) {
  if (item.kind === "offer") onOpenOffer(item.raw);
  else if (item.kind === "event") onOpenEvent(item.raw);
  else onOpenComm(item.raw);
}
function agendaKindLabel(kind) {
  if (kind === "event") return " · udalosť";
  if (kind === "comm") return " · email";
  return "";
}

function AgendaItem({ item, onOpenOffer, onOpenEvent, onOpenComm, overdue }) {
  return (
    <li className="clickable" onClick={() => openAgendaItem(item, { onOpenOffer, onOpenEvent, onOpenComm })}>
      <span className="dot" style={{ background: item.color }} />
      {item.time && <span className="event-time"><Clock size={11} /> {item.time}</span>}
      {overdue && <span className="due-badge due-overdue">{new Date(item.date).toLocaleDateString("sk-SK")}</span>}
      <span className="recent-title">{item.title}</span>
      <span className="recent-meta">{item.meta}{agendaKindLabel(item.kind)}</span>
    </li>
  );
}

function AgendaPanel({ agenda, onOpenOffer, onOpenEvent, onOpenComm }) {
  const [view, setView] = useState("today");
  const totalToday = agenda.overdue.length + agenda.today.length;

  return (
    <div className="panel panel-alert">
      <div className="agenda-head">
        <h3><CalendarClock size={15} /> Čo ma čaká</h3>
        <div className="agenda-toggle">
          <button className={view === "today" ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setView("today")}>Dnes ({totalToday})</button>
          <button className={view === "week" ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setView("week")}>Tento týždeň ({agenda.week.length})</button>
          <button className={view === "waiting" ? "chip chip-ghost active" : "chip chip-ghost"} onClick={() => setView("waiting")}>Čaká na mňa ({agenda.waiting.length})</button>
        </div>
      </div>

      {view === "today" && agenda.overdue.length === 0 && agenda.today.length === 0 && <p className="muted">Na dnes nemáš nič naplánované.</p>}
      {view === "week" && agenda.week.length === 0 && <p className="muted">V nasledujúcich 7 dňoch nemáš nič naplánované.</p>}
      {view === "waiting" && agenda.waiting.length === 0 && <p className="muted">Nečaká sa na tvoju odpoveď k žiadnej komunikácii.</p>}

      {view === "today" && agenda.overdue.length > 0 && (
        <ul className="recent-list agenda-list">
          {agenda.overdue.map((it) => <AgendaItem key={`${it.kind}-${it.id}`} item={it} onOpenOffer={onOpenOffer} onOpenEvent={onOpenEvent} onOpenComm={onOpenComm} overdue />)}
        </ul>
      )}
      {view === "today" && agenda.today.length > 0 && (
        <ul className="recent-list agenda-list">
          {agenda.today.map((it) => <AgendaItem key={`${it.kind}-${it.id}`} item={it} onOpenOffer={onOpenOffer} onOpenEvent={onOpenEvent} onOpenComm={onOpenComm} />)}
        </ul>
      )}
      {view === "week" && agenda.week.length > 0 && (
        <ul className="recent-list agenda-list">
          {agenda.week.map((it) => (
            <li key={`${it.kind}-${it.id}`} className="clickable" onClick={() => openAgendaItem(it, { onOpenOffer, onOpenEvent, onOpenComm })}>
              <span className="dot" style={{ background: it.color }} />
              <span className="due-badge">{new Date(it.date).toLocaleDateString("sk-SK")}</span>
              {it.time && <span className="event-time"><Clock size={11} /> {it.time}</span>}
              <span className="recent-title">{it.title}</span>
              <span className="recent-meta">{it.meta}{agendaKindLabel(it.kind)}</span>
            </li>
          ))}
        </ul>
      )}
      {view === "waiting" && agenda.waiting.length > 0 && (
        <ul className="recent-list agenda-list">
          {agenda.waiting.map((it) => (
            <li key={`${it.kind}-${it.id}`} className="clickable" onClick={() => openAgendaItem(it, { onOpenOffer, onOpenEvent, onOpenComm })}>
              <span className="dot" style={{ background: it.color }} />
              {it.date && <span className="due-badge">{new Date(it.date).toLocaleDateString("sk-SK")}</span>}
              <span className="recent-title">{it.title}</span>
              <span className="recent-meta">{it.meta}{agendaKindLabel(it.kind)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Dashboard({ stats, offers, agenda, hasDemo, onSeedDemo, onClearDemo, demoTimeframe, setDemoTimeframe, onGoto, onGotoTab, onOpenOffer, onOpenEvent, onOpenComm, onDownloadBackup, onRestoreClick }) {
  const recent = [...offers].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)).slice(0, 5);
  return (
    <section className="dashboard">
      <div className="backup-bar">
        <button className="btn btn-ghost" onClick={onDownloadBackup}><Download size={14} /> Stiahnuť zálohu</button>
        <button className="btn btn-ghost" onClick={onRestoreClick}><Upload size={14} /> Obnoviť zo zálohy</button>
      </div>
      <div className="demo-bar">
        {hasDemo ? (
          <button className="btn btn-ghost" onClick={onClearDemo}><Trash2 size={14} /> Odstrániť ukážkové dáta</button>
        ) : (
          <>
            <select className="demo-timeframe-select" value={demoTimeframe} onChange={(e) => setDemoTimeframe(e.target.value)}>
              {DEMO_TIMEFRAMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <button className="btn btn-ghost" onClick={onSeedDemo}><Sparkles size={14} /> Naplniť ukážkovými ponukami (všetky typy)</button>
          </>
        )}
      </div>
      <div className="stat-grid">
        <div className="stat-card stat-total">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-label">Ponúk spolu</span>
        </div>
        {CATEGORIES.map((c) => (
          <button key={c.id} className="stat-card stat-clickable" onClick={() => onGoto(c.id)}>
            <c.icon size={18} strokeWidth={1.6} />
            <span className="stat-num">{stats.byCat[c.id]}</span>
            <span className="stat-label">{c.label}</span>
          </button>
        ))}
        <button className="stat-card stat-clickable" onClick={() => onGotoTab("firmy")}>
          <Building2 size={18} strokeWidth={1.6} />
          <span className="stat-num">{stats.companies}</span>
          <span className="stat-label">Firmy v databáze</span>
        </button>
        <button className="stat-card stat-clickable" onClick={() => onGotoTab("kontakty")}>
          <ContactIcon size={18} strokeWidth={1.6} />
          <span className="stat-num">{stats.contacts}</span>
          <span className="stat-label">Kontakty v databáze</span>
        </button>
        <button className="stat-card stat-clickable" onClick={() => onGotoTab("komunikacia")}>
          <Mail size={18} strokeWidth={1.6} />
          <span className="stat-num">{stats.comms}</span>
          <span className="stat-label">Záznamov komunikácie</span>
        </button>
      </div>

      <AgendaPanel agenda={agenda} onOpenOffer={onOpenOffer} onOpenEvent={onOpenEvent} onOpenComm={onOpenComm} />

      <div className="dash-cols">
        <div className="panel">
          <h3>Rozdelenie podľa štádia</h3>
          <div className="stage-bars">
            {STAGES.map((s) => {
              const count = stats.byStage[s.id];
              const max = Math.max(1, ...STAGES.map((x) => stats.byStage[x.id]));
              return (
                <div className="stage-bar-row" key={s.id}>
                  <span className="stage-bar-label"><span className="dot" style={{ background: s.color }} />{s.label}</span>
                  <div className="stage-bar-track">
                    <div className="stage-bar-fill" style={{ width: `${(count / max) * 100}%`, background: s.color }} />
                  </div>
                  <span className="stage-bar-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <h3>Naposledy pridané</h3>
          {recent.length === 0 ? (
            <p className="muted">Zatiaľ nič nepribudlo.</p>
          ) : (
            <ul className="recent-list">
              {recent.map((o) => (
                <li key={o.id} className="clickable" onClick={() => onOpenOffer(o)}>
                  <span className="dot" style={{ background: stageMeta(o.stage).color }} />
                  <span className="recent-title">{o.title || "Bez názvu"}</span>
                  <span className="recent-meta">{catMeta(o.category).label}{o.location ? ` · ${o.location}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function OfferCard({ offer, company, contact, onEdit, onDelete, onMoveStage, onOpenDetail, bulkMode, selected, onToggleSelect }) {
  const CatIcon = catMeta(offer.category).icon;
  const stage = stageMeta(offer.stage);
  const pr = priorityMeta(offer.priority);
  const sub = subTypeLabel(offer);
  const ppm2 = pricePerM2(offer);
  const lup = offer.category === "pozemok" ? landUseMeta(offer.landUsePlan) : null;
  const sharedCount = (offer.sharedWith || []).length;
  return (
    <div className={`card${selected ? " card-selected" : ""}`} style={pr ? { borderLeft: `4px solid ${pr.color}` } : undefined}>
      <CornerMarks />
      <div className="card-head">
        <div className="head-pills">
          {bulkMode && (
            <button className="icon-btn bulk-checkbox" onClick={onToggleSelect} aria-label="Vybrať">
              {selected ? <CheckSquare size={17} /> : <Square size={17} />}
            </button>
          )}
          <span className="cat-pill"><CatIcon size={13} strokeWidth={1.8} /> {catMeta(offer.category).label}</span>
          {sub && <span className="sub-pill">{sub}</span>}
        </div>
        <div className="card-actions">
          <button className="icon-btn" onClick={onEdit} aria-label="Upraviť"><Pencil size={14} /></button>
          <button className="icon-btn" onClick={onDelete} aria-label="Vymazať"><Trash2 size={14} /></button>
        </div>
      </div>
      <h4 className="card-title card-title-clickable" onClick={onOpenDetail}>{offer.title || "Bez názvu"}</h4>
      {offer.location && <p className="card-sub"><MapPin size={12} /> {offer.location}</p>}
      <div className="card-data">
        {offer.price && <span className="data-chip">{offer.price}</span>}
        {offer.area && <span className="data-chip">{offer.area}</span>}
        {ppm2 && <span className="data-chip data-chip-accent">~{ppm2}</span>}
        {lup && <span className="data-chip" style={{ background: `${lup.color}1A`, color: lup.color }}>{lup.label}</span>}
      </div>
      {company && <p className="card-company"><Building2 size={12} /> {company.name}</p>}
      {contact ? (
        <p className="card-contact"><ContactIcon size={12} /> {contact.name}{contact.role ? ` (${contact.role})` : ""}{contact.phone ? ` · ${contact.phone}` : ""}{contact.email ? ` · ${contact.email}` : ""}</p>
      ) : (offer.contactName || offer.contactInfo) ? (
        <p className="card-contact">{offer.contactName}{offer.contactName && offer.contactInfo ? " · " : ""}{offer.contactInfo}</p>
      ) : null}
      {offer.link && (
        <a className="card-link" href={offer.link} target="_blank" rel="noopener noreferrer"><LinkIcon size={12} /> Odkaz na ponuku</a>
      )}
      {offer.followUpDate && (
        <p className={isOverdue(offer.followUpDate) ? "followup-line followup-overdue" : "followup-line"}>
          <CalendarClock size={12} /> Ozvať sa: {new Date(offer.followUpDate).toLocaleDateString("sk-SK")}
        </p>
      )}
      {offer.tags && offer.tags.length > 0 && (
        <div className="tag-row">
          {offer.tags.map((t) => <span className="tag-pill" key={t}>{t}</span>)}
        </div>
      )}
      {offer.description && <p className="card-description">{offer.description}</p>}
      {offer.notes && <p className="card-notes">{offer.notes}</p>}
      <div className="card-footer">
        <select className="stage-select" style={{ borderColor: stage.color, color: stage.color }} value={offer.stage} onChange={(e) => onMoveStage(e.target.value)}>
          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        {offer.createdBy && <span className="created-by">Pridal: {offer.createdBy}</span>}
        {sharedCount > 0 && <span className="shared-badge">Zdieľané s {sharedCount} {sharedCount === 1 ? "firmou" : "firmami"}</span>}
      </div>
    </div>
  );
}

function CompanyCard({ company, offerCount, sharedCount, linkedContacts, onEdit, onDelete, onExport, onOpenContact }) {
  const typeLabel = COMPANY_TYPES.find((t) => t.id === company.type)?.label || company.type;
  return (
    <div className="card">
      <CornerMarks />
      <div className="card-head">
        <span className="cat-pill"><Building2 size={13} strokeWidth={1.8} /> {typeLabel}</span>
        <div className="card-actions">
          <button className="icon-btn" onClick={onEdit} aria-label="Upraviť"><Pencil size={14} /></button>
          <button className="icon-btn" onClick={onDelete} aria-label="Vymazať"><Trash2 size={14} /></button>
        </div>
      </div>
      <h4 className="card-title">{company.name || "Bez názvu"}</h4>
      {company.contactPerson && <p className="card-sub">{company.contactPerson}</p>}
      <div className="card-data">
        {company.phone && <span className="data-chip">{company.phone}</span>}
        {company.email && <span className="data-chip">{company.email}</span>}
      </div>
      {company.website && (
        <a className="card-link" href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer"><LinkIcon size={12} /> Web</a>
      )}
      {linkedContacts && linkedContacts.length > 0 && (
        <div className="linked-contacts">
          <span className="linked-contacts-label"><ContactIcon size={12} /> Kontaktné osoby:</span>
          {linkedContacts.map((k) => (
            <button key={k.id} className="linked-contact-pill" onClick={() => onOpenContact(k)}>{k.name}{k.role ? ` (${k.role})` : ""}</button>
          ))}
        </div>
      )}
      {company.notes && <p className="card-notes">{company.notes}</p>}
      <div className="card-footer">
        <span className="muted small">{offerCount} {offerCount === 1 ? "prepojená ponuka" : "prepojených ponúk"}</span>
        <button className="btn btn-ghost btn-export" onClick={() => onExport(company)}>
          <Share2 size={13} /> Vygenerovať export ({sharedCount})
        </button>
      </div>
    </div>
  );
}

function KanbanBoard({ offers, companies, onEdit, onDelete, onMoveStage, onOpenDetail }) {
  return (
    <div className="kanban">
      {STAGES.map((s) => {
        const items = offers.filter((o) => o.stage === s.id);
        return (
          <div className="kanban-col" key={s.id}>
            <div className="kanban-col-head" style={{ borderTopColor: s.color }}>
              <span className="dot" style={{ background: s.color }} />
              <span>{s.label}</span>
              <span className="kanban-count">{items.length}</span>
            </div>
            <div className="kanban-col-body">
              {items.map((o) => {
                const pr = priorityMeta(o.priority);
                return (
                  <div className="kanban-card" key={o.id} style={pr ? { borderLeft: `3px solid ${pr.color}` } : undefined}>
                    <div className="card-head">
                      <span className="cat-pill small">{catMeta(o.category).label}</span>
                      <div className="card-actions">
                        <button className="icon-btn" onClick={() => onEdit(o)} aria-label="Upraviť"><Pencil size={13} /></button>
                        <button className="icon-btn" onClick={() => onDelete(o)} aria-label="Vymazať"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <p className="kanban-title card-title-clickable" onClick={() => onOpenDetail(o)}>{o.title || "Bez názvu"}</p>
                    {o.location && <p className="kanban-loc"><MapPin size={11} /> {o.location}</p>}
                    <div className="kanban-move">
                      {STAGES.filter((x) => x.id !== s.id).map((x) => (
                        <button key={x.id} className="kanban-move-btn" title={`Presunúť do: ${x.label}`} onClick={() => onMoveStage(o.id, x.id)}>
                          <span className="dot" style={{ background: x.color }} />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && <p className="kanban-empty">—</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const STAGE_RANK = Object.fromEntries(STAGES.map((s, i) => [s.id, i]));
const PRIORITY_RANK = Object.fromEntries(PRIORITIES.map((p, i) => [p.id, i]));

const TABLE_COLUMNS = [
  { key: "category", label: "Kategória" },
  { key: "title", label: "Názov" },
  { key: "company", label: "Firma" },
  { key: "location", label: "Lokalita" },
  { key: "price", label: "Cena" },
  { key: "stage", label: "Štádium" },
  { key: "priority", label: "Priorita" },
  { key: "followUp", label: "Termín" },
  { key: "createdBy", label: "Pridal" },
];

function tableSortValue(row, key) {
  switch (key) {
    case "price": return row.priceNum;
    case "stage": return row.stageRank;
    case "priority": return row.priorityRank;
    case "followUp": return row.followUp || "9999-99-99";
    case "dateAdded": return row.dateAdded || "";
    default: return (row[key] || "").toString().toLowerCase();
  }
}

function TableView({ offers, companies, sortKey, sortDir, onSort, onOpenOffer, bulkMode, selectedIds, onToggleSelect }) {
  const rows = useMemo(() => offers.map((o) => {
    const stage = stageMeta(o.stage);
    const pr = priorityMeta(o.priority);
    return {
      offer: o,
      category: catMeta(o.category).label,
      sub: subTypeLabel(o) || "",
      title: o.title || "Bez názvu",
      company: companies.find((c) => c.id === o.companyId)?.name || "",
      location: o.location || "",
      price: o.price || "",
      priceNum: parseNum(o.price) || 0,
      stageLabel: stage.label,
      stageColor: stage.color,
      stageRank: STAGE_RANK[o.stage] ?? 0,
      priorityLabel: pr?.label || "",
      priorityColor: pr?.color || "",
      priorityRank: pr ? PRIORITY_RANK[o.priority] : 99,
      followUp: o.followUpDate || "",
      createdBy: o.createdBy || "",
      dateAdded: o.dateAdded || "",
    };
  }), [offers, companies]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = tableSortValue(a, sortKey);
      const vb = tableSortValue(b, sortKey);
      let cmp;
      if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
      else cmp = String(va).localeCompare(String(vb), "sk");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  if (sorted.length === 0) return <EmptyState text="Žiadne ponuky nezodpovedajú zvoleným filtrom." />;

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {bulkMode && <th></th>}
            {TABLE_COLUMNS.map((col) => (
              <th key={col.key} onClick={() => onSort(col.key)}>
                {col.label}
                {sortKey === col.key && (sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
              </th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.offer.id} className={selectedIds && selectedIds.includes(r.offer.id) ? "row-selected" : ""}>
              {bulkMode && (
                <td>
                  <button className="icon-btn" onClick={() => onToggleSelect(r.offer.id)} aria-label="Vybrať">
                    {selectedIds.includes(r.offer.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </td>
              )}
              <td>{r.category}{r.sub ? <span className="table-sub"> · {r.sub}</span> : ""}</td>
              <td>{r.title}</td>
              <td>{r.company}</td>
              <td>{r.location}</td>
              <td>{r.price}</td>
              <td>{r.stageLabel ? <span className="table-tag" style={{ color: r.stageColor, borderColor: r.stageColor }}>{r.stageLabel}</span> : ""}</td>
              <td>{r.priorityLabel ? <span className="table-tag" style={{ color: r.priorityColor, borderColor: r.priorityColor }}>{r.priorityLabel}</span> : ""}</td>
              <td className={isOverdue(r.followUp) ? "table-overdue" : ""}>{r.followUp ? new Date(r.followUp).toLocaleDateString("sk-SK") : ""}</td>
              <td>{r.createdBy}</td>
              <td><button className="btn btn-ghost btn-table-open" onClick={() => onOpenOffer(r.offer)}>Otvoriť</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CONTACT_TABLE_COLUMNS = [
  { key: "category", label: "Kategória" },
  { key: "name", label: "Meno" },
  { key: "role", label: "Rola" },
  { key: "company", label: "Firma" },
  { key: "phone", label: "Telefón" },
  { key: "email", label: "Email" },
  { key: "offerCount", label: "Ponuky" },
];

function contactTableSortValue(row, key) {
  if (key === "offerCount") return row.offerCount;
  return (row[key] || "").toString().toLowerCase();
}

function ContactTableView({ contacts, companies, offers, sortKey, sortDir, onSort, onOpenContact }) {
  const rows = useMemo(() => contacts.map((k) => {
    const cat = contactCategoryMeta(k.category);
    return {
      contact: k,
      category: cat.label,
      categoryColor: cat.color,
      name: k.name || "Bez mena",
      role: k.role || "",
      company: companies.find((c) => c.id === k.companyId)?.name || "",
      phone: k.phone || "",
      email: k.email || "",
      offerCount: offers.filter((o) => o.contactId === k.id).length,
    };
  }), [contacts, companies, offers]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = contactTableSortValue(a, sortKey);
      const vb = contactTableSortValue(b, sortKey);
      let cmp;
      if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
      else cmp = String(va).localeCompare(String(vb), "sk");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  if (sorted.length === 0) return <EmptyState text="Žiadne kontakty nezodpovedajú zvoleným filtrom." />;

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {CONTACT_TABLE_COLUMNS.map((col) => (
              <th key={col.key} onClick={() => onSort(col.key)}>
                {col.label}
                {sortKey === col.key && (sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
              </th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.contact.id}>
              <td><span className="table-tag" style={{ color: r.categoryColor, borderColor: r.categoryColor }}>{r.category}</span></td>
              <td>{r.name}</td>
              <td>{r.role}</td>
              <td>{r.company}</td>
              <td>{r.phone}</td>
              <td>{r.email}</td>
              <td>{r.offerCount}</td>
              <td><button className="btn btn-ghost btn-table-open" onClick={() => onOpenContact(r.contact)}>Otvoriť</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OfferDetailModal({ offer, company, contact, onClose, onEdit }) {
  const CatIcon = catMeta(offer.category).icon;
  const stage = stageMeta(offer.stage);
  const pr = priorityMeta(offer.priority);
  const sub = subTypeLabel(offer);
  const ppm2 = pricePerM2(offer);
  const lup = offer.category === "pozemok" ? landUseMeta(offer.landUsePlan) : null;
  return (
    <Modal title="Detail ponuky" onClose={onClose}>
      <div className="detail-view">
        <div className="head-pills">
          <span className="cat-pill"><CatIcon size={13} strokeWidth={1.8} /> {catMeta(offer.category).label}</span>
          {sub && <span className="sub-pill">{sub}</span>}
        </div>
        <h3 className="detail-title">{offer.title || "Bez názvu"}</h3>
        {offer.location && <p className="detail-row"><MapPin size={13} /> {offer.location}</p>}

        <div className="card-data">
          {offer.price && <span className="data-chip">{offer.price}</span>}
          {offer.area && <span className="data-chip">{offer.area}</span>}
          {ppm2 && <span className="data-chip data-chip-accent">~{ppm2}</span>}
          {lup && <span className="data-chip" style={{ background: `${lup.color}1A`, color: lup.color }}>{lup.label}</span>}
        </div>

        <div className="detail-badges">
          <span className="table-tag" style={{ color: stage.color, borderColor: stage.color }}>{stage.label}</span>
          {pr && <span className="table-tag" style={{ color: pr.color, borderColor: pr.color }}>{pr.label}</span>}
        </div>

        {company && <p className="detail-row"><Building2 size={13} /> {company.name}</p>}
        {contact && <p className="detail-row"><ContactIcon size={13} /> {contact.name}{contact.role ? ` (${contact.role})` : ""}{contact.phone ? ` · ${contact.phone}` : ""}{contact.email ? ` · ${contact.email}` : ""}</p>}
        {(offer.contactName || offer.contactInfo) && !contact && (
          <p className="detail-row">{offer.contactName}{offer.contactName && offer.contactInfo ? " · " : ""}{offer.contactInfo}</p>
        )}
        {offer.source && <p className="detail-row"><strong>Zdroj:</strong> {offer.source}</p>}
        {offer.followUpDate && (
          <p className={isOverdue(offer.followUpDate) ? "followup-line followup-overdue" : "followup-line"}>
            <CalendarClock size={13} /> Ozvať sa: {new Date(offer.followUpDate).toLocaleDateString("sk-SK")}
          </p>
        )}
        {offer.link && (
          <a className="card-link" href={offer.link} target="_blank" rel="noopener noreferrer"><LinkIcon size={13} /> Odkaz na ponuku</a>
        )}
        {offer.tags && offer.tags.length > 0 && (
          <div className="tag-row">
            {offer.tags.map((t) => <span className="tag-pill" key={t}>{t}</span>)}
          </div>
        )}
        {offer.description && (
          <div className="detail-block">
            <p className="detail-block-label">Popis</p>
            <p>{offer.description}</p>
          </div>
        )}
        {offer.notes && (
          <div className="detail-block">
            <p className="detail-block-label">Poznámky</p>
            <p>{offer.notes}</p>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Zavrieť</button>
          <button type="button" className="btn btn-primary" onClick={onEdit}><Pencil size={14} /> Upraviť</button>
        </div>
      </div>
    </Modal>
  );
}

function OfferForm({ initial, companies, contacts, onCancel, onSave }) {
  const [data, setData] = useState({ ...initial, tagsInput: (initial.tags || []).join(", ") });
  const set = (k) => (e) => setData({ ...data, [k]: e.target.value });
  const setCategory = (e) => {
    const category = e.target.value;
    const subType = category === "pozemok" ? LAND_SUBTYPES[0].id : category === "financovanie" ? FINANCING_TYPES[0].id : category === "dopyt" ? DOPYT_SUBTYPES[0].id : "";
    setData({ ...data, category, subType });
  };
  const [titleError, setTitleError] = useState(false);
  function handleSave() {
    if (!data.title.trim()) { setTitleError(true); return; }
    onSave({ ...data, tags: parseTags(data.tagsInput) });
  }
  return (
    <Modal title={data.id ? "Upraviť ponuku" : "Nová ponuka"} onClose={onCancel}>
      <div className="form-grid">
        <Field label="Kategória">
          <select value={data.category} onChange={setCategory}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        {data.category === "pozemok" && (
          <Field label="Typ pozemku">
            <select value={data.subType} onChange={set("subType")}>
              {LAND_SUBTYPES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
        )}
        {data.category === "pozemok" && (
          <Field label="Stav územného plánu">
            <select value={data.landUsePlan} onChange={set("landUsePlan")}>
              <option value="">— neuvedené —</option>
              {LAND_USE_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
        )}
        {data.category === "financovanie" && (
          <Field label="Typ financovania">
            <select value={data.subType} onChange={set("subType")}>
              {FINANCING_TYPES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
        )}
        {data.category === "dopyt" && (
          <Field label="Typ dopytu">
            <select value={data.subType} onChange={set("subType")}>
              {DOPYT_SUBTYPES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
        )}
        <Field label="Názov / titul ponuky">
          <input value={data.title} onChange={(e) => { setTitleError(false); setData({ ...data, title: e.target.value }); }} placeholder="napr. Pozemok Košice - Ťahanovce, 4500 m²" />
          {titleError && <p className="field-error">Názov je povinný.</p>}
        </Field>
        <Field label="Lokalita">
          <input value={data.location} onChange={set("location")} placeholder="mestská časť, ulica…" />
        </Field>
        <div className="field-pair">
          <Field label="Cena">
            <input value={data.price} onChange={set("price")} placeholder="napr. 850 000 €" />
          </Field>
          <Field label="Výmera / rozsah">
            <input value={data.area} onChange={set("area")} placeholder="napr. 4 500 m²" />
          </Field>
        </div>
        <div className="field-pair">
          <Field label="Štádium">
            <select value={data.stage} onChange={set("stage")}>
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Priorita">
            <select value={data.priority} onChange={set("priority")}>
              {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Ozvať sa (follow-up dátum)">
          <input type="date" value={data.followUpDate} onChange={set("followUpDate")} />
        </Field>
        <Field label="Tagy (oddelené čiarkou)">
          <input value={data.tagsInput} onChange={set("tagsInput")} placeholder="napr. rýchly predaj, vyžaduje zmenu ÚP" />
        </Field>
        <Field label="Zdroj ponuky">
          <input value={data.source} onChange={set("source")} placeholder="napr. priamy kontakt, maklér, mesto Košice…" />
        </Field>
        <Field label="Prepojená firma">
          <select value={data.companyId} onChange={set("companyId")}>
            <option value="">— žiadna —</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Zdieľať s externými firmami (obmedzený pohľad)">
          <div className="share-checklist">
            {companies.length === 0 && <p className="muted small">Zatiaľ nemáš pridané žiadne firmy.</p>}
            {companies.map((c) => {
              const checked = (data.sharedWith || []).includes(c.id);
              return (
                <label key={c.id} className="share-checkbox">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const cur = data.sharedWith || [];
                      const next = checked ? cur.filter((id) => id !== c.id) : [...cur, c.id];
                      setData({ ...data, sharedWith: next });
                    }}
                  />
                  {c.name}
                </label>
              );
            })}
          </div>
        </Field>
        <Field label="Prepojený kontakt (z databázy)">
          <select value={data.contactId || ""} onChange={set("contactId")}>
            <option value="">— nevybrané, použi text nižšie —</option>
            {contacts.map((k) => <option key={k.id} value={k.id}>{k.name}{k.role ? ` (${k.role})` : ""}</option>)}
          </select>
        </Field>
        <div className="field-pair">
          <Field label="Kontaktná osoba (text, ak nie je v databáze)">
            <input value={data.contactName} onChange={set("contactName")} />
          </Field>
          <Field label="Telefón / email">
            <input value={data.contactInfo} onChange={set("contactInfo")} />
          </Field>
        </div>
        <Field label="Odkaz na inzerát">
          <input value={data.link} onChange={set("link")} placeholder="https://…" />
        </Field>
        <Field label="Popis ponuky (z inzerátu, fakty o nehnuteľnosti)">
          <textarea value={data.description} onChange={set("description")} rows={3} placeholder="napr. prístup z asfaltovej cesty, inžinierske siete na hranici pozemku…" />
        </Field>
        <Field label="Poznámky (tvoje postrehy, čo doriešiť)">
          <textarea value={data.notes} onChange={set("notes")} rows={3} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Zrušiť</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>Uložiť</button>
        </div>
      </div>
    </Modal>
  );
}

function CompanyForm({ initial, companies, onCancel, onSave }) {
  const [data, setData] = useState(initial);
  const [nameError, setNameError] = useState(false);
  const set = (k) => (e) => setData({ ...data, [k]: e.target.value });
  function handleSave() {
    if (!data.name.trim()) { setNameError(true); return; }
    onSave(data);
  }
  const dup = useMemo(() => findDuplicate(companies, data), [companies, data.phone, data.email, data.id]);
  return (
    <Modal title={data.id ? "Upraviť firmu" : "Nová firma"} onClose={onCancel}>
      <div className="form-grid">
        {dup && (
          <p className="dup-warning">⚠ Firma s týmto telefónom/emailom už možno existuje: <strong>{dup.name}</strong></p>
        )}
        <Field label="Názov firmy">
          <input value={data.name} onChange={(e) => { setNameError(false); setData({ ...data, name: e.target.value }); }} />
          {nameError && <p className="field-error">Názov firmy je povinný.</p>}
        </Field>
        <Field label="Typ">
          <select value={data.type} onChange={set("type")}>
            {COMPANY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Kontaktná osoba">
          <input value={data.contactPerson} onChange={set("contactPerson")} />
        </Field>
        <div className="field-pair">
          <Field label="Telefón">
            <input value={data.phone} onChange={set("phone")} />
          </Field>
          <Field label="Email">
            <input value={data.email} onChange={set("email")} />
          </Field>
        </div>
        <Field label="Web">
          <input value={data.website} onChange={set("website")} placeholder="www…" />
        </Field>
        <Field label="Poznámky">
          <textarea value={data.notes} onChange={set("notes")} rows={3} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Zrušiť</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>Uložiť</button>
        </div>
      </div>
    </Modal>
  );
}

function ContactCard({ contact, company, offerCount, onEdit, onDelete }) {
  const cat = contactCategoryMeta(contact.category);
  return (
    <div className="card" style={{ borderLeft: `4px solid ${cat.color}` }}>
      <CornerMarks />
      <div className="card-head">
        <div className="head-pills">
          <span className="cat-pill" style={{ color: cat.color }}><ContactIcon size={13} strokeWidth={1.8} /> {cat.label}</span>
          {contact.role && <span className="sub-pill">{contact.role}</span>}
        </div>
        <div className="card-actions">
          <button className="icon-btn" onClick={onEdit} aria-label="Upraviť"><Pencil size={14} /></button>
          <button className="icon-btn" onClick={onDelete} aria-label="Vymazať"><Trash2 size={14} /></button>
        </div>
      </div>
      <h4 className="card-title">{contact.name || "Bez mena"}</h4>
      {company && <p className="card-company"><Building2 size={12} /> {company.name}</p>}
      <div className="card-data">
        {contact.phone && <span className="data-chip">{contact.phone}</span>}
        {contact.email && <span className="data-chip">{contact.email}</span>}
      </div>
      {contact.notes && <p className="card-notes">{contact.notes}</p>}
      <div className="card-footer">
        <span className="muted small">{offerCount} {offerCount === 1 ? "prepojená ponuka" : "prepojených ponúk"}</span>
      </div>
    </div>
  );
}

function ContactForm({ initial, companies, contacts, onCancel, onSave }) {
  const [data, setData] = useState(initial);
  const [nameError, setNameError] = useState(false);
  const set = (k) => (e) => setData({ ...data, [k]: e.target.value });
  function handleSave() {
    if (!data.name.trim()) { setNameError(true); return; }
    onSave(data);
  }
  const dup = useMemo(() => findDuplicate(contacts, data), [contacts, data.phone, data.email, data.id]);
  return (
    <Modal title={data.id ? "Upraviť kontakt" : "Nový kontakt"} onClose={onCancel}>
      <div className="form-grid">
        {dup && (
          <p className="dup-warning">⚠ Kontakt s týmto telefónom/emailom už možno existuje: <strong>{dup.name}</strong></p>
        )}
        <Field label="Meno a priezvisko">
          <input value={data.name} onChange={(e) => { setNameError(false); setData({ ...data, name: e.target.value }); }} />
          {nameError && <p className="field-error">Meno je povinné.</p>}
        </Field>
        <Field label="Kategória">
          <select value={data.category} onChange={set("category")}>
            {CONTACT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Pozícia / rola">
          <input value={data.role} onChange={set("role")} placeholder="napr. konateľ, projektový manažér…" />
        </Field>
        <div className="field-pair">
          <Field label="Telefón">
            <input value={data.phone} onChange={set("phone")} />
          </Field>
          <Field label="Email">
            <input value={data.email} onChange={set("email")} />
          </Field>
        </div>
        <Field label="Firma">
          <select value={data.companyId} onChange={set("companyId")}>
            <option value="">— žiadna —</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Poznámky">
          <textarea value={data.notes} onChange={set("notes")} rows={3} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Zrušiť</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>Uložiť</button>
        </div>
      </div>
    </Modal>
  );
}

function EventForm({ initial, offers, companies, contacts, onCancel, onSave }) {
  const [data, setData] = useState(initial);
  const [titleError, setTitleError] = useState(false);
  const set = (k) => (e) => setData({ ...data, [k]: e.target.value });
  function handleSave() {
    if (!data.title.trim() || !data.date) { setTitleError(true); return; }
    onSave(data);
  }
  return (
    <Modal title={data.id ? "Upraviť udalosť" : "Nová udalosť"} onClose={onCancel}>
      <div className="form-grid">
        <Field label="Typ udalosti">
          <select value={data.type} onChange={set("type")}>
            {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Názov">
          <input value={data.title} onChange={(e) => { setTitleError(false); setData({ ...data, title: e.target.value }); }} placeholder="napr. Obhliadka pozemku s investorom" />
          {titleError && <p className="field-error">Názov a dátum sú povinné.</p>}
        </Field>
        <Field label="Dátum">
          <input type="date" value={data.date} onChange={(e) => { setTitleError(false); setData({ ...data, date: e.target.value }); }} />
        </Field>
        <div className="field-pair">
          <Field label="Čas od (nepovinné)">
            <input type="time" value={data.time} onChange={set("time")} />
          </Field>
          <Field label="Čas do (nepovinné)">
            <input type="time" value={data.endTime} onChange={set("endTime")} />
          </Field>
        </div>
        <Field label="Miesto">
          <input value={data.location} onChange={set("location")} placeholder="napr. kancelária, na mieste…" />
        </Field>
        <Field label="Prepojená ponuka">
          <select value={data.offerId} onChange={set("offerId")}>
            <option value="">— žiadna —</option>
            {offers.map((o) => <option key={o.id} value={o.id}>{o.title || "Bez názvu"}</option>)}
          </select>
        </Field>
        <Field label="Prepojená firma">
          <select value={data.companyId} onChange={set("companyId")}>
            <option value="">— žiadna —</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Prepojený kontakt">
          <select value={data.contactId} onChange={set("contactId")}>
            <option value="">— žiadny —</option>
            {contacts.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </Field>
        <Field label="Poznámky">
          <textarea value={data.notes} onChange={set("notes")} rows={3} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Zrušiť</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>Uložiť</button>
        </div>
      </div>
    </Modal>
  );
}

function CommCard({ comm, company, contact, offer, onEdit, onDelete }) {
  const dir = commDirectionMeta(comm.direction);
  const st = commStatusMeta(comm.status);
  const DirIcon = comm.direction === "odoslane" ? Send : MailOpen;
  return (
    <div className="card" style={{ borderLeft: `4px solid ${st.color}` }}>
      <CornerMarks />
      <div className="card-head">
        <div className="head-pills">
          <span className="cat-pill" style={{ color: st.color }}><DirIcon size={13} strokeWidth={1.8} /> {dir.label}</span>
        </div>
        <div className="card-actions">
          <button className="icon-btn" onClick={onEdit} aria-label="Upraviť"><Pencil size={14} /></button>
          <button className="icon-btn" onClick={onDelete} aria-label="Vymazať"><Trash2 size={14} /></button>
        </div>
      </div>
      <h4 className="card-title">{comm.subject || "Bez predmetu"}</h4>
      {comm.date && <p className="card-sub"><CalendarClock size={12} /> {new Date(comm.date).toLocaleDateString("sk-SK")} · {commChannelMeta(comm.channel).label}</p>}
      <div className="card-data">
        <span className="table-tag" style={{ color: st.color, borderColor: st.color }}>{st.label}</span>
      </div>
      {comm.replyByDate && (
        <p className={isOverdue(comm.replyByDate) ? "followup-line followup-overdue" : "followup-line"}>
          <CalendarClock size={12} /> Odpovedať do: {new Date(comm.replyByDate).toLocaleDateString("sk-SK")}
        </p>
      )}
      {company && <p className="card-company"><Building2 size={12} /> {company.name}</p>}
      {contact && <p className="card-contact"><ContactIcon size={12} /> {contact.name}</p>}
      {offer && <p className="card-contact">{offer.title}</p>}
      {comm.summary && <p className="card-notes">{comm.summary}</p>}
      {comm.tags && comm.tags.length > 0 && (
        <div className="tag-row">
          {comm.tags.map((t) => <span className="tag-pill" key={t}>{t}</span>)}
        </div>
      )}
    </div>
  );
}

function CommForm({ initial, offers, companies, contacts, onCancel, onSave }) {
  const [data, setData] = useState({ ...initial, tagsInput: (initial.tags || []).join(", ") });
  const [subjectError, setSubjectError] = useState(false);
  const set = (k) => (e) => setData({ ...data, [k]: e.target.value });
  function handleSave() {
    if (!data.subject.trim()) { setSubjectError(true); return; }
    onSave({ ...data, tags: parseTags(data.tagsInput) });
  }
  return (
    <Modal title={data.id ? "Upraviť komunikáciu" : "Nová komunikácia"} onClose={onCancel}>
      <div className="form-grid">
        <div className="field-pair">
          <Field label="Smer">
            <select value={data.direction} onChange={set("direction")}>
              {COMM_DIRECTIONS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </Field>
          <Field label="Kanál">
            <select value={data.channel} onChange={set("channel")}>
              {COMM_CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Predmet">
          <input value={data.subject} onChange={(e) => { setSubjectError(false); setData({ ...data, subject: e.target.value }); }} placeholder="napr. Cenová ponuka — pozemok Ťahanovce" />
          {subjectError && <p className="field-error">Predmet je povinný.</p>}
        </Field>
        <div className="field-pair">
          <Field label="Dátum">
            <input type="date" value={data.date} onChange={set("date")} />
          </Field>
          <Field label="Stav">
            <select value={data.status} onChange={set("status")}>
              {COMM_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Dokedy treba odpovedať (zobrazí sa aj v kalendári)">
          <input type="date" value={data.replyByDate} onChange={set("replyByDate")} />
        </Field>
        <Field label="Zhrnutie obsahu">
          <textarea value={data.summary} onChange={set("summary")} rows={3} placeholder="Stručne, o čom to bolo…" />
        </Field>
        <Field label="Tagy (oddelené čiarkou)">
          <input value={data.tagsInput} onChange={set("tagsInput")} placeholder="napr. zmluva, cenová ponuka" />
        </Field>
        <Field label="Prepojená firma">
          <select value={data.companyId} onChange={set("companyId")}>
            <option value="">— žiadna —</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Prepojený kontakt">
          <select value={data.contactId} onChange={set("contactId")}>
            <option value="">— žiadny —</option>
            {contacts.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </Field>
        <Field label="Prepojená ponuka">
          <select value={data.offerId} onChange={set("offerId")}>
            <option value="">— žiadna —</option>
            {offers.map((o) => <option key={o.id} value={o.id}>{o.title || "Bez názvu"}</option>)}
          </select>
        </Field>
        <Field label="Poznámky">
          <textarea value={data.notes} onChange={set("notes")} rows={2} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Zrušiť</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>Uložiť</button>
        </div>
      </div>
    </Modal>
  );
}

function FontLoader() {
  return null;
}

function StyleSheet() {
  return (
    <style>{`
      :root {
        --font-display: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        --font-body: 'Segoe UI', system-ui, Arial, sans-serif;
        --font-mono: 'Consolas', 'SFMono-Regular', Menlo, monospace;
        --ink: #1B2A3A;
        --ink-soft: #4C5D6E;
        --paper: #FAFAF8;
        --paper-raised: #FFFFFF;
        --line: #E2E4E0;
        --clay: #B5622D;
        --clay-dark: #954E22;
        --slate: #3D5A73;
      }
      .app-shell { font-family: var(--font-body); background: var(--paper); color: var(--ink); min-height: 100vh; }
      .app-shell.center { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; height: 60vh; }
      .spin { animation: spin 1s linear infinite; color: var(--clay); }
      @keyframes spin { to { transform: rotate(360deg); } }
      .muted { color: var(--ink-soft); font-size: 13px; }
      .muted.small { font-size: 12px; }

      .topbar { position: relative; background: var(--ink); color: #fff; overflow: hidden; }
      .topo-bg {
        position: absolute; inset: 0; opacity: 0.14; pointer-events: none;
        background-image:
          repeating-radial-gradient(circle at 15% 30%, transparent 0, transparent 18px, rgba(255,255,255,0.5) 19px, transparent 20px, transparent 40px),
          repeating-radial-gradient(circle at 85% 70%, transparent 0, transparent 24px, rgba(255,255,255,0.4) 25px, transparent 26px, transparent 50px);
      }
      .topbar-inner { position: relative; max-width: 1100px; margin: 0 auto; padding: 20px 20px 0; }
      .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
      .user-badge { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 12px; padding: 6px 12px; border-radius: 20px; cursor: pointer; font-family: inherit; }
      .user-badge:hover { background: rgba(255,255,255,0.18); }
      .identity-overlay { min-height: 70vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
      .identity-card { background: var(--paper-raised); border: 1px solid var(--line); border-radius: 14px; padding: 28px 24px; max-width: 420px; width: 100%; text-align: center; }
      .identity-icon { color: var(--clay); margin-bottom: 8px; display: flex; justify-content: center; }
      .identity-card h2 { font-family: var(--font-display); font-size: 19px; margin: 0 0 8px; }
      .identity-card .muted { margin-bottom: 18px; }
      .identity-card .form-grid { text-align: left; }
      .identity-hint { font-size: 12px; color: var(--clay-dark); margin: 0; }
      .brand h1 { font-family: var(--font-display); font-size: 20px; margin: 0; letter-spacing: -0.01em; }
      .brand p { margin: 2px 0 0; font-size: 12.5px; color: #C7CEDA; }
      .tabs { display: flex; gap: 4px; overflow-x: auto; }
      .tab { background: none; border: none; color: #C7CEDA; padding: 10px 16px; font-size: 13.5px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; font-family: inherit; }
      .tab.active { color: #fff; border-bottom-color: var(--clay); }
      .tab:hover { color: #fff; }

      .error-banner { background: #FDECEA; color: #A6453A; font-size: 13px; padding: 8px 20px; text-align: center; }

      .content { max-width: 1100px; margin: 0 auto; padding: 24px 20px 60px; }

      .btn { display: inline-flex; align-items: center; gap: 6px; border: none; border-radius: 8px; padding: 9px 14px; font-size: 13.5px; font-weight: 500; cursor: pointer; font-family: inherit; }
      .btn-primary { background: var(--clay); color: #fff; }
      .btn-primary:hover { background: var(--clay-dark); }
      .btn-ghost { background: transparent; color: var(--ink-soft); border: 1px solid var(--line); }
      .btn-ghost:hover { background: #F0F0EE; }
      .btn-danger { background: #A6453A; color: #fff; }

      .icon-btn { background: transparent; border: none; color: var(--ink-soft); cursor: pointer; padding: 5px; border-radius: 6px; display: inline-flex; }
      .icon-btn:hover { background: #EFEEEA; color: var(--ink); }
      .icon-btn.active { background: var(--ink); color: #fff; }

      .toolbar { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
      .toolbar-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
      .search-box { flex: 1; min-width: 200px; display: flex; align-items: center; gap: 8px; background: var(--paper-raised); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; color: var(--ink-soft); }
      .search-box input { border: none; outline: none; background: none; font-size: 13.5px; width: 100%; font-family: inherit; color: var(--ink); }
      .view-toggle { display: flex; gap: 2px; background: var(--paper-raised); border: 1px solid var(--line); border-radius: 8px; padding: 2px; margin-left: auto; }

      .chip-row { display: flex; gap: 6px; flex-wrap: wrap; }
      .chip { background: var(--paper-raised); border: 1px solid var(--line); color: var(--ink-soft); font-size: 12.5px; padding: 6px 11px; border-radius: 20px; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 6px; }
      .chip.active { background: var(--ink); color: #fff; border-color: var(--ink); }
      .chip-ghost.active { background: #fff; color: var(--ink); border-color: var(--ink); font-weight: 600; }
      .chip-tag { border-style: dashed; }
      .chip-tag.active { background: var(--slate); color: #fff; border-color: var(--slate); border-style: solid; }
      .dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex-shrink: 0; }

      .calendar-view { display: flex; flex-direction: column; gap: 14px; }
      .calendar-head { display: flex; align-items: center; justify-content: center; gap: 14px; }
      .calendar-head h3 { font-family: var(--font-display); font-size: 16px; margin: 0; text-transform: capitalize; min-width: 160px; text-align: center; }
      .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
      .calendar-weekdays { margin-bottom: -2px; }
      .calendar-weekday { text-align: center; font-size: 11px; color: var(--ink-soft); font-weight: 600; padding-bottom: 2px; }
      .calendar-day { position: relative; aspect-ratio: 1; border: 1px solid var(--line); background: var(--paper-raised); border-radius: 8px; cursor: pointer; display: flex; align-items: flex-start; justify-content: flex-start; padding: 6px; font-family: inherit; }
      .calendar-day-num { font-size: 12.5px; }
      .calendar-day-out { opacity: 0.35; }
      .calendar-day-today { border-color: var(--clay); border-width: 2px; }
      .calendar-day-selected { background: var(--ink); }
      .calendar-day-selected .calendar-day-num { color: #fff; }
      .calendar-day-dot { position: absolute; bottom: 5px; right: 5px; background: var(--clay); color: #fff; font-size: 10px; font-family: var(--font-mono); border-radius: 50%; min-width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; padding: 0 3px; }
      .calendar-list-panel { min-height: 60px; }
      .calendar-list-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
      .calendar-list-head h3 { margin: 0; }
      .btn-add-event { font-size: 12px; padding: 6px 12px; white-space: nowrap; }
      .recent-list li.event-item { display: block !important; cursor: default; padding: 4px 0; }
      .event-item-row { position: relative; padding-right: 52px; display: flex; align-items: center; gap: 8px; cursor: pointer; }
      .event-item-open .event-item-row .recent-title { text-decoration: underline; }
      .event-time { font-family: var(--font-mono); font-size: 11px; color: var(--ink-soft); display: inline-flex; align-items: center; gap: 3px; }
      .event-delete { position: absolute; right: 0; top: 0; }
      .event-move { position: absolute; right: 24px; top: 0; }
      .event-move-input { position: absolute; right: 0; top: -2px; font-size: 11px; padding: 3px 5px; border: 1px solid var(--slate); border-radius: 5px; font-family: inherit; }
      .event-detail-expand { background: #F6F5F1; border-radius: 8px; padding: 10px 12px; margin-top: 6px; font-size: 12.5px; color: var(--ink); display: flex; flex-direction: column; gap: 4px; }
      .event-detail-expand p { margin: 0; }
      .btn-edit-detail { align-self: flex-start; margin-top: 6px; font-size: 12px; padding: 6px 12px; }
      .dashboard { display: flex; flex-direction: column; gap: 20px; }
      .backup-bar { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
      .demo-bar { display: flex; justify-content: flex-end; gap: 8px; align-items: center; flex-wrap: wrap; }
      .demo-timeframe-select { border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; font-size: 12.5px; font-family: inherit; background: var(--paper-raised); color: var(--ink-soft); }
      .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
      .stat-card { background: var(--paper-raised); border: 1px solid var(--line); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 4px; font-family: inherit; text-align: left; cursor: default; }
      .stat-clickable { cursor: pointer; }
      .stat-clickable:hover { border-color: var(--clay); }
      .stat-active { border-color: var(--ink); border-width: 2px; }
      .contact-stat-grid { margin-bottom: 18px; }
      .stat-total { background: var(--ink); color: #fff; border-color: var(--ink); }
      .stat-num { font-family: var(--font-mono); font-size: 26px; font-weight: 500; }
      .stat-label { font-size: 12.5px; color: var(--ink-soft); }
      .stat-total .stat-label { color: #C7CEDA; }

      .dash-cols { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; }
      @media (max-width: 720px) { .dash-cols { grid-template-columns: 1fr; } }
      .panel { background: var(--paper-raised); border: 1px solid var(--line); border-radius: 10px; padding: 18px; }
      .panel-alert { border-color: #E7C9A8; background: #FFF9F3; }
      .agenda-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
      .agenda-head h3 { margin: 0; }
      .agenda-toggle { display: flex; gap: 6px; }
      .agenda-list li { flex-wrap: wrap; }
      .panel h3 { font-family: var(--font-display); font-size: 14.5px; margin: 0 0 14px; display: flex; align-items: center; gap: 6px; }
      .stage-bars { display: flex; flex-direction: column; gap: 10px; }
      .stage-bar-row { display: grid; grid-template-columns: 130px 1fr 24px; align-items: center; gap: 8px; }
      .stage-bar-label { font-size: 12px; color: var(--ink-soft); display: flex; align-items: center; gap: 6px; }
      .stage-bar-track { background: #EFEEEA; border-radius: 6px; height: 8px; overflow: hidden; }
      .stage-bar-fill { height: 100%; border-radius: 6px; }
      .stage-bar-count { font-family: var(--font-mono); font-size: 12px; text-align: right; }
      .recent-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
      .recent-list li { display: flex; align-items: center; gap: 8px; font-size: 12.5px; }
      .recent-list li.clickable { cursor: pointer; }
      .recent-list li.clickable:hover .recent-title { text-decoration: underline; }
      .recent-title { font-weight: 500; }
      .recent-meta { color: var(--ink-soft); }
      .due-badge { font-family: var(--font-mono); font-size: 11px; background: #F0EFEA; padding: 2px 7px; border-radius: 5px; }
      .due-overdue { background: #FDECEA; color: #A6453A; }

      .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
      .card { position: relative; background: var(--paper-raised); border: 1px solid var(--line); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
      .corner-mark { position: absolute; width: 12px; height: 12px; opacity: 0.35; }
      .corner-tl { top: 6px; left: 6px; border-top: 1.5px solid var(--clay); border-left: 1.5px solid var(--clay); }
      .corner-br { bottom: 6px; right: 6px; border-bottom: 1.5px solid var(--clay); border-right: 1.5px solid var(--clay); }
      .card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; }
      .head-pills { display: flex; flex-direction: column; gap: 3px; }
      .cat-pill { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--slate); display: inline-flex; align-items: center; gap: 5px; font-weight: 600; }
      .cat-pill.small { font-size: 10px; }
      .sub-pill { font-size: 11px; color: var(--ink-soft); }
      .card-actions { display: flex; gap: 2px; flex-shrink: 0; }
      .card-title { font-family: var(--font-display); font-size: 15px; margin: 0; }
      .card-title-clickable { cursor: pointer; }
      .card-title-clickable:hover { text-decoration: underline; }
      .card-sub { font-size: 12.5px; color: var(--ink-soft); margin: 0; display: flex; align-items: center; gap: 4px; }
      .card-data { display: flex; gap: 6px; flex-wrap: wrap; }
      .data-chip { font-family: var(--font-mono); font-size: 12px; background: #F0EFEA; padding: 3px 8px; border-radius: 5px; }
      .data-chip-accent { background: #FFF3E9; color: var(--clay-dark); }
      .card-company { font-size: 12px; color: var(--ink-soft); display: flex; align-items: center; gap: 4px; margin: 0; }
      .card-contact { font-size: 12px; color: var(--ink-soft); margin: 0; display: flex; align-items: center; gap: 4px; }
      .card-link { font-size: 12px; color: var(--clay); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
      .card-link:hover { text-decoration: underline; }
      .followup-line { font-size: 12px; color: var(--ink-soft); margin: 0; display: flex; align-items: center; gap: 4px; }
      .followup-overdue { color: #A6453A; font-weight: 600; }
      .tag-row { display: flex; gap: 5px; flex-wrap: wrap; }
      .tag-pill { font-size: 11px; background: #EAF0F4; color: var(--slate); padding: 2px 8px; border-radius: 10px; }
      .card-notes { font-size: 12.5px; color: var(--ink-soft); border-top: 1px dashed var(--line); padding-top: 8px; margin: 0; }
      .linked-contacts { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; font-size: 11.5px; }
      .linked-contacts-label { color: var(--ink-soft); display: inline-flex; align-items: center; gap: 4px; }
      .linked-contact-pill { background: #EAF0F4; color: var(--slate); border: none; padding: 3px 9px; border-radius: 10px; font-size: 11px; cursor: pointer; font-family: inherit; }
      .linked-contact-pill:hover { background: #DDE7EE; }
      .card-description { font-size: 12.5px; color: var(--ink); margin: 0; }
      .card-footer { margin-top: auto; padding-top: 6px; display: flex; flex-direction: column; gap: 4px; }
      .created-by { font-size: 11px; color: var(--ink-soft); }
      .shared-badge { font-size: 11px; color: var(--slate); font-weight: 500; }
      .btn-export { width: 100%; justify-content: center; margin-top: 6px; }
      .export-textarea { width: 100%; font-family: var(--font-mono); font-size: 11.5px; border: 1px solid var(--line); border-radius: 7px; padding: 10px; background: #F6F5F1; color: var(--ink); resize: vertical; }
      .stage-select { font-size: 12px; border-radius: 6px; border: 1.4px solid; background: none; padding: 5px 8px; font-family: inherit; font-weight: 500; width: 100%; }

      .table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 10px; background: var(--paper-raised); }
      .data-table { width: 100%; border-collapse: collapse; font-size: 12.5px; white-space: nowrap; }
      .data-table th { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--line); cursor: pointer; font-weight: 600; color: var(--ink-soft); user-select: none; display: table-cell; }
      .data-table th:hover { color: var(--ink); }
      .data-table th svg { vertical-align: middle; margin-left: 3px; }
      .data-table td { padding: 9px 12px; border-bottom: 1px solid var(--line); }
      .data-table tr:last-child td { border-bottom: none; }
      .data-table tr:hover td { background: #F7F6F2; }
      .table-sub { color: var(--ink-soft); }
      .table-tag { font-size: 11px; font-weight: 600; border: 1px solid; border-radius: 10px; padding: 2px 8px; }
      .table-overdue { color: #A6453A; font-weight: 600; }
      .btn-table-open { padding: 5px 10px; font-size: 12px; }

      .kanban { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(210px, 1fr); gap: 12px; overflow-x: auto; padding-bottom: 8px; }
      .kanban-col { background: #F2F1EC; border-radius: 10px; display: flex; flex-direction: column; min-height: 120px; }
      .kanban-col-head { display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; padding: 10px 12px; border-top: 3px solid; border-radius: 10px 10px 0 0; background: var(--paper-raised); }
      .kanban-count { margin-left: auto; font-family: var(--font-mono); font-weight: 400; color: var(--ink-soft); }
      .kanban-col-body { padding: 10px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
      .kanban-card { background: var(--paper-raised); border: 1px solid var(--line); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 5px; }
      .kanban-title { font-size: 13px; font-weight: 500; margin: 0; }
      .kanban-loc { font-size: 11.5px; color: var(--ink-soft); margin: 0; display: flex; align-items: center; gap: 3px; }
      .kanban-move { display: flex; gap: 4px; margin-top: 3px; }
      .kanban-move-btn { background: none; border: 1px solid var(--line); border-radius: 5px; padding: 3px 5px; cursor: pointer; }
      .kanban-empty { font-size: 12px; color: #A9A9A2; text-align: center; padding: 12px 0; }

      .empty-state { position: relative; border: 1px dashed var(--line); border-radius: 10px; padding: 40px 20px; text-align: center; color: var(--ink-soft); font-size: 13.5px; }
      .empty-frame { position: absolute; inset: 10px; pointer-events: none; }

      .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--ink); color: #fff; padding: 10px 20px; border-radius: 24px; font-size: 13.5px; font-weight: 500; z-index: 100; box-shadow: 0 4px 16px rgba(0,0,0,0.25); }
      .modal-overlay { position: fixed; inset: 0; background: rgba(27,42,58,0.45); display: flex; align-items: flex-end; justify-content: center; z-index: 50; }
      @media (min-width: 640px) { .modal-overlay { align-items: center; } }
      .modal-panel { background: var(--paper-raised); border-radius: 14px 14px 0 0; width: 100%; max-width: 480px; max-height: 88vh; overflow-y: auto; }
      @media (min-width: 640px) { .modal-panel { border-radius: 14px; } }
      .modal-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 18px; border-bottom: 1px solid var(--line); position: sticky; top: 0; background: var(--paper-raised); }
      .modal-head h3 { font-family: var(--font-display); font-size: 16px; margin: 0; }
      .modal-body { padding: 18px; }
      .modal-actions { display: flex; justify-content: flex-end; gap: 8px; position: sticky; bottom: 0; background: var(--paper-raised); margin: 10px -18px -18px; padding: 12px 18px; border-top: 1px solid var(--line); }
      .confirm-text { font-size: 13.5px; }

      .form-grid { display: flex; flex-direction: column; gap: 14px; }
      .field { display: flex; flex-direction: column; gap: 5px; }
      .field-label { font-size: 12px; color: var(--ink-soft); font-weight: 500; }
      .field-error { font-size: 11.5px; color: #A6453A; margin: -3px 0 0; }
      .bulk-bar { background: #EFF3F6; border: 1px solid var(--slate); border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 8px; }
      .bulk-bar-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .bulk-count { font-weight: 600; font-size: 13px; color: var(--slate); }
      .bulk-label { font-size: 12.5px; color: var(--ink-soft); }
      .bulk-tag-input { border: 1px solid var(--line); border-radius: 7px; padding: 6px 10px; font-size: 12.5px; font-family: inherit; }
      .bulk-delete-btn { margin-left: auto; }
      .bulk-checkbox { padding: 2px; color: var(--slate); }
      .card-selected { outline: 2px solid var(--slate); outline-offset: -1px; }
      .row-selected td { background: #EFF3F6; }
      .detail-view { display: flex; flex-direction: column; gap: 10px; }
      .detail-title { font-family: var(--font-display); font-size: 18px; margin: 0; }
      .detail-row { font-size: 13px; color: var(--ink-soft); margin: 0; display: flex; align-items: center; gap: 6px; }
      .detail-badges { display: flex; gap: 6px; flex-wrap: wrap; }
      .detail-block { border-top: 1px dashed var(--line); padding-top: 8px; }
      .detail-block-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-soft); font-weight: 600; margin: 0 0 3px; }
      .detail-block p:last-child { margin: 0; font-size: 13px; }
      .dup-warning { font-size: 12.5px; color: #954E22; background: #FFF3E9; border: 1px solid #E7C9A8; border-radius: 7px; padding: 8px 10px; margin: 0; }
      .field input, .field select, .field textarea { border: 1px solid var(--line); border-radius: 7px; padding: 8px 10px; font-size: 13.5px; font-family: inherit; color: var(--ink); background: var(--paper); }
      .field input:focus, .field select:focus, .field textarea:focus { outline: 2px solid var(--clay); outline-offset: 1px; }
      .field-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .share-checklist { display: flex; flex-direction: column; gap: 6px; max-height: 160px; overflow-y: auto; border: 1px solid var(--line); border-radius: 7px; padding: 8px 10px; }
      .share-checkbox { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    `}</style>
  );
}
