import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { CharacterService } from '../../models/character/character.service';
import { NavigationComponent } from '../../navigation/navigation.component';

@Component({
    selector: 'app-base-page',
    template: '',
})
export class DataPageComponent implements OnInit, OnDestroy {

    private changeSubscription: Subscription;
    private serverStatusSubscription: Subscription;

    constructor() {
        this.changeSubscription = CharacterService.characterChangeEvent.subscribe(() => {
            this.ngOnInit();
        });
        this.serverStatusSubscription = NavigationComponent.serverStatusEvent.subscribe(() => {
            this.ngOnInit();
        });
    }

    public ngOnInit() {
        // Method stub
    }

    public ngOnDestroy() {
        this.changeSubscription.unsubscribe();
        this.serverStatusSubscription.unsubscribe();
    }
}