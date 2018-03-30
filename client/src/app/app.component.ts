import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component } from '@angular/core';

import { AppReadyEvent } from './app-ready.event';
import { IUserApiData } from './models/user/user.model';
import { UserService } from './models/user/user.service';
import { SocketService } from './socket/socket.service';

interface IHandshakeResponse {
    state: string;
    message: string;
    data?: IUserApiData;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {

    public version = '0.2.0-INDEV';

    constructor(private appReadyEvent: AppReadyEvent, private http: HttpClient, private userService: UserService) {
        this.boot().then().catch((error) => this.appReadyEvent.triggerFailure('Unexpected error', error));
    }

    private async boot(): Promise<void> {
        await this.shakeHands();
        new SocketService();
        SocketService.socket.on('STOP', (): void => {
            // The server will send STOP upon shutting down.
            // Reloading the window ensures nobody keeps using the site while the server is down.
            window.location.reload();
        });
        this.appReadyEvent.triggerSuccess();
    }

    private async shakeHands(): Promise<any> {
        const url = 'api/handshake';


        const response0 = await this.http.get<any>(url, {observe: 'response'}).toPromise<HttpResponse<IHandshakeResponse>>();
        console.log(response0.headers.keys());



        const response = await this.http.get<any>(url).toPromise<IHandshakeResponse>().catch((error: HttpErrorResponse) => {
            this.appReadyEvent.triggerFailure(error.message, error.error);
        });

        if (response && response.message === 'LoggedIn') {
            await this.userService.storeUser(response.data);
        }
    }
}
