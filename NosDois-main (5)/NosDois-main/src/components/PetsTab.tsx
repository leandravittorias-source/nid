import React, { useState } from "react";
import { Plus, Trash2, CreditCard as Edit3, FileText, Activity, Scale, ShieldCheck, FileUp, Heart, Calendar, TriangleAlert as AlertTriangle } from "lucide-react";
import { Pet, PetSpecies, PetVaccine, PetMedication, PetWeightRecord, PetDocument, InventoryItem } from "../types";

const PET_SPECIES_OPTIONS: { value: PetSpecies; label: string; emoji: string }[] = [
  { value: "Cachorro", label: "Cachorro", emoji: "🐶" },
  { value: "Gato", label: "Gato", emoji: "🐱" },
  { value: "Passaro", label: "Passaro", emoji: "🐦" },
  { value: "Roedor", label: "Roedor", emoji: "🐹" },
  { value: "Outros", label: "Outros", emoji: "🐾" },
];

interface PetsTabProps {
  pets: Pet[];
  inventory: InventoryItem[];
  currentUser: any;
  partnerUser: any;
  coupleId?: string;
  triggerCustomNotify: (msg: string, type: "success" | "error" | "info") => void;
  triggerCustomConfirm: (msg: string, action: () => void) => void;
  onRefresh: () => void;
}

