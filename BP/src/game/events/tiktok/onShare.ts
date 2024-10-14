import { executeAction } from "../../actions/executeAction";
import { TNTCoin } from "../../TNTCoin";

/**
 * Handles the Share event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message the message sent by TikTokLiveMCBE
 */
export function onShare(game: TNTCoin, message: string): void {
    const { nickname, uniqueId } = JSON.parse(message);

    const actions = game.shareActionManager.getAllEvents().get('share') || [];
    if (actions.length > 0) {
        for (const action of actions) {
            executeAction(game, action);
        }
    }

    game.player.sendMessage(`§7[§aShare§7]: §aThank you for sharing the stream, §e${nickname} §a(${uniqueId})§f!`);
}
