import React, { useState } from "react";
import { Plus, Trash2, FileText, Phone, Copy, Calendar, CircleCheck as CheckCircle, Wrench, TriangleAlert as AlertTriangle, ExternalLink } from "lucide-react";

interface HouseDocument {
  id: string;
  title: string;
  category: "Aluguel" | "Contas" | "Plantas/Manual" | "Seguro" | "Outro";
  link: string;
  date_added: string;
}

interface MaintenanceAlert {
  id: string;
  title: string;
  category: "Limpeza" | "Elétrica" | "Hidráulica" | "Eletrodomésticos" | "Outro";
  due_date: string;
  status: "pending" | "completed";
  completed_at?: string;
  points: number;
}

interface ImportantContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
}

// Default/mock values if none in state to provide seed data that are easily manageable
const DEFAULT_CONTACTS: ImportantContact[] = [
  { id: "c1", name: "Sr. João (Encanador)", role: "Hidráulica e Reparos urgentes", phone: "(11) 98888-7777" },
  { id: "c2", name: "Dra. Ana (Clínica Veterinária Vets)", role: "Veterinária 24h", phone: "(11) 3222-1111", email: "contato@vetspet.com" },
  { id: "c3", name: "Imobiliária Lar Feliz (Contrato)", role: "Aluguel e Contrato de Locação", phone: "(11) 4004-9999" }
];

const DEFAULT_MAINTENANCE: MaintenanceAlert[] = [
  { id: "m1", title: "Limpar o filtro do Ar Condicionado", category: "Eletrodomésticos", due_date: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0], status: "pending", points: 15 },
  { id: "m2", title: "Dedetização anual do apartamento", category: "Limpeza", due_date: new Date(Date.now() + 86400000 * 20).toISOString().split("T")[0], status: "pending", points: 30 }
];

interface HouseTabProps {
  triggerCustomNotify: (msg: string, type: "success" | "error" | "info") => void;
  triggerCustomConfirm: (msg: string, action: () => void) => void;
}