export default function PetsTab({
  pets,
  inventory,
  currentUser,
  partnerUser,
  coupleId,
  triggerCustomNotify,
  triggerCustomConfirm,
  onRefresh
}: PetsTabProps) {
  const [selectedPetId, setSelectedPetId] = useState<string | null>(pets[0]?.id || null);
  const [isAddingPet, setIsAddingPet] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  // Forms Draft States
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState<PetSpecies>("Cachorro");
  const [petBreed, setPetBreed] = useState("");
  const [petAge, setPetAge] = useState("");
  const [petAvatar, setPetAvatar] = useState("");
  const [foodDailyQty, setFoodDailyQty] = useState("");
  const [foodInvItemId, setFoodInvItemId] = useState("");

  const [vaccineName, setVaccineName] = useState("");
  const [vaccineDate, setVaccineDate] = useState("");
  const [vaccineNextDate, setVaccineNextDate] = useState("");
  const [vaccineApplied, setVaccineApplied] = useState(true);

  const [medName, setMedName] = useState("");
  const [medType, setMedType] = useState<any>("Remédio");
  const [medDate, setMedDate] = useState("");
  const [medNotes, setMedNotes] = useState("");

  const [weightVal, setWeightVal] = useState("");
  const [weightDate, setWeightDate] = useState("");

  const [docTitle, setDocTitle] = useState("");
  const [docLink, setDocLink] = useState("");

  const activePet = pets.find(p => p.id === selectedPetId) || pets[0];

  const petFetch = async (url: string, body: Record<string, any>) => {
    const activeCoupleId = coupleId || localStorage.getItem("nosdois_coupleId") || "couple_1";
    const activeUserId = (typeof currentUser === "string" ? currentUser : currentUser?.id) || localStorage.getItem("nosdois_userId") || "Leandro";
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-couple-id": activeCoupleId,
        "x-user-id": activeUserId,
      },
      body: JSON.stringify({ ...body, coupleId: activeCoupleId, userId: activeUserId }),
    });
  };

  const handleCreatePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petName.trim()) {
      triggerCustomNotify("Por favor, informe o nome do pet", "error");
      return;
    }

    try {
      const res = await petFetch("/api/pets/create", {
        name: petName,
        species: petSpecies,
        breed: petBreed,
        age: petAge ? parseInt(petAge, 10) : undefined,
        avatar_url: petAvatar || undefined,
        food_daily_qty: foodDailyQty ? parseInt(foodDailyQty, 10) : undefined,
        food_inventory_item_id: foodInvItemId || undefined,
      });
      const data = await res.json();
      if (data.success) {
        triggerCustomNotify(`${petName} foi adicionado(a) com sucesso! 🐾`, "success");
        setIsAddingPet(false);
        setPetName("");
        setPetSpecies("Cachorro");
        setPetBreed("");
        setPetAge("");
        setPetAvatar("");
        setFoodDailyQty("");
        setFoodInvItemId("");
        onRefresh();
      } else {
        triggerCustomNotify(data.error || "Ocorreu um erro", "error");
      }
    } catch (err) {
      triggerCustomNotify("Erro de rede ao criar pet", "error");
    }
  };

  const handleDeletePet = (id: string, name: string) => {
    triggerCustomConfirm(`Tem certeza que deseja remover ${name} do lar? Isso apagará todo seu histórico.`, async () => {
      try {
        const res = await petFetch("/api/pets/delete", { id });
        const data = await res.json();
        if (data.success) {
          triggerCustomNotify(`${name} foi removido(a)`, "success");
          setSelectedPetId(null);
          onRefresh();
        }
      } catch (err) {
        triggerCustomNotify("Erro de rede", "error");
      }
    });
  };

  const handleUpdateField = async (updatedPet: Pet) => {
    try {
      const res = await petFetch("/api/pets/update", updatedPet as any);
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      triggerCustomNotify("Erro ao registrar no servidor", "error");
    }
  };

  // Add sub-record handlers
  const handleAddVaccine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePet || !vaccineName) return;

    const newVac: PetVaccine = {
      id: "vac_" + Date.now(),
      name: vaccineName,
      date_applied: vaccineDate || new Date().toISOString().split("T")[0],
      next_dose_date: vaccineNextDate || undefined,
      is_completed: vaccineApplied
    };

    const updated = {
      ...activePet,
      vaccines: [...activePet.vaccines, newVac]
    };

    await handleUpdateField(updated);
    triggerCustomNotify("Vacina registrada com sucesso!", "success");
    setVaccineName("");
    setVaccineDate("");
    setVaccineNextDate("");
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePet || !medName) return;

    const newMed: PetMedication = {
      id: "med_" + Date.now(),
      name: medName,
      type: medType,
      date: medDate || new Date().toISOString().split("T")[0],
      notes: medNotes || undefined
    };

    const updated = {
      ...activePet,
      medications: [...activePet.medications, newMed]
    };

    await handleUpdateField(updated);
    triggerCustomNotify("Medicamento/Tratamento lançado!", "success");
    setMedName("");
    setMedNotes("");
    setMedDate("");
  };

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePet || !weightVal) return;

    const newWeight: PetWeightRecord = {
      id: "wt_" + Date.now(),
      weight: parseFloat(weightVal),
      date: weightDate || new Date().toISOString().split("T")[0]
    };

    const updated = {
      ...activePet,
      weights: [...activePet.weights, newWeight]
    };

    await handleUpdateField(updated);
    triggerCustomNotify("Registro de peso atualizado!", "success");
    setWeightVal("");
    setWeightDate("");
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePet || !docTitle) return;

    const newDoc: PetDocument = {
      id: "doc_" + Date.now(),
      title: docTitle,
      link: docLink || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format",
      date_created: new Date().toISOString().split("T")[0]
    };

    const updated = {
      ...activePet,
      documents: [...activePet.documents, newDoc]
    };

    await handleUpdateField(updated);
    triggerCustomNotify("Documento anexado no cofre!", "success");
    setDocTitle("");
    setDocLink("");
  };

  const handleRemoveSubItem = async (listKey: "vaccines" | "medications" | "weights" | "documents", itemId: string) => {
    if (!activePet) return;
    const filtered = (activePet[listKey] as any[]).filter(itm => itm.id !== itemId);
    const updated = {
      ...activePet,
      [listKey]: filtered
    };
    await handleUpdateField(updated);
    triggerCustomNotify("Item removido", "info");
  };

  return (
    <div className="flex-1 flex flex-col gap-4 animate-fade-in text-slate-800" id="pets-tab-root">
      
      {/* Intro and Register button */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="pets-header">
        <div>
          <h2 className="font-bold text-slate-900 text-base font-display flex items-center gap-1.5">
            <span>🐾</span> Controle de Pets do Lar
          </h2>
          <p className="text-xs text-slate-500">Acompanhe a saúde, vacinas, ração e documentos dos bichinhos! 🐶🐱</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddingPet(!isAddingPet)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shrink-0"
        >
          <Plus className="w-4 h-4" /> {isAddingPet ? "Fechar" : "Novo Pet"}
        </button>
      </div>

      {/* Adding Pet Form Card */}
      {isAddingPet && (
        <form onSubmit={handleCreatePet} className="bg-white border border-teal-100 rounded-3xl p-4 shadow-3xs flex flex-col gap-3 animate-fade-in" id="add-pet-form">
          <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-teal-600" /> Cadastrar Novo Companheiro(a)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome do Pet *</label>
              <input
                type="text"
                placeholder="Ex: Luke, Mel, Simba"
                value={petName}
                onChange={e => setPetName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Animal *</label>
              <select
                value={petSpecies}
                onChange={e => setPetSpecies(e.target.value as PetSpecies)}
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500"
                required
              >
                {PET_SPECIES_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Raça (opcional)</label>
              <input
                type="text"
                placeholder="Ex: Golden, Vira-lata, SRD"
                value={petBreed}
                onChange={e => setPetBreed(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Idade aproximada (anos)</label>
              <input
                type="number"
                placeholder="Ex: 3"
                value={petAge}
                onChange={e => setPetAge(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Foto URL (opcional)</label>
              <input
                type="text"
                placeholder="Insira um link de imagem"
                value={petAvatar}
                onChange={e => setPetAvatar(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Consumo de ração diário (gramas)</label>
              <input
                type="number"
                placeholder="Ex: 250"
                value={foodDailyQty}
                onChange={e => setFoodDailyQty(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vincular Item do Estoque (Auto-compras)</label>
              <select
                value={foodInvItemId}
                onChange={e => setFoodInvItemId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs"
              >
                <option value="">Nenhum item do estoque associado</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantity} {item.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-3xs transition"
          >
            Adicionar Pet ao Lar 🌸
          </button>
        </form>
      )}

      {/* Horizontal List of Pets Buttons */}
      {pets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" id="pets-quick-selector">
          {pets.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPetId(p.id)}
              className={`px-4 py-2 rounded-2xl border text-xs font-bold transition shrink-0 flex items-center gap-2 ${
                (activePet && activePet.id === p.id)
                  ? "bg-teal-550 border-teal-500 text-white"
                  : "bg-white border-slate-100 hover:bg-slate-50 text-slate-705"
              }`}
            >
              <img src={p.avatar_url} alt={p.name} className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Main Empty State */}
      {pets.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-2.5 py-12" id="pets-empty-state">
          <span className="text-4xl">🐕🐾🐈</span>
          <h3 className="font-bold text-slate-900 text-sm mt-2">Nenhum pet registrado</h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Registre os peludinhos para organizar as doses de vacinas, lembretes de exames, medicamentos recorrentes e calcular o consumo mensal de ração automaticamente!
          </p>
          <button
            onClick={() => setIsAddingPet(true)}
            className="mt-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
          >
            Registrar Primeiro Pet!
          </button>
        </div>
      ) : (
        activePet && (
          <div className="flex flex-col gap-4 animate-fade-in" id="active-pet-details">
            
            {/* Companion Header Card with info */}
            <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-3xs flex items-center justify-between gap-4" id="pet-info-card">
              <div className="flex items-center gap-3.5">
                <img 
                  src={activePet.avatar_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format"} 
                  alt={activePet.name} 
                  className="w-14 h-14 rounded-full border-2 border-teal-100 object-cover shrink-0 shadow-3xs"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-950 text-base">{activePet.name}</h3>
                    {activePet.species && (
                      <span className="bg-teal-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full">
                        {PET_SPECIES_OPTIONS.find(o => o.value === activePet.species)?.emoji} {activePet.species}
                      </span>
                    )}
                    {activePet.breed && <span className="bg-teal-50 text-teal-700 font-bold text-[9px] px-2 py-0.5 rounded-full">{activePet.breed}</span>}
                  </div>
                  <p className="text-xs text-slate-500">
                    {activePet.age ? `${activePet.age} anos de gostosura` : "Idade não informada"} • Ração diária: {activePet.food_daily_qty ? `${activePet.food_daily_qty}g` : "Não informada"}
                  </p>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => handleDeletePet(activePet.id, activePet.name)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                title="Excluir Pet"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Pet Care grids: vaccines & medications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="pet-care-grid">
              
              {/* Carteira de vacinação */}
              <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-3xs flex flex-col gap-3">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>💉 Carteira de Vacinação</span>
                  <span className="text-[10px] text-teal-600 font-bold">{activePet.vaccines?.length || 0} Dose(s)</span>
                </h4>

                {/* List vaccines */}
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {(activePet.vaccines || []).length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-2">Nenhuma vacina cadastrada ainda.</p>
                  ) : (
                    activePet.vaccines.map(v => (
                      <div key={v.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            {v.is_completed ? <span className="text-emerald-500 font-bold font-sans">✓</span> : <span className="text-amber-500">⏳</span>}
                            {v.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Aplicada em: {new Date(v.date_applied).toLocaleDateString("pt-BR")}
                            {v.next_dose_date && ` • Próxima: ${new Date(v.next_dose_date).toLocaleDateString("pt-BR")}`}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleRemoveSubItem("vaccines", v.id)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Mini Vaccine form */}
                <form onSubmit={handleAddVaccine} className="border-t border-slate-50 pt-2.5 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nome da Vacina"
                      value={vaccineName}
                      onChange={e => setVaccineName(e.target.value)}
                      className="col-span-2 w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                      required
                    />
                    <input
                      type="date"
                      value={vaccineDate}
                      onChange={e => setVaccineDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs"
                      title="Data de Aplicação"
                    />
                    <input
                      type="date"
                      value={vaccineNextDate}
                      onChange={e => setVaccineNextDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs"
                      title="Próxima Dose (Reforço)"
                    />
                  </div>
                  <button type="submit" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-1.5 rounded-xl transition flex items-center justify-center gap-1">
                    <Plus className="w-3 h-3" /> Lançar Vacina
                  </button>
                </form>
              </div>

              {/* Log de medicamentos */}
              <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-3xs flex flex-col gap-3">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>💊 Medicamentos & Tratamentos</span>
                  <span className="text-[10px] text-teal-600 font-bold">{activePet.medications?.length || 0} Registro(s)</span>
                </h4>

                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {(activePet.medications || []).length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-2">Nenhum tratamento em andamento.</p>
                  ) : (
                    activePet.medications.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-teal-50/20 border border-teal-100/30 text-xs">
                        <div>
                          <p className="font-bold text-slate-900">
                            [{m.type}] {m.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Data: {new Date(m.date).toLocaleDateString("pt-BR")}
                            {m.notes && ` • Observações: ${m.notes}`}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleRemoveSubItem("medications", m.id)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddMedication} className="border-t border-slate-50 pt-2.5 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Vermífugo, Anti-pulgas"
                      value={medName}
                      onChange={e => setMedName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs col-span-2"
                      required
                    />
                    <select
                      value={medType}
                      onChange={e => setMedType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs"
                    >
                      <option value="Antiparasitário">Antiparasitário</option>
                      <option value="Remédio">Medicamento</option>
                      <option value="Banho/Tosa">Banho / Tosa</option>
                      <option value="Consulta">Consulta Vet</option>
                      <option value="Outro">Outro</option>
                    </select>
                    <input
                      type="date"
                      value={medDate}
                      onChange={e => setMedDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Observações (Ex: 1/2 comprimido)"
                      value={medNotes}
                      onChange={e => setMedNotes(e.target.value)}
                      className="col-span-2 w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs"
                    />
                  </div>
                  <button type="submit" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-1.5 rounded-xl transition flex items-center justify-center gap-1">
                    <Plus className="w-3 h-3" /> Gravar Registro
                  </button>
                </form>
              </div>

            </div>

            {/* Health indicators & Document storage cofre */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="pet-weight-docs">
              
              {/* Histórico de peso e saúde */}
              <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-3xs flex flex-col gap-3">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>⚖️ Controle de Peso</span>
                  {activePet.weights && activePet.weights.length > 0 && (
                    <span className="text-[10px] text-teal-650 font-bold bg-teal-50 px-2.5 py-0.5 rounded-full select-none">
                      Último: {activePet.weights[activePet.weights.length - 1].weight} kg
                    </span>
                  )}
                </h4>

                <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-1">
                  {(activePet.weights || []).length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-2">Nenhum registro de peso feito ainda.</p>
                  ) : (
                    activePet.weights.map(w => (
                      <div key={w.id} className="flex items-center justify-between text-xs py-1.5 border-b border-dashed border-slate-100">
                        <span className="font-medium text-slate-700">{w.weight} kg</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{new Date(w.date).toLocaleDateString("pt-BR")}</span>
                          <button onClick={() => handleRemoveSubItem("weights", w.id)} className="text-slate-300 hover:text-red-500 transition">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddWeight} className="border-t border-slate-50 pt-2 flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Peso (kg)"
                    value={weightVal}
                    onChange={e => setWeightVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                    required
                  />
                  <input
                    type="date"
                    value={weightDate}
                    onChange={e => setWeightDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs"
                  />
                  <button type="submit" className="bg-teal-600 text-white rounded-xl px-3 py-1.5 text-xs font-bold shrink-0">
                    OK
                  </button>
                </form>
              </div>

              {/* Cofre de documentos do Pet */}
              <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-3xs flex flex-col gap-3">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>📂 Cofre de Documentos</span>
                  <span className="text-[10px] text-slate-400">Laudos & Pedigrees</span>
                </h4>

                <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-1">
                  {(activePet.documents || []).length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-2">Nenhum documento arquivado.</p>
                  ) : (
                    activePet.documents.map(d => (
                      <div key={d.id} className="flex items-center justify-between text-xs py-1.5 border-b border-solid border-slate-50">
                        <a 
                          href={d.link} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="font-bold text-teal-600 hover:underline flex items-center gap-1.5 truncate pr-2"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{d.title}</span>
                        </a>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400 whitespace-nowrap">{new Date(d.date_created).toLocaleDateString("pt-BR")}</span>
                          <button onClick={() => handleRemoveSubItem("documents", d.id)} className="text-slate-300 hover:text-red-500 transition">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddDocument} className="border-t border-slate-50 pt-2 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Hemograma, RG do Pet"
                      value={docTitle}
                      onChange={e => setDocTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Simular URL do Arquivo"
                      value={docLink}
                      onChange={e => setDocLink(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <button type="submit" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-1.5 rounded-xl transition">
                    + Anexar Documento Digital
                  </button>
                </form>
              </div>

            </div>

            {/* Alimentação integration note */}
            {activePet.food_inventory_item_id && (() => {
              const connectedItem = inventory.find(i => i.id === activePet.food_inventory_item_id);
              if (!connectedItem) return null;
              
              const isLow = connectedItem.quantity < connectedItem.min_quantity;
              
              return (
                <div className={`border rounded-3xl p-4 flex gap-3 text-xs shadow-3xs ${
                  isLow 
                    ? "bg-rose-50 border-rose-100 text-rose-950" 
                    : "bg-teal-50/20 border-teal-100/50 text-slate-700"
                }`} id="food-deduction-card">
                  <div className="text-xl shrink-0 select-none">🍖</div>
                  <div className="flex-1">
                    <p className="font-bold flex items-center gap-1.5">
                      Controle Inteligente de Ração ({activePet.name})
                      {isLow && <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.1 rounded-full uppercase tracking-wider animate-pulse">Acabando!</span>}
                    </p>
                    <p className="mt-1 leading-relaxed">
                      Sua ração está vinculada ao item do estoque <strong className="font-semibold text-teal-800">"{connectedItem.name}"</strong>. 
                      Atualmente restam <strong className="font-semibold">{connectedItem.quantity} {connectedItem.unit}</strong> no estoque 
                      (Mínimo configurado: {connectedItem.min_quantity} {connectedItem.unit}).
                    </p>
                    {isLow && (
                      <p className="text-[10px] text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Item adicionado automaticamente à lista de compras do casal para reabastecimento rápido!
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

          </div>
        )
      )}

    </div>
  );
}
