import { TNTCoin } from "../../TNTCoin";
import { DEFAULT_GIFT, TIKTOK_GIFT } from "../../../lang/tiktokGifts";
import { executeAction } from "../../actions/executeAction";

/**
 * Handles the gift event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message the message received from WebSocket Server.
 */
export async function onGift(game: TNTCoin, message: string): Promise<void> {
    // Parse the message received from the WebSocket server (TNTCoin extension)
    const parsedMessage = JSON.parse(message);
    const { uniqueId, nickname, giftName, giftId, giftCount } = parsedMessage;

    let matchedGift = Object.values(TIKTOK_GIFT).find(gift => gift.id === giftId);
    if (!matchedGift) matchedGift = TIKTOK_GIFT[giftName];
    const giftEmoji = (!matchedGift || matchedGift?.emoji === '') ? DEFAULT_GIFT : matchedGift.emoji;

    const coloredNickName = `§e${nickname}§r`;
    const title = `${giftEmoji}\n§d${coloredNickName}§f`;
    const subtitle = `§asent§f §g${giftName}§f §o§c x${giftCount}!`;
    const chatMessage = `§aThank you for §c§o${giftCount} ${giftEmoji}§d${giftName}§r, §b${coloredNickName}§a!`;
    const actions = game.giftActionManager.getActionsForEvent(giftId?.toString()) || game.giftActionManager.getActionsForEvent(giftName);

    const goalGiftName = game.giftGoal.getGiftName();
    const goalGiftId = game.giftGoal.getGiftId();
    const isGoalActive = game.giftGoal.isActive();

    if (isGoalActive && (goalGiftName === giftName || goalGiftId === giftId)) {
        game.giftGoal.addGifts(giftCount);
    }

    if (actions && actions.length > 0) {
        actions.forEach((action: GiftAction) => {
            if (action.actionType !== 'Summon' && action?.playSound) {
                game.feedback.playSound(action.playSound);
            }
            if (action.actionType === 'Summon' && action.summonOptions) {
                const { entityName, amount } = action.summonOptions;
                const amountToSummon = amount * giftCount;
                game.player.sendMessage(`${coloredNickName} §asummoned §e${amountToSummon} §c${entityName.toUpperCase()}§f!`);
                executeAction(game, {
                    ...action,
                    summonOptions: {
                        ...action.summonOptions,
                        amount: amountToSummon,
                        newNameTag: `${coloredNickName}`,
                    },
                });
            } else {
                executeAction(game, action);
            }
        });
    }

    game.feedback.showFeedbackScreen({ title, subtitle });
    game.player.sendMessage(chatMessage);
    game.feedback.playSound('random.orb');
}