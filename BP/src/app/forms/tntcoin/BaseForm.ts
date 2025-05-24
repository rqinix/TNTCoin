import { Player } from "@minecraft/server";
import { TntCoin, TntCoinStructure } from "../../tntcoin/index";
import { TntCoinForm } from "../TntCoinForm";
import ServiceRegistry from "lib/System/ServiceRegistry";
import { Feedback } from "lib/ScreenDisplay/Feedback";
import ActionForm from "lib/Forms/ActionForm";

export abstract class BaseForm {
    protected player: Player;
    protected tntcoin: TntCoin;
    protected structure: TntCoinStructure;
    protected tntCoinGuiInstance: TntCoinForm;
    protected feedback: Feedback;
    protected parentForm: ActionForm;

    constructor(
        player: Player, 
        tntcoin: TntCoin, 
        structure: TntCoinStructure, 
        tntCoinGuiInstance: TntCoinForm,
        parentForm?: ActionForm
    ) {
        this.player = player;
        this.tntcoin = tntcoin;
        this.structure = structure;
        this.tntCoinGuiInstance = tntCoinGuiInstance;
        this.parentForm = parentForm;
        this.feedback = ServiceRegistry.getInstance().get("PlayerMessageService");
    }

    abstract show(): void;

    setParentForm(form: ActionForm): void {
        this.parentForm = form;
    }
}
