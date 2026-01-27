package hu.sztibor.staffi.backend.services;

import hu.sztibor.staffi.backend.dto.DashboardStatsDto;
import hu.sztibor.staffi.backend.enums.AdvanceStatus;
import hu.sztibor.staffi.backend.enums.AllocationStatus;
import hu.sztibor.staffi.backend.enums.Role;
import hu.sztibor.staffi.backend.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final RoomRepository roomRepository;
    private final RoomAllocationRepository roomAllocationRepository;
    private final AdvanceRequestRepository advanceRequestRepository;
    private final UserRepository userRepository;

    /**
     * Get all dashboard statistics
     */
    public DashboardStatsDto getDashboardStats() {
        log.info("Fetching dashboard statistics");

        Long totalEmployees = employeeRepository.count();
        Long activeEmployees = userRepository.countByRoleAndIsActive(Role.EMPLOYEE, true);
        Long inactiveEmployees = totalEmployees - activeEmployees;

        Long totalRooms = roomRepository.count();
        Long totalCapacity = roomRepository.findAll().stream()
                .mapToLong(room -> room.getCapacity())
                .sum();

        Long currentOccupancy = roomAllocationRepository.countByStatus(AllocationStatus.ACTIVE);

        Long occupiedRooms = roomRepository.findAll().stream()
                .filter(room -> roomAllocationRepository
                        .findByRoomIdAndStatus(room.getId(), AllocationStatus.ACTIVE)
                        .size() > 0)
                .count();

        Long availableRooms = totalRooms - occupiedRooms;

        Long totalAdvanceRequests = advanceRequestRepository.count();
        Long pendingAdvanceRequests = advanceRequestRepository.countByStatus(AdvanceStatus.PENDING);
        Long approvedAdvanceRequests = advanceRequestRepository.countByStatus(AdvanceStatus.APPROVED);
        Long rejectedAdvanceRequests = advanceRequestRepository.countByStatus(AdvanceStatus.REJECTED);

        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        Long newEmployeesThisMonth = userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.EMPLOYEE &&
                               user.getCreatedAt() != null &&
                               user.getCreatedAt().isAfter(startOfMonth))
                .count();

        Long checkInsThisMonth = roomAllocationRepository.findAll().stream()
                .filter(allocation -> allocation.getCheckInDate() != null &&
                                     allocation.getCheckInDate().isAfter(startOfMonth.toLocalDate()))
                .count();

        return DashboardStatsDto.builder()
                .totalEmployees(totalEmployees)
                .activeEmployees(activeEmployees)
                .inactiveEmployees(inactiveEmployees)
                .totalRooms(totalRooms)
                .occupiedRooms(occupiedRooms)
                .availableRooms(availableRooms)
                .totalCapacity(totalCapacity)
                .currentOccupancy(currentOccupancy)
                .totalAdvanceRequests(totalAdvanceRequests)
                .pendingAdvanceRequests(pendingAdvanceRequests)
                .approvedAdvanceRequests(approvedAdvanceRequests)
                .rejectedAdvanceRequests(rejectedAdvanceRequests)
                .newEmployeesThisMonth(newEmployeesThisMonth)
                .checkInsThisMonth(checkInsThisMonth)
                .build();
    }
}

