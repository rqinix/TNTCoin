import ActionForm from "lib/Forms/ActionForm";
import ServiceRegistry from "lib/System/ServiceRegistry";
import TikTokEventActionForm from "../TikTokEventActionForm";
import { BaseForm } from "./BaseForm";

export class EventActionsForm extends BaseForm {
    
    public setParentForm(parentForm: ActionForm): void {
        this.parentForm = parentForm;
    }

    show(): void {
        const registry = ServiceRegistry.getInstance();
        const formFactory = registry.get<TikTokEventActionForm>("TikTokEventActionFormService");
        const eventActionsForm = new ActionForm(this.player, 'Event Actions')
            .body("Create actions for TikTok events. The actions you create will be executed when the event is triggered.\n")

        const giftActionForm = formFactory.createGiftActionForm(this.player);
        const followActionForm = formFactory.createFollowActionForm(this.player);
        const shareActionForm = formFactory.createShareActionForm(this.player);
        const memberActionForm = formFactory.createMemberActionForm(this.player);
        const likeActionForm = formFactory.createLikeActionForm(this.player);
        const chatActionForm = formFactory.createChatActionForm(this.player);

        giftActionForm.setParentForm(eventActionsForm);
        followActionForm.setParentForm(eventActionsForm);
        shareActionForm.setParentForm(eventActionsForm);
        memberActionForm.setParentForm(eventActionsForm);
        likeActionForm.setParentForm(eventActionsForm);
        chatActionForm.setParentForm(eventActionsForm);

        eventActionsForm
            .button('Gift Actions', giftActionForm.show.bind(giftActionForm), 'textures/tnt-coin/gui/buttons/gift.png')
            .button('Like Actions', likeActionForm.show.bind(likeActionForm), 'textures/tnt-coin/gui/buttons/heart.png')
            .button('Member Actions', memberActionForm.show.bind(memberActionForm), 'textures/tnt-coin/gui/buttons/member.png')
            .button('Follow Actions', followActionForm.show.bind(followActionForm), 'textures/tnt-coin/gui/buttons/follow.png')
            .button('Chat Actions', chatActionForm.show.bind(chatActionForm), 'textures/tnt-coin/gui/buttons/chat.png')
            .button('Share Actions', shareActionForm.show.bind(shareActionForm), 'textures/tnt-coin/gui/buttons/share.png')
            .setParent(this.parentForm)
            .show();
    }
}
