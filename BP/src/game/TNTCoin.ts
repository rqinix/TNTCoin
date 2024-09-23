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
import { EventActionManager } from "../core/EventActionManager";

/**
 * Represents a TNTCoin game instance.
 */
export class TNTCoin {
    private readonly _player: Player;
    private readonly _propertiesManager: DynamicPropertiesManager;
    private readonly _structure: TNTCoinStructure;
    private readonly _feedback: PlayerFeedback;
    private readonly _countdown: Countdown;
    private readonly _timerManager: Timer;
    private readonly _winManager: WinManager;
    private readonly _actionBar: ActionBar;
    private readonly _giftGoal: GiftGoal;

    private readonly _giftActionManager: EventActionManager<GiftAction>;
    private readonly _followActionManager: EventActionManager<FollowAction>;
    private readonly _shareActionManager: EventActionManager<ShareAction>;
    private readonly _memberActionManager: EventActionManager<MemberAction>;

    private _isPlayerInGame: boolean = false;

    private readonly _gameKey: string;
    private readonly _taskAutoSaveId: string;
    private readonly _taskCameraId: string;
    private readonly _taskFillCheckId: string;

    private _useBarriers: boolean = false;
    private _doesCameraRotate: boolean = true;
    private _randomizeBlocks: boolean = true;
    private _summonEntityFormSettings: SummonOptions = {
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

    /**
     * Creates a new TNTCoin game instance.
     * @param {Player} player The player to create the game for.
     */
    constructor(player: Player) {
        this._gameKey = 'TNTCoinGameState';
        this._player = player;

        this._propertiesManager = new DynamicPropertiesManager(player);
        this._structure = new TNTCoinStructure(player);
        this._feedback = new PlayerFeedback(player);
        this._actionBar = new ActionBar(player);
        this._countdown = new Countdown(10, player);
        this._timerManager = new Timer(player, 180, this._actionBar);
        this._winManager = new WinManager(10, this._actionBar);
        this._giftGoal = new GiftGoal(player, this._actionBar);

        this._giftActionManager = new EventActionManager(player, 'GiftActions');
        this._followActionManager = new EventActionManager(player, 'FollowActions');
        this._shareActionManager = new EventActionManager(player, 'ShareActions');
        this._memberActionManager = new EventActionManager(player, 'MemberActions');

        this._taskAutoSaveId = `${player.name}:autosave`;
        this._taskFillCheckId = `${player.name}:fillcheck`;
        this._taskCameraId = `${player.name}:camera`;

        this._timerManager.addOnEndCallback(() => onLose(this));
        this._countdown.addOnEndCallback(() => onWin(this));
        this._countdown.addOnCancelCallback(() => onCountdownCancel(this));
    }

    public get settings(): GameSettings {
        return {
            doesCameraRotate: this._doesCameraRotate,
            useBarriers: this._useBarriers,
            randomizeBlocks: this._randomizeBlocks,
            wins: this._winManager.getCurrentWins(),
            maxWins: this._winManager.getMaxWins(),
            timerDuration: this.timerManager.getTimerDuration(),
            defaultCountdownTime: this._countdown.defaultCountdownTime,
            countdownTickInterval: this._countdown.tickInterval,
            fillSettings: this._structure.fillSettings,
            giftGoalSettings: this._giftGoal.settings,
            summonEntitySettings: this._summonEntityFormSettings,
        };
    }

    public set settings(settings: GameSettings) {
        this._doesCameraRotate = settings.doesCameraRotate;
        this._useBarriers = settings.useBarriers;
        this._randomizeBlocks = settings.randomizeBlocks;
        this._winManager.setWins(settings.wins);
        this._winManager.setMaxWins(settings.maxWins);
        this._timerManager.setTimerDuration(settings.timerDuration);
        this._countdown.defaultCountdownTime = settings.defaultCountdownTime;
        this._countdown.tickInterval = settings.countdownTickInterval;
        this._structure.fillSettings = settings.fillSettings;
        this._giftGoal.settings = settings.giftGoalSettings;
        this._summonEntityFormSettings = settings.summonEntitySettings;
    }

    public get summonEntityFormSettings(): SummonOptions {
        return this._summonEntityFormSettings;
    }

    public set summonEntityFormSettings(settings: SummonOptions) {
        this._summonEntityFormSettings = {
            ...this._summonEntityFormSettings, 
            ...settings,
        };
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

    public get giftActionManager(): EventActionManager<GiftAction> {
        return this._giftActionManager;
    }

    public get followActionManager(): EventActionManager<FollowAction> {
        return this._followActionManager;
    }

    public get shareActionManager(): EventActionManager<ShareAction> {
        return this._shareActionManager;
    }

    public get memberActionManager(): EventActionManager<MemberAction> {
        return this._memberActionManager;
    }

    /**
     * Start the game
     */
    public async startGame(): Promise<void> {
        try {
            await this._structure.generateProtectedStructure();
            if (this.settings.useBarriers) await this._structure.generateBarriers();

            this._player.setSpawnPoint({ 
                ...this._structure.structureCenter, 
                dimension: this._player.dimension 
            });
            this.teleportPlayer();

            this.checkGameStatus();
            this._actionBar.start();
            this.autoSaveGameState();

            this._feedback.playSound('random.anvil_use');
            this._feedback.playSound('random.levelup');
        } catch (error) {
            this._feedback.error(`Failed to start game. ${error.message}`, { sound: 'item.shield.block' });
            this.quitGame();
            throw error;
        }
    }

    private autoSaveGameState(): void {
        const gameState: GameState = {
            isPlayerInGame: this._isPlayerInGame,
            gameSettings: this.settings,
            structureProperties: this._structure.structureProperties,
        };
        this._propertiesManager.setProperty(this._gameKey, JSON.stringify(gameState));
        taskManager.addTimeout(this._taskAutoSaveId, () => this.autoSaveGameState(), 20);
    }

    /**
     * Load the game state from the player's dynamic properties.
     */
    public loadGameState(): void {
        const properties = this._propertiesManager.getProperty(this._gameKey) as string;
        const gameState = JSON.parse(properties) as GameState;
        this._isPlayerInGame = gameState.isPlayerInGame;
        this.settings = gameState.gameSettings;
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
        if (this._countdown.isCountingDown) {
            this._feedback.warning('Cannot quit the game while countdown is active.', { sound: 'item.shield.block' });
            return;
        }

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
        this.clearGameTasks();
        this._countdown.reset();
        this._structure.fillStop();
        this._actionBar.stop();
        this._timerManager.stop();
        this._winManager.clearActionbar();
        this._giftGoal.clearActionbar();
        this.cameraClear();
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

    public summonEntities(options: SummonOptions): void {
        summonEntities(this, options);
    }

    public summonFireworks(amount: number): void {
        this.summonEntities({
            entityName: 'fireworks_rocket',
            locationType: 'random',
            amount: amount
        });
    }
    
    /**
     * summons TNT at random locations in the structure
     */
    public summonTNT(): void {
        this.summonEntities({ 
            entityName: 'tnt_minecart',
            locationType: 'random', 
            onTop: true 
        });
    }

    private clearGameTasks(): void {
        taskManager.clearTasks([
            this._taskFillCheckId, 
            this._taskCameraId,
            this._taskAutoSaveId
        ]);
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
            try {
                this.handleGameProgress(this._structure.isStructureFilled());
            } catch (error) {
                console.error(`Error checking game status: ${error.message}`);
                this.clearGameTasks();
            }
        }, 20);
    } 

    /**
     * Handles the progress of the game, including managing countdowns and checking for wins.
     * @param {boolean} isStructureFilled - Whether the structure is fully filled.
     */
    private handleGameProgress(isStructureFilled: boolean): void {
        try {
            if (this._winManager.hasReachedMaxWins()) {
                onMaxWin(this);
            } else {
                this.handleCountdown(isStructureFilled);
            }
        } catch (error) {
            console.error(`Error handling game progress: ${error.message}`);
            throw error;
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
            this._countdown.reset();
        } else if (isStructureFilled && !this._countdown.isCountingDown) {
            this.cameraRotate360();
            this._countdown.start();
        }
    }
}