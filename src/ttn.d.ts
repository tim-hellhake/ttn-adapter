/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

declare module 'ttn' {
    export function data(appID: string, accessKey: string): Promise<Client>;

    class Client {
        public on(on: 'uplink', cb: (devID: string, payload: Payload) => void): void;
    }

    interface Payload {
        app_id: string,
        dev_id: string,
        hardware_serial: string,
        port: number,
        counter: number,
        confirmed: boolean,
        payload_raw: Buffer,
        payload_fields: object,
        metadata:
        {
            time: string,
            frequency: number,
            modulation: string,
            data_rate: string,
            airtime: number,
            coding_rate: string,
            gateways: Gateway[]
        }
    }

    interface Gateway {
        gtw_id: string,
        timestamp: number,
        time: string,
        channel: number,
        rssi: number,
        snr: number,
        rf_chain: number
    }
}