export default function HouseTab({ 
  triggerCustomNotify, 
  triggerCustomConfirm 
}: HouseTabProps) {
  // Load local state or use defaults so user data is persisted inside standard localStorage safely
  const [contacts, setContacts] = useState<ImportantContact[]>(() => {
    const saved = localStorage.getItem("nosdois_house_contacts");
    return saved ? JSON.parse(saved) : DEFAULT_CONTACTS;
  });

  const [maintenance, setMaintenance] = useState<MaintenanceAlert[]>(() => {
    const saved = localStorage.getItem("nosdois_house_maintenance");
    return saved ? JSON.parse(saved) : DEFAULT_MAINTENANCE;
  });

  const [docs, setDocs] = useState<HouseDocument[]>(() => {
    const saved = localStorage.getItem("nosdois_house_docs");
    return saved ? JSON.parse(saved) : [
      { id: "d1", title: "Contrato de Aluguel Assinado", category: "Aluguel", link: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format", date_added: "2026-05-10" }
    ];
  });

  // State triggers and input drafts
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isAddingMaint, setIsAddingMaint] = useState(false);

  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState<any>("Contas");
  const [docLink, setDocLink] = useState("");

  const [maintTitle, setMaintTitle] = useState("");
  const [maintCategory, setMaintCategory] = useState<any>("Limpeza");
  const [maintDueDate, setMaintDueDate] = useState("");

  const [contName, setContName] = useState("");
  const [contRole, setContRole] = useState("");
  const [contPhone, setContPhone] = useState("");
  const [contEmail, setContEmail] = useState("");

  const saveToLocal = (key: string, val: any) => {
    localStorage.setItem(key, JSON.stringify(val));
  };

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    const newDoc: HouseDocument = {
      id: "doc_" + Date.now(),
      title: docTitle,
      category: docCategory,
      link: docLink || "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format",
      date_added: new Date().toISOString().split("T")[0]
    };

    const updated = [...docs, newDoc];
    setDocs(updated);
    saveToLocal("nosdois_house_docs", updated);
    triggerCustomNotify("Documento registrado com sucesso! 📂", "success");
    setDocTitle("");
    setDocLink("");
    setIsAddingDoc(false);
  };

  const handleDeleteDoc = (id: string, name: string) => {
    triggerCustomConfirm(`Deseja apagar o documento "${name}"?`, () => {
      const updated = docs.filter(item => item.id !== id);
      setDocs(updated);
      saveToLocal("nosdois_house_docs", updated);
      triggerCustomNotify("Documento removido", "info");
    });
  };

  const handleAddMaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintTitle.trim()) return;

    const newMaint: MaintenanceAlert = {
      id: "maint_" + Date.now(),
      title: maintTitle,
      category: maintCategory,
      due_date: maintDueDate || new Date().toISOString().split("T")[0],
      status: "pending",
      points: maintCategory === "Urgente" ? 30 : 15
    };

    const updated = [...maintenance, newMaint];
    setMaintenance(updated);
    saveToLocal("nosdois_house_maintenance", updated);
    triggerCustomNotify("Manutenção agendada! 🔧", "success");
    setMaintTitle("");
    setMaintDueDate("");
    setIsAddingMaint(false);
  };

  const handleToggleMaint = (id: string) => {
    const updated = maintenance.map(m => {
      if (m.id === id) {
        const isCompleted = m.status === "completed";
        return {
          ...m,
          status: isCompleted ? "pending" as const : "completed" as const,
          completed_at: isCompleted ? undefined : new Date().toISOString()
        };
      }
      return m;
    });
    setMaintenance(updated);
    saveToLocal("nosdois_house_maintenance", updated);
    triggerCustomNotify("Status da manutenção atualizado!", "success");
  };

  const handleDeleteMaint = (id: string) => {
    const updated = maintenance.filter(item => item.id !== id);
    setMaintenance(updated);
    saveToLocal("nosdois_house_maintenance", updated);
    triggerCustomNotify("Alerta de manutenção excluído", "info");
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contName.trim() || !contPhone.trim()) {
      triggerCustomNotify("Nome e Telefone são campos obrigatórios", "error");
      return;
    }

    const newCont: ImportantContact = {
      id: "cont_" + Date.now(),
      name: contName,
      role: contRole,
      phone: contPhone,
      email: contEmail || undefined
    };

    const updated = [...contacts, newCont];
    setContacts(updated);
    saveToLocal("nosdois_house_contacts", updated);
    triggerCustomNotify("Contato adicionado com sucesso!", "success");
    setContName("");
    setContRole("");
    setContPhone("");
    setContEmail("");
    setIsAddingContact(false);
  };

  const handleDeleteContact = (id: string, name: string) => {
    triggerCustomConfirm(`Deseja mesmo remover o contato "${name}"?`, () => {
      const updated = contacts.filter(item => item.id !== id);
      setContacts(updated);
      saveToLocal("nosdois_house_contacts", updated);
      triggerCustomNotify("Contato removido", "info");
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerCustomNotify("Número copiado para a área de transferência! 📋", "success");
  };

  return (
    <div className="flex-1 flex flex-col gap-4 animate-fade-in text-slate-800" id="house-tab-root">
      
      {/* Tab Header */}
      <div className="border-b border-slate-100 pb-3" id="house-header">
        <h2 className="font-bold text-slate-900 text-base font-display flex items-center gap-1.5">
          <span>🏡</span> Casa & Contatos do Lar
        </h2>
        <p className="text-xs text-slate-500">Documentação do imóvel, manutenções rotineiras e agenda de contatos importantes! 🛠️💼</p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="house-workspace-grid">
        
        {/* Left column: Documents & Cofre */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-4 shadow-3xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-600" /> Cofre do Lar (Documentos)
            </h3>
            <button
              onClick={() => setIsAddingDoc(!isAddingDoc)}
              className="text-sky-600 font-bold text-xs hover:underline flex items-center gap-0.5 whitespace-nowrap"
            >
              {isAddingDoc ? "Fechar" : "+ Enviar"}
            </button>
          </div>

          {/* Add Doc form inside */}
          {isAddingDoc && (
            <form onSubmit={handleAddDoc} className="bg-slate-50 p-3 rounded-2xl border border-sky-100/50 flex flex-col gap-2 animate-fade-in">
              <input
                type="text"
                placeholder="Título do Documento (Ex: IPTU/2026)"
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                required
              />
              <select
                value={docCategory}
                onChange={e => setDocCategory(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-sky-550"
              >
                <option value="Aluguel">Aluguel</option>
                <option value="Contas">Contas</option>
                <option value="Plantas/Manual">Plantas / Manuais</option>
                <option value="Seguro">Seguro</option>
                <option value="Outro">Outro</option>
              </select>
              <input
                type="text"
                placeholder="URL Simulado do PDF/Imagem"
                value={docLink}
                onChange={e => setDocLink(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
              />
              <button type="submit" className="w-full bg-sky-600 text-white font-bold text-xs py-1.5 rounded-xl">
                Salvar Documento 📂
              </button>
            </form>
          )}

          {/* Docs list */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[180px] lg:max-h-[300px]">
            {docs.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">Nenhum documento anexado ao cofre da casa.</p>
            ) : (
              docs.map(doc => (
                <div key={doc.id} className="flex justify-between items-center p-2.5 rounded-2xl bg-slate-50 text-xs border border-slate-100">
                  <div className="truncate pr-1.5">
                    <a href={doc.link} target="_blank" rel="noreferrer" className="font-bold text-sky-700 hover:underline flex items-center gap-1">
                      <span className="truncate">{doc.title}</span> <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span className="text-[9px] text-slate-400 bg-slate-200/50 px-1.5 py-0.2 rounded-full font-bold ml-1">{doc.category}</span>
                  </div>
                  <button onClick={() => handleDeleteDoc(doc.id, doc.title)} className="text-slate-400 hover:text-red-500 transition pl-1.5 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center column: Manutenções e alertas */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-4 shadow-3xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-emerald-600" /> Agenda de Manutenção
            </h3>
            <button
              onClick={() => setIsAddingMaint(!isAddingMaint)}
              className="text-emerald-600 font-bold text-xs hover:underline flex items-center gap-0.5 whitespace-nowrap"
            >
              {isAddingMaint ? "Fechar" : "+ Agendar"}
            </button>
          </div>

          {isAddingMaint && (
            <form onSubmit={handleAddMaint} className="bg-slate-50 p-3 rounded-2xl border border-emerald-100/50 flex flex-col gap-2 animate-fade-in">
              <input
                type="text"
                placeholder="Ex: Dedetização, Troca do Filtro"
                value={maintTitle}
                onChange={e => setMaintTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={maintCategory}
                  onChange={e => setMaintCategory(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-1.5 py-1 text-xs"
                >
                  <option value="Limpeza">Limpeza</option>
                  <option value="Elétrica">Elétrica</option>
                  <option value="Hidráulica">Hidráulica</option>
                  <option value="Eletrodomésticos">Eletros</option>
                  <option value="Outro">Outro</option>
                </select>
                <input
                  type="date"
                  value={maintDueDate}
                  onChange={e => setMaintDueDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-1.5 py-1 text-xs"
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold text-xs py-1.5 rounded-xl mt-1">
                Salvar Agendamento 🛠️
              </button>
            </form>
          )}

          {/* Maintenance list */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[180px] lg:max-h-[300px]">
            {maintenance.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">Sem manutenções agendadas de momento.</p>
            ) : (
              maintenance.map(m => (
                <div key={m.id} className={`flex items-start justify-between p-2.5 rounded-2xl text-xs border ${
                  m.status === "completed" 
                    ? "bg-slate-50/50 border-slate-100 text-slate-400 line-through" 
                    : "bg-white border-emerald-100/65 text-slate-800"
                }`}>
                  <div className="flex gap-2 items-start flex-1 truncate pr-1">
                    <input
                      type="checkbox"
                      checked={m.status === "completed"}
                      onChange={() => handleToggleMaint(m.id)}
                      className="mt-0.5 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-3.5 w-3.5 shrink-0"
                    />
                    <div className="truncate flex flex-col">
                      <span className="font-semibold truncate">{m.title}</span>
                      <span className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" /> Prazo: {new Date(m.due_date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteMaint(m.id)} className="text-slate-300 hover:text-red-500 transition shrink-0 pl-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Important Contacts */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-4 shadow-3xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-sky-500" /> Agenda do Lar (Contatos)
            </h3>
            <button
              onClick={() => setIsAddingContact(!isAddingContact)}
              className="text-indigo-600 font-bold text-xs hover:underline flex items-center gap-0.5 whitespace-nowrap"
            >
              {isAddingContact ? "Fechar" : "+ Contato"}
            </button>
          </div>

          {isAddingContact && (
            <form onSubmit={handleAddContact} className="bg-slate-50 p-3 rounded-2xl border border-indigo-100/50 flex flex-col gap-2 animate-fade-in">
              <input
                type="text"
                placeholder="Nome do Contrato / Empresa"
                value={contName}
                onChange={e => setContName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                required
              />
              <input
                type="text"
                placeholder="Especialidade / Role"
                value={contRole}
                onChange={e => setContRole(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="Telefone / WhatsApp"
                value={contPhone}
                onChange={e => setContPhone(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                required
              />
              <input
                type="email"
                placeholder="Email (opcional)"
                value={contEmail}
                onChange={e => setContEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
              />
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold text-xs py-1.5 rounded-xl mt-1">
                Salvar Contato 📞
              </button>
            </form>
          )}

          {/* Contacts List */}
          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[180px] lg:max-h-[300px]">
            {contacts.map(c => (
              <div key={c.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50 flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900">{c.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{c.role}</p>
                  </div>
                  <button onClick={() => handleDeleteContact(c.id, c.name)} className="text-slate-350 hover:text-rose-500 transition pl-2 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-slate-100/60 pt-1.5 bg-white/70 rounded-xl px-2.5 py-1">
                  <span className="font-semibold text-[11px] text-slate-700">{c.phone}</span>
                  <button 
                    onClick={() => copyToClipboard(c.phone)} 
                    className="p-1 text-slate-450 hover:text-indigo-600"
                    title="Copiar Número"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
