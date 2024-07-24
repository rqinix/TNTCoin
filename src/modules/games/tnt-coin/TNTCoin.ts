import { Player, system, Vector3 } from "@minecraft/server";
import { TNTCoinStructure } from "./TNTCoinStructure";
import { Countdown } from "../../../lib/Countdown";
import { taskManager } from "../../../lib/TaskManager";
import { rotateCamera360 } from "../../../utilities/camera/rotate360";
import { floorVector3 } from "../../../utilities/math/floorVector";
import { Timer } from "../../../lib/Timer";

/**
 * Represents a TNTCoin game instance.
 * @extends TNTCoinStructure
 */
export class TNTCoin extends TNTCoinStructure {
    protected readonly _countdown: Countdown;
    protected readonly _timer: Timer;
    protected readonly _gameKey: string;
    private _isPlayerInGame: boolean = false;

    private _wins: number = 0;
    private _winMax: number = 10;

    private doesCameraRotate: boolean = true;
    private cameraHeight: number = 12;
    
    private _timerDuration: number = 180;

    private taskCameraId: string;
    private taskFillCheckId: string;
    
    /**
     * Creates a new TNTCoin game instance.
     * @param {Player} player The player to create the game for.
     */
    constructor(player: Player) {
        super(player);
        this._gameKey = 'TNTCoinGameState';
        this._countdown = new Countdown(10, player);
        this._timer = new Timer(player);
        this.taskFillCheckId = `${player.name}:fillcheck`;
        this.taskCameraId = `${player.name}:camera`;
    }
    
    protected get gameSettings(): GameSettings {
        return {
            winMax: this._winMax,
            fillBlockName: this._fillBlockName,
            fillTickInteval: this._fillTickInterval,
            fillBlocksPerTick: this._fillBlocksPerTick,
            defaultCountdownTime: this._countdown.defaultCountdownTime,
            countdownTickInterval: this._countdown.tickInterval,
            doesCameraRotate: this.doesCameraRotate,
        };
    }

    protected set gameSettings(settings: GameSettings) {
        this._winMax = settings.winMax;
        this._fillBlockName = settings.fillBlockName;
        this._fillTickInterval = settings.fillTickInteval;
        this._fillBlocksPerTick = settings.fillBlocksPerTick;
        this._countdown.defaultCountdownTime = settings.defaultCountdownTime;
        this._countdown.tickInterval = settings.countdownTickInterval;
        this.doesCameraRotate = settings.doesCameraRotate;
    }

    public get isPlayerInGame(): boolean {
        return this._isPlayerInGame;
    }

    public set isPlayerInGame(value: boolean) {
        this._isPlayerInGame = value;
    }

    protected get isWin(): boolean {
        return this._wins >= this._winMax;
    }

    protected get wins(): number {
        return this._wins;
    }

    protected set wins(value: number) {
        this._wins = value;
    }

    protected get winMax(): number {
        return this._winMax;
    }

    protected set winMax(value: number) {
        this._winMax = value;
    }

    protected set timerDuration(value: number) {
        this._timerDuration = value;
    }

    protected get timerDuration(): number {
        return this._timerDuration;
    }

