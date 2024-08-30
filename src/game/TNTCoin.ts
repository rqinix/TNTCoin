import { Player, ScriptEventCommandMessageAfterEvent, Vector3 } from "@minecraft/server";
import { TNTCoinStructure } from "./TNTCoinStructure";
import { Countdown } from "../core/Countdown";
import { taskManager } from "../core/TaskManager";
import { rotateCamera360 } from "./utilities/camera/rotate360";
import { floorVector3 } from "./utilities/math/floorVector";
import { Timer } from "../core/Timer";
import { event as eventHandlerRegistry } from "./events/tiktok/index";
import { PlayerFeedback } from "../core/PlayerFeedback";
import { WinManager } from "../core/WinManager";
import { onMaxWin } from "./events/tntcoin/onMaxWin";
import { onCountdownCancel } from "./events/tntcoin/onCountdownCancel";
import { ActionBar } from "../core/ActionBar";
import { INGAME_PLAYERS } from "./TNTCoinGui";
import { GiftGoal } from "../core/GiftGoal";
import { DynamicPropertiesManager } from "../core/DynamicPropertiesManager";
import { summonEntities } from "./utilities/entities/spawner";
import { onLose } from "./events/tntcoin/onLose";
import { onWin } from "./events/tntcoin/onWin";

/**
 * Represents a TNTCoin game instance.
 */
export class TNTCoin {
    private readonly _player: Player;
    private readonly _structure: TNTCoinStructure;
    private readonly _feedback: PlayerFeedback;
    private readonly _countdown: Countdown;
    private readonly _timerManager: Timer;
    private readonly _winManager: WinManager;
    private readonly _actionBar: ActionBar;
    private readonly _giftGoal: GiftGoal;
    private readonly _propertiesManager: DynamicPropertiesManager;

    private _isPlayerInGame: boolean = false;

    private readonly _gameKey: string;
    private readonly _taskCameraId: string;
    private readonly _taskFillCheckId: string;

    private _useBarriers: boolean = false;
    private _doesCameraRotate: boolean = true;
    private _randomizeBlocks: boolean = true;

    /**
     * Creates a new TNTCoin game instance.
     * @param {Player} player The player to create the game for.
     */
    constructor(player: Player) {
        this._gameKey = 'TNTCoinGameState';
        this._player = player;

        this._structure = new TNTCoinStructure(player);
        this._feedback = new PlayerFeedback(player);
        this._actionBar = new ActionBar(player);
        this._countdown = new Countdown(10, player);
        this._timerManager = new Timer(player, 180, this._actionBar);
        this._winManager = new WinManager(10, this._actionBar);
        this._giftGoal = new GiftGoal(player, this._actionBar);
        this._propertiesManager = new DynamicPropertiesManager(player);

        this._taskFillCheckId = `${player.name}:fillcheck`;
        this._taskCameraId = `${player.name}:camera`;

        this._timerManager.addOnEndCallback(() => onLose(this));
        this._countdown.addOnEndCallback(() => onWin(this));
        this._countdown.addOnCancelCallback(() => onCountdownCancel(this));
    }

    public get gameSettings(): GameSettings {
        return {
            wins: this._winManager.getCurrentWins(),
            maxWins: this._winManager.getMaxWins(),
            fillSettings: this._structure.fillSettings,
            defaultCountdownTime: this._countdown.defaultCountdownTime,
            countdownTickInterval: this._countdown.tickInterval,
            doesCameraRotate: this._doesCameraRotate,
            useBarriers: this._useBarriers,
            randomizeBlocks: this._randomizeBlocks,
            giftGoal: this._giftGoal.settings,
            timerDuration: this.timerManager.getTimerDuration(),
        };
    }

    public set gameSettings(settings: GameSettings) {
        this._winManager.setWins(settings.wins);
        this._winManager.setMaxWins(settings.maxWins);
        this._structure.fillSettings = settings.fillSettings;
        this._countdown.defaultCountdownTime = settings.defaultCountdownTime;
        this._countdown.tickInterval = settings.countdownTickInterval;
        this._doesCameraRotate = settings.doesCameraRotate;
        this._useBarriers = settings.useBarriers;
        this._randomizeBlocks = settings.randomizeBlocks;
        this._giftGoal.settings = settings.giftGoal;
        this._timerManager.setTimerDuration(settings.timerDuration);
    }

