package hu.sztibor.staffi.backend.services;

import hu.sztibor.staffi.backend.dto.employee.CreateEmployeeDto;
import hu.sztibor.staffi.backend.dto.employee.EmployeeDto;
import hu.sztibor.staffi.backend.dto.employee.UpdateEmployeeDto;
import hu.sztibor.staffi.backend.dto.auth.UserDto;
import hu.sztibor.staffi.backend.dto.room.MyRoomInfoDto;
import hu.sztibor.staffi.backend.dto.room.RoomAllocationDto;
import hu.sztibor.staffi.backend.dto.room.RoomOccupantDto;
import hu.sztibor.staffi.backend.entities.Employee;
import hu.sztibor.staffi.backend.entities.Room;
import hu.sztibor.staffi.backend.entities.RoomAllocation;
import hu.sztibor.staffi.backend.entities.User;
import hu.sztibor.staffi.backend.enums.AllocationStatus;
import hu.sztibor.staffi.backend.enums.AuditAction;
import hu.sztibor.staffi.backend.enums.Role;
import hu.sztibor.staffi.backend.exceptions.AppException;
import hu.sztibor.staffi.backend.mappers.EmployeeMapper;
import hu.sztibor.staffi.backend.repositories.EmployeeRepository;
import hu.sztibor.staffi.backend.repositories.RoomAllocationRepository;
import hu.sztibor.staffi.backend.repositories.RoomRepository;
import hu.sztibor.staffi.backend.repositories.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final EmployeeMapper employeeMapper;
    private final PasswordEncoder passwordEncoder;
    private final RoomAllocationRepository roomAllocationRepository;
    private final RoomRepository roomRepository;
    private final AuditLogService auditLogService;

    /**
     * Get all employees with optional filters
     * Only returns users with EMPLOYEE role (excludes ADMIN and HR)
     * Sorted alphabetically by last name, then first name
     */
    public List<EmployeeDto> getAllEmployees(Boolean isActive, String search) {
        Specification<Employee> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(criteriaBuilder.equal(root.get("user").get("role"), Role.EMPLOYEE));

            if (isActive != null) {
                predicates.add(criteriaBuilder.equal(root.get("user").get("isActive"), isActive));
            }

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Predicate firstNameMatch = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("user").get("firstName")),
                    searchPattern
                );
                Predicate lastNameMatch = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("user").get("lastName")),
                    searchPattern
                );
                Predicate emailMatch = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("user").get("email")),
                    searchPattern
                );
                predicates.add(criteriaBuilder.or(firstNameMatch, lastNameMatch, emailMatch));
            }

            query.orderBy(
                criteriaBuilder.asc(root.get("user").get("lastName")),
                criteriaBuilder.asc(root.get("user").get("firstName"))
            );

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        List<Employee> employees = employeeRepository.findAll(spec);
        return employees.stream()
                .map(this::mapToEmployeeDtoWithRoom)
                .collect(Collectors.toList());
    }

    /**
     * Get current employee's own data
     * For EMPLOYEE role to access their profile without knowing their employee ID
     */
    public EmployeeDto getCurrentEmployeeData() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName().equals("anonymousUser")) {
            throw new AppException("Authentication required", HttpStatus.UNAUTHORIZED);
        }

        UserDto currentUser = (UserDto) authentication.getPrincipal();

        Employee employee = employeeRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new AppException("Employee profile not found", HttpStatus.NOT_FOUND));

        log.info("Employee {} accessing their own data (Employee ID: {})",
                 currentUser.getEmail(), employee.getId());

        return mapToEmployeeDtoWithRoom(employee);
    }

    /**
     * Get current employee's room information with occupants
     * For EMPLOYEE role to see who they're sharing a room with
     */
    public MyRoomInfoDto getMyRoomInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName().equals("anonymousUser")) {
            throw new AppException("Authentication required", HttpStatus.UNAUTHORIZED);
        }

        UserDto currentUser = (UserDto) authentication.getPrincipal();

        Employee employee = employeeRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new AppException("Employee profile not found", HttpStatus.NOT_FOUND));

        List<RoomAllocation> activeAllocations = roomAllocationRepository
                .findByEmployeeIdAndStatus(employee.getId(), AllocationStatus.ACTIVE);

        if (activeAllocations.isEmpty()) {
            throw new AppException("You are not currently assigned to a room", HttpStatus.NOT_FOUND);
        }

        RoomAllocation myAllocation = activeAllocations.get(0);
        Room room = myAllocation.getRoom();

        List<RoomAllocation> roomAllocations = roomAllocationRepository
                .findByRoomIdAndStatus(room.getId(), AllocationStatus.ACTIVE);

        List<RoomOccupantDto> occupants = roomAllocations.stream()
                .map(allocation -> {
                    Employee occupant = allocation.getEmployee();
                    User occupantUser = occupant.getUser();

                    return RoomOccupantDto.builder()
                            .name(occupantUser.getLastName() + " " + occupantUser.getFirstName())
                            .phoneNumber(occupant.getPhoneNumber())
                            .email(occupantUser.getEmail())
                            .build();
                })
                .collect(Collectors.toList());

        return MyRoomInfoDto.builder()
                .roomId(room.getId())
                .roomNumber(room.getRoomNumber())
                .accommodationName(room.getAccommodation().getName())
                .accommodationAddress(room.getAccommodation().getAddress())
                .roomCapacity(room.getCapacity())
                .checkInDate(myAllocation.getCheckInDate())
                .occupants(occupants)
                .build();
    }

    /**
     * Get the current employee's room allocation history
     * Returns all past and current room allocations ordered by check-in date (newest first)
     */
    public List<RoomAllocationDto> getMyRoomHistory() {
        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName().equals("anonymousUser")) {
            throw new AppException("Authentication required", HttpStatus.UNAUTHORIZED);
        }

        UserDto currentUser = (UserDto) authentication.getPrincipal();

        Employee employee = employeeRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new AppException("Employee profile not found", HttpStatus.NOT_FOUND));

        List<RoomAllocation> allocations = roomAllocationRepository
                .findByEmployeeIdOrderByCheckInDateDesc(employee.getId());

        log.info("Employee {} ({}) accessed room history - {} allocations found",
                currentUser.getEmail(), employee.getId(), allocations.size());

        return allocations.stream()
                .map(allocation -> RoomAllocationDto.builder()
                        .id(allocation.getId())
                        .roomId(allocation.getRoom().getId())
                        .roomNumber(allocation.getRoom().getRoomNumber())
                        .employeeId(employee.getId())
                        .employeeName(currentUser.getFirstName() + " " + currentUser.getLastName())
                        .checkInDate(allocation.getCheckInDate())
                        .checkOutDate(allocation.getCheckOutDate())
                        .status(allocation.getStatus())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Get employee by ID
     * ADMIN/HR only - employees use getCurrentEmployeeData() via /employees/me
     */
    public EmployeeDto getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new AppException("Employee not found", HttpStatus.NOT_FOUND));

        return mapToEmployeeDtoWithRoom(employee);
    }

    /**
     * Map Employee to EmployeeDto and include current room assignment
     */
    private EmployeeDto mapToEmployeeDtoWithRoom(Employee employee) {
        EmployeeDto dto = employeeMapper.toEmployeeDto(employee);

        List<RoomAllocation> activeAllocations = roomAllocationRepository
                .findByEmployeeIdAndStatus(employee.getId(), AllocationStatus.ACTIVE);

        if (!activeAllocations.isEmpty()) {
            dto.setRoomNumber(activeAllocations.get(0).getRoom().getRoomNumber());
        } else {
            dto.setRoomNumber(null);
        }

        return dto;
    }

    /**
     * Create new user (employee, HR, or admin)
     * - ADMIN users can create any role
     * - HR users can only create EMPLOYEE role
     * - Employee-specific fields (taxId, position, etc.) are optional for ADMIN/HR roles
     */
    @Transactional
    public EmployeeDto createEmployee(CreateEmployeeDto dto) {
        Role targetRole = dto.getRole() != null ? Role.valueOf(dto.getRole()) : Role.EMPLOYEE;

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName().equals("anonymousUser")) {
            throw new AppException("Authentication required to create users", HttpStatus.UNAUTHORIZED);
        }

        UserDto currentUser = (UserDto) authentication.getPrincipal();

        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.HR) {
            throw new AppException(
                "You do not have permission to create users. Only ADMIN and HR roles can create users.",
                HttpStatus.FORBIDDEN
            );
        }

        if ((targetRole == Role.ADMIN || targetRole == Role.HR) && currentUser.getRole() != Role.ADMIN) {
            throw new AppException(
                "Only ADMIN users can create ADMIN or HR accounts. Current role: " + currentUser.getRole(),
                HttpStatus.FORBIDDEN
            );
        }

        log.info("User {} (role: {}) is creating new user with role: {}",
                currentUser.getEmail(), currentUser.getRole(), targetRole);

        if (userRepository.findUserByEmail(dto.getEmail()).isPresent()) {
            throw new AppException("Email already exists", HttpStatus.BAD_REQUEST);
        }

        if (dto.getTaxId() != null && employeeRepository.findByTaxId(dto.getTaxId()).isPresent()) {
            throw new AppException("Tax ID already exists", HttpStatus.BAD_REQUEST);
        }

        if (dto.getTajNumber() != null && employeeRepository.findByTajNumber(dto.getTajNumber()).isPresent()) {
            throw new AppException("TAJ number already exists", HttpStatus.BAD_REQUEST);
        }

        if (dto.getIdCardNumber() != null && employeeRepository.findByIdCardNumber(dto.getIdCardNumber()).isPresent()) {
            throw new AppException("ID card number already exists", HttpStatus.BAD_REQUEST);
        }

        User user = User.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .role(targetRole)
                .isActive(true)
                .build();

        Employee employee = Employee.builder()
                .user(user)
                .taxId(dto.getTaxId())
                .tajNumber(dto.getTajNumber())
                .idCardNumber(dto.getIdCardNumber())
                .primaryAddress(dto.getPrimaryAddress())
                .phoneNumber(dto.getPhoneNumber())
                .nationality(dto.getNationality())
                .birthDate(dto.getBirthDate())
                .companyName(dto.getCompanyName())
                .startDate(dto.getStartDate())
                .build();

        Employee saved = employeeRepository.save(employee);

        java.util.Map<String, Object> newValueMap = new java.util.HashMap<>();
        newValueMap.put("id", saved.getId());
        newValueMap.put("firstName", saved.getUser().getFirstName());
        newValueMap.put("lastName", saved.getUser().getLastName());
        newValueMap.put("email", saved.getUser().getEmail());
        newValueMap.put("role", saved.getUser().getRole().name());
        newValueMap.put("taxId", saved.getTaxId());
        newValueMap.put("tajNumber", saved.getTajNumber());
        newValueMap.put("companyName", saved.getCompanyName());
        newValueMap.put("phoneNumber", saved.getPhoneNumber());
        newValueMap.put("isActive", saved.getUser().isActive());

        auditLogService.logAction(
            "Employee",
            saved.getId(),
            AuditAction.CREATE,
            String.format("Created employee: %s %s (%s) with role %s",
                dto.getFirstName(), dto.getLastName(), dto.getEmail(), targetRole),
            null,
            newValueMap
        );

        return mapToEmployeeDtoWithRoom(saved);
    }

    /**
     * Update employee data
     * Can update: name, email, phone, nationality, address, companyName, startDate,
     * taxId, tajNumber, idCardNumber, roomNumber, isActive
     * Cannot update: birthDate (excluded)
     */
    @Transactional
    public EmployeeDto updateEmployee(Long id, UpdateEmployeeDto dto) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new AppException("Employee not found", HttpStatus.NOT_FOUND));

        Employee oldEmployee = Employee.builder()
                .id(employee.getId())
                .user(User.builder()
                        .id(employee.getUser().getId())
                        .email(employee.getUser().getEmail())
                        .firstName(employee.getUser().getFirstName())
                        .lastName(employee.getUser().getLastName())
                        .isActive(employee.getUser().isActive())
                        .build())
                .taxId(employee.getTaxId())
                .tajNumber(employee.getTajNumber())
                .idCardNumber(employee.getIdCardNumber())
                .primaryAddress(employee.getPrimaryAddress())
                .phoneNumber(employee.getPhoneNumber())
                .nationality(employee.getNationality())
                .companyName(employee.getCompanyName())
                .startDate(employee.getStartDate())
                .build();

        User user = employee.getUser();

        if (dto.getFirstName() != null) user.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) user.setLastName(dto.getLastName());
        if (dto.getEmail() != null) {
            userRepository.findUserByEmail(dto.getEmail())
                    .ifPresent(existingUser -> {
                        if (existingUser.getId() != user.getId()) {
                            throw new AppException("Email already exists", HttpStatus.BAD_REQUEST);
                        }
                    });
            user.setEmail(dto.getEmail());
        }
        if (dto.getIsActive() != null) user.setActive(dto.getIsActive());

        if (dto.getTaxId() != null) {
            employeeRepository.findByTaxId(dto.getTaxId())
                    .ifPresent(existingEmployee -> {
                        if (!existingEmployee.getId().equals(id)) {
                            throw new AppException("Tax ID already exists for another employee", HttpStatus.BAD_REQUEST);
                        }
                    });
            employee.setTaxId(dto.getTaxId());
        }

        if (dto.getTajNumber() != null) {
            employeeRepository.findByTajNumber(dto.getTajNumber())
                    .ifPresent(existingEmployee -> {
                        if (!existingEmployee.getId().equals(id)) {
                            throw new AppException("TAJ number already exists for another employee", HttpStatus.BAD_REQUEST);
                        }
                    });
            employee.setTajNumber(dto.getTajNumber());
        }

        if (dto.getIdCardNumber() != null) {
            employeeRepository.findByIdCardNumber(dto.getIdCardNumber())
                    .ifPresent(existingEmployee -> {
                        if (!existingEmployee.getId().equals(id)) {
                            throw new AppException("ID card number already exists for another employee", HttpStatus.BAD_REQUEST);
                        }
                    });
            employee.setIdCardNumber(dto.getIdCardNumber());
        }
        if (dto.getPrimaryAddress() != null) employee.setPrimaryAddress(dto.getPrimaryAddress());
        if (dto.getPhoneNumber() != null) employee.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getNationality() != null) employee.setNationality(dto.getNationality());
        if (dto.getCompanyName() != null) employee.setCompanyName(dto.getCompanyName());
        if (dto.getStartDate() != null) employee.setStartDate(dto.getStartDate());

        if (dto.getRoomNumber() != null) {
            handleRoomAssignment(employee, dto.getRoomNumber());
        }

        Employee updated = employeeRepository.save(employee);

        java.util.Map<String, Object> oldValueMap = new java.util.HashMap<>();
        oldValueMap.put("firstName", oldEmployee.getUser().getFirstName());
        oldValueMap.put("lastName", oldEmployee.getUser().getLastName());
        oldValueMap.put("email", oldEmployee.getUser().getEmail());
        oldValueMap.put("taxId", oldEmployee.getTaxId());
        oldValueMap.put("tajNumber", oldEmployee.getTajNumber());
        oldValueMap.put("idCardNumber", oldEmployee.getIdCardNumber());
        oldValueMap.put("companyName", oldEmployee.getCompanyName());
        oldValueMap.put("phoneNumber", oldEmployee.getPhoneNumber());
        oldValueMap.put("nationality", oldEmployee.getNationality());
        oldValueMap.put("primaryAddress", oldEmployee.getPrimaryAddress());
        oldValueMap.put("isActive", oldEmployee.getUser().isActive());

        java.util.Map<String, Object> newValueMap = new java.util.HashMap<>();
        newValueMap.put("firstName", updated.getUser().getFirstName());
        newValueMap.put("lastName", updated.getUser().getLastName());
        newValueMap.put("email", updated.getUser().getEmail());
        newValueMap.put("taxId", updated.getTaxId());
        newValueMap.put("tajNumber", updated.getTajNumber());
        newValueMap.put("idCardNumber", updated.getIdCardNumber());
        newValueMap.put("companyName", updated.getCompanyName());
        newValueMap.put("phoneNumber", updated.getPhoneNumber());
        newValueMap.put("nationality", updated.getNationality());
        newValueMap.put("primaryAddress", updated.getPrimaryAddress());
        newValueMap.put("isActive", updated.getUser().isActive());

        auditLogService.logAction(
            "Employee",
            updated.getId(),
            AuditAction.UPDATE,
            String.format("Updated employee: %s %s (%s)",
                updated.getUser().getFirstName(), updated.getUser().getLastName(), updated.getUser().getEmail()),
            oldValueMap,
            newValueMap
        );

        return mapToEmployeeDtoWithRoom(updated);
    }

    /**
     * Handle room assignment/reassignment for employee
     */
    private void handleRoomAssignment(Employee employee, String newRoomNumber) {
        List<RoomAllocation> currentAllocations = roomAllocationRepository
                .findByEmployeeIdAndStatus(employee.getId(), AllocationStatus.ACTIVE);

        if (!currentAllocations.isEmpty()) {
            String currentRoomNumber = currentAllocations.get(0).getRoom().getRoomNumber();
            if (currentRoomNumber.equals(newRoomNumber)) {
                return;
            }
            RoomAllocation currentAllocation = currentAllocations.get(0);
            currentAllocation.setCheckOutDate(java.time.LocalDate.now());
            currentAllocation.setStatus(AllocationStatus.CHECKED_OUT);
            roomAllocationRepository.save(currentAllocation);
        }

        if (newRoomNumber.trim().isEmpty() || newRoomNumber.equalsIgnoreCase("null")) {
            return;
        }

        Room newRoom = roomRepository.findAll().stream()
                .filter(room -> room.getRoomNumber().equals(newRoomNumber))
                .findFirst()
                .orElseThrow(() -> new AppException("Room " + newRoomNumber + " not found", HttpStatus.NOT_FOUND));

        List<RoomAllocation> newRoomOccupants = roomAllocationRepository
                .findByRoomIdAndStatus(newRoom.getId(), AllocationStatus.ACTIVE);
        if (newRoomOccupants.size() >= newRoom.getCapacity()) {
            throw new AppException("Room " + newRoomNumber + " is at full capacity", HttpStatus.BAD_REQUEST);
        }

        RoomAllocation newAllocation = RoomAllocation.builder()
                .room(newRoom)
                .employee(employee)
                .checkInDate(java.time.LocalDate.now())
                .status(AllocationStatus.ACTIVE)
                .build();
        roomAllocationRepository.save(newAllocation);
    }

    /**
     * Delete employee (soft delete by deactivating user)
     */
    @Transactional
    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new AppException("Employee not found", HttpStatus.NOT_FOUND));

        employee.getUser().setActive(false);
        employeeRepository.save(employee);

        auditLogService.logAction(
            "Employee",
            employee.getId(),
            AuditAction.DELETE,
            String.format("Deactivated employee: %s %s (%s)",
                employee.getUser().getFirstName(), employee.getUser().getLastName(), employee.getUser().getEmail())
        );
    }
}



