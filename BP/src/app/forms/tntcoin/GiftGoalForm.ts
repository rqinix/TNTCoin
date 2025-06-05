import ModalForm from "lib/Forms/ModalForm";
import { BaseForm } from "./BaseForm";
import { DEFAULT_GIFT, TIKTOK_GIFT } from "../../../lang/tiktokGifts";

export interface GiftGoalSettings {
    isEnabled: boolean;
    giftName: string;
    maxCount: number;
    currentCount: number;
}

export class GiftGoalForm extends BaseForm {
    show(): void {
        const giftGoalSettings = this.tntcoin.settings.getTntCoinSettings().giftGoalSettings as GiftGoalSettings;
        const availableGifts = Object.keys(TIKTOK_GIFT).filter(giftName => TIKTOK_GIFT[giftName].id !== null);
        const giftOptions = availableGifts.map(giftName => {
            const gift = TIKTOK_GIFT[giftName];
            const giftEmoji = gift.emoji || DEFAULT_GIFT;
            return `${giftEmoji} ${giftName} (${gift.coins})`;
        });
        const selectedGiftIndex = availableGifts.findIndex(gift => gift === giftGoalSettings.giftName);
        
        new ModalForm(this.player, 'Set Gift Goal')
            .toggle('Enable Gift Goal', giftGoalSettings.isEnabled, (isEnabled) => {
                this.tntcoin.giftGoal.setEnabled(isEnabled);
            })
            .dropdown('Select Gift', giftOptions, selectedGiftIndex >= 0 ? selectedGiftIndex : 0, (selectedIndex) => {
                if (selectedIndex >= 0 && selectedIndex < availableGifts.length) {
                    const selectedGiftName = availableGifts[selectedIndex];
                    this.tntcoin.giftGoal.setGift(selectedGiftName);
                }
            })
            .textField('number', 'Set Goal', 'Enter the goal amount', giftGoalSettings.maxCount.toString(), (goal) => {
                this.tntcoin.giftGoal.setMaxCount(goal as number);
            })
            .submitButton('Set Goal')
            .setParent(this.parentForm)
            .show();
    }
}
