import {Context, Scenes} from 'telegraf';

export interface MyWizardSession extends Scenes.WizardSessionData {
  registrationRequired?: boolean;
}

export interface MyContext extends Context {
  scene: Scenes.SceneContextScene<MyContext, MyWizardSession>;
  wizard: Scenes.WizardContextWizard<MyContext>;
}
