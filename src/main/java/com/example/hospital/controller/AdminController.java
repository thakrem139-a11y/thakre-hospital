package com.example.hospital.controller;

import com.example.hospital.config.DataInitializer;
import com.example.hospital.repository.AppointmentRepository;
import com.example.hospital.repository.BillRepository;
import com.example.hospital.repository.DoctorRepository;
import com.example.hospital.repository.PatientRepository;
import com.example.hospital.repository.BedRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private DataInitializer dataInitializer;

    @Autowired
    private BedRepository bedRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("patientsCount", patientRepository.count());
        stats.put("doctorsCount", doctorRepository.count());
        stats.put("appointmentsCount", appointmentRepository.count());
        stats.put("billsCount", billRepository.count());
        stats.put("bedsCount", bedRepository.count());
        stats.put("dbType", "H2 In-Memory SQL");
        stats.put("status", "Connected");
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/reset")
    @Transactional
    public ResponseEntity<Void> resetDatabase() {
        appointmentRepository.deleteAll();
        billRepository.deleteAll();
        bedRepository.deleteAll();
        patientRepository.deleteAll();
        doctorRepository.deleteAll();
        
        try {
            dataInitializer.run();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/clear")
    @Transactional
    public ResponseEntity<Void> clearDatabase() {
        appointmentRepository.deleteAll();
        billRepository.deleteAll();
        bedRepository.deleteAll();
        patientRepository.deleteAll();
        doctorRepository.deleteAll();
        return ResponseEntity.ok().build();
    }
}
