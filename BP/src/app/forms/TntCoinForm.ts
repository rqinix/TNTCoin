import { Player } from "@minecraft/server";
import { TntCoinFormManager } from "./TntCoinFormManager";
import { TntCoin, TntCoinStructure } from "../tntcoin/index";
import TntCoinPlayerRegistry from "../tntcoin/TntCoinPlayerRegistry";

export class TntCoinForm {
    public player: Player;
    public tntCoinStructure: TntCoinStructure;
    public tntcoin: TntCoin;
    public tntCoinFormManager: TntCoinFormManager;

    /**
     * Creates an instance of the TntCoinGUI class.
     * @param {Player} player The player this GUI belongs to
     * @param {TntCoin} tntcoin Optional existing TntCoin instance
     */
    constructor(player: Player, tntcoin?: TntCoin) {
        this.player = player;
        this.tntCoinStructure = tntcoin?.structure ?? new TntCoinStructure(player);
        this.tntcoin = tntcoin ?? new TntCoin(player, this.tntCoinStructure);
        this.tntCoinFormManager = new TntCoinFormManager(player, this.tntcoin, this.tntCoinStructure, this);
    }

    /**
     * Registers the player in TNT Coin
     */
    public registerPlayer(): void {
        if (!this.tntcoin.isPlayerInSession) {
            const tntCoinRegistry = TntCoinPlayerRegistry.getInstance();
            tntCoinRegistry.register(this.player, this);
            this.tntcoin.isPlayerInSession = true;
        }
    }

    /**
    * Shows the appropriate form to the player.
    * If the player already has a TNT Coin session it shows the TntCoinMenuForm.
    * Otherwise, it shows the TntCoinStructureConfigForm.
    */
    public showForm(): void {
        const tntCoinRegistry = TntCoinPlayerRegistry.getInstance();
        if (tntCoinRegistry.has(this.player) && this.tntcoin.isPlayerInSession) {
            this.tntCoinFormManager.showTntCoinMenuForm();
        } else {
            this.tntCoinFormManager.showTntCoinStructureConfigForm();
        }
    }
}