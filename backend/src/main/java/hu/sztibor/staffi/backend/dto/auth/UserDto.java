package hu.sztibor.staffi.backend.dto.auth;

import hu.sztibor.staffi.backend.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Role role;
    private String token;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
