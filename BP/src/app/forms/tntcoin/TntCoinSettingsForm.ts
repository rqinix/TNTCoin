import { BlockPermutation } from "@minecraft/server";
import ModalForm from "lib/Forms/ModalForm";
import { BaseForm } from "./BaseForm";

export class TntCoinSettingsForm extends BaseForm {
    show(): void {
        if (this.tntcoin.countdown.isCountingDown) {
            this.feedback.error('Cannot change settings while countdown is active.', { sound: 'item.shield.block' });
            return;
        }

        const oldSettings = { ...this.tntcoin.settings.getTntCoinSettings() };
        const newSettings = { ...this.tntcoin.settings.getTntCoinSettings() };

        new ModalForm(this.player, 'TNT Coin Settings')
            .toggle(
                'Rotate Camera', 
                oldSettings.doesCameraRotate, 
                (updatedValue) => newSettings.doesCameraRotate = updatedValue as boolean
            )
            .toggle(
                'Randomize Placing Blocks', 
                oldSettings.randomizeBlocks, 
                (updatedValue) => newSettings.randomizeBlocks = updatedValue as boolean
            )
            .toggle(
                'Actionbar', 
                this.tntcoin.actionbar.isRunning(), 
                (updatedValue) => {
                    if (updatedValue) {
                        this.tntcoin.actionbar.start();
                    } else {
                        this.tntcoin.actionbar.stop();
                    }
                }
            )
            .textField(
                "number", 
                "[§eWIN§r] Set Wins", 
                "Enter the amount of wins:", 
                oldSettings.wins.toString(), 
                (updatedValue) => newSettings.wins = updatedValue as number
            )
            .textField(
                "number", 
                "[§eWIN§r] Max Win", 
                "Enter the maximum win:", 
                oldSettings.maxWins.toString(), 
                (updatedValue) => {
                    if (updatedValue as number <= 0) {
                        this.feedback.error('Maximum win cannot be negative or zero', { sound: 'item.shield.block' });
                    } else {
                        newSettings.maxWins = updatedValue as number;
                    }
                }
            )
            .textField(
                "number", 
                '[§eCOUNTDOWN§r] Starting count:', 
                'Enter the starting count for the countdown', 
                oldSettings.defaultCountdownTime.toString(), 
                (updatedValue) => {
                    if (updatedValue as number <= 0) {
                        this.feedback.error('Countdown time must be greater than zero', { sound: 'item.shield.block' });
                    } else {
                        newSettings.defaultCountdownTime = updatedValue as number;
                    }
                }
            )
            .textField(
                "number", 
                '[§eCOUNTDOWN§r] Delay in Ticks:', 
                'Enter the countdown delay in ticks', 
                oldSettings.countdownTickInterval.toString(), 
                (updatedValue) => {
                    if (updatedValue as number <= 0) {
                        this.feedback.error('Countdown tick delay must be greater than zero', { sound: 'item.shield.block' });
                    } else {
                        newSettings.countdownTickInterval = updatedValue as number;
                    }
                }
            )
            .textField(
                "string", 
                '[§eFILL§r] Block Name:', 
                'Enter the block name to fill', 
                oldSettings.fillSettings.blockName, 
                (updatedValue) => {
                    try {
                        if (BlockPermutation.resolve(updatedValue as string)) {
                            newSettings.fillSettings.blockName = updatedValue as string
                        }
                    } catch (error) {
                        this.feedback.error(`Invalid block name: ${error.message}`, { sound: 'item.shield.block' });
                    }
                }
            )
            .textField(
                "number", 
                "[§eFILL§r] Delay in Ticks:", 
                "Enter the delay in ticks to fill blocks", 
                oldSettings.fillSettings.tickInterval.toString(), 
                (updatedValue) => {
                    if (updatedValue as number <= 0) {
                        this.feedback.error('Fill tick delay must be greater than zero', { sound: 'item.shield.block' });
                    } else {
                        newSettings.fillSettings.tickInterval = updatedValue as number;
                    }
                }
            )
            .textField(
                "number", 
                "[§eFILL§r] Amount of Blocks per tick:", 
                'Enter the amount of blocks to fill per tick', 
                oldSettings.fillSettings.blocksPerTick.toString(), 
                (updatedValue) => {
                    if (updatedValue as number <= 0) {
                        this.feedback.error('Blocks per tick must be greater than zero', { sound: 'item.shield.block' });
                    } else {
                        newSettings.fillSettings.blocksPerTick = updatedValue as number;
                    }
                }
            )
            .submitButton("Update Settings")
            .setParent(this.parentForm)
            .show(() => {
                const isSettingsChanged = JSON.stringify(oldSettings) !== JSON.stringify(newSettings);
                if (isSettingsChanged) {
                    this.tntcoin.settings.updateTntCoinSettings(newSettings);
                    this.feedback.success('TNT Coin settings updated.', { sound: 'random.levelup' });
                }
            });
    }
}
