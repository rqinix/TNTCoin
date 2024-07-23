interface FormComponent {
    type: 'button' | 'textField' | 'dropdown' | 'slider' | 'toggle';
    label: string;
    placeholder?: string;
    defaultValue?: string | number | boolean;
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
    callback?: (response: any) => void;
    iconPath?: string;
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
    winMax: number;
    fillBlockName: string;
    fillTickInteval: number;
    fillBlocksPerTick: number;
    defaultCountdownTime: number;
    countdownTickInterval: number;
    doesCameraRotate: boolean;
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