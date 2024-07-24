import { Player } from "@minecraft/server";
import { TNTCoin } from "./TNTCoin";
import { floorVector3 } from "../../../utilities/math/floorVector";
import { getStructureCenter } from "../../../utilities/structure/getStructureCenter";
import { ActionForm, ModalForm } from "../../../lib/Form";

/**
 * A map of player names in-game with a TNTCoinGUI instance.
 */
export const INGAME_PLAYERS = new Map<string, TNTCoinGUI>();

/**
 * Represents a TNTCoin game instance with a GUI.
 * @extends TNTCoin
 */
export class TNTCoinGUI extends TNTCoin {
    
    /**
     * Creates an instance of the TNTCoinGameGUI class.
     * @param {Player} player 
     */
    constructor(player: Player) {
        super(player);
    }

    /**
     * Setup the game
     */
    private setupGame(): void {
        if (!this.isPlayerInGame) {
            INGAME_PLAYERS.set(this._player.name, this);
            this.isPlayerInGame = true;
        }
    }

    /**
     * Start the game
     */
    private async startGame(): Promise<void> {
        await this.generateProtectedStructure();
        this.startFillListener();
        this.teleportPlayer();
        this._feedback.playSound('random.anvil_use');
        this._feedback.playSound('random.levelup');
        this.saveGame();
    }
    
    /**
    * Quit the game
    * @returns {Promise<void>} a promise that resolves when the game has been successfully quit.
    */
    public async quitGame(): Promise<void> {
        try {
            await this.cleanGameSession();
            this._player.setDynamicProperty(this._structureKey, null);
            this._player.setDynamicProperty(this._gameKey, null);
            this._feedback.playSound('mob.wither.break_block');
            this.isPlayerInGame = false;
            INGAME_PLAYERS.delete(this._player.name);
        } catch (error) {
            console.error(`Error quitting game: ${error}`);
        }
    }

    /**
     * Save the game
     */
    public saveGame(): void {
        try {
            this.saveGameState();
        } catch (error) {
            console.error(`Error saving game: ${error}`);
        }
    }

    /**
     * Load the game
     * @returns {Promise<void>} a promise that resolves when the game has been successfully loaded.
     */
    public async  loadGame(): Promise<void> { 
        try {
            this.loadGameState();
            await this.startGame();
        } catch (error) {
            console.error(`Error loading game: ${error}`);
        }
    }
    
