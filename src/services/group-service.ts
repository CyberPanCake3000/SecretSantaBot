import {Group, IGroup} from '../db/models/group';
import {SantaContext} from '../types';

export class GroupService {
  static async findGroup(telegramGroupId: number): Promise<IGroup | null> {
    return await Group.findOne({telegramGroupId});
  }

  static async createNewGroup(ctx: SantaContext) {
    const groupData = ctx.scene.session.groupData;

    if (!groupData) {
      return false;
    }

    const newGroup = await Group.create({
      eventDate: groupData.eventDate,
      eventInfo: groupData.eventInfo,
      adminTelegramId: ctx.from!.id,
      adminUsername: ctx.from?.username,
      minPrice: groupData.minPrice,
      maxPrice: groupData.maxPrice,
      isActive: true,
      isDraw: false,
      participants: [
        {
          userTelegramId: ctx.from!.id,
          username: ctx.from!.username || 'Unknown',
          participationStatus: 'confirmed',
          joinedAt: new Date(),
        },
      ],
      santaPairs: [],
    });

    return newGroup;
  }

  static async createOrGetGroup(ctx: SantaContext): Promise<IGroup> {
    if (!ctx.chat?.id) {
      throw new Error('No chat ID found');
    }

    if (!ctx.from?.id) {
      throw new Error('No admin ID found');
    }

    const existingGroup = await this.findGroup(ctx.chat.id);
    if (existingGroup) {
      return existingGroup;
    }

    const chatInfo = await ctx.getChat();
    if (chatInfo.type !== 'group' && chatInfo.type !== 'supergroup') {
      throw new Error('Invalid chat type. Must be group or supergroup');
    }

    const group = new Group({
      telegramGroupName: chatInfo.title || 'Unnamed Group',
      telegramGroupId: chatInfo.id,
      adminTelegramId: ctx.from.id,
      adminUsername: ctx.from.username || '',
      minPrice: 0,
      maxPrice: 0,
      isActive: true,
      isDraw: false,
    });

    return await group.save();
  }
}
