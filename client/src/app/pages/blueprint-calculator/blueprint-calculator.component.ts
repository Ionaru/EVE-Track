// TODO: Remove line below.
// tslint:disable

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ICharacterBlueprintsDataUnit, IUniverseNamesDataUnit, IUniverseTypeData } from '@ionaru/eve-utils';
import { map } from 'rxjs/operators';

import { Calc } from '../../../shared/calc.helper';
import { BlueprintsService } from '../../data-services/blueprints.service';
import { IManufacturingData, IndustryService } from '../../data-services/industry.service';
import { MarketService } from '../../data-services/market.service';
import { TypesService } from '../../data-services/types.service';
import { CharacterService } from '../../models/character/character.service';
import { NamesService } from '../../data-services/names.service';
import { SearchService, SearchType } from '../../data-services/search.service';

class ShoppingList2 {
    public readonly list: IndustryNode[] = [];

    public add(nodeToAdd: IndustryNode) {
        const existingNode = this.list.find((node) => node.product.type_id === nodeToAdd.product.type_id);
        if (existingNode) {
            existingNode.quantity += nodeToAdd.quantity;
            existingNode.price += nodeToAdd.price;
        } else {
            this.list.push(nodeToAdd);
        }
    }
}

class IndustryNode {
    price = Infinity;
    quantity: number;
    acquireMethod?: AcquireMethod;
    product: IUniverseTypeData;
    totalIndustryCost = 0;
    producePrice = Infinity;
    children: IndustryNode[] = [];


    constructor(product: IUniverseTypeData, quantity: number) {
        this.product = product;
        this.quantity = quantity;
    }
}

enum AcquireMethod {
    PURCHASE,
    PRODUCE,
}

interface IInput {
    data?: IUniverseNamesDataUnit;
    input?: string;
}

@Component({
    selector: 'app-blueprint-calculator',
    styleUrls: ['./blueprint-calculator.component.scss'],
    templateUrl: './blueprint-calculator.component.html',
})
export class BlueprintCalculatorComponent implements OnInit {

    public calculating?: boolean;

    public currentMaterial?: string;

    public item: IInput = {};
    @ViewChild('input_item') inputItemElement!: ElementRef<HTMLInputElement>;

    public tax: number = 0;
    @ViewChild('input_tax') inputTaxElement!: ElementRef<HTMLInputElement>;

    public quantity: number = 1;
    @ViewChild('input_quantity') inputQuantityElement!: ElementRef<HTMLInputElement>;

    public productionSystem: IInput = {};
    @ViewChild('input_production_system') inputProductionSystemElement!: ElementRef<HTMLInputElement>;

    public sellSystem: IInput = {};
    @ViewChild('input_sell_system') inputSellSystemElement!: ElementRef<HTMLInputElement>;

    public buySystem: IInput = {};
    @ViewChild('input_buy_system') inputBuySystemElement!: ElementRef<HTMLInputElement>;

    public profitPercentage = 0;
    public profit = 0;
    public chain?: IndustryNode;

    public shoppingList = new ShoppingList2();
    public shoppingVolume = 0;

    public usedBlueprints: ICharacterBlueprintsDataUnit[] = [];

    public message?: string;

    constructor(
        private blueprintsService: BlueprintsService,
        private industryService: IndustryService,
        private marketService: MarketService,
        private namesService: NamesService,
        private searchService: SearchService,
        private typesService: TypesService,
        private route: ActivatedRoute,
        private router: Router,
    ) { }

    public getName(id: number) {
        return NamesService.getNameFromData(id);
    }

    public async ngOnInit() {
        this.route.queryParamMap.pipe(map(
            (params) => {
                this.sellSystem.input = params.get('sellSystem') || 'Jita';
                this.buySystem.input = params.get('buySystem') || 'Jita';
                this.productionSystem.input = params.get('productionSystem') || 'Jita';
                this.item.input = params.get('item') || '';
                this.quantity = Number(params.get('quantity')) || 1;
                this.tax = Number(params.get('tax')) || 0;
            })
        ).toPromise().then();
    }

