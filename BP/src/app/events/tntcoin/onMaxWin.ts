import { TntCoin } from "../../game/TntCoin";

/**
 * Handles the event when the player reaches the maximum number of wins.
 * @param {TntCoin} tntcoin - The current instance of the TNT Coin.
 * @returns {Promise<void>} - A promise that resolves when the player reaches the maximum number of wins.
 */
export async function onMaxWin(tntcoin: TntCoin): Promise<void> {
    if (!tntcoin.wins.hasReachedMaxWins()) return;

    tntcoin.player.sendMessage('§eYou have reached the maximum number of wins!§r');
    tntcoin.feedback.displayScreen({ 
        title: `§a${tntcoin.wins.getCurrentWins()}§f/§a${tntcoin.wins.getMaxWins()}§r\n§aCongratulations!§r`, 
        subtitle: '§eYou have won the game!§r', 
        sound: 'random.levelup'
    });
    tntcoin.summonFireworks(20);

    await tntcoin.resetTntCoin();
    tntcoin.wins.reset();
    tntcoin.timer.stop();
}