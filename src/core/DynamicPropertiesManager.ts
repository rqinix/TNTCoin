import { Player, Vector3 } from "@minecraft/server";

/**
 * A manager class for handling dynamic properties for players.
 */
export class DynamicPropertiesManager {
    private _player: Player;

    /**
     * Creates an instance of the DynamicPropertiesManager.
     * @param {Player} player - The player whose dynamic properties are managed.
     */
    constructor(player: Player) {
        this._player = player;
    }

    /**
     * Sets a dynamic property for the player.
     * @param {string} key - The key of the dynamic property.
     * @param {boolean | number | string | Vector3 | null} value - The value to set for the dynamic property.
     * @throws Will throw an error if setting the dynamic property fails.
     */
    public setProperty(key: string, value: boolean | number | string | Vector3 | null): void {
        try {
            const serializedValue = JSON.stringify(value);
            this._player.setDynamicProperty(key, serializedValue);
        } catch (error) {
            console.error(`Failed to set dynamic property '${key}' for player ${this._player.name}:`, error);
            throw new Error(`Failed to set dynamic property '${key}'.`);
        }
    }

    /**
     * Gets a dynamic property for the player.
     * @param {string} key - The key of the dynamic property.
     * @returns {boolean | number | string | Vector3 | null} The value of the dynamic property, or null if not found.
     */
    public getProperty(key: string): boolean | number | string | Vector3 | null {
        try {
            const value = this._player.getDynamicProperty(key) as string;
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Failed to get dynamic property '${key}' for player ${this._player.name}:`, error);
            return null;
        }
    }

    /**
     * Removes a dynamic property for the player.
     * @param {string} key - The key of the dynamic property.
     */
    public removeProperty(key: string): void {
        try {
            this._player.setDynamicProperty(key, null);
        } catch (error) {
            console.error(`Failed to remove dynamic property '${key}' for player ${this._player.name}:`, error);
        }
    }

    /**
     * Checks if the player has a specific dynamic property.
     * @param {string} key - The key of the dynamic property.
     * @returns {boolean} True if the property exists, otherwise false.
     */
    public hasProperty(key: string): boolean {
        return this.getProperty(key) !== null;
    }
}
