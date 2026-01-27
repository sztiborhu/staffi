package hu.sztibor.staffi.backend.services;

import hu.sztibor.staffi.backend.dto.auth.CredentialsDto;
import hu.sztibor.staffi.backend.dto.auth.UserDto;
import hu.sztibor.staffi.backend.entities.User;
import hu.sztibor.staffi.backend.enums.Role;
import hu.sztibor.staffi.backend.exceptions.AppException;
import hu.sztibor.staffi.backend.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserServiceLoginTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User activeUser;
    private User inactiveUser;

    @BeforeEach
    void setUp() {
        // Clean database
        userRepository.deleteAll();

        // Create active user
        activeUser = User.builder()
                .email("active@test.com")
                .password(passwordEncoder.encode("password123"))
                .firstName("Active")
                .lastName("User")
                .role(Role.EMPLOYEE)
                .isActive(true)
                .build();
        userRepository.save(activeUser);

        // Create inactive user
        inactiveUser = User.builder()
                .email("inactive@test.com")
                .password(passwordEncoder.encode("password123"))
                .firstName("Inactive")
                .lastName("User")
                .role(Role.EMPLOYEE)
                .isActive(false)
                .build();
        userRepository.save(inactiveUser);
    }

    @Test
    void login_ShouldSucceed_WhenAccountIsActive() {
        // Given
        CredentialsDto credentials = new CredentialsDto("active@test.com", "password123".toCharArray());

        // When
        UserDto result = userService.login(credentials);

        // Then
        assertNotNull(result);
        assertEquals("active@test.com", result.getEmail());
        assertEquals("Active", result.getFirstName());
        assertTrue(result.getIsActive());
    }

    @Test
    void login_ShouldThrowForbidden_WhenAccountIsInactive() {
        // Given
        CredentialsDto credentials = new CredentialsDto("inactive@test.com", "password123".toCharArray());

        // When & Then
        AppException exception = assertThrows(AppException.class, () -> {
            userService.login(credentials);
        });

        assertEquals(HttpStatus.FORBIDDEN, exception.getHttpStatus());
        assertTrue(exception.getMessage().contains("Account is inactive"));
    }

    @Test
    void login_ShouldThrowNotFound_WhenUserDoesNotExist() {
        // Given
        CredentialsDto credentials = new CredentialsDto("nonexistent@test.com", "password123".toCharArray());

        // When & Then
        AppException exception = assertThrows(AppException.class, () -> {
            userService.login(credentials);
        });

        assertEquals(HttpStatus.NOT_FOUND, exception.getHttpStatus());
        assertTrue(exception.getMessage().contains("Unknown user"));
    }

    @Test
    void login_ShouldThrowBadRequest_WhenPasswordIsWrong() {
        // Given
        CredentialsDto credentials = new CredentialsDto("active@test.com", "wrongpassword".toCharArray());

        // When & Then
        AppException exception = assertThrows(AppException.class, () -> {
            userService.login(credentials);
        });

        assertEquals(HttpStatus.BAD_REQUEST, exception.getHttpStatus());
        assertTrue(exception.getMessage().contains("Invalid password"));
    }

    @Test
    void login_ShouldCheckInactiveBeforePassword_WhenAccountIsInactiveAndPasswordWrong() {
        // Given
        CredentialsDto credentials = new CredentialsDto("inactive@test.com", "wrongpassword".toCharArray());

        // When & Then
        AppException exception = assertThrows(AppException.class, () -> {
            userService.login(credentials);
        });

        // Should throw FORBIDDEN (inactive) not BAD_REQUEST (wrong password)
        assertEquals(HttpStatus.FORBIDDEN, exception.getHttpStatus());
        assertTrue(exception.getMessage().contains("Account is inactive"));
    }
}

