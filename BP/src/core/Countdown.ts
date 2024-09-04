import { Player } from "@minecraft/server";
import { PlayerFeedback } from "./PlayerFeedback";
import { taskManager } from "./TaskManager";

type CountdownCallback = () => Promise<void> | void;

export class Countdown {
    private readonly _player: Player;
    private readonly _feedback: PlayerFeedback;
    private _defaultCountdownTime: number;
    private _countdownTime: number;
    private _timeoutId?: string;
    private _isCountingDown: boolean = false;
    private _tickInterval: number = 20;
    
    private _onEndCallbacks: CountdownCallback[] = [];
    private _onCancelCallbacks: CountdownCallback[] = [];

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
     * Registers a callback to be executed when the countdown ends.
     * @param callback The callback function.
     */
    public addOnEndCallback(callback: CountdownCallback): void {
        this._onEndCallbacks.push(callback);
    }

    /**
     * Registers a callback to be executed when the countdown is canceled.
     * @param callback The callback function.
     */
    public addOnCancelCallback(callback: CountdownCallback): void {
        this._onCancelCallbacks.push(callback);
    }

    /**
     * Starts the countdown.
     */
    public start(): void {
        if (this._isCountingDown) return;

        this._isCountingDown = true; 
        this.countdownStep();
    }

    /**
     * The countdown step.
     */
    private async countdownStep(): Promise<void> {
        if (!this._isCountingDown) {
            this.reset();
            await this.executeCallbacks(this._onCancelCallbacks);
            return;
        }

        this.displayCountdown();

        if (this._countdownTime === 0) {
            this.reset();
            await this.executeCallbacks(this._onEndCallbacks);
            return;
        }

        this._countdownTime--;

        this._timeoutId = `${this._player.name}:countdown`;
        taskManager.addTimeout(this._timeoutId, () => this.countdownStep(), this._tickInterval);
    }

    /**
     * Pauses the countdown.
     */
    public pause(): void {
        this._isCountingDown = false;
        if (this._timeoutId) {
            taskManager.clearTask(this._timeoutId);
            this._timeoutId = undefined;
        }
        this.executeCallbacks(this._onCancelCallbacks);
    }

    /**
     * Resets the countdown.
     */
    public reset(): void {
        this._isCountingDown = false;
        this._countdownTime = this._defaultCountdownTime;
        if (this._timeoutId) {
            taskManager.clearTask(this._timeoutId);
            this._timeoutId = undefined;
        }
    }

    /**
     * Executes the registered callbacks.
     * @param callbacks Array of callbacks to execute.
     */
    private async executeCallbacks(callbacks: CountdownCallback[]): Promise<void> {
        for (const callback of callbacks) {
            await Promise.resolve(callback());
        }
    }

    /**
    * Get the color of the countdown based on the time remaining.
    * @param {number} countdown the time remaining.
    * @returns {string} the color code for the countdown.
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
    * Display countdown on the player's screen.
    */
    public displayCountdown(): void {
        const textColor = this._isCountingDown ? this.getCountdownColor(this._countdownTime) : '§4';
        this._feedback.setTitle(`§l${textColor}${this._countdownTime}`);
        this._feedback.setSubtitle('countdown');
        this._feedback.playSound(this._countdownTime >= 1 ? "respawn_anchor.charge" : "block.bell.hit");
    }
}