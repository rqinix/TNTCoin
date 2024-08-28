import { Player, ScriptEventCommandMessageAfterEvent, system, Vector3 } from "@minecraft/server";
import { TNTCoinStructure } from "./TNTCoinStructure";
import { Countdown } from "../core/Countdown";
import { taskManager } from "../core/TaskManager";
import { rotateCamera360 } from "./utilities/camera/rotate360";
import { floorVector3 } from "./utilities/math/floorVector";
import { Timer } from "../core/Timer";
import { event as eventHandlerRegistry } from "./events/tiktok/index";
import { clearBlocks } from "./utilities/blocks/clearing";
import { PlayerFeedback } from "../core/PlayerFeedback";
import { Win } from "../core/WinManager";
import { batch } from "./utilities/batch";
import { onWin } from "./events/tntcoin/onWin";
import { onLose } from "./events/tntcoin/onLose";
import { onMaxWin } from "./events/tntcoin/onMaxWin";
import { onCountdownCancelled } from "./events/tntcoin/onCountdownCancel";

/**
 * Represents a TNTCoin game instance.
 */
export class TNTCoin {
    private readonly _player: Player;
    private readonly _structure: TNTCoinStructure;
    private readonly _feedback: PlayerFeedback;
    private readonly _countdown: Countdown;
    private readonly _timer: Timer;
    private readonly _winManager: Win;
    private readonly _gameKey: string;
    private _isPlayerInGame: boolean = false;

    private _useBarriers: boolean = false;
    private _doesCameraRotate: boolean = true;
    private _randomizeBlocks: boolean = true;

    private _timerDuration: number = 180;

    private _taskCameraId: string;
    private _taskFillCheckId: string;
    
    /**
     * Creates a new TNTCoin game instance.
     * @param {Player} player The player to create the game for.
     */
    constructor(player: Player) {
        this._gameKey = 'TNTCoinGameState';
        this._player = player;
        this._structure = new TNTCoinStructure(player);
        this._feedback = new PlayerFeedback(player);
        this._countdown = new Countdown(10, player);
        this._timer = new Timer(player);
        this._winManager = new Win(10);
        this._taskFillCheckId = `${player.name}:fillcheck`;
        this._taskCameraId = `${player.name}:camera`;
    }

    public get key(): string {
        return this._gameKey;
    }

