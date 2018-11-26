import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { AppReadyEventService } from './app-ready-event.service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SorTableComponent } from './components/sor-table/sor-table.component';
import { AttributesService } from './data-services/attributes.service';
import { BaseService } from './data-services/base.service';
import { IndustryJobsService } from './data-services/industry-jobs.service';
import { IndustryService } from './data-services/industry.service';
import { MarketService } from './data-services/market.service';
import { NamesService } from './data-services/names.service';
import { ShipService } from './data-services/ship.service';
import { SkillGroupsService } from './data-services/skill-groups.service';
import { SkillQueueService } from './data-services/skillqueue.service';
import { SkillsService } from './data-services/skills.service';
import { StatusService } from './data-services/status.service';
import { TypesService } from './data-services/types.service';
import { UsersService } from './data-services/users.service';
import { WalletJournalService } from './data-services/wallet-journal.service';
import { WalletService } from './data-services/wallet.service';
import { AdminGuard } from './guards/admin.guard';
import { AppReadyGuard } from './guards/app-ready.guard';
import { AuthGuard } from './guards/auth.guard';
import { httpInterceptorProviders } from './http-interceptors';
import { CharacterService } from './models/character/character.service';
import { UserService } from './models/user/user.service';
import { LogoutModalComponent } from './navigation/logout-modal.component';
import { NavigationComponent } from './navigation/navigation.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DataPageComponent } from './pages/data-page/data-page.component';
import { HomeComponent } from './pages/home/home.component';
import { IndustryComponent } from './pages/industry/industry.component';
import { OreComponent } from './pages/ore/ore.component';
import { ScopesComponent } from './pages/scopes/scopes.component';
import { SkillsComponent } from './pages/skills/skills.component';
import { UsersComponent } from './pages/users/users.component';
import { WalletComponent } from './pages/wallet/wallet.component';
import { SentryErrorHandler } from './sentry.error-handler';
import { ESIRequestCache } from './shared/esi-request-cache';
import { SocketService } from './socket/socket.service';

@NgModule({
    bootstrap: [
        AppComponent,
    ],
    declarations: [
        AppComponent,
        NavigationComponent,
        HomeComponent,
        DataPageComponent,
        DashboardComponent,
        WalletComponent,
        SkillsComponent,
        LogoutModalComponent,
        IndustryComponent,
        UsersComponent,
        OreComponent,
        SorTableComponent,
        ScopesComponent,
    ],
    entryComponents: [
        LogoutModalComponent,
    ],
    imports: [
        FormsModule,
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        HttpClientModule,
        NgbModule,
        NgbTooltipModule,
        FontAwesomeModule,
    ],
    providers: [
        { provide: ErrorHandler, useClass: SentryErrorHandler },
        httpInterceptorProviders,
        ESIRequestCache,
        AppReadyEventService,
        BaseService,
        UserService,
        UsersService,
        CharacterService,
        NamesService,
        StatusService,
        TypesService,
        ShipService,
        WalletService,
        WalletJournalService,
        AttributesService,
        SkillQueueService,
        SkillGroupsService,
        SkillsService,
        IndustryJobsService,
        IndustryService,
        MarketService,
        SocketService,
        AppReadyGuard,
        AuthGuard,
        AdminGuard,
    ],
})
export class AppModule {
}