    /**
    * Shows the GUI to the player.
    */
    public showGui(): void {
        if (INGAME_PLAYERS.has(this._player.name) && this.isPlayerInGame) {
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

        .textField("Base Block Type:", "Enter the block type for the base", "minecraft:quartz_block")
        .textField("Side Block Type:", "Enter the block type for the sides", "minecraft:glass")
        .textField("Width:", "Enter the width", "12")
        .textField("Height:", "Enter the height", "12")

        .show(async (response) => {
            const baseBlockName = response[0].toString().trim();
            const sideBlockName = response[1].toString().trim();
            const width = parseInt(response[2].toString().trim());
            const height = parseInt(response[3].toString().trim());
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
            if (width >= 5 && height >= 5) {
                this.setupGame();
                this.structureProperties = JSON.stringify(newStructureProperties);
                try {
                    await this.startGame();
                } catch (error) {
                    this._feedback.error("Failed to generate structure.", { sound: 'item.shield.block' });
                }
            } else {
                this._feedback.error("The width and height must be at least 5.", { sound: 'item.shield.block' });
            }
        });
    }
    
    /**
    * Shows the in-game form to the player.
    */
    private showInGameForm(): void {
        new ActionForm(this._player, '§b§kii§r§c§lTNT §eCOIN§d§kii')

        .body(`[§bWINS§f]: ${this.wins < 0 ? '§c' : '§a' }${this.wins}§f/§a${this.winMax}§f`)

        .button('Summon TNT', this.summonTNT.bind(this), 'textures/tnt-coin-gui/tnt.png')
        .button('Summon Entity', this.showSummonEntityForm.bind(this), 'textures/tnt-coin-gui/npc.png')
        .button('Fill Blocks', this.fill.bind(this), 'textures/tnt-coin-gui/brush.png')
        .button('Stop Filling', this.fillStop.bind(this), 'textures/tnt-coin-gui/stop_fill.png')
        .button('Clear Blocks', this.clearFilledBlocks.bind(this), 'textures/tnt-coin-gui/trash.png')
        .button('Teleport', this.teleportPlayer.bind(this), 'textures/tnt-coin-gui/ender_pearl.png')
        .button('Timer', this.showTimerForm.bind(this), 'textures/tnt-coin-gui/clock.png')
        .button('Play Sound', this.showPlaySoundForm.bind(this), 'textures/tnt-coin-gui/record_cat.png')
        .button('Settings', this.showInGameSettingsForm.bind(this), 'textures/tnt-coin-gui/settings.png')
        .button('Quit', this.quitGame.bind(this), 'textures/tnt-coin-gui/left.png')

        .show();
    }
    
    /**
    * Shows the in-game settings form to the player and update the game settings.
    */
    private showInGameSettingsForm(): void {
        if (this._countdown.isCountingDown) {
            this._feedback.error('Cannot change settings while countdown is active.', { sound: 'item.shield.block' });
            return;
        }

        const settings = { ...this.gameSettings };
        new ModalForm(this._player, 'Game Settings')
        
        .textField(
            "[§eWIN§r] Set Wins",
            "Enter the amount of wins:",
            this.wins.toString(),
            (value) => {
                this.wins = parseInt(value);
            }
        )
        .textField(
            "[§eWIN§r] Max Win",
            "Enter the max win:",
            settings.winMax.toString(),
            (value) => {
                if (parseInt(value) < 1) {
                    settings.winMax = 1;
                    return;
                }
                settings.winMax = parseInt(value);
            }
        )
        .textField(
            '[§eCOUNTDOWN§r] Starting count value:', 
            'Enter the starting count for the countdown', 
            settings.defaultCountdownTime.toString(), 
            (value) => {
                if (parseInt(value) < 1) {
                    settings.defaultCountdownTime = 1;
                    return;
                }
                settings.defaultCountdownTime = parseInt(value);
            }
        )
        .textField(
            '[§eCOUNTDOWN§r] Delay in Ticks:', 
            'Enter the countdown delay in ticks', 
            settings.countdownTickInterval.toString(), 
            (value) => {
                if (parseInt(value) < 0) {
                    settings.countdownTickInterval = 0;
                    return;
                }
                settings.countdownTickInterval = parseInt(value);
            }
        )
        .textField(
            '[§eFILL§r] Block Name:', 
            'Enter the block name to fill', 
            settings.fillBlockName, 
            (value) => {
                settings.fillBlockName = value;
            }
        )
        .textField(
            '[§eFILL§r] Delay in Ticks:', 
            'Enter the delay in ticks to fill blocks', 
            settings.fillTickInteval.toString(), 
            (value) => {
                if (parseInt(value) < 0) {
                    settings.fillTickInteval = 0;
                    return;
                }
                settings.fillTickInteval = parseInt(value);
            }
        )
        .textField(
            '[§eFILL§r] Amount of Blocks per tick:', 
            'Enter the amount of blocks to fill per tick', 
            settings.fillBlocksPerTick.toString(), 
            (value) => {
                if (parseInt(value) < 1) {
                    settings.fillBlocksPerTick = 1;
                    return;
                }
                settings.fillBlocksPerTick = parseInt(value);
            }
        )
        .toggle(
            '[§eCamera§r] Rotate Camera', 
            settings.doesCameraRotate, 
            (value) => {
                settings.doesCameraRotate = value;
            }
        )

        .show(() => {
            this.gameSettings = settings;
            this.saveGame();
            this._feedback.success('Settings have been updated.', { sound: 'random.levelup' });
        });
    }
    
    private async showSummonEntityForm(): Promise<void> {
        let defaultEntityName = 'tnt_minecart';
        let defaultSelection = 0;
        new ModalForm(this._player, 'Summon Entity')

        .dropdown('Location', [
            'Random',
            'Random (On Top)',
            'Center',
        ], 0)
        .textField("Entity Name:", "Enter the entity name", "tnt_minecart")
        .textField("Amount:", "Enter the amount of entities to summon", "1")

        .show((response) => {
            const location = response[0] as number;
            const entityName = response[1] as string;
            let amount = response[2] as number;
            const center = { 
                x: this.structureCenter.x, 
                y: this.structureCenter.y + 1, 
                z: this.structureCenter.z 
            };

            if (amount < 1) {
                amount = 1;
            }

            switch (location) {
                case 0:
                    this.summonEntity(
                        entityName, 
                        () => this.randomLocation(2), 
                        amount
                    );
                    break;
                case 1:
                    this.summonEntity(
                        entityName, 
                        () => this.randomLocation(2, false), 
                        amount
                    );
                    break;
                case 2:
                    this.summonEntity(entityName, center, amount);
                    break;
            }
        });
    }

    private showTimerForm(): void {
        new ActionForm(this._player, 'Timer')
        
            .button('Start Timer', this.timerStart.bind(this))
            .button('Stop Timer', this.timerStop.bind(this))
            .button('Edit Timer', this.showTimerConfigForm.bind(this))
        
            .show();
    }

    private showTimerConfigForm(): void {
        new ModalForm(this._player, 'Timer Configuration')
        
            .textField('Time in Seconds:', 'Enter the time in seconds', this.timerDuration.toString())

            .show((response) => {
                this.timerDuration = parseInt(response[0].toString());
                this._feedback.success('Timer settings have been updated.', { sound: 'random.levelup' });
            });
    }

    private showPlaySoundForm(): void {
        const sounds = [
            {
                name: 'Anvil',
                sound: 'random.anvil_use'
            },
            {
                name: 'Totem',
                sound: 'random.totem'
            }
        ]

        new ModalForm(this._player, 'Play Sound')
            .dropdown('Sounds: ', sounds.map(sound => sound.name), 0)

            .show((response) => {
                const sound = sounds[response[0] as number].sound;
                this._feedback.playSound(sound);
            });
    }
}