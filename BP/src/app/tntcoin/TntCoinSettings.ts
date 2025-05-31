import TntCoinStructure from "../structure/TntCoinStructure";
import { Countdown } from "lib/System/Countdown";
import { Timer } from "lib/System/Timer";
import { WinTracker } from "lib/System/WinTracker";
import { TikTokGiftGoal } from "lib/ScreenDisplay/TikTokGiftGoal";
import { TntCoinConfigManager } from "./TntCoinConfigManager";

export default class TntCoinSettings {
    private readonly configManager = TntCoinConfigManager.getInstance();

    constructor(
        private readonly _structure: TntCoinStructure,
        private readonly _countdown: Countdown,
        private readonly _timer: Timer,
        private readonly _winTracker: WinTracker,
        private readonly _giftGoal: TikTokGiftGoal
    ) {
        this.initializeFromConfig();
    }

    /**
     * Initialize settings from config manager
     */
    private initializeFromConfig(): void {
        const tntCoinConfig = this.configManager.getConfig<any>('TNT_COIN_CONFIG');
        const summonEntityConfig = this.configManager.getConfig<SummonOptions>('SUMMON_ENTITY_CONFIG');

        if (tntCoinConfig) {
            this._winTracker.setWins(tntCoinConfig.wins || 0);
            this._winTracker.setMaxWins(tntCoinConfig.maxWins || 10);
            this._timer.setTimerDuration(tntCoinConfig.timerDuration || 180);
            this._countdown.defaultCountdownTime = tntCoinConfig.defaultCountdownTime || 10;
            this._countdown.tickInterval = tntCoinConfig.countdownTickInterval || 20;
        }

        if (summonEntityConfig) {
            this._summonEntityFormSettings = { ...summonEntityConfig };
        }
    }

    // Camera settings
    get doesCameraRotate(): boolean {
        const config = this.configManager.getConfig<any>('TNT_COIN_CONFIG');
        return config?.doesCameraRotate ?? true;
    }

    set doesCameraRotate(value: boolean) {
        const config = this.configManager.getConfig<any>('TNT_COIN_CONFIG');
        this.configManager.setConfig('TNT_COIN_CONFIG', { ...config, doesCameraRotate: value });
    }
    
    // Structure settings
    get useBarriers(): boolean {
        const config = this.configManager.getConfig<any>('TNT_COIN_CONFIG');
        return config?.useBarriers ?? false;
    }

    set useBarriers(value: boolean) {
        const config = this.configManager.getConfig<any>('TNT_COIN_CONFIG');
        this.configManager.setConfig('TNT_COIN_CONFIG', { ...config, useBarriers: value });
    }
    
    // Block settings
    get randomizeBlocks(): boolean {
        const config = this.configManager.getConfig<any>('TNT_COIN_CONFIG');
        return config?.randomizeBlocks ?? true;
    }

    set randomizeBlocks(value: boolean) {
        const config = this.configManager.getConfig<any>('TNT_COIN_CONFIG');
        this.configManager.setConfig('TNT_COIN_CONFIG', { ...config, randomizeBlocks: value });
    }

    // Entity settings
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
        };
    }

    /**
     * Updates all settings from a settings object
     */
    public updateTntCoinSettings(settings: TntCoinSettingsInterface): void {
        this.doesCameraRotate = settings.doesCameraRotate;
        this.useBarriers = settings.useBarriers;
        this.randomizeBlocks = settings.randomizeBlocks;
        this._winTracker.setWins(settings.wins);
        this._winTracker.setMaxWins(settings.maxWins);
        this._timer.setTimerDuration(settings.timerDuration);
        this._countdown.defaultCountdownTime = settings.defaultCountdownTime;
        this._countdown.tickInterval = settings.countdownTickInterval;
        this._structure.fillSettings = settings.fillSettings;
        this._giftGoal.settings = settings.giftGoalSettings;
        this._summonEntityFormSettings = settings.summonEntitySettings;
        this.updateConfigManager();
    }

    /**
     * Update config manager with current settings
     */
    private updateConfigManager(): void {
        const tntCoinConfig = {
            useBarriers: this.useBarriers,
            doesCameraRotate: this.doesCameraRotate,
            randomizeBlocks: this.randomizeBlocks,
            wins: this._winTracker.getCurrentWins(),
            maxWins: this._winTracker.getMaxWins(),
            timerDuration: this._timer.getTimerDuration(),
            defaultCountdownTime: this._countdown.defaultCountdownTime,
            countdownTickInterval: this._countdown.tickInterval
        };

        this.configManager.setConfig('TNT_COIN_CONFIG', tntCoinConfig);
        this.configManager.setConfig('SUMMON_ENTITY_CONFIG', this._summonEntityFormSettings);
    }

    // Entity settings
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
}
