import { TNTCoin } from "../game/TNTCoin";
import { taskManager } from "../core/TaskManager";
import { TNTCoinStructure } from "../game/TNTCoinStructure";

export const eventHandlers = {
    onCountdownCancelled: (game: TNTCoin): void => {
        const TITLE = '§cOHHH NOOOO!!!§r';
        const SOUND = 'random.totem';
        game.feedback.showFeedbackScreen({ title: TITLE, sound: SOUND });
    },

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

    onMaxWin: (game: TNTCoin): void => {
        const TITLE = `§a${game.winManager.getCurrentWins()}§f/§a${game.winManager.getMaxWins()}§r\n§eCongratulations!§r`;
        const SUBTITLE = '§eYou have won the game!§r';
        const SOUND = 'random.levelup';

        game.feedback.showFeedbackScreen({ title: TITLE, subtitle: SUBTITLE, sound: SOUND });
        game.winManager.resetWins();
        game.summonFireworks(20);
    },

    onLose: async (game: TNTCoin): Promise<void> => {
        game.winManager.decrementWin();

        const TITLE = `§c${game.winManager.getCurrentWins()}§f/§a${game.winManager.getMaxWins()}`;
        const SUBTITLE = '§cYou Lose!§r';
        const SOUND = 'random.totem';

        game.feedback.showFeedbackScreen({ title: TITLE, subtitle: SUBTITLE, sound: SOUND });

        await game.restartGame();
    }
};