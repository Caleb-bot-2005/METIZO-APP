package com.metizo.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class MetizoApplication {

    public static void main(String[] args) {
        SpringApplication.run(MetizoApplication.class, args);
    }
}
