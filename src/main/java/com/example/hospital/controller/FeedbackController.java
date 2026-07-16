package com.example.hospital.controller;

import com.example.hospital.model.Feedback;
import com.example.hospital.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "*")
public class FeedbackController {

    @Autowired private FeedbackRepository feedbackRepository;

    @GetMapping public List<Feedback> getAll() { return feedbackRepository.findAll(); }

    @PostMapping
    public Feedback create(@RequestBody Feedback feedback) {
        feedback.setSubmittedAt(LocalDateTime.now());
        if (feedback.getResolved() == null) feedback.setResolved(false);
        return feedbackRepository.save(feedback);
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<Feedback> resolve(@PathVariable Long id) {
        return feedbackRepository.findById(id).map(f -> {
            f.setResolved(true);
            return ResponseEntity.ok(feedbackRepository.save(f));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return feedbackRepository.findById(id).map(f -> {
            feedbackRepository.delete(f);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
