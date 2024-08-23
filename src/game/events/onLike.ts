import { TNTCoin } from "../TNTCoin";

/**
 * Handles the Like event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message
 */
export function onLike(game: TNTCoin, message: string): void {
    const data = JSON.parse(message);
    const { nickname, uniqueId, count } = data;
    game.player.sendMessage(`§aThank you for §d${count} §alikes! §e${nickname}§a!`);
}