import TntCoinStructure from "../structure/TntCoinStructure";
import { Countdown } from "lib/System/Countdown";
import { Timer } from "lib/System/Timer";
import { WinTracker } from "lib/System/WinTracker";
import { TikTokGiftGoal } from "lib/ScreenDisplay/TikTokGiftGoal";
import { TntCoinConfigManager } from "./TntCoinConfigManager";
import { JailService } from "./services";

export default class TntCoinSettings {
    private readonly configManager = TntCoinConfigManager.getInstance();

    constructor(
        private readonly _structure: TntCoinStructure,
        private readonly _countdown: Countdown,
        private readonly _timer: Timer,
        private readonly _winTracker: WinTracker,
        private readonly _giftGoal: TikTokGiftGoal,
        private readonly _jailService: JailService
    ) {
        this.initializeDefaultSettings();
    }

    
    private initializeDefaultSettings(): void {
        console.warn('§aInitializing TNT Coin Settings...');
        const tntCoinSettings = this.configManager.getConfig<any>('TNT_COIN_SETTINGS');
        const summonEntityConfig = this.configManager.getConfig<SummonOptions>('SUMMON_ENTITY_CONFIG');
        const jailConfig = this.configManager.getConfig<JailConfigInterface>('JAIL_CONFIG');

        if (tntCoinSettings) {
            this._winTracker.setWins(tntCoinSettings.wins || 0);
            this._winTracker.setMaxWins(tntCoinSettings.maxWins || 10);
            this._timer.setTimerDuration(tntCoinSettings.timerDuration || 180);
            this._countdown.defaultCountdownTime = tntCoinSettings.defaultCountdownTime || 10;
            this._countdown.tickInterval = tntCoinSettings.countdownTickInterval || 20;
        }

        if (summonEntityConfig) {
            this._summonEntityFormSettings = { ...summonEntityConfig };
        }

        if (jailConfig) {
            this._jailSettings = { ...jailConfig };
            if (this._jailService && this._jailService.jailConfig) {
                this._jailService.jailConfig = jailConfig;
            }
        }

        console.warn('§aTNT Coin Settings initialized.');
    }

    // --- Camera settings ---

    get doesCameraRotate(): boolean {
        const config = this.configManager.getConfig<any>('TNT_COIN_SETTINGS');
        return config?.doesCameraRotate ?? true;
    }

    set doesCameraRotate(value: boolean) {
        const config = this.configManager.getConfig<any>('TNT_COIN_SETTINGS');
        this.configManager.setConfig('TNT_COIN_SETTINGS', { ...config, doesCameraRotate: value });
    }

    // --- Barrier Settings ---

    get useBarriers(): boolean {
        const config = this.configManager.getConfig<any>('TNT_COIN_SETTINGS');
        return config?.useBarriers ?? false;
    }

    set useBarriers(value: boolean) {
        const config = this.configManager.getConfig<any>('TNT_COIN_SETTINGS');
        this.configManager.setConfig('TNT_COIN_SETTINGS', { ...config, useBarriers: value });
    }

    // --- Block settings ----

    get randomizeBlocks(): boolean {
        const config = this.configManager.getConfig<any>('TNT_COIN_SETTINGS');
        return config?.randomizeBlocks ?? true;
    }

    set randomizeBlocks(value: boolean) {
        const config = this.configManager.getConfig<any>('TNT_COIN_SETTINGS');
        this.configManager.setConfig('TNT_COIN_SETTINGS', { ...config, randomizeBlocks: value });
    }

    // --- Entity settings ----

    get summonEntitySettings(): SummonOptions {
        return this._summonEntityFormSettings;
    }

    set summonEntitySettings(settings: SummonOptions) {
        this._summonEntityFormSettings = {
            ...this._summonEntityFormSettings,
            ...settings
        };
        this.configManager.setConfig('SUMMON_ENTITY_CONFIG', this._summonEntityFormSettings);
    }

    private _summonEntityFormSettings: SummonOptions = this.configManager.getConfig<SummonOptions>('SUMMON_ENTITY_CONFIG') || {
        entityName: 'tnt_minecart',
        locationType: 'random',
        onTop: false,
        amount: 10,
        batchSize: 5,
        batchDelay: 5,
        playSound: {
            playSoundOnSummon: true,
            sound: 'kururin',
        }
    };


    // Jail settings
    private _jailSettings: JailConfigInterface = this.configManager.getConfig<JailConfigInterface>('JAIL_CONFIG') || {
        size: 5,
        jailTime: 10,
        enableEffects: true
    };

    public getTntCoinSettings(): TntCoinSettingsInterface {
        return {
            doesCameraRotate: this.doesCameraRotate,
            useBarriers: this.useBarriers,
            randomizeBlocks: this.randomizeBlocks,
            wins: this._winTracker.getCurrentWins(),
            maxWins: this._winTracker.getMaxWins(),
            timerDuration: this._timer.getTimerDuration(),
            defaultCountdownTime: this._countdown.defaultCountdownTime,
            countdownTickInterval: this._countdown.tickInterval,
            fillSettings: this._structure.fillSettings,
            giftGoalSettings: this._giftGoal.settings,
            summonEntitySettings: this._summonEntityFormSettings,
            jailSettings: this._jailSettings,
        };
    }
    
    /**
     * Updates all settings from a settings object
     */
    public updateTntCoinSettings(settings: TntCoinSettingsInterface): void {
        console.warn('§aUpdating TNT Coin Settings...');
        this._giftGoal.settings = settings.giftGoalSettings;
        this._summonEntityFormSettings = settings.summonEntitySettings;
        this.doesCameraRotate = settings.doesCameraRotate;
        this.useBarriers = settings.useBarriers;
        this.randomizeBlocks = settings.randomizeBlocks;
        this._winTracker.setWins(settings.wins);
        this._winTracker.setMaxWins(settings.maxWins);
        this._timer.setTimerDuration(settings.timerDuration);
        this._countdown.defaultCountdownTime = settings.defaultCountdownTime;
        this._countdown.tickInterval = settings.countdownTickInterval;
        this._structure.fillSettings = settings.fillSettings;
        this._jailSettings = settings.jailSettings;
        this.updateConfigManager();
        console.warn('§aTNT Coin Settings updated.');
    }

    /**
     * Update config manager with current settings
     */
    private updateConfigManager(): void {
        const tntCoinSettings = {
            useBarriers: this.useBarriers,
            doesCameraRotate: this.doesCameraRotate,
            randomizeBlocks: this.randomizeBlocks,
            wins: this._winTracker.getCurrentWins(),
            maxWins: this._winTracker.getMaxWins(),
            timerDuration: this._timer.getTimerDuration(),
            defaultCountdownTime: this._countdown.defaultCountdownTime,
            countdownTickInterval: this._countdown.tickInterval,
            fillSettings: this._structure.fillSettings,
            jailSettings: this._jailSettings
        };
        this.configManager.setConfig('TNT_COIN_SETTINGS', tntCoinSettings);
        this.configManager.setConfig('SUMMON_ENTITY_CONFIG', this._summonEntityFormSettings);
    }
}