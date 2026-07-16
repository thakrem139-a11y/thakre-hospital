package com.example.hospital.repository;

import com.example.hospital.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    java.util.List<Bill> findByPatientId(Long patientId);
}
