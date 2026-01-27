package hu.sztibor.staffi.backend.dto.accommodation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AccommodationDto {
    private Long id;
    private String name;
    private String address;
    private String managerContact;
    private Integer totalCapacity;
}

