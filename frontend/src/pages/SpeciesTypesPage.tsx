import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSpeciesTypes, useSaveSpeciesType, useDeleteSpeciesType } from '@/features/speciesTypes/api';
import { useSectionEnabled, useCampaign } from '@/features/campaigns/api/queries';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import { InlineRichField, IconPicker, EmptyState, SectionDisabled, SectionBackground } from '@/shared/ui';
import type { SpeciesTypeEntry } from '@/entities/speciesType';


// ── Drawer ───────────────────────────────────────────────────────────────────
const inputCls = 'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';
const labelCls = 'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

function SpeciesTypeDrawer({ open, onClose, campaignId, entry }: { open: boolean; onClose: () => void; campaignId: string; entry?: SpeciesTypeEntry }) {
  const save = useSaveSpeciesType(campaignId);
  const isNew = !entry;
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  useEffect(() => {
    if (!open) return;
    if (entry) { setName(entry.name); setIcon(entry.icon); }
    else { setName(''); setIcon(''); }
  }, [open, entry]);

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    save.mutate({ id: entry?.id ?? '', campaignId, name: name.trim(), icon, createdAt: entry?.createdAt ?? '' }, { onSuccess: onClose });
  };

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-70 w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">
        <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/10 flex-shrink-0">
          <h2 className="text-lg font-headline font-bold text-on-surface">{isNew ? 'New Species Type' : 'Edit Species Type'}</h2>
          <button onClick={onClose} className="p-1 text-on-surface-variant/50 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <div>
            <label className={labelCls}>Name <span className="text-primary">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Humanoid" className={inputCls} autoFocus />
          </div>
          <div>
            <label className={labelCls}>Icon</label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
          <button onClick={onClose} className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:border-primary/50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || save.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
            {isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Detail ───────────────────────────────────────────────────────────────────
function SpeciesTypeDetail({ entry, campaignId, onEdit, onDelete }: { entry: SpeciesTypeEntry; campaignId: string; onEdit: () => void; onDelete: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const save = useSaveSpeciesType(campaignId);

  const saveDescription = useCallback((html: string) => {
    save.mutate({ ...entry, description: html || undefined });
  }, [entry, save]);

  return (
    <div className="flex flex-col flex-1">
      <div className="px-12 py-8 flex flex-col gap-8">
        <div className="flex items-center justify-end gap-2">
          {confirmDelete ? (
            <div className="flex items-center gap-2 px-3 py-2 border border-error/30 bg-error/5 rounded-sm">
              <span className="text-[10px] text-on-surface-variant">Delete?</span>
              <button onClick={() => { onDelete(); setConfirmDelete(false); }} className="px-2 py-0.5 text-[10px] font-label uppercase text-error">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="px-2 py-0.5 text-[10px] font-label uppercase text-on-surface-variant">No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 px-3 py-2 border border-outline-variant/20 text-on-surface-variant/40 text-[10px] font-label uppercase tracking-widest rounded-sm hover:text-error hover:border-error/30 transition-colors">
              <span className="material-symbols-outlined text-[14px]">delete</span>
            </button>
          )}
          <button onClick={onEdit} className="inline-flex items-center gap-1.5 px-3 py-2 border border-outline-variant/20 text-primary text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors">
            <span className="material-symbols-outlined text-[14px]">edit</span> Edit
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-sm flex items-center justify-center bg-primary/10 border border-primary/20">
            <span className="material-symbols-outlined text-primary text-[28px]">{entry.icon}</span>
          </div>
          <h2 className="font-headline text-3xl font-bold text-on-surface">{entry.name}</h2>
        </div>

        <InlineRichField label="Description" value={entry.description} onSave={saveDescription} placeholder="Describe this species type…" />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function SpeciesTypesPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: campaign } = useCampaign(campaignId ?? '');
  const speciesEnabled = useSectionEnabled(campaignId ?? '', 'species_types');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const { data: types, isLoading } = useSpeciesTypes(campaignId, debouncedSearch);
  const deleteType = useDeleteSpeciesType();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerKey, setDrawerKey] = useState(0);
  const [editingType, setEditingType] = useState<SpeciesTypeEntry | undefined>(undefined);

  const selected = types?.find((t) => t.id === selectedId) ?? types?.[0] ?? null;

  if (!speciesEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

  return (
    <>
    <SectionBackground />
    <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
      {/* Campaign name */}
      <div className="flex justify-center pt-0 pb-4 flex-shrink-0">
        <Link
          to={`/campaigns/${campaignId}`}
          className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          {campaign?.title ?? 'Campaign'}
        </Link>
      </div>

      <header className="flex-shrink-0 sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-6 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">Species Types</h1>
            <p className="text-on-surface-variant text-sm mt-1">Define creature categories for this campaign.</p>
          </div>
          <button onClick={() => { setEditingType(undefined); setDrawerKey((k) => k + 1); setDrawerOpen(true); }}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-5 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-label text-xs uppercase tracking-widest">Add Type</span>
          </button>
        </div>
      </header>

      {isLoading && !types ? (
        <div className="flex items-center gap-3 p-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span> Loading…
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col border-r border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex-shrink-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">search</span>
                <input type="text" placeholder="Search types…" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-surface-container border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary text-on-surface text-xs placeholder:text-on-surface-variant/30 transition-colors" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {(!types || types.length === 0) && <EmptyState icon="category" title="No species types found." />}
              {types?.map((t) => (
                <button key={t.id} onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/5 transition-all duration-150 ${
                    selected?.id === t.id ? 'bg-primary/8 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent hover:bg-surface-container-low hover:border-l-primary/30'
                  }`}>
                  <div className={`w-10 h-10 rounded-sm flex-shrink-0 flex items-center justify-center border ${selected?.id === t.id ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-highest border-outline-variant/20'}`}>
                    <span className={`material-symbols-outlined text-[18px] ${selected?.id === t.id ? 'text-primary' : 'text-on-surface-variant/50'}`}>{t.icon}</span>
                  </div>
                  <p className={`text-sm truncate ${selected?.id === t.id ? 'text-primary font-semibold' : 'text-on-surface font-medium'}`}>{t.name}</p>
                </button>
              ))}
            </div>
            {types && types.length > 0 && (
              <div className="px-4 py-2 border-t border-outline-variant/10 flex-shrink-0">
                <p className="text-[10px] text-on-surface-variant/40"><span className="text-primary font-bold">{types.length}</span> types</p>
              </div>
            )}
          </div>

          <div className="hidden lg:flex flex-col flex-1 overflow-y-auto">
            {selected ? (
              <SpeciesTypeDetail
                entry={selected}
                campaignId={campaignId ?? ''}
                onEdit={() => { setEditingType(selected); setDrawerOpen(true); }}
                onDelete={() => deleteType.mutate(selected.id)}
              />
            ) : (
              <div className="flex items-center justify-center flex-1 text-on-surface-variant/30 text-sm italic">Select a species type</div>
            )}
          </div>
        </div>
      )}

    </main>

    <SpeciesTypeDrawer key={editingType?.id ?? `new-${drawerKey}`} open={drawerOpen} onClose={() => setDrawerOpen(false)} campaignId={campaignId ?? ''} entry={editingType} />
    </>
  );
}
