/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Adapter, Device, Property } from 'gateway-addon';

import { data, Payload } from 'ttn'

class Ttn extends Device {
  constructor(adapter: any, id: string, payload: Payload) {
    super(adapter, id);
    this['@context'] = 'https://iot.mozilla.org/schemas/';
    this['@type'] = [];
    this.name = id;

    for (const [propertyName, value] of Object.entries(payload.payload_fields)) {
      const type = typeof value;

      if (this.typeIsAllowed(type)) {
        console.log(`Creating property ${propertyName} with type ${type}`);
        const additionalProperties: any = {};

        if (propertyName === 'temperature') {
          additionalProperties['@type'] = 'TemperatureProperty';
          this['@type'].push('TemperatureSensor');
        }

        this.addProperty(propertyName, {
          ...additionalProperties,
          type,
          multipleOf: 0.1,
          title: propertyName,
          readOnly: true,
        });
      } else {
        console.log(`Ignoring property ${propertyName} because it's of type ${type}`);
      }
    }
  }

  public update(payload: Payload) {
    for (const [propertyName, value] of Object.entries(payload.payload_fields)) {
      const type = typeof value;

      if (this.typeIsAllowed(type)) {
        const property = this.properties.get(propertyName);

        if (property) {
          property.setCachedValueAndNotify(value);
        } else {
          console.warn(`Could not find property ${propertyName}`);
        }
      }
    }
  }

  private typeIsAllowed(type: string) {
    switch (type) {
      case 'string':
      case 'number':
      case 'boolean':
        return true;
    }

    return false;
  }

  private addProperty(name: string, description: any): Property {
    const property = new Property(this, name, description);
    this.properties.set(name, property);
    return property;
  }
}

export class TtnAdapter extends Adapter {
  private devicesById: { [id: string]: Ttn } = {};

  constructor(addonManager: any, private manifest: any) {
    super(addonManager, TtnAdapter.name, manifest.name);
    addonManager.addAdapter(this);

    for (const application of this.manifest.moziot.config.applications || []) {
      const {
        appID,
        accessKey
      } = application;

      this.startListening(appID, accessKey);
    }
  }

  private async startListening(appID: string, accessKey: string) {
    const client = await data(appID, accessKey);

    client.on('uplink', (_, payload) => {
      if (payload.payload_fields) {
        this.onPayload(payload);
      }
    });
  }

  private onPayload(payload: Payload) {
    const id = `${payload.app_id}-${payload.dev_id}`;
    let device = this.devicesById[id];

    if (!device) {
      console.log(`Creating new device for ${id}`);
      device = new Ttn(this, id, payload);
      this.devicesById[id] = device;
      this.handleDeviceAdded(device);
    }

    device.update(payload);
  }
}
