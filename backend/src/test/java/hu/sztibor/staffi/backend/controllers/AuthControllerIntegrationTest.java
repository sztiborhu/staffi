package hu.sztibor.staffi.backend.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import hu.sztibor.staffi.backend.dto.auth.CredentialsDto;
import hu.sztibor.staffi.backend.entities.User;
import hu.sztibor.staffi.backend.enums.Role;
import hu.sztibor.staffi.backend.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AuthController
 * Tests the full stack from controller to database
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;

    @BeforeEach
    void setUp() {
        // Clean database
        userRepository.deleteAll();

        // Create test user
        testUser = User.builder()
                .email("test@example.com")
                .password(passwordEncoder.encode("password123"))
                .firstName("Test")
                .lastName("User")
                .role(Role.ADMIN)
                .isActive(true)
                .build();
        testUser = userRepository.save(testUser);
    }

    @Test
    void login_ShouldReturnTokenAndUserData_WhenCredentialsAreValid() throws Exception {
        // Given
        CredentialsDto credentials = new CredentialsDto("test@example.com", "password123".toCharArray());

        // When & Then
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(credentials)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.firstName").value("Test"))
                .andExpect(jsonPath("$.lastName").value("User"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.token").value(notNullValue()));
    }

    @Test
    void login_ShouldReturn400_WhenCredentialsAreInvalid() throws Exception {
        // Given
        CredentialsDto credentials = new CredentialsDto("test@example.com", "wrongPassword".toCharArray());

        // When & Then
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(credentials)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid password"));
    }

    @Test
    void login_ShouldReturn404_WhenUserDoesNotExist() throws Exception {
        // Given
        CredentialsDto credentials = new CredentialsDto("nonexistent@example.com", "password123".toCharArray());

        // When & Then
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(credentials)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Unknown user"));
    }

    @Test
    void login_ShouldReturn404_WhenEmailIsEmpty() throws Exception {
        // Given
        CredentialsDto credentials = new CredentialsDto("", "password123".toCharArray());

        // When & Then
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(credentials)))
                .andExpect(status().isNotFound());
    }
}