    public loggedIn = !!CharacterService.selectedCharacter;

    public async adjustMaterialsNeededByBlueprintMaterialEfficiency(manufacturingData: IManufacturingData) {
        if (!CharacterService.selectedCharacter) {
            return;
        }

        const blueprints = await this.blueprintsService.getBlueprints(CharacterService.selectedCharacter);
        const subBlueprint = blueprints.find((blueprint) => blueprint.type_id === manufacturingData.blueprintId);

        if (subBlueprint) {
            this.usedBlueprints.push(subBlueprint);

            manufacturingData.materials = manufacturingData.materials.map((material) => {

                const materialMultiplier = subBlueprint.material_efficiency / 100;
                const materialsToSubtract = material.quantity * materialMultiplier;

                return {
                    id: material.id,
                    quantity: Math.ceil(material.quantity - materialsToSubtract)
                }
            });

        }
        return manufacturingData;
    }

    public flatten<T>(array: T[], childSelector: (element: T) => T[]): T[] {
        return array.reduce((accumulator: T[], currentValue) => {
            accumulator = accumulator.concat(currentValue);
            const children = childSelector(currentValue);
            if (children) {
                accumulator = accumulator.concat(this.flatten(children, childSelector));
            }
            return accumulator;
        }, []);
    }

    public async createSupplyChain3(material: number, quantity = 1, initialPrice?: number) {
        const info = await this.typesService.getType(material);
        if (!info) {
            throw new Error('Unable to get material info');
        }

        this.currentMaterial = info.name;
        const node = new IndustryNode(info, quantity);

        let price;
        if (initialPrice) {
            price = initialPrice;
        } else {
            price = await this.marketService.getPriceForAmountInSystem(this.buySystem.data!.id, material, quantity, 'sell');
        }

        const manufacturingData = await this.industryService.getManufacturingData(material);

        if (!manufacturingData && (!price || price === Infinity)) {
            throw new Error(`Material ${info.name} can neither be bought nor built.`)
        }

        node.price = price || Infinity;

        if (!manufacturingData) {
            // Item can not be produced.
            node.acquireMethod = AcquireMethod.PURCHASE;
            delete node.children;
            return node;
        }

        let materialPrices = 0;
        await this.adjustMaterialsNeededByBlueprintMaterialEfficiency(manufacturingData);

        for (const subMaterial of manufacturingData.materials) {
            const subNode = await this.createSupplyChain3(subMaterial.id, subMaterial.quantity * quantity);
            materialPrices += subNode.price;
            node.children.push(subNode);
        }

        const industryCost = await this.getIndustryCost(material);
        node.totalIndustryCost += (industryCost * quantity);

        node.producePrice = materialPrices;
        if ((materialPrices + industryCost) < node.price) {
            node.acquireMethod = AcquireMethod.PRODUCE;
        } else {
            node.acquireMethod = AcquireMethod.PURCHASE;
            delete node.children;
        }

        return node;
    }

    public async getIndustryCost(material: number) {
        // system cost index * EIV --> X + (X * tax)

        if (this.productionSystem.data && this.productionSystem.data.id) {
            const estimatedItemValue = await this.marketService.getEstimatedItemValue(material);
            const systemCostIndex = await this.industryService.getSystemCostIndex(this.productionSystem.data.id);

            if (estimatedItemValue && systemCostIndex) {
                const grossCost = Math.round(Math.round(estimatedItemValue) * systemCostIndex);
                return Math.round(grossCost + ((this.tax / 100) * grossCost));
            }
        }
        return 0;
    }

