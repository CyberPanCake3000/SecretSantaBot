import {SantaContext} from '../types';
import {User, IUser} from '../db/models/user';

export class UserService {
  static async createUser(ctx: SantaContext): Promise<IUser> {
    const user = new User({
      telegramId: ctx.from?.id,
      telegramUsername: ctx.from?.username,
      telegramFirstName: ctx.from?.first_name,
      telegramLastName: ctx.from?.last_name,
    });
    return await user.save();
  }

  static async findUser(telegramId: number): Promise<IUser | null> {
    return await User.findOne({telegramId});
  }
}
