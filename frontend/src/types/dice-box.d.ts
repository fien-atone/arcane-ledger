declare module '@3d-dice/dice-box' {
  interface DiceBoxOptions {
    assetPath: string;
    theme?: string;
    scale?: number;
    gravity?: number;
    mass?: number;
    friction?: number;
    restitution?: number;
    angularDamping?: number;
    linearDamping?: number;
    spinForce?: number;
    throwForce?: number;
    startingHeight?: number;
    settleTimeout?: number;
    offscreen?: boolean;
    delay?: number;
  }

  interface DieResult {
    groupId: number;
    rollId: number;
    sides: number;
    theme: string;
    value: number;
  }

  export default class DiceBox {
    constructor(selector: string, options: DiceBoxOptions);
    init(): Promise<void>;
    roll(notation: string | Array<{ qty: number; sides: number }>): Promise<DieResult[]>;
    clear(): void;
    hide(): void;
    show(): void;
  }
}
