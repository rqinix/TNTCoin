import { TNTCoin } from "../../TNTCoin";

/**
 * Handles the Share event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message
 */
export function onShare(game: TNTCoin, message: string): void {
    const data = JSON.parse(message);
    const { nickname, uniqueId } = data;
    
    game.player.sendMessage(`§aThank you for sharing the stream, §e${nickname} §a(${uniqueId})§f!`);
}
