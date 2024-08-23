import { EventHandlerRegistry } from '../../core/EventHandlerRegistry';
import { onChat } from './onChat';
import { onFollow } from './onFollow';
import { onGift } from './onGift';
import { onJoin } from './onJoin';
import { onLike } from './onLike';
import { onShare } from './onShare';

export const event = new EventHandlerRegistry();

event.register('gift', onGift);
event.register('join', onJoin);
event.register('chat', onChat);
event.register('share', onShare);
event.register('follow', onFollow);
event.register('like', onLike);