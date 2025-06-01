import { Player } from "@minecraft/server";
import { Actionbar } from "../ScreenDisplay/Actionbar";
import EventEmitter from "lib/Events/EventEmitter";

export interface TimerEventData {
    player: Player;
    timer: Timer;
    remainingTime?: number;
    title: string;
    label: string;
}

export class Timer {
    private player: Player;
    private actionbar: Actionbar;
    private taskId: string;
    private isRunning: boolean;
    private _isManuallyStarted: boolean;
    private duration: number;
    private remainingTime: number;
    private label: string;
    private title: string;
    private customEvents: {
        started: string;
        tick: string;
        ended: string;
    };

    /**
     * Creates a new timer for the given player.
     * @param {Player} player The player for whom the timer is created.
     * @param {number} duration The duration of the timer in seconds.
     * @param {ActionBar} actionbar The action bar instance to display the timer.
     * @param {string} label The label to display with the timer (default: "Time Left").
     */
    constructor(player: Player, duration: number, actionbar: Actionbar, label: string = "Time Left", title: string = "Timer") {
        this.player = player;
        this.actionbar = actionbar;
        this.label = label;
        this.title = title;
        this.setTimerDuration(duration);
        this.taskId = `timer:${player.name}:${label}:actionbar`;
        this.isRunning = false;
        this._isManuallyStarted = false;
        this._initializeTimerEvents();
        console.warn(`Timer '${title}' created.`);
    }

    /**
     * Initializes custom event names for this timer instance.
     */
    private _initializeTimerEvents(): void {
        const eventPrefix = `timer:${this.title.toLowerCase().replace(/\s+/g, '_')}:${this.label.toLowerCase().replace(/\s+/g, '_')}`;
        this.customEvents = {
            started: `${eventPrefix}:started`,
            tick: `${eventPrefix}:tick`,
            ended: `${eventPrefix}:ended`,
        };
    }

    /**
     * Gets the timer label.
     */
    public get timerLabel(): string {
        return this.label;
    }

    /**
     * Sets the timer label.
     * @param label The new label for the timer.
     */
    public setTimerLabel(label: string): void {
        this.label = label;
        this._initializeTimerEvents();
    }

    /**
     * Gets the timer title.
     */
    public get timerTitle(): string {
        return this.title;
    }

    /**
     * Sets the timer title.
     * @param title The new title for the timer.
     */
    public setTimerTitle(title: string): void {
        this.title = title;
        this._initializeTimerEvents();
    }

    /**
     * Gets the custom event names for this timer.
     */
    public get events() {
        return { ...this.customEvents };
    }

    /**
     * Gets whether the timer is currently running.
     */
    public get isTimerRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Gets the remaining time on the timer.
     */
    public get timeRemaining(): number {
        return this.remainingTime;
    }
    
    /**
     * Starts the timer.
     */
    public start(): void {
        if (this.isRunning) {
            this.player.sendMessage(`§c${this.title} is already running.`);
            return;
        }
        this.isRunning = true;
        this._isManuallyStarted = true;
        this.actionbar.addTask(this.taskId, {
            id: this.taskId,
            callback: async () => await this._task(),
        });
        this.player.playSound('random.orb');
        const eventData: TimerEventData = {
            player: this.player,
            timer: this,
            title: this.title,
            label: this.label
        };
        EventEmitter.getInstance().publish(this.customEvents.started, eventData);
    }

    /**
     * The main task that runs the timer.
     */
    private async _task(): Promise<(string | number | undefined)[]> {
        const event = EventEmitter.getInstance();
        const eventData: TimerEventData = {
            player: this.player,
            timer: this,
            title: this.title,
            label: this.label,
            remainingTime: this.remainingTime
        };
        if (this.remainingTime <= 0) {
            this.stop();
            event.publish(this.customEvents.ended, eventData);
        } else {
            event.publish(this.customEvents.tick, eventData);
            this.remainingTime--;
        }
        return this.getFormattedTime();
    }
    
    /**
     * Stops the timer.
     */
    public stop(): void {
        if (!this.isRunning) return;
        this.isRunning = false;
        this._isManuallyStarted = false;
        this.remainingTime = this.duration;
        this.clearActionBar();
        this.player.playSound('random.orb');
    }
    
    /**
     * Stops the current timer and starts fresh.
     */
    public restart(): void {
        if (!this._isManuallyStarted) return;
        this.stop();
        this.remainingTime = this.duration;
        this.start();
    }

    /**
     * Gets the duration of the timer.
     * @returns The duration of the timer.
     */
    public getTimerDuration(): number {
        return this.duration - 1;
    }

    /**
     * Sets the duration of the timer.
     */
    public setTimerDuration(duration: number): void {
        if (this.isRunning) return;
        this.duration = duration + 1;
        this.remainingTime = this.duration;
    }

    /**
     * Gets the formatted time string for the action bar display.
     */
    private getFormattedTime(): (string | number | undefined)[] {
        const timeColor = this.remainingTime <= 10 ? '§c' : '§a';
        return [this.label + ': ', timeColor, this.remainingTime];
    }

    /**
     * Clears the action bar display.
     */
    private clearActionBar(): void {
        this.actionbar.removeTasks([this.taskId]);
    }
}
