import { TntCoin } from "app/tntcoin/TntCoin";

/**
 * Handles the event when the player loses the game.
 * @param {TntCoin} tntcoin - The current instance of the TNT Coin.
 * @returns {Promise<void>} - A promise that resolves when the player loses the game.
 */
export async function onTntCoinTimerEnded(tntcoin: TntCoin): Promise<void> {
    tntcoin.isInProcess = true;
    
    tntcoin.wins.decrement();

    tntcoin.feedback.displayScreen({ 
        title: `§c${tntcoin.wins.getCurrentWins()}§f/§a${tntcoin.wins.getMaxWins()}`, 
        subtitle: '§cYou Lose!§r', 
        sound: 'random.totem'
    });
    
    await tntcoin.reset();
    tntcoin.timer.start();
    tntcoin.isInProcess = false;
}