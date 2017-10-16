/**
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
    * "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
import {SearchRequest} from '../model/search-request';
import {META_ALERTS_SENSOR_TYPE, META_ALERTS_INDEX} from './constants';
import {Alert} from '../model/alert';

export class Utils {
  public static escapeESField(field: string): string {
    return field.replace(/:/g, '\\:');
  }

  public static escapeESValue(value: string): string {
    return String(value)
    .replace(/[\*\+\-=~><\"\?^\${}\(\)\:\!\/[\]\\\s]/g, '\\$&') // replace single  special characters
    .replace(/\|\|/g, '\\||') // replace ||
    .replace(/\&\&/g, '\\&&'); // replace &&
  }

  public static getAlertIndex(alert: Alert): string {
    return (alert.index && alert.index.length > 0) ? alert.index : META_ALERTS_INDEX;
  }
  
  public static getAlertSensorType(alert: Alert): string {
    if (alert.source['source:type'] && alert.source['source:type'].length > 0) {
      return alert.source['source:type'];
    } else {
      return META_ALERTS_SENSOR_TYPE;
    }
  }

  public static createSearchRequest(indexName:string, guid:string): SearchRequest {
    let searchRequest = new SearchRequest();
    searchRequest.from = 0;
    searchRequest.size = 1;
    searchRequest.sort = [];
    searchRequest.fields = [];
    searchRequest.facetFields = [];
    searchRequest.indices = [indexName];
    searchRequest.query = 'guid:"' + guid + '"';
    return searchRequest;
  }
}
