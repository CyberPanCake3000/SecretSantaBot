import {Group, IGroup} from '../db/models/group';
import {SantaContext} from '../types';

export class GroupService {
  static async findGroup(telegramGroupId: number): Promise<IGroup | null> {
    return await Group.findOne({telegramGroupId});
  }

  static async createOrGetGroup(ctx: SantaContext): Promise<IGroup> {
    const existingGroup = await this.findGroup(ctx.chat?.id || 0);

    if (existingGroup) return existingGroup;

    const group = new Group({
      telegramGroupName: ctx.getChat.name || '',
      telegramGroupId: ctx.chat?.id,
      adminTelegramId: ctx.from?.id,
      adminUsername: ctx.from?.username,
      eventDate: new Date(),
      minPrice: 0,
      maxPrice: 0,
    });

    const savedGroup = await group.save();
    ctx.scene.session.currentGroup = savedGroup;
    return savedGroup;
  }
}
