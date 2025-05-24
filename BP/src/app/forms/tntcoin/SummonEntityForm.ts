import ModalForm from "lib/Forms/ModalForm";
import { BaseForm } from "./BaseForm";

export interface SummonEntitySettings {
    entityName: string;
    amount: number;
    locationType: 'random' | 'center';
    onTop: boolean;
    batchSize: number;
    batchDelay: number;
    playSound: {
        playSoundOnSummon: boolean;
        sound: string;
    };
}

export class SummonEntityForm extends BaseForm {
    show(): void {
        const settings = this.tntcoin.settings.summonEntitySettings;
        const locationType = settings.locationType === 'random' ? 0 : 1;
        new ModalForm(this.player, 'Summon Entities')
            .textField("string", "Entity Name:", "Enter the entity name", settings.entityName)
            .textField("number", "Amount:", "Enter the amount of entities to summon", settings.amount.toString())
            .dropdown('Location', ['Random', 'Center'], locationType)
            .toggle('On Top', settings.onTop)
            .textField("number", "Batch Size:", "Enter the batch size", settings.batchSize.toString())
            .textField("number", "Batch Delay:", "Enter the delay between batches", settings.batchDelay.toString())
            .toggle('Play Sound', settings.playSound.playSoundOnSummon)
            .textField('string', 'Sound', 'Enter the sound name', settings.playSound.sound)
            .submitButton('§2Summon§r')
            .setParent(this.parentForm)
            .show((response) => {
                const entityName = response[0].toString().trim();
                const amount = Math.max(1, parseInt(response[1].toString().trim()));
                const locationType = (response[2] as number) === 0 ? 'random' : 'center';
                const onTop = response[3] as boolean;
                const batchSize = Math.max(1, parseInt(response[4].toString().trim()));
                const batchDelay = Math.max(1, parseInt(response[5].toString().trim()));
                const playSound = response[6] as boolean;
                const sound = response[7].toString().trim();
                this.tntcoin.summonEntities({
                    entityName,
                    amount,
                    locationType,
                    onTop,
                    batchSize,
                    batchDelay,
                    playSound: {
                        playSoundOnSummon: playSound,
                        sound,
                    },
                });
            });
    }
}
