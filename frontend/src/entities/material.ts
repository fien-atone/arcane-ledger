export type MaterialType = 'page' | 'link' | 'file';

export interface Material {
  id: string;
  campaignId: string;
  title: string;
  type: MaterialType;
  content?: string;
  url?: string;
  fileKey?: string;
  mimeType?: string;
  fileName?: string;
  createdAt: string;
}
