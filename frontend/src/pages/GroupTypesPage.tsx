import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGroupTypes, useDeleteGroupType, useSaveGroupType } from '@/features/groupTypes/api';
import { useSectionEnabled, useCampaign } from '@/features/campaigns/api/queries';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import { GroupTypeEditDrawer } from '@/features/groupTypes/ui';
import { InlineRichField, EmptyState, SectionDisabled, SectionBackground } from '@/shared/ui';
import type { GroupTypeEntry } from '@/entities/groupType';

export default function GroupTypesPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: campaign } = useCampaign(campaignId ?? '');
  const groupsEnabled = useSectionEnabled(campaignId ?? '', 'group_types');
  const { data: groupTypes, isLoading } = useGroupTypes(campaignId, debouncedSearch);
  const deleteGroupType = useDeleteGroupType();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingType, setEditingType] = useState<GroupTypeEntry | undefined>(undefined);

  const selected = groupTypes?.find((t) => t.id === selectedId) ?? groupTypes?.[0] ?? null;

  const handleOpenCreate = () => {
    setEditingType(undefined);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (entry: GroupTypeEntry) => {
    setEditingType(entry);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteGroupType.mutate(id, {
      onSuccess: () => {
        if (selectedId === id) setSelectedId(null);
      },
    });
  };

  if (!groupsEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

  return (
    <>
    <SectionBackground />
    <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
      {/* Campaign name */}
      <div className="flex justify-center pt-0 pb-8">
        <Link
          to={`/campaigns/${campaignId}`}
          className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          {campaign?.title ?? 'Campaign'}
        </Link>
      </div>

      {/* Content -- single max-width container */}
      <div className="px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8 pb-20">

        {/* Header card */}
        <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">Group Types</h1>
              <p className="text-on-surface-variant text-sm mt-1">
                Manage the types that classify groups in this campaign world.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-5 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="font-label text-xs uppercase tracking-widest">Add Type</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 p-12 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Loading…
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 min-h-[480px]">

            {/* Left panel -- type list card */}
            <div className="bg-surface-container border border-outline-variant/20 rounded-sm flex flex-col w-full md:w-[320px] md:flex-shrink-0 overflow-hidden">
              {/* Search */}
              <div className="px-3 py-2.5 border-b border-outline-variant/10 flex-shrink-0">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">search</span>
                  <input
                    type="text"
                    placeholder="Search types…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-surface-container-high border border-outline-variant/20 rounded-sm focus:ring-0 focus:border-primary text-on-surface text-sm placeholder:text-on-surface-variant/30 transition-colors"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
                {(!groupTypes || groupTypes.length === 0) ? (
                  <EmptyState icon="category" title="No group types found." />
                ) : groupTypes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/5 transition-all duration-150 ${
                        selected?.id === t.id
                          ? 'bg-primary/8 border-l-2 border-l-primary'
                          : 'border-l-2 border-l-transparent hover:bg-surface-container-high hover:border-l-primary/30'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-sm flex-shrink-0 flex items-center justify-center border ${selected?.id === t.id ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-highest border-outline-variant/20'}`}>
                        <span className={`material-symbols-outlined text-[18px] ${selected?.id === t.id ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                          {t.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate transition-colors ${selected?.id === t.id ? 'text-primary font-semibold' : 'text-on-surface font-medium'}`}>
                          {t.name}
                        </p>
                      </div>
                    </button>
                ))}
              </div>

              {groupTypes && groupTypes.length > 0 && (
                <div className="px-4 py-2 border-t border-outline-variant/10 flex-shrink-0">
                  <p className="text-[10px] text-on-surface-variant/40">
                    <span className="text-primary font-bold">{groupTypes.length}</span> types
                  </p>
                </div>
              )}
            </div>

            {/* Right panel -- detail card */}
            <div className="bg-surface-container border border-outline-variant/20 rounded-sm flex-1 overflow-hidden min-h-[400px]">
              {selected ? (
                <GroupTypeDetail
                  key={selected.id}
                  entry={selected}
                  campaignId={campaignId ?? ''}
                  onEdit={() => handleOpenEdit(selected)}
                  onDelete={() => handleDelete(selected.id)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-on-surface-variant/30 text-sm italic">
                  Select a group type
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>

    <GroupTypeEditDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      campaignId={campaignId ?? ''}
      groupType={editingType}
    />
    </>
  );
}

function GroupTypeDetail({
  entry,
  campaignId,
  onEdit,
  onDelete,
}: {
  entry: GroupTypeEntry;
  campaignId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const saveType = useSaveGroupType(campaignId);
  return (
    <div className="flex flex-col flex-1">
      <div className="px-8 md:px-12 py-8 flex flex-col gap-8">
        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2">
          {confirmDelete ? (
            <div className="flex items-center gap-2 px-3 py-2 border border-error/30 bg-error/5 rounded-sm">
              <span className="text-[10px] text-on-surface-variant">Delete this type?</span>
              <button
                onClick={() => { onDelete(); setConfirmDelete(false); }}
                className="px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-outline-variant/20 text-on-surface-variant text-[10px] font-label uppercase tracking-widest rounded-sm hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
            </button>
          )}
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-outline-variant/20 text-primary text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            Edit
          </button>
        </div>
        {/* Name + icon badge */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-sm flex items-center justify-center bg-primary/10 border border-primary/20 flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-[28px]">
              {entry.icon}
            </span>
          </div>
          <div>
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">
              {entry.name}
            </h2>
          </div>
        </div>

        {/* Description -- edit in place */}
        <InlineRichField
          label="Description"
          value={entry.description}
          onSave={(html) => saveType.mutate({ ...entry, description: html || undefined })}
          placeholder="Describe this group type…"
        />

      </div>
    </div>
  );
}
