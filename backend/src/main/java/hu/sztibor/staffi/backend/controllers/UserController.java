package hu.sztibor.staffi.backend.controllers;

import hu.sztibor.staffi.backend.dto.auth.UserDto;
import hu.sztibor.staffi.backend.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Endpoints for managing all users (ADMIN, HR, EMPLOYEE)")
public class UserController {

    private final UserService userService;

    /**
     * GET /api/users
     * Get all users (ADMIN, HR, EMPLOYEE) with optional filters
     * Only accessible by ADMIN
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all users", description = "Retrieve all users including ADMIN, HR, and EMPLOYEE roles (ADMIN only)")
    public ResponseEntity<List<UserDto>> getAllUsers(
            @Parameter(description = "Filter by role (ADMIN, HR, EMPLOYEE)")
            @RequestParam(required = false) String role,
            @Parameter(description = "Filter by active status (true/false)")
            @RequestParam(required = false) Boolean isActive,
            @Parameter(description = "Search by name or email")
            @RequestParam(required = false) String search
    ) {
        List<UserDto> users = userService.getAllUsers(role, isActive, search);
        return ResponseEntity.ok(users);
    }

    /**
     * GET /api/users/{id}
     * Get user by ID (any role)
     * Only accessible by ADMIN
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user by ID", description = "Retrieve user details by ID (ADMIN only)")
    public ResponseEntity<UserDto> getUserById(
            @Parameter(description = "User ID")
            @PathVariable Long id
    ) {
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    /**
     * PUT /api/users/{id}/toggle-active
     * Activate or deactivate a user account
     * Only accessible by ADMIN
     */
    @PutMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle user active status", description = "Activate or deactivate a user account (ADMIN only)")
    public ResponseEntity<UserDto> toggleUserActiveStatus(
            @Parameter(description = "User ID")
            @PathVariable Long id
    ) {
        UserDto user = userService.toggleUserActiveStatus(id);
        return ResponseEntity.ok(user);
    }
}

