package hu.sztibor.staffi.backend.services;

import hu.sztibor.staffi.backend.dto.accommodation.AccommodationDto;
import hu.sztibor.staffi.backend.dto.accommodation.CreateAccommodationDto;
import hu.sztibor.staffi.backend.dto.accommodation.UpdateAccommodationDto;
import hu.sztibor.staffi.backend.dto.room.*;
import hu.sztibor.staffi.backend.entities.Accommodation;
import hu.sztibor.staffi.backend.entities.Employee;
import hu.sztibor.staffi.backend.entities.Room;
import hu.sztibor.staffi.backend.entities.RoomAllocation;
import hu.sztibor.staffi.backend.enums.AllocationStatus;
import hu.sztibor.staffi.backend.enums.AuditAction;
import hu.sztibor.staffi.backend.exceptions.AppException;
import hu.sztibor.staffi.backend.mappers.AccommodationMapper;
import hu.sztibor.staffi.backend.repositories.AccommodationRepository;
import hu.sztibor.staffi.backend.repositories.EmployeeRepository;
import hu.sztibor.staffi.backend.repositories.RoomAllocationRepository;
import hu.sztibor.staffi.backend.repositories.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccommodationService {

    private final AccommodationRepository accommodationRepository;
    private final RoomRepository roomRepository;
    private final RoomAllocationRepository allocationRepository;
    private final EmployeeRepository employeeRepository;
    private final AccommodationMapper accommodationMapper;
    private final AuditLogService auditLogService;

    /**
     * Get all accommodations (buildings)
     */
    public List<AccommodationDto> getAllAccommodations() {
        return accommodationRepository.findAll()
                .stream()
                .map(accommodationMapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Create new accommodation (building)
     */
    @Transactional
    public AccommodationDto createAccommodation(CreateAccommodationDto dto) {
        Accommodation accommodation = Accommodation.builder()
                .name(dto.getName())
                .address(dto.getAddress())
                .managerContact(dto.getManagerContact())
                .build();

        Accommodation saved = accommodationRepository.save(accommodation);

        java.util.Map<String, Object> newValueMap = new java.util.HashMap<>();
        newValueMap.put("id", saved.getId());
        newValueMap.put("name", saved.getName());
        newValueMap.put("address", saved.getAddress());
        newValueMap.put("managerContact", saved.getManagerContact());
        newValueMap.put("totalCapacity", saved.getTotalCapacity());

        auditLogService.logAction(
            "Accommodation",
            saved.getId(),
            AuditAction.CREATE,
            String.format("Created accommodation: %s at %s", saved.getName(), saved.getAddress()),
            null,
            newValueMap
        );

        return accommodationMapper.toDto(saved);
    }

    /**
     * Update accommodation (building)
     */
    @Transactional
    public AccommodationDto updateAccommodation(Long id, UpdateAccommodationDto dto) {
        Accommodation accommodation = accommodationRepository.findById(id)
                .orElseThrow(() -> new AppException("Accommodation not found", HttpStatus.NOT_FOUND));

        java.util.Map<String, Object> oldValueMap = new java.util.HashMap<>();
        oldValueMap.put("name", accommodation.getName());
        oldValueMap.put("address", accommodation.getAddress());
        oldValueMap.put("managerContact", accommodation.getManagerContact());
        oldValueMap.put("totalCapacity", accommodation.getTotalCapacity());

        if (dto.getName() != null) {
            accommodation.setName(dto.getName());
        }
        if (dto.getAddress() != null) {
            accommodation.setAddress(dto.getAddress());
        }
        if (dto.getManagerContact() != null) {
            accommodation.setManagerContact(dto.getManagerContact());
        }

        Accommodation updated = accommodationRepository.save(accommodation);

        java.util.Map<String, Object> newValueMap = new java.util.HashMap<>();
        newValueMap.put("name", updated.getName());
        newValueMap.put("address", updated.getAddress());
        newValueMap.put("managerContact", updated.getManagerContact());
        newValueMap.put("totalCapacity", updated.getTotalCapacity());

        auditLogService.logAction(
            "Accommodation",
            updated.getId(),
            AuditAction.UPDATE,
            String.format("Updated accommodation: %s", updated.getName()),
            oldValueMap,
            newValueMap
        );

        return accommodationMapper.toDto(updated);
    }

    /**
     * Create new room in an accommodation
     */
    @Transactional
    public RoomDto createRoom(CreateRoomDto dto) {
        Accommodation accommodation = accommodationRepository.findById(dto.getAccommodationId())
                .orElseThrow(() -> new AppException("Accommodation not found", HttpStatus.NOT_FOUND));

        List<Room> existingRooms = roomRepository.findByAccommodationId(dto.getAccommodationId());
        boolean roomExists = existingRooms.stream()
                .anyMatch(r -> r.getRoomNumber().equalsIgnoreCase(dto.getRoomNumber()));

        if (roomExists) {
            throw new AppException(
                    "Room number " + dto.getRoomNumber() + " already exists in this accommodation",
                    HttpStatus.BAD_REQUEST
            );
        }

        Room room = Room.builder()
                .accommodation(accommodation)
                .roomNumber(dto.getRoomNumber())
                .capacity(dto.getCapacity())
                .build();

        Room saved = roomRepository.save(room);

        java.util.Map<String, Object> newValueMap = new java.util.HashMap<>();
        newValueMap.put("id", saved.getId());
        newValueMap.put("roomNumber", saved.getRoomNumber());
        newValueMap.put("capacity", saved.getCapacity());
        newValueMap.put("accommodationId", accommodation.getId());
        newValueMap.put("accommodationName", accommodation.getName());

        auditLogService.logAction(
            "Room",
            saved.getId(),
            AuditAction.CREATE,
            String.format("Created room %s in accommodation %s (capacity: %d)",
                saved.getRoomNumber(), accommodation.getName(), saved.getCapacity()),
            null,
            newValueMap
        );

        return buildRoomDto(saved);
    }

    /**
     * Update room details
     */
    @Transactional
    public RoomDto updateRoom(Long roomId, UpdateRoomDto dto) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new AppException("Room not found", HttpStatus.NOT_FOUND));

        java.util.Map<String, Object> oldValueMap = new java.util.HashMap<>();
        oldValueMap.put("roomNumber", room.getRoomNumber());
        oldValueMap.put("capacity", room.getCapacity());

        if (dto.getRoomNumber() != null && !dto.getRoomNumber().equals(room.getRoomNumber())) {
            List<Room> existingRooms = roomRepository.findByAccommodationId(room.getAccommodation().getId());
            boolean roomExists = existingRooms.stream()
                    .anyMatch(r -> !r.getId().equals(roomId) &&
                                   r.getRoomNumber().equalsIgnoreCase(dto.getRoomNumber()));

            if (roomExists) {
                throw new AppException(
                        "Room number " + dto.getRoomNumber() + " already exists in this accommodation",
                        HttpStatus.BAD_REQUEST
                );
            }
            room.setRoomNumber(dto.getRoomNumber());
        }

        if (dto.getCapacity() != null) {
            List<RoomAllocation> activeAllocations = allocationRepository
                    .findByRoomIdAndStatus(roomId, AllocationStatus.ACTIVE);

            if (dto.getCapacity() < activeAllocations.size()) {
                throw new AppException(
                        "Cannot reduce capacity below current occupancy (" +
                        activeAllocations.size() + " occupants)",
                        HttpStatus.BAD_REQUEST
                );
            }
            room.setCapacity(dto.getCapacity());
        }

        Room updated = roomRepository.save(room);

        java.util.Map<String, Object> newValueMap = new java.util.HashMap<>();
        newValueMap.put("roomNumber", updated.getRoomNumber());
        newValueMap.put("capacity", updated.getCapacity());

        auditLogService.logAction(
            "Room",
            updated.getId(),
            AuditAction.UPDATE,
            String.format("Updated room %s in accommodation %s",
                updated.getRoomNumber(), updated.getAccommodation().getName()),
            oldValueMap,
            newValueMap
        );

        return buildRoomDto(updated);
    }

    /**
     * Delete room (only if no active allocations)
     */
    @Transactional
    public void deleteRoom(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new AppException("Room not found", HttpStatus.NOT_FOUND));

        List<RoomAllocation> activeAllocations = allocationRepository
                .findByRoomIdAndStatus(roomId, AllocationStatus.ACTIVE);

        if (!activeAllocations.isEmpty()) {
            throw new AppException(
                    "Cannot delete room with active allocations. " +
                    "Currently " + activeAllocations.size() + " employee(s) living here.",
                    HttpStatus.BAD_REQUEST
            );
        }

        auditLogService.logAction(
            "Room",
            room.getId(),
            AuditAction.DELETE,
            String.format("Deleted room %s from accommodation %s",
                room.getRoomNumber(), room.getAccommodation().getName())
        );

        roomRepository.delete(room);
    }

    /**
     * Get all rooms in an accommodation with current occupancy info
     */
    public List<RoomDto> getRoomsByAccommodation(Long accommodationId) {
        accommodationRepository.findById(accommodationId)
                .orElseThrow(() -> new AppException("Accommodation not found", HttpStatus.NOT_FOUND));

        List<Room> rooms = roomRepository.findByAccommodationId(accommodationId);

        return rooms.stream()
                .map(this::buildRoomDto)
                .collect(Collectors.toList());
    }

    /**
     * Create new room allocation (check-in)
     */
    @Transactional
    public RoomAllocationDto createAllocation(CreateAllocationDto dto) {
        Room room = roomRepository.findById(dto.getRoomId())
                .orElseThrow(() -> new AppException("Room not found", HttpStatus.NOT_FOUND));

        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new AppException("Employee not found", HttpStatus.NOT_FOUND));

        List<RoomAllocation> activeAllocations = allocationRepository
                .findByEmployeeIdAndStatus(dto.getEmployeeId(), AllocationStatus.ACTIVE);

        if (!activeAllocations.isEmpty()) {
            throw new AppException(
                    "Employee already has an active room allocation in room " +
                    activeAllocations.get(0).getRoom().getRoomNumber(),
                    HttpStatus.BAD_REQUEST
            );
        }

        List<RoomAllocation> currentOccupants = allocationRepository
                .findByRoomIdAndStatus(dto.getRoomId(), AllocationStatus.ACTIVE);

        if (currentOccupants.size() >= room.getCapacity()) {
            throw new AppException("Room is at full capacity", HttpStatus.BAD_REQUEST);
        }

        RoomAllocation allocation = RoomAllocation.builder()
                .room(room)
                .employee(employee)
                .checkInDate(dto.getCheckInDate() != null ? dto.getCheckInDate() : LocalDate.now())
                .status(AllocationStatus.ACTIVE)
                .build();

        RoomAllocation saved = allocationRepository.save(allocation);

        java.util.Map<String, Object> newValueMap = new java.util.HashMap<>();
        newValueMap.put("id", saved.getId());
        newValueMap.put("roomId", room.getId());
        newValueMap.put("roomNumber", room.getRoomNumber());
        newValueMap.put("employeeId", employee.getId());
        newValueMap.put("employeeName", employee.getUser().getLastName() + " " + employee.getUser().getFirstName());
        newValueMap.put("checkInDate", saved.getCheckInDate());
        newValueMap.put("status", saved.getStatus().name());

        auditLogService.logAction(
            "RoomAllocation",
            saved.getId(),
            AuditAction.CREATE,
            String.format("Employee %s %s checked into room %s (accommodation: %s)",
                employee.getUser().getFirstName(),
                employee.getUser().getLastName(),
                room.getRoomNumber(),
                room.getAccommodation().getName()),
            null,
            newValueMap
        );

        return buildAllocationDto(saved);
    }

    /**
     * Check out employee from room
     */
    @Transactional
    public RoomAllocationDto checkOut(Long allocationId, LocalDate checkOutDate) {
        RoomAllocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new AppException("Allocation not found", HttpStatus.NOT_FOUND));

        if (allocation.getStatus() == AllocationStatus.CHECKED_OUT) {
            throw new AppException("Employee already checked out", HttpStatus.BAD_REQUEST);
        }

        allocation.setCheckOutDate(checkOutDate != null ? checkOutDate : LocalDate.now());
        allocation.setStatus(AllocationStatus.CHECKED_OUT);

        RoomAllocation updated = allocationRepository.save(allocation);

        java.util.Map<String, Object> oldValueMap = new java.util.HashMap<>();
        oldValueMap.put("status", "ACTIVE");
        oldValueMap.put("checkOutDate", null);

        java.util.Map<String, Object> newValueMap = new java.util.HashMap<>();
        newValueMap.put("status", updated.getStatus().name());
        newValueMap.put("checkOutDate", updated.getCheckOutDate());

        auditLogService.logAction(
            "RoomAllocation",
            updated.getId(),
            AuditAction.UPDATE,
            String.format("Employee %s %s checked out from room %s (accommodation: %s)",
                allocation.getEmployee().getUser().getFirstName(),
                allocation.getEmployee().getUser().getLastName(),
                allocation.getRoom().getRoomNumber(),
                allocation.getRoom().getAccommodation().getName()),
            oldValueMap,
            newValueMap
        );

        return buildAllocationDto(updated);
    }

    /**
     * Get room allocation history for an employee
     * Returns all past and current room allocations ordered by check-in date (newest first)
     */
    public List<RoomAllocationDto> getEmployeeRoomHistory(Long employeeId) {
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new AppException("Employee not found", HttpStatus.NOT_FOUND));

        List<RoomAllocation> allocations = allocationRepository
                .findByEmployeeIdOrderByCheckInDateDesc(employeeId);

        return allocations.stream()
                .map(this::buildAllocationDto)
                .collect(Collectors.toList());
    }

    /**
     * Build RoomDto with occupancy information
     */
    private RoomDto buildRoomDto(Room room) {
        List<RoomAllocation> activeAllocations = allocationRepository
                .findByRoomIdAndStatus(room.getId(), AllocationStatus.ACTIVE);

        List<RoomDto.Occupant> occupants = activeAllocations.stream()
                .map(allocation -> RoomDto.Occupant.builder()
                        .allocationId(allocation.getId())
                        .employeeId(allocation.getEmployee().getId())
                        .employeeName(allocation.getEmployee().getUser().getLastName() + " " +
                                     allocation.getEmployee().getUser().getFirstName())
                        .companyName(allocation.getEmployee().getCompanyName())
                        .checkInDate(allocation.getCheckInDate())
                        .build())
                .collect(Collectors.toList());

        return RoomDto.builder()
                .id(room.getId())
                .roomNumber(room.getRoomNumber())
                .capacity(room.getCapacity())
                .currentOccupancy(activeAllocations.size())
                .currentOccupants(occupants)
                .build();
    }

    /**
     * Build RoomAllocationDto from entity
     */
    private RoomAllocationDto buildAllocationDto(RoomAllocation allocation) {
        return RoomAllocationDto.builder()
                .id(allocation.getId())
                .roomId(allocation.getRoom().getId())
                .roomNumber(allocation.getRoom().getRoomNumber())
                .employeeId(allocation.getEmployee().getId())
                .employeeName(allocation.getEmployee().getUser().getFirstName() + " " +
                             allocation.getEmployee().getUser().getLastName())
                .checkInDate(allocation.getCheckInDate())
                .checkOutDate(allocation.getCheckOutDate())
                .status(allocation.getStatus())
                .build();
    }
}

