import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { uniquifyArray } from '@ionaru/array-utils';
import { EVE, IUniverseNamesData, IUniverseNamesDataUnit } from '@ionaru/eve-utils';

import { Calc } from '../../shared/calc.helper';
import { BaseService } from './base.service';

export interface INames {
    [id: string]: IUniverseNamesDataUnit;
}

@Injectable()
export class NamesService extends BaseService {

    private static names: INames = {};

    public static getNameFromData(id: number, unknownMessage = 'Unknown'): string {
        if (!NamesService.names || !Object.entries(NamesService.names).length) {
            return unknownMessage;
        }

        if (NamesService.names[id] && NamesService.names[id].name) {
            return NamesService.names[id].name;
        } else {
            return unknownMessage;
        }
    }

    public async getNames(...ids: (string | number)[]): Promise<void> {

        const uniqueIds = uniquifyArray(ids.map((id) => id.toString()));

        for (const element of uniqueIds) {
            const elementNumber = Number(element);
            if (isNaN(elementNumber) || elementNumber > Calc.maxIntegerValue) {
                throw new Error(`${element} is not a value that can get resolved to a name.`);
            }
        }

        // Check if all values in 'ids' are -1, if so then there's no point in calling the Names Endpoint
        if (uniqueIds.every((element) => Number(element) === -1)) {
            return;
        }

        const namesToGet: string[] = [];

        for (const id of uniqueIds) {
            if (!NamesService.names[id]) {
                namesToGet.push(id);
            }
        }

        if (!namesToGet.length) {
            return;
        }

        const maxChunkSize = 1000;
        while (true) {
            const namesToGetChunk = namesToGet.splice(0, maxChunkSize);

            if (namesToGetChunk.length > 0) {
                await this.getNamesFromAPI(namesToGetChunk);
            }

            if (namesToGetChunk.length < 1000) {
                break;
            }
        }
    }

    private async getNamesFromAPI(ids: string[]): Promise<void> {
        const url = EVE.getUniverseNamesUrl();
        const response = await this.http.post<any>(url, ids).toPromise<IUniverseNamesData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        for (const name of response) {
            NamesService.names[name.id] = name;
        }
    }
}
