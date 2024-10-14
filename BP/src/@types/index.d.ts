interface FormComponent {
    type: 'button' | 'textField' | 'dropdown' | 'slider' | 'toggle' | 'submitButton';
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

type TimerAction = 'start' | 'stop' | 'restart';

interface SummonOptions {
    entityName: string;
    amount?: number;
    locationType?: 'random' | 'center';
    onTop?: boolean;
    customLocations?: Vec3[];
    batchSize?: number | null;
    batchDelay?: number | null;
    onSummon?: () => void;
    newNameTag?: string;
    clearBlocksAfterSummon?: boolean;
    playSound?: {
        playSoundOnSummon: boolean;
        sound: string;
    }
}

interface TikTokGift {
    emoji: string;
    coins: number;
    id: number | null;
}

interface GameSettings {
    doesCameraRotate: boolean;
    useBarriers: boolean;
    randomizeBlocks: boolean;
    wins: number;
    maxWins: number;
    defaultCountdownTime: number;
    countdownTickInterval: number;
    timerDuration: number;
    fillSettings: FillSettings;
    giftGoalSettings: GiftGoalSettings;
    summonEntitySettings: SummonOptions;
}

interface GameState {
    isPlayerInGame: boolean;
    structureProperties: StructureProperties;
    gameSettings: GameSettings;
}

interface FillSettings {
    blockName: string;
    tickInterval: number;
    blocksPerTick: number;
}

interface StructureProperties {
    centerLocation: Vec3;
    width: number;
    height: number;
    blockOptions: {
        baseBlockName: string;
        sideBlockName: string;
        floorBlockName: string;
    };
}

interface GiftGoalSettings {
    giftName: string;
    maxCount: number;
    currentCount: number;
    isActive: boolean;
    isEnabled: boolean;
}

interface WinActions {
    onWin: () => void;
    onMaxWins: () => void;
}

type ActionType = 'Summon' | 'Clear Blocks' | 'Fill' | 'Play Sound' | 'Screen Title' | 'Screen Subtitle';

interface EventAction {
    eventKey: string;
    actionType?: ActionType;
    playSound?: string | null;
    summonOptions?: SummonOptions;
    screenTitle?: string;
    screenSubtitle?: string;
}

interface GiftAction extends EventAction {
    giftName: string;
    giftId?: number;
    giftEmoji: string;
}

interface MemberAction extends EventAction {}
interface FollowAction extends EventAction {}
interface ShareAction extends EventAction {}
interface ShareAction extends EventAction {}
interface LikeAction extends EventAction {
    likeCount: number;
}
interface ChatAction extends EventAction {
    chat: string;
}