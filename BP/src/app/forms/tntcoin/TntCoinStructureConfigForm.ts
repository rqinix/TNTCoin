import { BlockPermutation } from "@minecraft/server";
import ModalForm from "lib/Forms/ModalForm";
import { getStructureCenter } from "utilities/structure/getStructureCenter";
import { BaseForm } from "./BaseForm";

export class TntCoinStructureConfigForm extends BaseForm {
    show(): void {
        new ModalForm(this.player, "TNT COIN - Structure Configuration")
            .textField("string", "Base Block Type:", "Enter the block type for the base", "minecraft:quartz_block")
            .textField("string", "Side Block Type:", "Enter the block type for the sides", "minecraft:glass")
            .textField("string", "Floor Block Type", "Enter the block type for the floor", "minecraft:lodestone")
            .textField("number", "Width:", "Enter the width", "12")
            .textField("number", "Height:", "Enter the height", "11")
            .submitButton("Start TNT Coin")
            .show(async (response) => {
                const baseBlockName = response[0].toString().trim();
                const sideBlockName = response[1].toString().trim();
                const floorBlockName = response[2].toString().trim();
                const width = parseInt(response[3].toString().trim());
                const height = parseInt(response[4].toString().trim());

                try {
                    BlockPermutation.resolve(baseBlockName);
                    BlockPermutation.resolve(sideBlockName);
                    BlockPermutation.resolve(floorBlockName);
                } catch (error) {
                    this.feedback.error(`Invalid block names: ${error.message}`, { sound: 'item.shield.block' });
                    return;
                }

                if (width < 5 || height < 5) {
                    this.feedback.error("The width and height must be at least 5.", { sound: 'item.shield.block' });
                    return;
                }

                this.tntCoinGuiInstance.registerPlayer();

                this.structure.structureProperties = {
                    width, height,
                    centerLocation: getStructureCenter(this.player, width),
                    blockOptions: { baseBlockName, sideBlockName, floorBlockName },
                };

                this.tntcoin.settings.updateTntCoinSettings({
                    ...this.tntcoin.settings.getTntCoinSettings(),
                    fillSettings: {
                        ...this.tntcoin.settings.getTntCoinSettings().fillSettings,
                        blocksPerTick: Math.pow(width-2, 2),
                    }
                })

                await this.tntcoin.start();
            });
    }
}
