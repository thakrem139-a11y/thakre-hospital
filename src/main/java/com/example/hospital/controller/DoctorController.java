package com.example.hospital.controller;

import com.example.hospital.model.Doctor;
import com.example.hospital.repository.DoctorRepository;
import com.example.hospital.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "*")
public class DoctorController {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @GetMapping
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Doctor> getDoctorById(@PathVariable Long id) {
        return doctorRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Doctor createDoctor(@RequestBody Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Doctor> updateDoctor(@PathVariable Long id, @RequestBody Doctor doctorDetails) {
        return doctorRepository.findById(id)
                .map(doctor -> {
                    doctor.setName(doctorDetails.getName());
                    doctor.setSpecialization(doctorDetails.getSpecialization());
                    doctor.setDepartment(doctorDetails.getDepartment());
                    doctor.setContactNumber(doctorDetails.getContactNumber());
                    doctor.setEmail(doctorDetails.getEmail());
                    doctor.setAvailability(doctorDetails.getAvailability());
                    doctor.setGender(doctorDetails.getGender());
                    if (doctorDetails.getPhotoBase64() != null) {
                        doctor.setPhotoBase64(doctorDetails.getPhotoBase64());
                    }
                    return ResponseEntity.ok(doctorRepository.save(doctor));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteDoctor(@PathVariable Long id) {
        return doctorRepository.findById(id)
                .map(doctor -> {
                    // Programmatic cascade delete for associated appointments
                    appointmentRepository.findAll().stream()
                            .filter(app -> app.getDoctor() != null && app.getDoctor().getId().equals(id))
                            .forEach(appointmentRepository::delete);

                    doctorRepository.delete(doctor);
                    return ResponseEntity.ok().<Void>build();
                }).orElse(ResponseEntity.notFound().build());
    }
}
