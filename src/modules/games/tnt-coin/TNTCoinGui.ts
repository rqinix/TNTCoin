import { BlockPermutation, DimensionLocation, Player } from "@minecraft/server";
import { TNTCoin } from "./TNTCoin";
import { floorVector3 } from "../../../utilities/math/floorVector";
import { getStructureCenter } from "../../../utilities/structure/getStructureCenter";
import { ActionForm, ModalForm } from "../../../lib/Form";
import { SOUNDS } from "../../../config";
import { event as eventHandler } from "./eventHandlers/index";
import { PlayerFeedback } from "../../../lib/PlayerFeedback";
import { TNTCoinStructure } from "./TNTCoinStructure";

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
        this._game = new TNTCoin(this._player);
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
     * Start the game
     */
    private async startGame(): Promise<void> {
        try {
            await this._structure.generateProtectedStructure();
            if (this._game.gameSettings.useBarriers) await this._structure.generateBarriers();
            this.saveGame();
            this._game.teleportPlayer();
            this._game.startFillListener();
            this._player.setSpawnPoint({...this._structure.structureCenter, dimension: this._player.dimension});
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
            await this._game.cleanGameSession();
            this._player.setDynamicProperty(this._structure.structureKey, null);
            this._player.setDynamicProperty(this._game.key, null);
            this._game.isPlayerInGame = false;
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
            this._game.saveGameState();
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
            this._game.loadGameState();
            await this.startGame();
        } catch (error) {
            console.error(`Error loading game: ${error}`);
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
            await this.startGame();
        });
    }
    
    /**
    * Shows the in-game form to the player.
    */
    private showInGameForm(): void {
        new ActionForm(this._player, '§1§kii§r§c§lTNT§eCOIN§r§5§kii§r')

        .body(
            `[§bWINS§f]: ${this._game.wins < 0 ? '§c' : '§a' }${this._game.wins}§f/§a${this._game.winMax}§f\n` +
            `[§bBLOCKS TO FILL§f]: §a${this._structure.airBlockLocations.length}§f\n`
        )

        .button('Summon TNT', this._game.summonTNT.bind(this._game), 'textures/tnt-coin-gui/tnt.png')
        .button('Summon Lightning Bolt', this._game.summonLightningBolt.bind(this._game), 'textures/tnt-coin-gui/lightning_bolt.png')
        .button('Summon Entity', this.showSummonEntityForm.bind(this), 'textures/tnt-coin-gui/npc.png')
        .button('Fill Blocks', this._structure.fill.bind(this._structure), 'textures/tnt-coin-gui/brush.png')
        .button('Stop Filling', this._structure.fillStop.bind(this._structure), 'textures/tnt-coin-gui/stop_fill.png')
        .button('Clear Blocks', this._structure.clearFilledBlocks.bind(this._structure), 'textures/tnt-coin-gui/trash.png')
        .button('Teleport', this._game.teleportPlayer.bind(this._game), 'textures/tnt-coin-gui/ender_pearl.png')
        .button('Timer', this.showTimerForm.bind(this), 'textures/tnt-coin-gui/clock.png')
        .button('Play Sound', this.showPlaySoundForm.bind(this), 'textures/tnt-coin-gui/record_cat.png')
        .button('Settings', this.showInGameSettingsForm.bind(this), 'textures/tnt-coin-gui/settings.png')
        .button('§2§kii§r§8Events§2§kii§r', this.showEventForm.bind(this), 'textures/tnt-coin-gui/bell.png')
        .button('Quit', this.quitGame.bind(this), 'textures/tnt-coin-gui/left.png')

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

        const oldSettings = { ...this._game.gameSettings };
        const newSettings = { ...this._game.gameSettings };

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

        .show(() => {
            const isSettingsChanged = JSON.stringify(oldSettings) !== JSON.stringify(newSettings);
            if (isSettingsChanged) {
                this._game.gameSettings = newSettings;
                this.saveGame();
                this._feedback.success('Game settings have been updated.', { sound: 'random.levelup' });
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
                x: this._structure.structureCenter.x, 
                y: this._structure.structureCenter.y + 1, 
                z: this._structure.structureCenter.z 
            };

            if (amount < 1) amount = 1; 

            switch (location) {
                case 0:
                    this._game.summonEntity(
                        entityName, 
                        () => this._structure.randomLocation(2), 
                        amount
                    );
                    break;
                case 1:
                    this._game.summonEntity(
                        entityName, 
                        () => this._structure.randomLocation(2, false), 
                        amount
                    );
                    break;
                case 2:
                    this._game.summonEntity(entityName, center, amount);
                    break;
            }
        });
    }

    private showTimerForm(): void {
        new ActionForm(this._player, 'Timer')
        
            .button('Start Timer', this._game.timerStart.bind(this._game))
            .button('Stop Timer', this._game.timerStop.bind(this._game))
            .button('Edit Timer', this.showTimerConfigForm.bind(this))
        
            .show();
    }

    private showTimerConfigForm(): void {
        new ModalForm(this._player, 'Timer Configuration')

            .textField(
                'number',
                'Time in Seconds:', 
                'Enter the time in seconds', 
                this._game.timerDuration.toString(),
                (updatedValue) => {
                    const newDuration = updatedValue as number;
                    if (newDuration < 1) {
                        this._feedback.error('Time must be at least 1 second.', { sound: 'item.shield.block' });
                        return;
                    }
                    this._game.timerDuration = newDuration;
                }
            )

            .show(() => {
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

    private showEventForm(): void {
        const form = new ModalForm(this._player, 'TikTok Events')

        eventHandler.getAllEvents().forEach(event => {
            form.toggle(`Enable ${event} event`, eventHandler.isEventEnabled(event), (enabled) => {
                if (enabled) {
                    eventHandler.enableEvent(event);
                } else {
                    eventHandler.disableEvent(event);
                }
            });
        });

        form.show();
    }
}