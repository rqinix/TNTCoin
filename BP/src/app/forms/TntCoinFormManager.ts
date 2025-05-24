import { Player } from "@minecraft/server";
import { TntCoin, TntCoinStructure } from "../tntcoin/index";
import { TntCoinForm } from "./TntCoinForm";
import { TntCoinStructureConfigForm, TntCoinMenuForm, } from "./tntcoin/index";

export class TntCoinFormManager {
    private player: Player;
    private tntcoin: TntCoin;
    private tntCoinForm: TntCoinForm;
    private tntCoinStructure: TntCoinStructure;
    private structureConfigForm: TntCoinStructureConfigForm;
    private tntCoinMenuForm: TntCoinMenuForm;

    constructor(
        player: Player, 
        tntcoin: TntCoin, 
        tntCoinStructure: TntCoinStructure, 
        tntCoinForm: TntCoinForm
    ) {
        this.player = player;
        this.tntcoin = tntcoin;
        this.tntCoinStructure = tntCoinStructure;
        this.tntCoinForm = tntCoinForm;
        this.structureConfigForm = new TntCoinStructureConfigForm(player, tntcoin, tntCoinStructure, tntCoinForm);
        this.tntCoinMenuForm = new TntCoinMenuForm(player, tntcoin, tntCoinStructure, tntCoinForm);
    }

    showTntCoinStructureConfigForm(): void {
        this.structureConfigForm.show();
    }

    showTntCoinMenuForm(): void {
        this.tntCoinMenuForm.show();
    }
}
