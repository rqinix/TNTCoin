import { BlockPermutation, Player } from "@minecraft/server";
import { TNTCoin } from "./TNTCoin";
import { floorVector3 } from "./utilities/math/floorVector";
import { getStructureCenter } from "./utilities/structure/getStructureCenter";
import { ActionForm, ModalForm } from "../core/Form";
import { SOUNDS } from "../config/config";
import { event as eventHandler } from "./events/tiktok/index";
import { PlayerFeedback } from "../core/PlayerFeedback";
import { TNTCoinStructure } from "./TNTCoinStructure";
import { TIKTOK_GIFT } from "../lang/tiktokGifts";

/**
 * A map of player names in-game with a TNTCoinGUI instance.
 */
export const INGAME_PLAYERS = new Map<string, TNTCoinGUI>();

/**
 * Represents a TNTCoin game instance with a GUI.
 */
export class TNTCoinGUI {
    private _player: Player;
    private _game: TNTCoin;
    private _structure: TNTCoinStructure
    private _feedback: PlayerFeedback;
    
    /**
     * Creates an instance of the TNTCoinGameGUI class.
     * @param {Player} player 
     */
    constructor(player: Player) {
        this._player = player;
        this._feedback = new PlayerFeedback(player);
        this._game = new TNTCoin(player);
        this._structure = this._game.structure;
    }

    public get game(): TNTCoin {
        return this._game;
    }

    /**
     * Setup the game
     */
    private setupGame(): void {
        if (!this._game.isPlayerInGame) {
            INGAME_PLAYERS.set(this._player.name, this);
            this._game.isPlayerInGame = true;
        }
    }

    /**
    * Shows the GUI to the player.
    */
    public showGui(): void {
        if (INGAME_PLAYERS.has(this._player.name) && this._game.isPlayerInGame) {
            this.showInGameForm();
        } else {
            this.showStructureConfigForm();
        }
    }
    
    /**
    * Shows the structure configuration form to the player.
    */
    private showStructureConfigForm(): void {
        new ModalForm(this._player, "TNT COIN - Structure Configuration")
    
        .textField("string", "Base Block Type:", "Enter the block type for the base", "minecraft:quartz_block")
        .textField("string", "Side Block Type:", "Enter the block type for the sides", "minecraft:glass")
        .textField("number", "Width:", "Enter the width", "12")
        .textField("number", "Height:", "Enter the height", "12")
        .submitButton("§2Start TNT Coin§r")
    
        .show(async (response) => {
            const baseBlockName = response[0].toString().trim();
            const sideBlockName = response[1].toString().trim();
            const widthStr = response[2].toString().trim();
            const heightStr = response[3].toString().trim();
    
            const width = parseInt(widthStr);
            const height = parseInt(heightStr);
    
            try {
                BlockPermutation.resolve(baseBlockName);
                BlockPermutation.resolve(sideBlockName);
            } catch (error) {
                this._feedback.error(`Invalid block names: ${error.message}`, { sound: 'item.shield.block' });
                return;
            }
    
            if (width < 5 || height < 5) {
                this._feedback.error("The width and height must be at least 5.", { sound: 'item.shield.block' });
                return;
            }
    
            const centerLocation = floorVector3(getStructureCenter(this._player, width));
            const newStructureProperties: StructureProperties = {
                centerLocation,
                width,
                height,
                blockOptions: { 
                    baseBlockName,
                    sideBlockName 
                },
            };
    
            this.setupGame();
            this._game.structure.structureProperties = JSON.stringify(newStructureProperties);
            await this._game.startGame();
        });
    }
    
