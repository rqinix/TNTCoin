import { Player } from "@minecraft/server";
import { TntCoin, TntCoinStructure } from "app/tntcoin/index";
import { TntCoinForm } from "app/forms/TntCoinForm";
import TikTokEventActionFormFactory from "app/forms/TikTokEventActionForm";
import { Feedback } from "lib/ScreenDisplay/Feedback";
import ServiceRegistry from "lib/System/ServiceRegistry";
import { EventActionManager } from "lib/Events/EventActionManager";

export default class TntCoinBuilder {
    public static createTntCoin(player: Player): TntCoin {
        this.registerTntCoinServices(player);
        this.registerEventActionManagers(player);
        const structure = new TntCoinStructure(player);
        return new TntCoin(player, structure);
    }

    public static createTntCoinWithGui(player: Player): TntCoinForm {
        const tntcoin = this.createTntCoin(player);
        return new TntCoinForm(player, tntcoin);
    }

    public static registerTntCoinServices(player: Player): void {
        const registry = ServiceRegistry.getInstance();
        if (!registry.has("PlayerMessageService")) {
            registry.register("PlayerMessageService", new Feedback(player));
        }
        if (!registry.has("TikTokEventActionFormService")) {
            registry.register("TikTokEventActionFormService", new TikTokEventActionFormFactory());
        }
    }

    public static registerEventActionManagers(player: Player): void {
        const registry = ServiceRegistry.getInstance();
        const actionManagerKeys = {
            GIFT: "ACTIONS.GIFT",
            FOLLOW: "ACTIONS.FOLLOW",
            SHARE: "ACTIONS.SHARE",
            MEMBER: "ACTIONS.MEMBER",
            LIKE: "ACTIONS.LIKE",
            CHAT: "ACTIONS.CHAT",
        };
        if (!registry.has("GIFT_ACTION_MANAGER")) {
            registry.register("GIFT_ACTION_MANAGER", new EventActionManager<GiftAction>(player, actionManagerKeys.GIFT));
        }
        if (!registry.has("FOLLOW_ACTION_MANAGER")) {
            registry.register("FOLLOW_ACTION_MANAGER", new EventActionManager<FollowAction>(player, actionManagerKeys.FOLLOW));
        }
        if (!registry.has("SHARE_ACTION_MANAGER")) {
            registry.register("SHARE_ACTION_MANAGER", new EventActionManager<ShareAction>(player, actionManagerKeys.SHARE));
        }
        if (!registry.has("MEMBER_ACTION_MANAGER")) {
            registry.register("MEMBER_ACTION_MANAGER", new EventActionManager<MemberAction>(player, actionManagerKeys.MEMBER));
        }
        if (!registry.has("LIKE_ACTION_MANAGER")) {
            registry.register("LIKE_ACTION_MANAGER", new EventActionManager<LikeAction>(player, actionManagerKeys.LIKE));
        }
        if (!registry.has("CHAT_ACTION_MANAGER")) {
            registry.register("CHAT_ACTION_MANAGER", new EventActionManager<ChatAction>(player, actionManagerKeys.CHAT));
        }
    }
}