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
package org.apache.metron.rest.controller;

import org.adrianwalker.multilinestring.Multiline;
import org.apache.metron.rest.service.SensorEnrichmentConfigService;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment= SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class SensorEnrichmentConfigControllerIntegrationTest {

  /**
   {
   "index": "broTest",
   "batchSize": 1,
   "enrichment": {
   "fieldMap": {
   "geo": [
   "ip_dst_addr"
   ],
   "host": [
   "ip_dst_addr"
   ],
   "hbaseEnrichment": [
   "ip_src_addr"
   ],
   "stellar": {
   "config": {
   "group1": {
   "foo": "1 + 1",
   "bar": "foo"
   },
   "group2": {
   "ALL_CAPS": "TO_UPPER(source.type)"
   }
   }
   }
   },
   "fieldToTypeMap": {
   "ip_src_addr": [
   "sample"
   ]
   }
   },
   "threatIntel": {
   "fieldMap": {
   "hbaseThreatIntel": [
   "ip_src_addr",
   "ip_dst_addr"
   ]
   },
   "fieldToTypeMap": {
   "ip_src_addr": [
   "malicious_ip"
   ],
   "ip_dst_addr": [
   "malicious_ip"
   ]
   },
   "triageConfig": {
   "riskLevelRules": {
   "ip_src_addr == '10.122.196.204' or ip_dst_addr == '10.122.196.204'": 10
   },
   "aggregator": "MAX"
   }
   }
   }
   */
  @Multiline
  public static String broJson;

  @Autowired
  private SensorEnrichmentConfigService sensorEnrichmentConfigService;

  @Autowired
  private WebApplicationContext wac;

  private MockMvc mockMvc;

  private String user = "user";
  private String password = "password";

  @Before
  public void setup() throws Exception {
    this.mockMvc = MockMvcBuilders.webAppContextSetup(this.wac).apply(springSecurity()).build();
  }

  @Test
  public void testSecurity() throws Exception {
    this.mockMvc.perform(post("/sensorEnrichmentConfig").with(csrf()).contentType(MediaType.parseMediaType("application/json;charset=UTF-8")).content(broJson))
            .andExpect(status().isUnauthorized());

    this.mockMvc.perform(get("/sensorEnrichmentConfig/broTest"))
            .andExpect(status().isUnauthorized());

    this.mockMvc.perform(get("/sensorEnrichmentConfig"))
            .andExpect(status().isUnauthorized());

    this.mockMvc.perform(delete("/sensorEnrichmentConfig/broTest").with(csrf()))
            .andExpect(status().isUnauthorized());
  }

  @Test
  public void test() throws Exception {
    sensorEnrichmentConfigService.delete("broTest");

    this.mockMvc.perform(post("/sensorEnrichmentConfig/broTest").with(httpBasic(user, password)).with(csrf()).contentType(MediaType.parseMediaType("application/json;charset=UTF-8")).content(broJson))
            .andExpect(status().isCreated())
            .andExpect(content().contentType(MediaType.parseMediaType("application/json;charset=UTF-8")))
            .andExpect(jsonPath("$.index").value("broTest"))
            .andExpect(jsonPath("$.batchSize").value(1))
            .andExpect(jsonPath("$.enrichment.fieldMap.geo[0]").value("ip_dst_addr"))
            .andExpect(jsonPath("$.enrichment.fieldMap.host[0]").value("ip_dst_addr"))
            .andExpect(jsonPath("$.enrichment.fieldMap.hbaseEnrichment[0]").value("ip_src_addr"))
            .andExpect(jsonPath("$.enrichment.fieldToTypeMap.ip_src_addr[0]").value("sample"))
            .andExpect(jsonPath("$.enrichment.fieldMap.stellar.config.group1.foo").value("1 + 1"))
            .andExpect(jsonPath("$.enrichment.fieldMap.stellar.config.group1.bar").value("foo"))
            .andExpect(jsonPath("$.enrichment.fieldMap.stellar.config.group2.ALL_CAPS").value("TO_UPPER(source.type)"))
            .andExpect(jsonPath("$.threatIntel.fieldMap.hbaseThreatIntel[0]").value("ip_src_addr"))
            .andExpect(jsonPath("$.threatIntel.fieldMap.hbaseThreatIntel[1]").value("ip_dst_addr"))
            .andExpect(jsonPath("$.threatIntel.fieldToTypeMap.ip_src_addr[0]").value("malicious_ip"))
            .andExpect(jsonPath("$.threatIntel.fieldToTypeMap.ip_dst_addr[0]").value("malicious_ip"))
            .andExpect(jsonPath("$.threatIntel.triageConfig.riskLevelRules[\"ip_src_addr == '10.122.196.204' or ip_dst_addr == '10.122.196.204'\"]").value(10))
            .andExpect(jsonPath("$.threatIntel.triageConfig.aggregator").value("MAX"));

    this.mockMvc.perform(get("/sensorEnrichmentConfig/broTest").with(httpBasic(user,password)))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.parseMediaType("application/json;charset=UTF-8")))
            .andExpect(jsonPath("$.index").value("broTest"))
            .andExpect(jsonPath("$.batchSize").value(1))
            .andExpect(jsonPath("$.enrichment.fieldMap.geo[0]").value("ip_dst_addr"))
            .andExpect(jsonPath("$.enrichment.fieldMap.host[0]").value("ip_dst_addr"))
            .andExpect(jsonPath("$.enrichment.fieldMap.hbaseEnrichment[0]").value("ip_src_addr"))
            .andExpect(jsonPath("$.enrichment.fieldToTypeMap.ip_src_addr[0]").value("sample"))
            .andExpect(jsonPath("$.enrichment.fieldMap.stellar.config.group1.foo").value("1 + 1"))
            .andExpect(jsonPath("$.enrichment.fieldMap.stellar.config.group1.bar").value("foo"))
            .andExpect(jsonPath("$.enrichment.fieldMap.stellar.config.group2.ALL_CAPS").value("TO_UPPER(source.type)"))
            .andExpect(jsonPath("$.threatIntel.fieldMap.hbaseThreatIntel[0]").value("ip_src_addr"))
            .andExpect(jsonPath("$.threatIntel.fieldMap.hbaseThreatIntel[1]").value("ip_dst_addr"))
            .andExpect(jsonPath("$.threatIntel.fieldToTypeMap.ip_src_addr[0]").value("malicious_ip"))
            .andExpect(jsonPath("$.threatIntel.fieldToTypeMap.ip_dst_addr[0]").value("malicious_ip"))
            .andExpect(jsonPath("$.threatIntel.triageConfig.riskLevelRules[\"ip_src_addr == '10.122.196.204' or ip_dst_addr == '10.122.196.204'\"]").value(10))
            .andExpect(jsonPath("$.threatIntel.triageConfig.aggregator").value("MAX"));

    this.mockMvc.perform(get("/sensorEnrichmentConfig").with(httpBasic(user,password)))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.parseMediaType("application/json;charset=UTF-8")))
            .andExpect(jsonPath("$[?(@.index == 'broTest' &&" +
                    "@.batchSize == 1 &&" +
                    "@.enrichment.fieldMap.geo[0] == 'ip_dst_addr' &&" +
                    "@.enrichment.fieldMap.host[0] == 'ip_dst_addr' &&" +
                    "@.enrichment.fieldMap.hbaseEnrichment[0] == 'ip_src_addr' &&" +
                    "@.enrichment.fieldToTypeMap.ip_src_addr[0] == 'sample' &&" +
                    "@.enrichment.fieldMap.stellar.config.group1.foo == '1 + 1' &&" +
                    "@.enrichment.fieldMap.stellar.config.group1.bar == 'foo' &&" +
                    "@.enrichment.fieldMap.stellar.config.group2.ALL_CAPS == 'TO_UPPER(source.type)' &&" +
                    "@.threatIntel.fieldMap.hbaseThreatIntel[0] == 'ip_src_addr' &&" +
                    "@.threatIntel.fieldMap.hbaseThreatIntel[1] == 'ip_dst_addr' &&" +
                    "@.threatIntel.fieldToTypeMap.ip_src_addr[0] == 'malicious_ip' &&" +
                    "@.threatIntel.fieldToTypeMap.ip_dst_addr[0] == 'malicious_ip' &&" +
                    "@.threatIntel.triageConfig.riskLevelRules[\"ip_src_addr == '10.122.196.204' or ip_dst_addr == '10.122.196.204'\"] == 10 &&" +
                    "@.threatIntel.triageConfig.aggregator == 'MAX'" +
                    ")]").exists());

    this.mockMvc.perform(delete("/sensorEnrichmentConfig/broTest").with(httpBasic(user,password)).with(csrf()))
            .andExpect(status().isOk());

    this.mockMvc.perform(get("/sensorEnrichmentConfig/broTest").with(httpBasic(user,password)))
            .andExpect(status().isNotFound());

    this.mockMvc.perform(delete("/sensorEnrichmentConfig/broTest").with(httpBasic(user,password)).with(csrf()))
            .andExpect(status().isNotFound());

    this.mockMvc.perform(get("/sensorEnrichmentConfig").with(httpBasic(user,password)))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.parseMediaType("application/json;charset=UTF-8")))
            .andExpect(jsonPath("$[?(@.sensorTopic == 'broTest')]").doesNotExist());

    this.mockMvc.perform(get("/sensorEnrichmentConfig/list/available").with(httpBasic(user,password)))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.parseMediaType("application/json;charset=UTF-8")))
            .andExpect(jsonPath("$[0]").value("geo"))
            .andExpect(jsonPath("$[1]").value("host"))
            .andExpect(jsonPath("$[2]").value("whois"))
            .andExpect(jsonPath("$[3]").value("sample"));
  }
}
