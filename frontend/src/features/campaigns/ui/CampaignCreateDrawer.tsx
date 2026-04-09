import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCreateCampaign } from '../api/queries';
import { RichTextEditor, LABEL_CLS, INPUT_CLS, FormDrawer } from '@/shared/ui';
import type { CampaignSummary } from '@/entities/campaign';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CampaignCreateDrawer({ open, onClose }: Props) {
  const { t } = useTranslation('campaigns');
  const navigate = useNavigate();
  const create = useCreateCampaign();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!title.trim()) return;
    const campaign: CampaignSummary = {
      id: '',
      title: title.trim(),
      description: description.trim() || undefined,
      createdAt: new Date().toISOString(),
      sessionCount: 0,
      memberCount: 1,
      myRole: 'gm',
      enabledSections: [],
    };
    create.mutate(campaign, {
      onSuccess: (created) => {
        onClose();
        setTitle('');
        setDescription('');
        navigate(`/campaigns/${created?.id ?? ''}`);
      },
    });
  };

  return (
    <FormDrawer open={open} onClose={onClose}>
      <FormDrawer.Header
        title={t('create_drawer.title')}
        subtitle={t('create_drawer.subtitle')}
        onClose={onClose}
      />
      <FormDrawer.Body>
          <div>
            <label className={LABEL_CLS}>{t('create_drawer.title_label')} <span className="text-primary">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('create_drawer.title_placeholder')}
              className={INPUT_CLS}
              autoFocus
            />
          </div>

          <div>
            <label className={LABEL_CLS}>{t('create_drawer.description_label')}</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder={t('create_drawer.description_placeholder')}
              minHeight="6rem"
            />
          </div>
      </FormDrawer.Body>
      <FormDrawer.Footer
        onCancel={onClose}
        onSave={handleSave}
        saving={create.isPending}
        saveDisabled={!title.trim()}
        cancelLabel={t('create_drawer.cancel')}
        saveLabel={t('create_drawer.create')}
      />
    </FormDrawer>
  );
}
