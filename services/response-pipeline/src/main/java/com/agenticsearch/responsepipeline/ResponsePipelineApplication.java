/**
 * Response Pipeline Application - Spring Boot main application class
 */

package com.agenticsearch.responsepipeline;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties
public class ResponsePipelineApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(ResponsePipelineApplication.class, args);
    }
}

