package hu.sztibor.staffi.backend.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import hu.sztibor.staffi.backend.config.UserAuthProvider;
import hu.sztibor.staffi.backend.dto.auth.UserDto;
import hu.sztibor.staffi.backend.entities.Employee;
import hu.sztibor.staffi.backend.entities.User;
import hu.sztibor.staffi.backend.enums.Role;
import hu.sztibor.staffi.backend.repositories.EmployeeRepository;
import hu.sztibor.staffi.backend.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for EmployeeController with authentication
 * Demonstrates testing secured endpoints
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class EmployeeControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserAuthProvider userAuthProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String hrToken;
    private String employeeToken;
    private User adminUser;
    private User hrUser;
    private User employeeUser;
    private Employee testEmployee;

    @BeforeEach
    void setUp() {
        // Clean database
        employeeRepository.deleteAll();
        userRepository.deleteAll();

        // Create ADMIN user
        adminUser = createUser("admin@example.com", "Admin", "User", Role.ADMIN);
        adminToken = userAuthProvider.createToken(UserDto.builder()
                .id(adminUser.getId())
                .email(adminUser.getEmail())
                .firstName(adminUser.getFirstName())
                .lastName(adminUser.getLastName())
                .role(adminUser.getRole())
                .build());

        // Create HR user
        hrUser = createUser("hr@example.com", "HR", "Manager", Role.HR);
        hrToken = userAuthProvider.createToken(UserDto.builder()
                .id(hrUser.getId())
                .email(hrUser.getEmail())
                .firstName(hrUser.getFirstName())
                .lastName(hrUser.getLastName())
                .role(hrUser.getRole())
                .build());

        // Create EMPLOYEE user
        employeeUser = createUser("employee@example.com", "John", "Doe", Role.EMPLOYEE);
        employeeToken = userAuthProvider.createToken(UserDto.builder()
                .id(employeeUser.getId())
                .email(employeeUser.getEmail())
                .firstName(employeeUser.getFirstName())
                .lastName(employeeUser.getLastName())
                .role(employeeUser.getRole())
                .build());

        // Create test employee
        testEmployee = Employee.builder()
                .user(employeeUser)
                .taxId("1234567890")
                .tajNumber("123456789")
                .companyName("Test Company")
                .startDate(LocalDate.now())
                .build();
        testEmployee = employeeRepository.save(testEmployee);
    }

    private User createUser(String email, String firstName, String lastName, Role role) {
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode("password"))
                .firstName(firstName)
                .lastName(lastName)
                .role(role)
                .isActive(true)
                .build();
        return userRepository.save(user);
    }

    @Test
    void getAllEmployees_ShouldReturn200_WhenAuthenticatedAsAdmin() throws Exception {
        mockMvc.perform(get("/employees")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].email").value("employee@example.com"));
    }

    @Test
    void getAllEmployees_ShouldReturn200_WhenAuthenticatedAsHR() throws Exception {
        mockMvc.perform(get("/employees")
                        .header("Authorization", "Bearer " + hrToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void getAllEmployees_ShouldReturn403_WhenAuthenticatedAsEmployee() throws Exception {
        mockMvc.perform(get("/employees")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllEmployees_ShouldReturn401_WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/employees"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAllEmployees_ShouldReturn401_WhenTokenIsInvalid() throws Exception {
        mockMvc.perform(get("/employees")
                        .header("Authorization", "Bearer invalid_token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getEmployeeById_ShouldReturn200_WhenAuthenticatedAsAdmin() throws Exception {
        mockMvc.perform(get("/employees/" + testEmployee.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("employee@example.com"))
                .andExpect(jsonPath("$.taxId").value("1234567890"));
    }

    @Test
    void getEmployeeById_ShouldReturn404_WhenEmployeeNotFound() throws Exception {
        mockMvc.perform(get("/employees/999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void getEmployeeById_ShouldReturn403_WhenEmployeeTriesToAccessById() throws Exception {
        // Employees should use /employees/me instead
        mockMvc.perform(get("/employees/" + testEmployee.getId())
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getMyEmployeeData_ShouldReturn200_WhenEmployeeAccessesOwnDataViaMeEndpoint() throws Exception {
        mockMvc.perform(get("/employees/me")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("employee@example.com"))
                .andExpect(jsonPath("$.taxId").value("1234567890"))
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.lastName").value("Doe"));
    }

    @Test
    void getAllEmployees_WithSearchFilter_ShouldReturnFilteredResults() throws Exception {
        mockMvc.perform(get("/employees")
                        .param("search", "John")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].firstName").value("John"));
    }

    @Test
    void getAllEmployees_WithSearchFilter_ShouldReturnEmpty_WhenNoMatch() throws Exception {
        mockMvc.perform(get("/employees")
                        .param("search", "NonExistent")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}

