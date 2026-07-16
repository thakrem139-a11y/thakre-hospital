package com.example.hospital.repository;
import com.example.hospital.model.LabTest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface LabTestRepository extends JpaRepository<LabTest, Long> {
    List<LabTest> findByPatientId(Long patientId);
    List<LabTest> findByStatus(String status);
    List<LabTest> findByTestType(String testType);
}
