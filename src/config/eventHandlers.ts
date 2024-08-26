import { TNTCoin } from "../game/TNTCoin";
import { taskManager } from "../core/TaskManager";

export const eventHandlers = {
    /**
     * Handles event when the countdown is cancelled.
     * @param {TNTCoin} game - The current instance of the TNTCoin game.
     */
    onCountdownCancelled: (game: TNTCoin): void => {
        const TITLE = '§cOHHH NOOOO!!!§r';
        const SOUND = 'random.totem';
        game.feedback.showFeedbackScreen({ title: TITLE, sound: SOUND });
    },

    /**
     * Handles the event when the player wins the game.
     * @param {TNTCoin} game - The current instance of the TNTCoin game.
     * @returns {Promise<void>} - A promise that resolves when the win handling is complete.
     */
    onWin: async (game: TNTCoin): Promise<void> => {
        if (game.winManager.hasReachedMaxWins()) return;

        game.winManager.incrementWin();

        const TITLE = `§a${game.winManager.getCurrentWins()}§f/§a${game.winManager.getMaxWins()}`;
        const SUBTITLE = '§eYou win!§r';
        const SOUND = 'random.levelup';

        taskManager.runTimeout(() => {
            game.summonFireworks(20);
            game.feedback.showFeedbackScreen({ title: TITLE, subtitle: SUBTITLE, sound: SOUND });
            game.player.dimension.spawnParticle('minecraft:totem_particle', game.player.location);
        }, 20);
        game.player.playSound('wait_wait_wait');

        await game.restartGame();
    },

    /**
     * Handles the event when the player reaches the maximum number of wins.
     * @param {TNTCoin} game - The current instance of the TNTCoin game.
     */
    onMaxWin: (game: TNTCoin): void => {
        const TITLE = `§a${game.winManager.getCurrentWins()}§f/§a${game.winManager.getMaxWins()}§r\n§eCongratulations!§r`;
        const SUBTITLE = '§eYou have won the game!§r';
        const SOUND = 'random.levelup';

        game.feedback.showFeedbackScreen({ title: TITLE, subtitle: SUBTITLE, sound: SOUND });
        game.winManager.resetWins();
        game.summonFireworks(20);
    },

    /**
     * Handles the event when the player loses the game.
     * @param {TNTCoin} game - The current instance of the TNTCoin game.
     * @returns {Promise<void>} - A promise that resolves when the lose handling is complete.
     */
    onLose: async (game: TNTCoin): Promise<void> => {
        game.winManager.decrementWin();

        const TITLE = `§c${game.winManager.getCurrentWins()}§f/§a${game.winManager.getMaxWins()}`;
        const SUBTITLE = '§cYou Lose!§r';
        const SOUND = 'random.totem';

        game.feedback.showFeedbackScreen({ title: TITLE, subtitle: SUBTITLE, sound: SOUND });

        await game.restartGame();
    }
};