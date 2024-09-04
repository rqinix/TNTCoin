import { TNTCoin } from "../../TNTCoin";
import { DEFAULT_GIFT, TIKTOK_GIFT } from "../../../lang/tiktokGifts";

/**
 * Handles the gift event.
 * @param {TNTCoin} game the TNT Coin game instance.
 * @param {string} message the message received from WebSocket Server.
 */
export async function onGift(game: TNTCoin, message: string): Promise<void> { 
    // Parse the message received from the WebSocket server (TNTCoin extension)
    const parsedMessage = JSON.parse(message);
    const { gifterUniqueId, gifterNickName, giftName, giftId, giftCount } = parsedMessage;

    let matchedGift = Object.values(TIKTOK_GIFT).find(gift => gift.id === giftId);
    if (!matchedGift) matchedGift = TIKTOK_GIFT[giftName];

    const giftEmoji = matchedGift?.emoji || DEFAULT_GIFT;

    const goalGiftName = game.giftGoal.getGiftName();
    const goalGiftId = game.giftGoal.getGiftId();
    const isGoalActive = game.giftGoal.isActive();

    const coloredNickName = `§e${gifterNickName}§r`;
    const chatMessage = `§aThank you for §c§o${giftCount} ${giftEmoji}§d${giftName}§r, §b${coloredNickName}§a!`;

    // Define actions for each gift
    const actions = {
        summonTNT: (amount: number) => {
            const title = `${giftEmoji}\n§b${giftName}§r\n§d${coloredNickName}§f`;
            const subtitle = `§asent §cTNT §d§ox${amount}§f`;
            const MESSAGE = `${giftEmoji} ${coloredNickName} sent §cTNT §d§ox${amount}§f!`

            game.summonEntities(
                'tnt_minecart', 
                { 
                    amount: amount, 
                    locationType: 'random', 
                    onTop: true, 
                    batchSize: 5, 
                    delayBetweenBatches: 7,
                    onSummon: () => game.player.playSound('kururin')
                }
            );
            game.feedback.showFeedbackScreen({ title, subtitle });
            game.player.sendMessage(MESSAGE);
        },

        summonLightning: (amount: number) => {
            const title = `${giftEmoji}\n§d${coloredNickName}§f`;
            const subtitle = `§asent §cLightning Bolts §d§ox${amount}§f!`;
            const MESSAGE = `${giftEmoji} ${coloredNickName} sent §cLightning Bolts §d§ox${amount}§f!`;

            game.summonLightningBolt(amount);
            game.feedback.showFeedbackScreen({ title, subtitle });
            game.player.sendMessage(MESSAGE);
        },

        clearBlocks: () => {
            const title = `${giftEmoji}\n§d${coloredNickName}§f`;
            const subtitle = `§acleared the blocks!`;
            const MESSAGE = `${giftEmoji} ${coloredNickName} cleared the blocks!`;
            const SOUND_ON_CLEAR = 'cat_laughing'; 

            game.structure.clearFilledBlocks();

            game.feedback.showFeedbackScreen({ title, subtitle });
            game.player.playSound(SOUND_ON_CLEAR);
            game.player.sendMessage(MESSAGE);
        },

        fillStructure: () => {
            const title = `${giftEmoji}\n§d${coloredNickName}§f`;
            const subtitle = `§afilled the structure!`;
            const SOUND_ON_FILL = 'wait_wait_wait';

            game.feedback.showFeedbackScreen({ title, subtitle });
            game.player.playSound(SOUND_ON_FILL);
            game.structure.fill();
        },

        // ... Add your own actions here
    };

    // TikTok may change the gift names, so we need to update this list and the gift names in the lang folder
    // For example, TikTok changed the gift name 'Friendship Necklace' to 'BFF Necklace'
    const giftActions: Array<{ id: string, name: string, action: () => Promise<void> | void }> = [
        { id: '5655', name: 'Rose', action: () => actions.summonTNT(giftCount * 10) },
        { id: '10749', name: 'Community Fest', action: () => actions.summonTNT(giftCount * 15) },
        { id: '6064', name: 'GG', action: () => actions.summonLightning(giftCount * 3) },
        { id: '8913', name: 'Rosa', action: actions.clearBlocks },
        { id: '9947', name: 'BFF Necklace', action: actions.fillStructure },
        { id: '7934', name: 'Heart Me', action: () => actions.summonTNT(giftCount * 20) },
        { id: '6671', name: 'Love You', action: () => actions.summonTNT(giftCount * 1) },
        { id: '5487', name: 'Finger Heart', action: () => actions.summonTNT(giftCount * 4) },
        { id: '5879', name: 'Doughnut', action: () => actions.summonLightning(giftCount * 5) },
        { id: '6267', name: 'Corgi', action: () => actions.summonTNT(giftCount * 1000) },
    ];

    if (isGoalActive && (goalGiftName === giftName || goalGiftId === giftId)) {
        game.giftGoal.addGifts(giftCount);
        game.player.playSound('random.orb');
    }

    game.player.sendMessage(chatMessage);

    const giftAction = giftActions.find(gift => gift.id === giftId || gift.name === giftName)?.action;
    if (giftAction) {
        await giftAction();
    } else {
        const title = `${giftEmoji}\n§d${coloredNickName}§f`;
        const subtitle = `§asent§f §g${giftName}§f §o§c x${giftCount}!`;
        game.feedback.showFeedbackScreen({ title, subtitle });
    }
}
