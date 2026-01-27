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
public class UpdateEmployeeDto {

    private String firstName;
    private String lastName;
    private String email;
    private Boolean isActive;

    private String taxId;
    private String tajNumber;
    private String idCardNumber;

    private String primaryAddress;
    private String phoneNumber;
    private String nationality;

    private String companyName;
    private LocalDate startDate;

    private String roomNumber; // Can assign/change room, or set to null to unassign
}

