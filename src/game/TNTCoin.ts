import { Player, ScriptEventCommandMessageAfterEvent, system, Vector3 } from "@minecraft/server";
import { TNTCoinStructure } from "./TNTCoinStructure";
import { Countdown } from "../core/Countdown";
import { taskManager } from "../core/TaskManager";
import { rotateCamera360 } from "./utilities/camera/rotate360";
import { floorVector3 } from "./utilities/math/floorVector";
import { Timer } from "../core/Timer";
import { event as eventHandlerRegistry } from "./events/index";
import { clearBlocks } from "./utilities/blocks/clearing";
import { PlayerFeedback } from "../core/PlayerFeedback";

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

    public get isTimerRunning(): boolean {
        return this._timer.isTimerRunning;
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
        this.manageTimer('restart');
    }

    /**
    * Cleans up the game session by stopping all activities and clearing blocks.
    * @returns {Promise<void>} A promise that resolves when the cleanup is complete.
    */
    public async cleanGameSession(): Promise<void> {
        this.cameraClear();
        this._countdown.reset();
        this.manageTimer('stop');
        this._structure.fillStop();
        taskManager.clearTasks([this._taskFillCheckId, this._taskCameraId]);
        await this._structure.clearFilledBlocks();
        await this._structure.clearProtedtedStructure();
    }


    /**
     * Handles the win condition by checking if the player has won.
     */
    private handleWinCondition(): void {
        if (this.isWin) {
            this.onWin().then(() => {
                this.resetWin();
                this.saveGameState();
            });
        }
    }
    
    /**
     * Manages the countdown based on whether the structure is filled or not.
     * Pauses the countdown if the structure is no longer filled and resumes it when it is.
     * @param {boolean} isStructureFilled - Whether the structure is fully filled.
     */
    private handleCountdown(isStructureFilled: boolean): void {
        if (!isStructureFilled && this._countdown.isCountingDown) {
            this.cameraClear();
            this._countdown.pause();
        } else if (isStructureFilled && !this._countdown.isCountingDown) {
            this.cameraRotate360();
            this._countdown.start({
                onCancelled: this.onCountdownCancelled.bind(this),
                onEnd: this.onCountdownEnd.bind(this),
            });
        }
    }
    
    /**
     * Starts listening for the structure being fully filled. 
     * Starting the countdown and handling a win when appropriate.
     */
    public startFillListener(): void {
        taskManager.addInterval(this._taskFillCheckId, async () => {
            try {
                if (!this.isPlayerInGame) throw new Error('Player is not in game.');
    
                const isStructureFilled = this._structure.isStructureFilled();
    
                this.handleWinCondition();
                this.handleCountdown(isStructureFilled);
    
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
        this._feedback.showFeedbackScreen({ title: TITLE, sound: SOUND });
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
            this.summonFireworks(20);
            this._feedback.showFeedbackScreen({ title: TITLE, subtitle: SUBTITLE, sound: SOUND });
            this._player.dimension.spawnParticle('minecraft:totem_particle', this._player.location);
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
        this._feedback.showFeedbackScreen({ title: TITLE, subtitle: SUBTITLE, sound: SOUND });
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
        this._feedback.showFeedbackScreen({ title: TITLE, subtitle: SUBTITLE, sound: SOUND });
        this.summonFireworks(20);
    }

    private summonFireworks(amount: number): void {
        this.summonEntities('firework_rocket', {
            locationType: 'random',
            amount: amount,
        });
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

    public manageTimer(action: TimerAction): void {
        const TIMER_START_SOUND = 'random.orb';
        switch (action) {
            case 'start':
                if (this._timer.isTimerRunning) {
                    this._feedback.error('Timer is already running.', { sound: "item.shield.block" });
                    return;
                }
    
                this._timer.toggleActionBar(true);
                this._timer.start(this.timerDuration, this.onLose.bind(this));
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
    private cameraRotate360(): void {
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
    private cameraClear(): void {
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
            console.error('Failed to spawn teleport particle.', error);
        }

        this._feedback.playSound(TELEPORT_SOUND);
    }
    
    /**
     * summons TNT at random locations in the structure
     */
    public summonTNT(): void {
        this.summonEntities('tnt_minecart', {
            locationType: 'random',
            onTop: true,
        });
    }

    /**
     * Summons lightning bolts and destroy random blocks in the structure.
     * @param amount The amount of lightning bolts to summon. Default is 1.
     */
    public summonLightningBolt(amount: number = 1): void {
        const locations: Vector3[] = [];
    
        for (let i = 0; i < amount; i++) {
            if (this._structure.filledBlockLocations.size === 0) return;
            const randomLocation = JSON.parse(Array.from(this._structure.filledBlockLocations)[Math.floor(Math.random() * this._structure.filledBlockLocations.size)]);
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
            customLocations = []
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
    
        locations.forEach(location => {
            try {
                this._player.dimension.spawnEntity(entityName, location);
                if (clearBlocksAfterSummon) {
                    clearBlocks(this._player.dimension, [location], 100);
                }
            } catch (error) {
                this._feedback.error(`Failed to summon ${entityName} at location: ${JSON.stringify(location)}`, { sound: "item.shield.block" });
            }
        });
    }

    /**
     * Handles script events.
     */
    public handleEvents(event: ScriptEventCommandMessageAfterEvent): void {
        if (!event.id.startsWith('tntcoin')) return;
        const eventType = event.id.split(':')[1];
        if (!eventHandlerRegistry.isEventEnabled(eventType)) return;
        const message = event.message;
        const handler = eventHandlerRegistry.getHandler(eventType);
        if (handler) handler(this, message);
    }
}