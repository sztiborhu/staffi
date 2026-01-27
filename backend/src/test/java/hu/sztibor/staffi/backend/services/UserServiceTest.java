package hu.sztibor.staffi.backend.services;

import hu.sztibor.staffi.backend.dto.auth.CredentialsDto;
import hu.sztibor.staffi.backend.dto.auth.UserDto;
import hu.sztibor.staffi.backend.entities.User;
import hu.sztibor.staffi.backend.enums.Role;
import hu.sztibor.staffi.backend.exceptions.AppException;
import hu.sztibor.staffi.backend.mappers.UserMapper;
import hu.sztibor.staffi.backend.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.CharBuffer;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserService
 * Uses Mockito to mock dependencies
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UserDto testUserDto;
    private CredentialsDto credentialsDto;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("hashedPassword")
                .firstName("Test")
                .lastName("User")
                .role(Role.ADMIN)
                .isActive(true)
                .build();

        testUserDto = UserDto.builder()
                .id(1L)
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .role(Role.ADMIN)
                .build();

        credentialsDto = new CredentialsDto("test@example.com", "password123".toCharArray());
    }

    @Test
    void login_ShouldReturnUserDto_WhenCredentialsAreValid() {
        // Given
        when(userRepository.findUserByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(any(CharSequence.class), eq("hashedPassword")))
                .thenReturn(true);
        when(userMapper.toUserDto(testUser))
                .thenReturn(testUserDto);

        // When
        UserDto result = userService.login(credentialsDto);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("test@example.com");
        assertThat(result.getRole()).isEqualTo(Role.ADMIN);

        verify(userRepository).findUserByEmail("test@example.com");
        verify(passwordEncoder).matches(any(CharSequence.class), eq("hashedPassword"));
        verify(userMapper).toUserDto(testUser);
    }

    @Test
    void login_ShouldThrowException_WhenUserNotFound() {
        // Given
        when(userRepository.findUserByEmail("test@example.com"))
                .thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> userService.login(credentialsDto))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Unknown user");

        verify(userRepository).findUserByEmail("test@example.com");
        verify(passwordEncoder, never()).matches(any(), any());
        verify(userMapper, never()).toUserDto(any());
    }

    @Test
    void login_ShouldThrowException_WhenPasswordIsInvalid() {
        // Given
        when(userRepository.findUserByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(any(CharSequence.class), eq("hashedPassword")))
                .thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> userService.login(credentialsDto))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Invalid password");

        verify(userRepository).findUserByEmail("test@example.com");
        verify(passwordEncoder).matches(any(CharSequence.class), eq("hashedPassword"));
        verify(userMapper, never()).toUserDto(any());
    }
}

