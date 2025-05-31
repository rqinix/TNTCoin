import { Player } from "@minecraft/server";
import { Feedback } from "../ScreenDisplay/Feedback";
import { taskManager } from "../Managers/TaskManager";
import EventEmitter from "../Events/EventEmitter";
import { EVENTS } from "app/events/eventTypes";
import ServiceRegistry from "./ServiceRegistry";

export class Countdown {
    private readonly _player: Player;
    private readonly _feedback: Feedback;
    private readonly _event: EventEmitter;
    private _defaultCountdownTime: number;
    private _countdownTime: number;
    private _timeoutId: string | undefined;
    public isCountingDown: boolean = false;
    public tickInterval: number = 20;

    constructor(defaultCountdown: number, player: Player) {
        this._player = player;
        this._event = EventEmitter.getInstance();
        this._feedback = ServiceRegistry.getInstance().get("PlayerMessageService");
        this._defaultCountdownTime = defaultCountdown;
        this._countdownTime = defaultCountdown;
    }

    public get defaultCountdownTime(): number {
        return this._defaultCountdownTime;
    }

    public set defaultCountdownTime(value: number) {
        this._defaultCountdownTime = value;
        this._countdownTime = value;
    }

    /**
     * Starts the countdown.
     */
    public start(): void {
        if (this.isCountingDown) return;
        this.isCountingDown = true; 
        this._countdownStep();
    }    
    
    /**
     * The countdown step.
     */
    private async _countdownStep(): Promise<void> {
        if (!this.isCountingDown) {
            console.warn('Countdown is not active, cannot proceed with counting down.');
            return;
        }

        this._displayCountdown();

        if (this._countdownTime === 0) {
            this.stop();
            this._event.publish(EVENTS.COUNTDOWN_ENDED, { player: this._player });
            return;
        }

        this._countdownTime--;

        this._timeoutId = `${this._player.name}:countdown`;
        taskManager.addTask(this._timeoutId, () => this._countdownStep(), this.tickInterval);
    }

    /**
     * Stops the countdown.
     */
    public stop(): void {
        if (!this.isCountingDown) {
            return;
        }
        this.isCountingDown = false;
        if (this._timeoutId) {
            taskManager.clearTask(this._timeoutId);
            this._timeoutId = undefined;
        }
        this._countdownTime = this._defaultCountdownTime;
        this._event.publish(EVENTS.COUNTDOWN_STOPPED, { player: this._player });
    }

    /**
    * Get the color of the countdown based on the time remaining.
    * @param {number} countdown the time remaining.
    * @returns {string} the color code for the countdown.
    */
    private _getCountdownColor(countdown: number): string {
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
    private _displayCountdown(): void {
        const textColor = this.isCountingDown ? this._getCountdownColor(this._countdownTime) : '§4';
        this._feedback.setTitle(`§l${textColor}${this._countdownTime}`);
        this._feedback.setSubtitle('countdown');
        this._feedback.playSound(this._countdownTime >= 1 ? "respawn_anchor.charge" : "block.bell.hit");
    }
}