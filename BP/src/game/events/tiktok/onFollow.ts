import { executeAction } from "../../actions/executeAction";
import { TNTCoin } from "../../TNTCoin";

/**
 * Handles the follow event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message the message sent by TikTokLiveMCBE
 */
export function onFollow(game: TNTCoin, message: string): void {
    const { nickname, uniqueId } = JSON.parse(message);

    const actions = game.followActionManager.getAllEvents().get('follow') || [];
    if (actions.length > 0) {
        for (const action of actions) executeAction(game, action);
    }

    game.player.sendMessage(`§7[§aNew Follower§7]: §bThank You for the Follow§f, §e${nickname}§e§f!`);
}