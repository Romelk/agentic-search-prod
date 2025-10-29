/**
 * Vector Search Application - Spring Boot main application class
 */

package com.agenticsearch.vectorsearch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties
public class VectorSearchApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(VectorSearchApplication.class, args);
    }
}

