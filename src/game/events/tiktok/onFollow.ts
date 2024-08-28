import { TNTCoin } from "../../TNTCoin";

/**
 * Handles the follow event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message
 */
export function onFollow(game: TNTCoin, message: string): void {
    const data = JSON.parse(message);
    const { nickname, uniqueId } = data;

    game.player.sendMessage(`§bThank You for the Follow§f, §e${nickname}§e§f!`);
}