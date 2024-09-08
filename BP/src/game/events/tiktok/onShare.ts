import { executeAction } from "../../actions/executeAction";
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

    const actions = game.shareActionManager.getAllActions().get('share') || [];
    if (actions.length > 0) {
        for (const action of actions) {
            executeAction(game, action);
        }
    }
}
