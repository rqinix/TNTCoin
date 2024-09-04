import { Player } from "@minecraft/server";

export class PlayerFeedback {
    private player: Player;
    
    constructor(player: Player) {
        this.player = player;
    }
    
    public success(message: string, options?: FeedbackOptions): void {
        this.sendFeedback(message, "§a", options);
    }
    
    public error(message: string, options?: FeedbackOptions): void {
        this.sendFeedback(message, "§c", options);
    }
    
    public info(message: string, options?: FeedbackOptions): void {
        this.sendFeedback(message, "§b", options);
    }
    
    public warning(message: string, options?: FeedbackOptions): void {
        this.sendFeedback(message, "§e", options);
    }
    
    private sendFeedback(message: string, color: string, options?: FeedbackOptions): void {
        this.player.sendMessage(`${color}${message}`);
        if (options?.sound) {
            this.player.playSound(options.sound);
        }
        if (options?.title) {
            this.player.onScreenDisplay.setTitle(options.title);
        }
        if (options?.subtitle) {
            this.player.onScreenDisplay.updateSubtitle(options.subtitle);
        }
        if (options?.actionBar) {
            this.player.onScreenDisplay.setActionBar(options.actionBar);
        }
    }
    
    public playSound(sound: string): void {
        this.player.playSound(sound);
    }
    
    public setTitle(title: string, options?: { fadeInDuration: number; stayDuration: number; fadeOutDuration: number }): void {
        this.player.onScreenDisplay.setTitle(title, options);
    }
    
    public setSubtitle(subtitle: string): void {
        this.player.onScreenDisplay.updateSubtitle(subtitle);
    }
    
    public setActionbar(actionBar: string): void {
        this.player.onScreenDisplay.setActionBar(actionBar);
    }

    public showFeedbackScreen({ title, subtitle, sound }: { title?: string, subtitle?: string, sound?: string }): void {
        if (title) this.setTitle(title);
        if (subtitle) this.setSubtitle(subtitle);
        if (sound) this.playSound(sound);
    }
}
