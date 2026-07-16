package com.example.hospital.controller;

import com.example.hospital.model.Staff;
import com.example.hospital.repository.StaffRepository;
import com.example.hospital.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "*")
public class StaffController {

    @Autowired private StaffRepository staffRepository;
    @Autowired private AttendanceRepository attendanceRepository;

    @GetMapping
    public List<Staff> getAll(@RequestParam(required = false) String role) {
        if (role != null && !role.isEmpty()) return staffRepository.findByRole(role.toUpperCase());
        return staffRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Staff> getById(@PathVariable Long id) {
        return staffRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Staff create(@RequestBody Staff staff) {
        return staffRepository.save(staff);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Staff> update(@PathVariable Long id, @RequestBody Staff details) {
        return staffRepository.findById(id).map(s -> {
            s.setName(details.getName()); s.setRole(details.getRole());
            s.setDepartment(details.getDepartment()); s.setPhone(details.getPhone());
            s.setEmail(details.getEmail()); s.setSalary(details.getSalary());
            s.setStatus(details.getStatus()); s.setShift(details.getShift());
            s.setQualification(details.getQualification());
            return ResponseEntity.ok(staffRepository.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return staffRepository.findById(id).map(s -> {
            attendanceRepository.findByStaffId(id).forEach(attendanceRepository::delete);
            staffRepository.delete(s);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", staffRepository.count());
        stats.put("nurses", staffRepository.findByRole("NURSE").size());
        stats.put("receptionists", staffRepository.findByRole("RECEPTIONIST").size());
        stats.put("admin", staffRepository.findByRole("ADMIN").size());
        stats.put("active", staffRepository.findByStatus("ACTIVE").size());
        return stats;
    }
}
