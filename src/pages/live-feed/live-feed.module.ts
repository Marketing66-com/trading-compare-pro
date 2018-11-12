import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LiveFeedPage } from './live-feed';
import { PipesModule } from '../../pipes/pipes.module';
import { ComponentsModule } from '../../components/components.module';
import { DirectivesModule } from '../../directives/directives.module';

@NgModule({
  declarations: [
    LiveFeedPage,
  ],
  imports: [
    IonicPageModule.forChild(LiveFeedPage),
    PipesModule,
    ComponentsModule,
    DirectivesModule
    ],
    
})
export class LiveFeedPageModule {}
