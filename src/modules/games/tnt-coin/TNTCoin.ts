import { Player, Vector3 } from "@minecraft/server";
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

    private cameraTimeoutId: string;
    private doesCameraRotate: boolean = true;
    private cameraHeight: number = 12;

    private _timerDuration: number = 180;
    
    /**
     * Creates a new TNTCoin game instance.
     * @param {Player} player The player to create the game for.
     */
    constructor(player: Player) {
        super(player);
        this._gameKey = 'TNTCoinGameState';
        this._countdown = new Countdown(10, player);
        this._timer = new Timer(player);
        this.cameraTimeoutId = `camera-${player.name}`;
    }
    
    public get gameSettings(): GameSettings {
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

    public set gameSettings(settings: GameSettings) {
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

    public get isWin(): boolean {
        return this._wins >= this._winMax;
    }

    public get wins(): number {
        return this._wins;
    }

    public set wins(value: number) {
        this._wins = value;
    }

    public get winMax(): number {
        return this._winMax;
    }

    public set winMax(value: number) {
        this._winMax = value;
    }

    public set timerDuration(value: number) {
        this._timerDuration = value;
    }

    public get timerDuration(): number {
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
    public async cleanGameSession(): Promise<void> {
        this.cameraClear();
        taskManager.clearAll();
        this.fillStop();
        await this.clearFilledBlocks();
        await this.clearProtedtedStructure();
        this._feedback.playSound('random.levelup');
    }
    
    /**
    * Starts listening for the structure being fully filled. Starts the countdown when it is filled.
    */
    public startFillListener(): void {
        taskManager.addInterval('fillcheck', async () => {
            if (!this.isPlayerInGame) return;
            const isStructureFilled = this.isStructureFilled();
    
            if (this.isWin) {
                this.onWin();
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
        this._feedback.setTitle('§cOHHH NOOOO!!!§r');
        this._feedback.playSound('random.totem');
    }

    /**
     * Handles the event when the countdown ends.
     * @returns {Promise<void>} A promise that resolves when the countdown end event is complete
     */
    private async onCountdownEnd(): Promise<void> {
        await this.clearFilledBlocks();
        this.cameraClear();
        taskManager.runTimeout(() => {
            this.onWin();
        }, 20);
    }

    /** 
     * Handles the event when the player wins.
     */
    private onWin(): void {
        this.wins++;
        this.cameraClear();
        this.timerRestart();
        this.summonEntity('fireworks_rocket', () => this.randomLocation(2), 20);
        this._feedback.setTitle(`§a${this._wins}§f/§a${this._winMax}`);
        this._feedback.setSubtitle('§eYou win!§r');
        this._feedback.playSound('random.levelup');
    }

    /**
     * Handles the event when the player loses.
     */
    private onLose(): void {
        this._wins--;
        this.cameraClear();
        this.timerRestart();
        this._feedback.setTitle(`§c${this._wins}§f/§a${this._winMax}`);
        this._feedback.setSubtitle('§cYou lose!§r');
        this._feedback.playSound('random.totem');
    }

    /**
     * Restarts the game timer.
     */
    public timerRestart(): void {
        if (this._timer.isDisplayOnActionBar) {
            this._timer.reset();
            this.timerStart();
        }
    }

    /**
     * Starts the game timer.
     */
    public timerStart(): void {
        this._timer.toggleActionBar(true);
        this._timer.start(this.timerDuration, this.onLose.bind(this));
        this._feedback.playSound('random.orb');
    }

    /**
     * Stops the timer.
     */
    public timerStop(): void {
        this._timer.stop();
        this._feedback.playSound('random.orb');
    }


    /**
    * reset the win count
    */
    private resetWin(): void {
        this._wins = 0;
    }

    /**
     * Rotates the player's camera 360 degrees around the structure.
     */
    private cameraRotate360(): void {
        if (!this.doesCameraRotate) return;
        rotateCamera360(
            this._player, 
            this.cameraTimeoutId, 
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
        if (taskManager.has(this.cameraTimeoutId)) {
            taskManager.clearTimeout(this.cameraTimeoutId);
            this._player.camera.clear();
            console.warn('camera cleared');
        }
    }
    
    /**
    * teleport the player to the center of structure
    */
    public teleportPlayer(): void {
        this._player.teleport({ 
            x: this.structureCenter.x, 
            y: this.structureCenter.y + 1, 
            z: this.structureCenter.z 
        });
        this._feedback.playSound('mob.shulker.teleport');
        const location = this._player.location;
        this._dimension.spawnParticle(
            'minecraft:eyeofender_death_explode_particle', {
            x: location.x,
            y: location.y + 1,
            z: location.z,
        });
    }
    
    /**
    * Summon a TNT.
    */
    public summonTNT(): void {
        this._dimension.spawnEntity('tnt_minecart', this.randomLocation(2, false));
    }
    
    /**
     * Summon an entity.
     * @param {string} entityName The name of the entity to summon.
     * @param {Vector3 | (() => Vector3)} location The location to summon the entity at.
     * @param {number} amount The number of entities to summon.
     */
    public summonEntity(
        entityName: string, 
        location: Vector3 | (() => Vector3), 
        amount: number 
    ): void {
        for (let i = 0; i < amount; i++) {
            const entityLocation = (typeof location === 'function') ? location() : location;
            try {
                this._dimension.spawnEntity(entityName, entityLocation);
            } catch (error) {
                this._feedback.error(`Failed to summon ${entityName}.`, { sound: "mob.wither.death" });
            }
        }
    }
}
    