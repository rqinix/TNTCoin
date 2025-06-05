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
import { TntCoinRainForm } from "./TntCoinRainForm";
import { TntCoinRocketForm } from "./TntCoinRocketForm";

export class TntCoinMenuForm extends BaseForm {
    private summonEntityForm: SummonEntityForm;
    private timerForm: TimerForm;
    private giftGoalForm: GiftGoalForm;
    private eventActionsForm: EventActionsForm;
    private tntCoinSettingsForm: TntCoinSettingsForm;
    private tntCoinRainForm: TntCoinRainForm;
    private tntCoinRocketForm: TntCoinRocketForm;

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
        this.tntCoinRainForm = new TntCoinRainForm(player, tntcoin, structure, form);
        this.tntCoinRocketForm = new TntCoinRocketForm(player, tntcoin, structure, form);
    }

    show(): void {
        const wins = this.tntcoin.wins.getCurrentWins();
        const maxWin = this.tntcoin.wins.getMaxWins();
        const totalBlocks = this.structure.blocksManager.filledBlocksCount + this.structure.blocksManager.airBlocksCount;
        const blocksPlaced = this.structure.blocksManager.filledBlocksCount;
        const menuForm = new ActionForm(this.player, '§1§kii§r§c§lTNT§eCOIN§r§5§kii§r');
        this.parentForm = menuForm;
        this.summonEntityForm.setParentForm(menuForm);
        this.timerForm.setParentForm(menuForm);
        this.giftGoalForm.setParentForm(menuForm);
        this.eventActionsForm.setParentForm(menuForm);
        this.tntCoinSettingsForm.setParentForm(menuForm);
        this.tntCoinRocketForm.setParentForm(menuForm);
        menuForm.body(
                `§aWelcome§f to §cTNT §eCoin§f!\n` +
                `§bWins§f: ${wins < 0 ? '§c' : '§a'}${wins}§f/§a${maxWin}§f\n` +
                `§bBlock to Place§f: §a${blocksPlaced}/${totalBlocks}§f\n`
            )
            .button('Summon Entity', () => this.summonEntityForm.show(), 'textures/tnt-coin/gui/buttons/npc.png')
            .button('Summon TNT', this.tntcoin.summonTNT.bind(this.tntcoin), 'textures/tnt-coin/gui/buttons/tnt.png')
            .button(
                this.tntCoinRainForm.isActive() ? '§c§kii§r§c§o§lStop TNT Coin Rain§r§c§kii§r' : '§2§kii§r§2§o§lStart TNT Coin Rain§r§2§kii§r',
                this.tntCoinRainForm.show.bind(this.tntCoinRainForm),
                this.tntCoinRainForm.isActive() ? 'textures/ui/button_red.png' : 'textures/blocks/tnt_bottom.png'
            )
            .button(
                this.tntcoin.isTntRocketFlying ? '§c§kii§r§c§o§lAbort TNT Rocket§r§c§kii§r' : '§2§kii§r§2§o§lLaunch TNT Rocket§r§2§kii§r',
                () => this.tntCoinRocketForm.show(),
                this.tntcoin.isTntRocketFlying ? 'textures/ui/button_red.png' : 'textures/items/fireworks.png'
            )
            .button(
                this.structure.fillConfig.isActive ? '§c§kii§r§c§o§lStop Filling§r§c§kii§r' : 'Fill Blocks',
                this.structure.fillConfig.isActive ? this.structure.stopFilling.bind(this.structure) : this.structure.fill.bind(this.structure),
                this.structure.fillConfig.isActive ? 'textures/ui/button_red.png' : 'textures/ui/filledBar.png'
            )

            if (blocksPlaced > 0) {
                menuForm.button('§c§kii§r§c§o§lClear Blocks§r§c§kii§r', this.structure.clearBlocks.bind(this.structure), 'textures/ui/hud_mob_effect_background.png');
            }

            menuForm.button(
                this.tntcoin.isPlayerJailed ? '§c§kii§r§c§o§lTeleport Disabled§r§c§kii§r' : 'Teleport Player',
                this.tntcoin.isPlayerJailed ? undefined : () => this.tntcoin.teleportPlayer(this.structure.structureHeight),
                'textures/gui/newgui/mob_effects/invisibility_effect.png'
            )
            .button(
                this.tntcoin.isPlayerJailed ? '§a§kii§r§a§o§lRelease from Jail§r§a§kii§r' : 'Jail Player',
                this.tntcoin.isPlayerJailed ? this.tntcoin.releasePlayerFromJail.bind(this.tntcoin) : () => this.tntcoin.jailPlayer(),
                this.tntcoin.isPlayerJailed ? 'textures/ui/confirm.png' : 'textures/blocks/iron_bars.png'
            )
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
            .button(
                this.tntcoin.settings.structureEditMode ? '§c§kii§r§c§o§lLock Structure§r§c§kii§r' : '§2§kii§r§2§o§lUnlock Structure§r§2§kii§r',
                () => {
                    this.tntcoin.settings.structureEditMode = !this.tntcoin.settings.structureEditMode;
                    this.feedback.playSound(this.tntcoin.settings.structureEditMode ? 'random.anvil_use' : 'note.bassattack');
                    if (this.tntcoin.settings.structureEditMode) {
                        this.tntcoin.actionbar.addTask(`StructureEditMode:${this.player.name}`, {
                            id: `StructureEditMode:${this.player.name}`,
                            callback: () => ['§c§lStructure Builder Mode is ON!§r']
                        });
                    } else {
                        this.tntcoin.actionbar.removeTasks([`StructureEditMode:${this.player.name}`]);
                    }
                },
                this.tntcoin.settings.structureEditMode ? 'textures/ui/unLock.png' : 'textures/ui/lock_color.png'
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
