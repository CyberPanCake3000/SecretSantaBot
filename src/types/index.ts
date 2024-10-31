import {Context, Scenes} from 'telegraf';

interface GroupWizardData {
  name?: string;
  minPrice?: number;
  maxPrice?: number;
  eventDate?: Date;
  eventInfo?: string;
}
export interface SantaWizardSession extends Scenes.WizardSessionData {
  registrationRequired?: boolean;
  groupData: GroupWizardData;
  userGroups: string[];
  groupToDelete: string;
}

export interface SantaContext extends Context {
  scene: Scenes.SceneContextScene<SantaContext, SantaWizardSession>;
  wizard: Scenes.WizardContextWizard<SantaContext>;
}
