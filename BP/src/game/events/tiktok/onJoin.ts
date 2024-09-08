import { executeAction } from "../../actions/executeAction";
import { TNTCoin } from "../../TNTCoin";

/**
 * Handles the join event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message
 */
export function onJoin(game: TNTCoin, message: string): void {
    const data = JSON.parse(message);
    const { nickname, uniqueId } = data;
    game.player.sendMessage(`§aWelcome, §e${nickname} (@${uniqueId})§a!`);
    
    const actions = game.memberActionManager.getAllActions().get('member') || [];
    if (actions.length > 0) {
        for (const action of actions) {
            executeAction(game, action);
        }
    }
}