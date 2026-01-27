package hu.sztibor.staffi.backend.controllers;

import hu.sztibor.staffi.backend.config.UserAuthProvider;
import hu.sztibor.staffi.backend.dto.auth.ChangePasswordDto;
import hu.sztibor.staffi.backend.dto.auth.CredentialsDto;
import hu.sztibor.staffi.backend.dto.auth.UserDto;
import hu.sztibor.staffi.backend.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for user authentication")
public class AuthController {

    private final UserService userService;
    private final UserAuthProvider userAuthProvider;

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate user and get JWT token")
    public ResponseEntity<UserDto> login(@RequestBody CredentialsDto credentialsDto) {
        UserDto user = userService.login(credentialsDto);
        user.setToken(userAuthProvider.createToken(user));
        return ResponseEntity.ok(user);
    }

    @PutMapping("/change-password")
    @Operation(summary = "Change password", description = "Change the current user's password")
    public ResponseEntity<String> changePassword(@RequestBody ChangePasswordDto changePasswordDto) {
        userService.changePassword(changePasswordDto);
        return ResponseEntity.ok("Password changed successfully");
    }
}
