package hu.sztibor.staffi.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenAPIConfig {

    @Bean
    public OpenAPI defineOpenApi() {
        Server server = new Server();
        server.setUrl("http://localhost:8081/api");
        server.setDescription("Development");

        Contact myContact = new Contact();
        myContact.setName("Tibor Szijjarto");
        myContact.setEmail("email@sztibor.hu");

        Info information = new Info()
                .title("Staffi API")
                .version("1.0")
                .description("This API exposes endpoints to the Staffi backend application.")
                .contact(myContact);
        return new OpenAPI().info(information).servers(List.of(server));
    }
}