    /**
    * Shows the in-game form to the player.
    */
    private showInGameForm(): void {
        const wins = this._game.winManager.getCurrentWins();
        const maxWin = this._game.winManager.getMaxWins();
        
        new ActionForm(this._player, '§1§kii§r§c§lTNT§eCOIN§r§5§kii§r')

        .body(
            `[§bWINS§f]: ${wins < 0 ? '§c' : '§a' }${wins}§f/§a${maxWin}§f\n` +
            `[§bBLOCKS TO FILL§f]: §a${this._structure.airBlockLocations.length}§f\n` 
        )

        .button('Summon Entity', this.showSummonEntityForm.bind(this), 'textures/tnt-coin/gui/buttons/npc.png')
        .button('Summon TNT', this._game.summonTNT.bind(this._game), 'textures/tnt-coin/gui/buttons/tnt.png')
        .button('Summon Lightning Bolt', this._game.summonLightningBolt.bind(this._game), 'textures/tnt-coin/gui/buttons/lightning_bolt.png')
        .button('Fill Blocks', this._structure.fill.bind(this._structure), 'textures/tnt-coin/gui/buttons/brush.png')
        .button('Stop Filling', this._structure.fillStop.bind(this._structure), 'textures/tnt-coin/gui/buttons/stop_fill.png')
        .button('Clear Blocks', this._structure.clearFilledBlocks.bind(this._structure), 'textures/tnt-coin/gui/buttons/trash.png')
        .button('Teleport', () => this._game.teleportPlayer(this._structure.structureHeight), 'textures/tnt-coin/gui/buttons/ender_pearl.png')
        .button('Play Sound', this.showPlaySoundForm.bind(this), 'textures/tnt-coin/gui/buttons/record_cat.png')
        .button('Settings', this.showInGameSettingsForm.bind(this), 'textures/tnt-coin/gui/buttons/settings.png')
        .button('Gift Goal', this.showGiftGoalForm.bind(this), 'textures/tnt-coin/gui/buttons/goals.png')
        .button('Timer', this.showTimerForm.bind(this), 'textures/tnt-coin/gui/buttons/clock.png')
        .button('§2§kii§r§8Events§2§kii§r', this.showEventsForm.bind(this), 'textures/tnt-coin/gui/buttons/bell.png')
        .button('Reload', this._game.loadGame.bind(this._game), 'textures/tnt-coin/gui/buttons/reload.png')
        .button('Quit', this._game.quitGame.bind(this._game), 'textures/tnt-coin/gui/buttons/left.png')

        .show();
    }

    /**
     * Shows the form to set up or modify the gift goal.
     */
    private showGiftGoalForm(): void {
        const settings = this._game.settings.giftGoalSettings as GiftGoalSettings;
        const availableGifts = Object.keys(TIKTOK_GIFT).filter(giftName => TIKTOK_GIFT[giftName].emoji);
        
        const giftOptions = availableGifts.map(giftName => {
            const gift = TIKTOK_GIFT[giftName];
            return `${gift.emoji} ${giftName}`;
        });
        
        const selectedGiftIndex = availableGifts.findIndex(gift => gift === settings.giftName);
    
        new ModalForm(this._player, 'Set Gift Goal')
            .toggle('Enable Gift Goal', settings.isEnabled, (isEnabled) => {
                this._game.giftGoal.setEnabled(isEnabled as boolean);
            })
            .dropdown('Select Gift', giftOptions, selectedGiftIndex >= 0 ? selectedGiftIndex : 0, (selectedIndex) => {
                if (selectedIndex >= 0 && selectedIndex < availableGifts.length) {
                    const selectedGiftName = availableGifts[selectedIndex];
                    this._game.giftGoal.setGift(selectedGiftName);
                }
            })
            .textField('number', 'Set Goal', 'Enter the goal amount', settings.maxCount.toString(), (goal) => {
                this._game.giftGoal.setMaxCount(goal as number);
            })
            .submitButton('§2Set Goal§r')
            .show();
    }

