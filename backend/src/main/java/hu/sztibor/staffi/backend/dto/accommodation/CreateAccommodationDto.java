package hu.sztibor.staffi.backend.dto.accommodation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateAccommodationDto {
    private String name;
    private String address;
    private String managerContact;
    // Note: totalCapacity removed - automatically calculated from rooms
}

