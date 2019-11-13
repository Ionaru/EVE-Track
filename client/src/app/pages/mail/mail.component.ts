import { Component, OnDestroy, OnInit } from '@angular/core';
import { ICharacterMailsData } from '@ionaru/eve-utils';

import { MailService } from '../../data-services/mail.service';
import { CharacterService } from '../../models/character/character.service';
import { DataPageComponent } from '../data-page/data-page.component';
import { Scope } from '../scopes/scopes.component';

@Component({
    selector: 'app-mail',
    styleUrls: ['./mail.component.scss'],
    templateUrl: './mail.component.html',
})
export class MailComponent extends DataPageComponent implements OnInit, OnDestroy {

    public mails?: ICharacterMailsData;

    constructor(private mailService: MailService) {
        super();
        this.requiredScopes = [Scope.MAIL_READ];
    }

    public async ngOnInit() {
        super.ngOnInit();
        if (CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(Scope.MAIL_READ)) {
            this.mails = await this.mailService.getMails(CharacterService.selectedCharacter).then();
        }
    }
}