import { Player } from "@minecraft/server";
import ServiceRegistry from "lib/System/ServiceRegistry";
import { EventActionManager } from "lib/Events/EventActionManager";
import { EventActionFormBase } from "app/forms/actions/EventActionFormBase";
import { GiftActionForm } from "app/forms/actions/GiftAction";
import { FollowActionForm } from "app/forms/actions/FollowAction";
import { ShareActionForm } from "app/forms/actions/ShareAction";
import { MemberActionForm } from "app/forms/actions/MemberAction";
import { LikeActionForm } from "app/forms/actions/LikeAction";
import { ChatActionForm } from "app/forms/actions/ChatAction";

export interface TikTokEventActionFormInterface {
    createGiftActionForm(player: Player): EventActionFormBase<GiftAction>;
    createFollowActionForm(player: Player): EventActionFormBase<FollowAction>;
    createShareActionForm(player: Player): EventActionFormBase<ShareAction>;
    createMemberActionForm(player: Player): EventActionFormBase<MemberAction>;
    createLikeActionForm(player: Player): EventActionFormBase<LikeAction>;
    createChatActionForm(player: Player): EventActionFormBase<ChatAction>;
}

export default class TikTokEventActionForm implements TikTokEventActionFormInterface {
    createGiftActionForm(player: Player): EventActionFormBase<GiftAction> {
        const registry = ServiceRegistry.getInstance();
        const eventManager = registry.get<EventActionManager<GiftAction>>("GIFT_ACTION_MANAGER");
        if (!eventManager) {
            console.error("GiftActionManager not found in registry.");
            throw new Error("GiftActionManager not registered.");
        }
        return new GiftActionForm(player, eventManager);
    }

    createFollowActionForm(player: Player): EventActionFormBase<FollowAction> {
        const registry = ServiceRegistry.getInstance();
        const eventManager = registry.get<EventActionManager<FollowAction>>("FOLLOW_ACTION_MANAGER");
        if (!eventManager) {
            console.error("FollowActionManager not found in registry.");
            throw new Error("FollowActionManager not registered.");
        }
        return new FollowActionForm(player, eventManager);
    }

    createShareActionForm(player: Player): EventActionFormBase<ShareAction> {
        const registry = ServiceRegistry.getInstance();
        const eventManager = registry.get<EventActionManager<ShareAction>>("SHARE_ACTION_MANAGER");
        if (!eventManager) {
            console.error("ShareActionManager not found in registry.");
            throw new Error("ShareActionManager not registered.");
        }
        return new ShareActionForm(player, eventManager);
    }

    createMemberActionForm(player: Player): EventActionFormBase<MemberAction> {
        const registry = ServiceRegistry.getInstance();
        const eventManager = registry.get<EventActionManager<MemberAction>>("MEMBER_ACTION_MANAGER");
        if (!eventManager) {
            console.error("MemberActionManager not found in registry.");
            throw new Error("MemberActionManager not registered.");
        }
        return new MemberActionForm(player, eventManager);
    }

    createLikeActionForm(player: Player): EventActionFormBase<LikeAction> {
        const registry = ServiceRegistry.getInstance();
        const eventManager = registry.get<EventActionManager<LikeAction>>("LIKE_ACTION_MANAGER");
        if (!eventManager) {
            console.error("LikeActionManager not found in registry.");
            throw new Error("LikeActionManager not registered.");
        }
        return new LikeActionForm(player, eventManager);
    }

    createChatActionForm(player: Player): EventActionFormBase<ChatAction> {
        const registry = ServiceRegistry.getInstance();
        const eventManager = registry.get<EventActionManager<ChatAction>>("CHAT_ACTION_MANAGER");
        if (!eventManager) {
            console.error("ChatActionManager not found in registry.");
            throw new Error("ChatActionManager not registered.");
        }
        return new ChatActionForm(player, eventManager);
    }
}