import { Player, ScriptEventCommandMessageAfterEvent } from "@minecraft/server";
import TntCoinStructure from "../structure/TntCoinStructure";
import TntCoinProgressManager from "./TntCoinProgressManager";
import TntCoinEventDispatcher from "./TntCoinEventDispatcher";
import EventEmitter from "lib/Events/EventEmitter";
import { Countdown } from "lib/System/Countdown";
import { taskManager } from "lib/Managers/TaskManager";
import { Timer, TimerEventData } from "lib/System/Timer";
import { Feedback } from "lib/ScreenDisplay/Feedback";
import { WinTracker } from "lib/System/WinTracker";
import { Actionbar } from "lib/ScreenDisplay/Actionbar";
import { TikTokGiftGoal } from "lib/ScreenDisplay/TikTokGiftGoal";
import { PlayerPropertiesManager } from "lib/Player/PlayerPropertiesManager";
import ServiceRegistry from "lib/System/ServiceRegistry";
import TntCoinSettings from "./TntCoinSettings";
import { LifeCycleService, PlayerActionService, AutoSaveService, JailService } from "./services/index";

/**
 * Main class for the TNT Coin
 */
export class TntCoin {
    public readonly player: Player;
    public readonly key: string;
    public isPlayerInSession: boolean = false;
    public isInProcess: boolean = false;
    public settings: TntCoinSettings;
    public readonly structure: TntCoinStructure;
    public readonly progressManager: TntCoinProgressManager;
    private readonly _eventDispatcher: TntCoinEventDispatcher;
    private readonly _lifecycleService: LifeCycleService;
    private readonly _playerActionService: PlayerActionService;
    private readonly _autoSaveService: AutoSaveService;
    public readonly jailService: JailService;
    public readonly feedback: Feedback;
    public readonly propertiesManager: PlayerPropertiesManager;
    public readonly event: EventEmitter;
    public readonly countdown: Countdown;
    public readonly actionbar: Actionbar;
    public readonly giftGoal: TikTokGiftGoal;
    public readonly timer: Timer;
    public readonly wins: WinTracker;
    public readonly taskAutoSaveId: string;
    public readonly taskFillCheckId: string;
    public eventMap: {
        onCountdownInterrupted: { id: string, handler: (data: any) => void },
        onCountdownEnded: { id: string, handler: (data: any) => void },
        onTntCoinTimerEnded: { id: string, handler: (data: TimerEventData) => void }
    };

    /**
     * Creates a new TntCoin instance.
     * @param {Player} player The player to create the game for.
     */
    constructor(player: Player, structure?: TntCoinStructure) {
        this.player = player;
        this.key = 'TNTCOIN.STATE:' + player.name;
        this.taskAutoSaveId = `${player.name}:autosave`;
        this.taskFillCheckId = `${player.name}:fillcheck`;
        this.event = EventEmitter.getInstance();
        const registry = ServiceRegistry.getInstance();
        this.feedback = registry.get("PlayerMessageService");
        this.structure = structure ?? new TntCoinStructure(player);
        this.actionbar = new Actionbar(player);
        this.countdown = new Countdown(10, player);
        this.timer = new Timer(player, 180, this.actionbar, "Time Left", "TNT Coin Timer");
        this.wins = new WinTracker(10, this.actionbar);
        this.giftGoal = new TikTokGiftGoal(player, this.actionbar);
        this.jailService = new JailService(player, this.actionbar, this.structure.blocksManager);
        this.settings = new TntCoinSettings(this.structure, this.countdown, this.timer, this.wins, this.giftGoal, this.jailService);
        this.propertiesManager = new PlayerPropertiesManager(player);
        this._lifecycleService = new LifeCycleService();
        this.progressManager = new TntCoinProgressManager();
        this._eventDispatcher = new TntCoinEventDispatcher();
        this._playerActionService = new PlayerActionService();
        this._autoSaveService = new AutoSaveService();
        this._eventDispatcher.initializeEventListeners(this);
    }
    
    /**
     * Start TNT Coin session
     */
    public async start(): Promise<void> {
        return this._lifecycleService.start(this);
    }

    /**
     * Load TNT Coin session
     * @returns {Promise<void>} a promise that resolves when the TNT Coin session has been successfully loaded.
     */
    public async load(): Promise<void> {
        await this._lifecycleService.load(this);
    }

    /**
     * Quit TNT Coin session
     * @returns {Promise<void>} a promise that resolves when successfully quit the session.
     */
    public async quit(): Promise<void> {
        return this._lifecycleService.quit(this);
    }

    /**
     * Resets the TNT Coin by clearing all filled blocks and camera rotation.
     * @returns {Promise<void>} A promise that resolves when the TNT Coin is restarted.
     */
    public async reset(): Promise<void> {
        return this._lifecycleService.clearTntCoinEnvironment(this);
    }
    
    /**
     * Start auto-saving the TNT Coin session.
     */
    public autoSaveSession(): void {
        this._autoSaveService.startAutoSave(this);
    }

    /**
     * Clear TNT Coin tasks.
     * This includes clearing the auto-save and fill check tasks.
     */
    public clearTasks(): void {
        taskManager.clearTask(this.taskFillCheckId);
        taskManager.clearTask(this.taskAutoSaveId);
    }
    
    /**
     * Checks the TNT Coin status to determine if the structure is filled.
     */
    public checkStatus(): void {
        this.progressManager.checkStatus(this);
    }
    
    /**
     * Handles script events coming from WebSocket server.
     * @param {ScriptEventCommandMessageAfterEvent} event - The event and message to handle
     */
    public handleScriptEvents(event: ScriptEventCommandMessageAfterEvent): void {
        this._eventDispatcher.handleScriptEvent(this, event);
    }
    
    /**
     * teleport the player to the center of structure
     * @param {number} height The height to teleport the player to. Default is 1.
     */
    public teleportPlayer(height: number = 1): void {
        this._playerActionService.teleportPlayer(this, height);
    }

    /**
     * Summon entities using the specified options
     * @param options The summoning options
     */
    public summonEntities(options: SummonOptions): void {
        this._playerActionService.summonEntities(this, options);
    }

    /**
     * Summon fireworks at random locations
     * @param amount The number of fireworks to summon
     */
    public summonFireworks(amount: number): void {
        this._playerActionService.summonFireworks(this, amount);
    }

    /**
     * summons TNT at random locations in the structure
     */
    public summonTNT(): void {
        this._playerActionService.summonTNT(this);
    }

    /**
     * Jail the player with optional duration and effects
     * @param duration Duration in seconds (optional)
     * @param enableEffects Whether to enable jail effects (optional)
     */
    public jailPlayer(duration?: number, enableEffects?: boolean): void {
        const structureCenter = this.structure.structureCenter;
        this.jailService.jailConfig = {
            jailTime: duration || this.jailService.jailConfig.jailTime,
            enableEffects: enableEffects ?? this.jailService.jailConfig.enableEffects,
            size: this.jailService.jailConfig.size
        };
        this.jailService.jailPlayer(structureCenter, duration);
    }

    /**
     * Release the player from jail
     */
    public releasePlayerFromJail(): void {
        this.jailService.releasePlayer();
    }

    /**
     * Check if player is currently jailed
     */
    public get isPlayerJailed(): boolean {
        return this.jailService.isPlayerJailed;
    }
}