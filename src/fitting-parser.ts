import {EftFit} from "@/eft-parser";
import {Ships} from "../data/ships";
import {Modules} from "../data/modules";
import {Charges} from "../data/charges";

export type Fit = {
    shipType: Item;
    fitName: string;
    highSlots: Slot[]
    midSlots: Slot[]
    lowSlots: Slot[]
    rigSlots: Slot[]
    subsystemSlots: Slot[]
    serviceSlots: Slot[]
    cargo: CargoItem[]
}

export type Slot = EmptySlot | FilledSlot

export type EmptySlot = {
    filled: false
    charged: false
}

export type FilledSlot = {
    filled: true
    charged: boolean
    module: Item,
    charge: Item
}

export type Item = {
    name: string,
    type: number
}

export type CargoItem = {
    name: string,
}

function item(name: string, type: number): Item {
    return {name, type};
}

const t3cs = ["Proteus", "Legion", "Tengu", "Loki"];

/**
 * This parser takes the result of the EftParser and returns an actual fit
 * with different high/mid/lows, drones, cargo etc.
 */
enum Slots {
    LowSlot = 11,
    HighSlot = 12,
    MidSlot = 13,
    RigSlot = 2663,
    SubsystemSlot = 3772,
    ServiceSlot = 6306,
}

export class FittingParser {

    parse(eftFit: EftFit): Fit {

        const ship = Ships[eftFit.shipType];
        if (!ship) {
            throw `Ship with name "${eftFit.shipType}" not found`;
        }

        const fit: Fit = {
            fitName: eftFit.fitName,
            shipType: item(eftFit.shipType, ship[0]),
            highSlots: [],
            midSlots: [],
            lowSlots: [],
            rigSlots: [],
            subsystemSlots: [],
            serviceSlots: [],
            cargo: []
        };

        let cargo = false;
        eftFit.slots.forEach((eftSlot) => {
            switch(eftSlot.module.toLowerCase()) {
                case "[empty high slot]": fit.highSlots.push({filled: false, charged: false}); return;
                case "[empty med slot]": fit.midSlots.push({filled: false, charged: false}); return;
                case "[empty low slot]": fit.lowSlots.push({filled: false, charged: false}); return;
                case "[empty rig slot]": fit.rigSlots.push({filled: false, charged: false}); return;
                case "[empty subsystem slot]": fit.subsystemSlots.push({filled: false, charged: false}); return;
                case "[empty service slot]": fit.serviceSlots.push({filled: false, charged: false}); return;
            }

            if(cargo) {
                fit.cargo.push({name: eftSlot.module});
                return;
            }

            const module = Modules[eftSlot.module];
            if (!module) {
                // Presume it's a cargo item for now and that all future items are also cargo
                cargo = true;
                fit.cargo.push({name: eftSlot.module});
                return;
            }

            const chargeTypeId = Charges[eftSlot.charge]
            const slotCharge = chargeTypeId ? {name: eftSlot.charge, type: chargeTypeId} : {name: "", type: -1};

            const slot = {
                filled: true,
                charged: !!chargeTypeId,
                module: {name: eftSlot.module, type: module[0]},
                charge: slotCharge
            } as FilledSlot;

            switch(module[1] as Slots) {
                case Slots.HighSlot:
                    fit.highSlots.push(slot);
                    break;
                case Slots.MidSlot:
                    fit.midSlots.push(slot);
                    break;
                case Slots.LowSlot:
                    fit.lowSlots.push(slot);
                    break;
                case Slots.RigSlot:
                    fit.rigSlots.push(slot);
                    break;
                case Slots.SubsystemSlot:
                    fit.subsystemSlots.push(slot);
                    break;
                case Slots.ServiceSlot:
                    fit.serviceSlots.push(slot);
                    break;
                default:
                    throw 'Unexpected error, no rack found for module'
            }
        });

        if (!t3cs.includes(eftFit.shipType)) {
            fit.highSlots = fit.highSlots.slice(0, ship[4]);
            fit.midSlots = fit.midSlots.slice(0, ship[3]);
            fit.lowSlots = fit.lowSlots.slice(0, ship[2]);
            fit.subsystemSlots = fit.subsystemSlots.slice(0, 4);
        }

        fit.rigSlots = fit.rigSlots.slice(0, ship[5]);
        while (fit.serviceSlots.length < ship[6]) {
            fit.serviceSlots.push({filled: false, charged: false})
        }
        while (fit.highSlots.length < ship[4]) {
            fit.highSlots.push({filled: false, charged: false})
        }
        while (fit.midSlots.length < ship[3]) {
            fit.midSlots.push({filled: false, charged: false})
        }
        while (fit.lowSlots.length < ship[2]) {
            fit.lowSlots.push({filled: false, charged: false})
        }
        while (fit.rigSlots.length < ship[5]) {
            fit.rigSlots.push({filled: false, charged: false})
        }

        return fit;
    }
}
