package hu.sztibor.staffi.backend.controllers;

import hu.sztibor.staffi.backend.dto.contract.ContractDto;
import hu.sztibor.staffi.backend.services.ContractService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/contracts")
@RequiredArgsConstructor
@Tag(name = "Contracts", description = "Endpoints for contract management")
public class ContractController {

    private final ContractService contractService;

    /**
     * GET /api/contracts/{id}/pdf
     * Download PDF file for a contract
     */
    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Download contract PDF", description = "Download the generated PDF file for a contract")
    public ResponseEntity<Resource> downloadContractPdf(
            @Parameter(description = "Contract ID")
            @PathVariable Long id
    ) {
        Resource pdfFile = contractService.getContractPdf(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"contract-" + id + ".pdf\"")
                .body(pdfFile);
    }

    /**
     * PUT /api/contracts/{id}/invalidate
     * Invalidate/terminate a contract
     */
    @PutMapping("/{id}/invalidate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Invalidate contract", description = "Terminate a contract and set its status to TERMINATED")
    public ResponseEntity<ContractDto> invalidateContract(
            @Parameter(description = "Contract ID")
            @PathVariable Long id
    ) {
        ContractDto contract = contractService.invalidateContract(id);
        return ResponseEntity.ok(contract);
    }
}

