package hu.sztibor.staffi.backend.controllers;

import hu.sztibor.staffi.backend.dto.contract.ContractDto;
import hu.sztibor.staffi.backend.dto.contract.CreateContractDto;
import hu.sztibor.staffi.backend.dto.employee.CreateEmployeeDto;
import hu.sztibor.staffi.backend.dto.employee.EmployeeDto;
import hu.sztibor.staffi.backend.dto.employee.UpdateEmployeeDto;
import hu.sztibor.staffi.backend.dto.room.MyRoomInfoDto;
import hu.sztibor.staffi.backend.dto.room.RoomAllocationDto;
import hu.sztibor.staffi.backend.services.ContractService;
import hu.sztibor.staffi.backend.services.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/employees")
@RequiredArgsConstructor
@Tag(name = "EmployeeController", description = "Endpoints for managing employees")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final ContractService contractService;

    /**
     * GET /api/employees
     * Get list of employees with optional filters
     * Note: Only returns users with EMPLOYEE role (excludes ADMIN and HR users)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Get all employees", description = "Retrieve list of employees (EMPLOYEE role only) with optional status and search filters")
    public ResponseEntity<List<EmployeeDto>> getAllEmployees(
            @Parameter(description = "Filter by active status (true/false)")
            @RequestParam(required = false) Boolean status,
            @Parameter(description = "Search by name or email")
            @RequestParam(required = false) String search
    ) {
        List<EmployeeDto> employees = employeeService.getAllEmployees(status, search);
        return ResponseEntity.ok(employees);
    }

    /**
     * GET /api/employees/me
     * Get current employee's own data (for EMPLOYEE role)
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Get my employee data", description = "Retrieve the current employee's own profile data")
    public ResponseEntity<EmployeeDto> getMyEmployeeData() {
        EmployeeDto employee = employeeService.getCurrentEmployeeData();
        return ResponseEntity.ok(employee);
    }

    /**
     * GET /api/employees/me/room
     * Get current employee's room information with occupants (for EMPLOYEE role)
     */
    @GetMapping("/me/room")
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Get my room information", description = "Retrieve current employee's room details including other occupants")
    public ResponseEntity<MyRoomInfoDto> getMyRoomInfo() {
        MyRoomInfoDto roomInfo = employeeService.getMyRoomInfo();
        return ResponseEntity.ok(roomInfo);
    }

    /**
     * GET /api/employees/{id}
     * Get full employee profile by ID (ADMIN/HR only)
     * Employees should use /employees/me instead
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Get employee by ID", description = "Retrieve full employee profile including personal data (ADMIN/HR only)")
    public ResponseEntity<EmployeeDto> getEmployeeById(
            @Parameter(description = "Employee ID")
            @PathVariable Long id
    ) {
        EmployeeDto employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(employee);
    }

    /**
     * POST /api/employees
     * Create new user (employee, HR, or admin)
     * - Set role field to "EMPLOYEE", "HR", or "ADMIN"
     * - Employee-specific fields (taxId, position, etc.) are optional for HR/ADMIN roles
     * - Only ADMIN users should be able to create HR/ADMIN roles (authorization needed)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Create new user", description = "Create a new user account (EMPLOYEE, HR, or ADMIN role)")
    public ResponseEntity<EmployeeDto> createEmployee(
            @RequestBody CreateEmployeeDto createEmployeeDto
    ) {
        EmployeeDto created = employeeService.createEmployee(createEmployeeDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/employees/{id}
     * Update employee data (e.g., address change, name change)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Update employee", description = "Update employee data including name, address, phone, etc.")
    public ResponseEntity<EmployeeDto> updateEmployee(
            @Parameter(description = "Employee ID")
            @PathVariable Long id,
            @RequestBody UpdateEmployeeDto updateEmployeeDto
    ) {
        EmployeeDto updated = employeeService.updateEmployee(id, updateEmployeeDto);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/employees/{id}
     * Deactivate employee (soft delete)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate employee", description = "Soft delete - deactivate employee account")
    public ResponseEntity<Void> deleteEmployee(
            @Parameter(description = "Employee ID")
            @PathVariable Long id
    ) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/employees/{id}/contracts
     * Get all contracts for a specific employee
     */
    @GetMapping("/{id}/contracts")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Get employee contracts", description = "Retrieve all contracts for a specific employee")
    public ResponseEntity<List<ContractDto>> getEmployeeContracts(
            @Parameter(description = "Employee ID")
            @PathVariable Long id
    ) {
        List<ContractDto> contracts = contractService.getEmployeeContracts(id);
        return ResponseEntity.ok(contracts);
    }

    /**
     * POST /api/employees/{id}/contracts
     * Create a new contract for an employee (generates PDF in background)
     */
    @PostMapping("/{id}/contracts")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Create contract", description = "Create a new contract for an employee with automatic PDF generation")
    public ResponseEntity<ContractDto> createContract(
            @Parameter(description = "Employee ID")
            @PathVariable Long id,
            @RequestBody CreateContractDto createContractDto
    ) {
        ContractDto contract = contractService.createContract(id, createContractDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(contract);
    }

    /**
     * GET /api/employees/me/room-history
     * Get the current employee's room allocation history
     */
    @GetMapping("/me/room-history")
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Get my room history",
               description = "Retrieve all past and current room allocations for the current employee")
    public ResponseEntity<List<RoomAllocationDto>> getMyRoomHistory() {
        List<RoomAllocationDto> history = employeeService.getMyRoomHistory();
        return ResponseEntity.ok(history);
    }
}
