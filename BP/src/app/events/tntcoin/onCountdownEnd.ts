import { taskManager } from "lib/Managers/TaskManager";
import { TntCoin } from "app/tntcoin/TntCoin";
import CameraUtils from "utilities/camera/CameraUtils";

/**
 * Handles the event when the countdown ends in the TNT Coin.
 * @param {TntCoin} tntcoin - The current instance of the TNT Coin.
 * @returns {Promise<void>} - A promise that resolves when the countdown end.
 */
export async function onCountdownEnd(tntcoin: TntCoin): Promise<void> {
    tntcoin.isInProcess = true;
    
    CameraUtils.clearTaskCamera(tntcoin.player, `rotateCamera360`);
    tntcoin.wins.increment();

    taskManager.executeTask(() => {
        tntcoin.summonFireworks(20);
        tntcoin.feedback.displayScreen({ 
            title: `§a${tntcoin.wins.getCurrentWins()}§f/§a${tntcoin.wins.getMaxWins()}`, 
            subtitle: '§eYou win!§r', 
            sound: 'random.levelup'
        });
        tntcoin.player.dimension.spawnParticle('minecraft:totem_particle', tntcoin.player.location);
    }, 20);

    await tntcoin.reset();
    tntcoin.timer.restart();
    tntcoin.isInProcess = false;
}