    /**
    * Shows the in-game settings form to the player and update the game settings.
    */
    private showInGameSettingsForm(): void {
        if (this._game.countdown.isCountingDown) {
            this._feedback.error('Cannot change settings while countdown is active.', { sound: 'item.shield.block' });
            return;
        }

        const oldSettings = { ...this._game.settings };
        const newSettings = { ...this._game.settings };

        new ModalForm(this._player, 'Game Settings')
        .toggle(
            'Use Barriers',
            oldSettings.useBarriers, 
            (updatedValue) => {
                newSettings.useBarriers = updatedValue as boolean;
                if (newSettings.useBarriers) {
                    this._structure.generateBarriers();
                } else {
                    this._structure.clearBarriers();
                }
                this._feedback.playSound('note.bassattack');
            }
        )
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
            this._game.actionbar.isRunning(),
            (updatedValue) => {
                if (updatedValue) {
                    this._game.actionbar.start();
                } else {
                    this._game.actionbar.stop();
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
            "Enter the max win:",
            oldSettings.maxWins.toString(),
            (updatedValue) => newSettings.maxWins = updatedValue as number
        )
        .textField(
            "number",
            '[§eCOUNTDOWN§r] Starting count value:', 
            'Enter the starting count for the countdown', 
            oldSettings.defaultCountdownTime.toString(),
            (updatedValue) => newSettings.defaultCountdownTime = updatedValue as number
        )
        .textField(
            "number",
            '[§eCOUNTDOWN§r] Delay in Ticks:', 
            'Enter the countdown delay in ticks', 
            oldSettings.countdownTickInterval.toString(),
            (updatedValue) => newSettings.countdownTickInterval = updatedValue as number
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
                    this._feedback.error(`Invalid block name: ${error.message}`, { sound: 'item.shield.block' });
                }
            }
        )
        .textField(
            "number",
            "[§eFILL§r] Delay in Ticks:", 
            "Enter the delay in ticks to fill blocks", 
            oldSettings.fillSettings.tickInterval.toString(),
            (updatedValue) => newSettings.fillSettings.tickInterval = updatedValue as number
        )
        .textField(
            "number",
            "[§eFILL§r] Amount of Blocks per tick:", 
            'Enter the amount of blocks to fill per tick', 
            oldSettings.fillSettings.blocksPerTick.toString(),
            (updatedValue) => newSettings.fillSettings.blocksPerTick = updatedValue as number
        )
        .submitButton('§2Update Settings§r')
        .show(() => {
            const isSettingsChanged = JSON.stringify(oldSettings) !== JSON.stringify(newSettings);
            if (isSettingsChanged) {
                this._game.settings = newSettings;
                this._feedback.success('Game settings have been updated.', { sound: 'random.levelup' });
            }
        });
    }
    
    private async showSummonEntityForm(): Promise<void> {
        const settings = this._game.settings.summonEntitySettings;
        const locationType = settings.locationType === 'random' ? 0 : 1;

        new ModalForm(this._player, 'Summon Entity')
        .textField("string", "Entity Name:", "Enter the entity name", settings.entityName)
        .textField("number", "Amount:", "Enter the amount of entities to summon", settings.amount.toString())
        .dropdown('Location', ['Random', 'Center'], locationType)
        .toggle('On Top', settings.onTop)
        .textField("number", "Batch Size:", "Enter the batch size", settings.batchSize.toString())
        .textField("number", "Batch Delay:", "Enter the delay between batches", settings.delayBetweenBatches.toString())
        .submitButton('§2Summon§r')
        .show((response) => {
            const entityName = response[0].toString().trim();
            const amount = Math.max(1, parseInt(response[1].toString().trim()));
            const locationType = (response[2] as number) === 0 ? 'random' : 'center';
            const onTop = response[3] as boolean;
            const batchSize = Math.max(1, parseInt(response[4].toString().trim()));
            const batchDelay = Math.max(1, parseInt(response[5].toString().trim()));

            this._game.summonEntityFormSettings = {
                entityName,
                amount,
                locationType,
                onTop,
                batchSize,
                delayBetweenBatches: batchDelay,
            };

            this._game.summonEntities({
                entityName,
                amount,
                locationType,
                onTop,
                batchSize,
                delayBetweenBatches: batchDelay,
            });
        });
    }

    /**
     * Shows Timer form to the player.
     */
    private showTimerForm(): void {
        new ActionForm(this._player, 'Timer')
            .button('Start Timer', this._game.timerManager.start.bind(this._game.timerManager))
            .button('Stop Timer', this._game.timerManager.stop.bind(this._game.timerManager))
            .button('Restart Timer', this._game.timerManager.restart.bind(this._game.timerManager))
            .button('Edit Timer', this.showTimerConfigForm.bind(this))
            .show();
    }

    /**
     * Shows Timer Configuration Form to the player.
     */
    private showTimerConfigForm(): void {
        if (this._game.timerManager.isTimerRunning) {
            this._feedback.error('Cannot change timer settings while timer is running.', { sound: 'item.shield.block' });
            return;
        }

        new ModalForm(this._player, 'Timer Configuration')
            .textField(
                'number',
                'Time in Seconds:', 
                'Enter the time in seconds', 
                this._game.timerManager.getTimerDuration().toString(),
                (updatedValue) => {
                    const newDuration = updatedValue as number;
                    if (newDuration < 1) {
                        this._feedback.error('Time must be at least 1 second.', { sound: 'item.shield.block' });
                        return;
                    }
                    this._game.timerManager.setTimerDuration(newDuration);
                    this._feedback.success(
                        'Timer settings have been updated.', 
                        { sound: 'random.levelup' }
                    );
                    this._game.settings.timerDuration = newDuration;
                }
            )
            .submitButton('§2Update Timer§r')
            .show();
    }

    /**
     * Shows play sound form to the player.
     */
    private showPlaySoundForm(): void {
        new ModalForm(this._player, 'Play Sound')
            .dropdown('Sounds: ', SOUNDS.map(sound => sound.name), 0)
            .submitButton('§2Play§r')
            .show((response) => {
                const sound = SOUNDS[response[0] as number].sound;
                this._feedback.playSound(sound);
            });
    }

    /**
     * Shows the events form to the player.
     */
    private showEventsForm(): void {
        const form = new ModalForm(this._player, 'TikTok Events');

        eventHandler.getAllEvents().forEach(event => {
            form.toggle(`Receive ${event} event actions`, eventHandler.isEventEnabled(event), (enabled) => {
                if (enabled) {
                    eventHandler.enableEvent(event);
                } else {
                    eventHandler.disableEvent(event);
                }
            });
        });
        form.submitButton('§2Update§r');
        form.show();
    }
}