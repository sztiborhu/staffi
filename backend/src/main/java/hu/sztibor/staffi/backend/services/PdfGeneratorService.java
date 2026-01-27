package hu.sztibor.staffi.backend.services;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import hu.sztibor.staffi.backend.entities.Contract;
import hu.sztibor.staffi.backend.entities.Employee;
import hu.sztibor.staffi.backend.entities.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Service for generating professional PDF contracts
 * Uses iText 7 library
 */
@Slf4j
@Service
public class PdfGeneratorService {

    private static final String PDF_STORAGE_PATH = "contracts/pdfs/";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy. MM. dd.");

    // Colors
    private static final DeviceRgb PRIMARY_COLOR = new DeviceRgb(41, 128, 185); // Blue
    private static final DeviceRgb SECONDARY_COLOR = new DeviceRgb(52, 73, 94); // Dark gray
    private static final DeviceRgb LIGHT_GRAY = new DeviceRgb(236, 240, 241);

    /**
     * Generate a professional contract PDF
     *
     * @param contract The contract entity
     * @return Path to the generated PDF file
     * @throws IOException If PDF generation fails
     */
    public String generateContractPdf(Contract contract) throws IOException {
        Path directory = Paths.get(PDF_STORAGE_PATH);
        if (!Files.exists(directory)) {
            Files.createDirectories(directory);
        }

        String filename = contract.getContractNumber() + ".pdf";
        Path filePath = directory.resolve(filename);

        try (PdfWriter writer = new PdfWriter(filePath.toString());
             PdfDocument pdf = new PdfDocument(writer);
             Document document = new Document(pdf)) {

            document.setMargins(50, 50, 50, 50);

            PdfFont boldFont = createUnicodeFont(true);
            PdfFont regularFont = createUnicodeFont(false);

            Employee employee = contract.getEmployee();
            User user = employee.getUser();

            // Header
            Paragraph companyHeader = new Paragraph("STAFFI MANAGEMENT SYSTEM")
                    .setFont(boldFont)
                    .setFontSize(20)
                    .setFontColor(PRIMARY_COLOR)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(5);
            document.add(companyHeader);

            // Subtitle
            Paragraph subtitle = new Paragraph("Munkaszerződés / Employment Contract")
                    .setFont(regularFont)
                    .setFontSize(12)
                    .setFontColor(SECONDARY_COLOR)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20);
            document.add(subtitle);

            // Contract Number Box
            Table contractNumberBox = new Table(1)
                    .setWidth(UnitValue.createPercentValue(100))
                    .setBackgroundColor(LIGHT_GRAY)
                    .setMarginBottom(20);

            contractNumberBox.addCell(new Cell()
                    .add(new Paragraph("Szerződés száma / Contract Number: " + contract.getContractNumber())
                            .setFont(boldFont)
                            .setFontSize(11)
                            .setTextAlignment(TextAlignment.CENTER))
                    .setBorder(new SolidBorder(PRIMARY_COLOR, 2))
                    .setPadding(10));

            document.add(contractNumberBox);

            // Employee Information Section
            addSectionTitle(document, "1. MUNKAVÁLLALÓ ADATAI / EMPLOYEE INFORMATION", boldFont);

            Table employeeTable = createInfoTable();
            addInfoRow(employeeTable, "Név / Name:",
                    user.getLastName() + " " + user.getFirstName(), regularFont, boldFont);
            addInfoRow(employeeTable, "E-mail:", user.getEmail(), regularFont, boldFont);
            addInfoRow(employeeTable, "Adóazonosító / Tax ID:",
                    employee.getTaxId() != null ? employee.getTaxId() : "N/A", regularFont, boldFont);
            addInfoRow(employeeTable, "TAJ szám / Social Security:",
                    employee.getTajNumber() != null ? employee.getTajNumber() : "N/A", regularFont, boldFont);
            addInfoRow(employeeTable, "Személyi ig. szám / ID Card:",
                    employee.getIdCardNumber() != null ? employee.getIdCardNumber() : "N/A", regularFont, boldFont);
            addInfoRow(employeeTable, "Lakcím / Address:",
                    employee.getPrimaryAddress() != null ? employee.getPrimaryAddress() : "N/A", regularFont, boldFont);
            addInfoRow(employeeTable, "Telefonszám / Phone:",
                    employee.getPhoneNumber() != null ? employee.getPhoneNumber() : "N/A", regularFont, boldFont);
            addInfoRow(employeeTable, "Állampolgárság / Nationality:",
                    employee.getNationality() != null ? employee.getNationality() : "N/A", regularFont, boldFont);

            document.add(employeeTable);

            // Contract Details Section
            addSectionTitle(document, "2. SZERZŐDÉS RÉSZLETEI / CONTRACT DETAILS", boldFont);

            Table contractTable = createInfoTable();
            addInfoRow(contractTable, "Munkakör / Position:",
                    employee.getCompanyName() != null ? employee.getCompanyName() : "N/A", regularFont, boldFont);
            addInfoRow(contractTable, "Szerződés kezdete / Start Date:",
                    contract.getStartDate().format(DATE_FORMATTER), regularFont, boldFont);
            addInfoRow(contractTable, "Szerződés vége / End Date:",
                    contract.getEndDate() != null ? contract.getEndDate().format(DATE_FORMATTER) : "Határozatlan / Indefinite",
                    regularFont, boldFont);
            addInfoRow(contractTable, "Órabér / Hourly Rate:",
                    formatCurrency(contract.getHourlyRate(), contract.getCurrency()), regularFont, boldFont);
            addInfoRow(contractTable, "Heti munkaidő / Weekly Hours:",
                    contract.getWorkingHoursPerWeek() + " óra / hours", regularFont, boldFont);
            addInfoRow(contractTable, "Havi bruttó átlag / Monthly Gross (avg):",
                    calculateMonthlyGross(contract), regularFont, boldFont);
            addInfoRow(contractTable, "Státusz / Status:",
                    getStatusInHungarian(contract.getStatus().name()), regularFont, boldFont);

            document.add(contractTable);

            // Terms and Conditions
            addSectionTitle(document, "3. ÁLTALÁNOS FELTÉTELEK / TERMS AND CONDITIONS", boldFont);

            String termsText = """
                    A munkavállalónak kötelessége a munkaköri leírásának megfelelően ellátni feladatait, \
                    betartani a munkáltatói utasításokat, valamint a munkavégzés során gondoskodni a munkaeszközök \
                    megőrzéséről és megfelelő használatáról.
                    
                    The employee is obligated to perform their duties according to the job description, \
                    follow employer instructions, and ensure the proper care and use of work equipment.
                    """;

            Paragraph terms = new Paragraph(termsText)
                    .setFont(regularFont)
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.JUSTIFIED)
                    .setMarginBottom(20);
            document.add(terms);

