import { TntCoin } from "../index";
import TntCoinPlayerRegistry from "../TntCoinPlayerRegistry";
import CameraUtils from "utilities/camera/CameraUtils";
import ServiceRegistry from "lib/System/ServiceRegistry";
import { TntRainService } from "./TntRainService";

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
            tntcoin.teleportPlayer(tntcoin.structure.structureHeight);
            tntcoin.player.setSpawnPoint();
            tntcoin.isPlayerInSession = true;
            tntcoin.actionbar.start();
            tntcoin.checkStatus();
            tntcoin.autoSaveSession();
            tntcoin.jailService.loadJailState();
            this.initializeTntRainService(tntcoin);
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
            this.stopTntRain(tntcoin);
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
        if (this.isTntRainActive()) {
            tntcoin.feedback.warning('Stopping active TNT Rain...', { sound: 'mob.wither.spawn' });
            this.stopTntRain(tntcoin);
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
        if (this.isTntRainActive()) {
            tntcoin.feedback.info('Stopping TNT Rain during environment reset...', { sound: 'random.pop' });
            this.stopTntRain(tntcoin);
        }
        CameraUtils.clearTaskCamera(tntcoin.player, `rotateCamera360`);
        await tntcoin.structure.clearBlocks();
    }

    /**
     * Cleans up the TNT Coin session by stopping all activities and clearing TNT Coin structure
     * @param tntcoin The TntCoin instance to clean
     */
    public async clean(tntcoin: TntCoin): Promise<void> {
        this.cleanupTntRainService(tntcoin);
        tntcoin.event.unsubscribe(tntcoin.eventMap.onCountdownInterrupted);
        tntcoin.event.unsubscribe(tntcoin.eventMap.onCountdownEnded);
        tntcoin.event.unsubscribe(tntcoin.eventMap.onTntCoinTimerEnded);
        if (tntcoin.jailService.isPlayerJailed) {
            tntcoin.jailService.releasePlayer();
        }
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
     * Initializes the TNT Rain service for the session
     * @param tntcoin The TntCoin instance
     */
    private initializeTntRainService(tntcoin: TntCoin): void {
        try {
            const serviceRegistry = ServiceRegistry.getInstance();
            let rainService = serviceRegistry.get('TntRainService') as TntRainService;
            if (!rainService) {
                rainService = new TntRainService(
                    tntcoin.player,
                    tntcoin,
                    tntcoin.structure,
                    tntcoin.actionbar
                );
                serviceRegistry.register('TntRainService', rainService);
                console.warn(`TNT Rain service initialized for player: ${tntcoin.player.name}`);
            } else {
                if (rainService.isRainActive) {
                    rainService.stopRain();
                }
            }
        } catch (error) {
            console.warn(`Failed to initialize TNT Rain service: ${error}`);
        }
    }

    /**
     * Checks if TNT Rain is currently active
     * @param tntcoin The TntCoin instance
     * @returns True if TNT Rain is active
     */
    private isTntRainActive(): boolean {
        try {
            const serviceRegistry = ServiceRegistry.getInstance();
            const rainService = serviceRegistry.get('TntRainService') as TntRainService;
            return rainService?.isRainActive ?? false;
        } catch (error) {
            console.warn(`Error checking TNT Rain status: ${error}`);
            return false;
        }
    }

    /**
     * Stops TNT Rain if it's currently active
     * @param tntcoin The TntCoin instance
     */
    private stopTntRain(tntcoin: TntCoin): void {
        try {
            const serviceRegistry = ServiceRegistry.getInstance();
            const rainService = serviceRegistry.get('TntRainService') as TntRainService;
            if (rainService?.isRainActive) {
                rainService.stopRain();
            }
        } catch (error) {
            console.warn(`Error stopping TNT Rain: ${error}`);
        }
    }

    /**
     * Cleans up TNT Rain service and removes it from registry
     * @param tntcoin The TntCoin instance
     */
    public cleanupTntRainService(tntcoin: TntCoin): void {
        try {
            const serviceRegistry = ServiceRegistry.getInstance();
            const rainService = serviceRegistry.get('TntRainService') as TntRainService;
            if (rainService) {
                if (rainService.isRainActive) {
                    rainService.stopRain();
                }
                serviceRegistry.remove('TntRainService');
            }
        } catch (error) {
            console.warn(`Error during TNT Rain service cleanup: ${error}`);
        }
    }
}
