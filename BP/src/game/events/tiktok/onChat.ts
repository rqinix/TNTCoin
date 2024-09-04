import { TNTCoin } from "../../TNTCoin";

/**
 * Handles the comment event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message
 */
export function onChat(game: TNTCoin, message: string): void {
    const data = JSON.parse(message);
    const { uniqueId, nickname, comment } = data;

    game.player.sendMessage(`§a${nickname}§f: ${comment}`);
}