    public get player(): Player {
        return this._player;
    }

    public get isPlayerInGame(): boolean {
        return this._isPlayerInGame;
    }

    public set isPlayerInGame(value: boolean) {
        this._isPlayerInGame = value;
    }

    public get structure(): TNTCoinStructure {
        return this._structure;
    }

    public get feedback(): PlayerFeedback {
        return this._feedback;
    }

    public get countdown(): Countdown {
        return this._countdown;
    }

    public get winManager(): WinManager {
        return this._winManager;
    }

    public get actionbar(): ActionBar {
        return this._actionBar;
    }

    public get giftGoal(): GiftGoal {
        return this._giftGoal;
    }

    public get timerManager(): Timer {
        return this._timerManager;
    }

    /**
     * Start the game
     */
    public async startGame(): Promise<void> {
        try {
            await this._structure.generateProtectedStructure();
            if (this.gameSettings.useBarriers) await this._structure.generateBarriers();

            this._player.setSpawnPoint({ 
                ...this._structure.structureCenter, 
                dimension: this._player.dimension 
            });
            this.teleportPlayer();

            this.checkGameStatus();
            this._actionBar.start();

            this.saveGameState();

            this._feedback.playSound('random.anvil_use');
            this._feedback.playSound('random.levelup');
        } catch (error) {
            this._feedback.error(`Failed to start game. ${error.message}`, { sound: 'item.shield.block' });
            this.quitGame();
            throw error;
        }
    }

    public saveGameState(): void {
        const gameState: GameState = {
            isPlayerInGame: this._isPlayerInGame,
            gameSettings: this.gameSettings,
            structureProperties: this._structure.structureProperties,
        };
        this._propertiesManager.setProperty(this._gameKey, JSON.stringify(gameState));
    }

    /**
     * Load the game state from the player's dynamic properties.
     */
    public loadGameState(): void {
        const properties = this._propertiesManager.getProperty(this._gameKey) as string;
        const gameState = JSON.parse(properties) as GameState;
        this._isPlayerInGame = gameState.isPlayerInGame;
        this.gameSettings = gameState.gameSettings;
        this._structure.structureProperties = JSON.stringify(gameState.structureProperties);
    }

    /**
     * Load the game
     * @returns {Promise<void>} a promise that resolves when the game has been successfully loaded.
     */
    public async loadGame(): Promise<void> { 
        try {
            this.loadGameState();
            await this.startGame();
            console.warn(`Game loaded for player ${this._player.name}`);
        } catch (error) {
            console.error(`Error loading game: ${error}`);
        }
    }

    /**
     * Quit the game
     * @returns {Promise<void>} a promise that resolves when the game has been successfully quit.
     */
    public async quitGame(): Promise<void> {
        try {
            await this.cleanGameSession();
            this._propertiesManager.removeProperty(this._gameKey);
            this._propertiesManager.removeProperty(this._structure.structureKey);
            this.isPlayerInGame = false;
            INGAME_PLAYERS.delete(this._player.name);
        } catch (error) {
            console.error(`Error quitting game: ${error}`);
        }
    }

    /**
     * Resets the game by clearing all filled blocks and camera rotation.
     * @returns {Promise<void>} A promise that resolves when the game is restarted.
     */
    public async resetGame(): Promise<void> {
        this.cameraClear();
        await this._structure.clearFilledBlocks();
    }

    /**
    * Cleans up the game session by stopping all activities and clearing blocks.
    * @returns {Promise<void>} A promise that resolves when the cleanup is complete.
    */
    public async cleanGameSession(): Promise<void> { 
        this.cameraClear();

        this._countdown.reset();
        this._actionBar.stop();
        this._timerManager.stop();
        this._winManager.clearActionbar();
        this._giftGoal.clearActionbar();

        this._structure.fillStop();
        taskManager.clearTasks([this._taskFillCheckId, this._taskCameraId]);
        await this._structure.clearFilledBlocks();
        await this._structure.clearProtedtedStructure();
    }

