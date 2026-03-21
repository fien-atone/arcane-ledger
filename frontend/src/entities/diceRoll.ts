export interface DiceFace {
  sides: number;
  result: number;
}

export interface DiceRoll {
  id: string;
  campaignId: string;
  sessionId?: string;
  userId: string;
  dice: DiceFace[];
  modifier?: number;
  total: number;
  isPrivate: boolean;
  createdAt: string;
}