    public get player(): Player {
        return this._player;
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

    public get winManager(): Win {
        return this._winManager;
    }

    public get isPlayerInGame(): boolean {
        return this._isPlayerInGame;
    }

    public set isPlayerInGame(value: boolean) {
        this._isPlayerInGame = value;
    }

    public set timerDuration(value: number) {
        this._timerDuration = value;
    }

    public get timerDuration(): number {
        return this._timerDuration;
    }

    public get isTimerRunning(): boolean {
        return this._timer.isTimerRunning;
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
    }

    /**
     * Save the game state to the player's dynamic properties.
     */
    public saveGameState(): void {
        const gameState: GameState = {
            isPlayerInGame: this._isPlayerInGame,
            structureProperties: this._structure.structureProperties,
            gameSettings: this.gameSettings,
        }

        try {
            this._player.setDynamicProperty(this._gameKey, JSON.stringify(gameState));
        } catch (error) {
            this._feedback.error('Failed to save game state.', { sound: "mob.wither.death" });
        }
    }

    /**
     * Load the game state from the player's dynamic properties.
     */
    public loadGameState(): void {
        try {
            const gameStateString = this._player.getDynamicProperty(this._gameKey) as string;
            if (!gameStateString) return;
            const gameState = JSON.parse(gameStateString) as GameState;
            this._isPlayerInGame = gameState.isPlayerInGame;
            this._structure.structureProperties = JSON.stringify(gameState.structureProperties);
            this.gameSettings = gameState.gameSettings;
        } catch (error) {
            this._feedback.error('Failed to load game state.', { sound: "mob.wither.death" });
        }
    }

    /**
     * Restarts the game.
     * @returns {Promise<void>} A promise that resolves when the game is restarted.
     */
    public async restartGame(): Promise<void> {
        await this._structure.clearFilledBlocks();
        this.cameraClear();
        this.timerManager('restart');
    }

    /**
    * Cleans up the game session by stopping all activities and clearing blocks.
    * @returns {Promise<void>} A promise that resolves when the cleanup is complete.
    */
    public async cleanGameSession(): Promise<void> {
        this.cameraClear();
        this._countdown.reset();
        this.timerManager('stop');
        this._structure.fillStop();
        taskManager.clearTasks([this._taskFillCheckId, this._taskCameraId]);
        await this._structure.clearFilledBlocks();
        await this._structure.clearProtedtedStructure();
    }

    public timerManager(action: TimerAction): void {
        const TIMER_START_SOUND = 'random.orb';
        switch (action) {
            case 'start':
                if (this._timer.isTimerRunning) {
                    this._feedback.error('Timer is already running.', { sound: "item.shield.block" });
                    return;
                }
    
                this._timer.toggleActionBar(true);
                this._timer.start(this._timerDuration, this.handleLose.bind(this));
                this._feedback.playSound(TIMER_START_SOUND);
                break;
    
            case 'stop':
                this._timer.stop();
                this._feedback.playSound(TIMER_START_SOUND);
                break;
    
            case 'restart':
                if (this._timer.isTimerRunning) {
                    this._timer.reset();
                    this._feedback.playSound(TIMER_START_SOUND);
                }
                break;
    
            default:
                throw new Error(`Unknown timer action: ${action}`);
        }
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
        const TELEPORT_PARTICLE = 'minecraft:eyeofender_death_explode_particle';

        this._player.teleport({ 
            x: this._structure.structureCenter.x, 
            y: this._structure.structureCenter.y + height, 
            z: this._structure.structureCenter.z 
        });
        
        try {
            this._player.dimension.spawnParticle(
                TELEPORT_PARTICLE, {
                    x: this._player.location.x,
                    y: this._player.location.y + 1,
                    z: this._player.location.z,
                }
            );
        } catch (error) {
            console.error('Failed to spawn teleport particle.');
        }

        this._feedback.playSound(TELEPORT_SOUND);
    }

    public summonFireworks(amount: number): void {
        this.summonEntities('fireworks_rocket', {
            locationType: 'random',
            amount: amount
        });
    }
    
    /**
     * summons TNT at random locations in the structure
     */
    public summonTNT(): void {
        this.summonEntities('tnt_minecart', { locationType: 'random', onTop: true });
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
    
        this.summonEntities('lightning_bolt', {
            customLocations: locations,
            clearBlocksAfterSummon: true,
        });
    } 

    /**
     * Summons entities in the game based on the provided options.
     * @param {string} entityName - The name of the entity to summon.
     * @param {SummonOptions} options - The options for summoning entities.
     */
    public summonEntities(
        entityName: string,
        options: SummonOptions
    ): void {
        const {
            locationType = 'random', 
            onTop = false,
            amount = 1,
            clearBlocksAfterSummon = false,
            customLocations = [],
            batchSize = 10, 
            delayBetweenBatches = 0,
            onSummon = () => {},
        } = options;

        let locations: Vector3[] = [];

        if (customLocations.length > 0) {
            locations = customLocations;
        } else if (locationType === 'center') {
            const centerLocation = {
                x: this._structure.structureCenter.x,
                y: onTop ? this._structure.structureCenter.y + this._structure.structureHeight + 5 : this._structure.structureCenter.y + 2,
                z: this._structure.structureCenter.z
            };
            locations = Array(amount).fill(centerLocation);
        } else if (locationType === 'random') {
            locations = Array.from({ length: amount }, () => this._structure.randomLocation(2, onTop));
        }

        batch(
            locations,
            batchSize,
            (location) => {
                try {
                    this._player.dimension.spawnEntity(entityName, location);
                    onSummon();
                    if (clearBlocksAfterSummon) {
                        clearBlocks(this._player.dimension, [location], 100);
                    }
                } catch (error) {
                    this._feedback.error(`Failed to summon ${entityName} at location: ${JSON.stringify(location)}`, { sound: "item.shield.block" });
                }
            },
            {
                delayInTicks: delayBetweenBatches
            }
        );
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
            this.handleMaxWin();
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
            this._countdown.start({
                onCancelled: this.handleCountdownCancelled.bind(this),
                onEnd: this.handleWin.bind(this),
            });
        }
    }

    private handleCountdownCancelled(): void {
        onCountdownCancelled(this);
    }

    private handleMaxWin(): void {
        onMaxWin(this);
    }

    private async handleWin(): Promise<void> {
        await onWin(this);
    }

    private async handleLose(): Promise<void> {
        await onLose(this);
    }
}