    /**
     * Rotates the player's camera 360 degrees around the structure.
     */
    public cameraRotate360(): void {
        if (!this._doesCameraRotate) return;
        const tickInterval = 5;
        rotateCamera360(
            this._player, 
            this._taskCameraId,
            floorVector3(this._structure.structureCenter), 
            this._structure.structureWidth, 
            this._structure.structureHeight + 12, 
            tickInterval
        );
    }

    /**
     * Returns the player to their normal perspective
     */
    public cameraClear(): void {
        taskManager.clearTask(this._taskCameraId);
        this._player.camera.clear();
    }
    
    /**
    * teleport the player to the center of structure
    * @param {number} height The height to teleport the player to. Default is 1.
    */
    public teleportPlayer(height: number = 1): void {
        const TELEPORT_SOUND = 'mob.shulker.teleport';
        const { x, y, z } = this._structure.structureCenter;
        const location = {x, y: y + height, z};
        this._player.teleport(location);
        this._feedback.playSound(TELEPORT_SOUND);
    }

    public summonEntities(entityName: string, options: SummonOptions): void {
        summonEntities(this, entityName, options);
    }

    public summonFireworks(amount: number): void {
        summonEntities(this, 'fireworks_rocket', {
            locationType: 'random',
            amount: amount
        });
    }
    
    /**
     * summons TNT at random locations in the structure
     */
    public summonTNT(): void {
        summonEntities(this, 'tnt_minecart', { locationType: 'random', onTop: true });
    }

    /**
     * Summons lightning bolts and destroy random blocks in the structure.
     * @param amount The amount of lightning bolts to summon. Default is 1.
     */
    public summonLightningBolt(amount: number = 1): void {
        const locations: Vector3[] = [];
    
        for (let i = 0; i < amount; i++) {
            if (this._structure.filledBlockLocations.size === 0) return;

            const filledBlockLocationsArray = Array.from(this._structure.filledBlockLocations);
            const randomIndex = Math.floor(Math.random() * filledBlockLocationsArray.length);
            const randomLocationJson = filledBlockLocationsArray[randomIndex];
            const randomLocation = JSON.parse(randomLocationJson);
            
            locations.push(randomLocation);
        }
    
        summonEntities(this, 'lightning_bolt', {
            customLocations: locations,
            clearBlocksAfterSummon: true,
        });
    } 


    /**
     * Handles script events.
     * @param {ScriptEventCommandMessageAfterEvent} event - The event and message to handle
     */
    public handleScriptEvents(event: ScriptEventCommandMessageAfterEvent): void {
        if (!event.id.startsWith('tntcoin')) return;
        const eventType = event.id.split(':')[1];
        if (!eventHandlerRegistry.isEventEnabled(eventType)) return;
        const message = event.message;
        const handler = eventHandlerRegistry.getHandler(eventType);
        if (handler) handler(this, message);
    }

    /**
     * Checks the game status to determine if the structure is filled.
     */
    public checkGameStatus(): void {
        taskManager.addInterval(this._taskFillCheckId, () => {
            if (!this.isPlayerInGame) {
                taskManager.clearTask(this._taskFillCheckId);
                throw new Error('Player is not in game.');
            }
            this.handleGameProgress(this._structure.isStructureFilled());
        }, 20);
    } 

    /**
     * Handles the progress of the game, including managing countdowns and checking for wins.
     * @param {boolean} isStructureFilled - Whether the structure is fully filled.
     */
    private handleGameProgress(isStructureFilled: boolean): void {
        if (this._winManager.hasReachedMaxWins()) {
            onMaxWin(this);
        } else {
            this.handleCountdown(isStructureFilled);
        }
    }

    /**
     * Manages the countdown based on whether the structure is filled or not.
     * @param {boolean} isStructureFilled - Whether the structure is fully filled.
     */
    private handleCountdown(isStructureFilled: boolean): void {
        if (!isStructureFilled && this._countdown.isCountingDown) {
            this.cameraClear();
            this._countdown.pause();
        } else if (isStructureFilled && !this._countdown.isCountingDown) {
            this.cameraRotate360();
            this._countdown.start();
        }
    }
}