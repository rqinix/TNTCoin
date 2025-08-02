import { taskManager } from "lib/Managers/TaskManager";
import { TntCoin } from "../index";
import { TntCoinSession } from "types";

export class AutoSaveService {
    /**
     * Start the auto-save process for the TNT Coin
     * @param tntcoin The TntCoin instance to auto-save
     */
    public startAutoSave(tntcoin: TntCoin): void {
        this.save(tntcoin);
        taskManager.addTask(tntcoin.taskAutoSaveId, () => this.startAutoSave(tntcoin), 20);
    }

    /**
     * Stop the auto-save for the TNT Coin
     * @param tntcoin The TntCoin instance
     */
    public stopAutoSave(tntcoin: TntCoin): void {
        taskManager.clearTask(tntcoin.taskAutoSaveId);
    }

    /**
     * Perform a single save operation for the TNT Coin
     * @param tntcoin The TntCoin instance to save
     */
    public save(tntcoin: TntCoin): void {
        const gameState: TntCoinSession = {
            isPlayerInGame: tntcoin.isPlayerInSession,
            settings: tntcoin.settings.getTntCoinSettings(),
            structureProperties: tntcoin.structure.structureProperties
        };
        tntcoin.propertiesManager.setProperty(tntcoin.key, JSON.stringify(gameState));
    }
}