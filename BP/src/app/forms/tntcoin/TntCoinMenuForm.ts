import ActionForm from "lib/Forms/ActionForm";
import { BaseForm } from "./BaseForm";
import { SummonEntityForm } from "./SummonEntityForm";
import { TimerForm } from "./TimerForm";
import { GiftGoalForm } from "./GiftGoalForm";
import { EventActionsForm } from "./EventActionsForm";
import { TntCoinSettingsForm } from "./TntCoinSettingsForm";
import { Player } from "@minecraft/server";
import { TntCoin, TntCoinStructure } from "app/tntcoin";
import { TntCoinForm } from "../TntCoinForm";

export class TntCoinMenuForm extends BaseForm {
    private summonEntityForm: SummonEntityForm;
    private timerForm: TimerForm;
    private giftGoalForm: GiftGoalForm;
    private eventActionsForm: EventActionsForm;
    private tntCoinSettingsForm: TntCoinSettingsForm;

    constructor(
        player: Player,
        tntcoin: TntCoin,
        structure: TntCoinStructure,
        form: TntCoinForm
    ) {
        super(player, tntcoin, structure, form);
        this.summonEntityForm = new SummonEntityForm(player, tntcoin, structure, form);
        this.timerForm = new TimerForm(player, tntcoin, structure, form);
        this.giftGoalForm = new GiftGoalForm(player, tntcoin, structure, form);
        this.eventActionsForm = new EventActionsForm(player, tntcoin, structure, form);
        this.tntCoinSettingsForm = new TntCoinSettingsForm(player, tntcoin, structure, form);
    }

    show(): void {
        const wins = this.tntcoin.wins.getCurrentWins();
        const maxWin = this.tntcoin.wins.getMaxWins();
        const totalBlocks = this.structure.locationManager.filledBlocksCount + this.structure.locationManager.airBlocksCount;
        const blocksPlaced = this.structure.locationManager.filledBlocksCount;
        const menuForm = new ActionForm(this.player, '§1§kii§r§c§lTNT§eCOIN§r§5§kii§r');
        this.parentForm = menuForm;
        this.summonEntityForm.setParentForm(menuForm);
        this.timerForm.setParentForm(menuForm);
        this.giftGoalForm.setParentForm(menuForm);
        this.eventActionsForm.setParentForm(menuForm);
        this.tntCoinSettingsForm.setParentForm(menuForm);
        menuForm.body(
                `§aWelcome§f to §cTNT §eCoin§f!\n` +
                `§bWins§f: ${wins < 0 ? '§c' : '§a'}${wins}§f/§a${maxWin}§f\n` +
                `§bBlock to Place§f: §a${blocksPlaced}/${totalBlocks}§f\n`
            )
            .button('Summon Entity', () => this.summonEntityForm.show(), 'textures/tnt-coin/gui/buttons/npc.png')
            .button('Summon TNT', this.tntcoin.summonTNT.bind(this.tntcoin), 'textures/tnt-coin/gui/buttons/tnt.png')
            .button(
                this.structure.isFilling ? '§c§kii§r§c§o§lStop Filling§r§c§kii§r' : 'Fill Blocks',
                this.structure.isFilling ? this.structure.stopFilling.bind(this.structure) : this.structure.fill.bind(this.structure),
                this.structure.isFilling ? 'textures/ui/button_red.png' : 'textures/ui/filledBar.png'
            )
            if (blocksPlaced > 0) {
                menuForm.button('§cClear Blocks', this.structure.clearFilledBlocks.bind(this.structure), 'textures/ui/hud_mob_effect_background.png');
            }
            menuForm.button('Teleport', () => this.tntcoin.teleportPlayer(this.structure.structureHeight), 'textures/gui/newgui/mob_effects/invisibility_effect.png')
            .button('Timer', () => this.timerForm.show(), 'textures/ui/timer.png')
            .button('§2§kii§r§8Goals§2§kii§r', () => this.giftGoalForm.show(), 'textures/tnt-coin/gui/buttons/goals.png')
            .button('§2§kii§r§8Event Actions§2§kii§r', () => this.eventActionsForm.show(), 'textures/ui/icon_bell.png')
            .button(
                this.tntcoin.settings.getTntCoinSettings().useBarriers ? '§c§kii§r§c§o§lClear Barriers§r§c§kii§r' : 'Enable Barriers',
                async () => {
                    if (this.tntcoin.settings.getTntCoinSettings().useBarriers) {
                        await this.structure.clearBarriers();
                        this.tntcoin.settings.updateTntCoinSettings({
                            ...this.tntcoin.settings.getTntCoinSettings(),
                            useBarriers: false,
                        })
                        this.feedback.playSound('note.bassattack');
                    } else {
                        await this.structure.generateBarriers();
                        this.tntcoin.settings.updateTntCoinSettings({
                            ...this.tntcoin.settings.getTntCoinSettings(),
                            useBarriers: true,
                        })
                        this.feedback.playSound('random.anvil_use');
                    }
                },
                this.tntcoin.settings.getTntCoinSettings().useBarriers ? 'textures/ui/button_red.png' : 'textures/blocks/barrier.png'
            )
            .button('Settings', () => this.tntCoinSettingsForm.show(), 'textures/ui/gear.png')
            .button('Reload', this.tntcoin.load.bind(this.tntcoin), 'textures/ui/refresh_light.png')
            .button('About', () => {
                this.player.sendMessage(
                    "§c§lTNT §e§lCOIN\n" +
                    "§r§fCreated by: §aRqinix§f\n" +
                    "§fVersion: §b1.2.0\n" +
                    "§fDiscord: §ahttps://discord.gg/g8pzqbtVe9\n"
                );
                this.feedback.playSound('random.pop');
            }, 'textures/items/book_normal.png')
            .button('Quit', this.tntcoin.quit.bind(this.tntcoin), 'textures/tnt-coin/gui/buttons/left.png')
            .show();
    }
}
