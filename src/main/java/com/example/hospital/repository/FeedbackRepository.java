package com.example.hospital.repository;
import com.example.hospital.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByCategory(String category);
}
