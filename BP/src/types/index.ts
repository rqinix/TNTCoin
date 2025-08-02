export interface FeedbackOptions {
    sound?: string;
    title?: string;
    subtitle?: string;
    actionBar?: string;
}

export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export interface SummonOptions {
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

export interface TikTokGift {
    emoji: string;
    coins: number;
    id: number | null;
}

export interface TntCoinSettingsInterface {
    editStructure: boolean;
    doesCameraRotate: boolean;
    useBarriers: boolean;
    randomizeBlocks: boolean;
    wins: number;
    maxWins: number;
    countdownDefaultTime: number;
    countdownTickInterval: number;
    countdownSlowModeInterval: number;
    countdownSlowCount: number;
    timerDuration: number;
    fillSettings: FillSettings;
    giftGoalSettings: GiftGoalSettings;
    summonEntitySettings: SummonOptions;
    jailSettings: JailConfigInterface;
    eventDisplaySettings: EventDisplaySettings;
}

export interface TntCoinSession {
    isPlayerInGame: boolean;
    structureProperties: StructureProperties;
    settings: TntCoinSettingsInterface;
}

export interface FillSettings {
    blockName: string;
    tickInterval: number;
    blocksPerTick: number;
}

export interface StructureProperties {
    centerLocation: Vec3;
    width: number;
    height: number;
    blockOptions: {
        baseBlockName: string;
        sideBlockName: string;
        floorBlockName: string;
    };
}

export interface GiftGoalSettings {
    giftName: string;
    maxCount: number;
    currentCount: number;
    isActive: boolean;
    isEnabled: boolean;
}

export type ActionType = 'Summon' | 'Clear Blocks' | 'Fill' | 'Play Sound' | 'Screen Title' | 'Screen Subtitle' | 'Run Command' | 'Jail' | 'Win Action' | 'TNT Rain' | 'TNT Rocket';

export interface EventAction {
    eventKey: string;
    actionType?: ActionType;
    playSound?: string | null;
    summonOptions?: SummonOptions;
    screenTitle?: string;
    screenSubtitle?: string;
    command?: string;
    jailOptions?: JailActionOptions;
    winOptions?: WinActionOptions;
    tntRainOptions?: TntRainOptions;
    tntRocketOptions?: TntRocketOptions;
}

export interface JailActionOptions {
    duration: number;
    enableEffects: boolean;
}

export interface WinActionOptions {
    operation: 'increment' | 'decrement';
    amount: number;
}

export interface TntRainOptions {
    duration: number;
    intensity: number;
    entityType: string;
    enableCameraShake: boolean;
    rainCoin: boolean;
}

export interface TntRocketOptions {
    duration: number;
    entityType: string;
    particles: string[];
    amplifier: number;
}

export interface EventDefinitionInterface<T = any> {
    name: string;
    description?: string;
}

export interface ActionbarTask {
    id: string;
    callback: () => (string | number | undefined)[] | Promise<(string | number | undefined)[]>;
}

export interface GiftAction extends EventAction { giftName: string; giftId?: number; giftEmoji: string; }
export interface MemberAction extends EventAction {}
export interface FollowAction extends EventAction {}
export interface ShareAction extends EventAction {}
export interface LikeAction extends EventAction { likeCount: number; }
export interface ChatAction extends EventAction { chat: string; }

export interface ChatProps { 
    uniqueId: string, 
    nickname: string,
    comment: string
}

export interface GiftProps {
    username: string,
    nickname: string,
    giftName: string,
    giftId: number,
    repeatCount: number
    giftType: number,
    diamondCount: number,
    repeatEnd: number,
}

export interface LikeProps {
    username: string;
    nickname: string;
    likeCount: number;
    totalLiveLikeCount: number;
}

export interface FollowProps {
    username: string, 
    nickname: string 
}

export interface JoinProps {
    username: string, 
    nickname: string 
}

export interface ShareProps {
    username: string, 
    nickname: string 
}

export interface JailConfigInterface { 
    size: number;
    jailTime: number;
    enableEffects: boolean;
}

export interface EventDisplaySettings {
    showChatMessages: boolean;
    showGiftMessages: boolean;
    showFollowMessages: boolean;
    showShareMessages: boolean;
    showLikeMessages: boolean;
    showMemberMessages: boolean;
}

import { RawMessage } from '@minecraft/server';

/**
 * Interface for form component types
 */
export interface FormComponent {
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