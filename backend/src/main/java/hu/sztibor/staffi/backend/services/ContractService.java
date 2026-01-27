package hu.sztibor.staffi.backend.services;

import hu.sztibor.staffi.backend.dto.contract.ContractDto;
import hu.sztibor.staffi.backend.dto.contract.CreateContractDto;
import hu.sztibor.staffi.backend.entities.Contract;
import hu.sztibor.staffi.backend.entities.Employee;
import hu.sztibor.staffi.backend.enums.AuditAction;
import hu.sztibor.staffi.backend.enums.ContractStatus;
import hu.sztibor.staffi.backend.exceptions.AppException;
import hu.sztibor.staffi.backend.repositories.ContractRepository;
import hu.sztibor.staffi.backend.repositories.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditLogService auditLogService;
    private final PdfGeneratorService pdfGeneratorService;

    private static final String PDF_STORAGE_PATH = "contracts/pdfs/";

    /**
     * Get all contracts for a specific employee
     */
    public List<ContractDto> getEmployeeContracts(Long employeeId) {
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new AppException("Employee not found", HttpStatus.NOT_FOUND));

        List<Contract> contracts = contractRepository.findByEmployeeId(employeeId);

        return contracts.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Create a new contract for an employee
     * Generates contract number and PDF
     */
    @Transactional
    public ContractDto createContract(Long employeeId, CreateContractDto dto) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new AppException("Employee not found", HttpStatus.NOT_FOUND));

        if (dto.getStartDate() == null) {
            throw new AppException("Start date is required", HttpStatus.BAD_REQUEST);
        }

        if (dto.getEndDate() != null && dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new AppException("End date cannot be before start date", HttpStatus.BAD_REQUEST);
        }

        if (dto.getHourlyRate() == null || dto.getHourlyRate().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new AppException("Hourly rate must be greater than zero", HttpStatus.BAD_REQUEST);
        }

        String contractNumber = generateContractNumber(employee);

        Contract contract = Contract.builder()
                .employee(employee)
                .contractNumber(contractNumber)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .hourlyRate(dto.getHourlyRate())
                .currency(dto.getCurrency() != null ? dto.getCurrency() : "HUF")
                .workingHoursPerWeek(dto.getWorkingHoursPerWeek() != null ? dto.getWorkingHoursPerWeek() : 40)
                .status(ContractStatus.DRAFT)
                .build();

        Contract saved = contractRepository.save(contract);

        try {
            String pdfPath = pdfGeneratorService.generateContractPdf(saved);
            saved.setPdfPath(pdfPath);
            saved.setStatus(ContractStatus.ACTIVE);
            saved = contractRepository.save(saved);
        } catch (Exception e) {
            log.error("Error generating PDF for contract {}: {}", contractNumber, e.getMessage());
        }


        java.util.Map<String, Object> newValueMap = new java.util.HashMap<>();
        newValueMap.put("id", saved.getId());
        newValueMap.put("contractNumber", saved.getContractNumber());
        newValueMap.put("employeeId", employeeId);
        newValueMap.put("startDate", saved.getStartDate());
        newValueMap.put("endDate", saved.getEndDate());
        newValueMap.put("hourlyRate", saved.getHourlyRate());
        newValueMap.put("currency", saved.getCurrency());
        newValueMap.put("workingHoursPerWeek", saved.getWorkingHoursPerWeek());
        newValueMap.put("status", saved.getStatus().name());

        auditLogService.logAction(
            "Contract",
            saved.getId(),
            AuditAction.CREATE,
            String.format("Created contract %s for employee %s %s (ID: %d)",
                contractNumber,
                employee.getUser().getFirstName(),
                employee.getUser().getLastName(),
                employeeId),
            null,
            newValueMap
        );

        return mapToDto(saved);
    }

    /**
     * Get PDF file for download
     */
    public Resource getContractPdf(Long contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new AppException("Contract not found", HttpStatus.NOT_FOUND));

        if (contract.getPdfPath() == null) {
            throw new AppException("PDF not available for this contract", HttpStatus.NOT_FOUND);
        }

        try {
            Path filePath = Paths.get(contract.getPdfPath());
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new AppException("PDF file not found or not readable", HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            throw new AppException("Error reading PDF file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Invalidate/terminate a contract
     * Sets contract status to TERMINATED
     */
    @Transactional
    public ContractDto invalidateContract(Long contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new AppException("Contract not found", HttpStatus.NOT_FOUND));

        // Check if contract is already terminated or expired
        if (contract.getStatus() == ContractStatus.TERMINATED) {
            throw new AppException("Contract is already terminated", HttpStatus.BAD_REQUEST);
        }

        if (contract.getStatus() == ContractStatus.EXPIRED) {
            throw new AppException("Cannot terminate an expired contract", HttpStatus.BAD_REQUEST);
        }

        // Set status to TERMINATED
        contract.setStatus(ContractStatus.TERMINATED);

        // If no end date was set, set it to today
        if (contract.getEndDate() == null) {
            contract.setEndDate(java.time.LocalDate.now());
        }

        Contract updated = contractRepository.save(contract);

        log.info("Contract {} has been terminated", contract.getContractNumber());

        // Audit log - create clean JSON
        java.util.Map<String, Object> oldValueMap = new java.util.HashMap<>();
        oldValueMap.put("status", "ACTIVE");
        oldValueMap.put("endDate", null);

        java.util.Map<String, Object> newValueMap = new java.util.HashMap<>();
        newValueMap.put("status", updated.getStatus().name());
        newValueMap.put("endDate", updated.getEndDate());

        auditLogService.logAction(
            "Contract",
            updated.getId(),
            AuditAction.UPDATE,
            String.format("Terminated contract %s for employee %s %s",
                contract.getContractNumber(),
                contract.getEmployee().getUser().getFirstName(),
                contract.getEmployee().getUser().getLastName()),
            oldValueMap,
            newValueMap
        );

        return mapToDto(updated);
    }

    /**
     * Generate unique contract number
     * Format: CONTRACT-YYYYMMDD-EMPLOYEEID-XXXX
     */
    private String generateContractNumber(Employee employee) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        return String.format("CONTRACT-%s-%d-%s", timestamp, employee.getId(), randomPart);
    }


    /**
     * Map Contract entity to DTO
     */
    private ContractDto mapToDto(Contract contract) {
        return ContractDto.builder()
                .id(contract.getId())
                .employeeId(contract.getEmployee().getId())
                .employeeName(contract.getEmployee().getUser().getFirstName() + " " +
                             contract.getEmployee().getUser().getLastName())
                .contractNumber(contract.getContractNumber())
                .startDate(contract.getStartDate())
                .endDate(contract.getEndDate())
                .hourlyRate(contract.getHourlyRate())
                .currency(contract.getCurrency())
                .workingHoursPerWeek(contract.getWorkingHoursPerWeek())
                .pdfPath(contract.getPdfPath())
                .status(contract.getStatus())
                .createdAt(contract.getCreatedAt())
                .build();
    }
}

