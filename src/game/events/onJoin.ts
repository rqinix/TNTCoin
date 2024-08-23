import { TNTCoin } from "../TNTCoin";

/**
 * Handles the join event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message
 */
export function onJoin(game: TNTCoin, message: string): void {
    const data = JSON.parse(message);
    const { nickname, uniqueId } = data;
    game.player.sendMessage(`§aWelcome, §e${nickname} (@${uniqueId})§a!`);
}