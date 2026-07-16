package com.example.hospital.controller;

import com.example.hospital.model.Attendance;
import com.example.hospital.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    @Autowired private AttendanceRepository attendanceRepository;

    @GetMapping
    public List<Attendance> getAll(@RequestParam(required = false) Long staffId,
                                    @RequestParam(required = false) String date) {
        if (staffId != null) return attendanceRepository.findByStaffId(staffId);
        if (date != null) return attendanceRepository.findByDate(LocalDate.parse(date));
        return attendanceRepository.findAll();
    }

    @PostMapping
    public Attendance create(@RequestBody Attendance attendance) {
        if (attendance.getDate() == null) attendance.setDate(LocalDate.now());
        return attendanceRepository.save(attendance);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Attendance> update(@PathVariable Long id, @RequestBody Attendance details) {
        return attendanceRepository.findById(id).map(a -> {
            if (details.getCheckIn() != null) a.setCheckIn(details.getCheckIn());
            if (details.getCheckOut() != null) a.setCheckOut(details.getCheckOut());
            if (details.getStatus() != null) a.setStatus(details.getStatus());
            if (details.getNotes() != null) a.setNotes(details.getNotes());
            return ResponseEntity.ok(attendanceRepository.save(a));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return attendanceRepository.findById(id).map(a -> {
            attendanceRepository.delete(a);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
