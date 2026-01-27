package hu.sztibor.staffi.backend.dto.accommodation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateAccommodationDto {
    private String name;
    private String address;
    private String managerContact;
    // Note: totalCapacity removed - now automatically calculated from rooms
}

