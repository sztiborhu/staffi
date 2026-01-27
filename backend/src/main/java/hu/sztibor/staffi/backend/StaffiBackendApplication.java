package hu.sztibor.staffi.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class StaffiBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(StaffiBackendApplication.class, args);
	}

}
