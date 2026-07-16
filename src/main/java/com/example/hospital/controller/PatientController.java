package com.example.hospital.controller;

import com.example.hospital.model.Patient;
import com.example.hospital.repository.PatientRepository;
import com.example.hospital.repository.AppointmentRepository;
import com.example.hospital.repository.BillRepository;
import com.example.hospital.repository.BedRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private BedRepository bedRepository;

    @GetMapping
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        return patientRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Patient createPatient(@RequestBody Patient patient) {
        return patientRepository.save(patient);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Patient> updatePatient(@PathVariable Long id, @RequestBody Patient patientDetails) {
        return patientRepository.findById(id)
                .map(patient -> {
                    patient.setName(patientDetails.getName());
                    patient.setAge(patientDetails.getAge());
                    patient.setGender(patientDetails.getGender());
                    patient.setContactNumber(patientDetails.getContactNumber());
                    patient.setEmail(patientDetails.getEmail());
                    patient.setAddress(patientDetails.getAddress());
                    patient.setMedicalHistory(patientDetails.getMedicalHistory());
                    return ResponseEntity.ok(patientRepository.save(patient));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        return patientRepository.findById(id)
                .map(patient -> {
                    // Programmatic cascade delete for associated appointments
                    appointmentRepository.findAll().stream()
                            .filter(app -> app.getPatient() != null && app.getPatient().getId().equals(id))
                            .forEach(appointmentRepository::delete);

                    // Programmatic cascade delete for associated bills
                    billRepository.findAll().stream()
                            .filter(bill -> bill.getPatient() != null && bill.getPatient().getId().equals(id))
                            .forEach(billRepository::delete);

                    // Programmatic release of associated room/bed assignments
                    bedRepository.findAll().stream()
                            .filter(bed -> bed.getPatient() != null && bed.getPatient().getId().equals(id))
                            .forEach(bed -> {
                                bed.setPatient(null);
                                bed.setStatus("AVAILABLE");
                                bedRepository.save(bed);
                            });

                    patientRepository.delete(patient);
                    return ResponseEntity.ok().<Void>build();
                }).orElse(ResponseEntity.notFound().build());
    }
}
