import {Context, Scenes} from 'telegraf';

interface GroupWizardData {
  name?: string;
  minPrice?: number;
  maxPrice?: number;
  eventDate?: Date;
  eventInfo?: string;
}
export interface MyWizardSession extends Scenes.WizardSessionData {
  registrationRequired?: boolean;
  groupData: GroupWizardData;
}

export interface MyContext extends Context {
  scene: Scenes.SceneContextScene<MyContext, MyWizardSession>;
  wizard: Scenes.WizardContextWizard<MyContext>;
}
