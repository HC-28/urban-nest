package com.realestate.backend.config;

import com.realestate.backend.entity.AppUser;
import com.realestate.backend.entity.Property;
import com.realestate.backend.repository.PropertyRepository;
import com.realestate.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.util.Optional;

@Configuration
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        // Only seed if no properties exist
        if (propertyRepository.count() == 1) {
            // If there's only that one dummy property, let's mark it as featured
            propertyRepository.findAll().forEach(p -> {
                if (!p.isFeatured()) {
                    p.setFeatured(true);
                    propertyRepository.save(p);
                }
            });
        }

        if (propertyRepository.count() == 0) {
            System.out.println("Seeding initial featured properties for Urban Nest...");

            // Ensure we have an agent to assign properties to
            Optional<AppUser> adminOpt = userRepository.findByEmail("admin@urbannest.com");
            Long agentId = 1L;
            if (adminOpt.isPresent()) {
                agentId = adminOpt.get().getId();
            }

            Property p1 = new Property();
            p1.setTitle("Modern Penthouse with City View");
            p1.setDescription("A stunning 3BHK penthouse with floor-to-ceiling windows and a private terrace.");
            p1.setPrice(15000000);
            p1.setArea(2200);
            p1.setBhk(3);
            p1.setCity("Mumbai");
            p1.setLocation("Worli");
            p1.setPinCode("400018");
            p1.setPurpose("Sale");
            p1.setType("Penthouse");
            p1.setActive(true);
            p1.setFeatured(true);
            p1.setAgentId(agentId);
            p1.setAmenities("Pool, Gym, Parking, Security, WiFi");
            propertyRepository.save(p1);

            Property p2 = new Property();
            p2.setTitle("Luxury Villa in Indiranagar");
            p2.setDescription("Spacious 4BHK villa with a private garden and high-end interiors.");
            p2.setPrice(35000000);
            p2.setArea(3500);
            p2.setBhk(4);
            p2.setCity("Bangalore");
            p2.setLocation("Indiranagar");
            p2.setPinCode("560038");
            p2.setPurpose("Sale");
            p2.setType("Villa");
            p2.setActive(true);
            p2.setFeatured(true);
            p2.setAgentId(agentId);
            p2.setAmenities("Garden, Gym, Security, Balcony");
            propertyRepository.save(p2);

            System.out.println("Seeding complete. Home page should now show featured properties.");
        }

        // Add specific admin user requested by the user
        String targetEmail = "devvaghasiya8047@gmail.com";
        if (userRepository.findByEmail(targetEmail).isEmpty()) {
            System.out.println("Creating requested admin user: " + targetEmail);
            AppUser devAdmin = new AppUser();
            devAdmin.setName("Dev Vaghasiya");
            devAdmin.setEmail(targetEmail);
            devAdmin.setPassword("dev"); // Fallback plain text works, will hash on login
            devAdmin.setRole("ADMIN");
            devAdmin.setVerified(true);
            devAdmin.setEmailVerified(true);
            userRepository.save(devAdmin);
            System.out.println("Admin user created successfully.");
        }
    }
}
