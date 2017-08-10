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
import {ColumnMetadata} from '../model/column-metadata';
import {AlertsSearchResponse} from '../model/alerts-search-response';
import {SearchRequest} from '../model/search-request';
import {AlertAggregationGroup, AlertAggregation} from '../model/alert';

export class ElasticsearchUtils {

  public static excludeIndexName = '-*kibana,-*error*';

  private static createColumMetaData(properties: any, columnMetadata: ColumnMetadata[], seen: string[]) {
     try {
       let columnNames = Object.keys(properties);
       for (let columnName of columnNames) {
         if (seen.indexOf(columnName) === -1) {
           seen.push(columnName);
           columnMetadata.push(
             new ColumnMetadata(columnName, (properties[columnName].type ? properties[columnName].type : ''))
           );
         }
       }
     } catch (e) {}
  }

  public static extractColumnNameData(res: Response): ColumnMetadata[] {
    let response: any = res || {};
    let columnMetadata: ColumnMetadata[] = [];
    let seen: string[] = [];

    for (let index in response.metadata.indices) {
      if (!index.endsWith(ElasticsearchUtils.excludeIndexName)) {
        let mappings = response.metadata.indices[index].mappings;
        for (let type of Object.keys(mappings)) {
          ElasticsearchUtils.createColumMetaData(response.metadata.indices[index].mappings[type].properties, columnMetadata, seen);
        }
      }
    }

    columnMetadata.push(new ColumnMetadata('_id', 'string'));
    return columnMetadata;
  }

  private static extractAggregations(agg: {}): AlertAggregationGroup[] {
    let aggregationsGroupsArray: AlertAggregationGroup[] = [];
    var aggKeys = Object.keys(agg);
    aggKeys.forEach(key => {
      let aggregationsArray: AlertAggregation[] = [];
      agg[key]['buckets'].forEach(bucket => {
        let key = bucket['key_as_string'] ? bucket['key_as_string']: bucket['key'];
        aggregationsArray.push(new AlertAggregation(key, bucket['doc_count']));
      });

      aggregationsGroupsArray.push(new AlertAggregationGroup(key, aggregationsArray));
    });

    return aggregationsGroupsArray;
  }

  public static extractAlertsData(res: Response): AlertsSearchResponse {
    let response: any = res || {};
    let alertsSearchResponse: AlertsSearchResponse = new AlertsSearchResponse();
    alertsSearchResponse.total = response['hits']['total'];
    alertsSearchResponse.results = response['hits']['hits'];
    alertsSearchResponse.aggregations = ElasticsearchUtils.extractAggregations(response['aggregations']);

    return alertsSearchResponse;
  }

  public static extractESErrorMessage(error: any): any {
    let message = error.error.reason;
    error.error.root_cause.map(cause => {
      message += '\n' + cause.index + ': ' + cause.reason;
    });

    return message;
  }

  private static getAggregations(fieldNames: string[], aggregations: {}) {
    if (fieldNames.length > 0) {
      let firstAggr = fieldNames.shift();
      aggregations[firstAggr] =  { terms: { field : firstAggr } };

      fieldNames.reduce((prevVal: {}, currentVal: string) => {

        prevVal['aggs'] = {};
        prevVal['aggs'][currentVal] = { terms: { field : currentVal } };
        return prevVal['aggs'][currentVal];

      }, aggregations[firstAggr]);
    }
  }

  public static getSearchRequest(searchRequest: SearchRequest): any {
    let request: any  = JSON.parse(JSON.stringify(searchRequest));
    request.query = { query_string: { query: searchRequest.query } };

    if (searchRequest.aggregations.length > 0) {
      let aggregations = {};
      searchRequest.aggregations.map((fieldNamesArray: string[]) => {
        ElasticsearchUtils.getAggregations(JSON.parse(JSON.stringify(fieldNamesArray)), aggregations);
      });

      request.aggs = aggregations;
      delete request.aggregations;
    }

    return request;
  }

}
