import { PlayerPropertiesManager } from "../../lib/Player/PlayerPropertiesManager";

export class TntCoinConfigManager {
    private static instance: TntCoinConfigManager;
    private configs: Map<string, any> = new Map();
    private defaultConfigs: Map<string, any> = new Map();
    private propertiesManager?: PlayerPropertiesManager;

    private constructor() {}

    /**
     * Gets the singleton instance of ConfigManager
     */
    public static getInstance(): TntCoinConfigManager {
        if (!TntCoinConfigManager.instance) {
            TntCoinConfigManager.instance = new TntCoinConfigManager();
        }
        return TntCoinConfigManager.instance;
    }

    /**
     * Gets a configuration value
     * @param key Configuration key
     * @returns The configuration value
     */
    public getConfig<T>(key: string): T {
        if (!this.configs.has(key) && this.defaultConfigs.has(key)) {
            return this.defaultConfigs.get(key) as T;
        }
        return this.configs.get(key) as T;
    }

    /**
     * Sets a configuration value
     * @param key Configuration key
     * @param value New configuration value
     */
    public setConfig<T>(key: string, value: T): void {
        this.configs.set(key, value);
        this.saveConfig(key);
    }

    /**
     * Saves a configuration to player's dynamic properties
     * @param key Configuration key
     */
    private saveConfig(key: string): void {
        if (this.propertiesManager && this.configs.has(key)) {
            const configValue = this.configs.get(key);
            const configKey = `tntcoin:config:${key}`;
            this.propertiesManager.setProperty(configKey, JSON.stringify(configValue));
        }
    }

    /**
     * Resets a configuration to its default value
     * @param key Configuration key
     */
    public resetConfig(key: string): void {
        if (this.defaultConfigs.has(key)) {
            this.configs.set(key, this.defaultConfigs.get(key));
            this.saveConfig(key);
        }
    }
}