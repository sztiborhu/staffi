package hu.sztibor.staffi.backend.repositories;

import hu.sztibor.staffi.backend.entities.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    List<Contract> findByEmployeeId(Long employeeId);

    Contract findByContractNumber(String contractNumber);
}

