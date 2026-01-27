package hu.sztibor.staffi.backend.dto.employee;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EmployeeDto {

    private Long id;

    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private Boolean isActive;

    private String taxId;
    private String tajNumber;
    private String idCardNumber;

    private String primaryAddress;
    private String phoneNumber;
    private String nationality;
    private LocalDate birthDate;

    private String companyName;
    private LocalDate startDate;

    private String roomNumber; // Current room assignment (null if not assigned)
}

