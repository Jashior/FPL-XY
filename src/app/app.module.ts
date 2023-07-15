import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { RouterModule, Routes } from '@angular/router';
import { VisualComponent } from './visual/visual.component';
import { HttpClientModule } from '@angular/common/http';
import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { en_US } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgxEchartsModule } from 'ngx-echarts';

import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

import { PriceSliderComponent } from './shared/price-slider/price-slider.component';
import { TsbSliderComponent } from './shared/tsb-slider/tsb-slider.component';
import { GameweekSliderComponent } from './shared/gameweek-slider/gameweek-slider.component';
import { MinMinutesComponent } from './shared/min-minutes/min-minutes.component';
import { PositionSelectComponent } from './shared/position-select/position-select.component';
import { TeamSelectComponent } from './shared/team-select/team-select.component';
import { YearSelectComponent } from './shared/year-select/year-select.component';
import { GraphComponent } from './graph/graph.component';
import { PlayerSearchComponent } from './shared/player-search/player-search.component';
import { PlayerExcludeComponent } from './shared/player-exclude/player-exclude.component';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { ResetButtonComponent } from './shared/reset-button/reset-button.component';

registerLocaleData(en);

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: '', redirectTo: 'home', pathMatch: 'prefix' },
  { path: 'visual', component: VisualComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    VisualComponent,
    PriceSliderComponent,
    TsbSliderComponent,
    GameweekSliderComponent,
    MinMinutesComponent,
    PositionSelectComponent,
    TeamSelectComponent,
    YearSelectComponent,
    GraphComponent,
    PlayerSearchComponent,
    PlayerExcludeComponent,
    ResetButtonComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule.forRoot(routes),
    HttpClientModule,
    NzStatisticModule,
    NzGridModule,
    FormsModule,
    BrowserAnimationsModule,
    NzSliderModule,
    NzInputNumberModule,
    NzSelectModule,
    NzSkeletonModule,
    NzSwitchModule,
    NzSpinModule,
    NzButtonModule,
    NzDividerModule,
    NzIconModule,
    NzTableModule,
    NzCheckboxModule,
    NzRadioModule,
    NzButtonModule,
    NzToolTipModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'), // or import('./path-to-my-custom-echarts')
    }),
  ],
  providers: [{ provide: NZ_I18N, useValue: en_US }],
  bootstrap: [AppComponent],
})
export class AppModule {}
