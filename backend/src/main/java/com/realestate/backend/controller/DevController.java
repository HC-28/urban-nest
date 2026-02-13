package com.realestate.backend.controller;

import com.realestate.backend.entity.Property;
import com.realestate.backend.entity.User;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/dev")
public class DevController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    // Creates a sample agent (if not present) and a sample property, returns public properties
    @PostMapping("/create-sample-property")
    public ResponseEntity<?> createSampleProperty() {
        // find or create agent
        Optional<User> opt = userRepository.findByEmail("agent@gmail.com");
        User agent;
        if (opt.isPresent()) {
            agent = opt.get();
        } else {
            agent = new User();
            agent.setName("agentDEV");
            agent.setEmail("agent@gmail.com");
            agent.setPassword("agent");
            agent.setRole("AGENT");
            agent = userRepository.save(agent);
        }

        Property p = new Property();
        p.setTitle("Dev Sample Apartment");
        p.setType("Apartment");
        p.setPrice(99999.0);
        p.setArea(1200.0);
        p.setBhk(2);
        p.setAgentId(agent.getId());
        p.setAgentName(agent.getName());
        p.setAgentEmail(agent.getEmail());
        p.setListed(true);
        p.setDeleted(false);

        propertyRepository.save(p);

        List<Property> publicProps = propertyRepository.findPublicProperties();
        return ResponseEntity.ok(publicProps);
    }
}
