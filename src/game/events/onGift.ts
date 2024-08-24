import { TNTCoin } from "../TNTCoin";
import { TIKTOK_GIFT, TikTokGifts } from "../../lang/tiktokGifts";

/**
 * Handles the gift event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message
 */
export function onGift(game: TNTCoin, message: string): void {
    const data = JSON.parse(message);
    const { giftName, giftCount, gifterNickName, gifterUniqueId, gifterRank } = data;
    const giftIcon = TIKTOK_GIFT[giftName].icon || { icon: '' };
    const formattedGifterNickName = `§e${gifterNickName}§a`;

    game.feedback.showFeedbackScreen({ 
        title: `${giftIcon}\n§d${formattedGifterNickName}§f`, 
        subtitle: `§asent§f §g${giftName}§f §o§c x${giftCount}!` 
    });

    game.player.sendMessage(`§aThank you for §c§ox${giftCount} §d${giftName}§f${giftIcon}, §b${formattedGifterNickName}§a!`);

    const actions = {
        summonTNT: (amount: number) => {
            game.summonEntities(
                'tnt_minecart', 
                { amount: amount, locationType: 'random', onTop: true }
            );
            game.feedback.showFeedbackScreen({
                title: `${giftIcon}\n§d${formattedGifterNickName}§f`,
                subtitle: `§asent §cTNT §d§ox${amount}§f`
            });
            game.player.sendMessage(`${giftIcon} ${formattedGifterNickName} sent §cTNT §d§ox${amount}§f!`);
        },
        summonLightning: (amount: number) => {
            game.summonLightningBolt(amount);
            game.feedback.showFeedbackScreen({
                title: `${giftIcon}\n§d${formattedGifterNickName}§f`,
                subtitle: `§asent §cLightning Bolts §d§ox${amount}§f!`
            });
            game.player.sendMessage(`${giftIcon} ${formattedGifterNickName} sent §cLightning Bolts §d§ox${amount}§f!`);
        },
        clearBlocks: () => {
            game.structure.clearFilledBlocks();
            game.feedback.showFeedbackScreen({
                title: `${giftIcon}\n§d${formattedGifterNickName}§f`,
                subtitle: `§acleared the blocks!`
            });
            game.player.sendMessage(`${giftIcon} ${formattedGifterNickName} cleared the blocks!`);
        },
        fillStructure: () => {
            game.structure.fill();
            game.feedback.showFeedbackScreen({
                title: `${giftIcon}\n§d${formattedGifterNickName}§f`,
                subtitle: `§afilled the structure!`
            });
        }
    };

    const giftActions: { [key in TikTokGifts]?: () => void } = {
        'Rose': () => actions.summonTNT(giftCount * 10),
        'Community Fest': () => actions.summonTNT(giftCount * 15),
        'GG': () => actions.summonLightning(giftCount * 3),
        'I Love You': () => actions.summonTNT(giftCount * 1),
        'Rosa': actions.clearBlocks,
        'Friendship Necklace': actions.fillStructure,
        'Finger Heart': () => actions.summonTNT(giftCount * 4),
        'Doughnut': () => actions.summonLightning(giftCount * 5),
        // ... 
    };

    const giftAction = giftActions[giftName];
    if (giftAction) {
        giftAction();
    } else {
        console.warn(`No action defined for gift: ${giftName}`);
    }
}