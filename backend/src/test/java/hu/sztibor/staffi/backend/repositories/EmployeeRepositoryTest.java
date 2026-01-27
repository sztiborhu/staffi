package hu.sztibor.staffi.backend.repositories;

import hu.sztibor.staffi.backend.entities.Employee;
import hu.sztibor.staffi.backend.entities.User;
import hu.sztibor.staffi.backend.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository layer tests for EmployeeRepository
 * Uses @DataJpaTest which provides an in-memory database
 */
@DataJpaTest
@ActiveProfiles("test")
class EmployeeRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private Employee testEmployee;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = User.builder()
                .email("test@example.com")
                .password("hashedPassword123")
                .firstName("Test")
                .lastName("User")
                .role(Role.EMPLOYEE)
                .isActive(true)
                .build();
        testUser = entityManager.persist(testUser);

        // Create test employee
        testEmployee = Employee.builder()
                .user(testUser)
                .taxId("1234567890")
                .tajNumber("123456789")
                .idCardNumber("AB123456")
                .primaryAddress("Test Address 123")
                .phoneNumber("+36301234567")
                .nationality("Hungarian")
                .birthDate(LocalDate.of(1990, 1, 1))
                .companyName("Test Company")
                .startDate(LocalDate.now())
                .build();
        testEmployee = entityManager.persist(testEmployee);

        entityManager.flush();
    }

    @Test
    void findByUserId_ShouldReturnEmployee_WhenUserExists() {
        // When
        Optional<Employee> found = employeeRepository.findByUserId(testUser.getId());

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getUser().getEmail()).isEqualTo("test@example.com");
        assertThat(found.get().getTaxId()).isEqualTo("1234567890");
    }

    @Test
    void findByUserId_ShouldReturnEmpty_WhenUserDoesNotExist() {
        // When
        Optional<Employee> found = employeeRepository.findByUserId(999L);

        // Then
        assertThat(found).isEmpty();
    }

    @Test
    void findByTaxId_ShouldReturnEmployee_WhenTaxIdExists() {
        // When
        Optional<Employee> found = employeeRepository.findByTaxId("1234567890");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getUser().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void findByTaxId_ShouldReturnEmpty_WhenTaxIdDoesNotExist() {
        // When
        Optional<Employee> found = employeeRepository.findByTaxId("9999999999");

        // Then
        assertThat(found).isEmpty();
    }

    @Test
    void findByTajNumber_ShouldReturnEmployee_WhenTajNumberExists() {
        // When
        Optional<Employee> found = employeeRepository.findByTajNumber("123456789");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getUser().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void findByIdCardNumber_ShouldReturnEmployee_WhenIdCardExists() {
        // When
        Optional<Employee> found = employeeRepository.findByIdCardNumber("AB123456");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getUser().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void save_ShouldPersistEmployee() {
        // Given
        User newUser = User.builder()
                .email("new@example.com")
                .password("password")
                .firstName("New")
                .lastName("Employee")
                .role(Role.EMPLOYEE)
                .isActive(true)
                .build();
        newUser = entityManager.persist(newUser);

        Employee newEmployee = Employee.builder()
                .user(newUser)
                .taxId("9876543210")
                .tajNumber("987654321")
                .companyName("New Company")
                .startDate(LocalDate.now())
                .build();

        // When
        Employee saved = employeeRepository.save(newEmployee);

        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getUser().getEmail()).isEqualTo("new@example.com");
        assertThat(saved.getTaxId()).isEqualTo("9876543210");
    }
}

