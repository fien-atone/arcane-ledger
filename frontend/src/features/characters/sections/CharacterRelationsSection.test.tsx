/**
 * Tests for CharacterRelationsSection.
 * Only renders for GM viewers.
 */
import { describe, it, expect } from 'vitest';
import { CharacterRelationsSection } from './CharacterRelationsSection';
import { renderWithProviders } from '@/test/helpers';

describe('CharacterRelationsSection', () => {
  it('renders nothing for non-GM viewers', () => {
    const { container } = renderWithProviders(
      <CharacterRelationsSection campaignId="camp-1" characterId="char-1" isGm={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
