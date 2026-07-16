package com.example.hospital.controller;

import com.example.hospital.model.LabTest;
import com.example.hospital.repository.LabTestRepository;
import com.example.hospital.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/labtests")
@CrossOrigin(origins = "*")
public class LabTestController {

    @Autowired private LabTestRepository labTestRepository;
    @Autowired private PatientRepository patientRepository;

    @GetMapping
    public List<LabTest> getAll(@RequestParam(required = false) Long patientId,
                                 @RequestParam(required = false) String status) {
        if (patientId != null) return labTestRepository.findByPatientId(patientId);
        if (status != null && !status.isEmpty()) return labTestRepository.findByStatus(status.toUpperCase());
        return labTestRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LabTest> getById(@PathVariable Long id) {
        return labTestRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<LabTest> create(@RequestBody LabTest labTest) {
        if (labTest.getBookingDate() == null) labTest.setBookingDate(LocalDate.now());
        if (labTest.getStatus() == null) labTest.setStatus("BOOKED");
        return ResponseEntity.ok(labTestRepository.save(labTest));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LabTest> update(@PathVariable Long id, @RequestBody LabTest details) {
        return labTestRepository.findById(id).map(t -> {
            if (details.getTestName() != null) t.setTestName(details.getTestName());
            if (details.getTestType() != null) t.setTestType(details.getTestType());
            if (details.getStatus() != null) {
                t.setStatus(details.getStatus());
                if ("SAMPLE_COLLECTED".equals(details.getStatus()) && t.getSampleDate() == null)
                    t.setSampleDate(LocalDate.now());
                if ("COMPLETED".equals(details.getStatus()) && t.getReportDate() == null)
                    t.setReportDate(LocalDate.now());
            }
            if (details.getResult() != null) t.setResult(details.getResult());
            if (details.getNotes() != null) t.setNotes(details.getNotes());
            if (details.getCost() != null) t.setCost(details.getCost());
            return ResponseEntity.ok(labTestRepository.save(t));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return labTestRepository.findById(id).map(t -> {
            labTestRepository.delete(t);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
