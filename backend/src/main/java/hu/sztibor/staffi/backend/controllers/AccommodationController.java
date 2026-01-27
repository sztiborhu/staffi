package hu.sztibor.staffi.backend.controllers;

import hu.sztibor.staffi.backend.dto.accommodation.AccommodationDto;
import hu.sztibor.staffi.backend.dto.accommodation.CreateAccommodationDto;
import hu.sztibor.staffi.backend.dto.accommodation.UpdateAccommodationDto;
import hu.sztibor.staffi.backend.dto.room.*;
import hu.sztibor.staffi.backend.services.AccommodationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/accommodations")
@RequiredArgsConstructor
@Tag(name = "Accommodation Management", description = "Endpoints for managing accommodations, rooms, and room allocations")
public class AccommodationController {

    private final AccommodationService accommodationService;

    /**
     * GET /api/accommodations
     * Get list of all accommodations (buildings)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Get all accommodations", description = "Retrieve list of all accommodation buildings")
    public ResponseEntity<List<AccommodationDto>> getAllAccommodations() {
        List<AccommodationDto> accommodations = accommodationService.getAllAccommodations();
        return ResponseEntity.ok(accommodations);
    }

    /**
     * POST /api/accommodations
     * Create new accommodation (building)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create accommodation", description = "Create a new accommodation building")
    public ResponseEntity<AccommodationDto> createAccommodation(
            @RequestBody CreateAccommodationDto createAccommodationDto
    ) {
        AccommodationDto accommodation = accommodationService.createAccommodation(createAccommodationDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(accommodation);
    }

    /**
     * PUT /api/accommodations/{id}
     * Update accommodation details
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update accommodation", description = "Update accommodation building details")
    public ResponseEntity<AccommodationDto> updateAccommodation(
            @Parameter(description = "Accommodation ID")
            @PathVariable Long id,
            @RequestBody UpdateAccommodationDto updateAccommodationDto
    ) {
        AccommodationDto accommodation = accommodationService.updateAccommodation(id, updateAccommodationDto);
        return ResponseEntity.ok(accommodation);
    }

    /**
     * GET /api/accommodations/{id}/rooms
     * Get all rooms in an accommodation with current occupancy
     */
    @GetMapping("/{id}/rooms")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Get rooms by accommodation", description = "Retrieve all rooms in a specific accommodation with current occupancy information")
    public ResponseEntity<List<RoomDto>> getRoomsByAccommodation(
            @Parameter(description = "Accommodation ID")
            @PathVariable Long id
    ) {
        List<RoomDto> rooms = accommodationService.getRoomsByAccommodation(id);
        return ResponseEntity.ok(rooms);
    }

    /**
     * POST /api/accommodations/{id}/rooms
     * Create a new room in an accommodation
     */
    @PostMapping("/{id}/rooms")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create room", description = "Create a new room in a specific accommodation")
    public ResponseEntity<RoomDto> createRoom(
            @Parameter(description = "Accommodation ID")
            @PathVariable Long id,
            @RequestBody CreateRoomDto createRoomDto
    ) {
        // Set the accommodation ID from path variable
        createRoomDto.setAccommodationId(id);
        RoomDto room = accommodationService.createRoom(createRoomDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(room);
    }

    /**
     * DELETE /api/accommodations/rooms/{roomId}
     * Delete a room (only if no active allocations)
     */
    @DeleteMapping("/rooms/{roomId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete room", description = "Delete a room (only allowed if no employees are currently living there)")
    public ResponseEntity<Void> deleteRoom(
            @Parameter(description = "Room ID")
            @PathVariable Long roomId
    ) {
        accommodationService.deleteRoom(roomId);
        return ResponseEntity.noContent().build();
    }

    /**
     * PUT /api/accommodations/rooms/{roomId}
     * Update room details (room number, capacity)
     */
    @PutMapping("/rooms/{roomId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update room", description = "Update room details such as room number or capacity")
    public ResponseEntity<RoomDto> updateRoom(
            @Parameter(description = "Room ID")
            @PathVariable Long roomId,
            @RequestBody UpdateRoomDto updateRoomDto
    ) {
        RoomDto room = accommodationService.updateRoom(roomId, updateRoomDto);
        return ResponseEntity.ok(room);
    }

    /**
     * POST /api/accommodations/allocations
     * Create new room allocation (check-in employee to a room)
     */
    @PostMapping("/allocations")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Check-in employee", description = "Create a new room allocation (employee check-in)")
    public ResponseEntity<RoomAllocationDto> createAllocation(
            @RequestBody CreateAllocationDto createAllocationDto
    ) {
        RoomAllocationDto allocation = accommodationService.createAllocation(createAllocationDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(allocation);
    }

    /**
     * PUT /api/accommodations/allocations/{id}/checkout
     * Check out employee from room
     */
    @PutMapping("/allocations/{id}/checkout")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Check-out employee", description = "Check out an employee from their room")
    public ResponseEntity<RoomAllocationDto> checkOut(
            @Parameter(description = "Allocation ID")
            @PathVariable Long id,
            @Parameter(description = "Check-out date (optional, defaults to today)")
            @RequestParam(required = false) LocalDate checkOutDate
    ) {
        RoomAllocationDto allocation = accommodationService.checkOut(id, checkOutDate);
        return ResponseEntity.ok(allocation);
    }

    /**
     * GET /api/accommodations/employees/{employeeId}/room-history
     * Get room allocation history for an employee
     */
    @GetMapping("/employees/{employeeId}/room-history")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Get employee room history",
               description = "Retrieve all past and current room allocations for an employee (ADMIN/HR only)")
    public ResponseEntity<List<RoomAllocationDto>> getEmployeeRoomHistory(
            @Parameter(description = "Employee ID")
            @PathVariable Long employeeId
    ) {
        List<RoomAllocationDto> history = accommodationService.getEmployeeRoomHistory(employeeId);
        return ResponseEntity.ok(history);
    }
}
