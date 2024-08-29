import { TNTCoin } from "../../TNTCoin";

/**
 * Handles the event when the player loses the game.
 * @param {TNTCoin} game - The current instance of the TNTCoin game.
 * @returns {Promise<void>} - A promise that resolves when the player loses the game.
 */
export async function onLose(game: TNTCoin): Promise<void> {
    game.winManager.decrementWin();

    const TITLE = `§c${game.winManager.getCurrentWins()}§f/§a${game.winManager.getMaxWins()}`;
    const SUBTITLE = '§cYou Lose!§r';
    const SOUND = 'random.totem';

    game.feedback.showFeedbackScreen({ 
        title: TITLE, 
        subtitle: SUBTITLE, 
        sound: SOUND 
    });

    await game.resetGame();
    game.timerManager.start(game.timerDuration);
}