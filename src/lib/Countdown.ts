import { Player } from "@minecraft/server";
import { PlayerFeedback } from "./PlayerFeedback";
import { taskManager } from "./TaskManager";

export class Countdown {
    private readonly _player: Player;
    private readonly _feedback: PlayerFeedback;
    private _defaultCountdownTime: number;
    private _countdownTime: number;
    private _timeoutId?: string;
    private _isCountingDown: boolean = false;
    private _tickInterval: number = 20;
    
    /**
    * Creates an instance of the Countdown class.
    * @param {number} defaultCountdown the default countdown time
    * @param {Player} player the player to show the countdown to
    */
    constructor(defaultCountdown: number, player: Player) {
        this._defaultCountdownTime = defaultCountdown;
        this._countdownTime = defaultCountdown;
        this._player = player;
        this._feedback = new PlayerFeedback(player);
    }
    
    public get isCountingDown(): boolean {
        return this._isCountingDown;
    }
    
    public get defaultCountdownTime(): number {
        return this._defaultCountdownTime;
    }
    
    public set defaultCountdownTime(value: number) {
        this._defaultCountdownTime = value;
        this._countdownTime = value;
    }
    
    public get tickInterval(): number {
        return this._tickInterval;
    }
    
    public set tickInterval(value: number) {
        this._tickInterval = value;
    }
    
    /**
     * Starts the countdown.
     * @param {Object} [events] the events to be triggered during the countdown.
     * @param {() => Promise<void> | void} [events.onEnd] the event to be triggered when the countdown ends.
     * @param {() => void} [events.onCancelled] the event to be triggered when the countdown is cancelled.
     */
    public start(events: { onEnd?: () => Promise<void> | void, onCancelled?: () => void  }): void {
        this._isCountingDown = true; 
        this.countdownStep({ onEnd: events.onEnd, onCancelled: events.onCancelled });
    }

    /**
     * The countdown step.
     * @param {Object} [events] the events to be triggered during the countdown.
     * @param {() => Promise<void> | void} [events.onEnd] the event to be triggered when the countdown ends.
     * @param {() => void} [events.onCancelled] the event to be triggered when the countdown is cancelled.
     */
    private async countdownStep(events: { onEnd?: () => Promise<void> | void, onCancelled?: () => void  }  = {}): Promise<void> {
        if (!this._isCountingDown) {
            this.reset(events.onCancelled);
            return;
        }

        this.displayCountdown();

        if (this._countdownTime === 0) {
            this.reset();
            if (events.onEnd) await events.onEnd();
            return;
        }

        this._countdownTime--;

        this._timeoutId = `${this._player.name}:countdown.${Date.now()}`;
        taskManager.addTimeout(this._timeoutId, () => this.countdownStep({ 
            onEnd: events.onEnd, 
            onCancelled:  events.onCancelled 
        }), this._tickInterval);
    }

    /**
     * Pauses the countdown.
     * @param {() => void} [onCancelled] the event to be triggered when the countdown is cancelled.
     */
    public pause(onCancelled?: () => void): void {
        this._isCountingDown = false;
        if (this._timeoutId) {
            taskManager.clearTask(this._timeoutId);
            this._timeoutId = undefined;
        }
        if (onCancelled) onCancelled();
    }

    /**
     * Resets the countdown.
     * @param {() => void} [onCancelled] the event to be triggered when the countdown is cancelled.
     */
    public reset(onCancelled?: () => void): void {
        this._isCountingDown = false;
        this._countdownTime = this._defaultCountdownTime;
        if (this._timeoutId) {
            taskManager.clearTask(this._timeoutId);
            this._timeoutId = undefined;
        }
        if (onCancelled) onCancelled();
    }
        
    /**
    * Get the color of the countdown based on the time remaining
    * @param {number} countdown the time remaining
    * @returns {string} the color code for the countdown
    */
    public getCountdownColor(countdown: number): string {
        switch (true) {
            case countdown >= 8:
            return '§a';
            case countdown >= 4:
            return '§6';
            case countdown >= 1:
            return '§c';
            case countdown <= 0:
            return '§4';
            default:
            return '§f';
        }
    }
        
    /**
    * Display countdown on the player's screen
    */
    public displayCountdown(): void {
        const textColor = this._isCountingDown ? this.getCountdownColor(this._countdownTime) : '§4';
        this._feedback.setTitle(`§l${textColor}${this._countdownTime}`);
        this._feedback.setSubtitle('countdown');
        this._feedback.playSound(this._countdownTime >= 1 ? "respawn_anchor.charge" : "block.bell.hit");
    }
}
    