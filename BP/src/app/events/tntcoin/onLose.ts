import { TntCoin } from "app/game/TntCoin";

/**
 * Handles the event when the player loses the game.
 * @param {TntCoin} tntcoin - The current instance of the TNT Coin.
 * @returns {Promise<void>} - A promise that resolves when the player loses the game.
 */
export async function onLose(tntcoin: TntCoin): Promise<void> {
    tntcoin.wins.decrement();

    tntcoin.feedback.displayScreen({ 
        title: `§c${tntcoin.wins.getCurrentWins()}§f/§a${tntcoin.wins.getMaxWins()}`, 
        subtitle: '§cYou Lose!§r', 
        sound: 'random.totem'
    });
    
    await tntcoin.resetTntCoin();
    tntcoin.timer.start();
}