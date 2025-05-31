import { Player } from "@minecraft/server";
import { Actionbar } from "../ScreenDisplay/Actionbar";
import EventEmitter from "lib/Events/EventEmitter";
import { EVENTS } from "app/events/eventTypes";

type TimerCallback = () => Promise<void> | void;

export class Timer {
    private player: Player;
    private actionbar: Actionbar;
    private taskId: string;
    private isRunning: boolean;
    private duration: number;
    private remainingTime: number;
    private label: string;
    private title: string;

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
        this.taskId = `${player.name}:${label}:actionbar`;
        this.isRunning = false;
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
        this.actionbar.addTask(this.taskId, {
            id: this.taskId,
            callback: async () => await this.task(),
        });
        this.player.playSound('random.orb');
        EventEmitter.getInstance().publish(EVENTS.TIMER_STARTED, { player: this.player });
    }

    /**
     * The main task that runs the timer.
     */
    private async task(): Promise<(string | number | undefined)[]> {
        const event = EventEmitter.getInstance();
        if (this.remainingTime > 0) {
            this.remainingTime--;
            event.publish(EVENTS.TIMER_TICK, { player: this.player, remainingTime: this.remainingTime });
        } else {
            this.stop();
            event.publish(EVENTS.TIMER_ENDED, { player: this.player });
        }
        return this.getFormattedTime();
    }

    /**
     * Stops the timer.
     */
    public stop(): void {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.clearActionBar();
        this.reset();
        this.player.playSound('random.orb');
    }

    /**
     * Restarts the timer with the initial duration.
     */
    public restart(): void {
        if (this.isRunning) {
            this.reset();
            this.player.playSound('random.orb');
        }
    }

    public reset(): void {
        this.remainingTime = this.duration;
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
