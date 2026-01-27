package hu.sztibor.staffi.backend.dto.advance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReviewAdvanceRequestDto {
    private String status;
    private String rejectionReason;
}

