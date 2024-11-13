import {Context, Scenes} from 'telegraf';

interface GroupWizardData {
  minPrice?: number;
  maxPrice?: number;
  eventDate?: Date;
  eventInfo?: string;
}
export interface SantaWizardSession extends Scenes.WizardSessionData {
  registrationRequired?: boolean;
  groupData: GroupWizardData;
  userGroups: string[];
  selectedGroupId: string;
}

export interface SantaContext extends Context {
  scene: Scenes.SceneContextScene<SantaContext, SantaWizardSession>;
  wizard: Scenes.WizardContextWizard<SantaContext>;
}
