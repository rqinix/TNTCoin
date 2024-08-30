import { Player } from "@minecraft/server";
import { ActionBar } from "./ActionBar";

type TimerCallback = () => Promise<void> | void;

export class Timer {
    private player: Player;
    private actionBar: ActionBar;
    private taskId: string;
    private isRunning: boolean;
    private duration: number;
    private remainingTime: number;
    private onEndCallbacks: TimerCallback[] = [];

    /**
     * Creates a new timer for the given player.
     * @param {Player} player The player for whom the timer is created.
     * @param {number} duration The duration of the timer in seconds.
     * @param {ActionBar} actionBar The action bar instance to display the timer.
     */
    constructor(player: Player, duration: number, actionBar: ActionBar) {
        this.player = player;
        this.actionBar = actionBar;

        this.setTimerDuration(duration);

        this.taskId = `${player.name}:timer:actionbar`;
        this.isRunning = false;
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
     * Registers a callback to be called when the timer ends.
     * @param {TimerCallback} callback The callback function to be executed on timer end.
     */
    public addOnEndCallback(callback: TimerCallback): void {
        this.onEndCallbacks.push(callback);
    }

    /**
     * Starts the timer.
     */
    public start(): void {
        if (this.isRunning) {
            this.player.sendMessage('§cTimer is already running.');
            return;
        };

        this.isRunning = true;
        this.actionBar.addTask(this.taskId, async () => await this.task());
        this.player.playSound('random.orb');
    }

    /**
     * The main task that runs the timer.
     */
    private async task(): Promise<(string | number | undefined)[]> {
        if (this.remainingTime > 0) {
            this.remainingTime--;
        } else {
            this.stop();
            await this.executeCallbacks(this.onEndCallbacks);
        }

        return this.getFormattedTime();
    }

    /**
     * Executes the given callbacks.
     */
    private async executeCallbacks(callbacks: TimerCallback[]): Promise<void> {
        for (const callback of callbacks) {
            await Promise.resolve(callback());
        }
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
        this.duration = duration + 1;
        this.remainingTime = this.duration;
    }

    /**
     * Gets the formatted time string for the action bar display.
     */
    private getFormattedTime(): (string | number | undefined)[] {
        const timeColor = this.remainingTime <= 10 ? '§c' : '§a';
        return ['Time Left: ', timeColor, this.remainingTime];
    }

    /**
     * Clears the action bar display.
     */
    private clearActionBar(): void {
        this.actionBar.removeTasks([this.taskId]);
    }
}
