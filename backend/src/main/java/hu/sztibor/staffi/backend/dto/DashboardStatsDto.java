package hu.sztibor.staffi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DashboardStatsDto {

    private Long totalEmployees;
    private Long activeEmployees;
    private Long inactiveEmployees;

    private Long totalRooms;
    private Long occupiedRooms;
    private Long availableRooms;
    private Long totalCapacity;
    private Long currentOccupancy;

    private Long totalAdvanceRequests;
    private Long pendingAdvanceRequests;
    private Long approvedAdvanceRequests;
    private Long rejectedAdvanceRequests;

    private Long newEmployeesThisMonth;
    private Long checkInsThisMonth;
}

