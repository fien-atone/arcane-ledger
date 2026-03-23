import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCampaign } from '../api/queries';
import type { CampaignSummary } from '@/entities/campaign';

const GRADIENTS = [
  'linear-gradient(135deg, #0a1628 0%, #1a2744 40%, #0d2233 70%, #121317 100%)',
  'linear-gradient(135deg, #1a0a2e 0%, #3b1255 40%, #2a0d1e 70%, #121317 100%)',
  'linear-gradient(135deg, #0a1a10 0%, #0f3320 40%, #0a1f14 70%, #121317 100%)',
  'linear-gradient(135deg, #1a1200 0%, #3b2a00 40%, #2a1e00 70%, #121317 100%)',
  'linear-gradient(135deg, #1a0a0a 0%, #3b1212 40%, #2a0d0d 70%, #121317 100%)',
];

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';
const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CampaignCreateDrawer({ open, onClose }: Props) {
  const navigate = useNavigate();
  const create = useCreateCampaign();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gradientIdx, setGradientIdx] = useState(0);

  if (!open) return null;

  const handleSave = () => {
    if (!title.trim()) return;
    const id = `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const campaign: CampaignSummary = {
      id,
      title: title.trim(),
      description: description.trim() || undefined,
      createdAt: new Date().toISOString(),
      sessionCount: 0,
      memberCount: 1,
      myRole: 'gm',
      coverGradient: GRADIENTS[gradientIdx],
    };
    create.mutate(campaign, {
      onSuccess: () => {
        onClose();
        setTitle('');
        setDescription('');
        navigate(`/campaigns/${id}`);
      },
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-70 w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">New Campaign</h2>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">
              Start a new adventure
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

          <div>
            <label className={labelCls}>Title <span className="text-primary">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Campaign name…"
              className={inputCls}
              autoFocus
            />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Setting, premise, tone…"
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className={labelCls}>Cover colour</label>
            <div className="flex gap-2">
              {GRADIENTS.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setGradientIdx(i)}
                  className={`w-10 h-10 rounded-sm border-2 transition-all ${i === gradientIdx ? 'border-primary scale-110' : 'border-transparent hover:border-outline-variant/50'}`}
                  style={{ background: g }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div
            className="w-full h-24 rounded-sm flex items-end p-4"
            style={{ background: GRADIENTS[gradientIdx] }}
          >
            <p className="font-headline text-xl font-bold text-on-surface">
              {title || 'Campaign name'}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
          <button onClick={onClose} className="px-5 py-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || create.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {create.isPending
              ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-sm">add</span>}
            Create Campaign
          </button>
        </div>
      </div>
    </>
  );
}
