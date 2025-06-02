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

interface TntCoinSettingsInterface {
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
    jailSettings: JailConfigInterface;
}

interface TntCoinSession {
    isPlayerInGame: boolean;
    structureProperties: StructureProperties;
    settings: TntCoinSettingsInterface;
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

type ActionType = 'Summon' | 'Clear Blocks' | 'Fill' | 'Play Sound' | 'Screen Title' | 'Screen Subtitle' | 'Run Command' | 'Jail';

interface EventAction {
    eventKey: string;
    actionType?: ActionType;
    playSound?: string | null;
    summonOptions?: SummonOptions;
    screenTitle?: string;
    screenSubtitle?: string;
    command?: string;
    jailOptions?: JailActionOptions;
}

interface JailActionOptions {
    duration: number;
    enableEffects: boolean;
}

interface EventDefinitionInterface<T = any> {
    name: string;
    description?: string;
}

interface ActionbarTask {
    id: string;
    callback: () => (string | number | undefined)[] | Promise<(string | number | undefined)[]>;
}

interface GiftAction extends EventAction { giftName: string; giftId?: number; giftEmoji: string; }
interface MemberAction extends EventAction {}
interface FollowAction extends EventAction {}
interface ShareAction extends EventAction {}
interface LikeAction extends EventAction { likeCount: number; }
interface ChatAction extends EventAction { chat: string; }

interface ChatProps { 
    uniqueId: string, 
    nickname: string,
    comment: string
}

interface GiftProps {
    username: string,
    nickname: string,
    giftName: string,
    giftId: number,
    repeatCount: number
    giftType: number,
    diamondCount: number,
    repeatEnd: number,
}

interface LikeProps {
    username: string;
    nickname: string;
    likeCount: number;
    totalLiveLikeCount: number;
}

interface FollowProps {
    username: string, 
    nickname: string 
}

interface JoinProps {
    username: string, 
    nickname: string 
}

interface ShareProps {
    username: string, 
    nickname: string 
}

/**
 * Interface for form component types
 */
interface FormComponent {
    type: 'button' | 'textField' | 'dropdown' | 'slider' | 'toggle' | 'submitButton' | 'divider' | 'header' | 'label';
    label?: string | RawMessage;
    iconPath?: string;
    placeholder?: string | RawMessage;
    defaultValue?: string | number | boolean;
    options?: string[] | RawMessage[];
    min?: number;
    max?: number;
    step?: number;
    callback?: (value: any) => Promise<void> | void;
    textfieldType?: 'string' | 'number';
}

interface JailConfigInterface { 
    size: number;
    jailTime: number;
    enableEffects: boolean;
}