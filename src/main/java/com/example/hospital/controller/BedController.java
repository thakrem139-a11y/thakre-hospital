package com.example.hospital.controller;

import com.example.hospital.model.Bed;
import com.example.hospital.model.Bill;
import com.example.hospital.model.Patient;
import com.example.hospital.repository.BedRepository;
import com.example.hospital.repository.BillRepository;
import com.example.hospital.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/beds")
@CrossOrigin(origins = "*")
public class BedController {

    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private BillRepository billRepository;

    @GetMapping
    public List<Bed> getAllBeds() {
        return bedRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bed> getBedById(@PathVariable Long id) {
        return bedRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Bed createBed(@RequestBody Bed bed) {
        if (bed.getStatus() == null) bed.setStatus("AVAILABLE");
        return bedRepository.save(bed);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Bed> updateBed(@PathVariable Long id, @RequestBody Bed bedDetails) {
        return bedRepository.findById(id)
                .map(bed -> {
                    bed.setBedNumber(bedDetails.getBedNumber());
                    bed.setRoomType(bedDetails.getRoomType());
                    bed.setStatus(bedDetails.getStatus());
                    bed.setPricePerDay(bedDetails.getPricePerDay());
                    if ("AVAILABLE".equals(bedDetails.getStatus()) || "MAINTENANCE".equals(bedDetails.getStatus())) {
                        bed.setPatient(null);
                    } else if (bedDetails.getPatient() != null) {
                        bed.setPatient(bedDetails.getPatient());
                    }
                    return ResponseEntity.ok(bedRepository.save(bed));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBed(@PathVariable Long id) {
        return bedRepository.findById(id)
                .map(bed -> {
                    bedRepository.delete(bed);
                    return ResponseEntity.ok().<Void>build();
                }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/assign")
    @Transactional
    public ResponseEntity<Bed> assignPatient(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        Long patientId = payload.get("patientId");
        if (patientId == null) {
            return ResponseEntity.badRequest().build();
        }

        return bedRepository.findById(id)
                .flatMap(bed -> patientRepository.findById(patientId).map(patient -> {
                    bed.setPatient(patient);
                    bed.setStatus("OCCUPIED");
                    return ResponseEntity.ok(bedRepository.save(bed));
                })).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/discharge")
    @Transactional
    public ResponseEntity<Map<String, Object>> dischargePatient(@PathVariable Long id, @RequestBody Map<String, Integer> payload) {
        Integer days = payload.get("days");
        if (days == null || days <= 0) {
            days = 1; // Default stay is 1 day
        }

        final int stayDays = days;

        return bedRepository.findById(id)
                .map(bed -> {
                    Patient patient = bed.getPatient();
                    if (patient == null) {
                        return ResponseEntity.badRequest().<Map<String, Object>>build();
                    }

                    // Calculate invoice amount
                    double rate = bed.getPricePerDay();
                    double totalAmount = rate * stayDays;

                    // Generate a Bill Invoice in database
                    Bill invoice = new Bill();
                    invoice.setPatient(patient);
                    invoice.setAmount(totalAmount);
                    invoice.setServices("Bed Charge: " + bed.getRoomType() + " (" + bed.getBedNumber() + ") for " + stayDays + " days");
                    invoice.setStatus("UNPAID");
                    invoice.setBillingDate(LocalDate.now());
                    billRepository.save(invoice);

                    // Clear bed patient assignment
                    bed.setPatient(null);
                    bed.setStatus("AVAILABLE");
                    bedRepository.save(bed);

                    // Return stay diagnostics
                    Map<String, Object> result = new java.util.HashMap<>();
                    result.put("success", true);
                    result.put("bedNumber", bed.getBedNumber());
                    result.put("patientName", patient.getName());
                    result.put("totalAmount", totalAmount);
                    result.put("days", stayDays);
                    return ResponseEntity.ok(result);
                }).orElse(ResponseEntity.notFound().build());
    }
}
