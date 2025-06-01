import { TntCoin } from "../index";
import TntCoinPlayerRegistry from "../TntCoinPlayerRegistry";
import CameraUtils from "utilities/camera/CameraUtils";

/**
 * Manages the core TNT Coin lifecycle methods for the TNT Coin
 */
export class LifeCycleService {
    /**
     * Starts a TNT Coin session
     * @param tntcoin The TntCoin instance to start
     */
    public async start(tntcoin: TntCoin): Promise<void> {
        try {
            await tntcoin.structure.generateTntCoinStructure();
            if (tntcoin.settings.getTntCoinSettings().useBarriers) {
                await tntcoin.structure.generateBarriers();
            }
            this.teleportPlayer(tntcoin);
            tntcoin.player.setSpawnPoint();
            tntcoin.isPlayerInSession = true;
            tntcoin.actionbar.start();
            tntcoin.checkStatus();
            tntcoin.autoSaveSession();
            tntcoin.feedback.playSound('random.anvil_use');
            tntcoin.feedback.playSound('random.levelup');
        } catch (error) {
            tntcoin.feedback.error(`Error while starting TNT Coin: ${error.message}`, { sound: 'item.shield.block' });
            await this.quit(tntcoin);
            throw error;
        }
    }

    /**
     * Loads a previously saved TNT Coin
     * @param tntcoin The TntCoin instance to load
     */
    public async load(tntcoin: TntCoin): Promise<void> {
        try {
            tntcoin.clearTasks();
            const properties = tntcoin.propertiesManager.getProperty(tntcoin.key) as string;
            const session = JSON.parse(properties) as TntCoinSession;
            tntcoin.isPlayerInSession = session.isPlayerInGame;
            tntcoin.settings.updateTntCoinSettings(session.settings);
            tntcoin.structure.structureProperties = session.structureProperties;
            await this.start(tntcoin);
        } catch (error) {
            console.warn(`Error while loading TNT Coin: ${error}`);
        }
    }

    /**
     * Quits TNT Coin session
     * @param tntcoin The TntCoin instance to quit
     */
    public async quit(tntcoin: TntCoin): Promise<void> {
        if (tntcoin.countdown.isCountingDown) {
            tntcoin.feedback.warning('Cannot quit the game while countdown is active.', { sound: 'item.shield.block' });
            return;
        }
        try {
            await this.clean(tntcoin);
            const registry = TntCoinPlayerRegistry.getInstance();
            registry.unregister(tntcoin.player);
        } catch (error) {
            console.error(`Error quitting game: ${error}`);
        }
    }

    /**
     * Resets the TNT Coin by clearing filled blocks and camera rotation
     * @param tntcoin The TntCoin instance to reset
     */
    public async clearTntCoinEnvironment(tntcoin: TntCoin): Promise<void> {
        CameraUtils.clearTaskCamera(tntcoin.player, `rotateCamera360`);
        await tntcoin.structure.clearBlocks();
    }

    /**
     * Cleans up the TNT Coin session by stopping all activities and clearing TNT Coin structure
     * @param tntcoin The TntCoin instance to clean
     */
    public async clean(tntcoin: TntCoin): Promise<void> {
        tntcoin.event.unsubscribe(tntcoin.eventMap.onCountdownInterrupted);
        tntcoin.event.unsubscribe(tntcoin.eventMap.onCountdownEnded);
        tntcoin.event.unsubscribe(tntcoin.eventMap.onTntCoinTimerEnded);
        CameraUtils.clearTaskCamera(tntcoin.player, `rotateCamera360`);
        tntcoin.clearTasks();
        tntcoin.structure.stopFilling();
        tntcoin.countdown.stop();
        tntcoin.actionbar.stop();
        tntcoin.timer.stop();
        tntcoin.wins.clearActionbar();
        tntcoin.giftGoal.clearActionbar();
        await tntcoin.structure.clearBlocks();
        await tntcoin.structure.destroy();
        tntcoin.propertiesManager.removeProperty(tntcoin.key);
        tntcoin.propertiesManager.removeProperty(tntcoin.structure.key);
        tntcoin.isPlayerInSession = false;
    }

    /**
     * Teleports the player to the center of the structure
     * @param tntcoin The TntCoin instance
     * @param height Optional height offset, defaults to 1
     */
    public teleportPlayer(tntcoin: TntCoin, height: number = 1): void {
        const { x, y, z } = tntcoin.structure.structureCenter;
        const location = { x, y: y + height, z };
        tntcoin.player.teleport(location);
        tntcoin.feedback.playSound('mob.shulker.teleport');
    }
}