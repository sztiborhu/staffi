package hu.sztibor.staffi.backend.services;

import hu.sztibor.staffi.backend.dto.auth.ChangePasswordDto;
import hu.sztibor.staffi.backend.dto.auth.CredentialsDto;
import hu.sztibor.staffi.backend.dto.auth.UserDto;
import hu.sztibor.staffi.backend.entities.User;
import hu.sztibor.staffi.backend.enums.AuditAction;
import hu.sztibor.staffi.backend.enums.Role;
import hu.sztibor.staffi.backend.exceptions.AppException;
import hu.sztibor.staffi.backend.mappers.UserMapper;
import hu.sztibor.staffi.backend.repositories.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.CharBuffer;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final AuditLogService auditLogService;

    public UserDto login(CredentialsDto credentialsDto) {
        User user = userRepository.findUserByEmail(credentialsDto.email())
                .orElseThrow(() -> new AppException("Unknown user", HttpStatus.NOT_FOUND));

        // Check if account is active
        if (!user.isActive()) {
            // Audit log for failed login attempt (inactive account)
            auditLogService.logAction(
                "User",
                user.getId(),
                AuditAction.LOGIN,
                String.format("Login denied for inactive user %s (%s)", user.getEmail(), user.getRole())
            );
            throw new AppException("Account is inactive. Please contact an administrator.", HttpStatus.FORBIDDEN);
        }

        if (passwordEncoder.matches(CharBuffer.wrap(credentialsDto.password()), user.getPassword())) {
            UserDto userDto = userMapper.toUserDto(user);

            // Audit log for successful login
            auditLogService.logAction(
                "User",
                user.getId(),
                AuditAction.LOGIN,
                String.format("User %s (%s) logged in successfully", user.getEmail(), user.getRole())
            );

            return userDto;
        }

        throw new AppException("Invalid password", HttpStatus.BAD_REQUEST);
    }

    /**
     * Change password for the currently authenticated user
     */
    @Transactional
    public void changePassword(ChangePasswordDto dto) {
        // Get current user from SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName().equals("anonymousUser")) {
            throw new AppException("Authentication required", HttpStatus.UNAUTHORIZED);
        }

        UserDto currentUser = (UserDto) authentication.getPrincipal();

        // Find user in database
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        // Verify old password
        if (!passwordEncoder.matches(CharBuffer.wrap(dto.getOldPassword()), user.getPassword())) {
            throw new AppException("Old password is incorrect", HttpStatus.BAD_REQUEST);
        }

        // Validate new password (basic validation)
        if (dto.getNewPassword() == null || dto.getNewPassword().length() < 6) {
            throw new AppException("New password must be at least 6 characters long", HttpStatus.BAD_REQUEST);
        }

        // Update password
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * Get all users with optional filters (ADMIN only)
     * Returns all users including ADMIN, HR, and EMPLOYEE roles
     */
    public List<UserDto> getAllUsers(String roleFilter, Boolean isActive, String search) {
        Specification<User> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Filter by role if provided
            if (roleFilter != null && !roleFilter.trim().isEmpty()) {
                try {
                    Role role = Role.valueOf(roleFilter.toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("role"), role));
                } catch (IllegalArgumentException e) {
                    // Invalid role, ignore filter
                }
            }

            // Filter by active status
            if (isActive != null) {
                predicates.add(criteriaBuilder.equal(root.get("isActive"), isActive));
            }

            // Search by name or email
            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Predicate firstNameMatch = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("firstName")),
                    searchPattern
                );
                Predicate lastNameMatch = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("lastName")),
                    searchPattern
                );
                Predicate emailMatch = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("email")),
                    searchPattern
                );
                predicates.add(criteriaBuilder.or(firstNameMatch, lastNameMatch, emailMatch));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        List<User> users = userRepository.findAll(spec);
        return users.stream()
                .map(userMapper::toUserDto)
                .collect(Collectors.toList());
    }

    /**
     * Get user by ID (ADMIN only)
     */
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        return userMapper.toUserDto(user);
    }

    /**
     * Toggle user active status (ADMIN only)
     * Activates inactive users and deactivates active users
     * Prevents admins from deactivating themselves
     */
    @Transactional
    public UserDto toggleUserActiveStatus(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException("Authentication required", HttpStatus.UNAUTHORIZED);
        }

        UserDto currentUser = (UserDto) authentication.getPrincipal();

        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        if (currentUser.getId().equals(id) && user.isActive()) {
            throw new AppException("You cannot deactivate your own account", HttpStatus.BAD_REQUEST);
        }

        boolean oldStatus = user.isActive();
        user.setActive(!oldStatus);
        User savedUser = userRepository.save(user);

        auditLogService.logAction(
            "User",
            user.getId(),
            AuditAction.UPDATE,
            String.format("User %s status changed from %s to %s",
                user.getEmail(),
                oldStatus ? "active" : "inactive",
                !oldStatus ? "active" : "inactive")
        );

        return userMapper.toUserDto(savedUser);
    }
}