    public async processInput() {

        const results = await Promise.all([
            await this.processInputElement(this.inputItemElement, this.item, 'type'),
            await this.processInputElement(this.inputSellSystemElement, this.sellSystem, 'system'),
            await this.processInputElement(this.inputBuySystemElement, this.buySystem, 'system'),
            await this.processInputElement(this.inputProductionSystemElement, this.productionSystem, 'system'),
            this.checkQuantityInput(this.inputQuantityElement),
            this.checkIndustryTaxInput(this.inputTaxElement),
        ]);

        if (results.every((result) => result)) {
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {
                    item: this.item.input,
                    sellSystem: this.sellSystem.input,
                    buySystem: this.buySystem.input,
                    productionSystem: this.productionSystem.input,
                    quantity: this.quantity,
                    tax: this.tax,
                },
                queryParamsHandling: 'merge'
            }).then();
            this.recFun2();
        }
    }

    public checkQuantityInput(element: ElementRef<HTMLInputElement>) {

        if (this.quantity < 1 || !Number.isInteger(this.quantity)) {
            this.message = 'Quantity must be a whole number higher than 0';
            this.calculating = false;
            this.setValidity(element, false);
            return;
        }

        this.setValidity(element, true);
        return true;
    }

    public checkIndustryTaxInput(element: ElementRef<HTMLInputElement>) {

        if (this.tax < 0) {
            this.setValidity(element, false);
            this.message = 'Industry tax must be 0 or higher';
            this.calculating = false;
            return;
        }

        this.setValidity(element, true);
        return true;
    }

    public async processInputElement(element: ElementRef<HTMLInputElement>, thing: IInput, searchType: SearchType) {

        if (thing.data && thing.data.name === thing.input) {
            this.setValidity(element, true);
            return true;
        }

        this.setValidity(element);
        thing.data = undefined;

        if (!thing.input || !thing.input.length) {
            return;
        }

        const result = await this.searchService.search(thing.input, searchType);
        if (!result || !result.id) {
            this.setValidity(element, false);
            return;
        }

        thing.data = result;
        thing.input = result.name;
        this.setValidity(element, true);
        return true;
    }

    public setValidity(element: ElementRef<HTMLInputElement>, valid?: boolean) {

        const invalidClass = 'is-invalid';
        const validClass = 'is-valid';

        // Reset
        element.nativeElement.classList.remove(invalidClass);
        element.nativeElement.classList.remove(validClass);

        if (valid === true) {
            element.nativeElement.classList.add(validClass);
            return;
        }

        if (valid === false) {
            element.nativeElement.classList.add(invalidClass);
        }
    }

    public async recFun2() {

        if (this.quantity < 1 || !Number.isInteger(this.quantity)) {
            this.message = 'Quantity must be a positive integer.';
            this.calculating = false;
            return;
        }

        if (!this.item.data?.id || !this.sellSystem.data?.id || !this.buySystem.data?.id) {
            return;
        }

        this.chain = undefined;
        this.message = undefined;
        this.calculating = true;
        this.shoppingList = new ShoppingList2();
        this.shoppingVolume = 0;
        this.usedBlueprints = [];
        this.currentMaterial = 'Initializing';

        // NEW
        const productPrice = await this.marketService.getPriceForAmountInSystem(this.sellSystem.data.id, this.item.data.id, this.quantity, 'buy');

        if (!productPrice) {
            this.message = 'Unable to determine price for final product.';
            this.calculating = false;
            return;
        }

        const chain = await this.createSupplyChain3(this.item.data.id, this.quantity, productPrice).catch((error: Error) => {
            this.message = `Cannot complete calculation, reason: ${error.message}`;
        });

        if (chain) {
            await this.namesService.getNames(...this.usedBlueprints.map((blueprint) => blueprint.type_id));

            this.calculating = false;

            this.chain = chain;

            this.profit = chain.price - (chain.producePrice + chain.totalIndustryCost);
            this.profitPercentage = Calc.profitPercentage(chain.producePrice, chain.price);

            const flatChain = this.flatten([chain], (industryNode) => industryNode.children);

            for (const node of flatChain) {
                if (node.acquireMethod === AcquireMethod.PURCHASE) {
                    this.shoppingList.add(node);
                }
            }
            this.shoppingVolume = this.shoppingList.list.reduce(
                (accumulator, node) => accumulator + ((node.product.volume || 0) * node.quantity), 0);

        }

        this.calculating = false;
    }
}
