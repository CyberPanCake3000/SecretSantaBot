import {Group, IGroup} from '../db/models/group';
import {SantaContext} from '../types';

export class GroupService {
  static async findGroup(telegramGroupId: number): Promise<IGroup | null> {
    return await Group.findOne({telegramGroupId});
  }

  static async createOrGetGroup(ctx: SantaContext): Promise<IGroup> {
    if (!ctx.chat?.id) {
      throw new Error('No chatId found');
    }
    const existingGroup = await this.findGroup(ctx.chat?.id);

    if (existingGroup) return existingGroup;

    const chatInfo = await ctx.telegram.getChat(ctx.chat?.id);
    const group = new Group({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      telegramGroupName: (chatInfo as any).title || '',
      telegramGroupId: ctx.chat?.id,
      adminTelegramId: ctx.from?.id,
      adminUsername: ctx.from?.username,
      eventDate: new Date(),
      minPrice: 0,
      maxPrice: 0,
    });

    const savedGroup = await group.save();
    return savedGroup;
  }
}
