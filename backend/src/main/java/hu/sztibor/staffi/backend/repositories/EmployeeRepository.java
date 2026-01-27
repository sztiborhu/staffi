package hu.sztibor.staffi.backend.repositories;

import hu.sztibor.staffi.backend.entities.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    Optional<Employee> findByUserId(Long userId);

    Optional<Employee> findByTaxId(String taxId);

    Optional<Employee> findByTajNumber(String tajNumber);

    Optional<Employee> findByIdCardNumber(String idCardNumber);
}

