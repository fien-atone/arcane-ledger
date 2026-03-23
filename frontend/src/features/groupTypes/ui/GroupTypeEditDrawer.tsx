import { useEffect, useState, useRef } from 'react';
import { useSaveGroupType } from '../api';
import type { GroupTypeEntry } from '@/entities/groupType';

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';

const textareaCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30 resize-none';

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

// Curated icon list for TTRPG group types
const ICONS: string[] = [
  // Organizations & Power
  'flag', 'groups', 'group', 'military_tech', 'shield', 'security', 'gavel', 'policy',
  'account_balance', 'crown', 'star', 'emoji_events', 'workspace_premium',
  // Social & Family
  'family_restroom', 'handshake', 'favorite', 'diversity_3', 'people', 'person',
  'person_add', 'connect_without_contact', 'hub',
  // Knowledge & Magic
  'school', 'auto_stories', 'menu_book', 'book', 'science', 'auto_awesome',
  'psychology', 'blur_on', 'flare', 'brightness_high', 'light_mode', 'dark_mode',
  'visibility_off', 'visibility', 'magic_button', 'gesture',
  // Crime & Danger
  'warning', 'dangerous', 'skull', 'bug_report', 'lock', 'key', 'vpn_key',
  'no_encryption', 'theater_comedy', 'masks',
  // Religion & Mysticism
  'church', 'temple_buddhist', 'synagogue', 'mosque', 'self_improvement',
  'spa', 'energy_savings_leaf', 'wb_twilight', 'nightlight',
  // Commerce & Trade
  'storefront', 'sell', 'monetization_on', 'paid', 'shopping_bag', 'inventory',
  'package_2', 'scale', 'balance',
  // Nature & Elements
  'forest', 'terrain', 'waves', 'local_fire_department', 'water_drop',
  'air', 'thunderstorm', 'cloud', 'public',
  // Buildings & Places
  'domain', 'apartment', 'cottage', 'castle', 'fort', 'tower',
  'location_city', 'home', 'warehouse', 'museum',
  // Combat & Adventure
  'sports_kabaddi', 'fitness_center', 'hiking', 'explore',
  'my_location', 'navigation', 'map', 'travel_explore',
  // Tools & Craft
  'construction', 'engineering', 'build', 'handyman', 'palette',
  'brush', 'design_services', 'architecture',
  // Communication & Secrets
  'forum', 'campaign', 'record_voice_over', 'hearing', 'spy',
  'search', 'find_in_page', 'fingerprint', 'face',
  // Misc
  'category', 'label', 'bookmark', 'link', 'bolt', 'whatshot',
  'hourglass_empty', 'schedule', 'history', 'recycling',
];

interface Props {
  open: boolean;
  onClose: () => void;
  groupType?: GroupTypeEntry;
}

function newId() {
  return `type-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = search.trim()
    ? ICONS.filter((i) => i.includes(search.trim().toLowerCase().replace(/\s+/g, '_')))
    : ICONS;

  const handleOpen = () => {
    setOpen(true);
    setSearch('');
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const select = (icon: string) => {
    onChange(icon);
    setOpen(false);
    setSearch('');
  };

  return (
    <div>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-3 px-3 py-2.5 bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 rounded-sm transition-colors text-left"
      >
        <div className="w-8 h-8 flex items-center justify-center bg-surface-container border border-outline-variant/20 rounded-sm flex-shrink-0">
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
            {value || 'category'}
          </span>
        </div>
        <span className="flex-1 text-sm text-on-surface font-mono">
          {value || <span className="text-on-surface-variant/40 font-sans">Choose an icon…</span>}
        </span>
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Inline picker */}
      {open && (
        <div className="mt-1 border border-outline-variant/20 rounded-sm bg-surface-container-low overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-outline-variant/10">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-on-surface-variant/40">
                search
              </span>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search icons…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-surface-container border border-outline-variant/20 focus:border-primary rounded-sm text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-9 gap-0.5 p-2 max-h-52 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
            {filtered.length === 0 && (
              <p className="col-span-9 text-xs text-on-surface-variant/40 italic text-center py-4">No icons found</p>
            )}
            {filtered.map((iconName) => (
              <button
                key={iconName}
                type="button"
                title={iconName}
                onClick={() => select(iconName)}
                className={`flex items-center justify-center w-full aspect-square rounded-sm transition-all ${
                  value === iconName
                    ? 'bg-primary/15 text-primary'
                    : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{iconName}</span>
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="px-3 py-1.5 border-t border-outline-variant/10">
            <p className="text-[9px] text-on-surface-variant/30 uppercase tracking-widest">
              {filtered.length} icons · click to select
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function GroupTypeEditDrawer({ open, onClose, groupType }: Props) {
  const save = useSaveGroupType();
  const isNew = !groupType;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(groupType?.name ?? '');
    setIcon(groupType?.icon ?? '');
    setDescription(groupType?.description ?? '');
  }, [open, groupType]);

  const handleSave = () => {
    if (!name.trim() || !icon.trim()) return;
    const record: GroupTypeEntry = {
      id: groupType?.id ?? newId(),
      name: name.trim(),
      icon: icon.trim(),
      description: description.trim() || undefined,
      createdAt: groupType?.createdAt ?? new Date().toISOString(),
    };
    save.mutate(record, { onSuccess: onClose });
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">
              {isNew ? 'New Group Type' : 'Edit Group Type'}
            </h2>
            {!isNew && (
              <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">
                {groupType!.name}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

          {/* Name */}
          <div>
            <label className={labelCls}>Name <span className="text-primary">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Faction"
              className={inputCls}
              autoFocus
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className={labelCls}>Icon <span className="text-primary">*</span></label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe this group type…"
              className={textareaCls}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !icon.trim() || save.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {save.isPending ? (
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-sm">save</span>
            )}
            {isNew ? 'Create' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}
