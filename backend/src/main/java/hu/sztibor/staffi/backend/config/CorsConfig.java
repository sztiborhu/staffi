package hu.sztibor.staffi.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsConfig = new CorsConfiguration();

        // Allow credentials (cookies, authorization headers)
        corsConfig.setAllowCredentials(true);

        // Allowed origins - your Angular app URLs
        corsConfig.setAllowedOrigins(List.of("http://localhost:4200"));

        // Allowed HTTP methods
        corsConfig.setAllowedMethods(Arrays.asList(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "PATCH",
                "OPTIONS"
        ));

        // Allowed headers
        corsConfig.setAllowedHeaders(List.of("*"));

        // Exposed headers
        corsConfig.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "Accept"
        ));

        // Max age for preflight requests
        corsConfig.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return source;
    }
}

