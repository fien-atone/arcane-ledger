import { mockClient } from './mockClient';
import { realClient } from './realClient';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const apiClient = USE_MOCK ? mockClient : realClient;
