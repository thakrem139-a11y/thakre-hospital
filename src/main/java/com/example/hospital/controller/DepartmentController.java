package com.example.hospital.controller;

import com.example.hospital.model.Department;
import com.example.hospital.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin(origins = "*")
public class DepartmentController {

    @Autowired private DepartmentRepository departmentRepository;

    @GetMapping public List<Department> getAll() { return departmentRepository.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Department> getById(@PathVariable Long id) {
        return departmentRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Department create(@RequestBody Department dept) { return departmentRepository.save(dept); }

    @PutMapping("/{id}")
    public ResponseEntity<Department> update(@PathVariable Long id, @RequestBody Department details) {
        return departmentRepository.findById(id).map(d -> {
            d.setName(details.getName()); d.setHead(details.getHead());
            d.setLocation(details.getLocation()); d.setPhone(details.getPhone());
            d.setDescription(details.getDescription()); d.setTotalBeds(details.getTotalBeds());
            d.setTotalStaff(details.getTotalStaff()); d.setStatus(details.getStatus());
            d.setOperatingHours(details.getOperatingHours());
            return ResponseEntity.ok(departmentRepository.save(d));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return departmentRepository.findById(id).map(d -> {
            departmentRepository.delete(d);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
