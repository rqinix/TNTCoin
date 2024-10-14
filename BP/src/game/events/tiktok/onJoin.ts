import { executeAction } from "../../actions/executeAction";
import { TNTCoin } from "../../TNTCoin";

/**
 * Handles the join event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message the message sent by TikTokLiveMCBE
 */
export function onJoin(game: TNTCoin, message: string): void {
    const { nickname, uniqueId } = JSON.parse(message);

    const actions = game.memberActionManager.getAllEvents().get('member') || [];
    if (actions.length > 0) {
        for (const action of actions) {
            executeAction(game, action);
        }
    }

    game.player.sendMessage(`§aWelcome, §e${nickname} (@${uniqueId})§a!`);
}