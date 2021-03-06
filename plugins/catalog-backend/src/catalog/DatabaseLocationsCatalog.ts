/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Database, DatabaseLocationUpdateLogEvent } from '../database';
import { IngestionModel } from '../ingestion/types';
import {
  AddLocation,
  Location,
  LocationsCatalog,
  LocationResponse,
} from './types';

export class DatabaseLocationsCatalog implements LocationsCatalog {
  constructor(
    private readonly database: Database,
    private readonly ingestionModel: IngestionModel,
  ) {}

  async addLocation(location: AddLocation): Promise<Location> {
    const outputs = await this.ingestionModel.readLocation(
      location.type,
      location.target,
    );
    if (!outputs) {
      throw new Error(
        `Unknown location type ${location.type} ${location.target}`,
      );
    }
    outputs.forEach(output => {
      if (output.type === 'error') {
        throw new Error(
          `Can't read location at ${location.target}, ${output.error}`,
        );
      }
    });

    const added = await this.database.addLocation(location);
    return added;
  }

  async removeLocation(id: string): Promise<void> {
    await this.database.removeLocation(id);
  }

  async locations(): Promise<LocationResponse[]> {
    const items = await this.database.locations();
    return items.map(({ message, status, timestamp, ...data }) => ({
      currentStatus: {
        message,
        status,
        timestamp,
      },
      data,
    }));
  }

  async locationHistory(id: string): Promise<DatabaseLocationUpdateLogEvent[]> {
    return this.database.locationHistory(id);
  }

  async location(id: string): Promise<LocationResponse> {
    const {
      message,
      status,
      timestamp,
      ...data
    } = await this.database.location(id);
    return {
      currentStatus: {
        message,
        status,
        timestamp,
      },
      data,
    };
  }
}
