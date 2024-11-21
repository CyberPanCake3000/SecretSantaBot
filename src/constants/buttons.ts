import {Markup} from 'telegraf';

export const BUTTONS = {
  ADD_SECRET_SANTA_TO_CHAT: (botUsername: string) =>
    Markup.button.url(
      '👥 Добавить Тайного Санту в чат',
      `https://t.me/${botUsername}?startgroup=true`
    ),
  SET_WISHES: Markup.button.callback(
    '🎁 Оставить свои пожелания Тайному Санте',
    'setwishes'
  ),
  GROUP_INFO: Markup.button.callback(
    '👥 Узнать информацию о группе',
    'groupinfo'
  ),
  GO_TO_REGISTRATION: (botUsername: string, chatId: number) =>
    Markup.button.url(
      'Зарегистрироваться',
      `https://t.me/${botUsername}?start=${chatId}`
    ),
  MY_WARD: Markup.button.callback('❔ Узнать кому я дарю подарок', 'myward'),
  QUIT: Markup.button.callback('Отказаться от участия', 'quit'),
};

export const INLINE_KEYBOARDS = {
  WELCOME_PRIVATE_MENU: (botUsername: string) =>
    Markup.inlineKeyboard([
      [BUTTONS.ADD_SECRET_SANTA_TO_CHAT(botUsername)],
      [BUTTONS.SET_WISHES],
      [BUTTONS.MY_WARD],
      [BUTTONS.GROUP_INFO],
    ]),
  WELCOME_GROUP_MENU: (botUsername: string, chatId: number) =>
    Markup.inlineKeyboard([
      [BUTTONS.GO_TO_REGISTRATION(botUsername, chatId)],
      [BUTTONS.GROUP_INFO],
    ]),
};