    /**
     * Save the game state to the player's dynamic properties.
     */
    protected saveGameState(): void {
        const gameState: GameState = {
            isPlayerInGame: this._isPlayerInGame,
            structureProperties: this.structureProperties,
            gameSettings: this.gameSettings,
            wins: this._wins,
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
    protected loadGameState(): void {
        try {
            const gameStateString = this._player.getDynamicProperty(this._gameKey) as string;
            if (!gameStateString) return;
            const gameState = JSON.parse(gameStateString) as GameState;
            this._isPlayerInGame = gameState.isPlayerInGame;
            this.structureProperties = JSON.stringify(gameState.structureProperties);
            this.gameSettings = gameState.gameSettings;
            this._wins = gameState.wins;
        } catch (error) {
            this._feedback.error('Failed to load game state.', { sound: "mob.wither.death" });
        }
    }

    /**
    * Cleans up the game session by stopping all activities and clearing blocks.
    * @returns {Promise<void>} A promise that resolves when the cleanup is complete.
    */
    protected async cleanGameSession(): Promise<void> {
        this.cameraClear();
        taskManager.clearTasks([this.taskFillCheckId, this.taskCameraId,]);
        this.fillStop();
        await this.clearFilledBlocks();
        await this.clearProtedtedStructure();
        this._feedback.playSound('random.levelup');
    }
    
    /**
    * Starts listening for the structure being fully filled. Starts the countdown when it is filled.
    */
    protected startFillListener(): void {
        taskManager.addInterval(this.taskFillCheckId, async () => {
            if (!this.isPlayerInGame) return;
            const isStructureFilled = this.isStructureFilled();
    
            if (this.isWin) {
                await this.onWin();
                this.resetWin();
                this.saveGameState();
            }
    
            if (!isStructureFilled) {
                if (this._countdown.isCountingDown) {
                    this.cameraClear();
                    this._countdown.pause();
                }
            } else {
                if (!this._countdown.isCountingDown) {
                    this.cameraRotate360();
                    this._countdown.start({
                        onCancelled: this.onCountdownCancelled.bind(this),
                        onEnd: this.onCountdownEnd.bind(this),
                    });
                }
            }
        }, 20);
    }

    /** 
    * handles the event when the countdown is cancelled
    */
    private onCountdownCancelled(): void {
        const TITLE = '§cOHHH NOOOO!!!§r'
        const SOUND = 'random.totem';

        this._feedback.setTitle(TITLE);
        this._feedback.playSound(SOUND);
    }

    /**
     * Handles the event when the countdown ends.
     */
    private onCountdownEnd(): void {
        system.run(async () => await this.onWin());
    }

    /** 
     * Handles the event when the player wins.
     * @returns {Promise<void>} A promise that resolves when the player wins.
     */
    private async onWin(): Promise<void> {
        if (this._wins >= this._winMax) {
            await this.onMaxWin();
            return;
        }

        this.incrementWin();

        const TITLE = `§a${this._wins}§f/§a${this._winMax}`;
        const SUBTITLE = '§eYou win!§r';
        const SOUND = 'random.levelup';

        this._feedback.setTitle(TITLE);
        this._feedback.setSubtitle(SUBTITLE);
        this._feedback.playSound(SOUND);
        this.summonEntity('fireworks_rocket', () => this.randomLocation(2), 20);

        await this.restartGame();
    }

    /**
     * Handles the event when the player loses.
     * @returns {Promise<void>} A promise that resolves when the player loses.
     */
    private async onLose(): Promise<void> {
        this.decrementWin();

        const TITLE = `§c${this._wins}§f/§a${this._winMax}`;
        const SUBTITLE = '§cYou lose!§r';
        const SOUND = 'random.totem';

        this._feedback.setTitle(TITLE);
        this._feedback.setSubtitle(SUBTITLE);
        this._feedback.playSound(SOUND);

        await this.restartGame();
    }

    /**
     * Handles the event when the player reaches the maximum number of wins.
     * @returns {Promise<void>} A promise that resolves when the player reaches the maximum number of wins.
     */
    private async onMaxWin(): Promise<void> {
        const TITLE = `§a${this._wins}§f/§a${this._winMax}§r\n§eCongratulations!§r`;
        const SUBTITLE = '§eYou have won the game!§r';
        const SOUND = 'random.levelup';

        this._feedback.setTitle(TITLE);
        this._feedback.setSubtitle(SUBTITLE);
        this._feedback.playSound(SOUND);

        await this.restartGame();
    }

    /**
     * Increments the win count.
     */
    private incrementWin(): void {
        this._wins++;
    }

    /**
     * Decrements the win count.
     */
    private decrementWin(): void {
        this._wins--;
    }

    /**
    * reset the win count
    */
    private resetWin(): void {
        this._wins = 0;
    }

    /**
     * Restarts the game.
     * @returns {Promise<void>} A promise that resolves when the game is restarted.
     */
    private async restartGame(): Promise<void> {
        await this.clearFilledBlocks();
        this.cameraClear();
        this.timerRestart();
    }

    /**
     * Restarts the game timer.
     */
    protected timerRestart(): void {
        if (this._timer.isDisplayOnActionBar) {
            this._timer.reset();
            this.timerStart();
        }
    }

    /**
     * Starts the game timer.
     */
    protected timerStart(): void {
        const TIMER_START_SOUND = 'random.orb';

        this._timer.toggleActionBar(true);
        this._timer.start(this.timerDuration, async () => await this.onLose.bind(this));
        this._feedback.playSound(TIMER_START_SOUND);
    }

    /**
     * Stops the timer.
     */
    protected timerStop(): void {
        const SOUND = 'random.orb';
        
        this._timer.stop();
        this._feedback.playSound(SOUND);
    }

    /**
     * Rotates the player's camera 360 degrees around the structure.
     */
    private cameraRotate360(): void {
        if (!this.doesCameraRotate) return;
        rotateCamera360(
            this._player, 
            this.taskCameraId,
            floorVector3(this.structureCenter), 
            this.structureWidth, 
            this.structureHeight + this.cameraHeight, 
            5
        );
    }

    /**
     * Returns the player to their normal perspective
     */
    private cameraClear(): void {
        if (taskManager.has(this.taskCameraId)) {
            taskManager.clearTask(this.taskCameraId);
            this._player.camera.clear();
        }
    }
    
    /**
    * teleport the player to the center of structure
    */
    protected teleportPlayer(): void {
        const TELEPORT_SOUND = 'mob.shulker.teleport';
        const TELEPORT_PARTICLE = 'minecraft:eyeofender_death_explode_particle';

        this._player.teleport({ 
            x: this.structureCenter.x, 
            y: this.structureCenter.y + 1, 
            z: this.structureCenter.z 
        });

        const location = this._player.location;
        
        this._dimension.spawnParticle(
            TELEPORT_PARTICLE, {
                x: location.x,
                y: location.y + 1,
                z: location.z,
            }
        );
        this._feedback.playSound(TELEPORT_SOUND);
    }
    
    /**
    * Summon a TNT.
    */
    protected summonTNT(): void {
        this._dimension.spawnEntity('tnt_minecart', this.randomLocation(2, false));
    }
    
    /**
     * Summon an entity.
     * @param {string} entityName The name of the entity to summon.
     * @param {Vector3 | (() => Vector3)} location The location to summon the entity at.
     * @param {number} amount The number of entities to summon.
     */
    protected summonEntity(
        entityName: string, 
        location: Vector3 | (() => Vector3), 
        amount: number 
    ): void {
        for (let i = 0; i < amount; i++) {
            const entityLocation = (typeof location === 'function') ? location() : location;
            try {
                this._dimension.spawnEntity(entityName, entityLocation);
            } catch (error) {
                this._feedback.error(`Failed to summon ${entityName}.`, { sound: "item.shield.block" });
            }
        }
    }
}
    