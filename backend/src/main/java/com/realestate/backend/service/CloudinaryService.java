package com.realestate.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    @Value("${CLOUDINARY_FOLDER:urban-nest}")
    private String folderName;

    /**
     * Uploads a file to Cloudinary.
     * @param file The file to upload.
     * @return The secure URL of the uploaded image.
     * @throws IOException If upload fails.
     */
    public String uploadFile(MultipartFile file) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "folder", folderName,
                        "resource_type", "auto"
                ));
        return (String) uploadResult.get("secure_url");
    }

    /**
     * Uploads a file by its bytes (used for seeding or programmatic uploads).
     * @param bytes The bytes of the file.
     * @param fileName The name for the file.
     * @return The secure URL.
     * @throws IOException If upload fails.
     */
    public String uploadBytes(byte[] bytes, String fileName) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(bytes,
                ObjectUtils.asMap(
                        "folder", folderName,
                        "public_id", fileName,
                        "resource_type", "auto"
                ));
        return (String) uploadResult.get("secure_url");
    }

    /**
     * Deletes a file from Cloudinary by its secure URL.
     * Note: This requires extracting the public ID from the URL.
     * @param url The secure URL.
     * @throws IOException If deletion fails.
     */
    public void deleteFileByUrl(String url) throws IOException {
        if (url == null || !url.contains("cloudinary.com")) return;
        
        // Extract public ID: everything between the folder and the file extension
        String publicId = extractPublicId(url);
        if (publicId != null) {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        }
    }

    private String extractPublicId(String url) {
        try {
            // Very simple extraction logic — in production, use a more robust regex
            String folderPart = folderName + "/";
            int start = url.indexOf(folderPart);
            if (start == -1) return null;
            
            int end = url.lastIndexOf(".");
            if (end <= start) return null;
            
            return url.substring(start, end);
        } catch (Exception e) {
            return null;
        }
    }
}
