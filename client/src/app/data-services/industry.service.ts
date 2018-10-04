import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { IManufacturingData, IServerResponse } from '../../shared/interface.helper';
import { BaseService } from './base.service';

interface IManufacturingCache {
    [index: string]: IManufacturingData | undefined;
}

@Injectable()
export class IndustryService extends BaseService {

    private manufacturingCache: IManufacturingCache = {};

    public async getManufacturingData(typeId: number): Promise<IManufacturingData | undefined> {
        const url = `data/manufacturing/${typeId}`;

        if (this.manufacturingCache.hasOwnProperty(url)) {
            return this.manufacturingCache[url];
        }

        const response = await this.http.get<any>(url).toPromise<IServerResponse<IManufacturingData>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }

        this.manufacturingCache[url] = response.data;
        return response.data;
    }
}
