package hu.sztibor.staffi.backend.dto.room;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateRoomDto {
    private String roomNumber;
    private Integer capacity;
}

