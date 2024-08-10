interface FormComponent {
    type: 'button' | 'textField' | 'dropdown' | 'slider' | 'toggle';
    label: string;
    placeholder?: string;
    defaultValue?: string | number | boolean;
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
    callback?: (response: any) => Promise<void> | void;
    iconPath?: string;
    textfieldType?: 'string' | 'number';
}

interface FeedbackOptions {
    sound?: string;
    title?: string;
    subtitle?: string;
    actionBar?: string;
}

interface Vec3 {
    x: number;
    y: number;
    z: number;
}

interface GameSettings {
    wins: number;
    winMax: number;
    fillSettings: FillSettings;
    defaultCountdownTime: number;
    countdownTickInterval: number;
    doesCameraRotate: boolean;
    useBarriers: boolean;
    randomizeBlocks: boolean;
}

interface StructureProperties {
    centerLocation: Vec3;
    width: number;
    height: number;
    blockOptions: {
        baseBlockName: string;
        sideBlockName: string;
    };
}

interface GameState {
    isPlayerInGame: boolean;
    structureProperties: StructureProperties;
    gameSettings: GameSettings;
    wins: number;
}

interface FillSettings {
    blockName: string;
    tickInterval: number;
    blocksPerTick: number;
}