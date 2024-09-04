import { taskManager } from "../../../core/TaskManager";
import { TNTCoin } from "../../TNTCoin";
import { onMaxWin } from "./onMaxWin";

/**
 * Handles the event when the player wins the game.
 * @param {TNTCoin} game - The current instance of the TNTCoin game.
 * @returns {Promise<void>} - A promise that resolves when the player wins the game.
 */
export async function onWin(game: TNTCoin): Promise<void> {
    game.winManager.incrementWin();

    const isMaxWin = game.winManager.hasReachedMaxWins();
    if (isMaxWin) {
        onMaxWin(game);
        return;
    }

    const TITLE = `§a${game.winManager.getCurrentWins()}§f/§a${game.winManager.getMaxWins()}`;
    const SUBTITLE = '§eYou win!§r';
    const SOUND = 'random.levelup';

    // Run the fireworks and show feedback screen after a delay of 20 ticks.
    taskManager.runTimeout(() => {
        game.summonFireworks(20);
        game.feedback.showFeedbackScreen({ title: TITLE, subtitle: SUBTITLE, sound: SOUND });
        game.player.dimension.spawnParticle('minecraft:totem_particle', game.player.location);
    }, 20);

    game.player.playSound('wait_wait_wait');

    await game.resetGame();
    game.timerManager.restart();
}
