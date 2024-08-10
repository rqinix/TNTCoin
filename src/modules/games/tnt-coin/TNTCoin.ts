import { Player, ScriptEventCommandMessageAfterEvent, system, Vector3 } from "@minecraft/server";
import { TNTCoinStructure } from "./TNTCoinStructure";
import { Countdown } from "../../../lib/Countdown";
import { taskManager } from "../../../lib/TaskManager";
import { rotateCamera360 } from "../../../utilities/camera/rotate360";
import { floorVector3 } from "../../../utilities/math/floorVector";
import { Timer } from "../../../lib/Timer";
import { event as eventHandlerRegistry } from "./eventHandlers/index";
import { clearBlocks } from "../../../utilities/blocks/clearing";
import { PlayerFeedback } from "../../../lib/PlayerFeedback";

/**
 * Represents a TNTCoin game instance.
 */
export class TNTCoin {
    private readonly _player: Player;
    private readonly _structure: TNTCoinStructure;
    private readonly _feedback: PlayerFeedback;
    private readonly _countdown: Countdown;
    private readonly _timer: Timer;
    private readonly _gameKey: string;
    private _isPlayerInGame: boolean = false;

    private _wins: number = 0;
    private _winMax: number = 10;
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

    public get gameSettings(): GameSettings {
        return {
            wins: this._wins,
            winMax: this._winMax,
            fillSettings: this._structure.fillSettings,
            defaultCountdownTime: this._countdown.defaultCountdownTime,
            countdownTickInterval: this._countdown.tickInterval,
            doesCameraRotate: this._doesCameraRotate,
            useBarriers: this._useBarriers,
            randomizeBlocks: this._randomizeBlocks,
        };
    }

    public set gameSettings(settings: GameSettings) {
        this._wins = settings.wins;
        this._winMax = settings.winMax;
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
    public loadGameState(): void {
        try {
            const gameStateString = this._player.getDynamicProperty(this._gameKey) as string;
            if (!gameStateString) return;
            const gameState = JSON.parse(gameStateString) as GameState;
            this._isPlayerInGame = gameState.isPlayerInGame;
            this._structure.structureProperties = JSON.stringify(gameState.structureProperties);
            this.gameSettings = gameState.gameSettings;
            this._wins = gameState.wins;
        } catch (error) {
            this._feedback.error('Failed to load game state.', { sound: "mob.wither.death" });
        }
    }

    /**
     * Restarts the game.
     * @returns {Promise<void>} A promise that resolves when the game is restarted.
     */
    private async restartGame(): Promise<void> {
        await this._structure.clearFilledBlocks();
        this.cameraClear();
        this.timerRestart();
    }

    /**
    * Cleans up the game session by stopping all activities and clearing blocks.
    * @returns {Promise<void>} A promise that resolves when the cleanup is complete.
    */
    public async cleanGameSession(): Promise<void> {
        this.cameraClear();
        this._countdown.reset();
        this.timerStop();
        this._structure.fillStop();
        taskManager.clearTasks([this._taskFillCheckId, this._taskCameraId]);
        await this._structure.clearFilledBlocks();
        await this._structure.clearProtedtedStructure();
    }
    
    /**
    * Starts listening for the structure being fully filled. Starts the countdown when it is filled.
    */
    public startFillListener(): void {
        taskManager.addInterval(this._taskFillCheckId, async () => {
            try {
                if (!this.isPlayerInGame) throw new Error('Player is not in game.');

                const isStructureFilled = this._structure.isStructureFilled();
        
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
            } catch (error) {
                taskManager.clearTask(this._taskFillCheckId);
                throw new Error(`Failed to check fill status. Cleared task ${this._taskFillCheckId}: ${error}`);
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

        taskManager.runTimeout(() => {
            this._feedback.setTitle(TITLE);
            this._feedback.setSubtitle(SUBTITLE);
            this._feedback.playSound(SOUND);
            this._player.dimension.spawnParticle('minecraft:totem_particle', this._player.location);
            this.summonEntity('fireworks_rocket', () => this._structure.randomLocation(2), 20);
        }, 20);

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
        this.summonEntity('fireworks_rocket', () => this._structure.randomLocation(2), 20);
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
        const TIMER_START_SOUND = 'random.orb';

        this._timer.toggleActionBar(true);
        this._timer.start(this.timerDuration, this.onLose.bind(this));
        this._feedback.playSound(TIMER_START_SOUND);
    }

    /**
     * Stops the timer.
     */
    public timerStop(): void {
        if (!this._timer.isDisplayOnActionBar) return;
        const SOUND = 'random.orb';
        
        this._timer.stop();
        this._feedback.playSound(SOUND);
    }

    /**
     * Rotates the player's camera 360 degrees around the structure.
     */
    private cameraRotate360(): void {
        if (!this._doesCameraRotate) return;
        rotateCamera360(
            this._player, 
            this._taskCameraId,
            floorVector3(this._structure.structureCenter), 
            this._structure.structureWidth, 
            this._structure.structureHeight + 12, 
            5
        );
    }

    /**
     * Returns the player to their normal perspective
     */
    private cameraClear(): void {
        taskManager.clearTask(this._taskCameraId);
        this._player.camera.clear();
    }
    
    /**
    * teleport the player to the center of structure
    */
    public teleportPlayer(): void {
        const TELEPORT_SOUND = 'mob.shulker.teleport';
        const TELEPORT_PARTICLE = 'minecraft:eyeofender_death_explode_particle';

        this._player.teleport({ 
            x: this._structure.structureCenter.x, 
            y: this._structure.structureCenter.y + 1, 
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
            console.error('Failed to spawn teleport particle.', error);
        }

        this._feedback.playSound(TELEPORT_SOUND);
    }
    
    /**
    * Summon a TNT.
    */
    public summonTNT(amount: number = 1): void {
        this.summonEntity('tnt_minecart', () => this._structure.randomLocation(2, false), amount);
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
        for (let i = 0; i <= amount; i++) {
            const entityLocation = (typeof location === 'function') ? location() : location;
            try {
                this._player.dimension.spawnEntity(entityName, entityLocation);
            } catch (error) {
                this._feedback.error(`Failed to summon ${amount} ${entityName}.`, { sound: "item.shield.block" });
                break;
            }
        }
    }

    /**
     * Summons a lightning bolt at a random filled block.
     * Clear the block after the lightning bolt is summoned.
     * @param {number} amount The number of lightning bolts to summon.
     */
    public summonLightningBolt(amount: number = 1): void {
        const locations = this._structure.filledBlockLocations;
        if (locations.size === 0) return;
        try {
            for (let i = 0; i < amount; i++) {
                const randomLocation = JSON.parse(Array.from(locations)[Math.floor(Math.random() * locations.size)]);
                this.summonEntity('lightning_bolt', randomLocation, 1);
                clearBlocks(this._player.dimension, [randomLocation], 100);
            }
        } catch (error) {
            console.error('Failed to summon lightning bolt.', error);
            this._feedback.error('Failed to summon lightning bolt.', { sound: "item.shield.block" });
        }
    }


    public handleEvents(event: ScriptEventCommandMessageAfterEvent): void {
        if (!event.id.startsWith('tntcoin')) return;
        const eventType = event.id.split(':')[1];
        const message = event.message;
        const handler = eventHandlerRegistry.getHandler(eventType);
        if (!eventHandlerRegistry.isEventEnabled(eventType)) return;
        if (handler) {
            handler(this, message);
        }
    }
}