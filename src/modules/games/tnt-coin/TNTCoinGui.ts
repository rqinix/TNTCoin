import { BlockPermutation, Player } from "@minecraft/server";
import { TNTCoin } from "./TNTCoin";
import { floorVector3 } from "../../../utilities/math/floorVector";
import { getStructureCenter } from "../../../utilities/structure/getStructureCenter";
import { ActionForm, ModalForm } from "../../../lib/Form";
import { SOUNDS } from "../../../config";

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
        try {
            await this.generateProtectedStructure();
            if (this.gameSettings.useBarriers) await this.generateBarriers();
            this.saveGame();
            this.teleportPlayer();
            this.startFillListener();
            this._feedback.playSound('random.anvil_use');
            this._feedback.playSound('random.levelup');
        } catch (error) {
            this._feedback.error(`Failed to start game. ${error.message}`, { sound: 'item.shield.block' });
            this.quitGame();
            throw error;
        }
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
    public async loadGame(): Promise<void> { 
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
    
        .textField("string", "Base Block Type:", "Enter the block type for the base", "minecraft:quartz_block")
        .textField("string", "Side Block Type:", "Enter the block type for the sides", "minecraft:glass")
        .textField("number", "Width:", "Enter the width", "12")
        .textField("number", "Height:", "Enter the height", "12")
    
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
            this.structureProperties = JSON.stringify(newStructureProperties);
            await this.startGame();
        });
    }
    
    /**
    * Shows the in-game form to the player.
    */
    private showInGameForm(): void {
        new ActionForm(this._player, '§1§kii§r§c§lTNT §6COIN§r§5§kii§r')

        .body(
            `[§bWINS§f]: ${this.wins < 0 ? '§c' : '§a' }${this.wins}§f/§a${this.winMax}§f\n` +
            `[§bBLOCKS TO FILL§f]: §a${this.airBlockLocations.length}§f\n`
        )

        .button('Summon TNT', this.summonTNT.bind(this), 'textures/tnt-coin-gui/tnt.png')
        .button('Summon Lightning Bolt', this.summonLightningBolt.bind(this), 'textures/tnt-coin-gui/lightning_bolt.png')
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

        const oldSettings = { ...this.gameSettings };
        const newSettings = { ...this.gameSettings };

        new ModalForm(this._player, 'Game Settings')
        .toggle(
            'Use Barriers',
            oldSettings.useBarriers, 
            (updatedValue) => newSettings.useBarriers = updatedValue as boolean
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
            oldSettings.winMax.toString(),
            (updatedValue) => newSettings.winMax = updatedValue as number
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
            oldSettings.fillBlockName,
            (updatedValue) => {
                try {
                    if (BlockPermutation.resolve(updatedValue as string)) {
                        newSettings.fillBlockName = updatedValue as string
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
            oldSettings.fillTickInteval.toString(),
            (updatedValue) => newSettings.fillTickInteval = updatedValue as number
        )
        .textField(
            "number",
            "[§eFILL§r] Amount of Blocks per tick:", 
            'Enter the amount of blocks to fill per tick', 
            oldSettings.fillBlocksPerTick.toString(),
            (updatedValue) => newSettings.fillBlocksPerTick = updatedValue as number
        )

        .show(() => {
            const isSettingsChanged = JSON.stringify(oldSettings) !== JSON.stringify(newSettings);
            if (isSettingsChanged) {
                this.gameSettings = newSettings;
                this.saveGame();
                this._feedback.playSound('random.levelup');
                console.warn('Game settings have been updated.');
            }
        });
    }
    
    private async showSummonEntityForm(): Promise<void> {
        new ModalForm(this._player, 'Summon Entity')

        .dropdown('Location', [
            'Random',
            'Random (On Top)',
            'Center',
        ], 0)
        .textField(
            "string",
            "Entity Name:", 
            "Enter the entity name", 
            "tnt_minecart",
        )
        .textField(
            "number",
            "Amount:", 
            "Enter the amount of entities to summon", 
            "1"
        )

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

            .textField(
                'number',
                'Time in Seconds:', 
                'Enter the time in seconds', 
                this.timerDuration.toString()
            )

            .show((response) => {
                this.timerDuration = parseInt(response[0].toString());
                this._feedback.success(
                    'Timer settings have been updated.', 
                    { sound: 'random.levelup' }
                );
            });
    }

    private showPlaySoundForm(): void {
        new ModalForm(this._player, 'Play Sound')
            .dropdown('Sounds: ', SOUNDS.map(sound => sound.name), 0)
            .show((response) => {
                const sound = SOUNDS[response[0] as number].sound;
                this._feedback.playSound(sound);
            });
    }
}