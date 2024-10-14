import { executeAction } from "../../actions/executeAction";
import { TNTCoin } from "../../TNTCoin";

/**
 * Handles the comment event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message the message sent by TikTokLiveMCBE
 */
export function onChat(game: TNTCoin, message: string): void {
    const { uniqueId, nickname, comment } = JSON.parse(message);

    const chatActions = game.chatActionManager.getAllEvents();

    chatActions.forEach((actions, eventKey) => {
        if (eventKey === comment) {
            actions.forEach(action => executeAction(game, action));
        }
    });

    game.player.sendMessage(`§7[§aChat§7]: §f${nickname} §7: §f${comment}`);
}