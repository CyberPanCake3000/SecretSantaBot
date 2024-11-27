import {Context, Scenes} from 'telegraf';
import {IGroup} from '../db/models/group';

export interface GroupWizardData {
  minPrice?: number;
  maxPrice?: number;
  eventDate?: Date;
  eventInfo?: string;
}
export interface SantaWizardSession extends Scenes.WizardSessionData {
  groupData: GroupWizardData;
  userGroups: string[];
  selectedGroupId: string;
  currentGroup: IGroup;
}

export interface SantaContext extends Context {
  scene: Scenes.SceneContextScene<SantaContext, SantaWizardSession>;
  wizard: Scenes.WizardContextWizard<SantaContext>;
}