            // Signatures Section
            addSectionTitle(document, "4. ALÁÍRÁSOK / SIGNATURES", boldFont);

            Table signaturesTable = new Table(new float[]{1, 1})
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginTop(30);

            // Employee signature
            signaturesTable.addCell(createSignatureCell("Munkavállaló / Employee", regularFont, boldFont));
            // Employer signature
            signaturesTable.addCell(createSignatureCell("Munkáltató / Employer", regularFont, boldFont));

            document.add(signaturesTable);

            // Footer
            Paragraph footer = new Paragraph("Létrehozva / Generated: " + LocalDate.now().format(DATE_FORMATTER))
                    .setFont(regularFont)
                    .setFontSize(8)
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(30);
            document.add(footer);

            log.info("Successfully generated PDF for contract {} at {}", contract.getContractNumber(), filePath);
        } catch (Exception e) {
            log.error("Error generating PDF for contract {}: {}", contract.getContractNumber(), e.getMessage(), e);
            throw new IOException("Failed to generate PDF: " + e.getMessage(), e);
        }

        return filePath.toString();
    }

    /**
     * Add a section title to the document
     */
    private void addSectionTitle(Document document, String title, PdfFont font) {
        Paragraph sectionTitle = new Paragraph(title)
                .setFont(font)
                .setFontSize(12)
                .setFontColor(PRIMARY_COLOR)
                .setMarginTop(15)
                .setMarginBottom(10);
        document.add(sectionTitle);
    }

    /**
     * Create a standardized info table
     */
    private Table createInfoTable() {
        Table table = new Table(new float[]{2, 3})
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginBottom(15);
        return table;
    }

    /**
     * Add a row to an info table
     */
    private void addInfoRow(Table table, String label, String value, PdfFont regularFont, PdfFont boldFont) {
        table.addCell(new Cell()
                .add(new Paragraph(label).setFont(boldFont).setFontSize(9))
                .setBackgroundColor(LIGHT_GRAY)
                .setBorder(null)
                .setPadding(8));

        table.addCell(new Cell()
                .add(new Paragraph(value).setFont(regularFont).setFontSize(9))
                .setBorder(null)
                .setPadding(8));
    }

    /**
     * Create a signature cell
     */
    private Cell createSignatureCell(String label, PdfFont regularFont, PdfFont boldFont) {
        Paragraph signatureLabel = new Paragraph(label)
                .setFont(boldFont)
                .setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(40);

        Paragraph signatureLine = new Paragraph("_____________________________")
                .setFont(regularFont)
                .setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER);

        Paragraph dateLabel = new Paragraph("Dátum / Date: ________________")
                .setFont(regularFont)
                .setFontSize(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(20);

        return new Cell()
                .add(signatureLabel)
                .add(signatureLine)
                .add(dateLabel)
                .setBorder(null)
                .setTextAlignment(TextAlignment.CENTER);
    }

    /**
     * Format currency with proper formatting
     */
    private String formatCurrency(BigDecimal amount, String currency) {
        return String.format("%,.0f %s", amount.doubleValue(), currency);
    }

    /**
     * Calculate estimated monthly gross salary
     */
    private String calculateMonthlyGross(Contract contract) {
        // Average 4.33 weeks per month
        BigDecimal weeksPerMonth = new BigDecimal("4.33");
        BigDecimal monthlyHours = new BigDecimal(contract.getWorkingHoursPerWeek())
                .multiply(weeksPerMonth);
        BigDecimal monthlyGross = contract.getHourlyRate().multiply(monthlyHours);

        return formatCurrency(monthlyGross, contract.getCurrency());
    }

    /**
     * Get contract status in Hungarian
     */
    private String getStatusInHungarian(String status) {
        return switch (status) {
            case "DRAFT" -> "Tervezet / Draft";
            case "ACTIVE" -> "Aktív / Active";
            case "TERMINATED" -> "Felmondva / Terminated";
            case "EXPIRED" -> "Lejárt / Expired";
            default -> status;
        };
    }

    /**
     * Create a Unicode-compatible font for Hungarian characters (ő, á, é, ű, etc.)
     * Uses IDENTITY_H encoding which supports full Unicode character set
     *
     * @param bold Whether to create bold font
     * @return PdfFont with Unicode support
     * @throws IOException If font creation fails
     */
    private PdfFont createUnicodeFont(boolean bold) throws IOException {
        try {
            // Method 1: Try to load Windows system font (Arial supports Hungarian characters)
            String fontPath = bold ?
                    "C:/Windows/Fonts/arialbd.ttf" :  // Arial Bold
                    "C:/Windows/Fonts/arial.ttf";      // Arial Regular

            java.io.File fontFile = new java.io.File(fontPath);
            if (fontFile.exists()) {
                // Create font with IDENTITY_H encoding for full Unicode support
                // TrueType fonts (.ttf) are automatically embedded
                return PdfFontFactory.createFont(fontPath, com.itextpdf.io.font.PdfEncodings.IDENTITY_H);
            }
        } catch (Exception e) {
            log.debug("Could not load Windows font, trying alternatives: {}", e.getMessage());
        }

        try {
            // Method 2: Try Linux/Mac font paths (DejaVu and Liberation support Hungarian)
            String[] fontPaths = bold ?
                    new String[]{"/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                                 "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"} :
                    new String[]{"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                                 "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"};

            for (String fontPath : fontPaths) {
                java.io.File fontFile = new java.io.File(fontPath);
                if (fontFile.exists()) {
                    return PdfFontFactory.createFont(fontPath, com.itextpdf.io.font.PdfEncodings.IDENTITY_H);
                }
            }
        } catch (Exception e) {
            log.debug("Could not load Unix font, using fallback: {}", e.getMessage());
        }

        // Method 3: Fallback to standard fonts (LIMITED - may not support Hungarian special characters)
        log.warn("No Unicode-compatible TrueType fonts found on system. Using standard Helvetica font. " +
                "Hungarian special characters (ő, ű, ő, á, é, etc.) may not display correctly. " +
                "To fix: Ensure Arial (Windows), DejaVu or Liberation fonts are installed on the server.");
        return PdfFontFactory.createFont(
                bold ? com.itextpdf.io.font.constants.StandardFonts.HELVETICA_BOLD :
                       com.itextpdf.io.font.constants.StandardFonts.HELVETICA);
    }
}

